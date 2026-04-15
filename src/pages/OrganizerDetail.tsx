import { Link } from "react-router-dom";
import { deriveExhibitionStatus } from "@/lib/exhibitionStatus";
import { safeJsonLd } from "@/lib/safeJsonLd";
import { Header } from "@/components/Header";
import { safeLazy } from "@/lib/safeLazy";

const OrganizerAnalyticsTab = safeLazy(() => import("@/components/organizers/OrganizerAnalyticsTab").then(m => ({ default: m.OrganizerAnalyticsTab })));
const OrganizerRatingSummary = safeLazy(() => import("@/components/organizers/OrganizerRatingSummary").then(m => ({ default: m.OrganizerRatingSummary })));
import { SEOHead } from "@/components/SEOHead";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Footer } from "@/components/Footer";
import {
  Building2, Mail, Phone, Globe, MapPin, Calendar, Eye, Landmark,
  Users, TrendingUp, ExternalLink, Newspaper, ChevronRight,
  Award, Target, Sparkles, BarChart3, Clock, Star,
  Share2, Twitter, Facebook, Linkedin, Instagram, ArrowUpRight, Heart,
  CalendarDays, Ticket, GraduationCap, Swords, Mic2, BookOpen,
  Copy, Check, Image as ImageIcon, UserCircle2, ChevronLeft,
  CircleDot, AlertCircle, X,
} from "lucide-react";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { ar } from "date-fns/locale";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useOrganizerDetailData } from "./organizer-detail/useOrganizerDetailData";

