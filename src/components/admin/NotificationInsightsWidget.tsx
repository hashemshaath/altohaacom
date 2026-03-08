import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Bell, Send, Eye, AlertTriangle, Zap, Mail, Smartphone, MessageSquare } from "lucide-react";
import { format, subDays } from "date-fns";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export function NotificationInsightsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["notif-insights-widget"],
    queryFn: async () => {
      const [notifsRes, queueRes, rulesRes] = await Promise.all([
        supabase.from("notifications").select("id, type, status, channel, created_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("notification_queue").select("id, status, channel, error_message, created_at").limit(500),
        supabase.from("notification_rules").select("id, is_active"),
      ]);

      const notifs = notifsRes.data || [];
      const queue = queueRes.data || [];
      const rules = rulesRes.data || [];

      // Volume trend (7 days)
      const volTrend: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "MM/dd");
        volTrend[d] = 0;
      }
      notifs.forEach(n => {
        const d = format(new Date(n.created_at), "MM/dd");
        if (d in volTrend) volTrend[d]++;
      });
      const trendData = Object.entries(volTrend).map(([date, count]) => ({ date, count }));

      // Channel distribution
      const channelDist: Record<string, number> = {};
      notifs.forEach(n => { const ch = n.channel || "in_app"; channelDist[ch] = (channelDist[ch] || 0) + 1; });
      const channelData = Object.entries(channelDist).map(([name, value]) => ({ name, value }));

      // Read rate
      const sent = notifs.filter(n => n.status === "sent").length;
      const read = notifs.filter(n => n.status === "read").length;
      const readRate = (sent + read) > 0 ? Math.round((read / (sent + read)) * 100) : 0;

      // Queue health
      const qPending = queue.filter(q => q.status === "pending").length;
      const qSent = queue.filter(q => q.status === "sent").length;
      const qFailed = queue.filter(q => q.status === "failed").length;
      const deliveryRate = queue.length > 0 ? Math.round((qSent / queue.length) * 100) : 100;

      // Top failure reasons
      const failReasons: Record<string, number> = {};
      queue.filter(q => q.status === "failed").forEach(q => {
        const reason = (q as any).error_message?.substring(0, 30) || "Unknown";
        failReasons[reason] = (failReasons[reason] || 0) + 1;
      });

      // Active rules
      const activeRules = rules.filter(r => r.is_active).length;

      return {
        total: notifs.length, sent, read, readRate,
        qPending, qSent, qFailed, deliveryRate,
        channelData, trendData, failReasons,
        activeRules, totalRules: rules.length,
      };
    },
    staleTime: 1000 * 60 * 2,
  });

  if (!data) return null;

  const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

  const channelIcons: Record<string, any> = { in_app: Bell, email: Mail, sms: Smartphone, push: MessageSquare };

  const kpis = [
    { icon: Send, label: isAr ? "الإشعارات المرسلة" : "Total Sent", value: data.total, color: "text-primary" },
    { icon: Eye, label: isAr ? "معدل القراءة" : "Read Rate", value: `${data.readRate}%`, color: "text-chart-2" },
    { icon: Zap, label: isAr ? "معدل التسليم" : "Delivery Rate", value: `${data.deliveryRate}%`, color: "text-chart-5" },
    { icon: AlertTriangle, label: isAr ? "فشل التسليم" : "Failed Queue", value: data.qFailed, color: "text-destructive" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi, i) => (
        <Card key={i} className="border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
            </div>
            <AnimatedCounter value={typeof kpi.value === "number" ? kpi.value : parseInt(String(kpi.value)) || 0} className="text-2xl" />
          </CardContent>
        </Card>
      ))}

      {/* Volume Trend */}
      <Card className="md:col-span-2 border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{isAr ? "حجم الإشعارات (7 أيام)" : "Notification Volume (7d)"}</CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.trendData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Channel Distribution */}
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{isAr ? "توزيع القنوات" : "Channel Distribution"}</CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.channelData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} innerRadius={25}>
                  {data.channelData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1 mt-2">
            {data.channelData.map((ch, i) => {
              const Icon = channelIcons[ch.name] || Bell;
              return (
                <div key={ch.name} className="flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1"><Icon className="h-3 w-3" />{ch.name}</span>
                  <Badge variant="secondary" className="text-[9px]">{ch.value}</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Queue Health + Rules */}
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{isAr ? "صحة الطابور" : "Queue Health"}</CardTitle>
        </CardHeader>
        <CardContent className="pb-3 space-y-3">
          <div className="space-y-2">
            {[
              { label: isAr ? "معلق" : "Pending", value: data.qPending, color: "bg-chart-4" },
              { label: isAr ? "مرسل" : "Sent", value: data.qSent, color: "bg-chart-2" },
              { label: isAr ? "فشل" : "Failed", value: data.qFailed, color: "bg-destructive" },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${item.color}`} />
                  {item.label}
                </span>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-border/40">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>{isAr ? "القواعد النشطة" : "Active Rules"}</span>
              <span>{data.activeRules}/{data.totalRules}</span>
            </div>
            <Progress value={data.totalRules > 0 ? (data.activeRules / data.totalRules) * 100 : 0} className="h-1.5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
