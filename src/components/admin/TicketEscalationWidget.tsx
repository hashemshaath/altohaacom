import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { AlertTriangle, Clock, CheckCircle2, TrendingDown, Zap } from "lucide-react";
import { differenceInHours, differenceInMinutes, subDays, format } from "date-fns";

export function TicketEscalationWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-ticket-escalation"],
    queryFn: async () => {
      const now = new Date();
      const sevenDaysAgo = subDays(now, 7).toISOString();

      const { data: tickets } = await supabase
        .from("support_tickets")
        .select("id, status, priority, created_at, resolved_at, assigned_to, category")
        .gte("created_at", sevenDaysAgo);

      if (!tickets) return null;

      // Resolution time calc
      const resolved = tickets.filter(t => t.resolved_at);
      const avgResolutionMins = resolved.length > 0
        ? Math.round(resolved.reduce((sum, t) => sum + differenceInMinutes(new Date(t.resolved_at!), new Date(t.created_at)), 0) / resolved.length)
        : 0;

      // SLA compliance
      const slaThresholds: Record<string, number> = { urgent: 4, high: 8, normal: 24, low: 72 };
      const slaCompliant = resolved.filter(t => {
        const hrs = differenceInHours(new Date(t.resolved_at!), new Date(t.created_at));
        return hrs <= (slaThresholds[t.priority] || 24);
      }).length;
      const slaRate = resolved.length > 0 ? Math.round((slaCompliant / resolved.length) * 100) : 100;

      // Category breakdown
      const catMap: Record<string, number> = {};
      tickets.forEach(t => { const cat = t.category || "general"; catMap[cat] = (catMap[cat] || 0) + 1; });
      const categories = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, count]) => ({ name, count }));

      // Daily volume
      const dailyMap: Record<string, { created: number; resolved: number }> = {};
      for (let i = 6; i >= 0; i--) {
        dailyMap[format(subDays(now, i), "EEE")] = { created: 0, resolved: 0 };
      }
      tickets.forEach(t => {
        const d = format(new Date(t.created_at), "EEE");
        if (dailyMap[d]) dailyMap[d].created++;
        if (t.resolved_at) {
          const rd = format(new Date(t.resolved_at), "EEE");
          if (dailyMap[rd]) dailyMap[rd].resolved++;
        }
      });
      const dailyVolume = Object.entries(dailyMap).map(([day, v]) => ({ day, ...v }));

      // Unassigned tickets
      const unassigned = tickets.filter(t => !t.assigned_to && t.status !== "closed" && t.status !== "resolved").length;

      // Escalated (breached SLA and still open)
      const escalated = tickets.filter(t => {
        if (t.status === "resolved" || t.status === "closed") return false;
        const hrs = differenceInHours(now, new Date(t.created_at));
        return hrs >= (slaThresholds[t.priority] || 24);
      }).length;

      return {
        total: tickets.length,
        resolved: resolved.length,
        avgResolutionMins,
        slaRate,
        categories,
        dailyVolume,
        unassigned,
        escalated,
      };
    },
    refetchInterval: 30000,
  });

  if (isLoading) return <Skeleton className="h-52 w-full rounded-xl" />;
  if (!data) return null;

  const avgHrs = Math.floor(data.avgResolutionMins / 60);
  const avgMins = data.avgResolutionMins % 60;
  const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-5))"];

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {/* KPI Cards */}
      {[
        { icon: Clock, label: isAr ? "متوسط الحل" : "Avg Resolution", value: `${avgHrs}h ${avgMins}m`, color: "text-primary", bg: "bg-primary/10" },
        { icon: CheckCircle2, label: isAr ? "التزام SLA" : "SLA Compliance", value: `${data.slaRate}%`, color: data.slaRate >= 80 ? "text-chart-5" : "text-destructive", bg: data.slaRate >= 80 ? "bg-chart-5/10" : "bg-destructive/10" },
        { icon: AlertTriangle, label: isAr ? "مصعّدة" : "Escalated", value: data.escalated, color: "text-destructive", bg: "bg-destructive/10" },
        { icon: Zap, label: isAr ? "غير مُعيّنة" : "Unassigned", value: data.unassigned, color: "text-chart-4", bg: "bg-chart-4/10" },
      ].map(kpi => (
        <Card key={kpi.label}>
          <CardContent className="flex items-center gap-3 p-3">
            <div className={`rounded-full p-2 ${kpi.bg}`}><kpi.icon className={`h-4 w-4 ${kpi.color}`} /></div>
            <div>
              <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
              <p className="text-lg font-bold">{kpi.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Daily Volume Chart */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-chart-3" />
            {isAr ? "حجم التذاكر اليومي" : "Daily Ticket Volume"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={data.dailyVolume}>
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} width={24} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Bar dataKey="created" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name={isAr ? "جديدة" : "Created"} />
              <Bar dataKey="resolved" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} name={isAr ? "محلولة" : "Resolved"} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{isAr ? "التذاكر حسب الفئة" : "Tickets by Category"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.categories.map((cat, i) => (
            <div key={cat.name} className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="capitalize">{cat.name}</span>
                <span className="text-muted-foreground">{cat.count}</span>
              </div>
              <Progress value={(cat.count / data.total) * 100} className="h-1.5" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
