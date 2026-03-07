import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  UserMinus, ShieldAlert, Lightbulb, RefreshCw, Users, TrendingDown,
  AlertTriangle, CheckCircle2, Target,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface ChurnRisk {
  segment: string;
  risk_level: "low" | "medium" | "high" | "critical";
  affected_users_estimate: number;
  reason: string;
  mitigation: string;
}

export function PredictiveChurnDashboard() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["churn-predictions"],
    queryFn: async () => {
      const { data: result, error } = await supabase.functions.invoke("ml-insights", {
        body: { language },
      });
      if (error) throw error;
      return result as { churn_risks: ChurnRisk[]; health_score: { retention: number } };
    },
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });

  const risks = data?.churn_risks || [];
  const retentionScore = data?.health_score?.retention || 0;

  const riskColors: Record<string, string> = {
    critical: "hsl(var(--destructive))",
    high: "hsl(var(--chart-5))",
    medium: "hsl(var(--chart-3))",
    low: "hsl(var(--chart-2))",
  };

  const riskBadgeClass: Record<string, string> = {
    critical: "bg-destructive/10 text-destructive border-destructive/20",
    high: "bg-chart-5/10 text-chart-5 border-chart-5/20",
    medium: "bg-chart-3/10 text-chart-3 border-chart-3/20",
    low: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  };

  const pieData = risks.map((r) => ({
    name: r.segment,
    value: r.affected_users_estimate,
    color: riskColors[r.risk_level] || riskColors.low,
  }));

  const barData = risks.map((r) => ({
    segment: r.segment.length > 20 ? r.segment.substring(0, 20) + "…" : r.segment,
    users: r.affected_users_estimate,
    fill: riskColors[r.risk_level] || riskColors.low,
  }));

  const totalAtRisk = risks.reduce((s, r) => s + r.affected_users_estimate, 0);
  const criticalCount = risks.filter(r => r.risk_level === "critical" || r.risk_level === "high").length;

  return (
    <div className="space-y-6 mt-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <UserMinus className="h-5 w-5 text-chart-5" />
            {isAr ? "لوحة تحليل المغادرة" : "Predictive Churn Dashboard"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isAr ? "تحليل ذكي لشرائح المستخدمين المعرضين للمغادرة" : "AI-powered analysis of user segments at risk of churning"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-1.5">
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          {isAr ? "تحديث" : "Refresh"}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28" />)}
          <Skeleton className="sm:col-span-3 h-64" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{isAr ? "معدل الاحتفاظ" : "Retention Score"}</p>
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <p className="mt-1 text-2xl font-bold"><AnimatedCounter value={retentionScore} suffix="%" /></p>
                <Progress value={retentionScore} className="mt-2 h-1.5" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{isAr ? "إجمالي المعرضين" : "Total At Risk"}</p>
                  <Users className="h-4 w-4 text-chart-5" />
                </div>
                <p className="mt-1 text-2xl font-bold"><AnimatedCounter value={totalAtRisk} /></p>
                <p className="text-xs text-muted-foreground mt-1">{risks.length} {isAr ? "شرائح" : "segments"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{isAr ? "تحذيرات حرجة" : "Critical Alerts"}</p>
                  <AlertTriangle className={`h-4 w-4 ${criticalCount > 0 ? "text-destructive" : "text-chart-2"}`} />
                </div>
                <p className="mt-1 text-2xl font-bold"><AnimatedCounter value={criticalCount} /></p>
                <p className="text-xs text-muted-foreground mt-1">
                  {criticalCount > 0 ? (isAr ? "تحتاج اهتمام فوري" : "Need immediate attention") : (isAr ? "لا تحذيرات" : "No alerts")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-4 md:grid-cols-2">
            {pieData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{isAr ? "توزيع المخاطر" : "Risk Distribution"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                        {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip formatter={(value: number) => value.toLocaleString()} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
            {barData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{isAr ? "المستخدمين المتأثرين حسب الشريحة" : "Affected Users by Segment"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={barData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="segment" type="category" width={100} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="users" radius={[0, 4, 4, 0]}>
                        {barData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Detailed Risk Segments */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-chart-5" />
                {isAr ? "تفاصيل شرائح المخاطر" : "Risk Segment Details"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {risks.length === 0 ? (
                <div className="flex items-center gap-2 py-6 justify-center text-sm text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-chart-2" />
                  {isAr ? "لا توجد مخاطر مغادرة مكتشفة" : "No churn risks detected"}
                </div>
              ) : (
                risks.map((r, i) => (
                  <div key={i} className="p-4 rounded-xl border space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <TrendingDown className={`h-4 w-4 ${r.risk_level === "critical" || r.risk_level === "high" ? "text-destructive" : "text-chart-3"}`} />
                        <span className="text-sm font-medium">{r.segment}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] ${riskBadgeClass[r.risk_level]}`}>
                          {r.risk_level}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          ~<AnimatedCounter value={r.affected_users_estimate} className="inline" /> {isAr ? "مستخدم" : "users"}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{r.reason}</p>
                    <div className="flex items-start gap-2 p-2 rounded-md bg-primary/5 border border-primary/10">
                      <Lightbulb className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      <p className="text-xs text-primary">{r.mitigation}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}