import { useParams, Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Calendar, Landmark, ImageIcon, LayoutGrid, MessageSquare, Award,
  Star, Trophy, Users, Clock, Settings, CalendarClock, ChefHat, Navigation, Gavel, Ticket,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { ExhibitionGalleryLightbox } from "@/components/exhibitions/detail/ExhibitionGalleryLightbox";
import { countryFlag as getCountryFlagUtil } from "@/lib/countryFlag";
import { isPast, isFuture, isWithinInterval } from "date-fns";
import { useState, useMemo, lazy, Suspense, memo, useCallback } from "react";
import { useEntityQRCode } from "@/hooks/useQRCode";
import { useEventWatchlist } from "@/components/fan/FanEventWatchlist";
import { EventComments } from "@/components/fan/EventComments";

// Static imports for critical path
import { ExhibitionHero } from "@/components/exhibitions/detail/ExhibitionHero";
import { ExhibitionMobileActionBar } from "@/components/exhibitions/detail/ExhibitionMobileActionBar";
import { ExhibitionInteractiveStats } from "@/components/exhibitions/detail/ExhibitionInteractiveStats";
import { ExhibitionQuickStats } from "@/components/exhibitions/detail/ExhibitionQuickStats";

// Lazy-loaded components
const ExhibitionOverviewTab = lazy(() => import("@/components/exhibitions/detail/ExhibitionOverviewTab").then(m => ({ default: m.ExhibitionOverviewTab })));
const ExhibitionSidebar = lazy(() => import("@/components/exhibitions/detail/ExhibitionSidebar").then(m => ({ default: m.ExhibitionSidebar })));
const ExhibitionWinningDishesTab = lazy(() => import("@/components/exhibitions/detail/ExhibitionWinningDishesTab").then(m => ({ default: m.ExhibitionWinningDishesTab })));
const ExhibitionCompetitionsTab = lazy(() => import("@/components/exhibitions/detail/ExhibitionCompetitionsTab").then(m => ({ default: m.ExhibitionCompetitionsTab })));
const ExhibitionScheduleTab = lazy(() => import("@/components/exhibitions/detail/ExhibitionScheduleTab").then(m => ({ default: m.ExhibitionScheduleTab })));
const ExhibitionPeopleTab = lazy(() => import("@/components/exhibitions/detail/ExhibitionPeopleTab").then(m => ({ default: m.ExhibitionPeopleTab })));
const ExhibitionGalleryTab = lazy(() => import("@/components/exhibitions/detail/ExhibitionGalleryTab").then(m => ({ default: m.ExhibitionGalleryTab })));
const ExhibitionSponsorsTab = lazy(() => import("@/components/exhibitions/detail/ExhibitionSponsorsTab").then(m => ({ default: m.ExhibitionSponsorsTab })));
const ExhibitionAgendaTab = lazy(() => import("@/components/exhibitions/detail/ExhibitionAgendaTab").then(m => ({ default: m.ExhibitionAgendaTab })));
const ExhibitionSchedulePublic = lazy(() => import("@/components/exhibitions/detail/ExhibitionSchedulePublic").then(m => ({ default: m.ExhibitionSchedulePublic })));
const ExhibitionBoothsTab = lazy(() => import("@/components/exhibitions/detail/ExhibitionBoothsTab").then(m => ({ default: m.ExhibitionBoothsTab })));
const ExhibitionFloorMap = lazy(() => import("@/components/exhibitions/detail/ExhibitionFloorMap").then(m => ({ default: m.ExhibitionFloorMap })));
const ExhibitionExhibitorRegistration = lazy(() => import("@/components/exhibitions/detail/ExhibitionExhibitorRegistration").then(m => ({ default: m.ExhibitionExhibitorRegistration })));
const ExhibitionReviewsTab = lazy(() => import("@/components/exhibitions/detail/ExhibitionReviewsTab").then(m => ({ default: m.ExhibitionReviewsTab })));
const ExhibitionCookingSessions = lazy(() => import("@/components/exhibitions/detail/ExhibitionCookingSessions").then(m => ({ default: m.ExhibitionCookingSessions })));
const ExhibitionOrganizerDashboard = lazy(() => import("@/components/exhibitions/ExhibitionOrganizerDashboard").then(m => ({ default: m.ExhibitionOrganizerDashboard })));
const ExhibitionLoyaltyWidget = lazy(() => import("@/components/exhibitions/detail/ExhibitionLoyaltyWidget").then(m => ({ default: m.ExhibitionLoyaltyWidget })));
const ExhibitionBoothNavigator = lazy(() => import("@/components/exhibitions/detail/ExhibitionBoothNavigator").then(m => ({ default: m.ExhibitionBoothNavigator })));
const ExhibitionSurveyManager = lazy(() => import("@/components/exhibitions/detail/ExhibitionSurveyManager").then(m => ({ default: m.ExhibitionSurveyManager })));
const ExhibitionSocialWall = lazy(() => import("@/components/exhibitions/detail/ExhibitionSocialWall").then(m => ({ default: m.ExhibitionSocialWall })));
const ExhibitionAnalyticsDashboardDetail = lazy(() => import("@/components/exhibitions/detail/ExhibitionAnalyticsDashboard").then(m => ({ default: m.ExhibitionAnalyticsDashboard })));
const ExhibitionIndoorMap = lazy(() => import("@/components/exhibitions/detail/ExhibitionIndoorMap").then(m => ({ default: m.ExhibitionIndoorMap })));
const ExhibitionAuctionsOffers = lazy(() => import("@/components/exhibitions/detail/ExhibitionAuctionsOffers").then(m => ({ default: m.ExhibitionAuctionsOffers })));
const ExhibitionMyTickets = lazy(() => import("@/components/exhibitions/detail/ExhibitionMyTickets").then(m => ({ default: m.ExhibitionMyTickets })));
const ExhibitionTicketSummary = lazy(() => import("@/components/exhibitions/detail/ExhibitionTicketSummary").then(m => ({ default: m.ExhibitionTicketSummary })));
const ExhibitionPaymentCallback = lazy(() => import("@/components/exhibitions/detail/ExhibitionPaymentCallback").then(m => ({ default: m.ExhibitionPaymentCallback })));

const TabFallback = () => <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />)}</div>;

