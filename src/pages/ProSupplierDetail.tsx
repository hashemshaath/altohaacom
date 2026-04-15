import { useIsAr } from "@/hooks/useIsAr";
import { useState, memo, useCallback, useMemo, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { SEOHead } from "@/components/SEOHead";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { countryFlag } from "@/lib/countryFlag";
import { useAllCountries } from "@/hooks/useCountries";
import {
  Building2, Phone, Mail, Globe, MapPin, ArrowLeft, CheckCircle,
  Package, Crown, Hash, Earth, Calendar, Sparkles,
  ExternalLink, Star, ChefHat, Shield, Clock, MessageCircle,
  Heart, Share2, TrendingUp, Award, Zap, Eye,
  Search, SlidersHorizontal, Grid3X3, LayoutList, ArrowUpDown,
} from "lucide-react";
import { safeLazy } from "@/lib/safeLazy";

const SupplierContactForm = safeLazy(() => import("@/components/supplier/SupplierContactForm").then(m => ({ default: m.SupplierContactForm })));
const SupplierShareButtons = safeLazy(() => import("@/components/supplier/SupplierShareButtons").then(m => ({ default: m.SupplierShareButtons })));
const SupplierReviews = safeLazy(() => import("@/components/supplier/SupplierReviews").then(m => ({ default: m.SupplierReviews })));
const SupplierWishlistButton = safeLazy(() => import("@/components/supplier/SupplierWishlistButton").then(m => ({ default: m.SupplierWishlistButton })));
const SupplierBadges = safeLazy(() => import("@/components/supplier/SupplierBadges").then(m => ({ default: m.SupplierBadges })));
const SupplierProductCard = safeLazy(() => import("@/components/supplier/SupplierProductCard").then(m => ({ default: m.SupplierProductCard })));
const SupplierProductDetail = safeLazy(() => import("@/components/supplier/SupplierProductDetail").then(m => ({ default: m.SupplierProductDetail })));
import { useSupplierViewTracker } from "@/hooks/useSupplierViewTracker";
import { useCart } from "@/hooks/useCart";
import { CartSheet } from "@/components/shop/CartSheet";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

/* ─── Tab type ─── */
type DetailTab = "overview" | "products" | "sponsorships" | "contact" | "reviews";

const TAB_CONFIG: { key: DetailTab; icon: React.ElementType; labelEn: string; labelAr: string }[] = [
  { key: "overview", icon: Eye, labelEn: "Overview", labelAr: "نظرة عامة" },
  { key: "products", icon: Package, labelEn: "Products", labelAr: "المنتجات" },
  { key: "sponsorships", icon: Crown, labelEn: "Sponsorships", labelAr: "الرعايات" },
  { key: "contact", icon: MessageCircle, labelEn: "Contact", labelAr: "تواصل" },
  { key: "reviews", icon: Star, labelEn: "Reviews", labelAr: "التقييمات" },
];

/* ─── Stat Pill ─── */
const StatPill = memo(function StatPill({ icon: Icon, value, label, className }: { icon: React.ElementType; value: string | number; label: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 rounded-xl bg-background/60 backdrop-blur-sm border border-border/30 px-3 py-2", className)}>
      <Icon className="h-4 w-4 text-primary shrink-0" />
      <span className="font-bold text-sm tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
});

/* ─── Info Row ─── */
const InfoRow = memo(function InfoRow({ icon: Icon, children, href, className }: { icon: React.ElementType; children: React.ReactNode; href?: string; className?: string }) {
  const content = (
    <div className={cn("flex items-center gap-3 py-2.5 px-3 rounded-xl text-sm transition-colors", href && "hover:bg-muted/50 cursor-pointer", className)}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-foreground/80 min-w-0 truncate">{children}</span>
    </div>
  );
  if (href) return <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">{content}</a>;
  return content;
});

export default function ProSupplierDetail() {
  const { id } = useParams();
  const { language } = useLanguage();
  const isAr = useIsAr();
  const navigate = useNavigate();
  const { data: countries = [] } = useAllCountries();
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [productSort, setProductSort] = useState<"name" | "price_asc" | "price_desc">("name");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const cart = useCart();
  const { addItem } = cart;
  const [cartOpen, setCartOpen] = useState(false);
  useSupplierViewTracker(id);

  const { data: company, isLoading } = useQuery({
    queryKey: ["proSupplier", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, name_ar, description, description_ar, logo_url, cover_image_url, phone, email, website, address, address_ar, city, country_code, postal_code, type, status, is_verified, verification_level, company_number, classifications, social_links, tagline, tagline_ar, supplier_category, specializations, founded_year, country, operating_countries")
        .eq("id", id)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw handleSupabaseError(error);
      return data;
    },
    enabled: !!id,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["supplierProducts", id],
    queryFn: async () => {
      if (!id) return [];
      const { data } = await supabase
        .from("company_catalog")
        .select("id, company_id, name, name_ar, description, description_ar, category, subcategory, unit_price, currency, unit, image_url, is_active, sku, in_stock, quantity_available, warranty_years, platform_discount_pct, coupon_code, coupon_discount_pct, original_price, is_archived")
        .eq("company_id", id)
        .eq("is_active", true)
        .or("is_archived.is.null,is_archived.eq.false")
        .order("category")
        .order("name");
      return data || [];
    },
    enabled: !!id,
  });

  const { data: reviewStats } = useQuery({
    queryKey: ["supplierReviewStats", id],
    queryFn: async () => {
      if (!id) return { count: 0, avg: 0 };
      const { data } = await supabase
        .from("supplier_reviews")
        .select("rating")
        .eq("company_id", id)
        .eq("status", "published");
      const ratings = data || [];
      return {
        count: ratings.length,
        avg: ratings.length > 0 ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0,
      };
    },
    enabled: !!id,
  });

  const { data: sponsorships = [] } = useQuery({
    queryKey: ["supplierSponsorships", id],
    queryFn: async () => {
      if (!id) return [];
      const { data } = await supabase
        .from("competition_sponsors")
        .select("id, tier, competitions:competitions!competition_sponsors_competition_id_fkey(id, title, title_ar, cover_image_url, city, country, country_code, edition_year, edition_number, competition_start, competition_end, venue, venue_ar)")
        .eq("company_id", id)
        .in("status", ["approved", "active"])
        .limit(10);
      return data || [];
    },
    enabled: !!id,
  });

  const { data: adCampaigns = [] } = useQuery({
    queryKey: ["supplierCampaigns", id],
    queryFn: async () => {
      if (!id) return [];
      const { data } = await supabase
        .from("ad_campaigns")
        .select("id, name, name_ar, status, start_date, end_date")
        .eq("company_id", id)
        .in("status", ["active", "approved"])
        .limit(5);
      return data || [];
    },
    enabled: !!id,
  });

  const getCountryName = useCallback((code: string | null) => {
    if (!code) return null;
    const c = countries.find((ct) => ct.code === code);
    return c ? (isAr ? c.name_ar || c.name : c.name) : code;
  }, [countries, isAr]);

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category || "other"));
    return Array.from(cats);
  }, [products]);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    if (selectedCategory !== "all") filtered = filtered.filter((p) => (p.category || "other") === selectedCategory);
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      filtered = filtered.filter((p) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.name_ar || "").toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q)
      );
    }
    if (productSort === "price_asc") filtered.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0));
    else if (productSort === "price_desc") filtered.sort((a, b) => (b.unit_price || 0) - (a.unit_price || 0));
    else filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    return filtered;
  }, [products, selectedCategory, productSearch, productSort]);

  const productsByCategory = products.reduce<Record<string, any[]>>((acc, p: any) => {
    const cat = p.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const handleAddToCart = useCallback((product: Record<string, any>, qty = 1) => {
    addItem({
      product_id: product.id,
      title: product.name,
      title_ar: product.name_ar,
      image_url: product.image_url,
      price: product.unit_price || 0,
      currency: product.currency || "SAR",
      stock_quantity: product.quantity_available || 999,
      tax_rate: 0.15,
      tax_inclusive: false,
    }, qty);
    toast.success(isAr ? "تمت الإضافة إلى السلة" : "Added to cart");
    setCartOpen(true);
  }, [addItem, isAr]);

  const socialLinks = (company as any)?.social_links as Record<string, string> | null;
  const companyName = company ? (isAr && company.name_ar ? company.name_ar : company.name) : "";
  const tagline = company ? (isAr && (company as any).tagline_ar ? (company as any).tagline_ar : (company as any).tagline) : "";
  const description = company ? (isAr && company.description_ar ? company.description_ar : company.description) : "";
  const yearsInBusiness = (company as any)?.founded_year ? new Date().getFullYear() - (company as any).founded_year : 0;

  /* ─── Loading ─── */
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1">
          <div className="h-[320px] bg-gradient-to-br from-primary/5 to-accent/5 animate-pulse" />
          <div className="container -mt-16 relative z-10">
            <div className="bg-card rounded-2xl border border-border/30 p-6">
              <div className="flex gap-5">
                <Skeleton className="h-20 w-20 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-7 w-64" />
                  <Skeleton className="h-4 w-96" />
                  <div className="flex gap-2"><Skeleton className="h-6 w-20 rounded-full" /><Skeleton className="h-6 w-20 rounded-full" /></div>
                </div>
              </div>
            </div>
          </div>
          <div className="container mt-6 grid gap-6 md:grid-cols-2">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* ─── Not Found ─── */
  if (!company) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="container flex flex-1 flex-col items-center justify-center py-16 text-center">
          <div className="rounded-3xl bg-muted/30 p-8 mb-6">
            <Building2 className="h-16 w-16 text-muted-foreground/30" />
          </div>
          <h1 className="text-2xl font-bold">{isAr ? "الشركة غير موجودة" : "Company Not Found"}</h1>
          <p className="text-muted-foreground mt-2 text-sm">{isAr ? "لم يتم العثور على هذا المورد" : "This supplier could not be found"}</p>
          <Button variant="outline" className="mt-6 rounded-xl" onClick={() => navigate("/pro-suppliers")}>
            <ArrowLeft className="me-2 h-4 w-4" />{isAr ? "رجوع للدليل" : "Back to Directory"}
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background" dir={isAr ? "rtl" : "ltr"}>
      <SEOHead
        title={`${companyName} - ${isAr ? "مورد محترف | الموردين المحترفين" : "Professional Supplier | Pro Suppliers"}`}
        description={
          tagline
            ? `${tagline} - ${companyName}${company.city ? ` | ${company.city}` : ""}`
            : description?.slice(0, 155) || `${companyName} - ${isAr ? "مورد محترف لأدوات ومعدات الطهي الاحترافية" : "Professional chef equipment and kitchen supply partner"}`
        }
        ogType="business.business"
        ogImage={company.cover_image_url || company.logo_url || undefined}
        canonical={`${window.location.origin}/pro-suppliers/${company.id}`}
        lang={language}
        keywords={[
          company.name, company.name_ar,
          (company as any).supplier_category,
          ...(((company as any).specializations as string[]) || []),
          company.city, getCountryName(company.country_code),
          isAr ? "مورد طهي احترافي" : "professional chef supplier",
          isAr ? "أدوات مطبخ" : "kitchen equipment",
        ].filter(Boolean).join(", ")}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: company.name,
            alternateName: company.name_ar || undefined,
            description: description || undefined,
            url: company.website || `${window.location.origin}/pro-suppliers/${company.id}`,
            logo: company.logo_url || undefined,
            telephone: company.phone || undefined,
            email: company.email || undefined,
            address: company.address ? {
              "@type": "PostalAddress",
              streetAddress: company.address,
              addressLocality: company.city || undefined,
              postalCode: company.postal_code || undefined,
              addressCountry: company.country_code || undefined,
            } : undefined,
            ...(reviewStats && reviewStats.count > 0 ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: reviewStats.avg.toFixed(1),
                reviewCount: reviewStats.count,
                bestRating: 5,
                worstRating: 1,
              },
            } : {}),
            numberOfEmployees: undefined,
            foundingDate: (company as any).founded_year ? `${(company as any).founded_year}` : undefined,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: isAr ? "الرئيسية" : "Home", item: window.location.origin },
              { "@type": "ListItem", position: 2, name: isAr ? "الموردين المحترفين" : "Pro Suppliers", item: `${window.location.origin}/pro-suppliers` },
              { "@type": "ListItem", position: 3, name: companyName, item: `${window.location.origin}/pro-suppliers/${company.id}` },
            ],
          },
        ]}
      />
      <Header />

      <Suspense fallback={null}>
      <main className="flex-1">
        {/* ━━━ CINEMATIC HERO ━━━ */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/8 via-background to-accent/5">
          {/* Cover background */}
          {company.cover_image_url && (
            <img src={company.cover_image_url} loading="eager" className="absolute inset-0 h-full w-full object-cover opacity-10" alt={company.name || "Supplier cover"} />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background" />

          <div className="container relative z-10 pt-6 pb-20 md:pb-24">
            {/* Top nav row */}
            <div className="flex items-center justify-between mb-8">
              <Button variant="ghost" size="sm" className="rounded-xl bg-background/60 backdrop-blur-sm border border-border/20 hover:bg-background/80" onClick={() => navigate("/pro-suppliers")}>
                <ArrowLeft className="me-2 h-4 w-4" />{isAr ? "دليل الموردين" : "Directory"}
              </Button>
              <div className="flex items-center gap-2">
                <SupplierShareButtons companyName={company.name} companyId={company.id} />
                <SupplierWishlistButton companyId={company.id} />
              </div>
            </div>

            {/* Company identity */}
            <div className="flex flex-col gap-5 md:flex-row md:items-start">
              {/* Logo */}
              <div className="relative">
                <div className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-[1.75rem] bg-background border-2 border-border/30 shadow-xl">
                  {company.logo_url ? (
                    <img loading="eager" src={company.logo_url} className="h-14 w-14 object-contain" alt={companyName} />
                  ) : (
                    <Building2 className="h-10 w-10 text-muted-foreground/40" />
                  )}
                </div>
                {company.is_verified && (
                  <div className="absolute -bottom-1 -end-1 flex h-7 w-7 items-center justify-center rounded-full bg-chart-5 text-primary-foreground shadow-lg">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-3">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{companyName}</h1>
                    {(company as any).supplier_category && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">{(company as any).supplier_category}</Badge>
                    )}
                  </div>
                  {tagline && <p className="mt-1.5 text-muted-foreground text-sm md:text-base max-w-2xl">{tagline}</p>}
                </div>

                {/* Badges row */}
                <SupplierBadges
                  isVerified={company.is_verified}
                  reviewCount={reviewStats?.count || 0}
                  avgRating={reviewStats?.avg || 0}
                  productCount={products.length}
                  foundedYear={(company as any).founded_year}
                  sponsorshipCount={sponsorships.length}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ━━━ FLOATING STATS BAR ━━━ */}
        <div className="container relative z-20 -mt-10 mb-6">
          <div className="rounded-2xl bg-card/95 backdrop-blur-xl border border-border/30 shadow-xl p-4 md:p-5">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-2.5">
                <StatPill icon={Package} value={products.length} label={isAr ? "منتج" : "Products"} />
                {reviewStats && reviewStats.count > 0 && (
                  <StatPill icon={Star} value={reviewStats.avg.toFixed(1)} label={`(${reviewStats.count} ${isAr ? "تقييم" : "reviews"})`} />
                )}
                <StatPill icon={Crown} value={sponsorships.length} label={isAr ? "رعاية" : "Sponsorships"} />
                {yearsInBusiness > 0 && (
                  <StatPill icon={Calendar} value={yearsInBusiness} label={isAr ? "سنة خبرة" : "Years"} />
                )}
                {company.country_code && (
                  <div className="flex items-center gap-2 rounded-xl bg-background/60 backdrop-blur-sm border border-border/30 px-3 py-2">
                    <span className="text-base">{countryFlag(company.country_code)}</span>
                    <span className="text-xs text-muted-foreground">{company.city ? `${company.city}, ` : ""}{getCountryName(company.country_code)}</span>
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="flex gap-2">
                <Button size="sm" className="rounded-xl gap-1.5" onClick={() => setActiveTab("contact")}>
                  <MessageCircle className="h-3.5 w-3.5" />
                  {isAr ? "تواصل" : "Contact"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ━━━ TABS NAVIGATION ━━━ */}
        <div className="container">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none mb-6">
            {TAB_CONFIG.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              let count: number | undefined;
              if (tab.key === "products") count = products.length;
              if (tab.key === "sponsorships") count = sponsorships.length;
              if (tab.key === "reviews") count = reviewStats?.count;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all touch-manipulation",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {isAr ? tab.labelAr : tab.labelEn}
                  {count !== undefined && count > 0 && (
                    <span className={cn("text-[0.6875rem] rounded-full px-1.5 py-0.5 min-w-[20px] text-center", isActive ? "bg-white/20" : "bg-muted-foreground/10")}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ━━━ TAB CONTENT ━━━ */}
          <div className="pb-12">
            {/* OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Description */}
                {description && (
                  <div className="max-w-3xl">
                    <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      {isAr ? "عن الشركة" : "About"}
                    </h2>
                    <p className={cn("text-muted-foreground leading-relaxed text-sm md:text-base whitespace-pre-line", !descExpanded && "line-clamp-4")}>
                      {description}
                    </p>
                    {description.length > 200 && (
                      <Button variant="link" size="sm" className="text-primary px-0 mt-1 h-auto" onClick={() => setDescExpanded(!descExpanded)}>
                        {descExpanded ? (isAr ? "عرض أقل" : "Show less") : (isAr ? "عرض المزيد" : "Read more")}
                      </Button>
                    )}
                  </div>
                )}

                {/* Info Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Contact */}
                  {(company.phone || company.email || company.website) && (
                    <Card className="rounded-2xl border-border/30 overflow-hidden">
                      <div className="p-4 border-b border-border/15 bg-muted/20">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <Phone className="h-4 w-4 text-primary" />{isAr ? "معلومات الاتصال" : "Contact Info"}
                        </h3>
                      </div>
                      <CardContent className="p-2">
                        {company.phone && <InfoRow icon={Phone} href={`tel:${company.phone}`}>{company.phone}</InfoRow>}
                        {company.email && <InfoRow icon={Mail} href={`mailto:${company.email}`}>{company.email}</InfoRow>}
                        {company.website && <InfoRow icon={Globe} href={company.website}>{company.website.replace(/^https?:\/\//, "")}</InfoRow>}
                      </CardContent>
                    </Card>
                  )}

                  {/* Location */}
                  {(company.address || company.city) && (
                    <Card className="rounded-2xl border-border/30 overflow-hidden">
                      <div className="p-4 border-b border-border/15 bg-muted/20">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />{isAr ? "الموقع" : "Location"}
                        </h3>
                      </div>
                      <CardContent className="p-4 text-sm text-muted-foreground space-y-2">
                        <p>{[isAr && company.address_ar ? company.address_ar : company.address, company.city, getCountryName(company.country_code)].filter(Boolean).join(", ")}</p>
                        {company.postal_code && <p className="text-xs text-muted-foreground/70">{isAr ? "رمز بريدي:" : "Postal:"} {company.postal_code}</p>}
                      </CardContent>
                    </Card>
                  )}

                  {/* Specializations */}
                  {(company as any).specializations?.length > 0 && (
                    <Card className="rounded-2xl border-border/30 overflow-hidden">
                      <div className="p-4 border-b border-border/15 bg-muted/20">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <Zap className="h-4 w-4 text-primary" />{isAr ? "التخصصات" : "Specializations"}
                        </h3>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex flex-wrap gap-1.5">
                          {(company as any).specializations.map((s: string) => (
                            <Badge key={s} variant="secondary" className="text-xs rounded-lg">{s}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Classifications */}
                  {company.classifications?.length > 0 && (
                    <Card className="rounded-2xl border-border/30 overflow-hidden">
                      <div className="p-4 border-b border-border/15 bg-muted/20">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />{isAr ? "التصنيفات" : "Classifications"}
                        </h3>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex flex-wrap gap-1.5">
                          {company.classifications.map((c) => (
                            <Badge key={c} variant="secondary" className="text-xs rounded-lg">{c}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Operating Countries */}
                  {company.operating_countries?.length > 0 && (
                    <Card className="rounded-2xl border-border/30 overflow-hidden">
                      <div className="p-4 border-b border-border/15 bg-muted/20">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <Earth className="h-4 w-4 text-primary" />{isAr ? "مناطق العمل" : "Operating Regions"}
                        </h3>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex flex-wrap gap-1.5">
                          {company.operating_countries.map((cc) => (
                            <Badge key={cc} variant="secondary" className="text-sm px-2.5 py-1 rounded-lg">
                              {countryFlag(cc)} {getCountryName(cc)}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Social Links */}
                  {socialLinks && Object.keys(socialLinks).length > 0 && (
                    <Card className="rounded-2xl border-border/30 overflow-hidden">
                      <div className="p-4 border-b border-border/15 bg-muted/20">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <Globe className="h-4 w-4 text-primary" />{isAr ? "وسائل التواصل" : "Social Media"}
                        </h3>
                      </div>
                      <CardContent className="p-2">
                        {Object.entries(socialLinks).map(([platform, url]) => (
                          <InfoRow key={platform} icon={ExternalLink} href={url}>{platform}</InfoRow>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Company Number */}
                  {company.company_number && (
                    <Card className="rounded-2xl border-border/30 overflow-hidden">
                      <div className="p-4 border-b border-border/15 bg-muted/20">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <Hash className="h-4 w-4 text-primary" />{isAr ? "السجل التجاري" : "Registration"}
                        </h3>
                      </div>
                      <CardContent className="p-4">
                        <p className="font-mono text-sm text-foreground/80">{company.company_number}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Featured Products Preview */}
                {products.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        {isAr ? "أحدث المنتجات" : "Featured Products"}
                      </h2>
                      <Button variant="ghost" size="sm" className="text-primary rounded-xl" onClick={() => setActiveTab("products")}>
                        {isAr ? "عرض الكل" : "View All"} →
                      </Button>
                    </div>
                    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                      {products.slice(0, 4).map((p) => (
                        <SupplierProductCard
                          key={p.id}
                          product={p}
                          compact
                          onViewDetails={(prod) => { setSelectedProduct(prod); setActiveTab("products"); }}
                          onAddToCart={handleAddToCart}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Trust Section */}
                <Card className="rounded-2xl border-primary/10 bg-gradient-to-r from-primary/3 to-accent/3 overflow-hidden">
                  <CardContent className="p-5 md:p-6 flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                      <Shield className="h-7 w-7 text-primary" />
                    </div>
                    <div className="text-center sm:text-start flex-1">
                      <h3 className="font-bold text-sm">{isAr ? "مورد موثوق ومعتمد" : "Trusted & Verified Supplier"}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isAr
                          ? "تم التحقق من هوية وبيانات هذا المورد من قبل فريق المنصة"
                          : "This supplier's identity and data have been verified by our platform team"}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="rounded-xl shrink-0" onClick={() => setActiveTab("contact")}>
                      {isAr ? "طلب عرض أسعار" : "Request Quote"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* PRODUCTS */}
            {activeTab === "products" && (
              <>
                {selectedProduct ? (
                  <SupplierProductDetail
                    product={selectedProduct}
                    relatedProducts={products.filter((p) => p.id !== selectedProduct.id && p.category === selectedProduct.category)}
                    onBack={() => setSelectedProduct(null)}
                    onAddToCart={handleAddToCart}
                    onViewProduct={(p) => setSelectedProduct(p)}
                    companyName={companyName}
                    companyId={id}
                  />
                ) : (
                  <div className="space-y-5">
                    {/* Search & Filter Bar */}
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                      {/* Search */}
                      <div className="relative flex-1 min-w-0 w-full sm:max-w-sm">
                        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder={isAr ? "ابحث في المنتجات..." : "Search products..."}
                          className="w-full h-10 ps-9 pe-3 rounded-xl border border-border/30 bg-muted/20 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                        />
                      </div>

                      {/* Category filter pills */}
                      <div className="flex gap-1.5 overflow-x-auto scrollbar-none flex-1">
                        <button
                          onClick={() => setSelectedCategory("all")}
                          className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all touch-manipulation",
                            selectedCategory === "all" ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                          )}
                        >
                          {isAr ? "الكل" : "All"} ({products.length})
                        </button>
                        {categories.map(cat => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={cn(
                              "px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap capitalize transition-all touch-manipulation",
                              selectedCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                            )}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      {/* Sort */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                        <select
                          value={productSort}
                          onChange={(e) => setProductSort(e.target.value as any)}
                          className="h-9 px-2 rounded-lg border border-border/30 bg-muted/20 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="name">{isAr ? "الاسم" : "Name"}</option>
                          <option value="price_asc">{isAr ? "السعر: الأقل" : "Price: Low"}</option>
                          <option value="price_desc">{isAr ? "السعر: الأعلى" : "Price: High"}</option>
                        </select>
                      </div>
                    </div>

                    {/* Results count */}
                    <p className="text-xs text-muted-foreground">
                      {isAr ? `${filteredProducts.length} منتج` : `${filteredProducts.length} products`}
                      {productSearch && ` ${isAr ? "لـ" : "for"} "${productSearch}"`}
                    </p>

                    {/* Products grid */}
                    {filteredProducts.length === 0 ? (
                      <div className="py-16 text-center">
                        <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-muted/30 mb-4">
                          <Search className="h-10 w-10 text-muted-foreground/20" />
                        </div>
                        <p className="text-muted-foreground">{isAr ? "لا توجد نتائج" : "No products found"}</p>
                        {productSearch && (
                          <Button variant="link" size="sm" className="text-primary mt-2" onClick={() => { setProductSearch(""); setSelectedCategory("all"); }}>
                            {isAr ? "مسح البحث" : "Clear search"}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                        {filteredProducts.map((p) => (
                          <SupplierProductCard
                            key={p.id}
                            product={p}
                            onViewDetails={(prod) => setSelectedProduct(prod)}
                            onAddToCart={handleAddToCart}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* SPONSORSHIPS */}
            {activeTab === "sponsorships" && (
              <div className="space-y-8">
                {sponsorships.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-muted/30 mb-4">
                      <Crown className="h-10 w-10 text-muted-foreground/20" />
                    </div>
                    <p className="text-muted-foreground">{isAr ? "لا توجد رعايات حالياً" : "No active sponsorships"}</p>
                  </div>
                ) : (
                  <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {sponsorships.map((s) => {
                      const comp = s.competitions;
                      const title = isAr && comp?.title_ar ? comp.title_ar : comp?.title;
                      const venue = isAr && comp?.venue_ar ? comp.venue_ar : comp?.venue;
                      const coverImg = comp?.cover_image_url;
                      const tierLabels: Record<string, { en: string; ar: string; color: string }> = {
                        strategic_partner: { en: "Strategic Partner", ar: "شريك استراتيجي", color: "bg-chart-4/15 text-chart-4 border-chart-4/30" },
                        platinum: { en: "Platinum", ar: "بلاتيني", color: "bg-chart-3/15 text-chart-3 border-chart-3/30" },
                        gold: { en: "Gold Sponsor", ar: "الراعي الذهبي", color: "bg-chart-4/15 text-chart-4 border-chart-4/30" },
                        silver: { en: "Silver Sponsor", ar: "الراعي الفضي", color: "bg-muted text-muted-foreground border-border" },
                        participant: { en: "Participant", ar: "مشارك", color: "bg-chart-5/10 text-chart-5 border-chart-5/20" },
                        supporter: { en: "Supporter", ar: "داعم", color: "bg-chart-5/10 text-chart-5 border-chart-5/20" },
                      };
                      const tierInfo = tierLabels[s.tier] || { en: s.tier, ar: s.tier, color: "bg-muted text-muted-foreground border-border" };
                      const editionLabel = comp?.edition_number
                        ? (isAr ? `النسخة ${comp.edition_number}` : `Edition ${comp.edition_number}`)
                        : null;
                      const startDate = comp?.competition_start ? new Date(comp.competition_start) : null;
                      const endDate = comp?.competition_end ? new Date(comp.competition_end) : null;
                      const dateStr = startDate
                        ? `${startDate.toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "short", day: "numeric" })}${endDate ? ` – ${endDate.toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "short", day: "numeric", year: "numeric" })}` : ""}`
                        : null;

                      return (
                        <Card
                          key={s.id}
                          className="group cursor-pointer overflow-hidden rounded-2xl border-border/20 hover:border-primary/30 transition-all duration-300 hover:shadow-lg"
                          onClick={() => navigate(`/competitions/${comp?.id || ""}`)}
                        >
                          {/* Cover Image */}
                          <div className="relative h-28 overflow-hidden bg-gradient-to-br from-primary/10 via-muted to-accent/10">
                            {coverImg ? (
                              <img loading="lazy" decoding="async" src={coverImg} alt={title || ""} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Crown className="h-8 w-8 text-muted-foreground/15" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                            {/* Tier Badge */}
                            <div className="absolute top-2 start-2">
                              <Badge className={cn("backdrop-blur-md border text-[0.625rem] font-bold uppercase tracking-wider gap-0.5 py-0 px-1.5", tierInfo.color)}>
                                <Crown className="h-2.5 w-2.5" />
                                {isAr ? tierInfo.ar : tierInfo.en}
                              </Badge>
                            </div>

                            {/* Edition & Year */}
                            <div className="absolute top-2 end-2 flex items-center gap-1">
                              {comp?.edition_year && (
                                <Badge className="bg-white/15 backdrop-blur-md border-white/10 text-primary-foreground text-[0.625rem] py-0 px-1.5">
                                  {comp.edition_year}
                                </Badge>
                              )}
                            </div>

                            {/* Title overlay */}
                            <div className="absolute bottom-2 start-2 end-2">
                              <h4 className="text-xs font-bold text-primary-foreground line-clamp-1 drop-shadow-md">{title}</h4>
                            </div>
                          </div>

                          {/* Details */}
                          <CardContent className="p-2.5 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] text-muted-foreground">
                              {comp?.city && (
                                <span className="flex items-center gap-1">
                                  {comp.country_code && <span>{countryFlag(comp.country_code)}</span>}
                                  {comp.city}
                                </span>
                              )}
                              {editionLabel && (
                                <span className="text-[0.625rem] text-muted-foreground/60">{editionLabel}</span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {adCampaigns.length > 0 && (
                  <div>
                    <Separator className="mb-6" />
                    <h3 className="mb-4 text-base font-bold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      {isAr ? "الحملات الإعلانية النشطة" : "Active Ad Campaigns"}
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {adCampaigns.map((c) => (
                        <Card key={c.id} className="rounded-2xl border-border/30">
                          <CardContent className="p-4">
                            <p className="font-medium text-sm">{isAr && c.name_ar ? c.name_ar : c.name}</p>
                            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="secondary" className="text-[0.6875rem] rounded-lg">{c.status}</Badge>
                              {c.start_date && <span>{new Date(c.start_date).toLocaleDateString()}</span>}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CONTACT */}
            {activeTab === "contact" && (
              <div className="grid gap-6 md:grid-cols-5">
                <div className="md:col-span-3">
                  <SupplierContactForm companyId={company.id} companyName={companyName} />
                </div>
                <div className="md:col-span-2 space-y-4">
                  {(company.phone || company.email || company.website) && (
                    <Card className="rounded-2xl border-border/30 overflow-hidden">
                      <div className="p-4 border-b border-border/15 bg-muted/20">
                        <h3 className="font-semibold text-sm">{isAr ? "طرق التواصل" : "Contact Methods"}</h3>
                      </div>
                      <CardContent className="p-2">
                        {company.phone && <InfoRow icon={Phone} href={`tel:${company.phone}`}>{company.phone}</InfoRow>}
                        {company.email && <InfoRow icon={Mail} href={`mailto:${company.email}`}>{company.email}</InfoRow>}
                        {company.website && <InfoRow icon={Globe} href={company.website}>{company.website.replace(/^https?:\/\//, "")}</InfoRow>}
                      </CardContent>
                    </Card>
                  )}

                  {/* Quick trust card */}
                  <Card className="rounded-2xl border-chart-5/15 bg-chart-5/3">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Shield className="h-8 w-8 text-chart-5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold">{isAr ? "تواصل آمن" : "Secure Contact"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{isAr ? "رسائلك محمية ومشفرة" : "Your messages are protected and encrypted"}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <div>
                    <p className="text-sm font-medium mb-3">{isAr ? "مشاركة الصفحة" : "Share Profile"}</p>
                    <SupplierShareButtons companyName={company.name} companyId={company.id} />
                  </div>
                </div>
              </div>
            )}

            {/* REVIEWS */}
            {activeTab === "reviews" && (
              <SupplierReviews companyId={company.id} />
            )}
          </div>
        </div>
      </main>
      </Suspense>
      <Footer />

      {/* Floating Cart Button */}
      {cart.totalItems > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 end-6 z-50 flex items-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-primary-foreground shadow-2xl shadow-primary/30 transition-all duration-300 hover:scale-105 active:scale-95 touch-manipulation"
          aria-label={isAr ? "عرض السلة" : "View Cart"}
        >
          <Package className="h-5 w-5" />
          <span className="font-bold text-sm">{cart.totalItems}</span>
          <Separator orientation="vertical" className="h-4 bg-primary-foreground/30" />
          <span className="text-sm font-semibold tabular-nums">
            {(cart.totalPrice).toLocaleString()} {isAr ? "ر.س" : "SAR"}
          </span>
        </button>
      )}

      <CartSheet open={cartOpen} onOpenChange={setCartOpen} cart={cart} />
    </div>
  );
}
