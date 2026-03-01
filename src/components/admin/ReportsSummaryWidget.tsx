import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileBarChart, Users, Trophy, Package, FileText, TrendingUp, Download, Landmark } from "lucide-react";
import { useCSVExport } from "@/hooks/useCSVExport";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface ModuleStat {
  icon: React.ElementType;
  label: string;
  total: number;
  thisWeek: number;
  color: string;
}

export function ReportsSummaryWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["reports-summary-widget"],
    queryFn: async () => {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

      const [
        { count: totalUsers }, { count: weekUsers },
        { count: totalComps }, { count: weekComps },
        { count: totalOrders }, { count: weekOrders },
        { count: totalArticles }, { count: weekArticles },
        { count: totalExhibitions }, { count: weekExhibitions },
        { count: totalCerts }, { count: weekCerts },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("competitions").select("*", { count: "exact", head: true }),
        supabase.from("competitions").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("company_orders").select("*", { count: "exact", head: true }),
        supabase.from("company_orders").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("articles").select("*", { count: "exact", head: true }),
        supabase.from("articles").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("exhibitions").select("*", { count: "exact", head: true }),
        supabase.from("exhibitions").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("certificates").select("*", { count: "exact", head: true }),
        supabase.from("certificates").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
      ]);

      return {
        users: { total: totalUsers || 0, week: weekUsers || 0 },
        comps: { total: totalComps || 0, week: weekComps || 0 },
        orders: { total: totalOrders || 0, week: weekOrders || 0 },
        articles: { total: totalArticles || 0, week: weekArticles || 0 },
        exhibitions: { total: totalExhibitions || 0, week: weekExhibitions || 0 },
        certs: { total: totalCerts || 0, week: weekCerts || 0 },
      };
    },
    staleTime: 60000,
  });

  if (!data) return null;

  const modules: ModuleStat[] = [
    { icon: Users, label: isAr ? "المستخدمين" : "Users", total: data.users.total, thisWeek: data.users.week, color: "text-primary" },
    { icon: Trophy, label: isAr ? "المسابقات" : "Competitions", total: data.comps.total, thisWeek: data.comps.week, color: "text-chart-2" },
    { icon: Package, label: isAr ? "الطلبات" : "Orders", total: data.orders.total, thisWeek: data.orders.week, color: "text-chart-3" },
    { icon: FileText, label: isAr ? "المقالات" : "Articles", total: data.articles.total, thisWeek: data.articles.week, color: "text-chart-4" },
    { icon: Landmark, label: isAr ? "المعارض" : "Exhibitions", total: data.exhibitions.total, thisWeek: data.exhibitions.week, color: "text-chart-5" },
    { icon: FileBarChart, label: isAr ? "الشهادات" : "Certificates", total: data.certs.total, thisWeek: data.certs.week, color: "text-chart-1" },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileBarChart className="h-4 w-4 text-chart-2" />
            {isAr ? "ملخص التقارير الأسبوعي" : "Weekly Reports Summary"}
          </CardTitle>
          <Badge variant="outline" className="text-[9px]">{isAr ? "آخر 7 أيام" : "Last 7 days"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {modules.map((m, i) => (
            <div key={i} className="p-2.5 rounded-xl bg-muted/30 border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <m.icon className={`h-3.5 w-3.5 ${m.color}`} />
                <span className="text-[10px] text-muted-foreground">{m.label}</span>
              </div>
              <AnimatedCounter value={m.total} className="text-lg font-bold" />
              <div className="flex items-center gap-1 mt-0.5">
                <TrendingUp className="h-2.5 w-2.5 text-chart-2" />
                <span className="text-[9px] text-chart-2 font-medium">+<AnimatedCounter value={m.thisWeek} className="inline" /> {isAr ? "هذا الأسبوع" : "this week"}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