/* ---------- types ---------- */
interface ScheduleDay {
  day?: string; day_ar?: string; title?: string; title_ar?: string;
  items?: any[]; events?: any[];
  time?: string; description?: string; description_ar?: string;
}
interface Speaker {
  name?: string; name_ar?: string; title?: string; title_ar?: string;
  role?: string; role_ar?: string; topic?: string; topic_ar?: string;
  image_url?: string; country?: string;
}
interface SponsorInfo { name?: string; name_ar?: string; tier?: string; logo_url?: string; }
interface Section { name?: string; name_ar?: string; description?: string; description_ar?: string; }

function getCountryFlag(country?: string): string {
  if (!country) return "🏳️";
  return getCountryFlagUtil(country) || "🏳️";
}

/* ---------- Memoized Tab Trigger ---------- */
const ExhibitionTabTrigger = memo(({ value, icon: Icon, label, count }: { value: string; icon: any; label: string; count?: number }) => (
  <TabsTrigger value={value} className="gap-1.5 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 hover:bg-muted/60 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-xs whitespace-nowrap">
    <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
    {label}
    {count !== undefined && count > 0 && (
      <Badge variant="secondary" className="ms-1 h-5 rounded-full bg-background/20 text-current px-1.5 text-[10px]">{count}</Badge>
    )}
  </TabsTrigger>
));
ExhibitionTabTrigger.displayName = "ExhibitionTabTrigger";

