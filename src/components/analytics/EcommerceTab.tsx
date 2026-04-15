import { X_AXIS_PROPS } from "@/lib/chartConfig";
import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Separator } from "@/components/ui/separator";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  CHART_COLORS, TOOLTIP_STYLE, X_AXIS_PROPS, Y_AXIS_PROPS,
  GRID_PROPS, LEGEND_STYLE, CHART_HEIGHT, getNoDataText,
} from "@/lib/chartConfig";
import {
  Eye, ShoppingCart, CreditCard, DollarSign, PackageX,
  Target, Gauge, Percent, Zap, ArrowDownRight,
} from "lucide-react";
import { EXTRA_COLORS, type EcomMetrics } from "./eventsMonitoringTypes";

interface EcommerceTabProps {
  isAr: boolean;
  ecomMetrics: EcomMetrics;
}

const NoData = ({ isAr }: { isAr: boolean }) => (
  <p className="py-12 text-center text-muted-foreground text-sm">{getNoDataText(isAr)}</p>
);

export const EcommerceTab = memo(function EcommerceTab({ isAr, ecomMetrics }: EcommerceTabProps) {
  const ecomKpis = [
    { label: isAr ? "مشاهدات المنتج" : "Product Views", value: ecomMetrics.productViews, icon: Eye, color: "text-chart-1" },
    { label: isAr ? "إضافة للسلة" : "Add to Cart", value: ecomMetrics.addToCartEvents, icon: ShoppingCart, color: "text-chart-2" },
    { label: isAr ? "بدء الدفع" : "Checkout Started", value: ecomMetrics.beginCheckoutEvents, icon: CreditCard, color: "text-chart-3" },
    { label: isAr ? "عمليات شراء" : "Purchases", value: ecomMetrics.purchaseEvents, icon: DollarSign, color: "text-chart-4" },
    { label: isAr ? "سلات متروكة" : "Abandoned Carts", value: ecomMetrics.activeCarts, icon: PackageX, color: "text-destructive" },
    { label: isAr ? "معدل الاسترداد" : "Recovery Rate", value: ecomMetrics.recoveryRate, icon: Target, color: "text-chart-2", suffix: "%" },
    { label: isAr ? "إجمالي الإيرادات" : "Revenue", value: Math.round(ecomMetrics.totalRevenue), icon: DollarSign, color: "text-primary", prefix: "SAR " },
    { label: isAr ? "متوسط الطلب" : "AOV", value: ecomMetrics.avgOrderValue, icon: Gauge, color: "text-chart-5", prefix: "SAR " },
  ];

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {ecomKpis.map((kpi, i) => (
          <Card key={i} className="group hover:shadow-md transition-all duration-300">
            <CardContent className="p-2.5 text-center">
              <kpi.icon className={`h-3.5 w-3.5 mx-auto mb-0.5 ${kpi.color}`} />
              <div className="text-sm font-bold leading-tight">
                {kpi.prefix && <span className="text-xs text-muted-foreground">{kpi.prefix}</span>}
                <AnimatedCounter value={kpi.value} />
                {kpi.suffix && <span className="text-xs text-muted-foreground ms-0.5">{kpi.suffix}</span>}
              </div>
              <div className="text-xs text-muted-foreground leading-tight mt-0.5">{kpi.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Conversion Funnel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              {isAr ? "قمع التحويل" : "Conversion Funnel"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ecomMetrics.funnel.some(f => f.value > 0) ? (
              <div className="space-y-3">
                {ecomMetrics.funnel.map((stage, i) => {
                  const maxVal = Math.max(1, ecomMetrics.funnel[0].value);
                  const pct = maxVal > 0 ? Math.round((stage.value / maxVal) * 100) : 0;
                  const dropOff = i > 0 && ecomMetrics.funnel[i - 1].value > 0
                    ? Math.round(((ecomMetrics.funnel[i - 1].value - stage.value) / ecomMetrics.funnel[i - 1].value) * 100)
                    : 0;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium">{isAr ? stage.stageAr : stage.stage}</span>
                        <span className="text-muted-foreground">{stage.value} <span className="text-xs">({pct}%)</span></span>
                      </div>
                      <div className="relative h-7 bg-muted rounded-lg overflow-hidden">
                        <div
                          className="absolute inset-y-0 start-0 rounded-lg transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: EXTRA_COLORS[i % EXTRA_COLORS.length], opacity: 0.85 }}
                        />
                      </div>
                      {i > 0 && dropOff > 0 && (
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-destructive/70">
                          <ArrowDownRight className="h-2.5 w-2.5" />
                          {dropOff}% {isAr ? "انخفاض" : "drop-off"}
                        </div>
                      )}
                    </div>
                  );
                })}
                <Separator />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{isAr ? "معدل التحويل الإجمالي" : "Overall Conversion"}: <strong className="text-foreground">{ecomMetrics.overallConversion}%</strong></span>
                  <span>{isAr ? "سلة → دفع" : "Cart → Pay"}: <strong className="text-foreground">{ecomMetrics.checkoutToPayRate}%</strong></span>
                </div>
              </div>
            ) : <NoData isAr={isAr} />}
          </CardContent>
        </Card>

        {/* Revenue Timeline */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-chart-2" />
              {isAr ? "الإيرادات بمرور الوقت" : "Revenue Over Time"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ecomMetrics.revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={CHART_HEIGHT.md}>
                <AreaChart data={ecomMetrics.revenueData}>
                  <CartesianGrid {...GRID_PROPS} />
                  <XAxis dataKey="date" {...X_AXIS_PROPS} />
                  <YAxis {...Y_AXIS_PROPS} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`SAR ${v}`, isAr ? "الإيرادات" : "Revenue"]} />
                  <Area type="monotone" dataKey="revenue" stroke={CHART_COLORS[1]} fill={CHART_COLORS[1]} fillOpacity={0.15} strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <NoData isAr={isAr} />}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Abandoned Cart Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <PackageX className="h-4 w-4 text-destructive" />
              {isAr ? "السلات المتروكة" : "Abandoned Carts"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ecomMetrics.cartStatus.length > 0 ? (
              <div className="space-y-3">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={ecomMetrics.cartStatus.map(c => ({ name: isAr ? c.nameAr : c.name, value: c.value }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={35} paddingAngle={3} strokeWidth={0}>
                      <Cell fill="hsl(var(--destructive))" />
                      <Cell fill="hsl(var(--chart-2))" />
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ ...LEGEND_STYLE, fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center text-xs text-muted-foreground">
                  {isAr ? "قيمة متروكة" : "Abandoned Value"}: <strong className="text-destructive">SAR {Math.round(ecomMetrics.abandonedValue)}</strong>
                </div>
              </div>
            ) : <NoData isAr={isAr} />}
          </CardContent>
        </Card>

        {/* Conversion Rates */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Percent className="h-4 w-4 text-chart-4" />
              {isAr ? "معدلات التحويل" : "Conversion Rates"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: isAr ? "مشاهدة → سلة" : "View → Cart", value: ecomMetrics.productViews > 0 ? Math.round((ecomMetrics.addToCartEvents / ecomMetrics.productViews) * 100) : 0 },
              { label: isAr ? "سلة → دفع" : "Cart → Checkout", value: ecomMetrics.cartToCheckoutRate },
              { label: isAr ? "دفع → شراء" : "Checkout → Purchase", value: ecomMetrics.checkoutToPayRate },
              { label: isAr ? "إجمالي التحويل" : "Overall", value: ecomMetrics.overallConversion },
            ].map((r, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className="font-bold">{r.value}%</span>
                </div>
                <Progress value={r.value} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Other Conversions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-chart-3" />
              {isAr ? "تحويلات أخرى" : "Other Conversions"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: isAr ? "تسجيل مسابقات" : "Competition Registrations", value: ecomMetrics.competitionRegs, icon: "🏆" },
              { label: isAr ? "أحداث العضوية" : "Membership Events", value: ecomMetrics.membershipEvents, icon: "👑" },
              { label: isAr ? "حجوزات" : "Bookings", value: ecomMetrics.bookingEvents, icon: "📅" },
              { label: isAr ? "إزالة من السلة" : "Cart Removals", value: ecomMetrics.removeFromCartEvents, icon: "🗑️" },
              { label: isAr ? "قوائم المنتجات" : "List Views", value: ecomMetrics.listViews, icon: "📋" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                <span className="flex items-center gap-1.5">
                  <span>{item.icon}</span>
                  <span className="text-muted-foreground">{item.label}</span>
                </span>
                <Badge variant="secondary" className="text-xs font-bold">{item.value}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
});
