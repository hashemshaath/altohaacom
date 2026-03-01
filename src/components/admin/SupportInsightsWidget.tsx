import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Ticket, Headphones, MessageSquare, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, subDays } from "date-fns";

export function SupportInsightsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-support-insights"],
    queryFn: async () => {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();

      const [ticketsRes, openTicketsRes, chatSessionsRes, activeChatRes, recentTicketsRes, templatesRes] = await Promise.all([
        supabase.from("support_tickets").select("id, status, priority, created_at"),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
        supabase.from("chat_sessions").select("id", { count: "exact", head: true }),
        supabase.from("chat_sessions").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("support_tickets").select("created_at, status").gte("created_at", sevenDaysAgo),
        supabase.from("communication_templates").select("id", { count: "exact", head: true }),
      ]);

      const tickets = ticketsRes.data || [];
      const priorityMap: Record<string, number> = {};
      const statusMap: Record<string, number> = {};
      tickets.forEach((t: any) => {
        priorityMap[t.priority || "normal"] = (priorityMap[t.priority || "normal"] || 0) + 1;
        statusMap[t.status || "open"] = (statusMap[t.status || "open"] || 0) + 1;
      });

      // Weekly ticket trend
      const weeklyTrend: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        weeklyTrend[format(subDays(new Date(), i), "EEE")] = 0;
      }
      (recentTicketsRes.data || []).forEach((t: any) => {
        const key = format(new Date(t.created_at), "EEE");
        if (weeklyTrend[key] !== undefined) weeklyTrend[key]++;
      });
      const weeklyData = Object.entries(weeklyTrend).map(([day, count]) => ({ day, count }));

      const resolved = tickets.filter((t: any) => t.status === "resolved" || t.status === "closed").length;
      const resolutionRate = tickets.length > 0 ? Math.round((resolved / tickets.length) * 100) : 0;

      return {
        totalTickets: tickets.length,
        openTickets: openTicketsRes.count || 0,
        totalChats: chatSessionsRes.count || 0,
        activeChats: activeChatRes.count || 0,
        totalTemplates: templatesRes.count || 0,
        resolutionRate,
        priorityMap,
        statusMap,
        weeklyData,
        urgentCount: priorityMap["urgent"] || 0,
      };
    },
    staleTime: 1000 * 60 * 3,
  });

  if (isLoading) {
    return <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>;
  }

  if (!data) return null;

  const kpis = [
    { icon: Ticket, label: isAr ? "التذاكر" : "Tickets", value: data.totalTickets, color: "text-primary" },
    { icon: Clock, label: isAr ? "مفتوحة" : "Open", value: data.openTickets, color: "text-chart-4", urgent: data.openTickets > 10 },
    { icon: Headphones, label: isAr ? "دردشة مباشرة" : "Live Chats", value: `${data.activeChats}/${data.totalChats}`, color: "text-chart-2" },
    { icon: CheckCircle2, label: isAr ? "نسبة الحل" : "Resolution", value: `${data.resolutionRate}%`, color: "text-chart-2" },
    { icon: AlertTriangle, label: isAr ? "عاجلة" : "Urgent", value: data.urgentCount, color: "text-destructive", urgent: data.urgentCount > 0 },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Headphones className="h-4 w-4 text-chart-4" />
          {isAr ? "تحليلات الدعم والتواصل" : "Support & Communications Insights"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPI Row */}
        <div className="grid grid-cols-5 gap-2">
          {kpis.map((kpi, i) => (
            <div key={i} className={`text-center p-2 rounded-xl ${kpi.urgent ? "bg-destructive/5 ring-1 ring-destructive/20" : "bg-muted/40"}`}>
              <kpi.icon className={`h-4 w-4 mx-auto mb-1 ${kpi.color}`} />
              <p className="text-lg font-bold">{kpi.value}</p>
              <p className="text-[9px] text-muted-foreground">{kpi.label}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Weekly Ticket Trend */}
          <div>
            <p className="text-xs font-medium mb-2 text-muted-foreground flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {isAr ? "التذاكر هذا الأسبوع" : "This Week's Tickets"}
            </p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="day" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="count" fill="hsl(var(--chart-4))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status & Priority */}
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium mb-1.5 text-muted-foreground">{isAr ? "حالات التذاكر" : "Ticket Status"}</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(data.statusMap).map(([status, count]) => (
                  <Badge key={status} variant="outline" className="text-[10px]">
                    {status}: {count as number}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium mb-1.5 text-muted-foreground">{isAr ? "الأولوية" : "Priority"}</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(data.priorityMap).map(([priority, count]) => {
                  const pColor = priority === "urgent" ? "border-destructive/30 text-destructive" : priority === "high" ? "border-chart-4/30 text-chart-4" : "";
                  return (
                    <Badge key={priority} variant="outline" className={`text-[10px] ${pColor}`}>
                      {priority}: {count as number}
                    </Badge>
                  );
                })}
              </div>
            </div>
            {/* Resolution Rate Bar */}
            <div>
              <p className="text-xs font-medium mb-1 text-muted-foreground">{isAr ? "معدل الحل" : "Resolution Rate"}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-chart-2 transition-all"
                    style={{ width: `${data.resolutionRate}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-chart-2">{data.resolutionRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
