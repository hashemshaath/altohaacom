import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  Calendar, MapPin, Globe, ExternalLink, Bell, BellOff,
  Clock, Users, Tag, Building, Ticket, Trophy, Landmark, Timer,
  Star, Target, Award, ImageIcon, LayoutGrid, MessageSquare,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { toEnglishDigits } from "@/lib/formatNumber";
import { ImageLightbox } from "@/components/competitions/ImageLightbox";
import { countryFlag as getCountryFlagUtil } from "@/lib/countryFlag";
import { format, isPast, isFuture, isWithinInterval, differenceInDays } from "date-fns";
import { useState, useMemo, lazy, Suspense, memo, useCallback } from "react";
import { QRCodeDisplay } from "@/components/qr/QRCodeDisplay";
import { useEntityQRCode } from "@/hooks/useQRCode";

// Detail sub-components (static imports for critical path)
import { ExhibitionHero } from "@/components/exhibitions/detail/ExhibitionHero";
import { CountdownTimer } from "@/components/exhibitions/detail/CountdownTimer";
import { ExhibitionDayIndicator } from "@/components/exhibitions/detail/ExhibitionDayIndicator";
import { ExhibitionRegistrationStatus } from "@/components/exhibitions/detail/ExhibitionRegistrationStatus";
import { ExhibitionTicketBooking } from "@/components/exhibitions/detail/ExhibitionTicketBooking";
import { ExhibitionContactCard } from "@/components/exhibitions/detail/ExhibitionContactCard";

// Lazy-loaded tab components for code splitting
const ExhibitionCompetitionsTab = lazy(() => import("@/components/exhibitions/detail/ExhibitionCompetitionsTab").then(m => ({ default: m.ExhibitionCompetitionsTab })));
const ExhibitionPeopleTab = lazy(() => import("@/components/exhibitions/detail/ExhibitionPeopleTab").then(m => ({ default: m.ExhibitionPeopleTab })));
const ExhibitionMapEmbed = lazy(() => import("@/components/exhibitions/detail/ExhibitionMapEmbed").then(m => ({ default: m.ExhibitionMapEmbed })));
const ExhibitionSocialLinks = lazy(() => import("@/components/exhibitions/detail/ExhibitionSocialLinks").then(m => ({ default: m.ExhibitionSocialLinks })));
const ExhibitionDocuments = lazy(() => import("@/components/exhibitions/detail/ExhibitionDocuments").then(m => ({ default: m.ExhibitionDocuments })));
const ExhibitionAgendaTab = lazy(() => import("@/components/exhibitions/detail/ExhibitionAgendaTab").then(m => ({ default: m.ExhibitionAgendaTab })));
const ExhibitionBoothsTab = lazy(() => import("@/components/exhibitions/detail/ExhibitionBoothsTab").then(m => ({ default: m.ExhibitionBoothsTab })));
const ExhibitionReviewsTab = lazy(() => import("@/components/exhibitions/detail/ExhibitionReviewsTab").then(m => ({ default: m.ExhibitionReviewsTab })));

// Suspense fallback for lazy tabs
const TabFallback = () => <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />)}</div>;

/* ---------- types ---------- */
interface ScheduleDay {
  day?: string; day_ar?: string; title?: string; title_ar?: string;
  items?: ScheduleItem[]; events?: ScheduleItem[];
  time?: string; description?: string; description_ar?: string;
}
interface ScheduleItem {
  time?: string; title?: string; title_ar?: string;
  description?: string; description_ar?: string;
}
interface Speaker {
  name?: string; name_ar?: string; title?: string; title_ar?: string;
  role?: string; role_ar?: string; topic?: string; topic_ar?: string;
  image_url?: string; country?: string;
}
interface SponsorInfo { name?: string; name_ar?: string; tier?: string; logo_url?: string; }
interface Section { name?: string; name_ar?: string; description?: string; description_ar?: string; }

const typeLabels: Record<string, { en: string; ar: string }> = {
  exhibition: { en: "Exhibition", ar: "معرض" },
  conference: { en: "Conference", ar: "مؤتمر" },
  summit: { en: "Summit", ar: "قمة" },
  workshop: { en: "Workshop", ar: "ورشة عمل" },
  food_festival: { en: "Food Festival", ar: "مهرجان طعام" },
  trade_show: { en: "Trade Show", ar: "معرض تجاري" },
  competition_event: { en: "Competition Event", ar: "حدث تنافسي" },
};

function getCountryFlag(country?: string): string {
  if (!country) return "🏳️";
  return getCountryFlagUtil(country) || "🏳️";
}

const TIER_CONFIG: Record<string, { icon: typeof Star; gradient: string; label: string; labelAr: string; order: number }> = {
  patron: { icon: Award, gradient: "from-chart-4/20 to-chart-4/5", label: "Patron", labelAr: "راعي رسمي", order: 0 },
  platinum: { icon: Star, gradient: "from-chart-3/20 to-chart-3/5", label: "Platinum", labelAr: "بلاتيني", order: 1 },
  gold: { icon: Star, gradient: "from-chart-4/20 to-chart-4/5", label: "Gold", labelAr: "ذهبي", order: 2 },
  partner: { icon: Building, gradient: "from-primary/20 to-primary/5", label: "Partner", labelAr: "شريك", order: 3 },
  silver: { icon: Star, gradient: "from-muted-foreground/20 to-muted-foreground/5", label: "Silver", labelAr: "فضي", order: 4 },
  bronze: { icon: Star, gradient: "from-chart-2/20 to-chart-2/5", label: "Bronze", labelAr: "برونزي", order: 5 },
};

