import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Building2, CheckCircle, Clock, Star, TrendingUp, DollarSign } from "lucide-react";

export function CompanyAnalyticsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: stats } = useQuery({
    queryKey: ["company-analytics-widget"],
    queryFn: async () => {
      const [totalRes, activeRes, pendingRes, suspendedRes, typeBreakdown, recentOrders] = await Promise.all([
        supabase.from("companies").select("*", { count: "exact", head: true }),
        supabase.from("companies").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("companies").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("companies").select("*", { count: "exact", head: true }).eq("status", "suspended"),
        supabase.from("companies").select("type"),
        supabase.from("company_orders").select("id, total_amount, status").order("created_at", { ascending: false }).limit(100),
      ]);

      // Type distribution
      const byType: Record<string, number> = {};
      (typeBreakdown.data || []).forEach((c: any) => { byType[c.type] = (byType[c.type] || 0) + 1; });

      // Order revenue
      const orders = recentOrders.data || [];
      const totalRevenue = orders.reduce((sum: number, o: any) => sum + (Number(o.total_amount) || 0), 0);
      const paidOrders = orders.filter((o: any) => o.status === "paid" || o.status === "delivered").length;

      return {
        total: totalRes.count || 0,
        active: activeRes.count || 0,
        pending: pendingRes.count || 0,
        suspended: suspendedRes.count || 0,
        byType,
        totalRevenue,
        paidOrders,
        totalOrders: orders.length,
      };
    },
    staleTime: 3 * 60 * 1000,
  });

  if (!stats) return null;

  const activeRate = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;

  const typeLabels: Record<string, { en: string; ar: string; color: string }> = {
    sponsor: { en: "Sponsors", ar: "رعاة", color: "text-chart-3" },
    supplier: { en: "Suppliers", ar: "موردون", color: "text-primary" },
    partner: { en: "Partners", ar: "شركاء", color: "text-chart-4" },
    vendor: { en: "Vendors", ar: "بائعون", color: "text-chart-2" },
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          {isAr ? "تحليلات الشركات" : "Company Analytics"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Building2, value: stats.total, label: isAr ? "الكل" : "Total", color: "text-primary" },
            { icon: CheckCircle, value: stats.active, label: isAr ? "نشط" : "Active", color: "text-chart-2" },
            { icon: Clock, value: stats.pending, label: isAr ? "معلق" : "Pending", color: "text-chart-4" },
            { icon: DollarSign, value: `${Math.round(stats.totalRevenue / 1000)}K`, label: isAr ? "الإيرادات" : "Revenue", color: "text-chart-3" },
          ].map((s) => (
            <div key={s.label} className="text-center p-2 rounded-lg bg-muted/50">
              <s.icon className={`h-3.5 w-3.5 mx-auto ${s.color} mb-1`} />
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{isAr ? "نسبة النشاط" : "Active Rate"}</span>
            <span className="font-medium">{activeRate}%</span>
          </div>
          <Progress value={activeRate} className="h-1.5" />
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {isAr ? "حسب النوع" : "By Type"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(stats.byType).map(([type, count]) => {
              const label = typeLabels[type];
              return (
                <Badge key={type} variant="outline" className={`text-[10px] ${label?.color || ""}`}>
                  {isAr ? label?.ar || type : label?.en || type}: {count as number}
                </Badge>
              );
            })}
          </div>
        </div>

        {stats.pending > 0 && (
          <div className="p-2 rounded-lg bg-chart-4/10 text-xs text-chart-4 flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            {isAr
              ? `${stats.pending} شركة في انتظار المراجعة`
              : `${stats.pending} companies awaiting review`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
