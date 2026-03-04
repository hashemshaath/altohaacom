import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { SEOHead } from "@/components/SEOHead";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { countryFlag } from "@/lib/countryFlag";
import { useAllCountries } from "@/hooks/useCountries";
import {
  Building2, Phone, Mail, Globe, MapPin, ArrowLeft, CheckCircle,
  Package, Crown, Hash, Earth, Calendar, Sparkles,
  ExternalLink, ShoppingCart, Star, ChefHat,
} from "lucide-react";
import { SupplierContactForm } from "@/components/supplier/SupplierContactForm";
import { SupplierShareButtons } from "@/components/supplier/SupplierShareButtons";
import { SupplierReviews } from "@/components/supplier/SupplierReviews";
import { SupplierWishlistButton } from "@/components/supplier/SupplierWishlistButton";
import { SupplierBadges } from "@/components/supplier/SupplierBadges";
import { ProductQuickView } from "@/components/supplier/ProductQuickView";
import { useSupplierViewTracker } from "@/hooks/useSupplierViewTracker";

export default function ProSupplierDetail() {
  const { id } = useParams();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isAr = language === "ar";
  const { data: countries = [] } = useAllCountries();
  const [activeTab, setActiveTab] = useState("overview");
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null);
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
      if (error) throw error;
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
        .select("id, company_id, name, name_ar, description, description_ar, category, price, currency, unit, image_url, is_active, sku, sort_order")
        .eq("company_id", id)
        .eq("is_active", true)
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
        avg: ratings.length > 0 ? ratings.reduce((s: number, r: any) => s + r.rating, 0) / ratings.length : 0,
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
        .select("id, tier, competitions:competition_id(id, title, title_ar)")
        .eq("company_id", id)
        .eq("status", "approved")
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

  const getCountryName = (code: string | null) => {
    if (!code) return null;
    const c = countries.find((ct) => ct.code === code);
    return c ? (isAr ? c.name_ar || c.name : c.name) : code;
  };

  const productsByCategory = products.reduce<Record<string, any[]>>((acc, p: any) => {
    const cat = p.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-8">
          <Skeleton className="h-64 rounded-2xl" />
          <div className="mt-6 grid gap-6 md:grid-cols-2"><Skeleton className="h-48" /><Skeleton className="h-48" /></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex flex-1 flex-col items-center justify-center py-16 text-center">
          <Building2 className="mb-4 h-16 w-16 text-muted-foreground/30" />
          <h1 className="text-2xl font-bold">{isAr ? "الشركة غير موجودة" : "Company Not Found"}</h1>
          <Button variant="outline" className="mt-6" onClick={() => navigate("/pro-suppliers")}>
            <ArrowLeft className="me-2 h-4 w-4" />{isAr ? "رجوع للدليل" : "Back to Directory"}
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const socialLinks = (company as any).social_links as Record<string, string> | null;

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title={`${company.name} | ${isAr ? "الموردين المحترفين" : "Pro Suppliers"}`}
        description={
          (company as any).tagline
            ? `${(company as any).tagline} - ${company.name}`
            : company.description || `${company.name} - Professional chef product supplier`
        }
        ogType="business.business"
        ogImage={company.logo_url || company.cover_image_url || undefined}
        canonical={`${window.location.origin}/pro-suppliers/${company.id}`}
        lang={language}
        keywords={[
          company.name,
          (company as any).supplier_category,
          ...(((company as any).specializations as string[]) || []),
          "chef supplier",
          "professional kitchen",
        ].filter(Boolean).join(", ")}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: company.name,
          description: company.description || undefined,
          url: company.website || `${window.location.origin}/pro-suppliers/${company.id}`,
          logo: company.logo_url || undefined,
          image: company.cover_image_url || company.logo_url || undefined,
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
        }}
      />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10">
          {company.cover_image_url && (
            <img src={company.cover_image_url} className="absolute inset-0 h-full w-full object-cover opacity-15" alt="" />
          )}
          <div className="container relative py-10 md:py-16">
            <div className="flex items-center justify-between mb-6">
              <Button variant="ghost" size="sm" onClick={() => navigate("/pro-suppliers")}>
                <ArrowLeft className="me-2 h-4 w-4" />{isAr ? "دليل الموردين" : "Suppliers Directory"}
              </Button>
              <SupplierWishlistButton companyId={company.id} />
            </div>

            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[2rem] bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-2xl shadow-primary/20">
                {company.logo_url ? (
                  <img src={company.logo_url} className="h-16 w-16 object-contain" alt={company.name} />
                ) : (
                  <Building2 className="h-12 w-12" />
                )}
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h1 className="font-serif text-3xl font-bold md:text-4xl">
                    {isAr && company.name_ar ? company.name_ar : company.name}
                  </h1>
                  {(company as any).tagline && (
                    <p className="mt-1 text-primary/80 italic">
                      {isAr && (company as any).tagline_ar ? (company as any).tagline_ar : (company as any).tagline}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <SupplierBadges
                    isVerified={company.is_verified}
                    reviewCount={reviewStats?.count || 0}
                    avgRating={reviewStats?.avg || 0}
                    productCount={products.length}
                    foundedYear={(company as any).founded_year}
                    sponsorshipCount={sponsorships.length}
                  />
                  {company.company_number && (
                    <Badge variant="outline" className="bg-muted/50 font-mono text-[10px]">
                      <Hash className="me-1 h-3 w-3" />{company.company_number}
                    </Badge>
                  )}
                  {company.country_code && (
                    <Badge variant="outline" className="bg-muted/50 text-[10px]">
                      {countryFlag(company.country_code)} {getCountryName(company.country_code)}
                    </Badge>
                  )}
                </div>
                {company.description && (
                  <p className="max-w-3xl text-muted-foreground leading-relaxed">
                    {isAr && company.description_ar ? company.description_ar : company.description}
                  </p>
                )}

                {/* Quick Stats */}
                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Package className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{products.length}</span>
                    <span className="text-muted-foreground">{isAr ? "منتج" : "Products"}</span>
                  </div>
                  {reviewStats && reviewStats.count > 0 && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <Star className="h-4 w-4 fill-chart-4 text-chart-4" />
                      <span className="font-semibold">{reviewStats.avg.toFixed(1)}</span>
                      <span className="text-muted-foreground">({reviewStats.count} {isAr ? "تقييم" : "reviews"})</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-sm">
                    <Crown className="h-4 w-4 text-chart-4" />
                    <span className="font-semibold">{sponsorships.length}</span>
                    <span className="text-muted-foreground">{isAr ? "رعاية" : "Sponsorships"}</span>
                  </div>
                  {(company as any).founded_year && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{isAr ? "تأسست" : "Est."} {(company as any).founded_year}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="container py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview" className="min-w-fit">{isAr ? "نظرة عامة" : "Overview"}</TabsTrigger>
              <TabsTrigger value="products" className="min-w-fit">
                {isAr ? "المنتجات" : "Products"} ({products.length})
              </TabsTrigger>
              <TabsTrigger value="sponsorships" className="min-w-fit">
                {isAr ? "الرعايات" : "Sponsorships"} ({sponsorships.length})
              </TabsTrigger>
              <TabsTrigger value="contact" className="min-w-fit">
                <Mail className="me-1 h-3.5 w-3.5" />{isAr ? "تواصل" : "Contact"}
              </TabsTrigger>
              <TabsTrigger value="reviews" className="min-w-fit">
                <Star className="me-1 h-3.5 w-3.5" />{isAr ? "التقييمات" : "Reviews"}
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Contact Card */}
                {(company.phone || company.email || company.website) && (
                  <Card className="rounded-2xl border-border/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Phone className="h-4 w-4 text-primary" />{isAr ? "الاتصال" : "Contact"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      {company.phone && (
                        <a href={`tel:${company.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                          <Phone className="h-3.5 w-3.5" /> {company.phone}
                        </a>
                      )}
                      {company.email && (
                        <a href={`mailto:${company.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                          <Mail className="h-3.5 w-3.5" /> {company.email}
                        </a>
                      )}
                      {company.website && (
                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                          <Globe className="h-3.5 w-3.5" /> {company.website}
                        </a>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Location Card */}
                {(company.address || company.city) && (
                  <Card className="rounded-2xl border-border/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <MapPin className="h-4 w-4 text-primary" />{isAr ? "الموقع" : "Location"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      <p>{[isAr && company.address_ar ? company.address_ar : company.address, company.city, company.country].filter(Boolean).join(", ")}</p>
                      {company.postal_code && <p className="mt-1 text-xs">{isAr ? "رمز بريدي:" : "Postal:"} {company.postal_code}</p>}
                    </CardContent>
                  </Card>
                )}

                {/* Specializations */}
                {(company as any).specializations?.length > 0 && (
                  <Card className="rounded-2xl border-border/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Star className="h-4 w-4 text-primary" />{isAr ? "التخصصات" : "Specializations"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1.5">
                        {(company as any).specializations.map((s: string) => (
                          <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Classifications */}
                {company.classifications?.length > 0 && (
                  <Card className="rounded-2xl border-border/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Package className="h-4 w-4 text-primary" />{isAr ? "التصنيفات" : "Classifications"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1.5">
                        {company.classifications.map((c) => (
                          <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Operating Countries */}
                {company.operating_countries?.length > 0 && (
                  <Card className="rounded-2xl border-border/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Earth className="h-4 w-4 text-primary" />{isAr ? "مناطق العمل" : "Operating Regions"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1.5">
                        {company.operating_countries.map((cc) => (
                          <Badge key={cc} variant="secondary" className="text-sm px-2.5 py-1">
                            {countryFlag(cc)} {getCountryName(cc)}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Social Links */}
                {socialLinks && Object.keys(socialLinks).length > 0 && (
                  <Card className="rounded-2xl border-border/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Globe className="h-4 w-4 text-primary" />{isAr ? "وسائل التواصل" : "Social Media"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {Object.entries(socialLinks).map(([platform, url]) => (
                        <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary capitalize">
                          <ExternalLink className="h-3.5 w-3.5" /> {platform}
                        </a>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Featured Products Preview */}
              {products.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      {isAr ? "أحدث المنتجات" : "Latest Products"}
                    </h2>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab("products")}>
                      {isAr ? "عرض الكل" : "View All"} →
                    </Button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {products.slice(0, 4).map((p: any) => (
                      <Card key={p.id} className="rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => setQuickViewProduct(p)}>
                        {p.image_url ? (
                          <div className="h-32 bg-muted">
                            <img src={p.image_url} className="h-full w-full object-cover" alt={p.name} />
                          </div>
                        ) : (
                          <div className="h-32 bg-muted/50 flex items-center justify-center">
                            <Package className="h-8 w-8 text-muted-foreground/30" />
                          </div>
                        )}
                        <CardContent className="p-3">
                          <p className="font-medium text-sm truncate">{isAr && p.name_ar ? p.name_ar : p.name}</p>
                          <div className="flex items-center justify-between mt-1">
                            <Badge variant="outline" className="text-[9px]">{p.category}</Badge>
                            {p.unit_price > 0 && (
                              <span className="text-xs font-semibold text-primary">
                                {p.unit_price} {p.currency || "SAR"}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products">
              {Object.keys(productsByCategory).length === 0 ? (
                <div className="py-16 text-center">
                  <Package className="mx-auto mb-3 h-12 w-12 text-muted-foreground/20" />
                  <p className="text-muted-foreground">{isAr ? "لا توجد منتجات حالياً" : "No products available yet"}</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(productsByCategory).map(([cat, items]) => (
                    <div key={cat}>
                      <h3 className="mb-3 text-base font-semibold capitalize flex items-center gap-2">
                        <ChefHat className="h-4 w-4 text-primary" />
                        {cat}
                        <Badge variant="secondary" className="text-[9px]">{items.length}</Badge>
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {items.map((p: any) => (
                          <Card key={p.id} className="rounded-xl overflow-hidden group cursor-pointer" onClick={() => setQuickViewProduct(p)}>
                            {p.image_url ? (
                              <div className="h-40 bg-muted overflow-hidden">
                                <img src={p.image_url} className="h-full w-full object-cover transition-transform group-hover:scale-105" alt={p.name} />
                              </div>
                            ) : (
                              <div className="h-40 bg-muted/50 flex items-center justify-center">
                                <Package className="h-10 w-10 text-muted-foreground/20" />
                              </div>
                            )}
                            <CardContent className="p-4 space-y-2">
                              <h4 className="font-medium text-sm">{isAr && p.name_ar ? p.name_ar : p.name}</h4>
                              {p.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {isAr && p.description_ar ? p.description_ar : p.description}
                                </p>
                              )}
                              <div className="flex items-center justify-between">
                                <div className="flex gap-1.5">
                                  {p.sku && <Badge variant="outline" className="text-[9px] font-mono">{p.sku}</Badge>}
                                  {p.in_stock ? (
                                    <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20 text-[9px]">{isAr ? "متوفر" : "In Stock"}</Badge>
                                  ) : (
                                    <Badge variant="destructive" className="text-[9px]">{isAr ? "نفد" : "Out of Stock"}</Badge>
                                  )}
                                </div>
                                {p.unit_price > 0 && (
                                  <span className="text-sm font-bold text-primary">
                                    {p.unit_price} <span className="text-[10px] font-normal">{p.currency || "SAR"}</span>
                                  </span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Sponsorships Tab */}
            <TabsContent value="sponsorships">
              {sponsorships.length === 0 ? (
                <div className="py-16 text-center">
                  <Crown className="mx-auto mb-3 h-12 w-12 text-muted-foreground/20" />
                  <p className="text-muted-foreground">{isAr ? "لا توجد رعايات حالياً" : "No active sponsorships"}</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {sponsorships.map((s: any) => {
                    const title = isAr && s.competitions?.title_ar ? s.competitions.title_ar : s.competitions?.title;
                    return (
                      <Card key={s.id} className="cursor-pointer rounded-xl transition-all hover:shadow-md hover:-translate-y-0.5"
                        onClick={() => navigate(`/competitions/${s.competitions?.id || ""}`)}>
                        <CardContent className="flex items-center gap-3 p-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-4/10">
                            <Crown className="h-5 w-5 text-chart-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{title}</p>
                            <Badge variant="outline" className="mt-1 text-[9px] uppercase tracking-wider">{s.tier}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Ad Campaigns */}
              {adCampaigns.length > 0 && (
                <div className="mt-8">
                  <Separator className="mb-6" />
                  <h3 className="mb-4 text-base font-semibold">
                    {isAr ? "الحملات الإعلانية النشطة" : "Active Ad Campaigns"}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {adCampaigns.map((c: any) => (
                      <Card key={c.id} className="rounded-xl">
                        <CardContent className="p-4">
                          <p className="font-medium text-sm">{isAr && c.name_ar ? c.name_ar : c.name}</p>
                          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="secondary" className="text-[9px]">{c.status}</Badge>
                            {c.start_date && <span>{new Date(c.start_date).toLocaleDateString()}</span>}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact">
              <div className="grid gap-6 md:grid-cols-2">
                <SupplierContactForm companyId={company.id} companyName={isAr && company.name_ar ? company.name_ar : company.name} />
                <div className="space-y-4">
                  {(company.phone || company.email || company.website) && (
                    <Card className="rounded-2xl border-border/40">
                      <CardContent className="p-5 space-y-3">
                        {company.phone && (
                          <a href={`tel:${company.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                            <Phone className="h-4 w-4" /> {company.phone}
                          </a>
                        )}
                        {company.email && (
                          <a href={`mailto:${company.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                            <Mail className="h-4 w-4" /> {company.email}
                          </a>
                        )}
                        {company.website && (
                          <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                            <Globe className="h-4 w-4" /> {company.website}
                          </a>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  <div>
                    <p className="text-sm font-medium mb-2">{isAr ? "مشاركة" : "Share"}</p>
                    <SupplierShareButtons companyName={company.name} companyId={company.id} />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews">
              <SupplierReviews companyId={company.id} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
      <ProductQuickView product={quickViewProduct} open={!!quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </div>
  );
}