/* ---------- Memoized Tab Trigger ---------- */
const ExhibitionTabTrigger = memo(({ value, icon: Icon, label, count, isAr }: { value: string; icon: any; label: string; count?: number; isAr: boolean }) => (
  <TabsTrigger value={value} className="gap-1.5 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:gap-2 sm:px-5 sm:py-2.5 sm:text-xs whitespace-nowrap">
    <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
    {label}
    {count !== undefined && count > 0 && (
      <Badge variant="secondary" className="ms-1 h-5 rounded-full bg-background/20 text-current px-1.5 text-[10px]">{count}</Badge>
    )}
  </TabsTrigger>
));
ExhibitionTabTrigger.displayName = "ExhibitionTabTrigger";

/* ---------- main ---------- */
export default function ExhibitionDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState("overview");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // --- Core query ---
  const { data: exhibition, isLoading } = useQuery({
    queryKey: ["exhibition", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("exhibitions").select("*").eq("slug", slug!).maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Exhibition not found");
      return data;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });

  const { data: isFollowing } = useQuery({
    queryKey: ["exhibition-follow", exhibition?.id, user?.id],
    queryFn: async () => {
      if (!user || !exhibition) return false;
      const { data } = await supabase.from("exhibition_followers").select("id").eq("exhibition_id", exhibition.id).eq("user_id", user.id).maybeSingle();
      return !!data;
    },
    enabled: !!user && !!exhibition,
  });

  const { data: followerCount } = useQuery({
    queryKey: ["exhibition-followers-count", exhibition?.id],
    queryFn: async () => {
      if (!exhibition) return 0;
      const { count } = await supabase.from("exhibition_followers").select("id", { count: "exact", head: true }).eq("exhibition_id", exhibition.id);
      return count || 0;
    },
    enabled: !!exhibition,
    staleTime: 1000 * 60 * 5,
  });

  const { data: linkedCompetitions } = useQuery({
    queryKey: ["exhibition-competitions", exhibition?.id],
    queryFn: async () => {
      if (!exhibition) return [];
      const { data, error } = await supabase
        .from("competitions")
        .select(`id, title, title_ar, status, competition_start, competition_end, cover_image_url, city, country, is_virtual, registration_start, registration_end, max_participants, description, description_ar, competition_categories(id, name, name_ar, max_participants), competition_registrations(id), competition_judges(id, judge_id)`)
        .eq("exhibition_id", exhibition.id)
        .order("competition_start", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!exhibition,
    staleTime: 1000 * 60 * 3,
  });

  const competitionIds = useMemo(() => linkedCompetitions?.map((c: any) => c.id) || [], [linkedCompetitions]);

  const { data: winningDishes } = useQuery({
    queryKey: ["exhibition-winning-dishes", competitionIds],
    queryFn: async () => {
      if (competitionIds.length === 0) return [];
      const { data: regs, error } = await supabase
        .from("competition_registrations")
        .select(`id, dish_name, dish_description, dish_image_url, competition_id, participant_id, entry_type, team_name, team_name_ar, competition_scores(score, criteria_id)`)
        .in("competition_id", competitionIds)
        .eq("status", "approved")
        .not("dish_name", "is", null);
      if (error) throw error;

      const scored = (regs || [])
        .map((r: any) => ({ ...r, totalScore: (r.competition_scores || []).reduce((sum: number, s: any) => sum + Number(s.score || 0), 0), scoreCount: (r.competition_scores || []).length }))
        .filter((r: any) => r.scoreCount > 0)
        .sort((a: any, b: any) => b.totalScore - a.totalScore);

      const participantIds = [...new Set(scored.map((r: any) => r.participant_id))];
      if (participantIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, username, avatar_url").in("user_id", participantIds);
        const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
        scored.forEach((r: any) => { r.participant = profileMap.get(r.participant_id) || null; });
      }

      const compMap = new Map(linkedCompetitions!.map((c: any) => [c.id, c]));
      scored.forEach((r: any) => { r.competition = compMap.get(r.competition_id) || null; });
      return scored;
    },
    enabled: competitionIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const allJudgeIds = useMemo(() => {
    if (!linkedCompetitions) return [];
    const ids = new Set<string>();
    linkedCompetitions.forEach((c: any) => { c.competition_judges?.forEach((j: any) => ids.add(j.judge_id)); });
    return Array.from(ids);
  }, [linkedCompetitions]);

  const { data: judgeProfiles } = useQuery({
    queryKey: ["exhibition-judge-profiles", allJudgeIds],
    queryFn: async () => {
      if (allJudgeIds.length === 0) return [];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, username, avatar_url, specialization, is_verified, location, bio").in("user_id", allJudgeIds);
      const { data: judgeExtras } = await supabase.from("judge_profiles").select("user_id, judge_title, judge_title_ar, judge_category, judge_level, nationality, profile_photo_url, current_position, current_employer").in("user_id", allJudgeIds);
      const extrasMap = new Map(judgeExtras?.map(j => [j.user_id, j]) || []);
      return (profiles || []).map(p => ({ ...p, judgeExtra: extrasMap.get(p.user_id) || null }));
    },
    enabled: allJudgeIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (!user || !exhibition) throw new Error("Not authenticated");
      if (isFollowing) {
        await supabase.from("exhibition_followers").delete().eq("exhibition_id", exhibition.id).eq("user_id", user.id);
      } else {
        await supabase.from("exhibition_followers").insert({ exhibition_id: exhibition.id, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibition-follow"] });
      queryClient.invalidateQueries({ queryKey: ["exhibition-followers-count"] });
      toast({
        title: isFollowing ? (isAr ? "تم إلغاء المتابعة" : "Unfollowed") : (isAr ? "تم المتابعة" : "Following"),
        description: isFollowing ? (isAr ? "لن تتلقى إشعارات بعد الآن" : "You won't receive updates anymore") : (isAr ? "ستتلقى إشعارات حول هذا الحدث" : "You'll receive updates about this event"),
      });
    },
  });

  const { data: exhibitionQrCode } = useEntityQRCode("exhibition", exhibition?.id, "exhibition");

  // Feature counts - lightweight HEAD queries
  const { data: agendaCount = 0 } = useQuery({
    queryKey: ["exhibition-agenda-count", exhibition?.id],
    queryFn: async () => {
      const { count } = await supabase.from("exhibition_agenda_items").select("id", { count: "exact", head: true }).eq("exhibition_id", exhibition!.id);
      return count || 0;
    },
    enabled: !!exhibition,
    staleTime: 1000 * 60 * 5,
  });

  const { data: boothCount = 0 } = useQuery({
    queryKey: ["exhibition-booth-count", exhibition?.id],
    queryFn: async () => {
      const { count } = await supabase.from("exhibition_booths").select("id", { count: "exact", head: true }).eq("exhibition_id", exhibition!.id);
      return count || 0;
    },
    enabled: !!exhibition,
    staleTime: 1000 * 60 * 5,
  });

  const { data: reviewCount = 0 } = useQuery({
    queryKey: ["exhibition-review-count", exhibition?.id],
    queryFn: async () => {
      const { count } = await supabase.from("exhibition_reviews").select("id", { count: "exact", head: true }).eq("exhibition_id", exhibition!.id);
      return count || 0;
    },
    enabled: !!exhibition,
    staleTime: 1000 * 60 * 5,
  });

  // Memoized callbacks
  const handleFollow = useCallback(() => toggleFollow.mutate(), [toggleFollow]);
  const handleLightbox = useCallback((i: number) => { setLightboxIndex(i); setLightboxOpen(true); }, []);

  /* ---------- loading / not found ---------- */
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
        <Header />
        <main className="container flex-1 py-8">
          <Skeleton className="mb-4 h-8 w-32 rounded-md" />
          <Skeleton className="mb-8 h-64 w-full rounded-2xl md:h-80" />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2"><Skeleton className="h-10 w-full rounded-lg" /><Skeleton className="h-40 w-full rounded-lg" /></div>
            <div className="space-y-4"><Skeleton className="h-44 w-full rounded-xl" /><Skeleton className="h-56 w-full rounded-xl" /></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!exhibition) {
    return (
      <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
        <Header />
        <main className="container flex-1 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/60">
            <Landmark className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-lg font-semibold">{isAr ? "الحدث غير موجود" : "Event not found"}</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/exhibitions"><Calendar className="me-2 h-4 w-4" />{isAr ? "العودة للفعاليات" : "Back to Events"}</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  /* ---------- derived data ---------- */
  const baseTitle = isAr && exhibition.title_ar ? exhibition.title_ar : exhibition.title;
  const editionYear = (exhibition as any).edition_year;
  const title = editionYear ? `${baseTitle} +${editionYear}` : baseTitle;
  const description = isAr && exhibition.description_ar ? exhibition.description_ar : exhibition.description;
  const venue = isAr && exhibition.venue_ar ? exhibition.venue_ar : exhibition.venue;
  const organizer = isAr && exhibition.organizer_name_ar ? exhibition.organizer_name_ar : exhibition.organizer_name;

  const now = new Date();
  const start = new Date(exhibition.start_date);
  const end = new Date(exhibition.end_date);
  const isHappening = isWithinInterval(now, { start, end });
  const isUpcoming = isFuture(start);
  const hasEnded = isPast(end);

  const schedule = (exhibition.schedule as ScheduleDay[]) || [];
  const speakers = (exhibition.speakers as Speaker[]) || [];
  const sections = (exhibition.sections as Section[]) || [];
  const sponsorsInfo = (exhibition.sponsors_info as SponsorInfo[]) || [];
  const targetAudience = (exhibition.target_audience as string[]) || [];
  const tags = (exhibition.tags as string[]) || [];
  const galleryUrls = (exhibition.gallery_urls as string[]) || [];

  const countryFlag = getCountryFlag(exhibition.country || undefined);
  const sortedSponsors = [...sponsorsInfo].sort((a, b) => (TIER_CONFIG[a.tier || ""]?.order ?? 99) - (TIER_CONFIG[b.tier || ""]?.order ?? 99));
  const sponsorsByTier = sortedSponsors.reduce<Record<string, SponsorInfo[]>>((acc, s) => { const tier = s.tier || "other"; if (!acc[tier]) acc[tier] = []; acc[tier].push(s); return acc; }, {});

  const organizerLogoUrl = (exhibition as any).organizer_logo_url || exhibition.logo_url;
  const isOwner = user && exhibition.created_by === user.id;

  const hasWinningDishes = winningDishes && winningDishes.length > 0;
  const hasCompetitions = linkedCompetitions && linkedCompetitions.length > 0;
  const hasSchedule = schedule.length > 0;
  const hasJudges = judgeProfiles && judgeProfiles.length > 0;
  const hasSpeakers = speakers.length > 0;
  const hasGallery = galleryUrls.length > 0;
  const hasSponsors = sortedSponsors.length > 0;
  const hasAgenda = agendaCount > 0;
  const hasBooths = boothCount > 0;
  const hasReviews = reviewCount > 0 || hasEnded;

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
      <SEOHead
        title={title}
        description={description || `${title} - Event on Altoha`}
        ogImage={exhibition.cover_image_url || undefined}
        ogType="article"
        jsonLd={{
          "@context": "https://schema.org", "@type": "Event", name: title,
          description: description || undefined, startDate: exhibition.start_date, endDate: exhibition.end_date,
          location: exhibition.is_virtual ? { "@type": "VirtualLocation" } : { "@type": "Place", name: venue || undefined, address: { "@type": "PostalAddress", addressLocality: exhibition.city, addressCountry: exhibition.country } },
          image: exhibition.cover_image_url || undefined,
          organizer: organizer ? { "@type": "Organization", name: organizer } : undefined,
        }}
      />
      <Header />

      {/* ======== HERO ======== */}
      <ExhibitionHero
        exhibition={exhibition}
        title={title}
        venue={venue}
        organizer={organizer}
        organizerLogoUrl={organizerLogoUrl}
        isHappening={isHappening}
        isUpcoming={isUpcoming}
        hasEnded={hasEnded}
        isOwner={!!isOwner}
        followerCount={followerCount || 0}
        linkedCompetitionsCount={linkedCompetitions?.length || 0}
        isAr={isAr}
      />

      <main className="container flex-1 py-6 md:py-8">
        {/* ====== MOBILE ACTION BAR ====== */}
        <div className="mb-5 space-y-3 lg:hidden">
          {/* Quick actions row */}
          <div className="flex gap-2">
            {user && (
              <Button variant={isFollowing ? "outline" : "secondary"} size="sm" className="flex-1 h-10 rounded-xl text-xs font-semibold" onClick={handleFollow} disabled={toggleFollow.isPending}>
                {isFollowing ? (<><BellOff className="me-1.5 h-3.5 w-3.5" />{isAr ? "إلغاء" : "Unfollow"}</>) : (<><Bell className="me-1.5 h-3.5 w-3.5" />{isAr ? "متابعة" : "Follow"}</>)}
              </Button>
            )}
            {exhibition.website_url && (
              <Button variant="outline" size="sm" className="h-10 rounded-xl text-xs" asChild>
                <a href={exhibition.website_url} target="_blank" rel="noopener noreferrer"><Globe className="me-1.5 h-3.5 w-3.5" />{isAr ? "الموقع" : "Website"}</a>
              </Button>
            )}
          </div>

          {/* Countdown - compact mobile */}
          {(isUpcoming || isHappening) && (
            <Card className="overflow-hidden border-primary/15">
              <CardContent className="py-4 px-3">
                <CountdownTimer targetDate={isHappening ? end : start} isAr={isAr} compact />
              </CardContent>
            </Card>
          )}

          <ExhibitionDayIndicator startDate={exhibition.start_date} endDate={exhibition.end_date} isAr={isAr} />
          <ExhibitionRegistrationStatus registrationDeadline={exhibition.registration_deadline} registrationUrl={exhibition.registration_url} maxAttendees={exhibition.max_attendees} isFree={exhibition.is_free} ticketPrice={exhibition.ticket_price} ticketPriceAr={exhibition.ticket_price_ar} startDate={exhibition.start_date} endDate={exhibition.end_date} isAr={isAr} />
          <ExhibitionTicketBooking exhibitionId={exhibition.id} exhibitionTitle={title} isFree={exhibition.is_free} ticketPrice={exhibition.ticket_price} hasEnded={hasEnded} isAr={isAr} />

          {/* Mobile map + contact - collapsed for density */}
          <Suspense fallback={null}>
            {!exhibition.is_virtual && <ExhibitionMapEmbed mapUrl={exhibition.map_url} venue={venue} city={exhibition.city} country={exhibition.country} address={(exhibition as any).address || null} isAr={isAr} />}
            <ExhibitionContactCard organizerName={organizer} organizerLogo={organizerLogoUrl} email={exhibition.organizer_email} phone={exhibition.organizer_phone} website={exhibition.organizer_website} isAr={isAr} />
            <ExhibitionSocialLinks socialLinks={exhibition.social_links as any} websiteUrl={exhibition.website_url} isAr={isAr} />
            <ExhibitionDocuments documents={(exhibition as any).documents} isAr={isAr} />
          </Suspense>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* ======== MAIN CONTENT ======== */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 sm:space-y-8">
              {/* Sticky tabs - mobile optimized with better scroll */}
              <div className="sticky top-14 z-30 -mx-2 border-b border-border/40 bg-background/80 px-2 py-2 backdrop-blur-md sm:mx-0 sm:rounded-2xl sm:border sm:px-4 sm:py-3">
                <TabsList className="h-auto w-full justify-start gap-0.5 overflow-x-auto bg-transparent p-0 scrollbar-none sm:gap-1">
                  <TabsTrigger value="overview" className="rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg shadow-primary/20 sm:px-5 sm:py-2.5 sm:text-xs whitespace-nowrap">
                    {isAr ? "نظرة عامة" : "Overview"}
                  </TabsTrigger>
                  {hasWinningDishes && <ExhibitionTabTrigger value="winning-dishes" icon={Award} label={isAr ? "الأطباق" : "Winners"} count={winningDishes!.length} isAr={isAr} />}
                  {hasCompetitions && <ExhibitionTabTrigger value="competitions" icon={Trophy} label={isAr ? "المسابقات" : "Competitions"} count={linkedCompetitions!.length} isAr={isAr} />}
                  {hasSchedule && <ExhibitionTabTrigger value="schedule" icon={Calendar} label={isAr ? "الجدول" : "Schedule"} isAr={isAr} />}
                  {(hasJudges || hasSpeakers) && <ExhibitionTabTrigger value="people" icon={Users} label={isAr ? "الأشخاص" : "People"} isAr={isAr} />}
                  {hasGallery && <ExhibitionTabTrigger value="gallery" icon={ImageIcon} label={isAr ? "المعرض" : "Gallery"} isAr={isAr} />}
                  {hasAgenda && <ExhibitionTabTrigger value="agenda" icon={Clock} label={isAr ? "الأجندة" : "Agenda"} count={agendaCount} isAr={isAr} />}
                  {hasBooths && <ExhibitionTabTrigger value="booths" icon={LayoutGrid} label={isAr ? "الأجنحة" : "Booths"} count={boothCount} isAr={isAr} />}
                  {hasSponsors && <ExhibitionTabTrigger value="sponsors" icon={Star} label={isAr ? "الرعاة" : "Sponsors"} isAr={isAr} />}
                  {hasReviews && <ExhibitionTabTrigger value="reviews" icon={MessageSquare} label={isAr ? "التقييمات" : "Reviews"} count={reviewCount > 0 ? reviewCount : undefined} isAr={isAr} />}
                </TabsList>
              </div>

              {/* === OVERVIEW TAB === */}
              <TabsContent value="overview" className="mt-6 space-y-6">
                {/* Key Highlights */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 text-center">
                    <Calendar className="mx-auto mb-1.5 h-5 w-5 text-primary" />
                    <p className="text-lg font-bold text-foreground">{differenceInDays(end, start) + 1}</p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{isAr ? "أيام" : "Days"}</p>
                  </div>
                  <div className="rounded-xl border border-chart-4/15 bg-gradient-to-br from-chart-4/10 via-chart-4/5 to-transparent p-4 text-center">
                    <Trophy className="mx-auto mb-1.5 h-5 w-5 text-chart-4" />
                    <p className="text-lg font-bold text-foreground">{linkedCompetitions?.length || 0}</p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{isAr ? "مسابقات" : "Competitions"}</p>
                  </div>
                  <div className="rounded-xl border border-chart-3/15 bg-gradient-to-br from-chart-3/10 via-chart-3/5 to-transparent p-4 text-center">
                    <Users className="mx-auto mb-1.5 h-5 w-5 text-chart-3" />
                    <p className="text-lg font-bold text-foreground">{exhibition.max_attendees ? toEnglishDigits(exhibition.max_attendees.toLocaleString()) : "—"}</p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{isAr ? "سعة" : "Capacity"}</p>
                  </div>
                  <div className="rounded-xl border border-accent/15 bg-gradient-to-br from-accent/10 via-accent/5 to-transparent p-4 text-center">
                    <Landmark className="mx-auto mb-1.5 h-5 w-5 text-accent" />
                    <p className="text-lg font-bold text-foreground">{sections.length || speakers.length || "—"}</p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{isAr ? "أقسام" : "Sections"}</p>
                  </div>
                </div>

                {description && (
                  <Card className="border-s-[3px] border-s-primary/40">
                    <CardContent className="prose prose-sm max-w-none p-4 md:p-6 dark:prose-invert">
                      <p className="whitespace-pre-wrap leading-relaxed">{description}</p>
                    </CardContent>
                  </Card>
                )}

                {sections.length > 0 && (
                  <Card className="overflow-hidden">
                    <div className="border-b bg-muted/30 px-4 py-3">
                      <h3 className="flex items-center gap-2 font-semibold text-sm">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10"><Landmark className="h-3.5 w-3.5 text-primary" /></div>
                        {isAr ? "أقسام الحدث" : "Event Sections"}
                      </h3>
                    </div>
                    <CardContent className="p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {sections.map((section, i) => (
                          <div key={i} className="rounded-lg border p-3">
                            <p className="font-medium text-sm">{isAr && section.name_ar ? section.name_ar : section.name}</p>
                            {(section.description || section.description_ar) && (
                              <p className="mt-1 text-xs text-muted-foreground">{isAr && section.description_ar ? section.description_ar : section.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {hasCompetitions && (
                  <Card className="overflow-hidden">
                    <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-3 flex items-center justify-between">
                      <h3 className="flex items-center gap-2 font-semibold text-sm">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-chart-4/20"><Trophy className="h-3.5 w-3.5 text-primary" /></div>
                        {isAr ? "المسابقات المرتبطة" : "Linked Competitions"}
                        <Badge className="ms-1 bg-primary/10 text-primary border-primary/20">{linkedCompetitions!.length}</Badge>
                      </h3>
                      <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary" onClick={() => setActiveTab("competitions")}>{isAr ? "عرض الكل →" : "View All →"}</Button>
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-2.5">
                        {linkedCompetitions!.slice(0, 3).map((comp: any) => {
                          const compTitle = isAr && comp.title_ar ? comp.title_ar : comp.title;
                          const regCount = comp.competition_registrations?.length || 0;
                          const compStart = new Date(comp.competition_start);
                          const compEnd = new Date(comp.competition_end);
                          const compIsLive = isWithinInterval(new Date(), { start: compStart, end: compEnd });
                          const compIsUpcoming = isFuture(compStart);
                          return (
                            <Link key={comp.id} to={`/competitions/${comp.id}`} className="flex items-center gap-3 rounded-xl border border-border/60 p-3 hover:bg-primary/5 hover:border-primary/20 transition-all group">
                              {comp.cover_image_url ? (
                                <img src={comp.cover_image_url} alt={compTitle} className="h-12 w-12 rounded-lg object-cover shrink-0 ring-1 ring-border" loading="lazy" />
                              ) : (
                                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/10 to-chart-4/10 flex items-center justify-center shrink-0"><Trophy className="h-5 w-5 text-primary/40" /></div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{compTitle}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-muted-foreground">{format(compStart, "MMM d, yyyy")}</span>
                                  {compIsLive && <Badge className="h-4 px-1.5 text-[8px] bg-destructive text-destructive-foreground border-none">{isAr ? "مباشر" : "LIVE"}</Badge>}
                                  {compIsUpcoming && <Badge variant="outline" className="h-4 px-1.5 text-[8px] border-primary/30 text-primary">{isAr ? "قادم" : "Soon"}</Badge>}
                                </div>
                              </div>
                              <div className="text-end shrink-0">
                                <p className="text-xs font-bold text-primary">{regCount}</p>
                                <p className="text-[9px] text-muted-foreground">{isAr ? "مسجل" : "entries"}</p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {targetAudience.length > 0 && (
                  <Card className="overflow-hidden">
                    <div className="border-b bg-muted/30 px-4 py-3">
                      <h3 className="flex items-center gap-2 font-semibold text-sm">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/60"><Target className="h-3.5 w-3.5 text-muted-foreground" /></div>
                        {isAr ? "الفئة المستهدفة" : "Target Audience"}
                      </h3>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {targetAudience.map((a) => <Badge key={a} variant="outline" className="py-1.5 capitalize">{a.replace(/_/g, " ")}</Badge>)}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {hasGallery && (
                  <Card className="overflow-hidden">
                    <div className="border-b bg-muted/30 px-4 py-3 flex items-center justify-between">
                      <h3 className="flex items-center gap-2 font-semibold text-sm">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10"><ImageIcon className="h-3.5 w-3.5 text-primary" /></div>
                        {isAr ? "معرض الصور" : "Gallery"}
                      </h3>
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => setActiveTab("gallery")}>{isAr ? "عرض الكل" : "View All"}</Button>
                    </div>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-3 gap-2">
                        {galleryUrls.slice(0, 6).map((url, i) => (
                          <button key={i} onClick={() => handleLightbox(i)} className="relative aspect-square rounded-lg overflow-hidden group">
                            <img src={url} alt={`${title} ${i + 1}`} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                            {i === 5 && galleryUrls.length > 6 && (
                              <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm"><span className="font-bold text-lg">+{galleryUrls.length - 6}</span></div>
                            )}
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* === WINNING DISHES TAB === */}
              {hasWinningDishes && (
                <TabsContent value="winning-dishes" className="mt-6 space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {winningDishes!.map((dish: any, i: number) => {
                      const comp = dish.competition;
                      const compTitle = comp ? (isAr && comp.title_ar ? comp.title_ar : comp.title) : "";
                      const participantName = dish.participant?.full_name || dish.team_name || (isAr ? "متسابق" : "Contestant");
                      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
                      return (
                        <Card key={dish.id} className="overflow-hidden group hover:shadow-lg transition-all hover:-translate-y-0.5">
                          {dish.dish_image_url ? (
                            <div className="relative h-44 overflow-hidden">
                              <img src={dish.dish_image_url} alt={dish.dish_name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                              <div className="absolute top-3 start-3"><Badge className="bg-chart-4/90 text-chart-4-foreground text-sm font-bold shadow-md">{medal}</Badge></div>
                              <div className="absolute bottom-3 start-3 end-3"><p className="font-bold text-lg leading-tight text-white drop-shadow-md">{dish.dish_name}</p></div>
                            </div>
                          ) : (
                            <div className="relative h-32 bg-gradient-to-br from-chart-4/20 via-chart-4/10 to-background flex items-center justify-center">
                              <Trophy className="h-10 w-10 text-chart-4/30" />
                              <div className="absolute top-3 start-3"><Badge className="bg-chart-4/90 text-chart-4-foreground text-sm font-bold shadow-md">{medal}</Badge></div>
                              <div className="absolute bottom-3 start-3 end-3"><p className="font-bold text-lg leading-tight">{dish.dish_name}</p></div>
                            </div>
                          )}
                          <CardContent className="p-4 space-y-2">
                            {dish.dish_description && <p className="text-xs text-muted-foreground line-clamp-2">{dish.dish_description}</p>}
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center"><Users className="h-3 w-3 text-primary" /></div>
                              <span className="text-sm font-medium truncate">{participantName}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-[10px]">{compTitle}</Badge>
                              <span className="text-xs font-bold text-chart-4">{dish.totalScore.toFixed(1)} {isAr ? "نقطة" : "pts"}</span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>
              )}

              {/* === LAZY LOADED TABS === */}
              {hasCompetitions && (
                <TabsContent value="competitions" className="mt-6">
                  <Suspense fallback={<TabFallback />}>
                    <ExhibitionCompetitionsTab competitions={linkedCompetitions!} isAr={isAr} />
                  </Suspense>
                </TabsContent>
              )}

              {hasSchedule && (
                <TabsContent value="schedule" className="mt-6 space-y-4">
                  {schedule.map((dayOrItem, i) => {
                    const dayEvents = dayOrItem.items || dayOrItem.events || [];
                    const dayLabel = isAr && dayOrItem.day_ar ? dayOrItem.day_ar : dayOrItem.day;
                    const dayTitle = isAr && dayOrItem.title_ar ? dayOrItem.title_ar : dayOrItem.title;
                    if (dayEvents.length > 0) {
                      return <CollapsibleDay key={i} index={i} dayLabel={dayLabel} dayTitle={dayTitle} events={dayEvents} isAr={isAr} defaultOpen={i === 0} />;
                    }
                    return (
                      <div key={i} className="flex gap-4 rounded-xl border bg-card p-4 shadow-sm">
                        <div className="shrink-0 font-mono text-sm font-semibold text-primary">{dayOrItem.time || dayLabel}</div>
                        <div>
                          <p className="font-medium">{isAr && dayOrItem.title_ar ? dayOrItem.title_ar : dayOrItem.title}</p>
                          {(dayOrItem.description || dayOrItem.description_ar) && <p className="text-sm text-muted-foreground">{isAr && dayOrItem.description_ar ? dayOrItem.description_ar : dayOrItem.description}</p>}
                        </div>
                      </div>
                    );
                  })}
                </TabsContent>
              )}

              {(hasJudges || hasSpeakers) && (
                <TabsContent value="people" className="mt-6">
                  <Suspense fallback={<TabFallback />}>
                    <ExhibitionPeopleTab judgeProfiles={judgeProfiles || null} speakers={speakers} isAr={isAr} />
                  </Suspense>
                </TabsContent>
              )}

              {hasGallery && (
                <TabsContent value="gallery" className="mt-6">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {galleryUrls.map((url, i) => (
                      <button key={i} onClick={() => handleLightbox(i)} className="relative aspect-video rounded-xl overflow-hidden shadow-sm group cursor-pointer">
                        <img src={url} alt={`${title} ${i + 1}`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" decoding="async" />
                        <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-foreground opacity-0 group-hover:opacity-70 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                </TabsContent>
              )}

              {hasSponsors && (
                <TabsContent value="sponsors" className="mt-6 space-y-8">
                  {Object.entries(sponsorsByTier).map(([tier, sponsors]) => {
                    const config = TIER_CONFIG[tier];
                    const tierLabel = config ? (isAr ? config.labelAr : config.label) : tier;
                    return (
                      <section key={tier}>
                        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                          <div className={`flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br ${config?.gradient || "from-muted to-muted/50"}`}>
                            {config ? <config.icon className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}
                          </div>
                          {tierLabel}
                          <Badge variant="outline" className="text-[9px] ms-1">{sponsors.length}</Badge>
                        </h3>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                          {sponsors.map((sponsor, i) => (
                            <Card key={i} className="overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5">
                              <CardContent className="flex flex-col items-center p-4 text-center">
                                {sponsor.logo_url ? (
                                  <img src={sponsor.logo_url} alt={sponsor.name} className="mb-2 h-12 w-auto max-w-[120px] object-contain" loading="lazy" />
                                ) : (
                                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-muted"><Building className="h-5 w-5 text-muted-foreground" /></div>
                                )}
                                <p className="text-xs font-medium">{isAr && sponsor.name_ar ? sponsor.name_ar : sponsor.name}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </section>
                    );
                  })}
                </TabsContent>
              )}

              {hasAgenda && (
                <TabsContent value="agenda" className="mt-6">
                  <Suspense fallback={<TabFallback />}>
                    <ExhibitionAgendaTab exhibitionId={exhibition.id} startDate={exhibition.start_date} endDate={exhibition.end_date} isAr={isAr} />
                  </Suspense>
                </TabsContent>
              )}

              {hasBooths && (
                <TabsContent value="booths" className="mt-6">
                  <Suspense fallback={<TabFallback />}>
                    <ExhibitionBoothsTab exhibitionId={exhibition.id} isAr={isAr} />
                  </Suspense>
                </TabsContent>
              )}

              {hasReviews && (
                <TabsContent value="reviews" className="mt-6">
                  <Suspense fallback={<TabFallback />}>
                    <ExhibitionReviewsTab exhibitionId={exhibition.id} hasEnded={hasEnded} isAr={isAr} />
                  </Suspense>
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* ======== SIDEBAR (Desktop) ======== */}
          <div className="hidden space-y-5 lg:block">
            {(isUpcoming || isHappening) && (
              <Card className="relative overflow-hidden shadow-md border-primary/15">
                <div className="absolute -top-12 -end-12 h-32 w-32 rounded-full bg-primary/5 blur-[40px]" />
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10"><Timer className="h-3.5 w-3.5 text-primary" /></div>
                    {isHappening ? (isAr ? "ينتهي خلال" : "Ends In") : (isAr ? "يبدأ خلال" : "Starts In")}
                  </h3>
                </div>
                <CardContent className="py-4 px-3"><CountdownTimer targetDate={isHappening ? end : start} isAr={isAr} compact /></CardContent>
              </Card>
            )}

            <ExhibitionRegistrationStatus registrationDeadline={exhibition.registration_deadline} registrationUrl={exhibition.registration_url} maxAttendees={exhibition.max_attendees} isFree={exhibition.is_free} ticketPrice={exhibition.ticket_price} ticketPriceAr={exhibition.ticket_price_ar} startDate={exhibition.start_date} endDate={exhibition.end_date} isAr={isAr} />
            <ExhibitionTicketBooking exhibitionId={exhibition.id} exhibitionTitle={title} isFree={exhibition.is_free} ticketPrice={exhibition.ticket_price} hasEnded={hasEnded} isAr={isAr} />
            <ExhibitionDayIndicator startDate={exhibition.start_date} endDate={exhibition.end_date} isAr={isAr} />

            {/* Actions */}
            <Card className="relative overflow-hidden shadow-md border-primary/15">
              <div className="absolute -top-12 -end-12 h-32 w-32 rounded-full bg-primary/5 blur-[40px]" />
              <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10"><Ticket className="h-3.5 w-3.5 text-primary" /></div>
                  {isAr ? "إجراءات" : "Actions"}
                </h3>
              </div>
              <CardContent className="space-y-3 p-4">
                {exhibition.registration_url && !hasEnded && (
                  <Button className="w-full" asChild>
                    <a href={exhibition.registration_url} target="_blank" rel="noopener noreferrer"><Ticket className="me-2 h-4 w-4" />{isAr ? "سجل الآن" : "Register Now"}</a>
                  </Button>
                )}
                {user && (
                  <Button variant={isFollowing ? "outline" : "secondary"} className="w-full" onClick={handleFollow} disabled={toggleFollow.isPending}>
                    {isFollowing ? (<><BellOff className="me-2 h-4 w-4" />{isAr ? "إلغاء المتابعة" : "Unfollow"}</>) : (<><Bell className="me-2 h-4 w-4" />{isAr ? "تابع للإشعارات" : "Follow for Updates"}</>)}
                  </Button>
                )}
                {exhibition.website_url && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={exhibition.website_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="me-2 h-4 w-4" />{isAr ? "الموقع الرسمي" : "Official Website"}</a>
                  </Button>
                )}
                <p className="text-center text-xs text-muted-foreground"><Users className="mb-0.5 me-1 inline h-3 w-3" />{followerCount} {isAr ? "متابع" : "followers"}</p>
              </CardContent>
            </Card>

            <Suspense fallback={null}>
              <ExhibitionContactCard organizerName={organizer} organizerLogo={organizerLogoUrl} email={exhibition.organizer_email} phone={exhibition.organizer_phone} website={exhibition.organizer_website} isAr={isAr} />
              {!exhibition.is_virtual && <ExhibitionMapEmbed mapUrl={exhibition.map_url} venue={venue} city={exhibition.city} country={exhibition.country} address={(exhibition as any).address || null} isAr={isAr} />}
              <ExhibitionSocialLinks socialLinks={exhibition.social_links as any} websiteUrl={exhibition.website_url} isAr={isAr} />
              <ExhibitionDocuments documents={(exhibition as any).documents} isAr={isAr} />
            </Suspense>

            {/* Event Details */}
            <Card className="overflow-hidden transition-all hover:shadow-sm">
              <div className="border-b bg-muted/30 px-4 py-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/10"><Calendar className="h-3.5 w-3.5 text-accent-foreground" /></div>
                  {isAr ? "تفاصيل الحدث" : "Event Details"}
                </h3>
              </div>
              <CardContent className="p-0">
                <div className="flex items-center gap-3 px-4 py-3">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{isAr ? "التاريخ" : "Date"}</p>
                    <p className="text-sm font-medium">{format(start, "MMM d")} – {format(end, "MMM d, yyyy")}</p>
                  </div>
                </div>
                <Separator />
                {exhibition.registration_deadline && (
                  <>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <Clock className="h-4 w-4 text-destructive shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{isAr ? "آخر موعد للتسجيل" : "Registration Deadline"}</p>
                        <p className="text-sm font-medium">{format(new Date(exhibition.registration_deadline), "MMM d, yyyy")}</p>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}
                {exhibition.is_virtual ? (
                  <>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{isAr ? "الموقع" : "Location"}</p>
                        <p className="text-sm font-medium">{isAr ? "حدث افتراضي" : "Virtual Event"}</p>
                        {exhibition.virtual_link && !hasEnded && <a href={exhibition.virtual_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">{isAr ? "رابط الدخول" : "Join Link"}</a>}
                      </div>
                    </div>
                    <Separator />
                  </>
                ) : venue ? (
                  <>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{isAr ? "الموقع" : "Location"}</p>
                        <p className="text-sm font-medium">{countryFlag} {venue}{exhibition.city && <><br />{exhibition.city}</>}{exhibition.country && `, ${exhibition.country}`}</p>
                      </div>
                    </div>
                    <Separator />
                  </>
                ) : null}
                <div className="flex items-center gap-3 px-4 py-3">
                  <Ticket className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{isAr ? "التذاكر" : "Tickets"}</p>
                    <p className="text-sm font-medium">{exhibition.is_free ? (isAr ? "دخول مجاني" : "Free Entry") : (isAr && exhibition.ticket_price_ar ? exhibition.ticket_price_ar : exhibition.ticket_price || (isAr ? "راجع الموقع" : "See website"))}</p>
                  </div>
                </div>
                {exhibition.max_attendees && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-3 px-4 py-3">
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{isAr ? "السعة" : "Capacity"}</p>
                        <p className="text-sm font-medium">{toEnglishDigits(exhibition.max_attendees.toLocaleString())} {isAr ? "مقعد" : "attendees"}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {exhibitionQrCode && <QRCodeDisplay code={exhibitionQrCode.code} label={isAr ? "رمز QR للفعالية" : "Exhibition QR Code"} size={140} compact={false} />}

            {tags.length > 0 && (
              <Card className="overflow-hidden transition-all hover:shadow-sm">
                <div className="border-b bg-muted/30 px-4 py-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/10"><Tag className="h-3.5 w-3.5 text-accent-foreground" /></div>
                    {isAr ? "الوسوم" : "Tags"}
                  </h3>
                </div>
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-1.5">{tags.map((tag) => <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>)}</div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {lightboxOpen && (
        <ImageLightbox images={galleryUrls.map((url, i) => ({ url, title: `${title} ${i + 1}` }))} currentIndex={lightboxIndex} onClose={() => setLightboxOpen(false)} onNavigate={setLightboxIndex} />
      )}
      <Footer />
    </div>
  );
}

/* ---------- Collapsible Day Component ---------- */
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

function CollapsibleDay({ index, dayLabel, dayTitle, events, isAr, defaultOpen }: {
  index: number; dayLabel?: string; dayTitle?: string; events: ScheduleItem[]; isAr: boolean; defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="overflow-hidden shadow-sm">
        <CollapsibleTrigger asChild>
          <button className="w-full text-start">
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/5" />
              <div className="relative flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 font-bold text-primary text-sm">{index + 1}</div>
                  <div>
                    <p className="text-xs text-muted-foreground">{dayLabel}</p>
                    {dayTitle && <p className="font-semibold">{dayTitle}</p>}
                    <p className="text-xs text-muted-foreground">{events.length} {isAr ? "فعالية" : "events"}</p>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
              </div>
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t px-5 py-4 space-y-4">
            <div className="relative border-s-2 border-border ps-6 space-y-5">
              {events.map((event, j) => (
                <div key={j} className="relative">
                  <div className="absolute -start-[29px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-background" />
                  {event.time && <p className="font-mono text-xs font-semibold text-primary">{event.time}</p>}
                  <p className="font-medium text-sm">{isAr && event.title_ar ? event.title_ar : event.title}</p>
                  {(event.description || event.description_ar) && <p className="mt-0.5 text-xs text-muted-foreground">{isAr && event.description_ar ? event.description_ar : event.description}</p>}
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
