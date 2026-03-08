import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Send, CheckCircle, XCircle, Clock, Mail, Smartphone, Megaphone, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";
import { format, subDays } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export const NotificationLiveStatsWidget = memo(function NotificationLiveStatsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["notificationLiveStats"],
    queryFn: async () => {
      const [notifRes, rulesRes] = await Promise.all([
        supabase.from("notifications").select("id, type, is_read, channel, created_at").order("created_at", { ascending: false }).limit(1000),
        supabase.from("notification_rules").select("id, is_active, channels").limit(100),
      ]);

      const notifs = notifRes.data || [];
      const rules = rulesRes.data || [];

      const total = notifs.length;
      const readCount = notifs.filter(n => n.is_read).length;
      const readRate = total > 0 ? Math.round((readCount / total) * 100) : 0;
      const activeRules = rules.filter(r => r.is_active).length;

      // Type distribution
      const typeMap: Record<string, number> = {};
      notifs.forEach(n => { typeMap[n.type || "general"] = (typeMap[n.type || "general"] || 0) + 1; });
      const typeData = Object.entries(typeMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

      // 7-day trend
      const trend: Record<string, { sent: number; read: number }> = {};
      for (let i = 6; i >= 0; i--) {
        trend[format(subDays(new Date(), i), "MM/dd")] = { sent: 0, read: 0 };
      }
      notifs.forEach(n => {
        const d = format(new Date(n.created_at), "MM/dd");
        if (d in trend) {
          trend[d].sent++;
          if (n.is_read) trend[d].read++;
        }
      });
      const trendData = Object.entries(trend).map(([date, v]) => ({ date, ...v }));

      // Channel distribution
      const channelMap: Record<string, number> = {};
      notifs.forEach(n => { channelMap[n.channel || "in_app"] = (channelMap[n.channel || "in_app"] || 0) + 1; });
      const channelData = Object.entries(channelMap).map(([name, value]) => ({ name, value }));

      return { total, readCount, readRate, activeRules, typeData, trendData, channelData };
    },
    refetchInterval: 60000,
  });

  if (!data) return null;

  const stats = [
    { icon: Bell, label: isAr ? "إجمالي الإشعارات" : "Total Notifications", value: data.total, color: "text-primary" },
    { icon: CheckCircle, label: isAr ? "نسبة القراءة" : "Read Rate", value: `${data.readRate}%`, color: "text-chart-5" },
    { icon: Megaphone, label: isAr ? "قواعد نشطة" : "Active Rules", value: data.activeRules, color: "text-chart-3" },
    { icon: Send, label: isAr ? "مقروءة" : "Read", value: data.readCount, color: "text-chart-2" },
  ];

  const channelLabels: Record<string, { en: string; ar: string; icon: typeof Mail }> = {
    in_app: { en: "In-App", ar: "داخل التطبيق", icon: Bell },
    email: { en: "Email", ar: "بريد", icon: Mail },
    push: { en: "Push", ar: "إشعار فوري", icon: Smartphone },
    sms: { en: "SMS", ar: "رسالة نصية", icon: Smartphone },
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          {isAr ? "إحصائيات الإشعارات المباشرة" : "Notification Live Stats"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-muted/50 rounded-xl p-3 text-center">
              <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.color}`} />
              <div className="text-lg font-bold">{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              {isAr ? "نشاط الإشعارات - 7 أيام" : "Notification Activity - 7 Days"}
            </p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={data.trendData}>
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="sent" fill="hsl(var(--primary))" fillOpacity={0.7} radius={[3, 3, 0, 0]} name={isAr ? "مرسلة" : "Sent"} />
                <Bar dataKey="read" fill="hsl(var(--chart-5))" fillOpacity={0.7} radius={[3, 3, 0, 0]} name={isAr ? "مقروءة" : "Read"} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              {isAr ? "القنوات" : "Channels"}
            </p>
            {data.channelData.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={data.channelData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={3} dataKey="value">
                    {data.channelData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      value,
                      isAr ? channelLabels[name]?.ar || name : channelLabels[name]?.en || name,
                    ]}
                    contentStyle={{ fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[140px] flex items-center justify-center text-xs text-muted-foreground">
                {isAr ? "لا توجد بيانات" : "No data"}
              </div>
            )}
          </div>
        </div>

        {/* Top Notification Types */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {data.typeData.slice(0, 3).map((t, i) => (
            <div key={i} className="bg-muted/50 rounded-xl p-2 text-center">
              <div className="text-sm font-bold">{t.value}</div>
              <div className="text-[9px] text-muted-foreground truncate">{t.name}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
