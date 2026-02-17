import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import {
  Brain, TrendingUp, TrendingDown, Minus, ShieldAlert, Lightbulb, Activity,
  RefreshCw, AlertTriangle, Zap, Target, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { toast } from "sonner";

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
  category: "growth" | "engagement" | "revenue" | "retention";
  estimated_roi: string;
}

interface HealthScore {
  overall: number;
  growth: number;
  engagement: number;
  revenue: number;
  retention: number;
}

interface Anomaly {
  metric: string;
  description: string;
  severity: "info" | "warning" | "critical";
}

interface MLInsights {
  forecasts: Forecast[];
  churn_risks: ChurnRisk[];
  recommendations: Recommendation[];
  health_score: HealthScore;
  anomalies: Anomaly[];
  monthlyData: { month: string; users: number; competitions: number; orders: number; registrations: number; revenue: number }[];
}

export function MLAnalyticsDashboard() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: insights, isLoading, refetch, error } = useQuery<MLInsights>({
    queryKey: ["ml-insights", language],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("ml-insights", {
        body: { language },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    staleTime: 1000 * 60 * 15,
    retry: 1,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success(isAr ? "تم تحديث التحليلات" : "Analytics refreshed");
    } catch {
      toast.error(isAr ? "فشل التحديث" : "Refresh failed");
    }
    setIsRefreshing(false);
  };

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const riskColor = (level: string) => {
    const map: Record<string, string> = {
      low: "bg-primary/10 text-primary border-primary/20",
      medium: "bg-secondary text-secondary-foreground border-border",
      high: "bg-destructive/10 text-destructive border-destructive/20",
      critical: "bg-destructive/20 text-destructive border-destructive/30",
    };
    return map[level] || map.low;
  };

  const impactColor = (level: string) => {
    const map: Record<string, string> = {
      low: "secondary",
      medium: "outline",
      high: "default",
    };
    return (map[level] || "secondary") as "secondary" | "outline" | "default";
  };

  const categoryIcon = (cat: string) => {
    const map: Record<string, React.ReactNode> = {
      growth: <ArrowUpRight className="h-3.5 w-3.5" />,
      engagement: <Activity className="h-3.5 w-3.5" />,
      revenue: <Zap className="h-3.5 w-3.5" />,
      retention: <Target className="h-3.5 w-3.5" />,
    };
    return map[cat] || <Lightbulb className="h-3.5 w-3.5" />;
  };

  if (error) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive/50 mb-3" />
          <p className="text-sm text-muted-foreground mb-3">{isAr ? "فشل تحميل التحليلات الذكية" : "Failed to load ML insights"}</p>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-3.5 w-3.5 me-1.5" />
            {isAr ? "إعادة المحاولة" : "Retry"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold">{isAr ? "تحليلات الذكاء الاصطناعي" : "AI-Powered Insights"}</h3>
            <p className="text-xs text-muted-foreground">{isAr ? "تنبؤات وتوصيات مدعومة بالتعلم الآلي" : "ML-powered forecasts & recommendations"}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading || isRefreshing}>
          <RefreshCw className={`h-3.5 w-3.5 me-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
          {isAr ? "تحديث" : "Refresh"}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : insights ? (
        <>
          {/* Health Score Radar */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4 text-primary" />
                  {isAr ? "صحة المنصة" : "Platform Health"}
                </CardTitle>
                <CardDescription>
                  {isAr ? "النتيجة الإجمالية" : "Overall Score"}: <span className="text-lg font-bold text-primary">{insights.health_score.overall}/100</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={[
                    { metric: isAr ? "النمو" : "Growth", value: insights.health_score.growth },
                    { metric: isAr ? "التفاعل" : "Engagement", value: insights.health_score.engagement },
                    { metric: isAr ? "الإيرادات" : "Revenue", value: insights.health_score.revenue },
                    { metric: isAr ? "الاحتفاظ" : "Retention", value: insights.health_score.retention },
                  ]}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                    <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* User Growth Forecast */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  {isAr ? "اتجاه نمو المستخدمين" : "User Growth Trend"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={insights.monthlyData}>
                    <defs>
                      <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={30} />
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                    <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fill="url(#userGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Forecasts */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Brain className="h-4 w-4 text-primary" />
                {isAr ? "التنبؤات" : "Forecasts"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {insights.forecasts.map((f) => (
                  <div key={f.metric} className="rounded-xl border border-border/50 p-4 space-y-2.5 transition-all hover:shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{f.metric}</span>
                      <TrendIcon trend={f.trend} />
                    </div>
                    <p className="text-2xl font-bold">{f.current_value.toLocaleString()}</p>
                    <div className="grid grid-cols-3 gap-1 text-[10px]">
                      <div className="text-center rounded-lg bg-muted/50 p-1.5">
                        <p className="text-muted-foreground">3m</p>
                        <p className="font-semibold">{f.forecast_3m.toLocaleString()}</p>
                      </div>
                      <div className="text-center rounded-lg bg-muted/50 p-1.5">
                        <p className="text-muted-foreground">6m</p>
                        <p className="font-semibold">{f.forecast_6m.toLocaleString()}</p>
                      </div>
                      <div className="text-center rounded-lg bg-muted/50 p-1.5">
                        <p className="text-muted-foreground">12m</p>
                        <p className="font-semibold">{f.forecast_12m.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={f.confidence} className="h-1.5 flex-1" />
                      <span className="text-[10px] text-muted-foreground">{f.confidence}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Churn Risks + Anomalies */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldAlert className="h-4 w-4 text-destructive" />
                  {isAr ? "مخاطر فقدان المستخدمين" : "Churn Risk Analysis"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {insights.churn_risks.map((risk, i) => (
                  <div key={i} className="rounded-xl border border-border/40 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{risk.segment}</span>
                      <Badge variant="outline" className={riskColor(risk.risk_level)}>
                        {risk.risk_level}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{risk.reason}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        ~{risk.affected_users_estimate} {isAr ? "مستخدم" : "users"}
                      </span>
                      <span className="text-primary font-medium">{risk.mitigation}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  {isAr ? "تنبيهات ذكية" : "Smart Anomalies"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {insights.anomalies.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">{isAr ? "لا توجد تنبيهات" : "No anomalies detected"}</p>
                ) : insights.anomalies.map((a, i) => (
                  <div key={i} className={`rounded-xl border p-3.5 ${
                    a.severity === "critical" ? "border-destructive/30 bg-destructive/5" :
                    a.severity === "warning" ? "border-border bg-secondary/50" :
                    "border-border/40"
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={
                        a.severity === "critical" ? "bg-destructive/10 text-destructive border-destructive/20" :
                        a.severity === "warning" ? "bg-secondary text-secondary-foreground border-border" :
                        "bg-muted text-muted-foreground"
                      }>
                        {a.severity}
                      </Badge>
                      <span className="text-sm font-medium">{a.metric}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{a.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="h-4 w-4 text-primary" />
                {isAr ? "توصيات ذكية" : "AI Recommendations"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {insights.recommendations.map((rec, i) => (
                  <div key={i} className="rounded-xl border border-border/50 p-4 space-y-2 transition-all hover:shadow-sm hover:-translate-y-0.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {categoryIcon(rec.category)}
                      </div>
                      <span className="text-sm font-medium flex-1">{rec.title}</span>
                      <Badge variant={impactColor(rec.impact)} className="text-[10px]">
                        {rec.impact} {isAr ? "تأثير" : "impact"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{rec.description}</p>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground capitalize">{rec.effort} {isAr ? "جهد" : "effort"}</span>
                      <span className="text-primary font-medium">{isAr ? "العائد المتوقع" : "Est. ROI"}: {rec.estimated_roi}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Revenue Trend */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-4 w-4 text-primary" />
                {isAr ? "اتجاه الإيرادات" : "Revenue Trend"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={insights.monthlyData}>
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={40} />
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
