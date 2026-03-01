import { useState, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, TrendingUp, TrendingDown, Activity, CheckCircle2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from "recharts";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";

interface Anomaly {
  date: string;
  metric: string;
  metricAr: string;
  value: number;
  expected: number;
  deviation: number;
  type: "spike" | "drop";
  severity: "low" | "medium" | "high";
}

export function AnomalyDetection() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [metric, setMetric] = useState("signups");

  const { data, isLoading } = useQuery({
    queryKey: ["anomaly-detection", metric],
    queryFn: async () => {
      const days = 30;
      const end = new Date();
      const start = subDays(end, days);
      const interval = eachDayOfInterval({ start: startOfDay(start), end: startOfDay(end) });

      type TableName = "profiles" | "competition_registrations" | "shop_orders" | "articles";
      let table: TableName = "profiles";
      let dateCol = "created_at";
      if (metric === "registrations") { table = "competition_registrations"; dateCol = "registered_at"; }
      if (metric === "orders") { table = "shop_orders"; dateCol = "created_at"; }
      if (metric === "posts") { table = "articles"; dateCol = "created_at"; }

      const { data: rows } = await supabase
        .from(table)
        .select(dateCol)
        .gte(dateCol, start.toISOString())
        .lte(dateCol, end.toISOString());

      // Count by day
      const countByDay: Record<string, number> = {};
      interval.forEach(d => { countByDay[format(d, "yyyy-MM-dd")] = 0; });
      (rows || []).forEach((r: any) => {
        const day = format(new Date(r[dateCol]), "yyyy-MM-dd");
        if (countByDay[day] !== undefined) countByDay[day]++;
      });

      const dailyCounts = interval.map(d => ({
        date: format(d, "yyyy-MM-dd"),
        label: format(d, "dd/MM"),
        value: countByDay[format(d, "yyyy-MM-dd")] || 0,
      }));

      // Calculate moving average and std deviation
      const values = dailyCounts.map(d => d.value);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);

      const chartData = dailyCounts.map(d => ({
        ...d,
        mean,
        upper: mean + 2 * stdDev,
        lower: Math.max(mean - 2 * stdDev, 0),
        isAnomaly: Math.abs(d.value - mean) > 2 * stdDev,
      }));

      // Detect anomalies
      const anomalies: Anomaly[] = chartData
        .filter(d => d.isAnomaly)
        .map(d => {
          const dev = (d.value - mean) / (stdDev || 1);
          return {
            date: d.date,
            metric,
            metricAr: metric === "signups" ? "التسجيلات" : metric === "registrations" ? "المشاركات" : metric === "orders" ? "الطلبات" : "المنشورات",
            value: d.value,
            expected: Math.round(mean),
            deviation: Math.round(Math.abs(dev) * 100) / 100,
            type: d.value > mean ? "spike" as const : "drop" as const,
            severity: Math.abs(dev) > 3 ? "high" as const : Math.abs(dev) > 2.5 ? "medium" as const : "low" as const,
          };
        });

      return { chartData, anomalies, mean, stdDev };
    },
  });

  const metrics = [
    { id: "signups", label: isAr ? "التسجيلات" : "Signups" },
    { id: "registrations", label: isAr ? "مشاركات المسابقات" : "Competition Registrations" },
    { id: "orders", label: isAr ? "الطلبات" : "Orders" },
    { id: "posts", label: isAr ? "المنشورات" : "Posts" },
  ];

  const getSeverityColor = (s: string) => {
    if (s === "high") return "bg-destructive/10 text-destructive border-destructive/20";
    if (s === "medium") return "bg-chart-3/10 text-chart-3 border-chart-3/20";
    return "bg-chart-2/10 text-chart-2 border-chart-2/20";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{isAr ? "كشف الحالات الشاذة" : "Anomaly Detection"}</h3>
          <p className="text-sm text-muted-foreground">
            {isAr ? "اكتشاف تلقائي للارتفاعات والانخفاضات غير الطبيعية" : "Auto-detect unusual spikes and drops in metrics"}
          </p>
        </div>
        <Select value={metric} onValueChange={setMetric}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {metrics.map(m => (
              <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Chart with anomaly bands */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            {isAr ? "الاتجاه مع نطاق الثقة (±2σ)" : "Trend with Confidence Band (±2σ)"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.chartData || []}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="upper" stroke="none" fill="hsl(var(--destructive))" fillOpacity={0.07} />
                <Area type="monotone" dataKey="lower" stroke="none" fill="hsl(var(--background))" fillOpacity={1} />
                <ReferenceLine y={data?.mean} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" label={{ value: isAr ? "المتوسط" : "Mean", fontSize: 10 }} />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload?.isAnomaly) {
                    return <circle cx={cx} cy={cy} r={5} fill="hsl(var(--destructive))" stroke="hsl(var(--background))" strokeWidth={2} />;
                  }
                  return <circle cx={cx} cy={cy} r={2} fill="hsl(var(--primary))" />;
                }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Anomaly Alerts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-chart-3" />
            {isAr ? "التنبيهات المكتشفة" : "Detected Alerts"}
            <Badge variant="secondary" className="ms-2">{data?.anomalies?.length || 0}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(data?.anomalies?.length || 0) === 0 ? (
            <div className="flex items-center gap-2 py-6 justify-center text-muted-foreground text-sm">
              <CheckCircle2 className="h-5 w-5 text-chart-5" />
              {isAr ? "لم يتم اكتشاف حالات شاذة" : "No anomalies detected"}
            </div>
          ) : (
            <div className="space-y-2">
              {data?.anomalies?.map((a, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border">
                  {a.type === "spike" ? (
                    <TrendingUp className="h-5 w-5 text-destructive shrink-0" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-chart-3 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {a.type === "spike" ? (isAr ? "ارتفاع غير طبيعي" : "Unusual Spike") : (isAr ? "انخفاض غير طبيعي" : "Unusual Drop")}
                      {" — "}{format(new Date(a.date), "dd/MM/yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isAr ? "القيمة:" : "Value:"} {a.value} | {isAr ? "المتوقع:" : "Expected:"} ~{a.expected} | {isAr ? "الانحراف:" : "Deviation:"} {a.deviation}σ
                    </p>
                  </div>
                  <Badge className={getSeverityColor(a.severity)}>
                    {a.severity === "high" ? (isAr ? "عالي" : "High") : a.severity === "medium" ? (isAr ? "متوسط" : "Medium") : (isAr ? "منخفض" : "Low")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
