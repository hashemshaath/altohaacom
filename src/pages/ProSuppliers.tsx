import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { SEOHead } from "@/components/SEOHead";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { countryFlag } from "@/lib/countryFlag";
import {
  Building2, Search, ChefHat, UtensilsCrossed, Package, Shirt,
  Wrench, Boxes, Grid3X3, CheckCircle, ArrowRight, Sparkles,
  Factory, Globe, ArrowUpDown, Star, Scale, Trophy,
} from "lucide-react";
import { SupplierBadges } from "@/components/supplier/SupplierBadges";

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

  // Derive unique countries
  const availableCountries = useMemo(() => {
    const codes = new Set(companies.map((c: any) => c.country_code).filter(Boolean));
    return Array.from(codes) as string[];
  }, [companies]);

  // Client-side filtering & sorting
  const filteredCompanies = useMemo(() => {
    let result = [...companies];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((c: any) =>
        c.name?.toLowerCase().includes(s) || c.name_ar?.toLowerCase().includes(s) || c.description?.toLowerCase().includes(s)
      );
    }
    if (category !== "all") {
      result = result.filter((c: any) => c.supplier_category === category);
    }
    if (countryFilter !== "all") {
      result = result.filter((c: any) => c.country_code === countryFilter);
    }
    if (sortBy === "name") {
      result.sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortBy === "newest") {
      result.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return result;
  }, [companies, search, category, countryFilter, sortBy]);
  const { data: catalogCounts = {} } = useQuery({
    queryKey: ["supplierCatalogCounts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_catalog")
        .select("company_id")
        .eq("is_active", true);
      const counts: Record<string, number> = {};
      (data || []).forEach((r: any) => {
        counts[r.company_id] = (counts[r.company_id] || 0) + 1;
      });
      return counts;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Compare selection
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const toggleCompare = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title={isAr ? "دليل موردي الشيفات المحترفين | التحاء" : "Pro Chef Suppliers Directory | Altohaa"}
        description={isAr ? "اكتشف أفضل موردي المنتجات الاحترافية للشيفات" : "Discover the best professional chef product suppliers"}
      />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 pb-8 pt-12 md:pb-12 md:pt-20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_70%)]" />
          <div className="container relative">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/60 px-4 py-1.5 text-xs font-medium backdrop-blur-sm">
                <Factory className="h-3.5 w-3.5 text-primary" />
                {isAr ? "دليل الموردين المحترفين" : "Professional Suppliers Directory"}
              </div>
              <h1 className="font-serif text-3xl font-bold tracking-tight md:text-5xl">
                {isAr ? "موردو منتجات الشيفات المحترفين" : "Pro Chef Product Suppliers"}
              </h1>
              <p className="mt-4 text-muted-foreground md:text-lg">
                {isAr
                  ? "اكتشف الشركات الرائدة المتخصصة في تقديم أفضل المنتجات والأدوات للطهاة المحترفين"
                  : "Discover leading companies specializing in the finest products and tools for professional chefs"}
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Button variant="outline" size="sm" className="rounded-full gap-1.5" onClick={() => navigate("/pro-suppliers/leaderboard")}>
                  <Trophy className="h-3.5 w-3.5 text-chart-4" />
                  {isAr ? "ترتيب الموردين" : "Leaderboard"}
                </Button>
              </div>
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
                    className="rounded-full gap-1.5"
                    onClick={() => setCategory(cat.value)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {isAr ? cat.ar : cat.en}
                  </Button>
                );
              })}
            </div>

            {/* Sort & Country Filter */}
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

            {/* Stats */}
            <div className="mx-auto mt-6 flex max-w-md justify-center gap-8 text-center text-sm text-muted-foreground">
              <div>
                <span className="block text-2xl font-bold text-foreground">{filteredCompanies.length}</span>
                {isAr ? "شركة" : "Companies"}
              </div>
              <div>
                <span className="block text-2xl font-bold text-foreground">{SUPPLIER_CATEGORIES.length - 1}</span>
                {isAr ? "تصنيف" : "Categories"}
              </div>
            </div>

            {/* Compare Bar */}
            {compareIds.length > 0 && (
              <div className="mx-auto mt-6 flex max-w-xl items-center justify-center gap-3">
                <Badge variant="secondary" className="text-xs">
                  {compareIds.length} {isAr ? "مختار" : "selected"}
                </Badge>
                <Button
                  size="sm"
                  className="rounded-full gap-1.5"
                  disabled={compareIds.length < 2}
                  onClick={() => navigate(`/pro-suppliers/compare?ids=${compareIds.join(",")}`)}
                >
                  <Scale className="h-3.5 w-3.5" />
                  {isAr ? "قارن الآن" : "Compare Now"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setCompareIds([])}>
                  {isAr ? "مسح" : "Clear"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Company Grid */}
        <div className="container py-8 md:py-12">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Building2 className="mb-4 h-16 w-16 text-muted-foreground/20" />
              <h3 className="text-lg font-semibold">{isAr ? "لا توجد شركات" : "No companies found"}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {isAr ? "جرّب تغيير فلتر البحث" : "Try adjusting your search filters"}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCompanies.map((company: any) => {
                const productCount = catalogCounts[company.id] || 0;
                return (
                  <Card
                    key={company.id}
                    interactive
                    className="group cursor-pointer overflow-hidden rounded-2xl"
                    onClick={() => navigate(`/pro-suppliers/${company.id}`)}
                  >
                    {/* Cover / Gradient Header */}
                    <div className="relative h-32 bg-gradient-to-br from-primary/20 via-primary/5 to-accent/10">
                      {company.cover_image_url && (
                        <img src={company.cover_image_url} className="absolute inset-0 h-full w-full object-cover opacity-40" alt="" />
                      )}
                      <div className="absolute -bottom-8 start-5">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-background bg-card shadow-lg">
                          {company.logo_url ? (
                            <img src={company.logo_url} className="h-10 w-10 object-contain" alt={company.name} />
                          ) : (
                            <Building2 className="h-7 w-7 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <div className="absolute end-3 top-3 flex items-center gap-1.5">
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
                      <h3 className="font-semibold text-base truncate">
                        {isAr && company.name_ar ? company.name_ar : company.name}
                      </h3>
                      {(company.tagline || company.tagline_ar) && (
                        <p className="mt-0.5 text-xs text-primary/80 truncate">
                          {isAr && company.tagline_ar ? company.tagline_ar : company.tagline}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                        {isAr && company.description_ar ? company.description_ar : company.description || (isAr ? "لا يوجد وصف" : "No description")}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        {company.supplier_category && (
                          <Badge variant="secondary" className="text-[9px]">
                            {SUPPLIER_CATEGORIES.find(c => c.value === company.supplier_category)?.[isAr ? "ar" : "en"] || company.supplier_category}
                          </Badge>
                        )}
                        {company.country_code && (
                          <Badge variant="outline" className="text-[9px]">
                            {countryFlag(company.country_code)} {company.city || company.country_code}
                          </Badge>
                        )}
                        {productCount > 0 && (
                          <Badge variant="outline" className="text-[9px]">
                            <Package className="me-0.5 h-2.5 w-2.5" />
                            {productCount} {isAr ? "منتج" : "products"}
                          </Badge>
                        )}
                      </div>
                      <SupplierBadges
                        isVerified={company.is_verified}
                        productCount={productCount}
                        foundedYear={company.founded_year}
                        variant="compact"
                      />

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {(company.specializations || []).slice(0, 3).map((s: string) => (
                            <span key={s} className="rounded-md bg-muted px-2 py-0.5 text-[9px] text-muted-foreground">{s}</span>
                          ))}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="border-t bg-muted/30">
          <div className="container py-12 text-center">
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-primary" />
            <h2 className="text-xl font-bold">
              {isAr ? "هل شركتك متخصصة في منتجات الشيفات؟" : "Does your company specialize in chef products?"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isAr
                ? "انضم إلى دليل الموردين المحترفين واحصل على رعايات وإعلانات مخصصة"
                : "Join the professional suppliers directory and access sponsorships, advertising & more"}
            </p>
            <Button className="mt-4" onClick={() => navigate("/for-companies")}>
              {isAr ? "سجّل شركتك" : "Register Your Company"}
              <ArrowRight className="ms-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
