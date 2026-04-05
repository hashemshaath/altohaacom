import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Building2, Package, CreditCard, TrendingUp, Star, Users,
  ArrowRight, ArrowUp, ArrowDown, Minus,
} from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import { subDays, format } from "date-fns";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { CHART_COLORS, TOOLTIP_STYLE, BAR_RADIUS } from "@/lib/chartConfig";
import { supabase } from "@/integrations/supabase/client";

export const CompanyDashboardWidget = memo(function CompanyDashboardWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-company-dashboard"],
    queryFn: async () => {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const fourteenDaysAgo = subDays(new Date(), 14).toISOString();

      const [
        totalRes, activeRes,
        ordersThisWeek, ordersPrevWeek,
        topCompaniesRes,
        recentOrdersRes,
      ] = await Promise.all([
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("companies").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("company_orders").select("id, total_amount", { count: "exact" }).gte("created_at", sevenDaysAgo),
        supabase.from("company_orders").select("id", { count: "exact", head: true }).gte("created_at", fourteenDaysAgo).lt("created_at", sevenDaysAgo),
        supabase.from("companies").select("id, name, name_ar, type, status, total_reviews").order("total_reviews", { ascending: false }).limit(5),
        supabase.from("company_orders").select("created_at").gte("created_at", subDays(new Date(), 14).toISOString()).order("created_at", { ascending: true }),
      ]);

      const trendMap: Record<string, number> = {};
      for (let i = 0; i < 14; i++) {
        trendMap[format(subDays(new Date(), 13 - i), "MMM dd")] = 0;
      }
      (recentOrdersRes.data || []).forEach((o: { created_at: string }) => {
        const key = format(new Date(o.created_at), "MMM dd");
        if (trendMap[key] !== undefined) trendMap[key]++;
      });
      const ordersTrend = Object.entries(trendMap).map(([date, orders]) => ({ date, orders }));

      const thisWeekRevenue = (ordersThisWeek.data || []).reduce((sum: number, o: { total_amount: number | null }) => sum + (o.total_amount || 0), 0);

      return {
        totalCompanies: totalRes.count || 0,
        activeCompanies: activeRes.count || 0,
        ordersThisWeek: ordersThisWeek.count || 0,
        ordersPrevWeek: ordersPrevWeek.count || 0,
        thisWeekRevenue,
        topCompanies: topCompaniesRes.data || [],
        ordersTrend,
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return <Card><CardContent className="p-6"><Skeleton className="h-48 w-full rounded-xl" /></CardContent></Card>;
  }

  if (!data) return null;

  const orderDelta = data.ordersThisWeek - data.ordersPrevWeek;

  const kpiItems = [
    { icon: Building2, label: isAr ? "الشركات" : "Companies", value: data.totalCompanies, color: "text-chart-3", bg: "bg-chart-3/10" },
    { icon: Users, label: isAr ? "نشطة" : "Active", value: data.activeCompanies, color: "text-chart-2", bg: "bg-chart-2/10" },
    { icon: Package, label: isAr ? "طلبات الأسبوع" : "Weekly Orders", value: data.ordersThisWeek, color: "text-chart-4", bg: "bg-chart-4/10", delta: orderDelta },
    { icon: CreditCard, label: isAr ? "إيرادات الأسبوع" : "Weekly Revenue", value: data.thisWeekRevenue, color: "text-primary", bg: "bg-primary/10", isCurrency: true },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-chart-3/10">
            <Building2 className="h-4 w-4 text-chart-3" />
          </div>
          {isAr ? "لوحة الشركات" : "Company Dashboard"}
        </CardTitle>
        <Button variant="outline" size="sm" asChild className="text-xs gap-1.5">
          <Link to="/admin/companies">
            {isAr ? "عرض الكل" : "View All"} <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-2">
          {kpiItems.map((kpi, i) => (
            <div key={i} className="text-center p-2.5 rounded-xl border border-border/30 group transition-all duration-200 hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5">
              <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg mx-auto mb-1.5 transition-transform duration-200 group-hover:scale-110", kpi.bg)}>
                <kpi.icon className={cn("h-3.5 w-3.5", kpi.color)} />
              </div>
              <p className="text-sm font-bold tabular-nums">
                {typeof kpi.value === "number" ? (
                  <><AnimatedCounter value={kpi.value} />{kpi.isCurrency ? <span className="text-[9px] text-muted-foreground font-medium ms-0.5">SAR</span> : ""}</>
                ) : kpi.value}
              </p>
              <p className="text-[9px] text-muted-foreground font-medium mt-0.5">{kpi.label}</p>
              {kpi.delta !== undefined && (
                <Badge variant="outline" className={cn("text-[8px] mt-1", kpi.delta > 0 ? "text-chart-2 border-chart-2/30" : kpi.delta < 0 ? "text-destructive border-destructive/30" : "text-muted-foreground")}>
                  {kpi.delta > 0 ? <ArrowUp className="h-2 w-2 me-0.5" /> : kpi.delta < 0 ? <ArrowDown className="h-2 w-2 me-0.5" /> : <Minus className="h-2 w-2 me-0.5" />}
                  {Math.abs(kpi.delta)}
                </Badge>
              )}
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Orders trend */}
          <div>
            <p className="text-xs font-semibold mb-2 text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3" />
              {isAr ? "اتجاه الطلبات (14 يوم)" : "Orders Trend (14 days)"}
            </p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={data.ordersTrend}>
                <XAxis dataKey="date" {...X_AXIS_PROPS} interval="preserveStartEnd" />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="orders" fill={CHART_COLORS[2]} radius={BAR_RADIUS} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top companies */}
          <div>
            <p className="text-xs font-semibold mb-2 text-muted-foreground flex items-center gap-1.5">
              <Star className="h-3 w-3" />
              {isAr ? "أفضل الشركات" : "Top Companies"}
            </p>
            <div className="space-y-1.5">
              {data.topCompanies.length === 0 ? (
                <p className="text-[10px] text-muted-foreground text-center py-4">{isAr ? "لا توجد بيانات" : "No data"}</p>
              ) : (
                data.topCompanies.map((company, idx) => (
                  <div key={company.id} className="flex items-center justify-between p-2.5 rounded-xl border border-border/30 text-xs transition-all duration-200 hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5 group">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-bold text-muted-foreground tabular-nums w-4">{idx + 1}</span>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{isAr ? (company.name_ar || company.name) : company.name}</p>
                        <p className="text-[9px] text-muted-foreground capitalize">{company.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="h-3 w-3 text-chart-4 fill-chart-4" />
                      <span className="text-[9px] text-muted-foreground">({company.total_reviews || 0})</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
