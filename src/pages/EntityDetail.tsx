import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAllCountries } from "@/hooks/useCountries";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { toEnglishDigits } from "@/lib/formatNumber";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { countryFlag } from "@/lib/countryFlag";
import {
  Building2, MapPin, Globe, Mail, Phone, Users, ShieldCheck,
  Bell, BellOff, ArrowLeft, ExternalLink, Share2, Calendar, Award, Target,
  GraduationCap, BookOpen, Trophy, ArrowRight, Crown, Newspaper, Briefcase,
  Clock
} from "lucide-react";
import { QRCodeDisplay } from "@/components/qr/QRCodeDisplay";
import { useEntityQRCode } from "@/hooks/useQRCode";
import { EntityProgramsTab } from "@/components/entities/EntityProgramsTab";
import { EntityMembersTab } from "@/components/entities/EntityMembersTab";
import { EntityLeadershipSection } from "@/components/entities/EntityLeadershipSection";
import { EntityDegreesTab } from "@/components/entities/EntityDegreesTab";
import { EntityEventsTab } from "@/components/entities/EntityEventsTab";
import { EntityCompetitionsTab } from "@/components/entities/EntityCompetitionsTab";
import { EntityNewsTab } from "@/components/entities/EntityNewsTab";
import { EntityStatsStrip } from "@/components/entities/EntityStatsStrip";
import { EntitySocialLinks } from "@/components/entities/EntitySocialLinks";
import { EntityOverviewCard } from "@/components/entities/EntityOverviewCard";
import { EntityNotificationsCard } from "@/components/entities/EntityNotificationsCard";
import { EntityMapEmbed } from "@/components/entities/EntityMapEmbed";
import { EntityContactCard } from "@/components/entities/EntityContactCard";
import entitiesHero from "@/assets/entities-hero.jpg";
import type { Database } from "@/integrations/supabase/types";

type EntityType = Database["public"]["Enums"]["entity_type"];
type EntityScope = Database["public"]["Enums"]["entity_scope"];

const typeLabels: Record<EntityType, { en: string; ar: string }> = {
  culinary_association: { en: "Culinary Association", ar: "جمعية طهي" },
  government_entity: { en: "Government Entity", ar: "جهة حكومية" },
  private_association: { en: "Private Association", ar: "جمعية خاصة" },
  culinary_academy: { en: "Culinary Academy", ar: "أكاديمية طهي" },
  industry_body: { en: "Industry Body", ar: "هيئة صناعية" },
  university: { en: "University", ar: "جامعة" },
  college: { en: "College", ar: "كلية" },
  training_center: { en: "Training Center", ar: "مركز تدريب" },
};

const scopeLabels: Record<EntityScope, { en: string; ar: string }> = {
  local: { en: "Local", ar: "محلي" },
  national: { en: "National", ar: "وطني" },
  regional: { en: "Regional", ar: "إقليمي" },
  international: { en: "International", ar: "دولي" },
};

const educationalTypes: EntityType[] = ["culinary_academy", "university", "college", "training_center"];

