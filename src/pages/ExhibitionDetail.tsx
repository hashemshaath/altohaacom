import { ROUTES } from "@/config/routes";
import { useIsAr } from "@/hooks/useIsAr";
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
  Star, Trophy, Users, Clock, Settings, ChefHat, Ticket, ScanLine, Gem, LucideIcon,
  Info, MapPinned,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { ExhibitionGalleryLightbox } from "@/components/exhibitions/detail/ExhibitionGalleryLightbox";
import { countryFlag as getCountryFlagUtil } from "@/lib/countryFlag";
import { isPast, isFuture, isWithinInterval } from "date-fns";
import { useState, useMemo, lazy, Suspense, memo, useCallback, useEffect, useRef } from "react";
import { useEntityQRCode } from "@/hooks/useQRCode";
import { useEventWatchlist } from "@/components/fan/FanEventWatchlist";
import { EventComments } from "@/components/fan/EventComments";

// Static imports for critical path
import { ExhibitionHeroPremium } from "@/components/exhibitions/detail/ExhibitionHeroPremium";
import { ExhibitionMobileActionBar } from "@/components/exhibitions/detail/ExhibitionMobileActionBar";
import { ExhibitionInteractiveStats } from "@/components/exhibitions/detail/ExhibitionInteractiveStats";
import { CACHE } from "@/lib/queryConfig";
import { QUERY_LIMIT_LARGE } from "@/lib/constants";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

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
const SmartEventRecommendations = lazy(() => import("@/components/SmartEventRecommendations").then(m => ({ default: m.SmartEventRecommendations })));
const ExhibitionMyTickets = lazy(() => import("@/components/exhibitions/detail/ExhibitionMyTickets").then(m => ({ default: m.ExhibitionMyTickets })));
const ExhibitionTicketSummary = lazy(() => import("@/components/exhibitions/detail/ExhibitionTicketSummary").then(m => ({ default: m.ExhibitionTicketSummary })));
const ExhibitionCheckinScanner = lazy(() => import("@/components/exhibitions/detail/ExhibitionCheckinScanner"));
const OrganizerSalesReport = lazy(() => import("@/components/exhibitions/detail/OrganizerSalesReport"));
const OrganizerAttendeeCommunication = lazy(() => import("@/components/exhibitions/detail/OrganizerAttendeeCommunication"));
const ExhibitionEventScheduleWidget = lazy(() => import("@/components/exhibitions/detail/ExhibitionEventScheduleWidget"));
const ExhibitionPaymentCallback = lazy(() => import("@/components/exhibitions/detail/ExhibitionPaymentCallback").then(m => ({ default: m.ExhibitionPaymentCallback })));
const ExhibitionInteractiveBoothManager = lazy(() => import("@/components/exhibitions/detail/ExhibitionInteractiveBoothManager"));
const ExhibitionSponsorshipHub = lazy(() => import("@/components/exhibitions/detail/ExhibitionSponsorshipHub"));
const ExhibitionAttendeeSchedule = lazy(() => import("@/components/exhibitions/detail/ExhibitionAttendeeSchedule"));
const OrganizerAdvancedReports = lazy(() => import("@/components/exhibitions/detail/OrganizerAdvancedReports"));
const RelatedExhibitions = lazy(() => import("@/components/exhibitions/detail/RelatedExhibitions").then(m => ({ default: m.RelatedExhibitions })));
const ExhibitionEditionsSection = lazy(() => import("@/components/exhibitions/detail/ExhibitionEditionsSection").then(m => ({ default: m.ExhibitionEditionsSection })));

