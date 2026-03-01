import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, AlertTriangle, CheckCircle, Clock, TrendingUp, Users, Activity } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ScatterChart, Scatter, Cell } from "recharts";

interface Props {
  competitionId: string;
  isOrganizer?: boolean;
}

export function JudgeAnalyticsPanel({ competitionId, isOrganizer }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["judge-analytics", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("judge_analytics")
        .select("*")
        .eq("competition_id", competitionId);
      if (error) throw error;

      if (!data?.length) return { judges: [], profiles: {} };

      const judgeIds = data.map(a => a.judge_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", judgeIds);

      const profileMap = Object.fromEntries(profiles?.map(p => [p.user_id, p]) || []);
      return { judges: data, profiles: profileMap };
    },
  });

  if (isLoading) {
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;
  }

  const judges = analytics?.judges || [];
  const profiles = analytics?.profiles || {};

  if (!judges.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12 text-center">
          <BarChart3 className="h-10 w-10 text-muted-foreground/20 mb-3" />
          <p className="font-semibold text-sm">{isAr ? "لا توجد بيانات تحليلية" : "No analytics data yet"}</p>
          <p className="text-xs text-muted-foreground">{isAr ? "ستظهر البيانات بعد تقديم التقييمات" : "Analytics will appear after scores are submitted"}</p>
        </CardContent>
      </Card>
    );
  }

  // Aggregate metrics
  const avgConsistency = judges.reduce((s, j) => s + (j.consistency_score || 0), 0) / judges.length;
  const avgBias = judges.reduce((s, j) => s + Math.abs(j.bias_indicator || 0), 0) / judges.length;
  const avgCompletion = judges.reduce((s, j) => s + (j.completion_rate || 0), 0) / judges.length;
  const totalScores = judges.reduce((s, j) => s + (j.scores_count || 0), 0);

  // Chart data
  const consistencyData = judges.map(j => ({
    name: (profiles[j.judge_id]?.full_name || "Judge").substring(0, 12),
    consistency: Number((j.consistency_score || 0).toFixed(1)),
    bias: Number(Math.abs(j.bias_indicator || 0).toFixed(2)),
  }));

  const scoringData = judges.map(j => ({
    name: (profiles[j.judge_id]?.full_name || "Judge").substring(0, 12),
    avgScore: Number((j.avg_score_given || 0).toFixed(1)),
    stdDev: Number((j.score_std_deviation || 0).toFixed(1)),
  }));

  const getBiasLevel = (bias: number) => {
    if (bias < 0.1) return { label: isAr ? "ممتاز" : "Excellent", color: "text-chart-5", variant: "default" as const };
    if (bias < 0.3) return { label: isAr ? "جيد" : "Good", color: "text-chart-3", variant: "secondary" as const };
    return { label: isAr ? "يحتاج مراجعة" : "Needs Review", color: "text-destructive", variant: "destructive" as const };
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {[
          { icon: Users, label: isAr ? "الحكام" : "Judges", value: judges.length, color: "text-primary" },
          { icon: Activity, label: isAr ? "التقييمات" : "Total Scores", value: totalScores, color: "text-chart-4" },
          { icon: CheckCircle, label: isAr ? "الاتساق" : "Avg Consistency", value: `${(avgConsistency * 100).toFixed(0)}%`, color: "text-chart-5" },
          { icon: TrendingUp, label: isAr ? "نسبة الإكمال" : "Avg Completion", value: `${(avgCompletion * 100).toFixed(0)}%`, color: "text-chart-3" },
        ].map((stat, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="flex items-center gap-2 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/5 shrink-0">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">{stat.label}</p>
                <p className="text-sm font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Individual Judge Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{isAr ? "أداء الحكام" : "Judge Performance"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {judges.map(j => {
            const profile = profiles[j.judge_id];
            const biasInfo = getBiasLevel(Math.abs(j.bias_indicator || 0));
            return (
              <div key={j.id} className="rounded-xl border border-border/60 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full overflow-hidden bg-muted shrink-0">
                      {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{profile?.full_name || "—"}</p>
                      <p className="text-[10px] text-muted-foreground">{j.scores_count || 0} {isAr ? "تقييم" : "scores"}</p>
                    </div>
                  </div>
                  <Badge variant={biasInfo.variant} className="text-[10px]">{biasInfo.label}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[9px] text-muted-foreground uppercase">{isAr ? "المتوسط" : "Avg Score"}</p>
                    <p className="text-sm font-bold">{(j.avg_score_given || 0).toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground uppercase">{isAr ? "الاتساق" : "Consistency"}</p>
                    <Progress value={(j.consistency_score || 0) * 100} className="h-1.5 mt-1" />
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground uppercase">{isAr ? "الانحراف" : "Std Dev"}</p>
                    <p className="text-sm font-bold">{(j.score_std_deviation || 0).toFixed(1)}</p>
                  </div>
                </div>
                {Math.abs(j.bias_indicator || 0) > 0.3 && (
                  <div className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/5 rounded-xl p-2">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    {isAr ? "مؤشر تحيز عالٍ - يوصى بمراجعة التقييمات" : "High bias indicator - score review recommended"}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{isAr ? "اتساق الحكام" : "Judge Consistency"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={consistencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 1]} />
                <Tooltip />
                <Bar dataKey="consistency" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} name={isAr ? "الاتساق" : "Consistency"} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{isAr ? "متوسط الدرجات والانحراف" : "Avg Scores & Deviation"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={scoringData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="avgScore" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name={isAr ? "المتوسط" : "Avg Score"} />
                <Bar dataKey="stdDev" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} name={isAr ? "الانحراف" : "Std Dev"} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
