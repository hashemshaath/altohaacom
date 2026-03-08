import { useMemo, memo } from "react";
import { CostEstimate, MODULE_TYPES, ESTIMATE_STATUS_CONFIG, type CostModuleType } from "@/hooks/useCostCenter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle,
  Trophy, ChefHat, Landmark, Calendar, FileText, BarChart3, Wallet,
} from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface Props {
  isAr: boolean;
  estimates: CostEstimate[];
}

const MODULE_COLORS: Record<string, string> = {
  competition: "hsl(var(--chart-1))",
  chefs_table: "hsl(var(--chart-2))",
  exhibition: "hsl(var(--chart-3))",
  event: "hsl(var(--chart-4))",
  project: "hsl(var(--chart-5))",
  other: "hsl(var(--muted-foreground))",
};

const MODULE_ICONS: Record<string, any> = {
  competition: Trophy, chefs_table: ChefHat, exhibition: Landmark,
  event: Calendar, project: FileText, other: BarChart3,
};

export function CostCenterBudgetTracking({ isAr, estimates }: Props) {
  const analytics = useMemo(() => {
    const approved = estimates.filter(e => e.status === "approved" || e.status === "invoiced");
    const invoiced = estimates.filter(e => e.status === "invoiced");
    const pending = estimates.filter(e => e.status === "pending_approval");

    // By module breakdown
    const byModule = Object.keys(MODULE_TYPES).map(key => {
      const moduleEstimates = estimates.filter(e => e.module_type === key);
      const approvedModule = moduleEstimates.filter(e => e.status === "approved" || e.status === "invoiced");
      return {
        module: key,
        label: isAr ? MODULE_TYPES[key as CostModuleType].ar : MODULE_TYPES[key as CostModuleType].en,
        totalEstimates: moduleEstimates.length,
        approvedCount: approvedModule.length,
        totalValue: moduleEstimates.reduce((s, e) => s + e.total_amount, 0),
        approvedValue: approvedModule.reduce((s, e) => s + e.total_amount, 0),
        invoicedValue: moduleEstimates.filter(e => e.status === "invoiced").reduce((s, e) => s + e.total_amount, 0),
      };
    }).filter(m => m.totalEstimates > 0);

    // By status breakdown for pie chart
    const byStatus = Object.entries(ESTIMATE_STATUS_CONFIG).map(([status, config]) => {
      const statusEstimates = estimates.filter(e => e.status === status);
      return {
        status,
        label: isAr ? config.ar : config.en,
        count: statusEstimates.length,
        value: statusEstimates.reduce((s, e) => s + e.total_amount, 0),
      };
    }).filter(s => s.count > 0);

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = d.toLocaleString(isAr ? "ar" : "en", { month: "short", year: "2-digit" });
      const monthEstimates = estimates.filter(e => e.created_at.startsWith(monthKey));
      monthlyTrend.push({
        month: monthLabel,
        count: monthEstimates.length,
        value: monthEstimates.reduce((s, e) => s + e.total_amount, 0),
        approved: monthEstimates.filter(e => e.status === "approved" || e.status === "invoiced").reduce((s, e) => s + e.total_amount, 0),
      });
    }

    const totalBudget = approved.reduce((s, e) => s + e.total_amount, 0);
    const totalInvoiced = invoiced.reduce((s, e) => s + e.total_amount, 0);
    const pendingValue = pending.reduce((s, e) => s + e.total_amount, 0);
    const utilizationRate = totalBudget > 0 ? Math.round((totalInvoiced / totalBudget) * 100) : 0;

    return { byModule, byStatus, monthlyTrend, totalBudget, totalInvoiced, pendingValue, utilizationRate, approved, invoiced, pending };
  }, [estimates, isAr]);

  const STATUS_COLORS = [
    "hsl(var(--muted-foreground))", // draft
    "hsl(var(--chart-4))", // pending
    "hsl(var(--chart-5))", // approved
    "hsl(var(--destructive))", // rejected
    "hsl(var(--primary))", // invoiced
    "hsl(var(--muted-foreground))", // cancelled
  ];

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-chart-5" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {isAr ? "الميزانية المعتمدة" : "Approved Budget"}
              </span>
            </div>
            <AnimatedCounter value={analytics.totalBudget} className="text-xl font-black tabular-nums text-chart-5" format />
            <p className="text-[10px] text-muted-foreground">{analytics.approved.length} {isAr ? "تقدير" : "estimates"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {isAr ? "المفوتر" : "Invoiced"}
              </span>
            </div>
            <AnimatedCounter value={analytics.totalInvoiced} className="text-xl font-black tabular-nums text-primary" format />
            <p className="text-[10px] text-muted-foreground">{analytics.invoiced.length} {isAr ? "فاتورة" : "invoices"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-chart-4" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {isAr ? "قيد الانتظار" : "Pending Value"}
              </span>
            </div>
            <AnimatedCounter value={analytics.pendingValue} className="text-xl font-black tabular-nums text-chart-4" format />
            <p className="text-[10px] text-muted-foreground">{analytics.pending.length} {isAr ? "تقدير" : "estimates"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {isAr ? "معدل الاستخدام" : "Utilization Rate"}
              </span>
            </div>
            <AnimatedCounter value={analytics.utilizationRate} className="text-xl font-black tabular-nums" suffix="%" />
            <Progress value={analytics.utilizationRate} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Module Budget Breakdown */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{isAr ? "توزيع الميزانية حسب القسم" : "Budget by Module"}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="text-[10px]">
                  <TableHead>{isAr ? "القسم" : "Module"}</TableHead>
                  <TableHead className="text-end">{isAr ? "التقديرات" : "Est."}</TableHead>
                  <TableHead className="text-end">{isAr ? "الإجمالي" : "Total"}</TableHead>
                  <TableHead className="text-end">{isAr ? "المعتمد" : "Approved"}</TableHead>
                  <TableHead className="text-end">{isAr ? "المفوتر" : "Invoiced"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.byModule.map(mod => {
                  const Icon = MODULE_ICONS[mod.module] || FileText;
                  return (
                    <TableRow key={mod.module} className="text-xs">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          {mod.label}
                        </div>
                      </TableCell>
                      <TableCell className="text-end tabular-nums">{mod.totalEstimates}</TableCell>
                      <TableCell className="text-end tabular-nums"><AnimatedCounter value={Math.round(mod.totalValue)} /></TableCell>
                      <TableCell className="text-end tabular-nums text-chart-5"><AnimatedCounter value={Math.round(mod.approvedValue)} /></TableCell>
                      <TableCell className="text-end tabular-nums text-primary"><AnimatedCounter value={Math.round(mod.invoicedValue)} /></TableCell>
                    </TableRow>
                  );
                })}
                {analytics.byModule.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{isAr ? "لا توجد بيانات" : "No data"}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Status Distribution Pie */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{isAr ? "توزيع الحالات" : "Status Distribution"}</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.byStatus.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={analytics.byStatus} dataKey="count" nameKey="label" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={2}>
                      {analytics.byStatus.map((_, i) => (
                        <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => v} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 flex-1">
                  {analytics.byStatus.map((s, i) => (
                    <div key={s.status} className="flex items-center gap-2 text-xs">
                      <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[i % STATUS_COLORS.length] }} />
                      <span className="flex-1 truncate">{s.label}</span>
                      <span className="font-bold tabular-nums">{s.count}</span>
                      <AnimatedCounter value={Math.round(s.value)} className="text-muted-foreground tabular-nums" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground text-sm">{isAr ? "لا توجد بيانات" : "No data"}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{isAr ? "الاتجاه الشهري" : "Monthly Trend"}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics.monthlyTrend} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                formatter={(v: number) => v.toLocaleString()}
              />
              <Bar dataKey="value" name={isAr ? "الإجمالي" : "Total"} fill="hsl(var(--muted-foreground) / 0.3)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="approved" name={isAr ? "المعتمد" : "Approved"} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
