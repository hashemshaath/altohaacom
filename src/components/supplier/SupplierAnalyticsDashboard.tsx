import { useMemo, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Package, MessageSquare, Star, Eye, TrendingUp, Heart, Download } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export const SupplierAnalyticsDashboard = memo(function SupplierAnalyticsDashboard() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { companyId } = useCompanyAccess();

  const { data: products = [] } = useQuery({
    queryKey: ["supplierAnalyticsProducts", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase.from("company_catalog").select("id, is_active, in_stock").eq("company_id", companyId);
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["supplierAnalyticsReviews", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from("supplier_reviews")
        .select("id, rating, created_at")
        .eq("company_id", companyId)
        .eq("status", "published");
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: inquiries = [] } = useQuery({
    queryKey: ["supplierAnalyticsInquiries", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from("company_communications")
        .select("id, created_at, status")
        .eq("company_id", companyId)
        .eq("direction", "inbound")
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: profileViews = [] } = useQuery({
    queryKey: ["supplierAnalyticsViews", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from("supplier_profile_views")
        .select("id, viewed_at")
        .eq("company_id", companyId)
        .order("viewed_at", { ascending: false })
        .limit(500);
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: wishlists = [] } = useQuery({
    queryKey: ["supplierAnalyticsWishlists", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from("supplier_wishlists")
        .select("id, created_at")
        .eq("company_id", companyId);
      return data || [];
    },
    enabled: !!companyId,
  });

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const activeProducts = products.filter((p: any) => p.is_active).length;
    const inStockProducts = products.filter((p: any) => p.in_stock).length;
    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "—";
    const totalReviews = reviews.length;
    const totalInquiries = inquiries.length;
    const unreadInquiries = inquiries.filter((i: any) => i.status === "unread").length;
    const totalViews = profileViews.length;
    const totalWishlists = wishlists.length;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentReviews = reviews.filter((r: any) => new Date(r.created_at) > thirtyDaysAgo).length;
    const recentInquiries = inquiries.filter((i: any) => new Date(i.created_at) > thirtyDaysAgo).length;
    const recentViews = profileViews.filter((v: any) => new Date(v.viewed_at) > thirtyDaysAgo).length;

    const ratingDist = [5, 4, 3, 2, 1].map(s => ({
      star: s,
      count: reviews.filter((r: any) => r.rating === s).length,
      pct: reviews.length > 0 ? Math.round((reviews.filter((r: any) => r.rating === s).length / reviews.length) * 100) : 0,
    }));

    return { totalProducts, activeProducts, inStockProducts, avgRating, totalReviews, totalInquiries, unreadInquiries, totalViews, totalWishlists, recentReviews, recentInquiries, recentViews, ratingDist };
  }, [products, reviews, inquiries, profileViews, wishlists]);

  const statCards = [
    { icon: Eye, label: isAr ? "المشاهدات" : "Views", value: stats.totalViews, sub: isAr ? `${stats.recentViews} آخر 30 يوم` : `${stats.recentViews} last 30 days`, color: "text-primary" },
    { icon: Package, label: isAr ? "المنتجات" : "Products", value: stats.totalProducts, sub: isAr ? `${stats.activeProducts} نشط` : `${stats.activeProducts} active`, color: "text-chart-2" },
    { icon: Star, label: isAr ? "التقييم" : "Rating", value: stats.avgRating, sub: isAr ? `${stats.totalReviews} تقييم` : `${stats.totalReviews} reviews`, color: "text-chart-4" },
    { icon: Heart, label: isAr ? "المفضلة" : "Saved", value: stats.totalWishlists, sub: isAr ? "مرة حفظ" : "times saved", color: "text-destructive" },
    { icon: MessageSquare, label: isAr ? "الاستفسارات" : "Inquiries", value: stats.totalInquiries, sub: isAr ? `${stats.unreadInquiries} غير مقروء` : `${stats.unreadInquiries} unread`, color: "text-chart-5" },
    { icon: TrendingUp, label: isAr ? "آخر 30 يوم" : "Last 30 Days", value: stats.recentReviews + stats.recentInquiries + stats.recentViews, sub: isAr ? `${stats.recentViews} مشاهدة · ${stats.recentReviews} تقييم · ${stats.recentInquiries} استفسار` : `${stats.recentViews} views · ${stats.recentReviews} reviews · ${stats.recentInquiries} inquiries`, color: "text-chart-1" },
  ];

  const exportCSV = () => {
    const bom = "\uFEFF";
    const headers = ["Metric", "Value", "Details"];
    const rows = statCards.map((s) => [s.label, String(s.value), s.sub]);
    const csv = bom + [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `supplier-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            {isAr ? "تحليلات المورد" : "Supplier Analytics"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? "نظرة عامة على أداء ملفك التعريفي" : "Overview of your supplier profile performance"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="me-1.5 h-3.5 w-3.5" />
          {isAr ? "تصدير CSV" : "Export CSV"}
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((s, i) => (
          <Card key={i} className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <s.icon className={`h-5 w-5 ${s.color}`} />
                <Badge variant="outline" className="text-[9px]">{s.label}</Badge>
              </div>
              <p className="mt-3 text-3xl font-bold">{typeof s.value === "number" ? <AnimatedCounter value={s.value} /> : s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Rating Distribution */}
        <Card className="rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-chart-4" />
              {isAr ? "توزيع التقييمات" : "Rating Distribution"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.ratingDist.map(({ star, count, pct }) => (
              <div key={star} className="flex items-center gap-3 text-sm">
                <span className="w-4 font-medium">{star}</span>
                <Star className="h-3.5 w-3.5 fill-chart-4 text-chart-4" />
                <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-chart-4 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-10 text-end text-xs text-muted-foreground">{count} ({pct}%)</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Product Status */}
        <Card className="rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              {isAr ? "حالة المنتجات" : "Product Status"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{isAr ? "إجمالي المنتجات" : "Total Products"}</span>
               <span className="text-sm font-semibold">{stats.totalProducts}</span>
             </div>
             <div className="flex items-center justify-between">
               <span className="text-sm text-muted-foreground">{isAr ? "نشط" : "Active"}</span>
               <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20 text-xs">{stats.activeProducts}</Badge>
             </div>
             <div className="flex items-center justify-between">
               <span className="text-sm text-muted-foreground">{isAr ? "متوفر" : "In Stock"}</span>
               <Badge className="bg-chart-2/10 text-chart-2 border-chart-2/20 text-xs">{stats.inStockProducts}</Badge>
             </div>
             <div className="flex items-center justify-between">
               <span className="text-sm text-muted-foreground">{isAr ? "نفد المخزون" : "Out of Stock"}</span>
               <Badge variant="destructive" className="text-xs">{stats.totalProducts - stats.inStockProducts}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});
