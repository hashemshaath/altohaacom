import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdBanner } from "@/components/ads/AdBanner";
import { SupplierBadges } from "@/components/supplier/SupplierBadges";
import { countryFlag } from "@/lib/countryFlag";
import {
  Building2, Search, ChefHat, UtensilsCrossed, Package, Shirt,
  Wrench, Boxes, Grid3X3, ArrowRight, Sparkles,
  Factory, Globe, ArrowUpDown, Scale, Trophy, Star, Crown,
  TrendingUp, Award, CheckCircle2, Shield, Zap
} from "lucide-react";

const SUPPLIER_CATEGORIES = [
  { value: "all", en: "All", ar: "الكل", icon: Grid3X3 },
  { value: "equipment", en: "Equipment", ar: "معدات", icon: Wrench },
  { value: "food", en: "Food & Ingredients", ar: "أغذية ومكونات", icon: UtensilsCrossed },
  { value: "supplies", en: "Supplies", ar: "مستلزمات", icon: Boxes },
  { value: "clothing", en: "Uniforms & Clothing", ar: "أزياء وملابس", icon: Shirt },
  { value: "packaging", en: "Packaging", ar: "تغليف", icon: Package },
  { value: "accessories", en: "Accessories & Tools", ar: "إكسسوارات وأدوات", icon: ChefHat },
];

type SortOption = "featured" | "name" | "newest";

