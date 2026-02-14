import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Brain,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Users,
  Trophy,
  DollarSign,
  AlertTriangle,
  Target,
  Sparkles,
} from "lucide-react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { linearRegression, forecast, detectAnomalies, type DataPoint } from "@/lib/trendPrediction";

type MetricType = "users" | "competitions" | "revenue" | "engagement";

interface PredictionResult {
  metric: MetricType;
  historical: DataPoint[];
  predicted: DataPoint[];
  anomalies: DataPoint[];
  confidence: number;
  trend: "up" | "down" | "stable";
  growthRate: number;
  nextValue: number;
}

export function MLPredictionsPanel() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("users");
  const [forecastMonths, setForecastMonths] = useState(6);

  const metricConfig: Record<MetricType, { label: string; labelAr: string; icon: React.ElementType; color: string; table: string }> = {
    users: { label: "User Growth", labelAr: "نمو المستخدمين", icon: Users, color: "primary", table: "profiles" },
    competitions: { label: "Competitions", labelAr: "المسابقات", icon: Trophy, color: "chart-2", table: "competitions" },
    revenue: { label: "Revenue", labelAr: "الإيرادات", icon: DollarSign, color: "chart-3", table: "company_transactions" },
    engagement: { label: "Engagement", labelAr: "التفاعل", icon: Target, color: "chart-4", table: "messages" },
  };

  const { data: prediction, isLoading, refetch } = useQuery({
    queryKey: ["ml-prediction", selectedMetric, forecastMonths],
    queryFn: async (): Promise<PredictionResult> => {
      const config = metricConfig[selectedMetric];
      
      const { data: records } = await supabase
        .from(config.table as any)
        .select("created_at")
        .order("created_at", { ascending: true });

      // Build monthly data
      const months: Record<string, number> = {};
      (records || []).forEach((r: any) => {
        const m = r.created_at?.substring(0, 7);
        if (m) months[m] = (months[m] || 0) + 1;
      });

      const historical: DataPoint[] = Object.entries(months)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-24)
        .map(([date, value]) => ({ date, value }));

      if (historical.length < 2) {
        return {
          metric: selectedMetric,
          historical: [],
          predicted: [],
          anomalies: [],
          confidence: 0,
          trend: "stable",
          growthRate: 0,
          nextValue: 0,
        };
      }

      const trend = linearRegression(historical);
      const predicted = forecast(historical, forecastMonths);
      const anomalies = detectAnomalies(historical);

      // Calculate growth rate
      const first = historical[0]?.value || 1;
      const last = historical[historical.length - 1]?.value || 0;
      const growthRate = ((last / Math.max(first, 1)) ** (1 / Math.max(historical.length - 1, 1)) - 1) * 100;

      return {
        metric: selectedMetric,
        historical,
        predicted,
        anomalies,
        confidence: Math.round(trend.r2 * 100),
        trend: trend.direction,
        growthRate,
        nextValue: Math.round(trend.predictedNext),
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  const chartData = prediction ? [
    ...prediction.historical.map(d => ({
      label: d.date,
      actual: d.value,
      predicted: null as number | null,
    })),
    ...(prediction.historical.length > 0 ? [{
      label: prediction.historical[prediction.historical.length - 1].date,
      actual: prediction.historical[prediction.historical.length - 1].value,
      predicted: prediction.historical[prediction.historical.length - 1].value,
    }] : []),
    ...prediction.predicted.map(d => ({
      label: d.date,
      actual: null as number | null,
      predicted: d.value,
    })),
  ] : [];

  // Remove duplicate bridge point
  const uniqueChartData = chartData.filter((d, i, arr) =>
    i === 0 || d.label !== arr[i - 1].label || d.predicted !== arr[i - 1].predicted
  );

  const config = metricConfig[selectedMetric];
  const Icon = config.icon;

  return (
    <div className="space-y-6 mt-4">
      {/* Controls */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 py-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{isAr ? "التنبؤات الذكية" : "ML Predictions"}</span>
          </div>
          <Select value={selectedMetric} onValueChange={(v) => setSelectedMetric(v as MetricType)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(metricConfig).map(([key, val]) => (
                <SelectItem key={key} value={key}>
                  {isAr ? val.labelAr : val.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(forecastMonths)} onValueChange={(v) => setForecastMonths(Number(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">{isAr ? "3 أشهر" : "3 months"}</SelectItem>
              <SelectItem value="6">{isAr ? "6 أشهر" : "6 months"}</SelectItem>
              <SelectItem value="12">{isAr ? "12 شهر" : "12 months"}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            {isAr ? "تحديث" : "Refresh"}
          </Button>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          {
            label: isAr ? "الاتجاه" : "Trend",
            value: prediction?.trend === "up" ? (isAr ? "صاعد" : "Upward") : prediction?.trend === "down" ? (isAr ? "هابط" : "Downward") : (isAr ? "مستقر" : "Stable"),
            icon: prediction?.trend === "up" ? TrendingUp : prediction?.trend === "down" ? TrendingDown : Target,
            badge: prediction?.trend === "up" ? "text-chart-2" : prediction?.trend === "down" ? "text-destructive" : "text-muted-foreground",
          },
          {
            label: isAr ? "الثقة" : "Confidence",
            value: `${prediction?.confidence || 0}%`,
            icon: Sparkles,
            badge: (prediction?.confidence || 0) > 70 ? "text-chart-2" : "text-chart-5",
          },
          {
            label: isAr ? "النمو الشهري" : "Monthly Growth",
            value: `${(prediction?.growthRate || 0).toFixed(1)}%`,
            icon: TrendingUp,
            badge: (prediction?.growthRate || 0) >= 0 ? "text-chart-2" : "text-destructive",
          },
          {
            label: isAr ? "القيمة التالية" : "Next Predicted",
            value: prediction?.nextValue?.toLocaleString() || "—",
            icon: Brain,
            badge: "text-primary",
          },
        ].map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-4 pb-3">
              {isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    <card.icon className={`h-4 w-4 ${card.badge}`} />
                  </div>
                  <p className="mt-1 text-xl font-bold">{card.value}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Icon className={`h-4 w-4 text-${config.color}`} />
              {isAr ? config.labelAr : config.label} — {isAr ? "التنبؤ" : "Forecast"}
            </CardTitle>
            <div className="flex gap-2">
              {prediction && prediction.anomalies.length > 0 && (
                <Badge variant="outline" className="gap-1 text-[10px] text-chart-5 border-chart-5/30">
                  <AlertTriangle className="h-3 w-3" />
                  {prediction.anomalies.length} {isAr ? "شذوذ" : "anomalies"}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[350px] w-full" />
          ) : uniqueChartData.length < 2 ? (
            <p className="py-16 text-center text-muted-foreground">
              {isAr ? "بيانات غير كافية للتنبؤ" : "Insufficient data for predictions"}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={uniqueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                  formatter={(value: number, name: string) => [
                    value?.toLocaleString() ?? "—",
                    name === "actual" ? (isAr ? "فعلي" : "Actual") : (isAr ? "تنبؤ" : "Predicted"),
                  ]}
                />
                <Legend
                  formatter={(value: string) =>
                    value === "actual" ? (isAr ? "فعلي" : "Actual") : (isAr ? "تنبؤ" : "Predicted")
                  }
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke={`hsl(var(--${config.color}))`}
                  fill={`hsl(var(--${config.color}) / 0.15)`}
                  strokeWidth={2}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="hsl(var(--chart-4))"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={{ r: 4, fill: "hsl(var(--chart-4))", strokeWidth: 0 }}
                  connectNulls={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