export default function EntityDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const { data: countries = [] } = useAllCountries();

  // Helper to get localized country name
  const getCountryName = (nameOrCode: string | null) => {
    if (!nameOrCode) return null;
    // Try to find by code or by name
    const c = countries.find((ct) => ct.code === nameOrCode || ct.name === nameOrCode || ct.name_ar === nameOrCode);
    if (c) return isAr ? (c.name_ar || c.name) : c.name;
    return nameOrCode;
  };

  const { data: entity, isLoading } = useQuery({
    queryKey: ["entity", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("culinary_entities")
        .select("id, name, name_ar, slug, entity_number, type, scope, description, description_ar, mission, mission_ar, abbreviation, abbreviation_ar, logo_url, cover_image_url, email, phone, website, address, address_ar, city, country, country_code, postal_code, latitude, longitude, founded_year, member_count, president_name, president_name_ar, secretary_name, secretary_name_ar, services, specializations, affiliated_organizations, social_links, gallery_urls, is_verified, status, view_count, map_url")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Entity not found");
      return data;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 3,
  });

  const { data: isFollowing } = useQuery({
    queryKey: ["entity-follow", entity?.id, user?.id],
    queryFn: async () => {
      if (!user || !entity) return false;
      const { data } = await supabase
        .from("entity_followers")
        .select("id")
        .eq("entity_id", entity.id)
        .eq("user_id", user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!entity,
  });

  const { data: followerCount = 0 } = useQuery({
    queryKey: ["entity-followers-count", entity?.id],
    queryFn: async () => {
      if (!entity) return 0;
      const { count } = await supabase
        .from("entity_followers")
        .select("id", { count: "exact", head: true })
        .eq("entity_id", entity.id);
      return count || 0;
    },
    enabled: !!entity,
    staleTime: 1000 * 60 * 2,
  });

  const { data: counts } = useQuery({
    queryKey: ["entity-counts", entity?.id],
    queryFn: async () => {
      if (!entity) return { competitions: 0, programs: 0, events: 0, positions: 0, memberships: 0 };
      const [compRes, progRes, eventRes, posRes, memRes] = await Promise.all([
        supabase.from("entity_competition_participations").select("id", { count: "exact", head: true }).eq("entity_id", entity.id),
        supabase.from("entity_programs").select("id", { count: "exact", head: true }).eq("entity_id", entity.id),
        supabase.from("entity_events").select("id", { count: "exact", head: true }).eq("entity_id", entity.id),
        supabase.from("entity_positions").select("id", { count: "exact", head: true }).eq("entity_id", entity.id).eq("is_active", true),
        supabase.from("entity_memberships").select("id", { count: "exact", head: true }).eq("entity_id", entity.id),
      ]);
      return {
        competitions: compRes.count || 0,
        programs: progRes.count || 0,
        events: eventRes.count || 0,
        positions: posRes.count || 0,
        memberships: memRes.count || 0,
      };
    },
    enabled: !!entity,
    staleTime: 1000 * 60 * 5,
  });

  const { data: qrCode } = useEntityQRCode("company", entity?.id, "company");

  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (!user || !entity) throw new Error("Not authenticated");
      if (isFollowing) {
        await supabase.from("entity_followers").delete().eq("entity_id", entity.id).eq("user_id", user.id);
      } else {
        await supabase.from("entity_followers").insert({ entity_id: entity.id, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity-follow"] });
      queryClient.invalidateQueries({ queryKey: ["entity-followers-count"] });
      toast({
        title: isFollowing ? (isAr ? "تم إلغاء المتابعة" : "Unfollowed") : (isAr ? "تم المتابعة" : "Following"),
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <Skeleton className="h-64 w-full md:h-80" />
        <main className="container flex-1 py-6 md:py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-start gap-5">
                <Skeleton className="h-20 w-20 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-7 w-3/4" />
                </div>
              </div>
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
            <div className="hidden lg:block space-y-4">
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="container flex-1 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Building2 className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground mb-1">{isAr ? "الجهة غير موجودة" : "Entity not found"}</p>
          <p className="text-xs text-muted-foreground/60 mb-5">{isAr ? "تحقق من الرابط وحاول مرة أخرى" : "Check the link and try again"}</p>
          <Button variant="outline" size="sm" asChild>
            <Link to="/entities">
              {isAr ? <ArrowRight className="me-1.5 h-4 w-4" /> : <ArrowLeft className="me-1.5 h-4 w-4" />}
              {isAr ? "العودة للدليل" : "Back to Directory"}
            </Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  // === Bilingual field resolution ===
  const name = isAr && entity.name_ar ? entity.name_ar : entity.name;
  const altName = isAr ? entity.name : entity.name_ar;
  const description = isAr && entity.description_ar ? entity.description_ar : entity.description;
  const mission = isAr && entity.mission_ar ? entity.mission_ar : entity.mission;
  const address = isAr && entity.address_ar ? entity.address_ar : entity.address;
  const abbreviation = isAr && entity.abbreviation_ar ? entity.abbreviation_ar : entity.abbreviation;
  const presidentName = isAr && entity.president_name_ar ? entity.president_name_ar : entity.president_name;
  const secretaryName = isAr && entity.secretary_name_ar ? entity.secretary_name_ar : entity.secretary_name;
  const localizedCity = getCountryName(entity.city) || entity.city;
  const localizedCountry = getCountryName(entity.country) || entity.country;
  const tLabel = typeLabels[entity.type as EntityType];
  const sLabel = scopeLabels[entity.scope as EntityScope];
  const services = (entity.services as string[]) || [];
  const specializations = (entity.specializations as string[]) || [];
  const affiliates = (entity.affiliated_organizations as string[]) || [];
  const isEducational = educationalTypes.includes(entity.type as EntityType);
  const BackIcon = isAr ? ArrowRight : ArrowLeft;

  // SEO
  const seoTitle = name;
  const seoDescription = description
    ? description.substring(0, 155)
    : `${isAr ? tLabel.ar : tLabel.en} - ${[localizedCity, localizedCountry].filter(Boolean).join(", ")}`;
  const canonicalUrl = `${window.location.origin}/entities/${entity.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": isEducational ? "EducationalOrganization" : "Organization",
    name: entity.name,
    ...(entity.name_ar && { alternateName: entity.name_ar }),
    description: entity.description || undefined,
    url: entity.website || canonicalUrl,
    ...(entity.logo_url && { logo: entity.logo_url }),
    ...(entity.email && { email: entity.email }),
    ...(entity.phone && { telephone: entity.phone }),
    ...(entity.founded_year && { foundingDate: String(entity.founded_year) }),
    ...(entity.country && {
      address: {
        "@type": "PostalAddress",
        addressLocality: entity.city || undefined,
        addressCountry: entity.country,
        streetAddress: entity.address || undefined,
        postalCode: entity.postal_code || undefined,
      },
    }),
    ...(entity.latitude && entity.longitude && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: entity.latitude,
        longitude: entity.longitude,
      },
    }),
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        ogImage={entity.cover_image_url || entity.logo_url || undefined}
        ogType="profile"
        canonical={canonicalUrl}
        lang={language}
        jsonLd={jsonLd}
        keywords={[isAr ? tLabel.ar : tLabel.en, localizedCity, localizedCountry, entity.name, entity.name_ar].filter(Boolean).join(", ")}
      />
      <Header />

      {/* Hero Cover Banner */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {entity.cover_image_url ? (
            <img src={entity.cover_image_url} alt={name} className="h-full w-full object-cover" />
          ) : (
            <img src={entitiesHero} alt="" className="h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/50 to-transparent" />
        </div>

        <div className="absolute -top-20 start-1/4 h-48 w-48 rounded-full bg-primary/10 blur-[80px] animate-pulse pointer-events-none" />
        <div className="absolute -top-16 end-1/3 h-40 w-40 rounded-full bg-accent/10 blur-[60px] animate-pulse [animation-delay:1s] pointer-events-none" />

        <div className="container relative py-12 md:py-16">
          <Button variant="ghost" size="sm" className="mb-6 -ms-2 backdrop-blur-sm bg-background/30 hover:bg-background/50" asChild>
            <Link to="/entities">
              <BackIcon className="me-1.5 h-4 w-4" />
              {isAr ? "العودة للدليل" : "Back to Directory"}
            </Link>
          </Button>

          <div className="flex items-start gap-5">
            {entity.logo_url ? (
              <img src={entity.logo_url} alt={name} className="h-20 w-20 rounded-2xl border-2 border-background/50 object-cover shadow-xl ring-1 ring-border/10 backdrop-blur-sm md:h-24 md:w-24" />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-background/50 bg-background/80 shadow-xl ring-1 ring-border/10 backdrop-blur-sm md:h-24 md:w-24">
                {isEducational ? <GraduationCap className="h-10 w-10 text-primary" /> : <Building2 className="h-10 w-10 text-primary" />}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="backdrop-blur-sm bg-secondary/80">{isAr ? tLabel.ar : tLabel.en}</Badge>
                <Badge variant="outline" className="backdrop-blur-sm bg-background/50">{isAr ? sLabel.ar : sLabel.en}</Badge>
                {entity.is_verified && (
                  <Badge className="bg-chart-3/20 text-chart-3 backdrop-blur-sm">
                    <ShieldCheck className="me-1 h-3 w-3" />{isAr ? "موثق" : "Verified"}
                  </Badge>
                )}
                {entity.website && (
                  <Badge variant="outline" className="bg-primary/5 text-primary backdrop-blur-sm">
                    <Globe className="me-1 h-3 w-3" />{isAr ? "موقع إلكتروني" : "Website"}
                  </Badge>
                )}
              </div>
              <h1 className="font-serif text-2xl font-bold md:text-3xl lg:text-4xl">{name}</h1>
              {altName && altName !== name && (
                <p className="text-muted-foreground/60 mt-0.5 font-serif text-lg italic">{altName}</p>
              )}
              {abbreviation && (
                <p className="text-muted-foreground mt-0.5">({abbreviation})</p>
              )}
              <div className="mt-1 flex items-center gap-3">
                <p className="text-sm text-muted-foreground/70 font-mono" dir="ltr">#{entity.entity_number}</p>
                {(localizedCity || localizedCountry) && (
                  <span className="text-sm text-muted-foreground/70 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {entity.country && countryFlag(entity.country)}{" "}
                    {localizedCity ? `${localizedCity}, ` : ""}{localizedCountry}
                  </span>
                )}
              </div>

              <EntityStatsStrip
                followerCount={followerCount}
                memberCount={entity.member_count}
                competitionCount={counts?.competitions}
                programCount={counts?.programs}
                eventCount={counts?.events}
                positionCount={counts?.positions}
                foundedYear={entity.founded_year}
                viewCount={entity.view_count}
                website={entity.website}
              />
            </div>
          </div>
        </div>
      </section>

      <main className="container flex-1 py-6 md:py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Description */}
            {description && (
              <div className="prose prose-sm max-w-none text-foreground/80 dark:prose-invert">
                <p className="whitespace-pre-line leading-relaxed">{description}</p>
              </div>
            )}

            {/* Mission */}
            {mission && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                    <Target className="h-4 w-4 text-primary" />
                  </div>
                  {isAr ? "الرسالة" : "Mission"}
                </h2>
                <Card><CardContent className="pt-4 text-sm text-foreground/80 leading-relaxed">{mission}</CardContent></Card>
              </section>
            )}

            {/* Services */}
            {services.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-chart-1/10">
                    <Award className="h-4 w-4 text-chart-1" />
                  </div>
                  {isAr ? "الخدمات" : "Services"}
                  <Badge variant="outline" className="ms-auto text-xs">{services.length}</Badge>
                </h2>
                <div className="flex flex-wrap gap-2">
                  {services.map(s => (
                    <Badge key={s} variant="outline" className="py-1.5 px-3 bg-muted/30">{s}</Badge>
                  ))}
                </div>
              </section>
            )}

            {/* Specializations */}
            {specializations.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-chart-2/10">
                    <BookOpen className="h-4 w-4 text-chart-2" />
                  </div>
                  {isAr ? "التخصصات" : "Specializations"}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {specializations.map(s => <Badge key={s} variant="secondary" className="py-1.5">{s}</Badge>)}
                </div>
              </section>
            )}

            {/* Leadership */}
            <EntityLeadershipSection
              entityId={entity.id}
              presidentName={presidentName}
              secretaryName={secretaryName}
            />

            {/* Affiliated */}
            {affiliates.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-chart-5/10">
                    <Building2 className="h-4 w-4 text-chart-5" />
                  </div>
                  {isAr ? "المنظمات التابعة" : "Affiliated Organizations"}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {affiliates.map(a => <Badge key={a} variant="outline">{a}</Badge>)}
                </div>
              </section>
            )}

            {/* Gallery */}
            {entity.gallery_urls && entity.gallery_urls.length > 0 && (
              <section>
                <h2 className="mb-3 text-xl font-semibold">{isAr ? "معرض الصور" : "Gallery"}</h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {entity.gallery_urls.map((url, i) => (
                    <img key={i} src={url} alt={`${name} ${i + 1}`} className="rounded-xl object-cover aspect-video shadow-sm hover:shadow-md transition-shadow" />
                  ))}
                </div>
              </section>
            )}

            {/* Tabs */}
            <Tabs defaultValue="news" className="mt-8">
              <TabsList className="flex-wrap bg-muted/50 p-1 gap-0.5">
                <TabsTrigger value="news" className="gap-1.5 text-xs sm:text-sm">
                  <Newspaper className="h-3.5 w-3.5" />{isAr ? "الأخبار" : "News"}
                </TabsTrigger>
                <TabsTrigger value="programs" className="gap-1.5 text-xs sm:text-sm">
                  <BookOpen className="h-3.5 w-3.5" />{isAr ? "البرامج" : "Programs"}
                  {counts?.programs ? <Badge variant="secondary" className="ms-1 h-4 px-1 text-[9px]">{counts.programs}</Badge> : null}
                </TabsTrigger>
                <TabsTrigger value="members" className="gap-1.5 text-xs sm:text-sm">
                  <Users className="h-3.5 w-3.5" />{isAr ? "الأعضاء" : "Members"}
                  {counts?.memberships ? <Badge variant="secondary" className="ms-1 h-4 px-1 text-[9px]">{counts.memberships}</Badge> : null}
                </TabsTrigger>
                <TabsTrigger value="degrees" className="gap-1.5 text-xs sm:text-sm">
                  <GraduationCap className="h-3.5 w-3.5" />{isAr ? "الشهادات" : "Degrees"}
                </TabsTrigger>
                <TabsTrigger value="events" className="gap-1.5 text-xs sm:text-sm">
                  <Calendar className="h-3.5 w-3.5" />{isAr ? "الفعاليات" : "Events"}
                  {counts?.events ? <Badge variant="secondary" className="ms-1 h-4 px-1 text-[9px]">{counts.events}</Badge> : null}
                </TabsTrigger>
                <TabsTrigger value="competitions" className="gap-1.5 text-xs sm:text-sm">
                  <Trophy className="h-3.5 w-3.5" />{isAr ? "المسابقات" : "Competitions"}
                  {counts?.competitions ? <Badge variant="secondary" className="ms-1 h-4 px-1 text-[9px]">{counts.competitions}</Badge> : null}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="news" className="mt-4">
                <EntityNewsTab entityId={entity.id} entityName={entity.name} entityNameAr={entity.name_ar} />
              </TabsContent>
              <TabsContent value="programs" className="mt-4">
                <EntityProgramsTab entityId={entity.id} />
              </TabsContent>
              <TabsContent value="members" className="mt-4">
                <EntityMembersTab entityId={entity.id} />
              </TabsContent>
              <TabsContent value="degrees" className="mt-4">
                <EntityDegreesTab entityId={entity.id} />
              </TabsContent>
              <TabsContent value="events" className="mt-4">
                <EntityEventsTab entityId={entity.id} />
              </TabsContent>
              <TabsContent value="competitions" className="mt-4">
                <EntityCompetitionsTab entityId={entity.id} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Actions */}
            <Card className="overflow-hidden">
              <div className="border-b bg-muted/30 px-4 py-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <div className="flex h-6 w-6 items-center justify-center rounded-xl bg-primary/10">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                  </div>
                  {isAr ? "إجراءات" : "Actions"}
                </h3>
              </div>
              <CardContent className="space-y-3 p-4">
                {user && (
                  <Button
                    variant={isFollowing ? "outline" : "default"}
                    className="w-full"
                    onClick={() => toggleFollow.mutate()}
                    disabled={toggleFollow.isPending}
                  >
                    {isFollowing ? <><BellOff className="me-2 h-4 w-4" />{isAr ? "إلغاء المتابعة" : "Unfollow"}</>
                      : <><Bell className="me-2 h-4 w-4" />{isAr ? "تابع للتحديثات" : "Follow for Updates"}</>}
                  </Button>
                )}
                {entity.website && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={entity.website} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="me-2 h-4 w-4" />{isAr ? "الموقع الرسمي" : "Visit Website"}
                    </a>
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="w-full" onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast({ title: isAr ? "تم نسخ الرابط" : "Link copied!" });
                }}>
                  <Share2 className="me-2 h-4 w-4" />{isAr ? "مشاركة" : "Share"}
                </Button>
              </CardContent>
            </Card>

            {/* Overview Card */}
            <EntityOverviewCard entity={entity} followerCount={followerCount} counts={counts} />

            {/* Map */}
            <EntityMapEmbed
              latitude={entity.latitude}
              longitude={entity.longitude}
              name={entity.name}
              address={address}
              city={localizedCity}
              country={localizedCountry}
              isAr={isAr}
            />

            {/* Recent Activity */}
            <EntityNotificationsCard entityId={entity.id} entityName={name} />

            {/* Contact Info */}
            <EntityContactCard
              email={entity.email}
              phone={entity.phone}
              fax={entity.fax}
              address={address}
              city={localizedCity}
              country={localizedCountry}
              postalCode={entity.postal_code}
              isAr={isAr}
            />

            {/* Social Links */}
            {entity.social_links && <EntitySocialLinks socialLinks={entity.social_links} />}

            {/* QR Code */}
            {qrCode && (
              <QRCodeDisplay
                code={qrCode.code}
                label={isAr ? "رمز QR للجهة" : "Entity QR Code"}
                size={140}
                compact={false}
              />
            )}

            {/* Quick Facts */}
            <Card className="overflow-hidden">
              <div className="border-b bg-muted/30 px-4 py-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <div className="flex h-6 w-6 items-center justify-center rounded-xl bg-chart-1/10">
                    <Calendar className="h-3.5 w-3.5 text-chart-1" />
                  </div>
                  {isAr ? "معلومات سريعة" : "Quick Facts"}
                </h3>
              </div>
              <CardContent className="p-0 text-sm">
                {entity.founded_year && (
                  <FactRow label={isAr ? "تأسست" : "Founded"} value={toEnglishDigits(String(entity.founded_year))} />
                )}
                {entity.member_count && (
                  <FactRow label={isAr ? (isEducational ? "الطلاب المسجلون" : "الأعضاء المسجلون") : (isEducational ? "Enrolled Students" : "Registered Members")} value={<AnimatedCounter value={entity.member_count} format />} />
                )}
                {entity.registration_number && (
                  <FactRow label={isAr ? "رقم التسجيل" : "Reg. #"} value={entity.registration_number} mono />
                )}
                {entity.license_number && (
                  <FactRow label={isAr ? "الترخيص" : "License #"} value={entity.license_number} mono />
                )}
                {entity.license_expires_at && (
                  <FactRow
                    label={isAr ? "انتهاء الترخيص" : "License Expires"}
                    value={toEnglishDigits(new Date(entity.license_expires_at).toLocaleDateString(isAr ? "ar-SA" : "en-US"))}
                  />
                )}
                {entity.verification_level && (
                  <FactRow label={isAr ? "مستوى التحقق" : "Verification Level"} value={entity.verification_level} />
                )}
                {entity.view_count != null && entity.view_count > 0 && (
                  <FactRow label={isAr ? "المشاهدات" : "Page Views"} value={<AnimatedCounter value={entity.view_count} format />} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}


function FactRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b last:border-0">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={`font-medium ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
