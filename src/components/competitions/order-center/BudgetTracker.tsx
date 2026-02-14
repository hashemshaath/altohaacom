import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  DollarSign, TrendingUp, TrendingDown, PieChart,
  AlertTriangle, CheckCircle, Package,
} from "lucide-react";
import { ORDER_CATEGORIES } from "./OrderCenterCategories";
import { toEnglishDigits } from "@/lib/formatNumber";

interface Props {
  competitionId: string;
  isOrganizer?: boolean;
}

interface CategoryBudget {
  category: string;
  label: string;
  labelAr: string;
  estimatedCost: number;
  itemCount: number;
  deliveredCount: number;
  sponsoredCount: number;
}

export function BudgetTracker({ competitionId, isOrganizer }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: lists } = useQuery({
    queryKey: ["budget-lists", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirement_lists")
        .select("id, category")
        .eq("competition_id", competitionId);
      if (error) throw error;
      return data;
    },
  });

  const { data: items } = useQuery({
    queryKey: ["budget-items", competitionId],
    queryFn: async () => {
      if (!lists?.length) return [];
      const { data, error } = await supabase
        .from("requirement_list_items")
        .select("id, list_id, estimated_cost, quantity, status")
        .in("list_id", lists.map((l) => l.id));
      if (error) throw error;
      return data;
    },
    enabled: !!lists?.length,
  });

  const { data: sponsorships } = useQuery({
    queryKey: ["budget-sponsorships", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirement_sponsorship_requests")
        .select("id, status, total_estimated_cost")
        .eq("competition_id", competitionId)
        .eq("status", "accepted");
      if (error) throw error;
      return data;
    },
  });

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    lists?.forEach((l) => map.set(l.id, l.category));
    return map;
  }, [lists]);

  const budgetByCategory = useMemo<CategoryBudget[]>(() => {
    if (!items || !lists) return [];

    const grouped = new Map<string, { estimated: number; count: number; delivered: number; sponsored: number }>();

    items.forEach((item) => {
      const cat = categoryMap.get(item.list_id) || "other";
      const prev = grouped.get(cat) || { estimated: 0, count: 0, delivered: 0, sponsored: 0 };
      const cost = (Number(item.estimated_cost) || 0) * (item.quantity || 1);
      grouped.set(cat, {
        estimated: prev.estimated + cost,
        count: prev.count + 1,
        delivered: prev.delivered + (item.status === "delivered" ? 1 : 0),
        sponsored: prev.sponsored + (item.status === "sponsored" ? 1 : 0),
      });
    });

    return Array.from(grouped.entries())
      .map(([cat, data]) => {
        const catDef = ORDER_CATEGORIES.find((c) => c.value === cat);
        return {
          category: cat,
          label: catDef?.label || cat,
          labelAr: catDef?.labelAr || cat,
          estimatedCost: data.estimated,
          itemCount: data.count,
          deliveredCount: data.delivered,
          sponsoredCount: data.sponsored,
        };
      })
      .sort((a, b) => b.estimatedCost - a.estimatedCost);
  }, [items, lists, categoryMap]);

  const totalEstimated = budgetByCategory.reduce((s, c) => s + c.estimatedCost, 0);
  const totalItems = items?.length || 0;
  const totalDelivered = items?.filter((i) => i.status === "delivered").length || 0;
  const totalSponsored = items?.filter((i) => i.status === "sponsored").length || 0;
  const sponsoredValue = sponsorships?.reduce((s, sp) => s + (Number(sp.total_estimated_cost) || 0), 0) || 0;
  const selfFunded = totalEstimated - sponsoredValue;
  const sponsorPercentage = totalEstimated > 0 ? Math.round((sponsoredValue / totalEstimated) * 100) : 0;

  const chartColors = [
    "bg-primary", "bg-chart-1", "bg-chart-2", "bg-chart-3",
    "bg-chart-4", "bg-chart-5", "bg-accent",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">{isAr ? "تتبع الميزانية" : "Budget Tracker"}</h3>
        <p className="text-xs text-muted-foreground">
          {isAr ? "تحليل التكاليف التقديرية والرعاية حسب الفئة" : "Estimated cost analysis & sponsorship breakdown by category"}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <DollarSign className="mx-auto mb-1 h-5 w-5 text-primary" />
            <p className="text-xl font-bold">${toEnglishDigits(totalEstimated.toLocaleString())}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{isAr ? "إجمالي التقدير" : "Total Estimated"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <TrendingUp className="mx-auto mb-1 h-5 w-5 text-chart-5" />
            <p className="text-xl font-bold">${toEnglishDigits(sponsoredValue.toLocaleString())}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{isAr ? "مغطى بالرعاية" : "Sponsored"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <TrendingDown className="mx-auto mb-1 h-5 w-5 text-chart-4" />
            <p className="text-xl font-bold">${selfFunded > 0 ? toEnglishDigits(selfFunded.toLocaleString()) : "0"}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{isAr ? "تمويل ذاتي" : "Self-Funded"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <PieChart className="mx-auto mb-1 h-5 w-5 text-chart-1" />
            <p className="text-xl font-bold">{toEnglishDigits(sponsorPercentage)}%</p>
            <p className="text-[10px] text-muted-foreground uppercase">{isAr ? "نسبة الرعاية" : "Sponsor Coverage"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Sponsorship Coverage Bar */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">{isAr ? "تغطية الرعاية" : "Sponsorship Coverage"}</p>
            <p className="text-sm font-bold text-primary">{toEnglishDigits(sponsorPercentage)}%</p>
          </div>
          <Progress value={sponsorPercentage} className="h-2.5" />
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>${toEnglishDigits(sponsoredValue.toLocaleString())} {isAr ? "رعاية" : "sponsored"}</span>
            <span>${toEnglishDigits(totalEstimated.toLocaleString())} {isAr ? "إجمالي" : "total"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card className="border-border/60">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            {isAr ? "التوزيع حسب الفئة" : "Breakdown by Category"}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {budgetByCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {isAr ? "لا توجد بيانات بعد" : "No data yet"}
            </p>
          ) : (
            <>
              {/* Visual bar chart */}
              <div className="mb-4 flex h-4 w-full overflow-hidden rounded-full bg-muted">
                {budgetByCategory.map((cat, i) => {
                  const pct = totalEstimated > 0 ? (cat.estimatedCost / totalEstimated) * 100 : 0;
                  if (pct < 1) return null;
                  return (
                    <div
                      key={cat.category}
                      className={`${chartColors[i % chartColors.length]} transition-all`}
                      style={{ width: `${pct}%` }}
                      title={`${cat.label}: $${toEnglishDigits(cat.estimatedCost.toLocaleString())} (${toEnglishDigits(pct.toFixed(1))}%)`}
                    />
                  );
                })}
              </div>

              {/* Category rows */}
              <div className="space-y-3">
                {budgetByCategory.map((cat, i) => {
                  const pct = totalEstimated > 0 ? (cat.estimatedCost / totalEstimated) * 100 : 0;
                  return (
                    <div key={cat.category}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${chartColors[i % chartColors.length]}`} />
                          <span className="text-sm font-medium">{isAr ? cat.labelAr : cat.label}</span>
                          <Badge variant="outline" className="text-[10px]">{cat.itemCount} {isAr ? "عنصر" : "items"}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">${toEnglishDigits(cat.estimatedCost.toLocaleString())}</span>
                          <span className="text-[10px] text-muted-foreground">({toEnglishDigits(pct.toFixed(1))}%)</span>
                        </div>
                      </div>
                      <div className="mt-1 ms-5 flex items-center gap-3 text-[10px] text-muted-foreground">
                        {cat.deliveredCount > 0 && (
                          <span className="flex items-center gap-0.5">
                            <CheckCircle className="h-2.5 w-2.5 text-chart-5" />
                            {cat.deliveredCount} {isAr ? "تم تسليمه" : "delivered"}
                          </span>
                        )}
                        {cat.sponsoredCount > 0 && (
                          <span className="flex items-center gap-0.5">
                            <TrendingUp className="h-2.5 w-2.5 text-chart-4" />
                            {cat.sponsoredCount} {isAr ? "برعاية" : "sponsored"}
                          </span>
                        )}
                        {cat.itemCount - cat.deliveredCount - cat.sponsoredCount > 0 && (
                          <span className="flex items-center gap-0.5">
                            <AlertTriangle className="h-2.5 w-2.5 text-muted-foreground" />
                            {cat.itemCount - cat.deliveredCount - cat.sponsoredCount} {isAr ? "معلق" : "pending"}
                          </span>
                        )}
                      </div>
                      {i < budgetByCategory.length - 1 && <Separator className="mt-3" />}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
