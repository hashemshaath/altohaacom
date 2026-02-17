import { useState, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { FileText, Download, Printer, Users, Trophy, ShoppingCart, DollarSign, TrendingUp, TrendingDown, BarChart3, Activity } from "lucide-react";
import { format, subDays } from "date-fns";
import { ar } from "date-fns/locale";

export function ExecutiveSummary() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const reportRef = useRef<HTMLDivElement>(null);
  const [period, setPeriod] = useState("30d");

  const { data: stats, isLoading } = useQuery({
    queryKey: ["executive-summary", period],
    queryFn: async () => {
      const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
      const now = new Date();
      const since = subDays(now, days).toISOString();
      const prevSince = subDays(now, days * 2).toISOString();

      const [
        totalUsersRes, newUsersRes, prevUsersRes,
        competitionsRes, prevCompetitionsRes,
        ordersRes, prevOrdersRes,
        regsRes, postsRes,
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", since),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", prevSince).lt("created_at", since),
        supabase.from("competitions").select("*", { count: "exact", head: true }).gte("created_at", since),
        supabase.from("competitions").select("*", { count: "exact", head: true }).gte("created_at", prevSince).lt("created_at", since),
        supabase.from("shop_orders").select("*", { count: "exact", head: true }).gte("created_at", since),
        supabase.from("shop_orders").select("*", { count: "exact", head: true }).gte("created_at", prevSince).lt("created_at", since),
        supabase.from("competition_registrations").select("*", { count: "exact", head: true }).gte("registered_at", since),
        supabase.from("articles").select("*", { count: "exact", head: true }).gte("created_at", since),
      ]);

      const calcChange = (current: number, previous: number) =>
        previous > 0 ? Math.round(((current - previous) / previous) * 100) : current > 0 ? 100 : 0;

      const newUsers = newUsersRes.count || 0;
      const prevUsers = prevUsersRes.count || 0;
      const comps = competitionsRes.count || 0;
      const prevComps = prevCompetitionsRes.count || 0;
      const orders = ordersRes.count || 0;
      const prevOrders = prevOrdersRes.count || 0;

      return {
        totalUsers: totalUsersRes.count || 0,
        newUsers,
        userChange: calcChange(newUsers, prevUsers),
        competitions: comps,
        competitionChange: calcChange(comps, prevComps),
        orders,
        orderChange: calcChange(orders, prevOrders),
        registrations: regsRes.count || 0,
        posts: postsRes.count || 0,
        generatedAt: new Date().toISOString(),
      };
    },
  });

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow || !reportRef.current) return;

    printWindow.document.write(`
      <html dir="${isAr ? "rtl" : "ltr"}">
      <head>
        <title>${isAr ? "الملخص التنفيذي" : "Executive Summary"} - Altohaa</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
          body { padding: 40px; color: #1a1a1a; }
          .header { text-align: center; margin-bottom: 32px; border-bottom: 3px solid #7c3aed; padding-bottom: 16px; }
          .header h1 { font-size: 24px; color: #7c3aed; }
          .header p { font-size: 12px; color: #666; margin-top: 4px; }
          .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
          .kpi-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
          .kpi-card .label { font-size: 12px; color: #666; }
          .kpi-card .value { font-size: 28px; font-weight: 700; margin-top: 4px; }
          .kpi-card .change { font-size: 11px; margin-top: 2px; }
          .positive { color: #16a34a; }
          .negative { color: #dc2626; }
          .section { margin-bottom: 20px; }
          .section h2 { font-size: 16px; margin-bottom: 8px; color: #374151; }
          .metrics-row { display: flex; gap: 24px; }
          .metric-item { flex: 1; }
          .metric-item .label { font-size: 11px; color: #666; }
          .metric-item .value { font-size: 18px; font-weight: 600; }
          .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #999; text-align: center; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${isAr ? "الملخص التنفيذي — منصة الطهاة" : "Executive Summary — Altohaa Platform"}</h1>
          <p>${isAr ? "الفترة:" : "Period:"} ${period === "7d" ? "7" : period === "30d" ? "30" : "90"} ${isAr ? "يوم" : "days"} | ${isAr ? "تاريخ الإنشاء:" : "Generated:"} ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: isAr ? ar : undefined })}</p>
        </div>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="label">${isAr ? "إجمالي المستخدمين" : "Total Users"}</div>
            <div class="value">${stats?.totalUsers?.toLocaleString() || 0}</div>
          </div>
          <div class="kpi-card">
            <div class="label">${isAr ? "مستخدمون جدد" : "New Users"}</div>
            <div class="value">${stats?.newUsers?.toLocaleString() || 0}</div>
            <div class="change ${(stats?.userChange || 0) >= 0 ? "positive" : "negative"}">${(stats?.userChange || 0) >= 0 ? "↑" : "↓"} ${Math.abs(stats?.userChange || 0)}%</div>
          </div>
          <div class="kpi-card">
            <div class="label">${isAr ? "الطلبات" : "Orders"}</div>
            <div class="value">${stats?.orders?.toLocaleString() || 0}</div>
            <div class="change ${(stats?.orderChange || 0) >= 0 ? "positive" : "negative"}">${(stats?.orderChange || 0) >= 0 ? "↑" : "↓"} ${Math.abs(stats?.orderChange || 0)}%</div>
          </div>
        </div>
        <div class="section">
          <h2>${isAr ? "مقاييس النشاط" : "Activity Metrics"}</h2>
          <div class="metrics-row">
            <div class="metric-item"><div class="label">${isAr ? "المسابقات" : "Competitions"}</div><div class="value">${stats?.competitions || 0}</div></div>
            <div class="metric-item"><div class="label">${isAr ? "المشاركات" : "Registrations"}</div><div class="value">${stats?.registrations || 0}</div></div>
            <div class="metric-item"><div class="label">${isAr ? "المنشورات" : "Posts"}</div><div class="value">${stats?.posts || 0}</div></div>
          </div>
        </div>
        <div class="footer">${isAr ? "تقرير آلي من منصة الطهاة — سري" : "Auto-generated report by Altohaa Platform — Confidential"}</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const kpis = [
    { label: isAr ? "إجمالي المستخدمين" : "Total Users", value: stats?.totalUsers || 0, icon: Users, change: null },
    { label: isAr ? "مستخدمون جدد" : "New Users", value: stats?.newUsers || 0, icon: TrendingUp, change: stats?.userChange },
    { label: isAr ? "المسابقات" : "Competitions", value: stats?.competitions || 0, icon: Trophy, change: stats?.competitionChange },
    { label: isAr ? "الطلبات" : "Orders", value: stats?.orders || 0, icon: ShoppingCart, change: stats?.orderChange },
    { label: isAr ? "المشاركات" : "Registrations", value: stats?.registrations || 0, icon: Activity, change: null },
    { label: isAr ? "المنشورات" : "Posts", value: stats?.posts || 0, icon: BarChart3, change: null },
  ];

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{isAr ? "الملخص التنفيذي" : "Executive Summary"}</h3>
          <p className="text-sm text-muted-foreground">
            {isAr ? "تقرير شامل قابل للطباعة بالمؤشرات الرئيسية" : "Comprehensive printable report with key KPIs"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">{isAr ? "٧ أيام" : "7 days"}</SelectItem>
              <SelectItem value="30d">{isAr ? "٣٠ يوم" : "30 days"}</SelectItem>
              <SelectItem value="90d">{isAr ? "٩٠ يوم" : "90 days"}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            {isAr ? "طباعة PDF" : "Print PDF"}
          </Button>
        </div>
      </div>

      {/* Report Preview */}
      <div ref={reportRef}>
        {/* Header */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4 text-center">
            <h2 className="text-xl font-bold">{isAr ? "الملخص التنفيذي — منصة الطهاة" : "Executive Summary — Altohaa Platform"}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr ? "الفترة:" : "Period:"} {period === "7d" ? "7" : period === "30d" ? "30" : "90"} {isAr ? "يوم" : "days"} |{" "}
              {isAr ? "تاريخ الإنشاء:" : "Generated:"} {format(new Date(), "dd/MM/yyyy HH:mm", { locale: isAr ? ar : undefined })}
            </p>
          </CardContent>
        </Card>

        {/* KPI Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
          {kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <Card key={i}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-3xl font-bold">{kpi.value.toLocaleString()}</p>
                  {kpi.change !== null && kpi.change !== undefined && (
                    <div className={`flex items-center gap-1 mt-1 text-xs ${kpi.change >= 0 ? "text-chart-5" : "text-destructive"}`}>
                      {kpi.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Math.abs(kpi.change)}% {isAr ? "مقارنة بالفترة السابقة" : "vs previous period"}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Insights */}
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{isAr ? "ملاحظات رئيسية" : "Key Observations"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {stats && (
              <>
                <p>• {isAr
                  ? `انضم ${stats.newUsers} مستخدم جديد خلال الفترة المحددة`
                  : `${stats.newUsers} new users joined during the selected period`
                }</p>
                <p>• {isAr
                  ? `تم إنشاء ${stats.competitions} مسابقة مع ${stats.registrations} مشاركة`
                  : `${stats.competitions} competitions created with ${stats.registrations} registrations`
                }</p>
                <p>• {isAr
                  ? `تم تقديم ${stats.orders} طلب عبر المتجر`
                  : `${stats.orders} orders placed through the shop`
                }</p>
                <p>• {isAr
                  ? `نشر المستخدمون ${stats.posts} منشور في المجتمع`
                  : `Users published ${stats.posts} community posts`
                }</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
