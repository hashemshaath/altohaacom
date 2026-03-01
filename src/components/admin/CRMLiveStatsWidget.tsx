import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Users, TrendingUp, UserCheck, Ticket, MessageSquare, Clock, CheckCircle2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, subDays, differenceInHours } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export function CRMLiveStatsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["crmLiveStats"],
    queryFn: async () => {
      const [ticketsRes, leadsRes, segmentsRes, commsRes] = await Promise.all([
        supabase.from("support_tickets").select("id, status, priority, created_at, resolved_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("leads").select("id, status, created_at, source").order("created_at", { ascending: false }).limit(500),
        supabase.from("audience_segments").select("id, is_active, estimated_reach"),
        supabase.from("company_communications").select("id, direction, created_at").order("created_at", { ascending: false }).limit(500),
      ]);

      const tickets = ticketsRes.data || [];
      const leads = leadsRes.data || [];
      const segments = segmentsRes.data || [];
      const comms = commsRes.data || [];

      // Ticket stats
      const openTickets = tickets.filter(t => t.status === "open" || t.status === "in_progress").length;
      const resolvedTickets = tickets.filter(t => t.status === "resolved" || t.status === "closed").length;
      const avgResolutionHrs = (() => {
        const resolved = tickets.filter(t => t.resolved_at);
        if (resolved.length === 0) return 0;
        const total = resolved.reduce((s, t) => s + differenceInHours(new Date(t.resolved_at!), new Date(t.created_at)), 0);
        return Math.round(total / resolved.length);
      })();

      // Lead conversion funnel
      const leadStatuses: Record<string, number> = {};
      leads.forEach(l => { leadStatuses[l.status || "new"] = (leadStatuses[l.status || "new"] || 0) + 1; });
      const leadFunnel = Object.entries(leadStatuses).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

      // 14-day lead trend
      const trend: Record<string, { leads: number; tickets: number }> = {};
      for (let i = 13; i >= 0; i--) {
        trend[format(subDays(new Date(), i), "MM/dd")] = { leads: 0, tickets: 0 };
      }
      leads.forEach(l => {
        const d = format(new Date(l.created_at), "MM/dd");
        if (d in trend) trend[d].leads++;
      });
      tickets.forEach(t => {
        const d = format(new Date(t.created_at), "MM/dd");
        if (d in trend) trend[d].tickets++;
      });
      const trendData = Object.entries(trend).map(([date, v]) => ({ date, ...v }));

      // Segments
      const activeSegments = segments.filter(s => s.is_active).length;
      const totalReach = segments.reduce((s, seg) => s + (seg.estimated_reach || 0), 0);

      // Unread comms
      const unreadComms = comms.filter(c => c.direction === "inbound").length;

      return {
        totalLeads: leads.length,
        openTickets,
        resolvedTickets,
        avgResolutionHrs,
        activeSegments,
        totalReach,
        unreadComms,
        leadFunnel,
        trendData,
        conversionRate: leads.length > 0 ? Math.round((leads.filter(l => l.status === "converted" || l.status === "won").length / leads.length) * 100) : 0,
      };
    },
    refetchInterval: 60000,
  });

  if (!data) return null;

  const stats = [
    { label: isAr ? "العملاء المحتملون" : "Leads", value: data.totalLeads, icon: Target, color: "text-primary" },
    { label: isAr ? "تذاكر مفتوحة" : "Open Tickets", value: data.openTickets, icon: Ticket, color: "text-destructive" },
    { label: isAr ? "معدل التحويل" : "Conversion", value: `${data.conversionRate}%`, icon: TrendingUp, color: "text-chart-2" },
    { label: isAr ? "رسائل غير مقروءة" : "Unread", value: data.unreadComms, icon: MessageSquare, color: "text-chart-3" },
  ];

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          {isAr ? "إحصائيات CRM المباشرة" : "CRM Live Stats"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* KPI Row */}
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
          {/* Activity Trend */}
          <div className="md:col-span-2">
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              {isAr ? "نشاط CRM - 14 يوم" : "CRM Activity - 14 Days"}
            </p>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={data.trendData}>
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="leads" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} name={isAr ? "عملاء محتملون" : "Leads"} />
                <Area type="monotone" dataKey="tickets" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" fillOpacity={0.2} name={isAr ? "تذاكر" : "Tickets"} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Lead Funnel */}
          <div>
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              {isAr ? "قمع العملاء المحتملين" : "Lead Funnel"}
            </p>
            {data.leadFunnel.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={data.leadFunnel} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} innerRadius={25}>
                    {data.leadFunnel.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                </PieChart>
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
          <div className="bg-muted/50 rounded-xl p-2 text-center">
            <Clock className="h-3 w-3 mx-auto mb-1 text-chart-4" />
            <div className="text-sm font-bold">{data.avgResolutionHrs}h</div>
            <div className="text-[9px] text-muted-foreground">{isAr ? "متوسط الحل" : "Avg Resolution"}</div>
          </div>
          <div className="bg-muted/50 rounded-xl p-2 text-center">
            <Users className="h-3 w-3 mx-auto mb-1 text-primary" />
            <div className="text-sm font-bold">{data.activeSegments}</div>
            <div className="text-[9px] text-muted-foreground">{isAr ? "شرائح نشطة" : "Active Segments"}</div>
          </div>
          <div className="bg-muted/50 rounded-xl p-2 text-center">
            <CheckCircle2 className="h-3 w-3 mx-auto mb-1 text-chart-2" />
            <div className="text-sm font-bold">{data.resolvedTickets}</div>
            <div className="text-[9px] text-muted-foreground">{isAr ? "تم حلها" : "Resolved"}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