export default function OrganizerDetail() {
  const d = useOrganizerDetailData();
  const { isAr, org, orgRecord, computed, exhibitions, articles, data } = d;

  if (d.isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1">
          <Skeleton className="h-56 w-full" />
          <div className="container max-w-6xl py-8 space-y-6">
            <Skeleton className="h-12 w-1/3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
            </div>
            <Skeleton className="h-80 w-full rounded-2xl" />
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
          <Link to="/organizers">
            <Button variant="outline" className="mt-4">{isAr ? "العودة للمنظمين" : "Back to Organizers"}</Button>
          </Link>
        </main>
      </div>
    );
  }

  const {
    orgName, orgNameSecondary, orgLogo, coverImage, totalExhibitions, totalViews,
    countries, cities, types, venues, services, socialLinks,
    byYear, sortedYears, upcoming, past, active,
    firstYear, lastYear, allSectors, allCategories, allTags,
    editionStats, allSponsors, nextEvent,
    orgDescription, orgGallery, orgKeyContacts, uniqueGallery,
  } = computed;

  const { contactEmail, contactPhone, contactWebsite, flag } = d;

  return (
    <div className="flex min-h-screen flex-col bg-background" dir={isAr ? "rtl" : "ltr"}>
      <SEOHead
        title={`${orgName} — ${isAr ? "منظم الفعاليات" : "Event Organizer"}`}
        description={`${orgName} — ${totalExhibitions} ${isAr ? "فعالية في" : "events across"} ${countries.length} ${isAr ? "دولة" : "countries"}`}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: orgName,
        description: computed?.orgDescription || undefined,
        logo: orgLogo || undefined,
        image: coverImage || undefined,
        url: typeof window !== "undefined" ? window.location.href : undefined,
        numberOfEmployees: computed?.orgKeyContacts?.length || undefined,
      }) }} />
      <Header />

      <main className="flex-1">
        {/* Breadcrumbs */}
        <div className="container max-w-6xl pt-3">
          <Breadcrumbs items={[
            { label: "Organizers", labelAr: "المنظمون", href: "/organizers" },
            { label: orgName },
          ]} />
        </div>

        {/* ═══════ Hero Section ═══════ */}
        <div className="relative">
          {coverImage ? (
            <div className="h-56 md:h-72 overflow-hidden relative">
              <img src={coverImage} alt={`${orgName} cover`} loading="lazy" className="w-full h-full object-cover" decoding="async" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/10" />
            </div>
          ) : (
            <div className="h-44 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
          )}

          <div className="container max-w-6xl relative">
            <div className={`flex flex-col sm:flex-row items-start gap-5 ${coverImage ? "-mt-16" : "-mt-8"}`}>
              <Avatar className="h-28 w-28 rounded-3xl border-4 border-background shadow-xl ring-2 ring-primary/20">
                {orgLogo ? <AvatarImage src={orgLogo} alt={orgName} /> : null}
                <AvatarFallback className="rounded-3xl bg-primary/10 text-primary text-3xl font-bold">
                  {orgName.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0 pt-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl md:text-3xl font-bold tracking-tight" dir={isAr ? "rtl" : "ltr"} style={isAr ? { fontFamily: "'Noto Sans Arabic', sans-serif" } : undefined}>
                        {orgName}
                      </h1>
                      {orgRecord?.is_verified && (
                        <TooltipProvider><Tooltip><TooltipTrigger asChild>
                          <span><Badge variant="secondary" className="gap-1 text-[12px]"><Check className="h-3 w-3 text-primary" />{isAr ? "موثق" : "Verified"}</Badge></span>
                        </TooltipTrigger><TooltipContent>{isAr ? "منظم موثق من المنصة" : "Verified by platform"}</TooltipContent></Tooltip></TooltipProvider>
                      )}
                      {orgRecord?.organizer_number && (
                        <Badge variant="outline" className="text-[12px] font-mono h-5">{orgRecord.organizer_number}</Badge>
                      )}
                    </div>
                    {orgNameSecondary && orgNameSecondary !== orgName && (
                      <p className="text-sm text-muted-foreground mt-0.5" dir={isAr ? "ltr" : "rtl"}
                        style={!isAr ? { fontFamily: "'Noto Sans Arabic', sans-serif" } : undefined}>{orgNameSecondary}</p>
                    )}
                    {(orgRecord?.city || orgRecord?.country) && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-sm text-muted-foreground">
                        {flag && <span className="text-base">{flag}</span>}
                        <MapPin className="h-3.5 w-3.5 text-primary/60" />
                        <span>{[isAr ? orgRecord?.city_ar || orgRecord?.city : orgRecord?.city, isAr ? orgRecord?.country_ar || orgRecord?.country : orgRecord?.country].filter(Boolean).join("، ")}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant={d.isFollowing ? "default" : "outline"} size="sm" className="gap-1.5" onClick={d.handleFollow}>
                      <Heart className={`h-3.5 w-3.5 ${d.isFollowing ? "fill-current" : ""}`} />
                      {d.isFollowing ? (isAr ? "متابَع" : "Following") : (isAr ? "متابعة" : "Follow")}
                    </Button>
                    <TooltipProvider><Tooltip><TooltipTrigger asChild>
                      <Button variant="outline" size="icon" className="h-9 w-9" onClick={d.handleShare}>
                        {d.copied ? <Check className="h-4 w-4 text-primary" /> : <Share2 className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger><TooltipContent>{isAr ? "مشاركة" : "Share"}</TooltipContent></Tooltip></TooltipProvider>
                    {contactWebsite && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={contactWebsite.startsWith("http") ? contactWebsite : `https://${contactWebsite}`} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-3.5 w-3.5 me-1.5" />{isAr ? "الموقع" : "Website"}<ExternalLink className="h-3 w-3 ms-1" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Quick badges */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {orgRecord?.founded_year && (
                    <Badge variant="secondary" className="text-xs gap-1"><Calendar className="h-3 w-3" />{isAr ? `تأسس ${orgRecord.founded_year}` : `Est. ${orgRecord.founded_year}`}</Badge>
                  )}
                  <Badge variant="secondary" className="text-xs gap-1"><Calendar className="h-3 w-3" />{firstYear === lastYear ? firstYear : `${firstYear} – ${lastYear}`}</Badge>
                  {countries.map(c => <Badge key={c} variant="outline" className="text-xs gap-1"><MapPin className="h-3 w-3" />{c}</Badge>)}
                  {active.length > 0 && (
                    <Badge variant="secondary" className="text-xs gap-1 border-primary/20 text-primary">
                      <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-primary" /></span>
                      {isAr ? "فعالية جارية الآن" : "Live Event"}
                    </Badge>
                  )}
                </div>

                {/* Social Links */}
                {Object.keys(socialLinks).length > 0 && (
                  <div className="flex gap-3 mt-3">
                    {socialLinks.twitter && <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Twitter className="h-4 w-4" /></a>}
                    {socialLinks.facebook && <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Facebook className="h-4 w-4" /></a>}
                    {socialLinks.linkedin && <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Linkedin className="h-4 w-4" /></a>}
                    {socialLinks.instagram && <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Instagram className="h-4 w-4" /></a>}
                  </div>
                )}

                {orgDescription && (
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-3 max-w-2xl" dir={isAr ? "rtl" : "ltr"} style={isAr ? { fontFamily: "'Noto Sans Arabic', sans-serif" } : undefined}>{orgDescription}</p>
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
              { icon: Eye, label: isAr ? "المشاهدات" : "Views", value: totalViews, color: "text-blue-500" },
              { icon: MapPin, label: isAr ? "الدول" : "Countries", value: countries.length, color: "text-emerald-500" },
              { icon: Building2, label: isAr ? "المدن" : "Cities", value: cities.length, color: "text-orange-500" },
              { icon: Ticket, label: isAr ? "التذاكر" : "Tickets", value: data?.totalTickets || 0, color: "text-violet-500" },
              { icon: Star, label: isAr ? "التقييمات" : "Reviews", value: data?.totalReviews || 0, color: "text-amber-500" },
            ].map(s => (
              <Card key={s.label} className="border-border/40 hover:shadow-sm transition-shadow rounded-2xl">
                <CardContent className="p-3 text-center">
                  <div className={`flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-muted/50 mb-2 ${s.color}`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <p className="text-xl font-bold"><AnimatedCounter value={s.value} /></p>
                  <p className="text-[12px] text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Edition Stats */}
          {(editionStats.visitors || editionStats.exhibitors || editionStats.area) && (
            <div className="grid grid-cols-3 gap-3 mt-3">
              {editionStats.visitors && (
                <Card className="border-border/40 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent">
                  <CardContent className="p-3 text-center">
                    <Users className="h-5 w-5 mx-auto text-primary mb-1" />
                    <p className="text-lg font-bold">{editionStats.visitors.toLocaleString()}</p>
                    <p className="text-[12px] text-muted-foreground">{isAr ? "إجمالي الزوار" : "Total Visitors"}</p>
                  </CardContent>
                </Card>
              )}
              {editionStats.exhibitors && (
                <Card className="border-border/40 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent">
                  <CardContent className="p-3 text-center">
                    <Target className="h-5 w-5 mx-auto text-primary mb-1" />
                    <p className="text-lg font-bold">{editionStats.exhibitors.toLocaleString()}</p>
                    <p className="text-[12px] text-muted-foreground">{isAr ? "إجمالي العارضين" : "Total Exhibitors"}</p>
                  </CardContent>
                </Card>
              )}
              {editionStats.area && (
                <Card className="border-border/40 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent">
                  <CardContent className="p-3 text-center">
                    <Sparkles className="h-5 w-5 mx-auto text-primary mb-1" />
                    <p className="text-lg font-bold">{editionStats.area.toLocaleString()}</p>
                    <p className="text-[12px] text-muted-foreground">{isAr ? "م² مساحة المعرض" : "m² Exhibition Area"}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Next Event */}
          {nextEvent && (
            <Link to={`/exhibitions/${nextEvent.slug}`} className="block mt-4 group">
              <Card className="border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors overflow-hidden rounded-2xl">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                    <CalendarDays className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-primary uppercase tracking-wider">{isAr ? "الفعالية القادمة" : "Next Upcoming Event"}</p>
                    <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                      {isAr && nextEvent.title_ar ? nextEvent.title_ar : nextEvent.title}
                    </h3>
                    <p className="text-[12px] text-muted-foreground">
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
          <OrganizerRatingSummary exhibitionIds={exhibitions.map((e) => e.id)} isAr={isAr} />

          <Tabs value={d.activeTab} onValueChange={d.setActiveTab} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
              <TabsTrigger value="exhibitions" className="gap-1.5">
                <Landmark className="h-3.5 w-3.5" />{isAr ? "المعارض" : "Events"}
                <Badge variant="secondary" className="ms-1 text-[12px] h-4 px-1.5">{totalExhibitions}</Badge>
              </TabsTrigger>
              {upcoming.length > 0 && (
                <TabsTrigger value="upcoming" className="gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />{isAr ? "القادمة" : "Upcoming"}
                  <Badge variant="secondary" className="ms-1 text-[12px] h-4 px-1.5">{upcoming.length}</Badge>
                </TabsTrigger>
              )}
              <TabsTrigger value="gallery" className="gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" />{isAr ? "المعرض" : "Gallery"}
                {uniqueGallery.length > 0 && <Badge variant="secondary" className="ms-1 text-[12px] h-4 px-1.5">{uniqueGallery.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="profile" className="gap-1.5">
                <Building2 className="h-3.5 w-3.5" />{isAr ? "الملف التعريفي" : "Profile"}
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" />{isAr ? "الإحصائيات" : "Analytics"}
              </TabsTrigger>
              {orgKeyContacts.length > 0 && (
                <TabsTrigger value="team" className="gap-1.5">
                  <UserCircle2 className="h-3.5 w-3.5" />{isAr ? "الفريق" : "Team"}
                </TabsTrigger>
              )}
              {allSponsors.length > 0 && (
                <TabsTrigger value="partners" className="gap-1.5">
                  <Award className="h-3.5 w-3.5" />{isAr ? "الشركاء" : "Partners"}
                  <Badge variant="secondary" className="ms-1 text-[12px] h-4 px-1.5">{allSponsors.length}</Badge>
                </TabsTrigger>
              )}
              {articles.length > 0 && (
                <TabsTrigger value="news" className="gap-1.5">
                  <Newspaper className="h-3.5 w-3.5" />{isAr ? "الأخبار" : "News"}
                  <Badge variant="secondary" className="ms-1 text-[12px] h-4 px-1.5">{articles.length}</Badge>
                </TabsTrigger>
              )}
            </TabsList>

            <div {...d.swipeHandlers} className="touch-pan-y">

            {/* ═══════ Exhibitions Tab ═══════ */}
            <TabsContent value="exhibitions" className="space-y-6 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-2 text-xs">
                  <Badge variant={upcoming.length ? "default" : "outline"} className="text-[12px]">{upcoming.length} {isAr ? "قادمة" : "Upcoming"}</Badge>
                  <Badge variant={active.length ? "default" : "outline"} className="text-[12px]">{active.length} {isAr ? "جارية" : "Active"}</Badge>
                  <Badge variant="outline" className="text-[12px]">{past.length} {isAr ? "سابقة" : "Past"}</Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant={d.viewMode === "grid" ? "default" : "ghost"} size="sm" className="h-7 px-2 text-[12px]" onClick={() => d.setViewMode("grid")}>{isAr ? "شبكة" : "Grid"}</Button>
                  <Button variant={d.viewMode === "timeline" ? "default" : "ghost"} size="sm" className="h-7 px-2 text-[12px]" onClick={() => d.setViewMode("timeline")}>{isAr ? "جدول زمني" : "Timeline"}</Button>
                </div>
              </div>

              {d.viewMode === "timeline" ? (
                <div className="relative">
                  <div className="absolute top-0 bottom-0 start-6 w-px bg-border" />
                  {sortedYears.map(year => (
                    <div key={year} className="mb-8">
                      <div className="flex items-center gap-3 mb-4 relative">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold z-10">{year}</div>
                        <span className="text-sm text-muted-foreground">{byYear[year].length} {isAr ? "فعالية" : "events"}</span>
                      </div>
                      <div className="ms-16 space-y-3">
                        {byYear[year].map((ex) => {
                          const derived = deriveExhibitionStatus({ dbStatus: ex.status, startDate: ex.start_date, endDate: ex.end_date, registrationDeadline: ex.registration_deadline });
                          return (
                            <Link key={ex.id} to={`/exhibitions/${ex.slug}`} className="group block">
                              <Card className="hover:shadow-md transition-all border-border/40 hover:border-primary/30 rounded-2xl">
                                <CardContent className="p-3 flex items-center gap-4">
                                  {ex.cover_image_url && <img src={ex.cover_image_url} alt={isAr && ex.title_ar ? ex.title_ar : ex.title} loading="lazy" className="h-16 w-24 rounded-xl object-cover shrink-0" decoding="async" />}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{isAr && ex.title_ar ? ex.title_ar : ex.title}</h4>
                                    <p className="text-[12px] text-muted-foreground">{format(new Date(ex.start_date), "dd MMM")}{ex.end_date && ` – ${format(new Date(ex.end_date), "dd MMM")}`}{ex.city && ` • ${ex.city}`}</p>
                                    <div className="flex gap-1 mt-1">
                                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium ${derived.color}`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${derived.dot}`} />{isAr ? derived.labelAr : derived.label}
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
                sortedYears.map(year => (
                  <div key={year}>
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-lg font-bold">{year}</h3>
                      <Badge variant="outline" className="text-[12px]">{byYear[year].length} {isAr ? "فعالية" : "events"}</Badge>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {byYear[year].map((ex) => {
                        const derived = deriveExhibitionStatus({ dbStatus: ex.status, startDate: ex.start_date, endDate: ex.end_date, registrationDeadline: ex.registration_deadline });
                        const edStats = ex.edition_stats ? (typeof ex.edition_stats === 'string' ? JSON.parse(ex.edition_stats) : ex.edition_stats) : null;
                        return (
                          <Link key={ex.id} to={`/exhibitions/${ex.slug}`} className="group">
                            <Card className="overflow-hidden hover:shadow-md transition-all border-border/40 hover:border-primary/30 h-full rounded-2xl">
                              {ex.cover_image_url && (
                                <div className="relative h-36 overflow-hidden">
                                  <img src={ex.cover_image_url} alt={isAr && ex.title_ar ? ex.title_ar : ex.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" decoding="async" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                                  <div className="absolute bottom-2 start-2 end-2 flex items-center justify-between">
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium backdrop-blur-sm ${derived.color}`}>
                                      <span className={`h-1.5 w-1.5 rounded-full ${derived.dot}`} />{isAr ? derived.labelAr : derived.label}
                                    </span>
                                  </div>
                                </div>
                              )}
                              <CardContent className="p-3 space-y-2">
                                <h4 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">{isAr && ex.title_ar ? ex.title_ar : ex.title}</h4>
                                <p className="text-[12px] text-muted-foreground">{format(new Date(ex.start_date), "dd MMM yyyy")}{ex.end_date && ` → ${format(new Date(ex.end_date), "dd MMM yyyy")}`}</p>
                                <div className="flex flex-wrap gap-2 text-[12px] text-muted-foreground">
                                  {ex.city && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{ex.city}</span>}
                                  {(ex.view_count || 0) > 0 && <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{ex.view_count}</span>}
                                  {ex.max_attendees && <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{ex.max_attendees}</span>}
                                </div>
                                {edStats && (
                                  <div className="grid grid-cols-3 gap-1 pt-1 border-t border-border/40">
                                    {edStats.visitors && <div className="text-center"><p className="text-[12px] font-semibold">{Number(edStats.visitors).toLocaleString()}</p><p className="text-[12px] text-muted-foreground">{isAr ? "زائر" : "Visitors"}</p></div>}
                                    {edStats.exhibitors && <div className="text-center"><p className="text-[12px] font-semibold">{Number(edStats.exhibitors).toLocaleString()}</p><p className="text-[12px] text-muted-foreground">{isAr ? "عارض" : "Exhibitors"}</p></div>}
                                    {edStats.area && <div className="text-center"><p className="text-[12px] font-semibold">{Number(edStats.area).toLocaleString()}</p><p className="text-[12px] text-muted-foreground">m²</p></div>}
                                  </div>
                                )}
                                <div className="flex flex-wrap gap-1 pt-1">
                                  <Badge variant="secondary" className="text-[12px] capitalize">{ex.type.replace(/_/g, " ")}</Badge>
                                  {ex.is_free && <Badge variant="outline" className="text-[12px]">{isAr ? "مجاني" : "Free"}</Badge>}
                                  {ex.is_virtual && <Badge variant="outline" className="text-[12px]">{isAr ? "افتراضي" : "Virtual"}</Badge>}
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

            {/* ═══════ Upcoming Tab ═══════ */}
            {upcoming.length > 0 && (
              <TabsContent value="upcoming" className="mt-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-primary" />{isAr ? "جدول المعارض القادمة" : "Upcoming Events Schedule"}
                  </h3>
                  <div className="space-y-3">
                    {upcoming.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()).map((ex) => {
                      const daysUntil = differenceInDays(new Date(ex.start_date), new Date());
                      const derived = deriveExhibitionStatus({ dbStatus: ex.status, startDate: ex.start_date, endDate: ex.end_date, registrationDeadline: ex.registration_deadline });
                      return (
                        <Link key={ex.id} to={`/exhibitions/${ex.slug}`} className="group block">
                          <Card className="hover:shadow-lg transition-all border-border/40 hover:border-primary/30 rounded-2xl overflow-hidden">
                            <CardContent className="p-0 flex">
                              <div className="flex flex-col items-center justify-center bg-primary/5 px-5 py-4 min-w-[80px] border-e border-border/20">
                                <span className="text-2xl font-bold text-primary">{format(new Date(ex.start_date), "dd")}</span>
                                <span className="text-xs font-medium text-muted-foreground uppercase">{format(new Date(ex.start_date), "MMM")}</span>
                                <span className="text-[12px] text-muted-foreground">{format(new Date(ex.start_date), "yyyy")}</span>
                              </div>
                              <div className="flex-1 p-4 min-w-0">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <h4 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">{isAr && ex.title_ar ? ex.title_ar : ex.title}</h4>
                                    <div className="flex items-center gap-3 mt-1 text-[12px] text-muted-foreground">
                                      {ex.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ex.city}</span>}
                                      {ex.venue && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{isAr && ex.venue_ar ? ex.venue_ar : ex.venue}</span>}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium ${derived.color}`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${derived.dot}`} />{isAr ? derived.labelAr : derived.label}
                                      </span>
                                      <Badge variant="outline" className="text-[12px]">
                                        <Clock className="h-3 w-3 me-1" />
                                        {daysUntil} {isAr ? "يوم" : "days"}
                                      </Badge>
                                    </div>
                                  </div>
                                  {ex.cover_image_url && <img src={ex.cover_image_url} alt="" loading="lazy" className="h-16 w-20 rounded-xl object-cover shrink-0" decoding="async" />}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>
            )}

            {/* ═══════ Gallery Tab ═══════ */}
            <TabsContent value="gallery" className="mt-4">
              {uniqueGallery.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-primary" />{isAr ? "معرض الصور" : "Photo Gallery"}
                    <Badge variant="outline" className="text-[12px]">{uniqueGallery.length} {isAr ? "صورة" : "photos"}</Badge>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {uniqueGallery.map((url: string, i: number) => (
                      <div key={i} className="relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer group" onClick={() => { d.setGalleryOpen(url); d.setGalleryIndex(i); }}>
                        <img loading="lazy" src={url} alt={`${orgName} ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" decoding="async" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Eye className="h-6 w-6 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground text-sm">{isAr ? "لا توجد صور متاحة حالياً" : "No photos available yet"}</p>
                </div>
              )}
            </TabsContent>

            {/* ═══════ Profile Tab ═══════ */}
            <TabsContent value="profile" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4 text-primary" />{isAr ? "معلومات التواصل" : "Contact Information"}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {contactEmail && <div className="flex items-center gap-3 text-sm"><Mail className="h-4 w-4 text-muted-foreground shrink-0" /><a href={`mailto:${contactEmail}`} className="text-primary hover:underline truncate">{contactEmail}</a></div>}
                    {contactPhone && <div className="flex items-center gap-3 text-sm"><Phone className="h-4 w-4 text-muted-foreground shrink-0" /><a href={`tel:${contactPhone}`} className="text-primary hover:underline" dir="ltr">{contactPhone}</a></div>}
                    {contactWebsite && <div className="flex items-center gap-3 text-sm"><Globe className="h-4 w-4 text-muted-foreground shrink-0" /><a href={contactWebsite.startsWith("http") ? contactWebsite : `https://${contactWebsite}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate flex items-center gap-1">{contactWebsite.replace(/^https?:\/\//, "")}<ExternalLink className="h-3 w-3" /></a></div>}
                    {!contactEmail && !contactPhone && !contactWebsite && <p className="text-sm text-muted-foreground">{isAr ? "لا توجد معلومات تواصل" : "No contact information available"}</p>}
                  </CardContent>
                </Card>

                <Card className="rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{isAr ? "التواجد الجغرافي" : "Geographic Presence"}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-[12px] font-medium text-muted-foreground mb-1.5">{isAr ? "الدول" : "Countries"}</p>
                      <div className="flex flex-wrap gap-1.5">{countries.map(c => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}</div>
                    </div>
                    {cities.length > 0 && (<><Separator /><div><p className="text-[12px] font-medium text-muted-foreground mb-1.5">{isAr ? "المدن" : "Cities"}</p><div className="flex flex-wrap gap-1.5">{cities.map(c => <Badge key={c} variant="outline" className="text-xs">{c}</Badge>)}</div></div></>)}
                    {venues.length > 0 && (<><Separator /><div><p className="text-[12px] font-medium text-muted-foreground mb-1.5">{isAr ? "الأماكن" : "Venues"}</p><div className="space-y-1.5">{venues.map(v => <div key={v} className="flex items-center gap-2 text-sm"><Landmark className="h-3 w-3 text-muted-foreground shrink-0" /><span>{v}</span></div>)}</div></div></>)}
                  </CardContent>
                </Card>

                <Card className="rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />{isAr ? "الخدمات والتخصصات" : "Services & Expertise"}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      {types.map(t => {
                        const count = exhibitions.filter((e) => e.type === t).length;
                        const pct = Math.round((count / totalExhibitions) * 100);
                        return (
                          <div key={t}>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="capitalize text-xs">{t.replace(/_/g, " ")}</span>
                              <span className="text-[12px] text-muted-foreground">{count} ({pct}%)</span>
                            </div>
                            <Progress value={pct} className="h-1.5" />
                          </div>
                        );
                      })}
                    </div>
                    <Separator />
                    <div className="flex flex-wrap gap-1.5">
                      {services.competitions && <Badge variant="secondary" className="text-[12px] gap-1"><Swords className="h-3 w-3" />{isAr ? "مسابقات" : "Competitions"}</Badge>}
                      {services.training && <Badge variant="secondary" className="text-[12px] gap-1"><GraduationCap className="h-3 w-3" />{isAr ? "تدريب" : "Training"}</Badge>}
                      {services.seminars && <Badge variant="secondary" className="text-[12px] gap-1"><Mic2 className="h-3 w-3" />{isAr ? "ندوات" : "Seminars"}</Badge>}
                    </div>
                  </CardContent>
                </Card>

                {(allSectors.size > 0 || allCategories.size > 0) && (
                  <Card className="rounded-2xl">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-primary" />{isAr ? "القطاعات المستهدفة" : "Target Sectors"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {allSectors.size > 0 && <div><p className="text-[12px] font-medium text-muted-foreground mb-1.5">{isAr ? "القطاعات" : "Sectors"}</p><div className="flex flex-wrap gap-1.5">{[...allSectors].map(s => <Badge key={s} variant="secondary" className="text-[12px]">{s}</Badge>)}</div></div>}
                      {allCategories.size > 0 && (<><Separator /><div><p className="text-[12px] font-medium text-muted-foreground mb-1.5">{isAr ? "التصنيفات" : "Categories"}</p><div className="flex flex-wrap gap-1.5">{[...allCategories].map(c => <Badge key={c} variant="outline" className="text-[12px]">{c}</Badge>)}</div></div></>)}
                      {allTags.size > 0 && (<><Separator /><div><p className="text-[12px] font-medium text-muted-foreground mb-1.5">{isAr ? "العلامات" : "Tags"}</p><div className="flex flex-wrap gap-1.5">{[...allTags].slice(0, 15).map(t => <Badge key={t} variant="outline" className="text-[12px]">{t}</Badge>)}{allTags.size > 15 && <Badge variant="outline" className="text-[12px]">+{allTags.size - 15}</Badge>}</div></div></>)}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* ═══════ Analytics Tab ═══════ */}
            <TabsContent value="stats" className="mt-4">
              <OrganizerAnalyticsTab
                exhibitions={exhibitions} byYear={byYear} sortedYears={sortedYears}
                upcoming={upcoming} active={active} past={past}
                countries={countries} totalExhibitions={totalExhibitions} totalViews={totalViews}
                totalTickets={data?.totalTickets || 0} totalReviews={data?.totalReviews || 0}
                editionStats={editionStats} types={types} isAr={isAr}
              />
            </TabsContent>

            {/* ═══════ Team Tab ═══════ */}
            {orgKeyContacts.length > 0 && (
              <TabsContent value="team" className="mt-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2"><UserCircle2 className="h-5 w-5 text-primary" />{isAr ? "فريق العمل وجهات الاتصال" : "Team & Key Contacts"}</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {orgKeyContacts.map((c: Record<string, unknown>, i: number) => (
                      <Card key={i} className="rounded-2xl border-border/40 hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                          <div className="flex items-center gap-4 mb-3">
                            <Avatar className="h-14 w-14 rounded-2xl">
                              {c.photo_url && <AvatarImage src={c.photo_url} />}
                              <AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-bold text-lg">{(c.name || "?").charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-sm">{c.name}</p>
                              {c.name_ar && <p className="text-[12px] text-muted-foreground" dir="rtl">{c.name_ar}</p>}
                              {c.title && <p className="text-[12px] text-primary font-medium mt-0.5">{c.title}</p>}
                              {c.department && <p className="text-[12px] text-muted-foreground">{c.department}</p>}
                            </div>
                          </div>
                          {(c.email || c.phone) && (
                            <div className="space-y-2 pt-3 border-t border-border/30">
                              {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"><Mail className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{c.email}</span></a>}
                              {c.phone && <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors" dir="ltr"><Phone className="h-3.5 w-3.5 shrink-0" /><span>{c.phone}</span></a>}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <Card className="rounded-2xl border-primary/20 bg-primary/5">
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0"><Mail className="h-6 w-6 text-primary" /></div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{isAr ? "تواصل مع المنظم" : "Contact this Organizer"}</p>
                        <p className="text-[12px] text-muted-foreground mt-0.5">{isAr ? "للاستفسارات والشراكات والمشاركة في المعارض" : "For inquiries, partnerships, and exhibition participation"}</p>
                      </div>
                      {contactEmail && <Button size="sm" asChild><a href={`mailto:${contactEmail}`}><Mail className="h-3.5 w-3.5 me-1.5" />{isAr ? "إرسال بريد" : "Send Email"}</a></Button>}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}

            {/* ═══════ Partners Tab ═══════ */}
            {allSponsors.length > 0 && (
              <TabsContent value="partners" className="mt-4">
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {allSponsors.map((sponsor, i) => (
                    <Card key={i} className="border-border/40 rounded-2xl">
                      <CardContent className="p-4 flex items-center gap-3">
                        {sponsor.logo ? (
                          <img src={sponsor.logo} alt={sponsor.name} loading="lazy" className="h-10 w-10 rounded-xl object-contain bg-muted p-1" />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Award className="h-5 w-5 text-primary" /></div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{sponsor.name}</p>
                          {sponsor.tier && <Badge variant="outline" className="text-[12px] mt-0.5 capitalize">{sponsor.tier}</Badge>}
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
                  {articles.map((article) => (
                    <Link key={article.id} to={`/articles/${article.slug}`} className="group">
                      <Card className="overflow-hidden hover:shadow-md transition-all border-border/40 hover:border-primary/30 h-full rounded-2xl">
                        {article.featured_image_url && (
                          <div className="h-36 overflow-hidden">
                            <img src={article.featured_image_url} alt={isAr && article.title_ar ? article.title_ar : article.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" decoding="async" />
                          </div>
                        )}
                        <CardContent className="p-3 space-y-2">
                          <Badge variant="secondary" className="text-[12px] capitalize">{article.type}</Badge>
                          <h4 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">{isAr && article.title_ar ? article.title_ar : article.title}</h4>
                          {(article.excerpt || article.excerpt_ar) && (
                            <p className="text-[12px] text-muted-foreground line-clamp-2">{isAr && article.excerpt_ar ? article.excerpt_ar : article.excerpt}</p>
                          )}
                          {article.published_at && <p className="text-[12px] text-muted-foreground">{format(new Date(article.published_at), "dd MMM yyyy")}</p>}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </TabsContent>
            )}

            </div>
          </Tabs>
        </div>

        {/* Gallery Lightbox */}
        {d.galleryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => d.setGalleryOpen(null)}>
            <Button variant="ghost" size="icon" className="absolute top-4 end-4 text-primary-foreground hover:bg-white/10 z-10" onClick={() => d.setGalleryOpen(null)}><X className="h-6 w-6" /></Button>
            {d.galleryIndex > 0 && (
              <Button variant="ghost" size="icon" className="absolute start-4 top-1/2 -translate-y-1/2 text-primary-foreground hover:bg-white/10 z-10" onClick={e => { e.stopPropagation(); d.setGalleryIndex(d.galleryIndex - 1); d.setGalleryOpen(uniqueGallery[d.galleryIndex - 1]); }}><ChevronLeft className="h-6 w-6" /></Button>
            )}
            {d.galleryIndex < uniqueGallery.length - 1 && (
              <Button variant="ghost" size="icon" className="absolute end-4 top-1/2 -translate-y-1/2 text-primary-foreground hover:bg-white/10 z-10" onClick={e => { e.stopPropagation(); d.setGalleryIndex(d.galleryIndex + 1); d.setGalleryOpen(uniqueGallery[d.galleryIndex + 1]); }}><ChevronRight className="h-6 w-6" /></Button>
            )}
            <img src={d.galleryOpen} alt="" className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl" onClick={e => e.stopPropagation()} />
            <p className="absolute bottom-4 text-white/60 text-sm">{d.galleryIndex + 1} / {uniqueGallery.length}</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
