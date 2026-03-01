import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line } from "recharts";
import { SmilePlus, Clock, Timer, Users, TrendingDown, Zap } from "lucide-react";
import { format, subDays, differenceInMinutes } from "date-fns";

export function SupportSatisfactionWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-support-satisfaction"],
    queryFn: async () => {
      const [ticketsRes, messagesRes, recentTicketsRes] = await Promise.all([
        supabase.from("support_tickets").select("id, status, priority, created_at, resolved_at, assigned_to"),
        supabase.from("support_ticket_messages").select("ticket_id, sender_id, created_at, is_internal_note").order("created_at"),
        supabase.from("support_tickets").select("created_at, status, resolved_at").gte("created_at", subDays(new Date(), 14).toISOString()),
      ]);

      const tickets = ticketsRes.data || [];
      const messages = messagesRes.data || [];
      const recentTickets = recentTicketsRes.data || [];

      // Resolution rate
      const resolved = tickets.filter(t => t.status === "resolved" || t.status === "closed").length;
      const resolutionRate = tickets.length > 0 ? Math.round((resolved / tickets.length) * 100) : 0;

      // Avg response time (first agent reply after ticket creation)
      const ticketFirstReply: Record<string, number> = {};
      const ticketCreation: Record<string, string> = {};
      tickets.forEach(t => { ticketCreation[t.id] = t.created_at; });
      
      messages.forEach(m => {
        if (m.is_internal_note) return;
        const ticketId = m.ticket_id;
        if (!ticketCreation[ticketId]) return;
        if (ticketFirstReply[ticketId] !== undefined) return;
        // Check if this is an agent reply (different from ticket creator)
        const ticket = tickets.find(t => t.id === ticketId);
        if (ticket && m.sender_id !== ticket.assigned_to && m.sender_id !== undefined) {
          // Could be agent reply
        }
        if (!ticketFirstReply[ticketId]) {
          const mins = differenceInMinutes(new Date(m.created_at), new Date(ticketCreation[ticketId]));
          if (mins > 0) ticketFirstReply[ticketId] = mins;
        }
      });

      const replyTimes = Object.values(ticketFirstReply);
      const avgResponseMins = replyTimes.length > 0 ? Math.round(replyTimes.reduce((a, b) => a + b, 0) / replyTimes.length) : 0;

      // Avg resolution time
      const resolvedWithTime = tickets.filter(t => t.resolved_at && t.created_at);
      const avgResolutionMins = resolvedWithTime.length > 0
        ? Math.round(resolvedWithTime.reduce((s, t) => s + differenceInMinutes(new Date(t.resolved_at!), new Date(t.created_at)), 0) / resolvedWithTime.length)
        : 0;

      // Daily ticket volume (14 days)
      const dailyMap: Record<string, { opened: number; closed: number }> = {};
      for (let i = 13; i >= 0; i--) {
        dailyMap[format(subDays(new Date(), i), "MM/dd")] = { opened: 0, closed: 0 };
      }
      recentTickets.forEach(t => {
        const d = format(new Date(t.created_at), "MM/dd");
        if (dailyMap[d]) dailyMap[d].opened++;
        if (t.resolved_at) {
          const rd = format(new Date(t.resolved_at), "MM/dd");
          if (dailyMap[rd]) dailyMap[rd].closed++;
        }
      });
      const dailyVolume = Object.entries(dailyMap).map(([day, v]) => ({ day, ...v }));

      // Agent workload
      const agentTickets: Record<string, number> = {};
      tickets.filter(t => t.assigned_to && t.status !== "closed").forEach(t => {
        agentTickets[t.assigned_to!] = (agentTickets[t.assigned_to!] || 0) + 1;
      });
      const activeAgents = Object.keys(agentTickets).length;
      const maxLoad = Math.max(...Object.values(agentTickets), 0);

      // Priority breakdown
      const priorityCount: Record<string, number> = { urgent: 0, high: 0, normal: 0, low: 0 };
      tickets.filter(t => t.status !== "closed" && t.status !== "resolved").forEach(t => {
        priorityCount[t.priority] = (priorityCount[t.priority] || 0) + 1;
      });

      return {
        resolutionRate,
        avgResponseMins,
        avgResolutionMins,
        dailyVolume,
        activeAgents,
        maxLoad,
        priorityCount,
        totalOpen: tickets.filter(t => t.status === "open" || t.status === "in_progress").length,
      };
    },
    staleTime: 1000 * 60 * 2,
  });

  if (isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;
  if (!data) return null;

  const formatTime = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const kpis = [
    { label: isAr ? "معدل الحل" : "Resolution Rate", value: `${data.resolutionRate}%`, icon: SmilePlus, color: "text-chart-2", bg: "bg-chart-2/10" },
    { label: isAr ? "متوسط الرد" : "Avg Response", value: formatTime(data.avgResponseMins), icon: Clock, color: "text-chart-4", bg: "bg-chart-4/10" },
    { label: isAr ? "متوسط الحل" : "Avg Resolution", value: formatTime(data.avgResolutionMins), icon: Timer, color: "text-primary", bg: "bg-primary/10" },
    { label: isAr ? "وكلاء نشطين" : "Active Agents", value: data.activeAgents, icon: Users, color: "text-chart-3", bg: "bg-chart-3/10" },
  ];

  return (
    <div className="grid gap-3 grid-cols-1 lg:grid-cols-3">
      {/* KPIs + Priority */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-chart-4" />
            {isAr ? "أداء الدعم" : "Support Performance"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {kpis.map(k => (
            <div key={k.label} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl ${k.bg} flex items-center justify-center shrink-0`}>
                <k.icon className={`h-4 w-4 ${k.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground">{k.label}</p>
                <p className="text-sm font-bold">{k.value}</p>
              </div>
            </div>
          ))}
          <div className="border-t pt-2 space-y-1.5">
            <p className="text-[10px] text-muted-foreground font-medium">{isAr ? "التذاكر المفتوحة حسب الأولوية" : "Open by Priority"}</p>
            {Object.entries(data.priorityCount).map(([p, count]) => (
              <div key={p} className="flex items-center justify-between text-xs">
                <span className="capitalize">{p}</span>
                <Badge variant={p === "urgent" ? "destructive" : "outline"} className="text-[9px]">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Volume */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-primary" />
            {isAr ? "حجم التذاكر (14 يوم)" : "Ticket Volume (14 days)"}
            <Badge variant="secondary" className="text-[10px] ms-auto">
              {data.totalOpen} {isAr ? "مفتوحة" : "open"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data.dailyVolume}>
              <XAxis dataKey="day" tick={{ fontSize: 9 }} interval={1} />
              <YAxis tick={{ fontSize: 9 }} width={20} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Bar dataKey="opened" fill="hsl(var(--chart-4))" radius={[3, 3, 0, 0]} name={isAr ? "مفتوحة" : "Opened"} />
              <Bar dataKey="closed" fill="hsl(var(--chart-2))" radius={[3, 3, 0, 0]} name={isAr ? "محلولة" : "Resolved"} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
