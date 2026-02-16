import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  BarChart3, Users, Trophy, TrendingUp, Target, Medal,
  UserCheck, Clock, Star, Activity,
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

      // Registration timeline
      const timeMap: Record<string, number> = {};
      data.forEach(r => {
        const d = r.registered_at?.slice(0, 10) || "";
        if (d) timeMap[d] = (timeMap[d] || 0) + 1;
      });
      const timeline = Object.entries(timeMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date: date.slice(5), count }));

      return { total, approved, pending, rejected, timeline };
    },
    enabled: !!competitionId,
    staleTime: 1000 * 60 * 3,
  });

  const { data: scoringStats, isLoading: scoreLoading } = useQuery({
    queryKey: ["comp-analytics-scores", competitionId],
    queryFn: async () => {
      // Get registrations for this competition first, then scores
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

      // Score distribution
      const buckets = [0, 2, 4, 6, 8, 10];
      const dist = buckets.slice(0, -1).map((lo, i) => ({
        range: `${lo}-${buckets[i + 1]}`,
        count: scores.filter(s => s >= lo && s < buckets[i + 1]).length,
      }));

      // Judge activity
      const judgeMap: Record<string, number> = {};
      data.forEach(s => {
        if (s.judge_id) judgeMap[s.judge_id] = (judgeMap[s.judge_id] || 0) + 1;
      });
      const uniqueJudges = Object.keys(judgeMap).length;

      return { avg: Math.round(avg * 10) / 10, max, min, dist, uniqueJudges, totalScores: data.length };
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
      return results;
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
        <KPICard
          icon={Users}
          label={isAr ? "المسجلين" : "Registrations"}
          value={registrationStats?.total || 0}
          loading={regLoading}
          accent="text-primary bg-primary/10"
        />
        <KPICard
          icon={UserCheck}
          label={isAr ? "المقبولين" : "Approved"}
          value={registrationStats?.approved || 0}
          loading={regLoading}
          accent="text-chart-3 bg-chart-3/10"
        />
        <KPICard
          icon={Star}
          label={isAr ? "متوسط الدرجات" : "Avg Score"}
          value={scoringStats?.avg || 0}
          loading={scoreLoading}
          accent="text-chart-4 bg-chart-4/10"
        />
        <KPICard
          icon={Medal}
          label={isAr ? "الحكام النشطين" : "Active Judges"}
          value={scoringStats?.uniqueJudges || 0}
          loading={scoreLoading}
          accent="text-chart-5 bg-chart-5/10"
        />
      </div>

      <Tabs defaultValue="registrations" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="registrations">{isAr ? "التسجيلات" : "Registrations"}</TabsTrigger>
          <TabsTrigger value="scores">{isAr ? "الدرجات" : "Scores"}</TabsTrigger>
          <TabsTrigger value="categories">{isAr ? "الفئات" : "Categories"}</TabsTrigger>
        </TabsList>

        <TabsContent value="registrations" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Registration Timeline */}
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
                    <LineChart data={registrationStats.timeline}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} className="fill-muted-foreground" />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <EmptyState isAr={isAr} />}
              </CardContent>
            </Card>

            {/* Registration Status Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-chart-4" />
                  {isAr ? "ملخص الحالات" : "Status Summary"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {[
                    { label: isAr ? "إجمالي" : "Total", value: registrationStats?.total || 0, color: "text-foreground" },
                    { label: isAr ? "مقبول" : "Approved", value: registrationStats?.approved || 0, color: "text-chart-3" },
                    { label: isAr ? "قيد الانتظار" : "Pending", value: registrationStats?.pending || 0, color: "text-chart-4" },
                    { label: isAr ? "مرفوض" : "Rejected", value: registrationStats?.rejected || 0, color: "text-destructive" },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{s.label}</span>
                      <span className={`text-lg font-bold ${s.color}`}>{s.value}</span>
                    </div>
                  ))}
                </div>
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
                    <div key={s.label} className="flex items-center gap-2 rounded-lg border p-3 flex-1 min-w-[120px]">
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
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis dataKey="range" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} className="fill-muted-foreground" />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyState isAr={isAr} />}
              </CardContent>
            </Card>

            {/* Score Stats */}

            {/* Score Summary */}
            <Card className="lg:col-span-2">
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-6 justify-center">
                  {[
                    { label: isAr ? "أعلى درجة" : "Highest", value: scoringStats?.max || 0 },
                    { label: isAr ? "المتوسط" : "Average", value: scoringStats?.avg || 0 },
                    { label: isAr ? "أقل درجة" : "Lowest", value: scoringStats?.min || 0 },
                    { label: isAr ? "إجمالي التقييمات" : "Total Scores", value: scoringStats?.totalScores || 0 },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className="text-2xl font-bold">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
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
                  <BarChart data={categoryStats}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} className="fill-muted-foreground" angle={-20} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} className="fill-muted-foreground" />
                    <Tooltip contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--popover-foreground))",
                      fontSize: 12,
                    }} />
                    <Bar dataKey="participants" name={isAr ? "المشاركون" : "Participants"} fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
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

function KPICard({ icon: Icon, label, value, loading, accent }: {
  icon: any; label: string; value: number; loading: boolean; accent: string;
}) {
  return (
    <Card className="animate-fade-in">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            {loading ? <Skeleton className="h-6 w-12" /> : <p className="text-xl font-bold">{value}</p>}
            <p className="text-[11px] text-muted-foreground">{label}</p>
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
