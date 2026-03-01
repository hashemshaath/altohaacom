import { useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  Legend,
} from "recharts";
import {
  linearRegression,
  forecast,
  detectAnomalies,
  monthlyGrowthRate,
  type DataPoint,
  type TrendResult,
} from "@/lib/trendPrediction";

interface TrendForecastChartProps {
  title: string;
  data: DataPoint[];
  isLoading?: boolean;
  forecastPeriods?: number;
  icon?: React.ElementType;
  color?: string;
}

export function TrendForecastChart({
  title,
  data,
  isLoading,
  forecastPeriods = 3,
  icon: Icon = TrendingUp,
  color = "primary",
}: TrendForecastChartProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const analysis = useMemo(() => {
    if (!data || data.length < 2) return null;

    const trend = linearRegression(data);
    const forecastData = forecast(data, forecastPeriods);
    const anomalies = detectAnomalies(data);
    const growthRate = monthlyGrowthRate(data);

    // Merge actual + forecast into single chart array
    const chartData = [
      ...data.map((d) => ({
        label: d.date,
        actual: d.value,
        forecast: null as number | null,
      })),
      // Bridge: last actual point starts the forecast
      ...forecastData.map((d) => ({
        label: d.date,
        actual: null as number | null,
        forecast: d.value,
      })),
    ];

    // Add the bridge point: last actual value also has forecast value
    if (chartData.length > 0 && data.length > 0) {
      const bridgeIdx = data.length - 1;
      chartData[bridgeIdx] = {
        ...chartData[bridgeIdx],
        forecast: data[data.length - 1].value,
      };
    }

    return { trend, forecastData, anomalies, growthRate, chartData };
  }, [data, forecastPeriods]);

  const TrendBadge = ({ trend }: { trend: TrendResult }) => {
    const dirConfig = {
      up: { icon: TrendingUp, cls: "text-chart-2 border-chart-2/30", label: isAr ? "صاعد" : "Upward" },
      down: { icon: TrendingDown, cls: "text-destructive border-destructive/30", label: isAr ? "هابط" : "Downward" },
      stable: { icon: Minus, cls: "text-muted-foreground border-border", label: isAr ? "مستقر" : "Stable" },
    };
    const cfg = dirConfig[trend.direction];
    const DirIcon = cfg.icon;
    return (
      <Badge variant="outline" className={`gap-1 text-[10px] ${cfg.cls}`}>
        <DirIcon className="h-3 w-3" />
        {cfg.label} · R²={trend.r2.toFixed(2)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-12 text-center text-muted-foreground">
            {isAr ? "بيانات غير كافية للتنبؤ" : "Insufficient data for forecasting"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const { trend, anomalies, growthRate, chartData } = analysis;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon className={`h-4 w-4 text-${color}`} />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <TrendBadge trend={trend} />
            {anomalies.length > 0 && (
              <Badge variant="outline" className="gap-1 text-[10px] text-chart-5 border-chart-5/30">
                <AlertTriangle className="h-3 w-3" />
                {anomalies.length} {isAr ? "شذوذ" : "anomal."}
              </Badge>
            )}
          </div>
        </div>
        {/* Summary stats */}
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span>
            {isAr ? "النمو الشهري" : "Monthly growth"}: <strong className={growthRate >= 0 ? "text-chart-2" : "text-destructive"}>{growthRate.toFixed(1)}%</strong>
          </span>
          <span>
            {isAr ? "التنبؤ التالي" : "Next predicted"}: <strong className="text-foreground"><AnimatedCounter value={Math.round(trend.predictedNext)} className="inline" /></strong>
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-chart-4" />
            {trend.percentChange >= 0 ? "+" : ""}{trend.percentChange.toFixed(1)}%
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 12,
              }}
              formatter={(value: number, name: string) => [
                value?.toLocaleString() ?? "—",
                name === "actual"
                  ? isAr ? "فعلي" : "Actual"
                  : isAr ? "تنبؤ" : "Forecast",
              ]}
            />
            <Legend
              formatter={(value: string) =>
                value === "actual"
                  ? isAr ? "فعلي" : "Actual"
                  : isAr ? "تنبؤ" : "Forecast"
              }
            />
            <Area
              type="monotone"
              dataKey="actual"
              stroke={`hsl(var(--${color}))`}
              fill={`hsl(var(--${color}) / 0.15)`}
              strokeWidth={2}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="hsl(var(--chart-4))"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={{ r: 4, fill: "hsl(var(--chart-4))", strokeWidth: 0 }}
              connectNulls={false}
            />
            {/* Anomaly dots */}
            {anomalies.map((a) => {
              const idx = chartData.findIndex((d) => d.label === a.date);
              if (idx === -1) return null;
              return (
                <ReferenceDot
                  key={a.date}
                  x={a.date}
                  y={a.value}
                  r={6}
                  fill="hsl(var(--chart-5))"
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
