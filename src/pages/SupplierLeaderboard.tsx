import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SupplierBadges } from "@/components/supplier/SupplierBadges";
import { countryFlag } from "@/lib/countryFlag";
import {
  Trophy, Building2, Star, Package, Eye, ArrowLeft, Medal,
} from "lucide-react";

type RankBy = "rating" | "products" | "views";

export default function SupplierLeaderboard() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isAr = language === "ar";
  const [rankBy, setRankBy] = useState<RankBy>("rating");

  const { data: suppliers = [] } = useQuery({
    queryKey: ["supplierLeaderboard"],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, name_ar, logo_url, country_code, city, is_verified, supplier_category, founded_year, specializations")
        .eq("status", "active")
        .eq("is_pro_supplier", true);
      return data || [];
    },
  });

  const { data: reviewData = [] } = useQuery({
    queryKey: ["leaderboardReviews"],
    queryFn: async () => {
      const { data } = await supabase
        .from("supplier_reviews")
        .select("company_id, rating")
        .eq("status", "published");
      return data || [];
    },
  });

  const { data: productData = [] } = useQuery({
    queryKey: ["leaderboardProducts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_catalog")
        .select("company_id")
        .eq("is_active", true);
      return data || [];
    },
  });

  const { data: viewData = [] } = useQuery({
    queryKey: ["leaderboardViews"],
    queryFn: async () => {
      const { data } = await supabase
        .from("supplier_profile_views")
        .select("company_id");
      return data || [];
    },
  });

  const ranked = useMemo(() => {
    // Build stats maps
    const reviewStats: Record<string, { count: number; avg: number }> = {};
    const reviewsByCompany: Record<string, number[]> = {};
    reviewData.forEach((r: any) => {
      if (!reviewsByCompany[r.company_id]) reviewsByCompany[r.company_id] = [];
      reviewsByCompany[r.company_id].push(r.rating);
    });
    Object.entries(reviewsByCompany).forEach(([id, ratings]) => {
      reviewStats[id] = { count: ratings.length, avg: ratings.reduce((s, r) => s + r, 0) / ratings.length };
    });

    const productCounts: Record<string, number> = {};
    productData.forEach((p: any) => {
      productCounts[p.company_id] = (productCounts[p.company_id] || 0) + 1;
    });

    const viewCounts: Record<string, number> = {};
    viewData.forEach((v: any) => {
      viewCounts[v.company_id] = (viewCounts[v.company_id] || 0) + 1;
    });

    return suppliers
      .map((s: any) => ({
        ...s,
        reviewCount: reviewStats[s.id]?.count || 0,
        avgRating: reviewStats[s.id]?.avg || 0,
        productCount: productCounts[s.id] || 0,
        viewCount: viewCounts[s.id] || 0,
      }))
      .sort((a, b) => {
        if (rankBy === "rating") return b.avgRating - a.avgRating || b.reviewCount - a.reviewCount;
        if (rankBy === "products") return b.productCount - a.productCount;
        return b.viewCount - a.viewCount;
      })
      .slice(0, 50);
  }, [suppliers, reviewData, productData, viewData, rankBy]);

  const getMedal = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  return (
    <PageShell
      title={isAr ? "ترتيب الموردين" : "Supplier Leaderboard"}
      description={isAr ? "أفضل الموردين المحترفين" : "Top professional suppliers ranked"}
      container={false}
      padding="none"
    >
        <div className="container py-6 md:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate("/pro-suppliers")}>
                <ArrowLeft className="me-2 h-4 w-4" />{isAr ? "الدليل" : "Directory"}
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-chart-4" />
                  {isAr ? "ترتيب الموردين" : "Supplier Leaderboard"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isAr ? "أفضل الموردين المحترفين في المنصة" : "Top professional suppliers on the platform"}
                </p>
              </div>
            </div>
            <Select value={rankBy} onValueChange={(v) => setRankBy(v as RankBy)}>
              <SelectTrigger className="w-44 rounded-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">
                  <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5" />{isAr ? "التقييم" : "Rating"}</span>
                </SelectItem>
                <SelectItem value="products">
                  <span className="flex items-center gap-1.5"><Package className="h-3.5 w-3.5" />{isAr ? "المنتجات" : "Products"}</span>
                </SelectItem>
                <SelectItem value="views">
                  <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" />{isAr ? "المشاهدات" : "Views"}</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {ranked.map((s, index) => (
              <Card
                key={s.id}
                interactive
                className={`cursor-pointer rounded-xl transition-all ${
                  index < 3 ? "border-chart-4/30" : ""
                }`}
                onClick={() => navigate(`/pro-suppliers/${s.id}`)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    index < 3 ? "bg-chart-4/10 text-chart-4" : "bg-muted text-muted-foreground"
                  }`}>
                    {getMedal(index)}
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    {s.logo_url ? (
                      <img src={s.logo_url} className="h-7 w-7 object-contain" alt={s.name} />
                    ) : (
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{isAr && s.name_ar ? s.name_ar : s.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {s.country_code && (
                        <span className="text-xs text-muted-foreground">{countryFlag(s.country_code)} {s.city || s.country_code}</span>
                      )}
                      <SupplierBadges isVerified={s.is_verified} reviewCount={s.reviewCount} avgRating={s.avgRating} productCount={s.productCount} foundedYear={s.founded_year} variant="compact" />
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-chart-4 text-chart-4" />
                        <span className="font-semibold">{s.avgRating > 0 ? s.avgRating.toFixed(1) : "—"}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{s.reviewCount} {isAr ? "تقييم" : "reviews"}</span>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1">
                        <Package className="h-3.5 w-3.5 text-primary" />
                        <span className="font-semibold">{s.productCount}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{isAr ? "منتج" : "products"}</span>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-semibold">{s.viewCount}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{isAr ? "مشاهدة" : "views"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {ranked.length === 0 && (
            <div className="py-20 text-center">
              <Trophy className="mx-auto mb-4 h-16 w-16 text-muted-foreground/20" />
              <p className="text-muted-foreground">{isAr ? "لا توجد بيانات كافية" : "Not enough data yet"}</p>
            </div>
          )}
        </div>
    </PageShell>
  );
}
