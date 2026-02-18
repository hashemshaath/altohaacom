import { useMemo, useState } from "react";
import { CostEstimate, MODULE_TYPES, ESTIMATE_STATUS_CONFIG, type CostModuleType } from "@/hooks/useCostCenter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from "recharts";
import {
  Printer, Download, FileSpreadsheet, Trophy, ChefHat, Landmark,
  Calendar, FileText, BarChart3, DollarSign,
} from "lucide-react";
import { format } from "date-fns";

interface Props {
  isAr: boolean;
  estimates: CostEstimate[];
}

const PIE_COLORS = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--primary))",
  "hsl(var(--muted-foreground))",
];

export function CostCenterReports({ isAr, estimates }: Props) {
  const [reportModule, setReportModule] = useState("all");
  const [reportPeriod, setReportPeriod] = useState("all");

  const filteredEstimates = useMemo(() => {
    let result = estimates;
    if (reportModule !== "all") result = result.filter(e => e.module_type === reportModule);
    if (reportPeriod !== "all") {
      const now = new Date();
      const start = new Date();
      if (reportPeriod === "month") start.setMonth(now.getMonth() - 1);
      if (reportPeriod === "quarter") start.setMonth(now.getMonth() - 3);
      if (reportPeriod === "year") start.setFullYear(now.getFullYear() - 1);
      result = result.filter(e => new Date(e.created_at) >= start);
    }
    return result;
  }, [estimates, reportModule, reportPeriod]);

  const reportData = useMemo(() => {
    const approved = filteredEstimates.filter(e => e.status === "approved" || e.status === "invoiced");
    const totalValue = filteredEstimates.reduce((s, e) => s + e.total_amount, 0);
    const approvedValue = approved.reduce((s, e) => s + e.total_amount, 0);
    const avgEstimate = filteredEstimates.length > 0 ? Math.round(totalValue / filteredEstimates.length) : 0;
    const approvalRate = filteredEstimates.length > 0 ? Math.round((approved.length / filteredEstimates.length) * 100) : 0;

    // Top 5 highest estimates
    const topEstimates = [...filteredEstimates].sort((a, b) => b.total_amount - a.total_amount).slice(0, 5);

    // Module pie chart
    const modulePie = Object.keys(MODULE_TYPES).map(key => ({
      name: isAr ? MODULE_TYPES[key as CostModuleType].ar : MODULE_TYPES[key as CostModuleType].en,
      value: filteredEstimates.filter(e => e.module_type === key).reduce((s, e) => s + e.total_amount, 0),
    })).filter(m => m.value > 0);

    return { totalValue, approvedValue, avgEstimate, approvalRate, topEstimates, modulePie };
  }, [filteredEstimates, isAr]);

  return (
    <div className="space-y-4">
      {/* Report Controls */}
      <div className="flex items-center gap-3 flex-wrap print:hidden">
        <Select value={reportModule} onValueChange={setReportModule}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "جميع الأقسام" : "All Modules"}</SelectItem>
            {Object.entries(MODULE_TYPES).map(([k, v]) => (
              <SelectItem key={k} value={k}>{isAr ? v.ar : v.en}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={reportPeriod} onValueChange={setReportPeriod}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "كل الفترات" : "All Time"}</SelectItem>
            <SelectItem value="month">{isAr ? "آخر شهر" : "Last Month"}</SelectItem>
            <SelectItem value="quarter">{isAr ? "آخر ربع" : "Last Quarter"}</SelectItem>
            <SelectItem value="year">{isAr ? "آخر سنة" : "Last Year"}</SelectItem>
          </SelectContent>
        </Select>
        <div className="ms-auto flex gap-1.5">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" />{isAr ? "طباعة" : "Print"}
          </Button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: isAr ? "إجمالي القيمة" : "Total Value", value: reportData.totalValue.toLocaleString(), suffix: "SAR", color: "text-primary" },
          { label: isAr ? "القيمة المعتمدة" : "Approved Value", value: reportData.approvedValue.toLocaleString(), suffix: "SAR", color: "text-chart-5" },
          { label: isAr ? "متوسط التقدير" : "Avg Estimate", value: reportData.avgEstimate.toLocaleString(), suffix: "SAR", color: "" },
          { label: isAr ? "معدل الموافقة" : "Approval Rate", value: `${reportData.approvalRate}`, suffix: "%", color: "text-chart-5" },
        ].map((kpi, i) => (
          <Card key={i} className="border-border/40">
            <CardContent className="p-4 text-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
              <p className={`text-xl font-black tabular-nums mt-1 ${kpi.color}`}>
                {kpi.value} <span className="text-xs text-muted-foreground">{kpi.suffix}</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Module Value Distribution */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{isAr ? "توزيع القيمة حسب القسم" : "Value by Module"}</CardTitle>
          </CardHeader>
          <CardContent>
            {reportData.modulePie.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={reportData.modulePie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={2}>
                      {reportData.modulePie.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => v.toLocaleString()} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 flex-1">
                  {reportData.modulePie.map((s, i) => (
                    <div key={s.name} className="flex items-center gap-2 text-xs">
                      <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="flex-1 truncate">{s.name}</span>
                      <span className="font-bold tabular-nums">{s.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground text-sm">{isAr ? "لا توجد بيانات" : "No data"}</div>
            )}
          </CardContent>
        </Card>

        {/* Top Estimates */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{isAr ? "أعلى التقديرات" : "Top Estimates"}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {reportData.topEstimates.length > 0 ? (
              <Table>
                <TableBody>
                  {reportData.topEstimates.map((est, i) => (
                    <TableRow key={est.id} className="text-xs">
                      <TableCell className="py-2.5 font-bold text-muted-foreground w-6">{i + 1}</TableCell>
                      <TableCell className="py-2.5">
                        <p className="font-medium truncate max-w-[200px]">{est.title}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{est.estimate_number}</p>
                      </TableCell>
                      <TableCell className="py-2.5 text-end">
                        <Badge variant="outline" className="text-[9px]">
                          {isAr ? MODULE_TYPES[est.module_type].ar : MODULE_TYPES[est.module_type].en}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2.5 text-end font-black tabular-nums text-primary">
                        {est.total_amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-muted-foreground text-sm">{isAr ? "لا توجد بيانات" : "No data"}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full Estimates Table (for print) */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            {isAr ? "جدول التقديرات الكامل" : "Full Estimates Report"}
            <Badge variant="outline" className="text-[10px]">{filteredEstimates.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="text-[10px]">
                <TableHead>{isAr ? "الرقم" : "#"}</TableHead>
                <TableHead>{isAr ? "العنوان" : "Title"}</TableHead>
                <TableHead>{isAr ? "القسم" : "Module"}</TableHead>
                <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                <TableHead className="text-end">{isAr ? "المبلغ الفرعي" : "Subtotal"}</TableHead>
                <TableHead className="text-end">{isAr ? "الضريبة" : "Tax"}</TableHead>
                <TableHead className="text-end">{isAr ? "الإجمالي" : "Total"}</TableHead>
                <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEstimates.map(est => (
                <TableRow key={est.id} className="text-xs">
                  <TableCell className="py-2 font-mono text-muted-foreground">{est.estimate_number}</TableCell>
                  <TableCell className="py-2 font-medium">{est.title}</TableCell>
                  <TableCell className="py-2">
                    <Badge variant="outline" className="text-[9px]">
                      {isAr ? MODULE_TYPES[est.module_type].ar : MODULE_TYPES[est.module_type].en}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2">
                    <Badge variant="secondary" className="text-[9px]">
                      {isAr ? (ESTIMATE_STATUS_CONFIG as any)[est.status]?.ar : (ESTIMATE_STATUS_CONFIG as any)[est.status]?.en}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2 text-end tabular-nums">{est.subtotal.toLocaleString()}</TableCell>
                  <TableCell className="py-2 text-end tabular-nums">{est.tax_amount.toLocaleString()}</TableCell>
                  <TableCell className="py-2 text-end tabular-nums font-bold">{est.total_amount.toLocaleString()}</TableCell>
                  <TableCell className="py-2 tabular-nums">{format(new Date(est.created_at), "MMM d, yyyy")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
