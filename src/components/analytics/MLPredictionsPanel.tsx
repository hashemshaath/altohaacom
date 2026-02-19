import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Brain, RefreshCw, TrendingUp, TrendingDown, Users, Trophy,
  DollarSign, AlertTriangle, Target, Sparkles, Lightbulb, ShieldAlert, Activity,
} from "lucide-react";
import {
  ComposedChart, Area, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

interface Forecast {
  metric: string;
  current_value: number;
  forecast_3m: number;
  forecast_6m: number;
  forecast_12m: number;
  trend: "up" | "down" | "stable";
  confidence: number;
}

interface ChurnRisk {
  segment: string;
  risk_level: "low" | "medium" | "high" | "critical";
  affected_users_estimate: number;
  reason: string;
  mitigation: string;
}

interface Recommendation {
  title: string;
  description: string;
  impact: "low" | "medium" | "high";
  effort: "low" | "medium" | "high";
  category: string;
  estimated_roi: string;
}

interface HealthScore {
  overall: number;
  growth: number;
  engagement: number;
  revenue: number;
  retention: number;
}

interface MLInsightsData {
  forecasts: Forecast[];
  churn_risks: ChurnRisk[];
  recommendations: Recommendation[];
  health_score: HealthScore;
  anomalies: { metric: string; description: string; severity: string }[];
  monthlyData?: { month: string; users: number; competitions: number; orders: number; revenue: number }[];
}

const metricIcons: Record<string, React.ElementType> = {
  users: Users, revenue: DollarSign, competitions: Trophy, engagement: Activity,
  orders: Target, registrations: Users,
};

export function MLPredictionsPanel() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading, refetch, isFetching } = useQuery<MLInsightsData>({
    queryKey: ["ml-insights-ai"],
    queryFn: async () => {
      const { data: result, error } = await supabase.functions.invoke("ml-insights", {
        body: { language },
      });
      if (error) throw error;
      return result;
    },
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });

  const healthData = data?.health_score
    ? [
        { subject: isAr ? "النمو" : "Growth", value: data.health_score.growth },
        { subject: isAr ? "التفاعل" : "Engagement", value: data.health_score.engagement },
        { subject: isAr ? "الإيرادات" : "Revenue", value: data.health_score.revenue },
        { subject: isAr ? "الاحتفاظ" : "Retention", value: data.health_score.retention },
      ]
    : [];

  const getTrendIcon = (trend: string) =>
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Target;

  const getRiskColor = (level: string) => {
    if (level === "critical") return "bg-destructive/10 text-destructive border-destructive/20";
    if (level === "high") return "bg-chart-5/10 text-chart-5 border-chart-5/20";
    if (level === "medium") return "bg-chart-3/10 text-chart-3 border-chart-3/20";
    return "bg-chart-2/10 text-chart-2 border-chart-2/20";
  };

  const getImpactColor = (impact: string) => {
    if (impact === "high") return "text-chart-2";
    if (impact === "medium") return "text-chart-3";
    return "text-muted-foreground";
  };

  return (
    <div className="space-y-6 mt-4">
      {/* Controls */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{isAr ? "التنبؤات الذكية بالذكاء الاصطناعي" : "AI-Powered ML Predictions"}</span>
            <Badge variant="secondary" className="text-[10px] gap-1">
              <Sparkles className="h-3 w-3" />
              Gemini
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            {isAr ? "تحديث" : "Refresh"}
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          <Skeleton className="sm:col-span-2 lg:col-span-4 h-80" />
        </div>
      ) : !data ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Brain className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isAr ? "اضغط تحديث لتوليد التنبؤات" : "Click Refresh to generate AI predictions"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Health Score Radar + Overall */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  {isAr ? "صحة المنصة" : "Platform Health"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-2">
                  <div className="relative flex h-24 w-24 items-center justify-center">
                    <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--primary))" strokeWidth="8"
                        strokeDasharray={`${(data.health_score.overall / 100) * 264} 264`}
                        strokeLinecap="round" />
                    </svg>
                    <span className="absolute text-2xl font-bold">{data.health_score.overall}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{isAr ? "النقاط من 100" : "Score out of 100"}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="md:col-span-3">
              <CardContent className="pt-4">
                <ResponsiveContainer width="100%" height={180}>
                  <RadarChart data={healthData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Forecast Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.forecasts.map((f) => {
              const Icon = metricIcons[f.metric] || Target;
              const TIcon = getTrendIcon(f.trend);
              return (
                <Card key={f.metric}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium capitalize">{f.metric}</span>
                      </div>
                      <Badge variant="outline" className="gap-1 text-[10px]">
                        <TIcon className={`h-3 w-3 ${f.trend === "up" ? "text-chart-2" : f.trend === "down" ? "text-destructive" : "text-muted-foreground"}`} />
                        {f.trend}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold">{f.current_value.toLocaleString()}</div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center p-2 rounded-lg bg-muted/50">
                        <div className="text-muted-foreground">{isAr ? "3 أشهر" : "3mo"}</div>
                        <div className="font-semibold mt-0.5">{f.forecast_3m.toLocaleString()}</div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/50">
                        <div className="text-muted-foreground">{isAr ? "6 أشهر" : "6mo"}</div>
                        <div className="font-semibold mt-0.5">{f.forecast_6m.toLocaleString()}</div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/50">
                        <div className="text-muted-foreground">{isAr ? "12 شهر" : "12mo"}</div>
                        <div className="font-semibold mt-0.5">{f.forecast_12m.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{isAr ? "الثقة" : "Confidence"}</span>
                      <Progress value={f.confidence} className="flex-1 h-1.5" />
                      <span className="text-[10px] font-medium">{f.confidence}%</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Monthly Trend Chart */}
          {data.monthlyData && data.monthlyData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{isAr ? "الاتجاه الشهري" : "Monthly Trends"}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={data.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                    <Legend />
                    <Area type="monotone" dataKey="users" name={isAr ? "المستخدمين" : "Users"} stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" />
                    <Bar dataKey="competitions" name={isAr ? "المسابقات" : "Competitions"} fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="orders" name={isAr ? "الطلبات" : "Orders"} stroke="hsl(var(--chart-3))" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Anomalies */}
          {data.anomalies?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-chart-5" />
                  {isAr ? "حالات شاذة مكتشفة" : "Detected Anomalies"}
                  <Badge variant="secondary" className="text-[10px]">{data.anomalies.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.anomalies.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                    <ShieldAlert className={`h-4 w-4 mt-0.5 shrink-0 ${a.severity === "critical" ? "text-destructive" : a.severity === "warning" ? "text-chart-3" : "text-muted-foreground"}`} />
                    <div>
                      <p className="text-sm font-medium">{a.metric}</p>
                      <p className="text-xs text-muted-foreground">{a.description}</p>
                    </div>
                    <Badge variant="outline" className="ml-auto text-[10px] shrink-0">{a.severity}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {data.recommendations?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-chart-4" />
                  {isAr ? "توصيات ذكية" : "AI Recommendations"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.recommendations.map((r, i) => (
                  <div key={i} className="p-3 rounded-lg border space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{r.title}</p>
                      <div className="flex gap-1 shrink-0">
                        <Badge variant="outline" className={`text-[10px] ${getImpactColor(r.impact)}`}>
                          {isAr ? "الأثر:" : "Impact:"} {r.impact}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {isAr ? "الجهد:" : "Effort:"} {r.effort}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                    <p className="text-[10px] text-primary">{isAr ? "العائد المتوقع:" : "Est. ROI:"} {r.estimated_roi}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}