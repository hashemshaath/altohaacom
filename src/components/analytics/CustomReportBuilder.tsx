import { useState, useCallback, memo } from "react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import {
  FileText,
  Download,
  Plus,
  Trash2,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Trophy,
  MessageSquare,
  Award,
  Newspaper,
  GraduationCap,
  DollarSign,
  Save,
  Play,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RPieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

interface MetricOption {
  id: string;
  label: string;
  labelAr: string;
  icon: React.ElementType;
  table: string;
  color: string;
}

const AVAILABLE_METRICS: MetricOption[] = [
  { id: "users", label: "Users", labelAr: "المستخدمين", icon: Users, table: "profiles", color: "primary" },
  { id: "competitions", label: "Competitions", labelAr: "المسابقات", icon: Trophy, table: "competitions", color: "chart-2" },
  { id: "articles", label: "Articles", labelAr: "المقالات", icon: Newspaper, table: "articles", color: "chart-3" },
  { id: "certificates", label: "Certificates", labelAr: "الشهادات", icon: Award, table: "certificates", color: "chart-4" },
  { id: "messages", label: "Messages", labelAr: "الرسائل", icon: MessageSquare, table: "messages", color: "chart-5" },
  { id: "masterclasses", label: "Masterclasses", labelAr: "الدورات", icon: GraduationCap, table: "masterclasses", color: "primary" },
];

type ChartType = "bar" | "pie" | "line";

interface SavedReport {
  name: string;
  metrics: string[];
  chartType: ChartType;
}

