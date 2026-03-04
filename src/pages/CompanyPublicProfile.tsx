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
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { countryFlag } from "@/lib/countryFlag";
import { useAllCountries } from "@/hooks/useCountries";
import { COMPANY_ROLES } from "@/hooks/useCompanyRoles";
import {
  Building2, Phone, Mail, Globe, MapPin, Shield, Hash, Earth,
  Users, Crown, ArrowLeft, CheckCircle, Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CompanyPublicProfile() {
  const { id } = useParams();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isAr = language === "ar";
  const { data: countries = [] } = useAllCountries();

  const { data: company, isLoading } = useQuery({
    queryKey: ["companyPublic", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, name_ar, description, description_ar, logo_url, cover_image_url, website, email, phone, country_code, city, country, address, postal_code, type, status, is_verified, social_links, company_number, rating, total_reviews, classifications, operating_countries, created_at")
        .eq("id", id)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["companyPublicRoles", id],
    queryFn: async () => {
      if (!id) return [];
      const { data } = await supabase
        .from("company_role_assignments")
        .select("role, is_active")
        .eq("company_id", id)
        .eq("is_active", true);
      return data || [];
    },
    enabled: !!id,
  });

  const { data: sponsorships = [] } = useQuery({
    queryKey: ["companyPublicSponsorships", id],
    queryFn: async () => {
      if (!id) return [];
      const { data } = await supabase
        .from("competition_sponsors")
        .select("id, tier, competitions:competition_id(title, title_ar)")
        .eq("company_id", id)
        .eq("status", "approved")
        .limit(6);
      return data || [];
    },
    enabled: !!id,
  });

  const getCountryName = (code: string | null) => {
    if (!code) return null;
    const c = countries.find((ct) => ct.code === code);
    return c ? (isAr ? c.name_ar || c.name : c.name) : code;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-8">
          <Skeleton className="h-64 rounded-2xl" />
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
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
          <p className="mt-2 text-muted-foreground">{isAr ? "هذه الشركة غير متاحة أو غير نشطة" : "This company is unavailable or inactive"}</p>
          <Button variant="outline" className="mt-6" onClick={() => navigate(-1)}>
            <ArrowLeft className="me-2 h-4 w-4" />
            {isAr ? "رجوع" : "Go Back"}
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const activeRoles = roles.map(r => {
    const def = COMPANY_ROLES.find(cr => cr.value === r.role);
    return def ? (isAr ? def.labelAr : def.label) : r.role;
  });

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead title={`${company.name} - Altoha`} description={company.description || `${company.name} company profile`} />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10">
          {company.cover_image_url && (
            <img src={company.cover_image_url} className="absolute inset-0 h-full w-full object-cover opacity-15" alt="" />
          )}
          <div className="container relative py-12 md:py-16">
            <Button variant="ghost" size="sm" className="mb-6" onClick={() => navigate(-1)}>
              <ArrowLeft className="me-2 h-4 w-4" />
              {isAr ? "رجوع" : "Back"}
            </Button>

            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[2rem] bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-2xl shadow-primary/20">
                {company.logo_url ? (
                  <img src={company.logo_url} className="h-16 w-16 object-contain" alt={company.name} />
                ) : (
                  <Building2 className="h-12 w-12" />
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <h1 className="font-serif text-3xl font-bold md:text-4xl">{isAr && company.name_ar ? company.name_ar : company.name}</h1>
                  {company.name_ar && !isAr && (
                    <p className="mt-1 font-serif text-lg text-muted-foreground/60 italic">{company.name_ar}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-primary/10 text-primary border-primary/20 uppercase text-[10px] tracking-widest px-3 py-1">
                    {company.type}
                  </Badge>
                  {company.is_verified && (
                    <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20 gap-1 text-[10px]">
                      <CheckCircle className="h-3 w-3" />
                      {isAr ? "موثّق" : "Verified"}
                    </Badge>
                  )}
                  {company.company_number && (
                    <Badge variant="outline" className="bg-muted/50 font-mono text-[10px] px-3 py-1">
                      <Hash className="me-1 h-3 w-3" />
                      {company.company_number}
                    </Badge>
                  )}
                  {company.country_code && (
                    <Badge variant="outline" className="bg-muted/50 text-[10px] px-3 py-1">
                      {countryFlag(company.country_code)} {getCountryName(company.country_code)}
                    </Badge>
                  )}
                </div>

                {activeRoles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {activeRoles.map((r, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">{r}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {company.description && (
              <p className="mt-6 max-w-3xl text-muted-foreground leading-relaxed">
                {isAr && company.description_ar ? company.description_ar : company.description}
              </p>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="container py-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Contact */}
            {(company.phone || company.email || company.website) && (
              <Card className="rounded-2xl border-border/40">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Phone className="h-4 w-4 text-primary" />
                    {isAr ? "الاتصال" : "Contact"}
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

            {/* Location */}
            {(company.address || company.city) && (
              <Card className="rounded-2xl border-border/40">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-4 w-4 text-primary" />
                    {isAr ? "الموقع" : "Location"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>{[company.address, company.city, company.country].filter(Boolean).join(", ")}</p>
                  {company.postal_code && <p className="mt-1 text-xs">{isAr ? "رمز بريدي:" : "Postal:"} {company.postal_code}</p>}
                </CardContent>
              </Card>
            )}

            {/* Classifications */}
            {company.classifications && company.classifications.length > 0 && (
              <Card className="rounded-2xl border-border/40">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Package className="h-4 w-4 text-primary" />
                    {isAr ? "التصنيفات" : "Classifications"}
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
          </div>

          {/* Sponsored Competitions */}
          {sponsorships.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                <Crown className="h-5 w-5 text-chart-4" />
                {isAr ? "المسابقات المُرعاة" : "Sponsored Competitions"}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sponsorships.map((s: any) => {
                  const title = isAr && s.competitions?.title_ar ? s.competitions.title_ar : s.competitions?.title;
                  return (
                    <Card key={s.id} className="cursor-pointer rounded-xl border-border/40 transition-all hover:shadow-md hover:-translate-y-0.5"
                      onClick={() => navigate(`/competitions/${s.competitions?.id || ""}`)}>
                      <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-4/10">
                          <Crown className="h-5 w-5 text-chart-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{title}</p>
                          <Badge variant="outline" className="mt-1 text-[9px] uppercase tracking-wider">
                            {s.tier}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Operating Countries */}
          {company.operating_countries && company.operating_countries.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
                <Earth className="h-5 w-5 text-primary" />
                {isAr ? "مناطق العمل" : "Operating Regions"}
              </h2>
              <div className="flex flex-wrap gap-2">
                {company.operating_countries.map((cc) => (
                  <Badge key={cc} variant="secondary" className="rounded-xl text-sm px-3 py-1.5">
                    {countryFlag(cc)} {getCountryName(cc)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
