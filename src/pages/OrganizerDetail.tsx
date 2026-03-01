import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { deriveExhibitionStatus } from "@/lib/exhibitionStatus";
import { Header } from "@/components/Header";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Building2, Mail, Phone, Globe, MapPin, Calendar, Eye, Landmark,
  Users, TrendingUp, ExternalLink, Newspaper, ChevronRight,
  Award, Target, Sparkles, BarChart3, Clock, Star,
  Share2, Twitter, Facebook, Linkedin, Instagram, ArrowUpRight,
  CalendarDays, Ticket, GraduationCap, Swords, Mic2, BookOpen,
} from "lucide-react";
import { format, formatDistanceToNow, differenceInDays, isPast, isFuture } from "date-fns";
import { ar } from "date-fns/locale";
import { useMemo, useState, useEffect } from "react";

interface ExhibitionRow {
  [key: string]: any;
}

export default function OrganizerDetail() {
  const { name } = useParams<{ name: string }>();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const decodedName = decodeURIComponent(name || "");
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");

  const { data, isLoading } = useQuery({
    queryKey: ["organizer-detail", decodedName],
    queryFn: async () => {
      // Try to find organizer in the dedicated table first (by slug)
      const { data: orgRecord } = await supabase
        .from("organizers")
        .select("*")
        .eq("slug", decodedName)
        .maybeSingle();

      // Fetch exhibitions linked to this organizer
      let exhibitions: any[] = [];
      if (orgRecord) {
        const { data: exByOrgId } = await supabase
          .from("exhibitions")
          .select("*")
          .or(`organizer_id.eq.${orgRecord.id},organizer_name.eq.${orgRecord.name}`)
          .order("start_date", { ascending: false });
        exhibitions = exByOrgId || [];
      } else {
        // Fallback: lookup by organizer_name in exhibitions
        const { data: exByName } = await supabase
          .from("exhibitions")
          .select("*")
          .eq("organizer_name", decodedName)
          .order("start_date", { ascending: false });
        exhibitions = exByName || [];
      }

      const { data: articles } = await supabase
        .from("articles")
        .select("id, title, title_ar, slug, excerpt, excerpt_ar, featured_image_url, published_at, type, status")
        .eq("status", "published")
        .or(`content.ilike.%${orgRecord?.name || decodedName}%,title.ilike.%${orgRecord?.name || decodedName}%`)
        .order("published_at", { ascending: false })
        .limit(10);

      let totalTickets = 0;
      let totalReviews = 0;
      if (exhibitions.length > 0) {
        const exIds = exhibitions.map(e => e.id);
        const { count: ticketCount } = await supabase
          .from("exhibition_tickets")
          .select("id", { count: "exact", head: true })
          .in("exhibition_id", exIds);
        totalTickets = ticketCount || 0;

        const { count: reviewCount } = await supabase
          .from("exhibition_reviews")
          .select("id", { count: "exact", head: true })
          .in("exhibition_id", exIds);
        totalReviews = reviewCount || 0;
      }

      return {
        orgRecord,
        exhibitions,
        articles: articles || [],
        totalTickets,
        totalReviews,
      };
    },
    enabled: !!decodedName,
  });

  // Increment views
  useEffect(() => {
    if (data?.orgRecord?.id) {
      supabase.rpc("increment_organizer_views", { p_organizer_id: data.orgRecord.id }).then();
    }
  }, [data?.orgRecord?.id]);

  const exhibitions = data?.exhibitions || [];
  const articles = data?.articles || [];
  const orgRecord = data?.orgRecord;

  // Derive organizer info: prefer orgRecord, fallback to first exhibition
  const org = orgRecord || exhibitions[0] || null;
  const useOrgRecord = !!orgRecord;

  // Compute all derived data
  const computed = useMemo(() => {
    if (!exhibitions.length && !orgRecord) return null;

    const orgName = useOrgRecord
      ? (isAr && org?.name_ar ? org.name_ar : org?.name || decodedName)
      : (isAr && org?.organizer_name_ar ? org.organizer_name_ar : org?.organizer_name || decodedName);
    const orgLogo = useOrgRecord ? org?.logo_url : (org?.organizer_logo_url || org?.logo_url);
    const orgDescription = useOrgRecord ? (isAr && org?.description_ar ? org.description_ar : org?.description) : null;
    const orgGallery: string[] = useOrgRecord ? (org?.gallery_urls || []) : [];
    const orgKeyContacts: any[] = useOrgRecord ? (org?.key_contacts || []) : [];
    const totalExhibitions = exhibitions.length;
    const totalViews = useOrgRecord && org?.total_views ? org.total_views : exhibitions.reduce((s: number, e: ExhibitionRow) => s + (e.view_count || 0), 0);
    const countries = [...new Set(exhibitions.map((e: ExhibitionRow) => e.country).filter(Boolean))] as string[];
    const cities = [...new Set(exhibitions.map((e: ExhibitionRow) => e.city).filter(Boolean))] as string[];
    const types = [...new Set(exhibitions.map((e: ExhibitionRow) => e.type))] as string[];
    const venues = [...new Set(exhibitions.map((e: ExhibitionRow) => isAr && e.venue_ar ? e.venue_ar : e.venue).filter(Boolean))] as string[];

    // Cover from orgRecord or latest exhibition
    const coverImage = useOrgRecord ? org?.cover_image_url : exhibitions.find((e: ExhibitionRow) => e.cover_image_url)?.cover_image_url;

    // Aggregate sectors, categories, tags
    const allSectors = new Set<string>();
    const allCategories = new Set<string>();
    const allTags = new Set<string>();
    exhibitions.forEach((e: ExhibitionRow) => {
      (e.targeted_sectors || []).forEach((s: string) => allSectors.add(s));
      (e.categories || []).forEach((c: string) => allCategories.add(c));
      (e.tags || []).forEach((t: string) => allTags.add(t));
    });

    // Services offered
    const services = {
      competitions: exhibitions.some((e: ExhibitionRow) => e.includes_competitions),
      training: exhibitions.some((e: ExhibitionRow) => e.includes_training),
      seminars: exhibitions.some((e: ExhibitionRow) => e.includes_seminars),
    };

    // Social links from org exhibitions
    const rawSocial = exhibitions.find((e: ExhibitionRow) => e.social_links)?.social_links;
    const socialLinks: Record<string, string> = (rawSocial && typeof rawSocial === 'object' && !Array.isArray(rawSocial))
      ? rawSocial as Record<string, string> : {};

    // Group by year
    const byYear: Record<string, ExhibitionRow[]> = {};
    exhibitions.forEach((e: ExhibitionRow) => {
      const year = new Date(e.start_date).getFullYear().toString();
      if (!byYear[year]) byYear[year] = [];
      byYear[year].push(e);
    });
    const sortedYears = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

    // Upcoming & past breakdown
    const upcoming = exhibitions.filter((e: ExhibitionRow) => e.start_date && isFuture(new Date(e.start_date)));
    const past = exhibitions.filter((e: ExhibitionRow) => e.end_date && isPast(new Date(e.end_date)));
    const active = exhibitions.filter((e: ExhibitionRow) => {
      if (!e.start_date || !e.end_date) return false;
      const now = new Date();
      return now >= new Date(e.start_date) && now <= new Date(e.end_date);
    });

    // Earliest & latest year
    const years = exhibitions.map((e: ExhibitionRow) => new Date(e.start_date).getFullYear()).filter(Boolean);
    const firstYear = Math.min(...years);
    const lastYear = Math.max(...years);

    // Aggregate edition stats
    const editionStats: { exhibitors?: number; visitors?: number; area?: number } = {};
    exhibitions.forEach((e: ExhibitionRow) => {
      if (e.edition_stats) {
        const stats = typeof e.edition_stats === 'string' ? JSON.parse(e.edition_stats) : e.edition_stats;
        if (stats.exhibitors) editionStats.exhibitors = (editionStats.exhibitors || 0) + Number(stats.exhibitors);
        if (stats.visitors) editionStats.visitors = (editionStats.visitors || 0) + Number(stats.visitors);
        if (stats.area) editionStats.area = Math.max(editionStats.area || 0, Number(stats.area));
      }
    });

    // Aggregate sponsors
    const allSponsors: { name: string; logo?: string; tier?: string }[] = [];
    exhibitions.forEach((e: ExhibitionRow) => {
      if (e.sponsors_info && Array.isArray(e.sponsors_info)) {
        e.sponsors_info.forEach((s: any) => {
          if (s.name && !allSponsors.some(sp => sp.name === s.name)) {
            allSponsors.push({ name: s.name, logo: s.logo_url || s.logo, tier: s.tier });
          }
        });
      }
    });

    // Next upcoming event
    const nextEvent = upcoming.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())[0];

    return {
      orgName, orgLogo, coverImage, totalExhibitions, totalViews,
      countries, cities, types, venues, services, socialLinks,
      byYear, sortedYears, upcoming, past, active,
      firstYear, lastYear, allSectors, allCategories, allTags,
      editionStats, allSponsors, nextEvent,
      orgDescription, orgGallery, orgKeyContacts,
    };
  }, [exhibitions, isAr, org, decodedName, useOrgRecord, orgRecord]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1">
          <Skeleton className="h-56 w-full" />
          <div className="container max-w-6xl py-8 space-y-6">
            <Skeleton className="h-12 w-1/3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
            <Skeleton className="h-80 w-full rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (!org || !computed) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 container max-w-6xl py-16 text-center">
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-semibold mb-2">{isAr ? "لم يتم العثور على المنظم" : "Organizer Not Found"}</h2>
          <p className="text-muted-foreground text-sm">{isAr ? "لا توجد بيانات لهذا المنظم" : "No data available for this organizer"}</p>
          <Link to="/exhibitions">
            <Button variant="outline" className="mt-4">{isAr ? "العودة للمعارض" : "Back to Exhibitions"}</Button>
          </Link>
        </main>
      </div>
    );
  }

  const {
    orgName, orgLogo, coverImage, totalExhibitions, totalViews,
    countries, cities, types, venues, services, socialLinks,
    byYear, sortedYears, upcoming, past, active,
    firstYear, lastYear, allSectors, allCategories, allTags,
    editionStats, allSponsors, nextEvent,
    orgDescription, orgGallery, orgKeyContacts,
  } = computed;

  // Contact info: prefer orgRecord, fallback to exhibition data
  const contactEmail = orgRecord?.email || org?.organizer_email;
  const contactPhone = orgRecord?.phone || org?.organizer_phone;
  const contactWebsite = orgRecord?.website || org?.organizer_website;

  return (
    <div className="flex min-h-screen flex-col bg-background" dir={isAr ? "rtl" : "ltr"}>
      <SEOHead
        title={`${orgName} — ${isAr ? "منظم الفعاليات" : "Event Organizer"}`}
        description={`${orgName} — ${totalExhibitions} ${isAr ? "فعالية في" : "events across"} ${countries.length} ${isAr ? "دولة" : "countries"}`}
      />
      <Header />

      <main className="flex-1">
        {/* ═══════ Hero Section ═══════ */}
        <div className="relative">
          {coverImage ? (
            <div className="h-52 md:h-64 overflow-hidden relative">
              <img src={coverImage} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            </div>
          ) : (
            <div className="h-40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
          )}

          <div className="container max-w-6xl relative">
            <div className={`flex flex-col sm:flex-row items-start gap-5 ${coverImage ? "-mt-16" : "-mt-8"}`}>
              <Avatar className="h-24 w-24 rounded-2xl border-4 border-background shadow-lg ring-2 ring-primary/20">
                {orgLogo ? <AvatarImage src={orgLogo} alt={orgName} /> : null}
                <AvatarFallback className="rounded-2xl bg-primary/10 text-primary text-3xl font-bold">
                  {orgName.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0 pt-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{orgName}</h1>
                    {org.organizer_name_ar && !isAr && (
                      <p className="text-sm text-muted-foreground mt-0.5" dir="rtl">{org.organizer_name_ar}</p>
                    )}
                    {org.organizer_name && isAr && (
                      <p className="text-sm text-muted-foreground mt-0.5" dir="ltr">{org.organizer_name}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {contactWebsite && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={contactWebsite.startsWith("http") ? contactWebsite : `https://${contactWebsite}`}
                          target="_blank" rel="noopener noreferrer"
                        >
                          <Globe className="h-3.5 w-3.5 me-1.5" />
                          {isAr ? "الموقع" : "Website"}
                          <ExternalLink className="h-3 w-3 ms-1" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Quick badges */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Calendar className="h-3 w-3" />
                    {firstYear === lastYear ? firstYear : `${firstYear} – ${lastYear}`}
                  </Badge>
                  {countries.map(c => (
                    <Badge key={c} variant="outline" className="text-xs gap-1">
                      <MapPin className="h-3 w-3" />{c}
                    </Badge>
                  ))}
                  {active.length > 0 && (
                    <Badge variant="secondary" className="text-xs gap-1 border-primary/20 text-primary">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                      </span>
                      {isAr ? "فعالية جارية الآن" : "Live Event"}
                    </Badge>
                  )}
                </div>

                {/* Social Links Row */}
                {Object.keys(socialLinks).length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {socialLinks.twitter && (
                      <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <Twitter className="h-4 w-4" />
                      </a>
                    )}
                    {socialLinks.facebook && (
                      <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <Facebook className="h-4 w-4" />
                      </a>
                    )}
                    {socialLinks.linkedin && (
                      <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                    {socialLinks.instagram && (
                      <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <Instagram className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}

                {/* Description */}
                {orgDescription && (
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{orgDescription}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════ Stats Grid ═══════ */}
        <div className="container max-w-6xl py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { icon: Landmark, label: isAr ? "المعارض" : "Events", value: totalExhibitions, color: "text-primary" },
              { icon: Eye, label: isAr ? "المشاهدات" : "Views", value: totalViews.toLocaleString(), color: "text-blue-500" },
              { icon: MapPin, label: isAr ? "الدول" : "Countries", value: countries.length, color: "text-emerald-500" },
              { icon: Building2, label: isAr ? "المدن" : "Cities", value: cities.length, color: "text-orange-500" },
              { icon: Ticket, label: isAr ? "التذاكر" : "Tickets", value: (data?.totalTickets || 0).toLocaleString(), color: "text-violet-500" },
              { icon: Star, label: isAr ? "التقييمات" : "Reviews", value: (data?.totalReviews || 0).toLocaleString(), color: "text-amber-500" },
            ].map(s => (
              <Card key={s.label} className="border-border/40 hover:shadow-sm transition-shadow">
                <CardContent className="p-3 text-center">
                  <div className={`flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-muted/50 mb-2 ${s.color}`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Next Event Highlight */}
          {nextEvent && (
            <Link to={`/exhibitions/${nextEvent.slug}`} className="block mt-4 group">
              <Card className="border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors overflow-hidden">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                    <CalendarDays className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                      {isAr ? "الفعالية القادمة" : "Next Upcoming Event"}
                    </p>
                    <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                      {isAr && nextEvent.title_ar ? nextEvent.title_ar : nextEvent.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(nextEvent.start_date), "dd MMM yyyy")}
                      {nextEvent.city && ` • ${nextEvent.city}`}
                      {" • "}
                      {formatDistanceToNow(new Date(nextEvent.start_date), { addSuffix: true, locale: isAr ? ar : undefined })}
                    </p>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-primary shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </CardContent>
              </Card>
            </Link>
          )}
        </div>

        {/* ═══════ Main Content Tabs ═══════ */}
        <div className="container max-w-6xl pb-12 space-y-6">
          <Tabs defaultValue="exhibitions" className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
              <TabsTrigger value="exhibitions" className="gap-1.5">
                <Landmark className="h-3.5 w-3.5" />
                {isAr ? "المعارض" : "Events"}
                <Badge variant="secondary" className="ms-1 text-[9px] h-4 px-1.5">{totalExhibitions}</Badge>
              </TabsTrigger>
              <TabsTrigger value="profile" className="gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {isAr ? "الملف التعريفي" : "Profile"}
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" />
                {isAr ? "الإحصائيات" : "Analytics"}
              </TabsTrigger>
              {allSponsors.length > 0 && (
                <TabsTrigger value="partners" className="gap-1.5">
                  <Award className="h-3.5 w-3.5" />
                  {isAr ? "الشركاء" : "Partners"}
                  <Badge variant="secondary" className="ms-1 text-[9px] h-4 px-1.5">{allSponsors.length}</Badge>
                </TabsTrigger>
              )}
              {articles.length > 0 && (
                <TabsTrigger value="news" className="gap-1.5">
                  <Newspaper className="h-3.5 w-3.5" />
                  {isAr ? "الأخبار" : "News"}
                  <Badge variant="secondary" className="ms-1 text-[9px] h-4 px-1.5">{articles.length}</Badge>
                </TabsTrigger>
              )}
            </TabsList>

            {/* ═══════ Exhibitions Tab ═══════ */}
            <TabsContent value="exhibitions" className="space-y-6 mt-4">
              {/* View toggle + filter summary */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2 text-xs">
                  <Badge variant={upcoming.length ? "default" : "outline"} className="text-[10px]">
                    {upcoming.length} {isAr ? "قادمة" : "Upcoming"}
                  </Badge>
                  <Badge variant={active.length ? "default" : "outline"} className="text-[10px]">
                    {active.length} {isAr ? "جارية" : "Active"}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {past.length} {isAr ? "سابقة" : "Past"}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" className="h-7 px-2 text-[10px]" onClick={() => setViewMode("grid")}>
                    {isAr ? "شبكة" : "Grid"}
                  </Button>
                  <Button variant={viewMode === "timeline" ? "default" : "ghost"} size="sm" className="h-7 px-2 text-[10px]" onClick={() => setViewMode("timeline")}>
                    {isAr ? "جدول زمني" : "Timeline"}
                  </Button>
                </div>
              </div>

              {viewMode === "timeline" ? (
                /* Timeline View */
                <div className="relative">
                  <div className="absolute top-0 bottom-0 start-6 w-px bg-border" />
                  {sortedYears.map(year => (
                    <div key={year} className="mb-8">
                      <div className="flex items-center gap-3 mb-4 relative">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold z-10">
                          {year}
                        </div>
                        <span className="text-sm text-muted-foreground">{byYear[year].length} {isAr ? "فعالية" : "events"}</span>
                      </div>
                      <div className="ms-16 space-y-3">
                        {byYear[year].map((ex: ExhibitionRow) => {
                          const derived = deriveExhibitionStatus({ dbStatus: ex.status, startDate: ex.start_date, endDate: ex.end_date, registrationDeadline: ex.registration_deadline });
                          return (
                            <Link key={ex.id} to={`/exhibitions/${ex.slug}`} className="group block">
                              <Card className="hover:shadow-md transition-all border-border/40 hover:border-primary/30">
                                <CardContent className="p-3 flex items-center gap-4">
                                  {ex.cover_image_url && (
                                    <img src={ex.cover_image_url} alt="" className="h-16 w-24 rounded-xl object-cover shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                                      {isAr && ex.title_ar ? ex.title_ar : ex.title}
                                    </h4>
                                    <p className="text-[11px] text-muted-foreground">
                                      {format(new Date(ex.start_date), "dd MMM")}
                                      {ex.end_date && ` – ${format(new Date(ex.end_date), "dd MMM")}`}
                                      {ex.city && ` • ${ex.city}`}
                                    </p>
                                    <div className="flex gap-1 mt-1">
                                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium ${derived.color}`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${derived.dot}`} />
                                        {isAr ? derived.labelAr : derived.label}
                                      </span>
                                    </div>
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                </CardContent>
                              </Card>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Grid View */
                sortedYears.map(year => (
                  <div key={year}>
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-lg font-bold">{year}</h3>
                      <Badge variant="outline" className="text-[10px]">{byYear[year].length} {isAr ? "فعالية" : "events"}</Badge>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {byYear[year].map((ex: ExhibitionRow) => {
                        const derived = deriveExhibitionStatus({ dbStatus: ex.status, startDate: ex.start_date, endDate: ex.end_date, registrationDeadline: ex.registration_deadline });
                        const edStats = ex.edition_stats ? (typeof ex.edition_stats === 'string' ? JSON.parse(ex.edition_stats) : ex.edition_stats) : null;
                        return (
                          <Link key={ex.id} to={`/exhibitions/${ex.slug}`} className="group">
                            <Card className="overflow-hidden hover:shadow-md transition-all border-border/40 hover:border-primary/30 h-full">
                              {ex.cover_image_url && (
                                <div className="relative h-36 overflow-hidden">
                                  <img src={ex.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                  <div className="absolute top-2 end-2">
                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium backdrop-blur-sm ${derived.color}`}>
                                      {derived.status === "started" ? (
                                        <span className="relative flex h-2 w-2">
                                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
                                          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
                                        </span>
                                      ) : (
                                        <span className={`h-2 w-2 rounded-full ${derived.dot}`} />
                                      )}
                                      {isAr ? derived.labelAr : derived.label}
                                    </span>
                                  </div>
                                  {ex.edition_year && (
                                    <div className="absolute bottom-2 start-2">
                                      <Badge variant="secondary" className="text-[9px] backdrop-blur-sm bg-background/80">
                                        {isAr ? "الإصدار" : "Edition"} {ex.edition_year}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              )}
                              <CardContent className="p-3 space-y-2">
                                <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                                  {isAr && ex.title_ar ? ex.title_ar : ex.title}
                                </h4>
                                <p className="text-[11px] text-muted-foreground">
                                  {format(new Date(ex.start_date), "dd MMM yyyy")}
                                  {ex.end_date && ` → ${format(new Date(ex.end_date), "dd MMM yyyy")}`}
                                </p>

                                <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                                  {ex.city && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{ex.city}</span>}
                                  {(ex.view_count || 0) > 0 && <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{ex.view_count}</span>}
                                  {ex.max_attendees && <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{ex.max_attendees}</span>}
                                </div>

                                {/* Edition Stats Mini */}
                                {edStats && (
                                  <div className="grid grid-cols-3 gap-1 pt-1 border-t border-border/40">
                                    {edStats.visitors && (
                                      <div className="text-center">
                                        <p className="text-[10px] font-semibold">{Number(edStats.visitors).toLocaleString()}</p>
                                        <p className="text-[8px] text-muted-foreground">{isAr ? "زائر" : "Visitors"}</p>
                                      </div>
                                    )}
                                    {edStats.exhibitors && (
                                      <div className="text-center">
                                        <p className="text-[10px] font-semibold">{Number(edStats.exhibitors).toLocaleString()}</p>
                                        <p className="text-[8px] text-muted-foreground">{isAr ? "عارض" : "Exhibitors"}</p>
                                      </div>
                                    )}
                                    {edStats.area && (
                                      <div className="text-center">
                                        <p className="text-[10px] font-semibold">{Number(edStats.area).toLocaleString()}</p>
                                        <p className="text-[8px] text-muted-foreground">m²</p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className="flex flex-wrap gap-1 pt-1">
                                  <Badge variant="secondary" className="text-[9px] capitalize">{ex.type.replace(/_/g, " ")}</Badge>
                                  {ex.is_free && <Badge variant="outline" className="text-[9px]">{isAr ? "مجاني" : "Free"}</Badge>}
                                  {ex.is_virtual && <Badge variant="outline" className="text-[9px]">{isAr ? "افتراضي" : "Virtual"}</Badge>}
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            {/* ═══════ Profile Tab ═══════ */}
            <TabsContent value="profile" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Contact Info */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      {isAr ? "معلومات التواصل" : "Contact Information"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {contactEmail && (
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                        <a href={`mailto:${contactEmail}`} className="text-primary hover:underline truncate">{contactEmail}</a>
                      </div>
                    )}
                    {contactPhone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <a href={`tel:${contactPhone}`} className="text-primary hover:underline" dir="ltr">{contactPhone}</a>
                      </div>
                    )}
                    {contactWebsite && (
                      <div className="flex items-center gap-3 text-sm">
                        <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                        <a href={contactWebsite.startsWith("http") ? contactWebsite : `https://${contactWebsite}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate flex items-center gap-1">
                          {contactWebsite.replace(/^https?:\/\//, "")}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {!contactEmail && !contactPhone && !contactWebsite && (
                      <p className="text-sm text-muted-foreground">{isAr ? "لا توجد معلومات تواصل" : "No contact information available"}</p>
                    )}
                  </CardContent>
                </Card>

                {/* Locations */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      {isAr ? "التواجد الجغرافي" : "Geographic Presence"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground mb-1.5">{isAr ? "الدول" : "Countries"}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {countries.map(c => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}
                      </div>
                    </div>
                    {cities.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground mb-1.5">{isAr ? "المدن" : "Cities"}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {cities.map(c => <Badge key={c} variant="outline" className="text-xs">{c}</Badge>)}
                          </div>
                        </div>
                      </>
                    )}
                    {venues.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground mb-1.5">{isAr ? "الأماكن" : "Venues"}</p>
                          <div className="space-y-1.5">
                            {venues.map(v => (
                              <div key={v} className="flex items-center gap-2 text-sm">
                                <Landmark className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span>{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Services & Expertise */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      {isAr ? "الخدمات والتخصصات" : "Services & Expertise"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      {types.map(t => {
                        const count = exhibitions.filter((e: ExhibitionRow) => e.type === t).length;
                        const pct = Math.round((count / totalExhibitions) * 100);
                        return (
                          <div key={t}>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="capitalize text-xs">{t.replace(/_/g, " ")}</span>
                              <span className="text-[10px] text-muted-foreground">{count} ({pct}%)</span>
                            </div>
                            <Progress value={pct} className="h-1.5" />
                          </div>
                        );
                      })}
                    </div>
                    <Separator />
                    <div className="flex flex-wrap gap-1.5">
                      {services.competitions && (
                        <Badge variant="secondary" className="text-[10px] gap-1"><Swords className="h-3 w-3" />{isAr ? "مسابقات" : "Competitions"}</Badge>
                      )}
                      {services.training && (
                        <Badge variant="secondary" className="text-[10px] gap-1"><GraduationCap className="h-3 w-3" />{isAr ? "تدريب" : "Training"}</Badge>
                      )}
                      {services.seminars && (
                        <Badge variant="secondary" className="text-[10px] gap-1"><Mic2 className="h-3 w-3" />{isAr ? "ندوات" : "Seminars"}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Sectors & Categories */}
                {(allSectors.size > 0 || allCategories.size > 0) && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        {isAr ? "القطاعات المستهدفة" : "Target Sectors"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {allSectors.size > 0 && (
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground mb-1.5">{isAr ? "القطاعات" : "Sectors"}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {[...allSectors].map(s => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
                          </div>
                        </div>
                      )}
                      {allCategories.size > 0 && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-[10px] font-medium text-muted-foreground mb-1.5">{isAr ? "التصنيفات" : "Categories"}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {[...allCategories].map(c => <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>)}
                            </div>
                          </div>
                        </>
                      )}
                      {allTags.size > 0 && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-[10px] font-medium text-muted-foreground mb-1.5">{isAr ? "العلامات" : "Tags"}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {[...allTags].slice(0, 15).map(t => <Badge key={t} variant="outline" className="text-[9px]">{t}</Badge>)}
                              {allTags.size > 15 && <Badge variant="outline" className="text-[9px]">+{allTags.size - 15}</Badge>}
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* ═══════ Analytics Tab ═══════ */}
            <TabsContent value="stats" className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Activity Overview */}
                <Card className="md:col-span-2 lg:col-span-3">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      {isAr ? "نشاط المنظم عبر السنوات" : "Organizer Activity Over Years"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-1 h-32">
                      {sortedYears.slice().reverse().map(year => {
                        const count = byYear[year].length;
                        const maxCount = Math.max(...Object.values(byYear).map(arr => arr.length));
                        const heightPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                        return (
                          <div key={year} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-[9px] font-semibold">{count}</span>
                            <div className="w-full bg-primary/20 rounded-t-sm relative" style={{ height: `${Math.max(heightPct, 8)}%` }}>
                              <div className="absolute inset-0 bg-primary rounded-t-sm" />
                            </div>
                            <span className="text-[9px] text-muted-foreground">{year}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Aggregated Edition Stats */}
                {(editionStats.visitors || editionStats.exhibitors || editionStats.area) && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        {isAr ? "إحصائيات تراكمية" : "Cumulative Stats"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {editionStats.visitors && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{isAr ? "إجمالي الزوار" : "Total Visitors"}</span>
                          <span className="text-lg font-bold">{editionStats.visitors.toLocaleString()}</span>
                        </div>
                      )}
                      {editionStats.exhibitors && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{isAr ? "إجمالي العارضين" : "Total Exhibitors"}</span>
                          <span className="text-lg font-bold">{editionStats.exhibitors.toLocaleString()}</span>
                        </div>
                      )}
                      {editionStats.area && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{isAr ? "أكبر مساحة" : "Largest Area"}</span>
                          <span className="text-lg font-bold">{editionStats.area.toLocaleString()} m²</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Event Type Distribution */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      {isAr ? "توزيع الحالات" : "Status Distribution"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-xs">{isAr ? "قادمة" : "Upcoming"}</span>
                      <Badge variant="secondary" className="text-[10px]">{upcoming.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-xs">{isAr ? "جارية" : "Active"}</span>
                      <Badge variant="secondary" className="text-[10px]">{active.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-xs">{isAr ? "منتهية" : "Completed"}</span>
                      <Badge variant="secondary" className="text-[10px]">{past.length}</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Geographic Reach */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      {isAr ? "التوزيع الجغرافي" : "Geographic Reach"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {countries.map(country => {
                      const countryEvents = exhibitions.filter((e: ExhibitionRow) => e.country === country);
                      const pct = Math.round((countryEvents.length / totalExhibitions) * 100);
                      return (
                        <div key={country}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>{country}</span>
                            <span className="text-muted-foreground">{countryEvents.length} ({pct}%)</span>
                          </div>
                          <Progress value={pct} className="h-1.5" />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ═══════ Partners Tab ═══════ */}
            {allSponsors.length > 0 && (
              <TabsContent value="partners" className="mt-4">
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {allSponsors.map((sponsor, i) => (
                    <Card key={i} className="border-border/40">
                      <CardContent className="p-4 flex items-center gap-3">
                        {sponsor.logo ? (
                          <img src={sponsor.logo} alt={sponsor.name} className="h-10 w-10 rounded-xl object-contain bg-muted p-1" />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Award className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{sponsor.name}</p>
                          {sponsor.tier && <Badge variant="outline" className="text-[9px] mt-0.5 capitalize">{sponsor.tier}</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            )}

            {/* ═══════ News Tab ═══════ */}
            {articles.length > 0 && (
              <TabsContent value="news" className="mt-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {articles.map(article => (
                    <Link key={article.id} to={`/news/${article.slug}`} className="group">
                      <Card className="overflow-hidden hover:shadow-md transition-all border-border/40 hover:border-primary/30 h-full">
                        {article.featured_image_url && (
                          <img src={article.featured_image_url} alt="" className="w-full h-36 object-cover" />
                        )}
                        <CardContent className="p-3">
                          <h4 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">
                            {isAr && article.title_ar ? article.title_ar : article.title}
                          </h4>
                          {(article.excerpt || article.excerpt_ar) && (
                            <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2">
                              {isAr && article.excerpt_ar ? article.excerpt_ar : article.excerpt}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-[9px] capitalize">{article.type}</Badge>
                            {article.published_at && (
                              <span className="text-[10px] text-muted-foreground">
                                {format(new Date(article.published_at), "dd MMM yyyy")}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  );
}