const TabFallback = () => (
  <div className="space-y-4 py-4">
    {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
  </div>
);

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
const ExhibitionTabTrigger = memo(({ value, icon: Icon, label, count }: { value: string; icon: LucideIcon; label: string; count?: number }) => (
  <TabsTrigger
    value={value}
    className="gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-muted/50 sm:px-4 sm:py-2.5 sm:text-sm whitespace-nowrap touch-manipulation"
  >
    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
    {label}
    {count !== undefined && count > 0 && (
      <Badge variant="secondary" className="ms-1 h-4.5 rounded-full px-1.5 text-[0.625rem] font-bold">{count}</Badge>
    )}
  </TabsTrigger>
));
ExhibitionTabTrigger.displayName = "ExhibitionTabTrigger";

/* ========== MAIN ========== */
export default function ExhibitionDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const isAr = useIsAr();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [searchParams] = useSearchParams();
  const hasPaymentCallback = searchParams.get("payment") === "callback";

  const { data: exhibition, isLoading } = useQuery({
    queryKey: ["exhibition", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("exhibitions").select("id, title, title_ar, slug, description, description_ar, type, status, start_date, end_date, venue, venue_ar, address, address_ar, city, country, cover_image_url, logo_url, gallery_urls, categories, tags, target_audience, targeted_sectors, ticket_price, ticket_price_ar, is_free, is_virtual, is_featured, max_attendees, registration_deadline, registration_url, website_url, virtual_link, map_url, organizer_name, organizer_name_ar, organizer_email, organizer_phone, organizer_logo_url, organizer_website, organizer_type, organizer_id, organizer_user_id, organizer_company_id, organizer_entity_id, schedule, speakers, sponsors_info, highlights, reasons_to_attend, unique_features, sections, documents, social_links, entry_details, edition_year, edition_stats, exhibition_number, series_id, includes_competitions, includes_seminars, includes_training, currency, import_source, view_count, created_by, created_at, updated_at, venue_details, early_bird_deadline").eq("slug", slug!).maybeSingle();
      if (error) throw handleSupabaseError(error);
      if (!data) throw new Error("Exhibition not found");
      return data;
    },
    enabled: !!slug,
    staleTime: CACHE.medium.staleTime,
  });

  // Increment view count once per session
  const viewIncremented = useRef(false);
  useEffect(() => {
    if (exhibition?.id && !viewIncremented.current) {
      viewIncremented.current = true;
      supabase.rpc("increment_exhibition_views", { exhibition_id: exhibition.id }).then(null, () => {});
    }
  }, [exhibition?.id]);

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
    staleTime: CACHE.medium.staleTime,
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
      if (error) throw handleSupabaseError(error);
      return data || [];
    },
    enabled: !!exhibition,
    staleTime: CACHE.default.staleTime,
  });

  const competitionIds = useMemo(() => linkedCompetitions?.map((c) => c.id) || [], [linkedCompetitions]);

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
      if (error) throw handleSupabaseError(error);

      const scored = (regs || [])
        .map((r) => ({ ...r, totalScore: (r.competition_scores || []).reduce((sum, s) => sum + Number(s.score || 0), 0), scoreCount: (r.competition_scores || []).length }))
        .filter((r) => r.scoreCount > 0)
        .sort((a, b) => b.totalScore - a.totalScore);

      const participantIds = [...new Set(scored.map((r) => r.participant_id))];
      if (participantIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, username, avatar_url").in("user_id", participantIds);
        const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
        scored.forEach((r: any) => { r.participant = profileMap.get(r.participant_id) || null; });
      }

      const compMap = new Map(linkedCompetitions!.map((c) => [c.id, c]));
      scored.forEach((r: any) => { r.competition = compMap.get(r.competition_id) || null; });
      return scored;
    },
    enabled: competitionIds.length > 0,
    staleTime: CACHE.medium.staleTime,
  });

  const allJudgeIds = useMemo(() => {
    if (!linkedCompetitions) return [];
    const ids = new Set<string>();
    linkedCompetitions.forEach((c) => { c.competition_judges?.forEach((j) => ids.add(j.judge_id)); });
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
    staleTime: CACHE.medium.staleTime,
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
        supabase.from("exhibition_reviews").select("rating").eq("exhibition_id", exhibition!.id).limit(QUERY_LIMIT_LARGE),
      ]);
      const ratings = reviewRatings.data || [];
      const avgRating = ratings.length > 0 ? ratings.reduce((s, r) => s + ((r as unknown as Record<string, number>).rating || 0), 0) / ratings.length : 0;
      return { agenda: agenda.count || 0, booths: booths.count || 0, reviews: reviews.count || 0, scheduleItems: scheduleItems.count || 0, tickets: tickets.count || 0, avgRating };
    },
    enabled: !!exhibition,
    staleTime: CACHE.medium.staleTime,
  });

  const agendaCount = featureCounts?.agenda || 0;
  const boothCount = featureCounts?.booths || 0;
  const reviewCount = featureCounts?.reviews || 0;
  const scheduleItemCount = featureCounts?.scheduleItems || 0;
  const handleFollow = useCallback(() => toggleFollow.mutate(), [toggleFollow]);
  const handleLightbox = useCallback((i: number) => { setLightboxIndex(i); setLightboxOpen(true); }, []);

  /* ---------- loading ---------- */
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1">
          <Skeleton className="h-64 w-full md:h-80" />
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <Skeleton className="mb-4 h-6 w-48" />
            <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
              <div className="space-y-4">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-48 w-full rounded-xl" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-56 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* ---------- not found ---------- */
  if (!exhibition) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Landmark className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-semibold">{isAr ? "الحدث غير موجود" : "Event not found"}</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to={ROUTES.exhibitions}><Calendar className="me-2 h-4 w-4" />{isAr ? "العودة للفعاليات" : "Back to Events"}</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  /* ---------- derived data ---------- */
  const baseTitle = isAr && exhibition.title_ar ? exhibition.title_ar : exhibition.title;
  const editionYear = (exhibition as unknown as Record<string, number>).edition_year;
  const title = editionYear && !baseTitle.includes(String(editionYear)) ? `${baseTitle} ${editionYear}` : baseTitle;
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
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead
        title={isAr
          ? `${title} — معرض الطعام والمشروبات | الطهاة`
          : `${title} — Food & Beverage Exhibition | AlToha`}
        description={description ? description.slice(0, 155) : `${title} - ${isAr ? "معرض طعام ومشروبات" : "Food & Beverage Exhibition"}`}
        ogImage={exhibition.cover_image_url || undefined}
        ogType="article"
        canonical={`https://altoha.com/exhibitions/${exhibition.slug}`}
        lang={language}
        jsonLd={{
          "@context": "https://schema.org", "@type": "ExhibitionEvent", name: title,
          description: description || undefined, startDate: exhibition.start_date, endDate: exhibition.end_date,
          eventStatus: hasEnded ? "https://schema.org/EventScheduled" : "https://schema.org/EventScheduled",
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

      {/* ===== HERO (Glass Premium) ===== */}
      <ExhibitionHeroPremium
        exhibition={exhibition} title={title} venue={venue} organizer={organizer}
        organizerLogoUrl={organizerLogoUrl} isHappening={isHappening} isUpcoming={isUpcoming}
        hasEnded={hasEnded} isOwner={!!isOwner} followerCount={followerCount || 0}
        linkedCompetitionsCount={linkedCompetitions?.length || 0} isAr={isAr}
      />

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 pb-24 lg:pb-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

          {/* Payment Callback */}
          {hasPaymentCallback && (
            <Suspense fallback={null}>
              <ExhibitionPaymentCallback
                exhibitionId={exhibition.id}
                isAr={isAr}
                onDismiss={() => setActiveTab("tickets")}
              />
            </Suspense>
          )}

          {/* Stats Bar */}
          <div className="mb-8">
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

          {/* ===== TWO-COLUMN GRID ===== */}
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">

            {/* ---- LEFT: Tabs + Content ---- */}
            <div className="min-w-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                {/* Sticky Glass Tab Navigation — 6 grouped tabs */}
                <div className="sticky top-14 z-30 -mx-4 mb-8 overflow-x-auto border-b border-border/30 bg-background/70 px-4 py-2.5 backdrop-blur-2xl scrollbar-none sm:mx-0 sm:rounded-2xl sm:border sm:border-border/40 sm:px-2 sm:py-2 sm:shadow-sm">
                  <TabsList className="flex h-auto w-max gap-1 bg-transparent p-0">
                    <ExhibitionTabTrigger value="overview" icon={Info} label={isAr ? "نظرة عامة" : "Overview"} />
                    {(hasCompetitions || hasSchedule || hasAgenda || hasScheduleItems || hasWinningDishes) && (
                      <ExhibitionTabTrigger
                        value="program"
                        icon={Trophy}
                        label={isAr ? "البرنامج" : "Program"}
                        count={(linkedCompetitions?.length || 0) + agendaCount + scheduleItemCount}
                      />
                    )}
                    {(hasJudges || hasSpeakers || hasGallery) && (
                      <ExhibitionTabTrigger value="people-media" icon={Users} label={isAr ? "أشخاص ووسائط" : "People & Media"} />
                    )}
                    {hasBooths && (
                      <ExhibitionTabTrigger value="venue" icon={MapPinned} label={isAr ? "المكان والأجنحة" : "Venue & Booths"} count={boothCount} />
                    )}
                    <ExhibitionTabTrigger value="tickets" icon={Ticket} label={isAr ? "التذاكر والمشاركة" : "Tickets & Engage"} count={reviewCount > 0 ? reviewCount : undefined} />
                    {isOwner && (
                      <ExhibitionTabTrigger value="manage" icon={Settings} label={isAr ? "الإدارة" : "Manage"} />
                    )}
                  </TabsList>
                </div>

                {/* Tab Contents */}
                <div className="space-y-8">
                  {/* === OVERVIEW === */}
                  <TabsContent value="overview" className="mt-0 space-y-8">
                    <Suspense fallback={<TabFallback />}>
                      <ExhibitionOverviewTab
                        exhibition={exhibition} title={title} description={description} isAr={isAr}
                        linkedCompetitions={linkedCompetitions} sections={sections}
                        targetAudience={targetAudience} galleryUrls={galleryUrls}
                        onSetActiveTab={setActiveTab} onLightboxOpen={handleLightbox}
                      />
                      {hasSponsors && (
                        <SectionBlock title={isAr ? "الرعاة" : "Sponsors"} icon={Star}>
                          <ExhibitionSponsorsTab sponsors={sponsorsInfo} isAr={isAr} />
                        </SectionBlock>
                      )}
                    </Suspense>
                  </TabsContent>

                  {/* === PROGRAM (competitions + schedule + agenda + winners) === */}
                  {(hasCompetitions || hasSchedule || hasAgenda || hasScheduleItems || hasWinningDishes) && (
                    <TabsContent value="program" className="mt-0 space-y-8">
                      <Suspense fallback={<TabFallback />}>
                        {hasCompetitions && (
                          <SectionBlock title={isAr ? "المسابقات" : "Competitions"} icon={Trophy} count={linkedCompetitions!.length}>
                            <ExhibitionCompetitionsTab competitions={linkedCompetitions!} isAr={isAr} />
                          </SectionBlock>
                        )}
                        {hasWinningDishes && (
                          <SectionBlock title={isAr ? "الأطباق الفائزة" : "Winning Dishes"} icon={Award} count={winningDishes!.length}>
                            <ExhibitionWinningDishesTab winningDishes={winningDishes!} isAr={isAr} />
                          </SectionBlock>
                        )}
                        {hasScheduleItems && (
                          <SectionBlock title={isAr ? "الجدول التفصيلي" : "Detailed Program"} icon={Clock} count={scheduleItemCount}>
                            <ExhibitionSchedulePublic exhibitionId={exhibition.id} startDate={exhibition.start_date} endDate={exhibition.end_date} isAr={isAr} />
                          </SectionBlock>
                        )}
                        {hasAgenda && (
                          <SectionBlock title={isAr ? "الأجندة" : "Agenda"} icon={Clock} count={agendaCount}>
                            <ExhibitionAgendaTab exhibitionId={exhibition.id} startDate={exhibition.start_date} endDate={exhibition.end_date} isAr={isAr} />
                          </SectionBlock>
                        )}
                        {hasSchedule && (
                          <SectionBlock title={isAr ? "النظرة العامة على الجدول" : "Schedule Overview"} icon={Calendar}>
                            <ExhibitionScheduleTab schedule={schedule} isAr={isAr} />
                          </SectionBlock>
                        )}
                        <SectionBlock title={isAr ? "جلسات الطهي الحي" : "Live Cooking Sessions"} icon={ChefHat}>
                          <ExhibitionCookingSessions exhibitionId={exhibition.id} isAr={isAr} />
                        </SectionBlock>
                      </Suspense>
                    </TabsContent>
                  )}

                  {/* === PEOPLE & MEDIA === */}
                  {(hasJudges || hasSpeakers || hasGallery) && (
                    <TabsContent value="people-media" className="mt-0 space-y-8">
                      <Suspense fallback={<TabFallback />}>
                        {(hasJudges || hasSpeakers) && (
                          <SectionBlock title={isAr ? "الأشخاص" : "People"} icon={Users}>
                            <ExhibitionPeopleTab judgeProfiles={judgeProfiles || null} speakers={speakers} isAr={isAr} />
                          </SectionBlock>
                        )}
                        {hasGallery && (
                          <SectionBlock title={isAr ? "المعرض" : "Gallery"} icon={ImageIcon} count={galleryUrls.length}>
                            <ExhibitionGalleryTab galleryUrls={galleryUrls} title={title} onLightboxOpen={handleLightbox} />
                          </SectionBlock>
                        )}
                        <SectionBlock title={isAr ? "الجدار الاجتماعي" : "Social Wall"} icon={MessageSquare}>
                          <ExhibitionSocialWall exhibitionId={exhibition.id} exhibitionTitle={title} exhibitionHashtag={exhibition.slug?.replace(/-/g, "_")} />
                        </SectionBlock>
                      </Suspense>
                    </TabsContent>
                  )}

                  {/* === VENUE & BOOTHS === */}
                  {hasBooths && (
                    <TabsContent value="venue" className="mt-0 space-y-8">
                      <Suspense fallback={<TabFallback />}>
                        <SectionBlock title={isAr ? "إدارة الأجنحة" : "Booth Management"} icon={LayoutGrid} count={boothCount}>
                          <ExhibitionInteractiveBoothManager exhibitionId={exhibition.id} isAr={isAr} isOwner={!!isOwner} />
                          <div className="mt-6"><ExhibitionBoothNavigator exhibitionId={exhibition.id} isAr={isAr} /></div>
                          <div className="mt-6"><ExhibitionFloorMap exhibitionId={exhibition.id} isAr={isAr} /></div>
                          <div className="mt-6"><ExhibitionBoothsTab exhibitionId={exhibition.id} isAr={isAr} /></div>
                          {!isOwner && !hasEnded && (
                            <div className="mt-6"><ExhibitionExhibitorRegistration exhibitionId={exhibition.id} isAr={isAr} /></div>
                          )}
                        </SectionBlock>
                        <SectionBlock title={isAr ? "خريطة الموقع" : "Indoor Map"} icon={MapPinned}>
                          <ExhibitionIndoorMap exhibitionId={exhibition.id} isAr={isAr} />
                        </SectionBlock>
                      </Suspense>
                    </TabsContent>
                  )}

                  {/* === TICKETS & ENGAGE === */}
                  <TabsContent value="tickets" className="mt-0 space-y-8">
                    <Suspense fallback={<TabFallback />}>
                      {user && (
                        <SectionBlock title={isAr ? "تذاكري" : "My Tickets"} icon={Ticket}>
                          <ExhibitionMyTickets exhibitionId={exhibition.id} exhibitionTitle={title} exhibitionDate={exhibition.start_date} exhibitionVenue={venue || undefined} isAr={isAr} />
                          <div className="mt-4">
                            <ExhibitionTicketSummary exhibitionId={exhibition.id} maxAttendees={exhibition.max_attendees} isAr={isAr} />
                          </div>
                        </SectionBlock>
                      )}
                      {user && (
                        <SectionBlock title={isAr ? "جدولي الشخصي" : "My Schedule"} icon={Calendar}>
                          <ExhibitionAttendeeSchedule exhibitionId={exhibition.id} isAr={isAr} />
                        </SectionBlock>
                      )}
                      <SectionBlock title={isAr ? "المزادات والعروض" : "Auctions & Offers"} icon={Gem}>
                        <ExhibitionAuctionsOffers exhibitionId={exhibition.id} isAr={isAr} />
                      </SectionBlock>
                      <SectionBlock title={isAr ? "فرص الرعاية" : "Sponsorship Opportunities"} icon={Star}>
                        <ExhibitionSponsorshipHub exhibitionId={exhibition.id} isAr={isAr} />
                      </SectionBlock>
                      {hasReviews && (
                        <SectionBlock title={isAr ? "التقييمات" : "Reviews"} icon={MessageSquare} count={reviewCount > 0 ? reviewCount : undefined}>
                          <ExhibitionReviewsTab exhibitionId={exhibition.id} hasEnded={hasEnded} isAr={isAr} creatorId={exhibition.created_by || undefined} />
                          {hasEnded && (
                            <div className="mt-6">
                              <ExhibitionSurveyManager exhibitionId={exhibition.id} isAr={isAr} isOrganizer={!!isOwner} />
                            </div>
                          )}
                          <div className="mt-6">
                            <ExhibitionLoyaltyWidget exhibitionId={exhibition.id} isAr={isAr} />
                          </div>
                        </SectionBlock>
                      )}
                    </Suspense>
                  </TabsContent>

                  {/* === MANAGE (organizer-only) === */}
                  {isOwner && (
                    <TabsContent value="manage" className="mt-0 space-y-8">
                      <Suspense fallback={<TabFallback />}>
                        <SectionBlock title={isAr ? "تسجيل الدخول" : "Check-in Scanner"} icon={ScanLine}>
                          <ExhibitionCheckinScanner exhibitionId={exhibition.id} isAr={isAr} />
                        </SectionBlock>
                        <SectionBlock title={isAr ? "التقارير المتقدمة" : "Advanced Reports"} icon={Settings}>
                          <OrganizerAdvancedReports exhibitionId={exhibition.id} exhibitionTitle={title} isAr={isAr} />
                        </SectionBlock>
                        <SectionBlock title={isAr ? "تقرير المبيعات" : "Sales Report"} icon={Ticket}>
                          <OrganizerSalesReport exhibitionId={exhibition.id} exhibitionTitle={title} isAr={isAr} />
                        </SectionBlock>
                        <SectionBlock title={isAr ? "التواصل مع الحضور" : "Attendee Communication"} icon={MessageSquare}>
                          <OrganizerAttendeeCommunication exhibitionId={exhibition.id} isAr={isAr} />
                        </SectionBlock>
                        <SectionBlock title={isAr ? "إدارة الجدول" : "Schedule Management"} icon={Calendar}>
                          <ExhibitionEventScheduleWidget exhibitionId={exhibition.id} isAr={isAr} />
                        </SectionBlock>
                        <SectionBlock title={isAr ? "لوحة المنظم" : "Organizer Dashboard"} icon={Settings}>
                          <ExhibitionOrganizerDashboard exhibitionId={exhibition.id} exhibitionTitle={title} isAr={isAr} />
                        </SectionBlock>
                      </Suspense>
                    </TabsContent>
                  )}
                </div>
              </Tabs>

              {/* Comments — glass card */}
              <div className="mt-10 rounded-3xl border border-border/40 bg-card/60 p-6 backdrop-blur-xl shadow-sm">
                <EventComments eventType="exhibition" eventId={exhibition.id} />
              </div>
            </div>


            {/* ---- RIGHT: Sidebar ---- */}
            <aside className="hidden lg:block">
              <div className="sticky top-20 space-y-5">
                <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
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
            </aside>
          </div>

          {/* Mobile Sidebar (shown below tabs on mobile) */}
          <div className="mt-6 lg:hidden">
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

          {/* Previous Editions */}
          {(exhibition as any).series_id && (
            <div className="mt-8">
              <Suspense fallback={null}>
                <ExhibitionEditionsSection
                  seriesId={(exhibition as any).series_id}
                  currentExhibitionId={exhibition.id}
                  isAr={isAr}
                />
              </Suspense>
            </div>
          )}

          {/* Smart Recommendations */}
          <div className="mt-8">
            <Suspense fallback={null}>
              <SmartEventRecommendations
                currentEventId={exhibition.id}
                currentEventCountry={exhibition.country}
                currentEventCategories={(exhibition.categories as string[]) || []}
              />
            </Suspense>
          </div>

          {/* Related Exhibitions */}
          <div className="mt-8">
            <Suspense fallback={null}>
              <RelatedExhibitions
                exhibitionId={exhibition.id}
                country={exhibition.country}
                type={exhibition.type}
                seriesId={(exhibition as any).series_id}
                isAr={isAr}
              />
            </Suspense>
          </div>
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