export default function ProSuppliers() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [countryFilter, setCountryFilter] = useState("all");

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["proSuppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, name_ar, type, logo_url, city, country_code, description, description_ar, classifications, is_verified, tagline, tagline_ar, supplier_category, specializations, cover_image_url, created_at, featured_order")
        .eq("status", "active")
        .eq("is_pro_supplier", true)
        .order("featured_order", { ascending: true, nullsFirst: false })
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const availableCountries = useMemo(() => {
    const codes = new Set(companies.map((c) => c.country_code).filter(Boolean));
    return Array.from(codes) as string[];
  }, [companies]);

  const filteredCompanies = useMemo(() => {
    let result = [...companies];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((c) =>
        c.name?.toLowerCase().includes(s) || c.name_ar?.toLowerCase().includes(s) || c.description?.toLowerCase().includes(s)
      );
    }
    if (category !== "all") {
      result = result.filter((c) => c.supplier_category === category);
    }
    if (countryFilter !== "all") {
      result = result.filter((c) => c.country_code === countryFilter);
    }
    if (sortBy === "name") {
      result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return result;
  }, [companies, search, category, countryFilter, sortBy]);

  // Featured companies (top 6 with featured_order)
  const featuredCompanies = useMemo(() =>
    companies.filter(c => c.featured_order != null && c.featured_order > 0).slice(0, 6),
  [companies]);

  const { data: catalogCounts = {} } = useQuery({
    queryKey: ["supplierCatalogCounts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_catalog")
        .select("company_id")
        .eq("is_active", true);
      const counts: Record<string, number> = {};
      (data || []).forEach((r) => {
        counts[r.company_id] = (counts[r.company_id] || 0) + 1;
      });
      return counts;
    },
    staleTime: 1000 * 60 * 5,
  });

  const [compareIds, setCompareIds] = useState<string[]>([]);
  const toggleCompare = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const verifiedCount = companies.filter(c => c.is_verified).length;

  return (
    <PageShell
      title={isAr ? "دليل الموردين المحترفين — Altoha" : "Pro Chef Suppliers Directory — Altoha"}
      description={isAr ? "اكتشف أفضل موردي المنتجات الاحترافية للطهاة حول العالم" : "Discover the best professional product suppliers for chefs worldwide"}
      seoProps={{ keywords: isAr ? "موردين طهي, موردين أغذية, معدات مطاعم" : "culinary suppliers, food suppliers, restaurant equipment" }}
      container={false}
      padding="none"
    >
      {/* ═══ Hero ═══ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/8 via-background to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.06),transparent_70%)]" />
        <div className="container relative py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground backdrop-blur-sm">
              <Factory className="h-3.5 w-3.5 text-primary" />
              {isAr ? "دليل الموردين المحترفين" : "Professional Suppliers Directory"}
            </div>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl lg:text-6xl">
              {isAr ? (
                <>موردو <span className="text-primary">الشيفات</span> المحترفين</>
              ) : (
                <>Pro Chef <span className="text-primary">Suppliers</span></>
              )}
            </h1>
            <p className="mt-4 text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {isAr
                ? "اكتشف الشركات الرائدة المتخصصة في تقديم أفضل المنتجات والأدوات للطهاة المحترفين — من المعدات إلى المكونات"
                : "Discover leading companies specializing in the finest products and tools for professional chefs — from equipment to ingredients"}
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button variant="outline" size="sm" className="rounded-full gap-1.5" onClick={() => navigate("/pro-suppliers/leaderboard")}>
                <Trophy className="h-3.5 w-3.5 text-chart-4" />
                {isAr ? "ترتيب الموردين" : "Leaderboard"}
              </Button>
              <Button variant="outline" size="sm" className="rounded-full gap-1.5" onClick={() => navigate("/for-companies")}>
                <Building2 className="h-3.5 w-3.5" />
                {isAr ? "سجّل شركتك" : "Register Company"}
              </Button>
            </div>
          </div>

          {/* Stats Strip */}
          <div className="mx-auto mt-10 max-w-3xl grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Building2, num: companies.length, en: "Companies", ar: "شركة", color: "text-primary bg-primary/10" },
              { icon: CheckCircle2, num: verifiedCount, en: "Verified", ar: "موثقة", color: "text-chart-5 bg-chart-5/10" },
              { icon: Globe, num: availableCountries.length, en: "Countries", ar: "دولة", color: "text-chart-3 bg-chart-3/10" },
              { icon: Package, num: SUPPLIER_CATEGORIES.length - 1, en: "Categories", ar: "تصنيف", color: "text-chart-4 bg-chart-4/10" },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 rounded-2xl border border-border/50 bg-background p-4">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.color}`}>
                  <s.icon className="h-4 w-4" />
                </div>
                <span className="text-xl font-black tabular-nums">{s.num}</span>
                <span className="text-[11px] text-muted-foreground font-medium">{isAr ? s.ar : s.en}</span>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="mx-auto mt-8 max-w-xl">
            <div className="relative">
              <Search className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={isAr ? "ابحث عن شركة أو منتج..." : "Search companies or products..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 rounded-xl ps-11 shadow-sm"
              />
            </div>
          </div>

          {/* Category Filters */}
          <div className="mx-auto mt-6 flex max-w-4xl flex-wrap justify-center gap-2">
            {SUPPLIER_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = category === cat.value;
              return (
                <Button
                  key={cat.value}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  className="rounded-full gap-1.5 active:scale-[0.98]"
                  onClick={() => setCategory(cat.value)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {isAr ? cat.ar : cat.en}
                </Button>
              );
            })}
          </div>

          {/* Sort & Country */}
          <div className="mx-auto mt-4 flex max-w-xl justify-center gap-3">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-40 h-9 text-xs rounded-full">
                <ArrowUpDown className="me-1.5 h-3 w-3" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">{isAr ? "مميز" : "Featured"}</SelectItem>
                <SelectItem value="name">{isAr ? "الاسم" : "Name"}</SelectItem>
                <SelectItem value="newest">{isAr ? "الأحدث" : "Newest"}</SelectItem>
              </SelectContent>
            </Select>
            {availableCountries.length > 1 && (
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-40 h-9 text-xs rounded-full">
                  <Globe className="me-1.5 h-3 w-3" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "كل البلدان" : "All Countries"}</SelectItem>
                  {availableCountries.map((cc) => (
                    <SelectItem key={cc} value={cc}>{countryFlag(cc)} {cc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Compare Bar */}
          {compareIds.length > 0 && (
            <div className="mx-auto mt-6 flex max-w-xl items-center justify-center gap-3">
              <Badge variant="secondary" className="text-xs">{compareIds.length} {isAr ? "مختار" : "selected"}</Badge>
              <Button size="sm" className="rounded-full gap-1.5" disabled={compareIds.length < 2} onClick={() => navigate(`/pro-suppliers/compare?ids=${compareIds.join(",")}`)}>
                <Scale className="h-3.5 w-3.5" />
                {isAr ? "قارن الآن" : "Compare Now"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setCompareIds([])}>{isAr ? "مسح" : "Clear"}</Button>
            </div>
          )}
        </div>
      </section>

      {/* ═══ Featured / Premium Suppliers ═══ */}
      {featuredCompanies.length > 0 && (
        <section className="bg-muted/30 border-y border-border/30">
          <div className="container py-12 md:py-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-4/10">
                  <Crown className="h-5 w-5 text-chart-4" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-black">{isAr ? "الشركات المتميزة" : "Featured Partners"}</h2>
                  <p className="text-xs text-muted-foreground">{isAr ? "شركاء موثوقون ومعتمدون" : "Trusted & verified partners"}</p>
                </div>
              </div>
              <Badge variant="outline" className="gap-1 text-xs">
                <Star className="h-3 w-3 text-chart-4" />
                {isAr ? "شريك مميز" : "Premium"}
              </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredCompanies.map((company) => {
                const productCount = catalogCounts[company.id] || 0;
                return (
                  <Card
                    key={company.id}
                    interactive
                    className="group cursor-pointer overflow-hidden rounded-2xl border-chart-4/20 bg-gradient-to-br from-chart-4/5 via-background to-background transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-chart-4/40"
                    onClick={() => navigate(`/pro-suppliers/${company.id}`)}
                  >
                    <div className="relative h-28 bg-gradient-to-br from-chart-4/15 to-primary/10">
                      {company.cover_image_url && (
                        <img src={company.cover_image_url} className="absolute inset-0 h-full w-full object-cover opacity-30" alt={company.name} loading="lazy" />
                      )}
                      <div className="absolute top-3 end-3">
                        <Badge className="bg-chart-4 text-white gap-1 text-[10px]">
                          <Crown className="h-3 w-3" />
                          {isAr ? "متميز" : "Featured"}
                        </Badge>
                      </div>
                      <div className="absolute -bottom-7 start-5">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-background bg-card shadow-lg ring-2 ring-chart-4/20">
                          {company.logo_url ? (
                            <img loading="lazy" src={company.logo_url} className="h-9 w-9 object-contain" alt={company.name} />
                          ) : (
                            <Building2 className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>
                    <CardContent className="pt-9 pb-5">
                      <h3 className="font-bold text-sm truncate">{isAr && company.name_ar ? company.name_ar : company.name}</h3>
                      {(company.tagline || company.tagline_ar) && (
                        <p className="mt-0.5 text-[11px] text-primary/80 truncate">{isAr && company.tagline_ar ? company.tagline_ar : company.tagline}</p>
                      )}
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {company.is_verified && (
                          <Badge variant="secondary" className="text-[10px] gap-0.5 bg-chart-5/10 text-chart-5 border-chart-5/20">
                            <CheckCircle2 className="h-3 w-3" /> {isAr ? "موثق" : "Verified"}
                          </Badge>
                        )}
                        {company.supplier_category && (
                          <Badge variant="outline" className="text-[10px]">
                            {SUPPLIER_CATEGORIES.find(c => c.value === company.supplier_category)?.[isAr ? "ar" : "en"] || company.supplier_category}
                          </Badge>
                        )}
                        {productCount > 0 && (
                          <Badge variant="outline" className="text-[10px] gap-0.5">
                            <Package className="h-2.5 w-2.5" /> {productCount}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══ Ad Banner ═══ */}
      <section className="bg-background">
        <div className="container py-6">
          <AdBanner placementSlug="suppliers-top" className="rounded-2xl overflow-hidden" />
        </div>
      </section>

      {/* ═══ All Companies Grid ═══ */}
      <section className="bg-background">
        <div className="container py-8 md:py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {isAr ? "جميع الشركات" : "All Companies"}
              <Badge variant="secondary" className="text-xs">{filteredCompanies.length}</Badge>
            </h2>
          </div>

          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Building2 className="mb-4 h-16 w-16 text-muted-foreground/20" />
              <h3 className="text-lg font-semibold">{isAr ? "لا توجد شركات" : "No companies found"}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{isAr ? "جرّب تغيير فلتر البحث" : "Try adjusting your search filters"}</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCompanies.map((company, idx) => {
                const productCount = catalogCounts[company.id] || 0;
                const isFeatured = company.featured_order != null && company.featured_order > 0;
                return (
                  <>
                    <Card
                      key={company.id}
                      interactive
                      className="group cursor-pointer overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 active:scale-[0.98]"
                      onClick={() => navigate(`/pro-suppliers/${company.id}`)}
                    >
                      <div className="relative h-32 bg-gradient-to-br from-primary/15 via-primary/5 to-accent/10">
                        {company.cover_image_url && (
                          <img src={company.cover_image_url} className="absolute inset-0 h-full w-full object-cover opacity-40 transition-transform duration-500 group-hover:scale-105" alt={company.name} loading="lazy" decoding="async" />
                        )}
                        <div className="absolute -bottom-8 start-5">
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-background bg-card shadow-lg">
                            {company.logo_url ? (
                              <img loading="lazy" src={company.logo_url} className="h-10 w-10 object-contain" alt={company.name} />
                            ) : (
                              <Building2 className="h-7 w-7 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        <div className="absolute end-3 top-3 flex items-center gap-1.5">
                          {isFeatured && (
                            <Badge className="bg-chart-4/90 text-white text-[10px] gap-0.5">
                              <Star className="h-3 w-3" /> {isAr ? "مميز" : "Featured"}
                            </Badge>
                          )}
                          <button
                            onClick={(e) => toggleCompare(company.id, e)}
                            className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
                              compareIds.includes(company.id)
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background/80 text-muted-foreground border-border/60 hover:border-primary"
                            }`}
                            title={isAr ? "قارن" : "Compare"}
                          >
                            <Scale className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <CardContent className="pt-10 pb-5">
                        <h3 className="font-bold text-sm truncate">{isAr && company.name_ar ? company.name_ar : company.name}</h3>
                        {(company.tagline || company.tagline_ar) && (
                          <p className="mt-0.5 text-[11px] text-primary/80 truncate">{isAr && company.tagline_ar ? company.tagline_ar : company.tagline}</p>
                        )}
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                          {isAr && company.description_ar ? company.description_ar : company.description || (isAr ? "لا يوجد وصف" : "No description")}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          {company.supplier_category && (
                            <Badge variant="secondary" className="text-[10px]">
                              {SUPPLIER_CATEGORIES.find(c => c.value === company.supplier_category)?.[isAr ? "ar" : "en"] || company.supplier_category}
                            </Badge>
                          )}
                          {company.country_code && (
                            <Badge variant="outline" className="text-[10px]">
                              {countryFlag(company.country_code)} {company.city || company.country_code}
                            </Badge>
                          )}
                          {productCount > 0 && (
                            <Badge variant="outline" className="text-[10px] gap-0.5">
                              <Package className="h-2.5 w-2.5" /> {productCount} {isAr ? "منتج" : "products"}
                            </Badge>
                          )}
                        </div>
                        <SupplierBadges
                          isVerified={company.is_verified}
                          productCount={productCount}
                          foundedYear={(company as any).founded_year}
                          variant="compact"
                        />

                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {(company.specializations || []).slice(0, 3).map((s: string) => (
                              <span key={s} className="rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{s}</span>
                            ))}
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                        </div>
                      </CardContent>
                    </Card>
                    {/* Inline ad after every 9th card */}
                    {idx === 8 && (
                      <div key="ad-inline" className="sm:col-span-2 lg:col-span-3">
                        <AdBanner placementSlug="suppliers-inline" className="rounded-2xl overflow-hidden" />
                      </div>
                    )}
                  </>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ═══ Ad Banner Bottom ═══ */}
      <section className="bg-muted/20">
        <div className="container py-6">
          <AdBanner placementSlug="suppliers-bottom" className="rounded-2xl overflow-hidden" />
        </div>
      </section>

      {/* ═══ Why Choose Our Suppliers ═══ */}
      <section className="bg-background">
        <div className="container py-14 md:py-20">
          <div className="text-center mb-10">
            <h2 className="text-xl md:text-2xl font-black">{isAr ? "لماذا دليل الموردين المحترفين؟" : "Why Our Pro Suppliers Directory?"}</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">{isAr ? "منصة موثوقة تربط الطهاة بأفضل الموردين" : "A trusted platform connecting chefs with the best suppliers"}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Shield, en: "Verified Companies", ar: "شركات موثقة", desc_en: "All suppliers undergo verification", desc_ar: "جميع الموردين يخضعون للتحقق", color: "text-chart-5 bg-chart-5/10" },
              { icon: TrendingUp, en: "Performance Ranked", ar: "ترتيب الأداء", desc_en: "Ranked by quality and satisfaction", desc_ar: "مرتبة حسب الجودة والرضا", color: "text-primary bg-primary/10" },
              { icon: Award, en: "Expert Reviews", ar: "تقييمات الخبراء", desc_en: "Reviewed by professional chefs", desc_ar: "مراجعة من طهاة محترفين", color: "text-chart-4 bg-chart-4/10" },
              { icon: Zap, en: "Direct Connect", ar: "تواصل مباشر", desc_en: "Connect directly with suppliers", desc_ar: "تواصل مباشر مع الموردين", color: "text-chart-3 bg-chart-3/10" },
            ].map((item, i) => (
              <Card key={i} className="rounded-2xl border-border/50 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                <CardContent className="p-5 text-center">
                  <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${item.color}`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-bold">{isAr ? item.ar : item.en}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{isAr ? item.desc_ar : item.desc_en}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="bg-muted/30 border-t border-border/30">
        <div className="container py-14 md:py-20">
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/80 p-10 md:p-16 text-center">
            <div className="absolute top-0 end-0 h-64 w-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 start-0 h-48 w-48 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <Sparkles className="mx-auto mb-4 h-10 w-10 text-primary-foreground/80" />
              <h2 className="text-2xl md:text-3xl font-black text-primary-foreground mb-3">
                {isAr ? "هل شركتك متخصصة في منتجات الشيفات؟" : "Does your company specialize in chef products?"}
              </h2>
              <p className="text-sm text-primary-foreground/70 max-w-2xl mx-auto mb-8 leading-relaxed">
                {isAr
                  ? "انضم إلى دليل الموردين المحترفين واحصل على رؤية أكبر وعملاء محترفين وإعلانات مخصصة"
                  : "Join the professional suppliers directory and gain more visibility, professional clients and targeted advertising"}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button variant="secondary" size="lg" className="gap-2 rounded-2xl py-6 px-8 font-bold shadow-xl transition-all hover:scale-105 active:scale-95" onClick={() => navigate("/for-companies")}>
                  {isAr ? "سجّل شركتك" : "Register Your Company"}
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="lg" className="gap-2 rounded-2xl py-6 px-8 font-bold border-white/20 text-primary-foreground hover:bg-white/10" onClick={() => navigate("/advertising")}>
                  {isAr ? "الإعلان معنا" : "Advertise With Us"}
                  <Sparkles className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
