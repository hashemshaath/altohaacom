import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Zap, Users, Target, Activity, CheckCircle2, Clock } from "lucide-react";
import { subDays, format } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--destructive))"];

export const MarketingOverviewWidget = memo(function MarketingOverviewWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-marketing-overview-widget"],
    queryFn: async () => {
      const now = new Date();
      const sevenDaysAgo = subDays(now, 7).toISOString();

      const [segments, runs, rules] = await Promise.all([
        supabase.from("audience_segments").select("id, name, estimated_reach, is_active, last_used_at"),
        supabase.from("automation_runs").select("id, action, status, started_at, completed_at").order("started_at", { ascending: false }).limit(200),
        supabase.from("notification_rules").select("id, is_active, channels, trigger_event"),
      ]);

      const allSegments = segments.data || [];
      const allRuns = runs.data || [];
      const allRules = rules.data || [];

      // Segment stats
      const activeSegments = allSegments.filter(s => s.is_active).length;
      const totalReach = allSegments.reduce((s, seg) => s + (seg.estimated_reach || 0), 0);

      // Run stats
      const recentRuns = allRuns.filter(r => new Date(r.started_at) >= new Date(sevenDaysAgo));
      const successRuns = recentRuns.filter(r => r.status === "completed").length;
      const failedRuns = recentRuns.filter(r => r.status === "failed").length;
      const successRate = recentRuns.length > 0 ? Math.round((successRuns / recentRuns.length) * 100) : 100;

      // Run status distribution
      const runStatusMap: Record<string, number> = {};
      allRuns.forEach(r => { runStatusMap[r.status] = (runStatusMap[r.status] || 0) + 1; });
      const runStatusDist = Object.entries(runStatusMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

      // Daily runs (7 days)
      const dailyMap: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        dailyMap[format(subDays(now, i), "EEE")] = 0;
      }
      recentRuns.forEach(r => {
        const d = format(new Date(r.started_at), "EEE");
        if (dailyMap[d] !== undefined) dailyMap[d]++;
      });
      const dailyRuns = Object.entries(dailyMap).map(([day, count]) => ({ day, count }));

      // Active rules by channel
      const channelMap: Record<string, number> = {};
      allRules.filter(r => r.is_active).forEach(r => {
        const channels = r.channels || ["in_app"];
        channels.forEach((ch: string) => { channelMap[ch] = (channelMap[ch] || 0) + 1; });
      });
      const channelDist = Object.entries(channelMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

      return {
        totalSegments: allSegments.length,
        activeSegments,
        totalReach,
        totalRuns: allRuns.length,
        recentRunCount: recentRuns.length,
        successRate,
        failedRuns,
        activeRules: allRules.filter(r => r.is_active).length,
        totalRules: allRules.length,
        runStatusDist,
        dailyRuns,
        channelDist,
      };
    },
    refetchInterval: 60000,
  });

  if (isLoading) return <Skeleton className="h-52 w-full rounded-xl" />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          { icon: Target, label: isAr ? "شرائح" : "Segments", value: `${data.activeSegments}/${data.totalSegments}`, color: "text-primary", bg: "bg-primary/10" },
          { icon: Users, label: isAr ? "وصول" : "Reach", value: data.totalReach > 1000 ? `${(data.totalReach / 1000).toFixed(1)}K` : data.totalReach, color: "text-chart-3", bg: "bg-chart-3/10" },
          { icon: Activity, label: isAr ? "تشغيل (7 أيام)" : "Runs (7d)", value: data.recentRunCount, color: "text-chart-4", bg: "bg-chart-4/10" },
          { icon: CheckCircle2, label: isAr ? "نجاح" : "Success", value: `${data.successRate}%`, color: data.successRate >= 80 ? "text-chart-5" : "text-destructive", bg: data.successRate >= 80 ? "bg-chart-5/10" : "bg-destructive/10" },
          { icon: Zap, label: isAr ? "قواعد نشطة" : "Active Rules", value: data.activeRules, color: "text-primary", bg: "bg-primary/10" },
          { icon: Clock, label: isAr ? "فاشلة" : "Failed", value: data.failedRuns, color: data.failedRuns > 0 ? "text-destructive" : "text-chart-5", bg: data.failedRuns > 0 ? "bg-destructive/10" : "bg-chart-5/10" },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-3 flex items-center gap-2">
              <div className={`rounded-full p-1.5 ${kpi.bg}`}><kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} /></div>
              <div className="min-w-0">
                <p className="text-[9px] text-muted-foreground truncate">{kpi.label}</p>
                <p className="text-base font-bold">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isAr ? "التشغيل التلقائي (7 أيام)" : "Automation Runs (7 Days)"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data.dailyRuns}>
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} width={28} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name={isAr ? "تشغيل" : "Runs"} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] font-semibold text-muted-foreground mb-2">{isAr ? "حالة التشغيل" : "Run Status"}</p>
              <div className="flex items-center gap-3">
                <PieChart width={60} height={60}>
                  <Pie data={data.runStatusDist} dataKey="value" cx={28} cy={28} innerRadius={16} outerRadius={28} strokeWidth={0}>
                    {data.runStatusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
                <div className="text-[10px] space-y-1">
                  {data.runStatusDist.map((s, i) => (
                    <div key={s.name} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="capitalize">{s.name}</span>: <strong>{s.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] font-semibold text-muted-foreground mb-2">{isAr ? "القنوات النشطة" : "Active Channels"}</p>
              <div className="space-y-1">
                {data.channelDist.map(c => (
                  <div key={c.name} className="flex items-center justify-between text-[10px]">
                    <span className="capitalize">{c.name.replace(/_/g, " ")}</span>
                    <Badge variant="outline" className="text-[9px] h-4">{c.value}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
});
