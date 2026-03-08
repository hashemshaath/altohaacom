import { useState, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Layers, Users, Trophy, DollarSign, MessageSquare, FileText, ShoppingCart } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";

interface MetricDef {
  id: string;
  label: string;
  labelAr: string;
  icon: React.ElementType;
  color: string;
  table: string;
  dateCol: string;
}

const METRICS: MetricDef[] = [
  { id: "users", label: "Users", labelAr: "المستخدمين", icon: Users, color: "hsl(var(--primary))", table: "profiles", dateCol: "created_at" },
  { id: "competitions", label: "Competitions", labelAr: "المسابقات", icon: Trophy, color: "hsl(var(--chart-2))", table: "competitions", dateCol: "created_at" },
  { id: "orders", label: "Orders", labelAr: "الطلبات", icon: ShoppingCart, color: "hsl(var(--chart-3))", table: "company_orders", dateCol: "created_at" },
  { id: "messages", label: "Messages", labelAr: "الرسائل", icon: MessageSquare, color: "hsl(var(--chart-4))", table: "messages", dateCol: "created_at" },
  { id: "posts", label: "Posts", labelAr: "المنشورات", icon: FileText, color: "hsl(var(--chart-5))", table: "posts", dateCol: "created_at" },
  { id: "certificates", label: "Certificates", labelAr: "الشهادات", icon: FileText, color: "hsl(var(--chart-1))", table: "certificates", dateCol: "created_at" },
];

export const MultiMetricComparison = memo(function MultiMetricComparison() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [selected, setSelected] = useState<string[]>(["users", "competitions", "orders"]);

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const { data: chartData, isLoading } = useQuery({
    queryKey: ["multi-metric-comparison", selected],
    queryFn: async () => {
      const now = new Date();
      const start = startOfMonth(subMonths(now, 11));
      const end = endOfMonth(now);
      const months = eachMonthOfInterval({ start, end });

      const results: Record<string, Record<string, number>> = {};
      months.forEach(m => { results[format(m, "yyyy-MM")] = {}; });

      const activeMetrics = METRICS.filter(m => selected.includes(m.id));

      await Promise.all(activeMetrics.map(async (metric) => {
        const { data: rows } = await supabase
          .from(metric.table as any)
          .select(metric.dateCol)
          .gte(metric.dateCol, start.toISOString())
          .lte(metric.dateCol, end.toISOString());

        const counts: Record<string, number> = {};
        months.forEach(m => { counts[format(m, "yyyy-MM")] = 0; });

        (rows || []).forEach((r: any) => {
          const month = r[metric.dateCol]?.substring(0, 7);
          if (month && counts[month] !== undefined) counts[month]++;
        });

        Object.entries(counts).forEach(([month, count]) => {
          results[month][metric.id] = count;
        });
      }));

      return months.map(m => ({
        month: format(m, "MMM yy"),
        key: format(m, "yyyy-MM"),
        ...results[format(m, "yyyy-MM")],
      }));
    },
    enabled: selected.length > 0,
  });

  return (
    <div className="space-y-6 mt-4">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          {isAr ? "مقارنة المقاييس المتعددة" : "Multi-Metric Comparison"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {isAr ? "اختر المقاييس للمقارنة المباشرة على نفس الرسم البياني" : "Select metrics to overlay on the same chart"}
        </p>
      </div>

      {/* Metric Selector */}
      <Card>
        <CardContent className="flex flex-wrap gap-4 py-4">
          {METRICS.map((m) => (
            <label key={m.id} className="flex items-center gap-2 cursor-pointer select-none">
              <Checkbox
                checked={selected.includes(m.id)}
                onCheckedChange={() => toggle(m.id)}
              />
              <m.icon className="h-4 w-4" style={{ color: m.color }} />
              <span className="text-sm">{isAr ? m.labelAr : m.label}</span>
            </label>
          ))}
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            {isAr ? "المقارنة الشهرية (12 شهر)" : "Monthly Comparison (12 months)"}
            <Badge variant="secondary" className="text-[10px]">{selected.length} {isAr ? "مقاييس" : "metrics"}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[350px] w-full" />
          ) : selected.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground text-sm">
              {isAr ? "اختر مقياساً واحداً على الأقل" : "Select at least one metric"}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                />
                <Legend />
                {METRICS.filter(m => selected.includes(m.id)).map((m) => (
                  <Line
                    key={m.id}
                    type="monotone"
                    dataKey={m.id}
                    name={isAr ? m.labelAr : m.label}
                    stroke={m.color}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}