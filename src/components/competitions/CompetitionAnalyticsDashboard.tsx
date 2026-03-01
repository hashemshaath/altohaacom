import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  BarChart3, Users, Trophy, TrendingUp, Target, Medal,
  UserCheck, Clock, Star, Activity, ArrowUp, ArrowDown,
} from "lucide-react";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
];

interface Props {
  competitionId: string;
  language: string;
}

export function CompetitionAnalyticsDashboard({ competitionId, language }: Props) {
  const isAr = language === "ar";

  const { data: registrationStats, isLoading: regLoading } = useQuery({
    queryKey: ["comp-analytics-reg", competitionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("competition_registrations")
        .select("id, status, registered_at")
        .eq("competition_id", competitionId);
      if (!data) return null;
      const total = data.length;
      const approved = data.filter(r => r.status === "approved").length;
      const pending = data.filter(r => r.status === "pending").length;
      const rejected = data.filter(r => r.status === "rejected").length;

      const timeMap: Record<string, number> = {};
      data.forEach(r => {
        const d = r.registered_at?.slice(0, 10) || "";
        if (d) timeMap[d] = (timeMap[d] || 0) + 1;
      });
      const timeline = Object.entries(timeMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count], idx, arr) => ({
          date: date.slice(5),
          count,
          cumulative: arr.slice(0, idx + 1).reduce((sum, [, c]) => sum + c, 0),
        }));

      // Approval rate
      const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

      // Status pie data
      const statusPie = [
        { name: isAr ? "مقبول" : "Approved", value: approved, fill: "hsl(var(--chart-3))" },
        { name: isAr ? "قيد الانتظار" : "Pending", value: pending, fill: "hsl(var(--chart-4))" },
        { name: isAr ? "مرفوض" : "Rejected", value: rejected, fill: "hsl(var(--destructive))" },
      ].filter(s => s.value > 0);

      return { total, approved, pending, rejected, timeline, approvalRate, statusPie };
    },
    enabled: !!competitionId,
    staleTime: 1000 * 60 * 3,
  });

  const { data: scoringStats, isLoading: scoreLoading } = useQuery({
    queryKey: ["comp-analytics-scores", competitionId],
    queryFn: async () => {
      const { data: regs } = await supabase
        .from("competition_registrations")
        .select("id")
        .eq("competition_id", competitionId);
      if (!regs || regs.length === 0) return null;
      const regIds = regs.map(r => r.id);
      
      const { data } = await supabase
        .from("competition_scores")
        .select("id, score, judge_id, registration_id")
        .in("registration_id", regIds);
      if (!data || data.length === 0) return null;
      const scores = data.map(s => s.score || 0);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const max = Math.max(...scores);
      const min = Math.min(...scores);
      const median = [...scores].sort((a, b) => a - b)[Math.floor(scores.length / 2)];

      const buckets = [0, 2, 4, 6, 8, 10];
      const dist = buckets.slice(0, -1).map((lo, i) => ({
        range: `${lo}-${buckets[i + 1]}`,
        count: scores.filter(s => s >= lo && s < buckets[i + 1]).length,
      }));

      const judgeMap: Record<string, number> = {};
      data.forEach(s => {
        if (s.judge_id) judgeMap[s.judge_id] = (judgeMap[s.judge_id] || 0) + 1;
      });
      const uniqueJudges = Object.keys(judgeMap).length;
      const avgPerJudge = uniqueJudges > 0 ? Math.round(data.length / uniqueJudges) : 0;

      return { avg: Math.round(avg * 10) / 10, max, min, median, dist, uniqueJudges, totalScores: data.length, avgPerJudge };
    },
    enabled: !!competitionId,
    staleTime: 1000 * 60 * 3,
  });

  const { data: categoryStats } = useQuery({
    queryKey: ["comp-analytics-cats", competitionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("competition_categories")
        .select("id, name, name_ar")
        .eq("competition_id", competitionId);
      if (!data) return [];
      const results = await Promise.all(
        data.map(async (cat) => {
          const { count } = await supabase
            .from("competition_registrations")
            .select("id", { count: "exact", head: true })
            .eq("competition_id", competitionId)
            .eq("category_id", cat.id);
          return {
            name: isAr && cat.name_ar ? cat.name_ar : cat.name,
            participants: count || 0,
          };
        })
      );
      return results.sort((a, b) => b.participants - a.participants);
    },
    enabled: !!competitionId,
    staleTime: 1000 * 60 * 5,
  });

  const tooltipStyle = {
    backgroundColor: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--popover-foreground))",
    fontSize: 12,
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <KPICard icon={Users} label={isAr ? "المسجلين" : "Registrations"} value={registrationStats?.total || 0} loading={regLoading} accent="text-primary bg-primary/10" />
        <KPICard icon={UserCheck} label={isAr ? "نسبة القبول" : "Approval Rate"} value={`${registrationStats?.approvalRate || 0}%`} loading={regLoading} accent="text-chart-3 bg-chart-3/10" trend={registrationStats?.approvalRate && registrationStats.approvalRate > 70 ? "up" : undefined} />
        <KPICard icon={Star} label={isAr ? "متوسط الدرجات" : "Avg Score"} value={scoringStats?.avg || 0} loading={scoreLoading} accent="text-chart-4 bg-chart-4/10" />
        <KPICard icon={Medal} label={isAr ? "الحكام النشطين" : "Active Judges"} value={scoringStats?.uniqueJudges || 0} loading={scoreLoading} accent="text-chart-5 bg-chart-5/10" subtitle={scoringStats?.avgPerJudge ? `~${scoringStats.avgPerJudge} ${isAr ? "تقييم/حكم" : "scores/judge"}` : undefined} />
      </div>

      <Tabs defaultValue="registrations" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="registrations">{isAr ? "التسجيلات" : "Registrations"}</TabsTrigger>
          <TabsTrigger value="scores">{isAr ? "الدرجات" : "Scores"}</TabsTrigger>
          <TabsTrigger value="categories">{isAr ? "الفئات" : "Categories"}</TabsTrigger>
        </TabsList>

        <TabsContent value="registrations" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Registration Timeline - now Area chart with cumulative */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  {isAr ? "مسار التسجيل" : "Registration Timeline"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {regLoading ? <Skeleton className="h-[200px]" /> : registrationStats?.timeline && registrationStats.timeline.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={registrationStats.timeline}>
                      <defs>
                        <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} className="fill-muted-foreground" />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Area type="monotone" dataKey="cumulative" stroke="hsl(var(--primary))" fill="url(#regGrad)" strokeWidth={2} name={isAr ? "الإجمالي التراكمي" : "Cumulative"} />
                      <Line type="monotone" dataKey="count" stroke="hsl(var(--chart-4))" strokeWidth={1.5} dot={{ r: 2 }} name={isAr ? "يومي" : "Daily"} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <EmptyState isAr={isAr} />}
              </CardContent>
            </Card>

            {/* Status Pie Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-chart-4" />
                  {isAr ? "توزيع الحالات" : "Status Distribution"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {registrationStats?.statusPie && registrationStats.statusPie.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="50%" height={180}>
                      <PieChart>
                        <Pie data={registrationStats.statusPie} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                          {registrationStats.statusPie.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-2">
                      {registrationStats.statusPie.map(s => (
                        <div key={s.name} className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: s.fill }} />
                          <span className="text-xs text-muted-foreground">{s.name}</span>
                          <span className="text-xs font-bold">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : <EmptyState isAr={isAr} />}
              </CardContent>
            </Card>

            {/* Status Breakdown */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4 text-chart-3" />
                  {isAr ? "حالات التسجيل" : "Registration Status"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {[
                    { label: isAr ? "مقبول" : "Approved", value: registrationStats?.approved || 0, color: "bg-chart-3/10 text-chart-3" },
                    { label: isAr ? "قيد الانتظار" : "Pending", value: registrationStats?.pending || 0, color: "bg-chart-4/10 text-chart-4" },
                    { label: isAr ? "مرفوض" : "Rejected", value: registrationStats?.rejected || 0, color: "bg-destructive/10 text-destructive" },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-2 rounded-xl border p-3 flex-1 min-w-[120px] transition-all hover:shadow-sm">
                      <div className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.color}`}>{s.value}</div>
                      <span className="text-sm text-muted-foreground">{s.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scores" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Score Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Medal className="h-4 w-4 text-chart-5" />
                  {isAr ? "توزيع الدرجات" : "Score Distribution"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {scoreLoading ? <Skeleton className="h-[200px]" /> : scoringStats?.dist && scoringStats.dist.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={scoringStats.dist}>
                      <defs>
                        <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--chart-5))" stopOpacity={1} />
                          <stop offset="100%" stopColor="hsl(var(--chart-5))" stopOpacity={0.4} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis dataKey="range" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} className="fill-muted-foreground" />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" fill="url(#scoreGrad)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyState isAr={isAr} />}
              </CardContent>
            </Card>

            {/* Score Summary - enhanced */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: isAr ? "أعلى درجة" : "Highest", value: scoringStats?.max || 0, icon: ArrowUp, color: "text-chart-3" },
                    { label: isAr ? "المتوسط" : "Average", value: scoringStats?.avg || 0, icon: Target, color: "text-primary" },
                    { label: isAr ? "الوسيط" : "Median", value: scoringStats?.median || 0, icon: BarChart3, color: "text-chart-4" },
                    { label: isAr ? "أقل درجة" : "Lowest", value: scoringStats?.min || 0, icon: ArrowDown, color: "text-chart-5" },
                  ].map(s => {
                    const Icon = s.icon;
                    return (
                      <div key={s.label} className="rounded-xl border p-3 text-center transition-all hover:shadow-sm">
                        <Icon className={`mx-auto h-4 w-4 mb-1 ${s.color}`} />
                        <p className="text-xl font-bold">{s.value}</p>
                        <p className="text-[10px] text-muted-foreground">{s.label}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground border-t pt-3">
                  <span>{isAr ? "إجمالي التقييمات" : "Total Scores"}: <strong className="text-foreground">{scoringStats?.totalScores || 0}</strong></span>
                  <span>·</span>
                  <span>{isAr ? "حكام" : "Judges"}: <strong className="text-foreground">{scoringStats?.uniqueJudges || 0}</strong></span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Trophy className="h-4 w-4 text-chart-3" />
                {isAr ? "المشاركون حسب الفئة" : "Participants by Category"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {categoryStats && categoryStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={categoryStats} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} className="fill-muted-foreground" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} className="fill-muted-foreground" width={100} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="participants" name={isAr ? "المشاركون" : "Participants"} fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyState isAr={isAr} />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, loading, accent, trend, subtitle }: {
  icon: any; label: string; value: number | string; loading: boolean; accent: string; trend?: "up" | "down"; subtitle?: string;
}) {
  return (
    <Card className="transition-all hover:shadow-md hover:-translate-y-0.5">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              {loading ? <Skeleton className="h-6 w-12" /> : <p className="text-xl font-bold">{value}</p>}
              {trend === "up" && <ArrowUp className="h-3.5 w-3.5 text-chart-3" />}
              {trend === "down" && <ArrowDown className="h-3.5 w-3.5 text-destructive" />}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">{label}</p>
            {subtitle && <p className="text-[9px] text-muted-foreground/70">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ isAr }: { isAr: boolean }) {
  return (
    <div className="flex h-[200px] items-center justify-center">
      <p className="text-sm text-muted-foreground">{isAr ? "لا توجد بيانات" : "No data available"}</p>
    </div>
  );
}