/* ========== MAIN ========== */
export default function ExhibitionDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState("overview");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [searchParams] = useSearchParams();
  const hasPaymentCallback = searchParams.get("payment") === "callback";

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

  const { isWatched: isWatchlisted, toggle: toggleWatchlist } = useEventWatchlist("exhibition", exhibition?.id);

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

  // Feature counts (batched)
  const { data: featureCounts } = useQuery({
    queryKey: ["exhibition-feature-counts", exhibition?.id],
    queryFn: async () => {
      const [agenda, booths, reviews, scheduleItems, tickets, reviewRatings] = await Promise.all([
        supabase.from("exhibition_agenda_items").select("id", { count: "exact", head: true }).eq("exhibition_id", exhibition!.id),
        supabase.from("exhibition_booths").select("id", { count: "exact", head: true }).eq("exhibition_id", exhibition!.id),
        supabase.from("exhibition_reviews").select("id", { count: "exact", head: true }).eq("exhibition_id", exhibition!.id),
        supabase.from("exhibition_schedule_items").select("id", { count: "exact", head: true }).eq("exhibition_id", exhibition!.id),
        supabase.from("exhibition_tickets").select("id", { count: "exact", head: true }).eq("exhibition_id", exhibition!.id).eq("status", "confirmed"),
        supabase.from("exhibition_reviews").select("rating").eq("exhibition_id", exhibition!.id),
      ]);
      const ratings = reviewRatings.data || [];
      const avgRating = ratings.length > 0 ? ratings.reduce((s, r) => s + (r as any).rating, 0) / ratings.length : 0;
      return { agenda: agenda.count || 0, booths: booths.count || 0, reviews: reviews.count || 0, scheduleItems: scheduleItems.count || 0, tickets: tickets.count || 0, avgRating };
    },
    enabled: !!exhibition,
    staleTime: 1000 * 60 * 5,
  });

  const agendaCount = featureCounts?.agenda || 0;
  const boothCount = featureCounts?.booths || 0;
  const reviewCount = featureCounts?.reviews || 0;
  const scheduleItemCount = featureCounts?.scheduleItems || 0;
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
  const organizerLogoUrl = (exhibition as any).organizer_logo_url || exhibition.logo_url;
  const isOwner = user && exhibition.created_by === user.id;

  const hasWinningDishes = winningDishes && winningDishes.length > 0;
  const hasCompetitions = linkedCompetitions && linkedCompetitions.length > 0;
  const hasSchedule = schedule.length > 0;
  const hasJudges = judgeProfiles && judgeProfiles.length > 0;
  const hasSpeakers = speakers.length > 0;
  const hasGallery = galleryUrls.length > 0;
  const hasSponsors = sponsorsInfo.length > 0;
  const hasAgenda = agendaCount > 0;
  const hasBooths = boothCount > 0;
  const hasReviews = reviewCount > 0 || hasEnded;
  const hasScheduleItems = scheduleItemCount > 0;

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
      <SEOHead
        title={`${title} — ${isAr ? "الطهاة" : "Altoha"}`}
        description={description ? description.slice(0, 160) : `${title} - ${isAr ? "فعالية على الطهاة" : "Event on Altoha"}`}
        ogImage={exhibition.cover_image_url || undefined}
        ogType="article"
        jsonLd={{
          "@context": "https://schema.org", "@type": "Event", name: title,
          description: description || undefined, startDate: exhibition.start_date, endDate: exhibition.end_date,
          eventStatus: hasEnded ? "https://schema.org/EventPostponed" : isHappening ? "https://schema.org/EventScheduled" : "https://schema.org/EventScheduled",
          eventAttendanceMode: exhibition.is_virtual ? "https://schema.org/OnlineEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
          location: exhibition.is_virtual
            ? { "@type": "VirtualLocation", url: exhibition.virtual_link || exhibition.website_url }
            : { "@type": "Place", name: venue || undefined, address: { "@type": "PostalAddress", addressLocality: exhibition.city, addressCountry: exhibition.country } },
          image: exhibition.cover_image_url || undefined,
          organizer: organizer ? { "@type": "Organization", name: organizer, url: exhibition.organizer_website || undefined } : undefined,
          ...(exhibition.registration_url && !hasEnded ? { offers: { "@type": "Offer", url: exhibition.registration_url, availability: "https://schema.org/InStock", ...(exhibition.is_free ? { price: "0" } : exhibition.ticket_price ? { price: exhibition.ticket_price } : {}) } } : {}),
          ...(reviewCount > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingCount: reviewCount } } : {}),
        }}
      />
      <Header />

      <ExhibitionHero
        exhibition={exhibition} title={title} venue={venue} organizer={organizer}
        organizerLogoUrl={organizerLogoUrl} isHappening={isHappening} isUpcoming={isUpcoming}
        hasEnded={hasEnded} isOwner={!!isOwner} followerCount={followerCount || 0}
        linkedCompetitionsCount={linkedCompetitions?.length || 0} isAr={isAr}
      />

      <main className="container flex-1 py-6 pb-20 lg:pb-8 md:py-8">
        {/* Payment Callback */}
        {hasPaymentCallback && (
          <Suspense fallback={null}>
            <ExhibitionPaymentCallback
              exhibitionId={exhibition.id}
              isAr={isAr}
              onDismiss={() => setActiveTab("my-tickets")}
            />
          </Suspense>
        )}
        {/* Quick Stats Bar */}
        <div className="mb-4">
          <ExhibitionQuickStats exhibitionId={exhibition.id} viewCount={exhibition.view_count || 0} isAr={isAr} />
        </div>
        {/* Interactive Stats Bar */}
        <div className="mb-6">
          <ExhibitionInteractiveStats
            viewCount={exhibition.view_count || 0}
            followerCount={followerCount || 0}
            reviewCount={reviewCount}
            avgRating={featureCounts?.avgRating || 0}
            boothCount={boothCount}
            ticketCount={featureCounts?.tickets || 0}
            isAr={isAr}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* ======== MAIN CONTENT ======== */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 sm:space-y-8">
              <div className="sticky top-14 z-30 -mx-2 border-b border-border/40 bg-background/80 px-2 py-2 backdrop-blur-md sm:mx-0 sm:rounded-2xl sm:border sm:px-4 sm:py-3">
                <TabsList className="h-auto w-full justify-start gap-0.5 overflow-x-auto bg-transparent p-0 scrollbar-none sm:gap-1">
                  <TabsTrigger value="overview" className="rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg shadow-primary/20 sm:px-5 sm:py-2.5 sm:text-xs whitespace-nowrap">
                    {isAr ? "نظرة عامة" : "Overview"}
                  </TabsTrigger>
                  {hasWinningDishes && <ExhibitionTabTrigger value="winning-dishes" icon={Award} label={isAr ? "الأطباق" : "Winners"} count={winningDishes!.length} />}
                  {hasCompetitions && <ExhibitionTabTrigger value="competitions" icon={Trophy} label={isAr ? "المسابقات" : "Competitions"} count={linkedCompetitions!.length} />}
                  {hasSchedule && <ExhibitionTabTrigger value="schedule" icon={Calendar} label={isAr ? "الجدول" : "Schedule"} />}
                  {(hasJudges || hasSpeakers) && <ExhibitionTabTrigger value="people" icon={Users} label={isAr ? "الأشخاص" : "People"} />}
                  {hasGallery && <ExhibitionTabTrigger value="gallery" icon={ImageIcon} label={isAr ? "المعرض" : "Gallery"} />}
                  {hasAgenda && <ExhibitionTabTrigger value="agenda" icon={Clock} label={isAr ? "الأجندة" : "Agenda"} count={agendaCount} />}
                  {hasScheduleItems && <ExhibitionTabTrigger value="event-schedule" icon={CalendarClock} label={isAr ? "البرنامج" : "Program"} count={scheduleItemCount} />}
                  {hasBooths && <ExhibitionTabTrigger value="booths" icon={LayoutGrid} label={isAr ? "الأجنحة" : "Booths"} count={boothCount} />}
                  {hasSponsors && <ExhibitionTabTrigger value="sponsors" icon={Star} label={isAr ? "الرعاة" : "Sponsors"} />}
                  <ExhibitionTabTrigger value="cooking" icon={ChefHat} label={isAr ? "الطهي الحي" : "Live Cooking"} />
                  <ExhibitionTabTrigger value="social" icon={MessageSquare} label={isAr ? "اجتماعي" : "Social"} />
                  <ExhibitionTabTrigger value="navigation" icon={Navigation} label={isAr ? "الملاحة" : "Navigate"} />
                  <ExhibitionTabTrigger value="auctions" icon={Gavel} label={isAr ? "مزادات" : "Auctions"} />
                  {hasReviews && <ExhibitionTabTrigger value="reviews" icon={MessageSquare} label={isAr ? "التقييمات" : "Reviews"} count={reviewCount > 0 ? reviewCount : undefined} />}
              {user && <ExhibitionTabTrigger value="my-tickets" icon={Ticket} label={isAr ? "تذاكري" : "My Tickets"} />}
              {isOwner && <ExhibitionTabTrigger value="organizer" icon={Settings} label={isAr ? "لوحة التحكم" : "Dashboard"} />}
                </TabsList>
              </div>

              <TabsContent value="overview" className="mt-6">
                <Suspense fallback={<TabFallback />}>
                  <ExhibitionOverviewTab
                    exhibition={exhibition} title={title} description={description} isAr={isAr}
                    linkedCompetitions={linkedCompetitions} sections={sections}
                    targetAudience={targetAudience} galleryUrls={galleryUrls}
                    onSetActiveTab={setActiveTab} onLightboxOpen={handleLightbox}
                  />
                </Suspense>
              </TabsContent>

              {hasWinningDishes && (
                <TabsContent value="winning-dishes" className="mt-6">
                  <Suspense fallback={<TabFallback />}>
                    <ExhibitionWinningDishesTab winningDishes={winningDishes!} isAr={isAr} />
                  </Suspense>
                </TabsContent>
              )}

              {hasCompetitions && (
                <TabsContent value="competitions" className="mt-6">
                  <Suspense fallback={<TabFallback />}>
                    <ExhibitionCompetitionsTab competitions={linkedCompetitions!} isAr={isAr} />
                  </Suspense>
                </TabsContent>
              )}

              {hasSchedule && (
                <TabsContent value="schedule" className="mt-6">
                  <Suspense fallback={<TabFallback />}>
                    <ExhibitionScheduleTab schedule={schedule} isAr={isAr} />
                  </Suspense>
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
                  <Suspense fallback={<TabFallback />}>
                    <ExhibitionGalleryTab galleryUrls={galleryUrls} title={title} onLightboxOpen={handleLightbox} />
                  </Suspense>
                </TabsContent>
              )}

              {hasSponsors && (
                <TabsContent value="sponsors" className="mt-6">
                  <Suspense fallback={<TabFallback />}>
                    <ExhibitionSponsorsTab sponsors={sponsorsInfo} isAr={isAr} />
                  </Suspense>
                </TabsContent>
              )}

              {hasAgenda && (
                <TabsContent value="agenda" className="mt-6">
                  <Suspense fallback={<TabFallback />}>
                    <ExhibitionAgendaTab exhibitionId={exhibition.id} startDate={exhibition.start_date} endDate={exhibition.end_date} isAr={isAr} />
                  </Suspense>
                </TabsContent>
              )}

              {hasScheduleItems && (
                <TabsContent value="event-schedule" className="mt-6">
                  <Suspense fallback={<TabFallback />}>
                    <ExhibitionSchedulePublic exhibitionId={exhibition.id} startDate={exhibition.start_date} endDate={exhibition.end_date} isAr={isAr} />
                  </Suspense>
                </TabsContent>
              )}

              {hasBooths && (
                <TabsContent value="booths" className="mt-6 space-y-6">
                  <Suspense fallback={<TabFallback />}>
                    <ExhibitionBoothNavigator exhibitionId={exhibition.id} isAr={isAr} />
                    <ExhibitionFloorMap exhibitionId={exhibition.id} isAr={isAr} />
                    <ExhibitionBoothsTab exhibitionId={exhibition.id} isAr={isAr} />
                    {!isOwner && !hasEnded && (
                      <ExhibitionExhibitorRegistration exhibitionId={exhibition.id} isAr={isAr} />
                    )}
                  </Suspense>
                </TabsContent>
              )}

              <TabsContent value="cooking" className="mt-6">
                <Suspense fallback={<TabFallback />}>
                  <ExhibitionCookingSessions exhibitionId={exhibition.id} isAr={isAr} />
                </Suspense>
              </TabsContent>

              <TabsContent value="social" className="mt-6">
                <Suspense fallback={<TabFallback />}>
                  <ExhibitionSocialWall exhibitionId={exhibition.id} exhibitionTitle={title} exhibitionHashtag={exhibition.slug?.replace(/-/g, "_")} />
                </Suspense>
              </TabsContent>

              <TabsContent value="navigation" className="mt-6">
                <Suspense fallback={<TabFallback />}>
                  <ExhibitionIndoorMap exhibitionId={exhibition.id} isAr={isAr} />
                </Suspense>
              </TabsContent>

              <TabsContent value="auctions" className="mt-6">
                <Suspense fallback={<TabFallback />}>
                  <ExhibitionAuctionsOffers exhibitionId={exhibition.id} isAr={isAr} />
                </Suspense>
              </TabsContent>

              {hasReviews && (
                <TabsContent value="reviews" className="mt-6 space-y-6">
                  <Suspense fallback={<TabFallback />}>
                    <ExhibitionReviewsTab exhibitionId={exhibition.id} hasEnded={hasEnded} isAr={isAr} creatorId={exhibition.created_by || undefined} />
                    {hasEnded && (
                      <ExhibitionSurveyManager exhibitionId={exhibition.id} isAr={isAr} isOrganizer={!!isOwner} />
                    )}
                    <ExhibitionLoyaltyWidget exhibitionId={exhibition.id} isAr={isAr} />
                  </Suspense>
                </TabsContent>
              )}

              {user && (
                <TabsContent value="my-tickets" className="mt-6">
                  <Suspense fallback={<TabFallback />}>
                    <ExhibitionMyTickets exhibitionId={exhibition.id} exhibitionTitle={title} exhibitionDate={exhibition.start_date} exhibitionVenue={venue || undefined} isAr={isAr} />
                    <div className="mt-4">
                      <ExhibitionTicketSummary exhibitionId={exhibition.id} maxAttendees={exhibition.max_attendees} isAr={isAr} />
                    </div>
                  </Suspense>
                </TabsContent>
              )}

              {isOwner && (
                <TabsContent value="organizer" className="mt-6">
                  <Suspense fallback={<TabFallback />}>
                    <ExhibitionOrganizerDashboard exhibitionId={exhibition.id} exhibitionTitle={title} isAr={isAr} />
                  </Suspense>
                </TabsContent>
              )}
            </Tabs>

            {/* Comments Section */}
            <div className="mt-6 rounded-2xl border border-border/40 bg-card p-5">
              <EventComments eventType="exhibition" eventId={exhibition.id} />
            </div>
          </div>

          {/* ======== SIDEBAR (Desktop) ======== */}
          <Suspense fallback={null}>
            <ExhibitionSidebar
              exhibition={exhibition} title={title} description={description} venue={venue}
              organizer={organizer} organizerLogoUrl={organizerLogoUrl}
              isHappening={isHappening} isUpcoming={isUpcoming} hasEnded={hasEnded}
              isFollowing={!!isFollowing} followerCount={followerCount || 0} user={user}
              isAr={isAr} countryFlag={countryFlag} tags={tags}
              exhibitionQrCode={exhibitionQrCode} onFollow={handleFollow} followPending={toggleFollow.isPending}
              isWatchlisted={isWatchlisted} onToggleWatchlist={toggleWatchlist}
            />
          </Suspense>
        </div>
      </main>

      {/* Sticky mobile action bar */}
      <ExhibitionMobileActionBar
        user={user} isFollowing={!!isFollowing} followPending={toggleFollow.isPending}
        onFollow={handleFollow} registrationUrl={exhibition.registration_url}
        websiteUrl={exhibition.website_url} hasEnded={hasEnded} isAr={isAr}
        exhibitionTitle={title}
        isWatchlisted={isWatchlisted} onToggleWatchlist={toggleWatchlist}
      />

      <ExhibitionGalleryLightbox
        images={galleryUrls}
        initialIndex={lightboxIndex}
        title={title}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
      <Footer />
    </div>
  );
}
