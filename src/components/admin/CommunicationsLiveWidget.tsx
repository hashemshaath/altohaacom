import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Inbox, Mail, Clock, CheckCheck, TrendingUp, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { format, subDays, differenceInMinutes } from "date-fns";

export function CommunicationsLiveWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["communicationsLiveStats"],
    queryFn: async () => {
      const [commsRes, notifRes, templatesRes] = await Promise.all([
        supabase.from("company_communications").select("id, direction, priority, created_at, status").order("created_at", { ascending: false }).limit(500),
        supabase.from("notifications").select("id, type, is_read, channel, created_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("communication_templates").select("id, is_active"),
      ]);

      const comms = commsRes.data || [];
      const notifs = notifRes.data || [];
      const templates = templatesRes.data || [];

      const inbound = comms.filter(c => c.direction === "inbound").length;
      const outbound = comms.filter(c => c.direction === "outbound").length;
      const unread = comms.filter(c => c.status === "unread" && c.direction === "inbound").length;
      const readRate = comms.length > 0 ? Math.round((comms.filter(c => c.status !== "unread").length / comms.length) * 100) : 0;

      // 14-day trend
      const trend: Record<string, { inbound: number; outbound: number }> = {};
      for (let i = 13; i >= 0; i--) {
        trend[format(subDays(new Date(), i), "MM/dd")] = { inbound: 0, outbound: 0 };
      }
      comms.forEach(c => {
        const d = format(new Date(c.created_at), "MM/dd");
        if (d in trend) {
          if (c.direction === "inbound") trend[d].inbound++;
          else trend[d].outbound++;
        }
      });
      const trendData = Object.entries(trend).map(([date, v]) => ({ date, ...v }));

      // Notification channel distribution
      const channelMap: Record<string, number> = {};
      notifs.forEach(n => {
        const ch = n.channel || "in_app";
        channelMap[ch] = (channelMap[ch] || 0) + 1;
      });
      const channelData = Object.entries(channelMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

      // Template stats
      const activeTemplates = templates.filter(t => t.is_active).length;
      const totalUsage = templates.length;

      // Notification read rate
      const notifReadRate = notifs.length > 0 ? Math.round((notifs.filter(n => n.is_read).length / notifs.length) * 100) : 0;

      return {
        totalComms: comms.length,
        inbound, outbound, unread, readRate,
        totalNotifs: notifs.length,
        notifReadRate,
        activeTemplates,
        totalUsage,
        trendData,
        channelData,
      };
    },
    refetchInterval: 60000,
  });

  if (!data) return null;

  const stats = [
    { label: isAr ? "الرسائل" : "Messages", value: data.totalComms, icon: MessageSquare, color: "text-primary" },
    { label: isAr ? "غير مقروءة" : "Unread", value: data.unread, icon: Inbox, color: "text-destructive" },
    { label: isAr ? "معدل القراءة" : "Read Rate", value: `${data.readRate}%`, icon: CheckCheck, color: "text-chart-2" },
    { label: isAr ? "الإشعارات" : "Notifications", value: data.totalNotifs, icon: Mail, color: "text-chart-3" },
  ];

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          {isAr ? "إحصائيات التواصل والتسويق المباشرة" : "Communications & Marketing Live Stats"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-muted/50 rounded-lg p-3 text-center">
              <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.color}`} />
              <div className="text-lg font-bold">{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Message Trend */}
          <div className="md:col-span-2">
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              {isAr ? "حركة الرسائل - 14 يوم" : "Message Flow - 14 Days"}
            </p>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={data.trendData}>
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="inbound" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} name={isAr ? "واردة" : "Inbound"} />
                <Area type="monotone" dataKey="outbound" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" fillOpacity={0.2} name={isAr ? "صادرة" : "Outbound"} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Channel Distribution */}
          <div>
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              {isAr ? "قنوات الإشعارات" : "Notification Channels"}
            </p>
            {data.channelData.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={data.channelData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 9 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={50} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[140px] flex items-center justify-center text-xs text-muted-foreground">
                {isAr ? "لا توجد بيانات" : "No data"}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <Send className="h-3 w-3 mx-auto mb-1 text-chart-2" />
            <div className="text-sm font-bold">{data.outbound}</div>
            <div className="text-[9px] text-muted-foreground">{isAr ? "رسائل صادرة" : "Outbound"}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <BarChart3 className="h-3 w-3 mx-auto mb-1 text-chart-3" />
            <div className="text-sm font-bold">{data.activeTemplates}</div>
            <div className="text-[9px] text-muted-foreground">{isAr ? "قوالب نشطة" : "Active Templates"}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <TrendingUp className="h-3 w-3 mx-auto mb-1 text-chart-4" />
            <div className="text-sm font-bold">{data.notifReadRate}%</div>
            <div className="text-[9px] text-muted-foreground">{isAr ? "قراءة الإشعارات" : "Notif Read Rate"}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