export function CustomReportBuilder() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["users", "competitions"]);
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [reportName, setReportName] = useState("");
  const [savedReports, setSavedReports] = useState<SavedReport[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("custom-reports") || "[]");
    } catch { return []; }
  });

  const toggleMetric = (id: string) => {
    setSelectedMetrics(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ["custom-report", selectedMetrics],
    queryFn: async () => {
      const results: Record<string, { total: number; monthly: { month: string; count: number }[] }> = {};

      await Promise.all(
        selectedMetrics.map(async (metricId) => {
          const metric = AVAILABLE_METRICS.find(m => m.id === metricId);
          if (!metric) return;

          const [
            { count: total },
            { data: records },
          ] = await Promise.all([
            supabase.from(metric.table as any).select("*", { count: "exact", head: true }),
            supabase.from(metric.table as any).select("created_at").order("created_at", { ascending: true }),
          ]);

          const months: Record<string, number> = {};
          (records || []).forEach((r: any) => {
            const m = r.created_at?.substring(0, 7);
            if (m) months[m] = (months[m] || 0) + 1;
          });

          const monthly = Object.entries(months)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-12)
            .map(([month, count]) => ({ month, count }));

          results[metricId] = { total: total || 0, monthly };
        })
      );

      return results;
    },
    enabled: selectedMetrics.length > 0,
    staleTime: 1000 * 60 * 2,
  });

  const saveReport = useCallback(() => {
    if (!reportName.trim()) {
      toast({ title: isAr ? "أدخل اسم التقرير" : "Enter report name", variant: "destructive" });
      return;
    }
    const report: SavedReport = { name: reportName, metrics: selectedMetrics, chartType };
    const updated = [...savedReports, report];
    setSavedReports(updated);
    localStorage.setItem("custom-reports", JSON.stringify(updated));
    setReportName("");
    toast({ title: isAr ? "تم حفظ التقرير" : "Report saved" });
  }, [reportName, selectedMetrics, chartType, savedReports, isAr]);

  const loadReport = (report: SavedReport) => {
    setSelectedMetrics(report.metrics);
    setChartType(report.chartType);
    toast({ title: isAr ? "تم تحميل التقرير" : "Report loaded" });
  };

  const deleteReport = (index: number) => {
    const updated = savedReports.filter((_, i) => i !== index);
    setSavedReports(updated);
    localStorage.setItem("custom-reports", JSON.stringify(updated));
  };

  const exportCSV = useCallback(() => {
    if (!reportData) return;
    const BOM = "\uFEFF";
    let csv = BOM + "Metric,Total,Month,Count\n";
    selectedMetrics.forEach(id => {
      const metric = AVAILABLE_METRICS.find(m => m.id === id);
      const data = reportData[id];
      if (!metric || !data) return;
      data.monthly.forEach(m => {
        csv += `${metric.label},${data.total},${m.month},${m.count}\n`;
      });
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `custom-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: isAr ? "تم التصدير" : "Exported" });
  }, [reportData, selectedMetrics, isAr]);

  // Build chart data for multi-metric comparison
  const chartData = (() => {
    if (!reportData) return [];
    // Merge all months
    const allMonths = new Set<string>();
    selectedMetrics.forEach(id => {
      reportData[id]?.monthly.forEach(m => allMonths.add(m.month));
    });
    return Array.from(allMonths).sort().map(month => {
      const row: Record<string, any> = { month };
      selectedMetrics.forEach(id => {
        const metric = AVAILABLE_METRICS.find(m => m.id === id);
        row[metric?.label || id] = reportData[id]?.monthly.find(m => m.month === month)?.count || 0;
      });
      return row;
    });
  })();

  // Pie data from totals
  const pieData = selectedMetrics.map(id => {
    const metric = AVAILABLE_METRICS.find(m => m.id === id);
    return { name: isAr ? (metric?.labelAr || id) : (metric?.label || id), value: reportData?.[id]?.total || 0 };
  });

  const chartTypes: { type: ChartType; icon: React.ElementType; label: string }[] = [
    { type: "bar", icon: BarChart3, label: isAr ? "أعمدة" : "Bar" },
    { type: "line", icon: TrendingUp, label: isAr ? "خطي" : "Line" },
    { type: "pie", icon: PieChart, label: isAr ? "دائري" : "Pie" },
  ];

  return (
    <div className="space-y-6 mt-4">
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Sidebar - Metric Selection */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{isAr ? "اختر المقاييس" : "Select Metrics"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {AVAILABLE_METRICS.map(metric => (
                <div key={metric.id} className="flex items-center gap-3">
                  <Checkbox
                    id={metric.id}
                    checked={selectedMetrics.includes(metric.id)}
                    onCheckedChange={() => toggleMetric(metric.id)}
                  />
                  <Label htmlFor={metric.id} className="flex items-center gap-2 cursor-pointer text-sm">
                    <metric.icon className={`h-3.5 w-3.5 text-${metric.color}`} />
                    {isAr ? metric.labelAr : metric.label}
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Chart Type */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{isAr ? "نوع الرسم" : "Chart Type"}</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              {chartTypes.map(ct => (
                <Button
                  key={ct.type}
                  variant={chartType === ct.type ? "default" : "outline"}
                  size="sm"
                  className="gap-1.5 flex-1"
                  onClick={() => setChartType(ct.type)}
                >
                  <ct.icon className="h-3.5 w-3.5" />
                  {ct.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Save/Load */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{isAr ? "حفظ التقرير" : "Save Report"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder={isAr ? "اسم التقرير" : "Report name"}
                  value={reportName}
                  onChange={e => setReportName(e.target.value)}
                  className="text-sm"
                />
                <Button size="sm" onClick={saveReport} className="gap-1 shrink-0">
                  <Save className="h-3.5 w-3.5" />
                </Button>
              </div>
              {savedReports.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  {savedReports.map((r, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-xs justify-start flex-1 h-8"
                        onClick={() => loadReport(r)}
                      >
                        <Play className="h-3 w-3" />
                        {r.name}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteReport(i)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Chart Area */}
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">
                {selectedMetrics.length} {isAr ? "مقاييس" : "metrics"}
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5" disabled={!reportData}>
              <Download className="h-3.5 w-3.5" />
              {isAr ? "تصدير CSV" : "Export CSV"}
            </Button>
          </div>

          {/* Totals Summary */}
          {reportData && (
            <div className="grid gap-3 sm:grid-cols-3">
              {selectedMetrics.slice(0, 6).map((id, i) => {
                const metric = AVAILABLE_METRICS.find(m => m.id === id);
                if (!metric) return null;
                return (
                  <Card key={id} className={`border-s-[3px] border-s-${metric.color}`}>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">{isAr ? metric.labelAr : metric.label}</p>
                        <metric.icon className={`h-4 w-4 text-${metric.color}`} />
                      </div>
                      <AnimatedCounter value={reportData[id]?.total || 0} className="mt-1 text-2xl" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Chart */}
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : selectedMetrics.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {isAr ? "اختر مقاييس لبناء تقريرك" : "Select metrics to build your report"}
                  </p>
                </div>
              ) : chartType === "pie" ? (
                <ResponsiveContainer width="100%" height={400}>
                  <RPieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={140} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RPieChart>
                </ResponsiveContainer>
              ) : chartType === "line" ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                    <Legend />
                    {selectedMetrics.map((id, i) => {
                      const metric = AVAILABLE_METRICS.find(m => m.id === id);
                      return (
                        <Line key={id} type="monotone" dataKey={metric?.label || id} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                    <Legend />
                    {selectedMetrics.map((id, i) => {
                      const metric = AVAILABLE_METRICS.find(m => m.id === id);
                      return (
                        <Bar key={id} dataKey={metric?.label || id} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
                      );
                    })}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
