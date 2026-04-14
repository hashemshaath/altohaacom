import { useState, useCallback, useMemo, lazy, Suspense } from "react";
import { categoryBadgeText } from "@/lib/categoryUtils";
import { AnimatedCounter as SharedAnimatedCounter } from "@/components/ui/animated-counter";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import {
  Calendar, MapPin, Users, Globe, Trophy, ArrowLeft, CheckCircle,
  Settings, Pencil, Award, BookOpen, ClipboardList, Clock, Share2,
  ImageIcon, Twitter, Facebook, Linkedin, Link2,
  Sparkles, Target, BarChart3, UsersRound, Eye, Flame, Shield, Building2,
  Medal, Info, DoorOpen, Scale, FileSpreadsheet, Radio,
  Swords, Layers, CalendarClock, ChefHat, MessageSquare, ClipboardCheck, MessageCircle, Bookmark, BookmarkCheck,
  Star, TrendingUp, Zap, Hash, Timer, Ticket, Activity, Bell,
} from "lucide-react";
import { countryFlag } from "@/lib/countryFlag";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SEOHead } from "@/components/SEOHead";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { buildPublicUrl } from "@/lib/publicAppUrl";
import { safeJsonLd } from "@/lib/safeJsonLd";
import { format } from "date-fns";
import { RegistrationStatusBanner } from "@/components/competitions/RegistrationStatusBanner";
import { CompetitionTimeline } from "@/components/competitions/CompetitionTimeline";
import { ParticipantStatsCard } from "@/components/competitions/ParticipantStatsCard";
import { OrganizerCard } from "@/components/competitions/OrganizerCard";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { useCompetitionDetailData } from "./competition/useCompetitionDetailData";
import { statusConfig, TabTransition, Section, LiveCountdownStrip } from "./competition/competitionDetailHelpers";
import type { CompetitionStatus } from "./competition/competitionDetailHelpers";

// Lazy-loaded tab panels
const CompetitionStatusManager = lazy(() => import("@/components/competitions/CompetitionStatusManager").then(m => ({ default: m.CompetitionStatusManager })));
const RegistrationForm = lazy(() => import("@/components/competitions/RegistrationDialog").then(m => ({ default: m.RegistrationForm })));
const RegistrationApprovalPanel = lazy(() => import("@/components/competitions/RegistrationApprovalPanel").then(m => ({ default: m.RegistrationApprovalPanel })));
const JudgeAssignmentPanel = lazy(() => import("@/components/competitions/JudgeAssignmentPanel").then(m => ({ default: m.JudgeAssignmentPanel })));
const CompetitionLeaderboard = lazy(() => import("@/components/competitions/CompetitionLeaderboard").then(m => ({ default: m.CompetitionLeaderboard })));
const ParticipantsList = lazy(() => import("@/components/competitions/ParticipantsList").then(m => ({ default: m.ParticipantsList })));
const JudgesList = lazy(() => import("@/components/competitions/JudgesList").then(m => ({ default: m.JudgesList })));
const CompetitionKnowledgeTab = lazy(() => import("@/components/competitions/CompetitionKnowledgeTab").then(m => ({ default: m.CompetitionKnowledgeTab })));
const CompetitionSponsorsPanel = lazy(() => import("@/components/competitions/CompetitionSponsorsPanel").then(m => ({ default: m.CompetitionSponsorsPanel })));
const AutoIssueCertificates = lazy(() => import("@/components/competitions/AutoIssueCertificates").then(m => ({ default: m.AutoIssueCertificates })));
const OrderCenterHub = lazy(() => import("@/components/competitions/order-center/OrderCenterHub").then(m => ({ default: m.OrderCenterHub })));
const CategoryManagementPanel = lazy(() => import("@/components/competitions/CategoryManagementPanel").then(m => ({ default: m.CategoryManagementPanel })));
const CompetitionTeamPanel = lazy(() => import("@/components/competitions/CompetitionTeamPanel").then(m => ({ default: m.CompetitionTeamPanel })));
const BulkImportPanel = lazy(() => import("@/components/admin/BulkImportPanel").then(m => ({ default: m.BulkImportPanel })));
const ReferenceGalleryPanel = lazy(() => import("@/components/competitions/ReferenceGalleryPanel").then(m => ({ default: m.ReferenceGalleryPanel })));
const RubricTemplatesPanel = lazy(() => import("@/components/competitions/RubricTemplatesPanel").then(m => ({ default: m.RubricTemplatesPanel })));
const CriteriaManagementPanel = lazy(() => import("@/components/competitions/CriteriaManagementPanel").then(m => ({ default: m.CriteriaManagementPanel })));
const CompetitionActivityFeed = lazy(() => import("@/components/competitions/CompetitionActivityFeed").then(m => ({ default: m.CompetitionActivityFeed })));
const QRCodeDisplay = lazy(() => import("@/components/qr/QRCodeDisplay").then(m => ({ default: m.QRCodeDisplay })));
const LiveScoringDashboard = lazy(() => import("@/components/competitions/LiveScoringDashboard").then(m => ({ default: m.LiveScoringDashboard })));
const TournamentRoundsPanel = lazy(() => import("@/components/competitions/TournamentRoundsPanel").then(m => ({ default: m.TournamentRoundsPanel })));
const BlindJudgingPanel = lazy(() => import("@/components/competitions/BlindJudgingPanel").then(m => ({ default: m.BlindJudgingPanel })));
const EventComments = lazy(() => import("@/components/fan/EventComments").then(m => ({ default: m.EventComments })));
const EvaluationStagesPanel = lazy(() => import("@/components/competitions/EvaluationStagesPanel").then(m => ({ default: m.EvaluationStagesPanel })));
const CompetitionSchedulePanel = lazy(() => import("@/components/competitions/CompetitionSchedulePanel").then(m => ({ default: m.CompetitionSchedulePanel })));
const KitchenStationsPanel = lazy(() => import("@/components/competitions/KitchenStationsPanel").then(m => ({ default: m.KitchenStationsPanel })));
const JudgeDeliberationPanel = lazy(() => import("@/components/competitions/JudgeDeliberationPanel").then(m => ({ default: m.JudgeDeliberationPanel })));
const CompetitionFeedbackPanel = lazy(() => import("@/components/competitions/CompetitionFeedbackPanel").then(m => ({ default: m.CompetitionFeedbackPanel })));
const PreparationChecklistPanel = lazy(() => import("@/components/competitions/PreparationChecklistPanel").then(m => ({ default: m.PreparationChecklistPanel })));
const JudgeAnalyticsPanel = lazy(() => import("@/components/competitions/JudgeAnalyticsPanel").then(m => ({ default: m.JudgeAnalyticsPanel })));
const TeamCollaborationPanel = lazy(() => import("@/components/competitions/TeamCollaborationPanel").then(m => ({ default: m.TeamCollaborationPanel })));
const CompetitionAnalyticsDashboard = lazy(() => import("@/components/competitions/CompetitionAnalyticsDashboard").then(m => ({ default: m.CompetitionAnalyticsDashboard })));
const AdvancedSchedulingPanel = lazy(() => import("@/components/competitions/AdvancedSchedulingPanel").then(m => ({ default: m.AdvancedSchedulingPanel })));
const NotificationHub = lazy(() => import("@/components/competitions/NotificationHub").then(m => ({ default: m.NotificationHub })));


export default function CompetitionDetail() {
  const {
    competition, isLoading, competitionId, slug, urlParam,
    isAr, language, t, user, isAdmin,
    qrCode, isWatched, toggleWatchlist,
    categories, criteria, myRegistration, registrationStats, judgesCount,
    competitionTypes, supervisors, accreditors,
    isOrganizer, canSeeKnowledge,
    totalScore, completionPercent,
  } = useCompetitionDetailData();

  const [activeSection, setActiveSection] = useState<string>("overview");
  const setActiveTab = useCallback((tabId: string) => {
    setActiveSection(tabId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);



  // ─── Grouped Navigation ───
  const NAV_GROUPS = useMemo(() => {
    const core = [
      { id: "overview", icon: Eye, labelEn: "Overview", labelAr: "نظرة عامة" },
      { id: "categories", icon: Target, labelEn: "Categories", labelAr: "الفئات" },
      { id: "criteria", icon: BarChart3, labelEn: "Criteria", labelAr: "المعايير" },
      { id: "contestants", icon: Users, labelEn: "Contestants", labelAr: "المتسابقين" },
      { id: "winners", icon: Medal, labelEn: "Winners", labelAr: "الفائزين" },
    ];
    const competitionTabs = [
      { id: "rounds", icon: Swords, labelEn: "Rounds", labelAr: "الجولات" },
      { id: "stages", icon: Layers, labelEn: "Eval Stages", labelAr: "مراحل التقييم" },
      { id: "judges", icon: Scale, labelEn: "Judging Panel", labelAr: "لجنة التحكيم" },
      { id: "live-scoring", icon: Radio, labelEn: "Live Scores", labelAr: "النتائج المباشرة" },
      { id: "schedule", icon: CalendarClock, labelEn: "Schedule", labelAr: "الجدول" },
      { id: "stations", icon: ChefHat, labelEn: "Stations", labelAr: "المحطات" },
    ];
    const community = [
      { id: "gallery", icon: ImageIcon, labelEn: "Gallery", labelAr: "المعرض" },
      { id: "feedback", icon: MessageCircle, labelEn: "Feedback", labelAr: "الملاحظات" },
      { id: "checklist", icon: ClipboardCheck, labelEn: "Prep List", labelAr: "قائمة التحضير" },
      { id: "team", icon: UsersRound, labelEn: "Team", labelAr: "الفريق" },
      { id: "collaboration", icon: ClipboardList, labelEn: "Collaboration", labelAr: "التعاون" },
    ];
    const insights: typeof core = [];
    if (canSeeKnowledge) {
      insights.push(
        { id: "knowledge", icon: BookOpen, labelEn: "Knowledge", labelAr: "المعرفة" },
        { id: "deliberation", icon: MessageSquare, labelEn: "Deliberation", labelAr: "المداولات" },
        { id: "judge-analytics", icon: BarChart3, labelEn: "Judge Analytics", labelAr: "تحليل الحكام" },
      );
    }
    if (isOrganizer) {
      insights.push(
        { id: "analytics", icon: TrendingUp, labelEn: "Analytics", labelAr: "التحليلات" },
        { id: "adv-schedule", icon: CalendarClock, labelEn: "Adv. Schedule", labelAr: "جدول متقدم" },
        { id: "notifications", icon: Bell, labelEn: "Notifications", labelAr: "الإشعارات" },
      );
    }
    if (user) {
      insights.push({ id: "requirements", icon: ClipboardList, labelEn: "Order Center", labelAr: "مركز الطلبات" });
    }
    if (isOrganizer) {
      insights.push({ id: "manage", icon: Settings, labelEn: "Manage", labelAr: "إدارة" });
    }

    const groups = [
      { labelEn: "Core", labelAr: "أساسي", tabs: core },
      { labelEn: "Competition", labelAr: "المسابقة", tabs: competitionTabs },
      { labelEn: "Community", labelAr: "المجتمع", tabs: community },
    ];
    if (insights.length > 0) {
      groups.push({ labelEn: "Insights", labelAr: "تحليلات", tabs: insights });
    }
    return groups;
  }, [canSeeKnowledge, isOrganizer, user]);

  // ─── Loading State ───
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1">
          <div className="relative">
            <Skeleton className="h-56 w-full sm:h-80 md:h-96" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </div>
          <div className="border-b border-border/40 px-3 sm:px-4 py-3">
            <div className="container flex gap-2 overflow-hidden">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-24 rounded-full shrink-0" />
              ))}
            </div>
          </div>
          <div className="container py-6 md:py-8">
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-5">
                <Skeleton className="h-44 w-full rounded-2xl" />
                <Skeleton className="h-60 w-full rounded-2xl" />
                <Skeleton className="h-40 w-full rounded-2xl" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-36 w-full rounded-2xl" />
                <Skeleton className="h-48 w-full rounded-2xl" />
                <Skeleton className="h-32 w-full rounded-2xl" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="container flex-1 py-16 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
            <Trophy className="h-10 w-10 text-muted-foreground/20" />
          </div>
          <p className="font-semibold text-lg">{isAr ? "المسابقة غير موجودة" : "Competition not found"}</p>
          <Button asChild variant="outline" size="sm" className="mt-4 rounded-xl">
            <Link to="/competitions"><ArrowLeft className="me-1.5 h-4 w-4" />{isAr ? "العودة" : "Back"}</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const baseTitle = isAr && competition.title_ar ? competition.title_ar : competition.title;
  const title = competition.edition_year ? `${baseTitle} ${competition.edition_year}` : baseTitle;
  const description = isAr && competition.description_ar ? competition.description_ar : competition.description;
  const venue = isAr && competition.venue_ar ? competition.venue_ar : competition.venue;
  const canRegister = competition.status === "registration_open" && user && !myRegistration;
  const hasWinners = competition.status === "completed";

  // SEO: Build optimized meta
  const competitionSlug = competition.slug || competitionId;
  const canonicalPath = `/competitions/${competitionSlug}`;
  const canonicalUrl = buildPublicUrl(canonicalPath);

  const seoTitle = isAr
    ? `${title} | مسابقة طهي احترافية — الطهاة`
    : `${title} | Professional Culinary Competition — AlToha`;

  const locationMeta = [competition.city, competition.country].filter(Boolean).join(", ");
  const dateMeta = competition.competition_start ? format(new Date(competition.competition_start), "MMM yyyy") : "";
  const seoDescription = description
    ? description.slice(0, 145) + (description.length > 145 ? "…" : "")
    : isAr
      ? `مسابقة ${title} للطهي${locationMeta ? ` في ${locationMeta}` : ""}${dateMeta ? ` — ${dateMeta}` : ""}. سجّل الآن وشارك مع أفضل الطهاة.`
      : `${title} culinary competition${locationMeta ? ` in ${locationMeta}` : ""}${dateMeta ? ` — ${dateMeta}` : ""}. Register now and compete with top chefs.`;

  const seoKeywords = [
    title,
    baseTitle,
    "culinary competition",
    "مسابقة طهي",
    competition.city,
    competition.country,
    "chef competition",
    competition.edition_year ? `${competition.edition_year}` : "",
    competition.is_virtual ? "virtual competition" : "live competition",
  ].filter(Boolean).join(", ");

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": isAr ? "الرئيسية" : "Home", "item": buildPublicUrl("/") },
      { "@type": "ListItem", "position": 2, "name": isAr ? "المسابقات" : "Competitions", "item": buildPublicUrl("/competitions") },
      { "@type": "ListItem", "position": 3, "name": title },
    ],
  };

  const eventLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: title,
    description: seoDescription,
    startDate: competition.competition_start,
    endDate: competition.competition_end,
    url: canonicalUrl,
    eventAttendanceMode: competition.is_virtual
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: competition.status === "cancelled"
      ? "https://schema.org/EventCancelled"
      : "https://schema.org/EventScheduled",
    location: competition.is_virtual
      ? { "@type": "VirtualLocation" }
      : { "@type": "Place", name: venue || undefined, address: { "@type": "PostalAddress", addressLocality: competition.city, addressCountry: competition.country } },
    image: competition.cover_image_url || undefined,
    organizer: { "@type": "Organization", name: "Altoha", url: buildPublicUrl("/") },
    ...(competition.max_participants ? { maximumAttendeeCapacity: competition.max_participants } : {}),
  };

  const breadcrumbItems = [
    { label: "Home", labelAr: "الرئيسية", href: "/" },
    { label: "Competitions", labelAr: "المسابقات", href: "/competitions" },
    { label: title },
  ];

  const daysUntilStart = competition.competition_start
    ? Math.max(0, Math.ceil((new Date(competition.competition_start).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const kpiStats = [
    { icon: Target, label: isAr ? "الفئات" : "Categories", value: categories?.length || 0, color: "text-primary", onClick: () => setActiveTab("categories") },
    { icon: Star, label: isAr ? "المعايير" : "Criteria", value: criteria?.length || 0, color: "text-chart-4", onClick: () => setActiveTab("criteria") },
    { icon: Users, label: isAr ? "المسجلين" : "Registered", value: registrationStats?.total || 0, color: "text-chart-3", onClick: () => setActiveTab("contestants") },
    { icon: Scale, label: isAr ? "الحكام" : "Judges", value: judgesCount || 0, color: "text-chart-5", onClick: () => setActiveTab("judges") },
    ...(totalScore > 0 ? [{ icon: Zap, label: isAr ? "مجموع النقاط" : "Total Score", value: totalScore, color: "text-chart-2", onClick: () => setActiveTab("criteria") }] : []),
  ];

  const statusCfg = statusConfig[competition.status as CompetitionStatus] || statusConfig.pending;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        ogImage={competition.cover_image_url || undefined}
        ogType="article"
        canonical={canonicalUrl}
        lang={language}
        keywords={seoKeywords}
        jsonLd={eventLd}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }} />
      <Header />

      <main className="flex-1">
        {/* ─── Hero ─── */}
        <section className="relative overflow-hidden" aria-label={isAr ? "صورة المسابقة" : "Competition hero"}>
          <div className="relative h-52 sm:h-64 md:h-72 lg:h-80">
            {competition.cover_image_url ? (
              <img
                loading="eager"
                src={competition.cover_image_url}
                alt={`${title}${locationMeta ? ` — ${locationMeta}` : ""}`}
                className="h-full w-full object-cover"
                decoding="async"
                fetchPriority="high"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-muted/20 to-background">
                <Trophy className="h-20 w-20 text-primary/[0.06]" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
          </div>

          {/* Hero content */}
          <div className="absolute inset-x-0 bottom-0">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 pb-6 sm:pb-8">
              <Breadcrumbs items={breadcrumbItems} className="text-foreground/50 mb-3" />

              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge className={`${statusCfg.bg} px-2.5 py-0.5 font-bold uppercase tracking-wider text-[11px]`}>
                  {statusCfg.glow ? (
                    <span className="relative me-1.5 flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
                    </span>
                  ) : (
                    <span className={`me-1.5 inline-block h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                  )}
                  {isAr ? statusCfg.labelAr : statusCfg.label}
                </Badge>
                {competition.edition_year && (
                  <Badge variant="outline" className="bg-muted/50 border-border/50 font-bold text-[11px] px-2 py-0.5">{competition.edition_year}</Badge>
                )}
                {competition.competition_number && (
                  <Badge variant="outline" className="font-mono text-[11px] font-bold bg-muted/50 border-border/50 px-2 py-0.5 uppercase tracking-wider">{competition.competition_number}</Badge>
                )}
                {competition.registration_fee_type === "free" && (
                  <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20 text-[11px] px-2 py-0.5 font-bold">
                    <Ticket className="h-3 w-3 me-1" />{isAr ? "مجاني" : "Free"}
                  </Badge>
                )}
              </div>

              <h1 className="font-serif text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl md:text-4xl lg:text-5xl text-foreground mb-2.5">
                {title}
              </h1>

              <div className="flex items-center gap-4 text-sm sm:text-base text-foreground/70 flex-wrap">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary/70" />
                  <time dateTime={competition.competition_start} className="font-medium">{format(new Date(competition.competition_start), "MMM d")}</time>
                  <span className="text-foreground/40">–</span>
                  <time dateTime={competition.competition_end} className="font-medium">{format(new Date(competition.competition_end), "MMM d, yyyy")}</time>
                </span>
                {competition.is_virtual ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-primary/70" />
                    <span className="font-medium">{isAr ? "افتراضية" : "Virtual"}</span>
                  </span>
                ) : (venue || competition.city) && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary/70" />
                    <span className="font-medium">{competition.country_code ? `${countryFlag(competition.country_code)} ` : ""}{venue || competition.city}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Action Bar ─── */}
        <div className="border-y border-border/30 bg-card/80 backdrop-blur-md">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto scrollbar-none pe-4">
                {kpiStats.map((stat, i) => (
                  <button key={i} onClick={stat.onClick} className="flex items-center gap-2 shrink-0 hover:scale-105 transition-transform duration-200 active:scale-95 touch-manipulation min-w-0 py-1">
                    <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color} opacity-70 shrink-0`} />
                    <div className="text-start min-w-0">
                      <p className="text-lg sm:text-xl font-extrabold text-foreground tabular-nums leading-none"><SharedAnimatedCounter value={stat.value} duration={800} /></p>
                      <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground/70 mt-0.5 whitespace-nowrap">{stat.label}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 rounded-xl px-3 text-xs font-semibold border-border/40" onClick={async (e) => {
                      if (navigator.share) {
                        e.preventDefault();
                        try { await navigator.share({ title, text: description || title, url: window.location.href }); } catch {}
                      }
                    }}>
                      <Share2 className="me-1.5 h-3.5 w-3.5" />{isAr ? "مشاركة" : "Share"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl p-1">
                    <DropdownMenuItem className="cursor-pointer gap-2 rounded-lg py-2 text-xs" onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(window.location.href)}`, "_blank", "noopener,noreferrer,width=600,height=400")}><Twitter className="h-3.5 w-3.5" /> Twitter / X</DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer gap-2 rounded-lg py-2 text-xs" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, "_blank", "noopener,noreferrer,width=600,height=400")}><Facebook className="h-3.5 w-3.5" /> Facebook</DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer gap-2 rounded-lg py-2 text-xs" onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, "_blank", "noopener,noreferrer,width=600,height=400")}><Linkedin className="h-3.5 w-3.5" /> LinkedIn</DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer gap-2 rounded-lg py-2 text-xs" onClick={() => { navigator.clipboard.writeText(window.location.href).then(null, () => {}); toast({ title: isAr ? "تم نسخ الرابط!" : "Link copied!" }); }}><Link2 className="h-3.5 w-3.5" /> {isAr ? "نسخ الرابط" : "Copy Link"}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {user && (
                  <Button variant={isWatched ? "default" : "outline"} size="sm" className={`h-9 rounded-xl px-3 text-xs font-semibold ${isWatched ? "shadow-sm" : "border-border/40"}`} onClick={toggleWatchlist}>
                    {isWatched ? <BookmarkCheck className="me-1.5 h-3.5 w-3.5" /> : <Bookmark className="me-1.5 h-3.5 w-3.5" />}
                    {isWatched ? (isAr ? "محفوظ" : "Saved") : (isAr ? "حفظ" : "Save")}
                  </Button>
                )}
                {competition.status === "completed" && (
                  <Button asChild size="sm" className="h-9 rounded-xl px-4 text-xs font-bold bg-gradient-to-r from-chart-5 to-chart-4 text-white shadow-sm">
                    <Link to={`/competitions/${competition.slug || competitionId}/results`}><Award className="me-1.5 h-3.5 w-3.5" />{isAr ? "النتائج" : "Results"}</Link>
                  </Button>
                )}
                {isOrganizer && (
                  <Button asChild variant="outline" size="sm" className="h-9 rounded-xl px-3 text-xs font-semibold border-border/40">
                    <Link to={`/competitions/${competition.slug || competitionId}/edit`}><Pencil className="me-1.5 h-3.5 w-3.5" />{isAr ? "تعديل" : "Edit"}</Link>
                  </Button>
                )}
                {canRegister && !showRegistrationForm && (
                  <Button className="h-9 rounded-xl px-5 text-xs font-bold shadow-md shadow-primary/20" onClick={() => setShowRegistrationForm(true)}>
                    <Sparkles className="me-1.5 h-3.5 w-3.5" />{t("registerNow")}
                  </Button>
                )}
              </div>
            </div>
            {["in_progress", "judging"].includes(competition.status) && completionPercent > 0 && (
              <div className="mt-3 pt-3 border-t border-border/20">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
                  <span className="font-bold uppercase tracking-wider">{isAr ? "تقدم المسابقة" : "Progress"}</span>
                  <span className="font-extrabold text-primary text-xs">{completionPercent}%</span>
                </div>
                <div className="relative h-1.5 overflow-hidden rounded-full bg-muted/30">
                  <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-chart-3 transition-all duration-1000" style={{ width: `${completionPercent}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Navigation Tabs ─── */}
        <div className="sticky top-14 z-30 border-b border-border/20 bg-background/95 backdrop-blur-xl">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <ScrollArea className="w-full">
              <div className="flex items-center gap-0.5 min-w-max py-1.5">
                {NAV_GROUPS.map((group, gi) => (
                  <div key={group.labelEn} className={`flex items-center ${gi > 0 ? "border-s border-border/15 ms-1 ps-2" : ""}`}>
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-muted-foreground/30 px-1.5 hidden sm:block">
                      {isAr ? group.labelAr : group.labelEn}
                    </span>
                    {group.tabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeSection === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => { try { if ("vibrate" in navigator) navigator.vibrate(8); } catch {} setActiveTab(tab.id); }}
                          className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-all duration-200 active:scale-[0.97] touch-manipulation select-none ${isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
                        >
                          <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "" : "opacity-40"}`} />
                          <span className="whitespace-nowrap">{isAr ? tab.labelAr : tab.labelEn}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="h-1" />
            </ScrollArea>
          </div>
        </div>

        {/* ─── Registration Form ─── */}
        {showRegistrationForm && (
          <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6">
            <Suspense fallback={<div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
              <RegistrationForm
                competitionId={competition.id}
                competitionTitle={title}
                categories={categories || []}
                onCancel={() => setShowRegistrationForm(false)}
                onSuccess={() => setShowRegistrationForm(false)}
              />
            </Suspense>
          </div>
        )}

        {/* ─── Main Content ─── */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-10">
          {/* Registration Banners */}
          {canRegister && !showRegistrationForm && (
            <div className="mb-6 rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/[0.03] to-transparent p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{isAr ? "التسجيل مفتوح الآن!" : "Registration is open!"}</p>
                    <p className="text-xs text-muted-foreground">{isAr ? "سجّل الآن لتأمين مكانك" : "Secure your spot today"}</p>
                  </div>
                </div>
                <Button onClick={() => setShowRegistrationForm(true)} size="sm" className="rounded-xl h-9 px-5 font-bold shadow-sm">
                  {t("registerNow")}
                </Button>
              </div>
            </div>
          )}
          {myRegistration && (
            <div className="mb-6">
              <RegistrationStatusBanner registration={myRegistration} competitionStatus={competition.status} />
            </div>
          )}

          {/* Two-column grid */}
          <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
            {/* ─── Main Column ─── */}
            <div className="min-w-0 space-y-6">
              <TabTransition activeKey={activeSection}>
                {activeSection === "overview" && (
                  <div className="space-y-6">
                    {/* Description */}
                    {description && (
                      <Section icon={<BookOpen className="h-4 w-4" />} title={isAr ? "نبذة عن المسابقة" : "About"}>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{description}</p>
                      </Section>
                    )}

                    {/* Overview Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div className="rounded-2xl border border-border/30 bg-card p-5">
                        <div className="flex items-center gap-2.5 mb-4">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chart-3/10"><Users className="h-4 w-4 text-chart-3" /></div>
                          <span className="text-xs font-bold text-muted-foreground">{isAr ? "التسجيل" : "Registration"}</span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold tabular-nums leading-none">{registrationStats?.approved || 0}</p>
                        <p className="text-xs text-muted-foreground mt-1.5">{isAr ? "مقبول" : "Approved"}</p>
                        {competition.max_participants && (
                          <div className="mt-4">
                            <Progress value={((registrationStats?.approved || 0) / competition.max_participants) * 100} className="h-1.5" />
                            <p className="text-[10px] text-muted-foreground mt-1.5">{registrationStats?.approved || 0}/{competition.max_participants}</p>
                          </div>
                        )}
                      </div>

                      <div className="rounded-2xl border border-border/30 bg-card p-5">
                        <div className="flex items-center gap-2.5 mb-4">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chart-4/10"><Scale className="h-4 w-4 text-chart-4" /></div>
                          <span className="text-xs font-bold text-muted-foreground">{isAr ? "التحكيم" : "Judging"}</span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold tabular-nums leading-none">{judgesCount || 0}</p>
                        <p className="text-xs text-muted-foreground mt-1.5">{isAr ? "الحكام" : "Judges"}</p>
                        {criteria && criteria.length > 0 && (
                          <p className="text-[11px] text-muted-foreground mt-4">{criteria.length} {isAr ? "معايير" : "criteria"} · {totalScore} {isAr ? "نقطة" : "pts"}</p>
                        )}
                      </div>

                      <div className="rounded-2xl border border-border/30 bg-card p-5">
                        <div className="flex items-center gap-2.5 mb-4">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><Activity className="h-4 w-4 text-primary" /></div>
                          <span className="text-xs font-bold text-muted-foreground">{isAr ? "الحالة" : "Status"}</span>
                        </div>
                        <p className="text-sm font-bold">{isAr ? statusCfg.labelAr : statusCfg.label}</p>
                        <p className="text-xs text-muted-foreground mt-1.5">{categories?.length || 0} {isAr ? "فئات" : "categories"}</p>
                        <p className="text-[11px] text-muted-foreground mt-4">{criteria?.length || 0} {isAr ? "المعايير" : "criteria"}</p>
                      </div>
                    </div>

                    {/* Entry Types & Fee */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-border/30 bg-card p-5">
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10"><UsersRound className="h-4 w-4 text-accent-foreground" /></div>
                          <h4 className="font-bold text-sm">{isAr ? "أنواع المشاركة" : "Entry Types"}</h4>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {competition.allowed_entry_types?.map((t: string) => (
                            <Badge key={t} variant="outline" className="rounded-lg text-xs px-2.5 py-1 font-medium">{t}</Badge>
                          )) || <span className="text-sm text-muted-foreground">{isAr ? "فردي" : "Individual"}</span>}
                        </div>
                        {(competition.min_team_size || competition.max_team_size) && (
                          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 opacity-40" />
                            {isAr ? "حجم الفريق:" : "Team:"} {competition.min_team_size || 1}–{competition.max_team_size || "∞"}
                          </p>
                        )}
                      </div>

                      <div className="rounded-2xl border border-border/30 bg-card p-5">
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chart-5/10"><Ticket className="h-4 w-4 text-chart-5" /></div>
                          <h4 className="font-bold text-sm">{isAr ? "رسوم التسجيل" : "Registration Fee"}</h4>
                        </div>
                        {competition.registration_fee_type === "paid" ? (
                          <div className="mt-2">
                            <p className="text-2xl font-extrabold tabular-nums">{competition.registration_fee} <span className="text-sm font-medium text-muted-foreground">{competition.registration_currency}</span></p>
                            {competition.registration_tax_rate && (
                              <p className="text-xs text-muted-foreground mt-1.5">
                                + {(Number(competition.registration_tax_rate) * 100).toFixed(0)}% {isAr && competition.registration_tax_name_ar ? competition.registration_tax_name_ar : competition.registration_tax_name || "Tax"}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xl font-extrabold text-chart-5 mt-2">🎉 {isAr ? "مجاني" : "Free"}</p>
                        )}
                      </div>
                    </div>

                    {/* Competition Specialty */}
                    {competitionTypes && competitionTypes.length > 0 && (
                      <Section icon={<Flame className="h-4 w-4" />} title={isAr ? "تخصص المسابقة" : "Specialty"} badge={<Badge variant="secondary" className="text-[11px]">{competitionTypes.length}</Badge>}>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {competitionTypes.map((type) => (
                            <div key={type.id} className="group overflow-hidden rounded-xl border border-border/30 bg-muted/10 hover:bg-muted/30 transition-all duration-200">
                              {type.cover_image_url ? (
                                <div className="relative h-28">
                                  <img src={type.cover_image_url} alt={type.name} className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300" loading="lazy" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                                  <div className="absolute bottom-0 inset-x-0 p-3">
                                    <p className="text-sm font-bold">{isAr && type.name_ar ? type.name_ar : type.name}</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3 p-4">
                                  <div className="h-10 w-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                                    <Flame className="h-4 w-4 text-primary/50" />
                                  </div>
                                  <p className="text-sm font-bold">{isAr && type.name_ar ? type.name_ar : type.name}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </Section>
                    )}

                    {/* Supervising Bodies */}
                    {supervisors.length > 0 && (
                      <Section icon={<Building2 className="h-4 w-4" />} title={isAr ? "الجهات المشرفة" : "Supervising Bodies"} badge={<Badge variant="secondary" className="text-[11px]">{supervisors.length}</Badge>}>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {supervisors.map((entity) => (
                            <div key={entity.id} className="flex items-center gap-3 rounded-xl border border-border/30 bg-muted/10 p-4 hover:bg-muted/30 transition-colors">
                              {entity.logo_url ? (
                                <img src={entity.logo_url} alt={entity.name} className="h-10 w-10 rounded-xl object-contain bg-background border border-border/20 p-1 shrink-0" loading="lazy" />
                              ) : (
                                <div className="h-10 w-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 text-lg font-bold text-primary/40">{entity.abbreviation?.[0] || entity.name[0]}</div>
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-bold truncate">{isAr && entity.name_ar ? entity.name_ar : entity.name}</p>
                                {entity.abbreviation && <p className="text-[11px] text-muted-foreground">{entity.abbreviation}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </Section>
                    )}

                    {/* Accreditors */}
                    {accreditors.length > 0 && (
                      <Section icon={<Award className="h-4 w-4" />} title={isAr ? "جهات الاعتماد" : "Accreditation"} badge={<Badge variant="secondary" className="text-[11px]">{accreditors.length}</Badge>}>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {accreditors.map((entity) => (
                            <div key={entity.id} className="flex items-center gap-3 rounded-xl border border-border/30 bg-muted/10 p-4 hover:bg-muted/30 transition-colors">
                              {entity.logo_url ? (
                                <img src={entity.logo_url} alt={entity.name} className="h-10 w-10 rounded-xl object-contain bg-background border border-border/20 p-1 shrink-0" loading="lazy" />
                              ) : (
                                <div className="h-10 w-10 rounded-xl bg-chart-5/10 flex items-center justify-center shrink-0 text-lg font-bold text-chart-5/40">{entity.abbreviation?.[0] || entity.name[0]}</div>
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-bold truncate">{isAr && entity.name_ar ? entity.name_ar : entity.name}</p>
                                <Badge variant="outline" className="mt-1 text-[10px] h-5 px-1.5 rounded">{isAr ? "اعتماد" : "Accreditor"}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Section>
                    )}

                    {/* Judges Preview */}
                    <Suspense fallback={null}>
                      <JudgesList competitionId={competition.id} isOrganizer={!!isOrganizer} />
                    </Suspense>

                    {/* Timeline */}
                    <CompetitionTimeline
                      registrationStart={competition.registration_start}
                      registrationEnd={competition.registration_end}
                      competitionStart={competition.competition_start}
                      competitionEnd={competition.competition_end}
                    />

                    {/* Venue */}
                    {!competition.is_virtual && (venue || competition.city) && (
                      <Section icon={<DoorOpen className="h-4 w-4" />} title={isAr ? "الموقع والدخول" : "Venue & Entry"}>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/8 shrink-0 mt-0.5"><MapPin className="h-4 w-4 text-primary" /></div>
                            <div>
                              <p className="text-sm font-semibold">{venue}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{competition.city}, {competition.country}</p>
                            </div>
                          </div>
                          {competition.competition_start && (
                            <div className="flex items-start gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/8 shrink-0 mt-0.5"><Clock className="h-4 w-4 text-primary" /></div>
                              <div>
                                <p className="text-sm font-semibold">{isAr ? "وقت الدخول" : "Entry Time"}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(competition.competition_start), "h:mm a")}</p>
                              </div>
                            </div>
                          )}
                          <div className="rounded-xl bg-muted/20 border border-border/20 p-4">
                            <div className="flex items-center gap-2 mb-2.5">
                              <Info className="h-3.5 w-3.5 text-primary" />
                              <p className="text-xs font-semibold">{isAr ? "تعليمات" : "Instructions"}</p>
                            </div>
                            <ul className="text-xs text-muted-foreground space-y-2 list-none">
                              {[
                                isAr ? "الحضور قبل 30 دقيقة" : "Arrive 30 minutes early",
                                isAr ? "إحضار بطاقة الهوية" : "Bring your ID",
                                isAr ? "الالتزام بالزي المطلوب" : "Wear required uniform",
                                isAr ? "الأدوات الشخصية وفق القواعد" : "Personal tools per rules",
                              ].map((text, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="mt-1.5 h-1 w-1 rounded-full bg-primary/30 shrink-0" />
                                  {text}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </Section>
                    )}

                    {/* Rules */}
                    {(competition.rules_summary || competition.rules_summary_ar) && (
                      <Section icon={<BookOpen className="h-4 w-4" />} title={isAr ? "القواعد والشروط" : "Rules"} defaultOpen={false}>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                          {isAr && competition.rules_summary_ar ? competition.rules_summary_ar : competition.rules_summary}
                        </p>
                      </Section>
                    )}

                    {/* Scoring */}
                    {(competition.scoring_notes || competition.scoring_notes_ar) && (
                      <Section icon={<BarChart3 className="h-4 w-4" />} title={isAr ? "منهجية التقييم" : "Scoring"} defaultOpen={false}>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed text-muted-foreground mb-4">
                          {isAr && competition.scoring_notes_ar ? competition.scoring_notes_ar : competition.scoring_notes}
                        </p>
                        {criteria && criteria.length > 0 && (
                          <div className="space-y-2.5">
                            {criteria.map((crit) => (
                              <div key={crit.id} className="flex items-center gap-3 rounded-xl bg-muted/20 border border-border/20 px-4 py-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary shrink-0">
                                  {(Number(crit.weight) * 100).toFixed(0)}%
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold">{isAr && crit.name_ar ? crit.name_ar : crit.name}</p>
                                  <p className="text-xs text-muted-foreground truncate mt-0.5">{isAr && crit.description_ar ? crit.description_ar : crit.description}</p>
                                </div>
                                <Badge variant="outline" className="shrink-0 text-xs rounded-lg">{isAr ? "الأقصى" : "Max"}: {crit.max_score}</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </Section>
                    )}

                    {/* Categories */}
                    {categories && categories.length > 0 && (
                      <Section icon={<Target className="h-4 w-4" />} title={isAr ? "الفئات" : "Categories"} badge={<Badge variant="secondary" className="text-[11px]">{categories.length}</Badge>}>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {categories.slice(0, 6).map((cat) => (
                            <div key={cat.id} className="group overflow-hidden rounded-xl border border-border/30 bg-muted/10 hover:bg-muted/30 transition-all duration-200 cursor-pointer" onClick={() => setActiveTab("categories")}>
                              {cat.cover_image_url ? (
                                <div className="relative h-24">
                                  <img src={cat.cover_image_url} alt={cat.name} className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300" loading="lazy" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                                  <div className="absolute bottom-0 inset-x-0 p-3">
                                    <p className="text-sm font-bold">{isAr && cat.name_ar ? cat.name_ar : cat.name}</p>
                                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                                      {cat.max_participants && <span><Users className="inline h-2.5 w-2.5 me-0.5" />{cat.max_participants}</span>}
                                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-background/60 rounded">{categoryBadgeText(cat.gender, cat.participant_level, isAr)}</Badge>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3 p-4">
                                  <div className="h-10 w-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                                    <Trophy className="h-4 w-4 text-primary/40" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold">{isAr && cat.name_ar ? cat.name_ar : cat.name}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 rounded">{categoryBadgeText(cat.gender, cat.participant_level, isAr)}</Badge>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {categories.length > 6 && (
                          <Button variant="ghost" size="sm" className="mt-4 w-full rounded-xl text-xs" onClick={() => setActiveTab("categories")}>
                            {isAr ? `عرض الكل (${categories.length})` : `View All (${categories.length})`}
                            <span className="ms-1 text-xs">→</span>
                          </Button>
                        )}
                      </Section>
                    )}
                  </div>
                )}

                <Suspense fallback={<div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
                {activeSection === "categories" && <CategoryManagementPanel competitionId={competition.id} isOrganizer={isOrganizer} />}
                {activeSection === "criteria" && <CriteriaManagementPanel competitionId={competition.id} isOrganizer={isOrganizer} />}
                {activeSection === "rubrics" && <RubricTemplatesPanel competitionId={competition.id} />}
                {activeSection === "contestants" && <ParticipantsList competitionId={competition.id} isOrganizer={isOrganizer} />}
                {activeSection === "rounds" && <TournamentRoundsPanel competitionId={competition.id} isOrganizer={!!isOrganizer} />}
                {activeSection === "stages" && <EvaluationStagesPanel competitionId={competition.id} isOrganizer={!!isOrganizer} />}
                {activeSection === "judges" && <JudgesList competitionId={competition.id} isOrganizer={!!isOrganizer} />}
                {activeSection === "live-scoring" && <LiveScoringDashboard competitionId={competition.id} isOrganizer={!!isOrganizer} />}
                {activeSection === "schedule" && <CompetitionSchedulePanel competitionId={competition.id} isOrganizer={!!isOrganizer} />}
                {activeSection === "stations" && <KitchenStationsPanel competitionId={competition.id} isOrganizer={!!isOrganizer} />}
                {activeSection === "deliberation" && canSeeKnowledge && <JudgeDeliberationPanel competitionId={competition.id} />}
                {activeSection === "feedback" && <CompetitionFeedbackPanel competitionId={competition.id} />}
                {activeSection === "checklist" && <PreparationChecklistPanel competitionId={competition.id} />}
                {activeSection === "sponsors" && <CompetitionSponsorsPanel competitionId={competition.id} isOrganizer={isOrganizer} />}
                {activeSection === "winners" && (
                  hasWinners ? (
                    <CompetitionLeaderboard competitionId={competition.id} />
                  ) : (
                    <div className="py-12 text-center">
                      <Medal className="h-12 w-12 mx-auto text-muted-foreground/20 mb-3" />
                      <p className="text-sm font-semibold text-muted-foreground">
                        {isAr ? "لم يتم الإعلان عن الفائزين بعد" : "Winners haven't been announced yet"}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {isAr ? "سيتم الإعلان بعد انتهاء التحكيم" : "Results will be announced after judging"}
                      </p>
                    </div>
                  )
                )}
                {activeSection === "team" && <CompetitionTeamPanel competitionId={competition.id} isOrganizer={isOrganizer} />}
                {activeSection === "collaboration" && <TeamCollaborationPanel competitionId={competition.id} isOrganizer={!!isOrganizer} />}
                {activeSection === "judge-analytics" && canSeeKnowledge && <JudgeAnalyticsPanel competitionId={competition.id} isOrganizer={!!isOrganizer} />}
                {activeSection === "knowledge" && canSeeKnowledge && <CompetitionKnowledgeTab competitionId={competition.id} isOrganizer={isOrganizer} />}
                {activeSection === "gallery" && <ReferenceGalleryPanel competitionId={competition.id} isAdmin={isOrganizer} />}
                {activeSection === "analytics" && isOrganizer && <CompetitionAnalyticsDashboard competitionId={competition.id} language={language} />}
                {activeSection === "adv-schedule" && isOrganizer && <AdvancedSchedulingPanel competitionId={competition.id} language={language} isOrganizer={true} />}
                {activeSection === "notifications" && isOrganizer && <NotificationHub competitionId={competition.id} language={language} isOrganizer={true} />}
                {activeSection === "requirements" && user && <OrderCenterHub competitionId={competition.id} isOrganizer={!!isOrganizer} />}
                {isOrganizer && activeSection === "manage" && (
                  <div className="space-y-6">
                    <CompetitionStatusManager competitionId={competition.id} currentStatus={competition.status} competitionTitle={title} />
                    <BlindJudgingPanel competitionId={competition.id} isOrganizer={true} blindJudgingEnabled={competition.blind_judging_enabled} blindCodePrefix={competition.blind_code_prefix || "ENTRY"} />
                    <JudgeAssignmentPanel competitionId={competition.id} />
                    <RegistrationApprovalPanel competitionId={competition.id} />
                    {competition.status === "completed" && <AutoIssueCertificates competitionId={competition.id} />}
                    <Section icon={<FileSpreadsheet className="h-4 w-4" />} title={isAr ? "استيراد جماعي" : "Bulk Import"} defaultOpen={false}>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {(["participant", "judge", "winner", "volunteer", "sponsor"] as const).map(type => (
                          <BulkImportPanel key={type} entityType={type} competitionNumber={competition.competition_number || ""} onImportComplete={() => {}} />
                        ))}
                      </div>
                    </Section>
                  </div>
                )}
                </Suspense>
              </TabTransition>

              {/* Comments */}
              <Suspense fallback={null}>
                <Card className="p-5">
                  <EventComments eventType="competition" eventId={competition.id} />
                </Card>
              </Suspense>
            </div>

            {/* ─── Sidebar ─── */}
            <aside className="space-y-5 lg:sticky lg:top-[110px] lg:self-start">
              {/* Countdowns */}
              {competition.status === "registration_open" && competition.registration_end && (
                <LiveCountdownStrip targetDate={competition.registration_end} label="Registration Closes In" labelAr="ينتهي التسجيل خلال" isAr={isAr} />
              )}
              {["upcoming", "registration_open", "registration_closed"].includes(competition.status) && competition.competition_start && (
                <LiveCountdownStrip targetDate={competition.competition_start} label="Competition Starts In" labelAr="تبدأ المسابقة خلال" isAr={isAr} />
              )}

              {/* Registration Card */}
              <div className="rounded-2xl border border-border/30 bg-card overflow-hidden">
                <div className="border-b border-border/15 bg-primary/[0.04] px-4 py-3">
                  <h3 className="flex items-center gap-2 font-bold text-sm">
                    <Trophy className="h-4 w-4 text-primary" />
                    {isAr ? "التسجيل" : "Registration"}
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  {myRegistration ? (
                    <div className="flex items-center gap-2 rounded-lg bg-primary/8 p-3">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-xs font-semibold text-primary">
                        {myRegistration.status === "approved" ? t("alreadyRegistered") : t("registrationPending")}
                      </span>
                    </div>
                  ) : canRegister ? (
                    <Button className="w-full rounded-xl h-9 font-bold text-xs" onClick={() => setShowRegistrationForm(true)} disabled={showRegistrationForm}>
                      {t("registerNow")}
                    </Button>
                  ) : !user ? (
                    <Button asChild className="w-full rounded-xl h-9 text-xs" variant="outline">
                      <Link to="/login">{isAr ? "سجل الدخول" : "Sign in to Register"}</Link>
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-1">{isAr ? "التسجيل مغلق" : "Registration closed"}</p>
                  )}
                  {competition.registration_end && (
                    <p className="text-xs text-center text-muted-foreground">
                      {isAr ? "الموعد النهائي:" : "Deadline:"}{" "}
                      <span className="font-semibold text-foreground">{format(new Date(competition.registration_end), "MMM d, yyyy")}</span>
                    </p>
                  )}
                  {registrationStats && registrationStats.total > 0 && (
                    <div className="border-t border-border/20 pt-3 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{isAr ? "مقبول" : "Approved"}</span>
                        <span className="font-semibold text-chart-5">{registrationStats.approved}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{isAr ? "قيد المراجعة" : "Pending"}</span>
                        <span className="font-semibold text-chart-4">{registrationStats.pending}</span>
                      </div>
                      {competition.max_participants && (
                        <div className="pt-1.5">
                          <Progress value={(registrationStats.approved / competition.max_participants) * 100} className="h-1" />
                          <p className="text-[10px] text-muted-foreground mt-1 text-center">
                            {registrationStats.approved}/{competition.max_participants} {isAr ? "مقاعد" : "spots"}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <ParticipantStatsCard competitionId={competition.id} maxParticipants={competition.max_participants} />

              {/* Quick Info */}
              <div className="rounded-2xl border border-border/30 bg-card overflow-hidden">
                <div className="border-b border-border/15 bg-accent/[0.04] px-4 py-3">
                  <h3 className="flex items-center gap-2 font-bold text-sm">
                    <BookOpen className="h-4 w-4 text-primary" />
                    {isAr ? "معلومات سريعة" : "Quick Info"}
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    competition.country_code && { icon: MapPin, label: isAr ? "الدولة" : "Country", value: `${countryFlag(competition.country_code)} ${competition.country}` },
                    competition.edition_year && { icon: Hash, label: isAr ? "النسخة" : "Edition", value: competition.edition_year },
                    competition.max_participants && { icon: Users, label: isAr ? "السعة" : "Capacity", value: competition.max_participants },
                    competition.is_virtual !== null && { icon: Globe, label: isAr ? "النوع" : "Format", value: competition.is_virtual ? (isAr ? "افتراضية" : "Virtual") : (isAr ? "حضورية" : "In-Person"), badge: true },
                    competition.registration_fee_type === "paid" && { icon: Ticket, label: isAr ? "الرسوم" : "Fee", value: `${competition.registration_fee} ${competition.registration_currency}` },
                    daysUntilStart !== null && daysUntilStart > 0 && { icon: Timer, label: isAr ? "أيام للبدء" : "Days to Start", value: daysUntilStart },
                    competition.blind_judging_enabled && { icon: Shield, label: isAr ? "التحكيم" : "Judging", value: isAr ? "مخفي" : "Blind", badge: true },
                  ].filter(Boolean).map((item: any, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-1">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <item.icon className="h-3.5 w-3.5 opacity-40" />
                        {item.label}
                      </span>
                      {item.badge ? (
                        <Badge variant="outline" className="text-xs rounded-lg font-medium">{item.value}</Badge>
                      ) : (
                        <span className="font-bold text-sm">{item.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* QR */}
              {qrCode && (
                <Suspense fallback={null}>
                  <QRCodeDisplay code={qrCode.code} label={isAr ? "رمز QR" : "QR Code"} size={120} compact={false} />
                </Suspense>
              )}

              <OrganizerCard organizerId={competition.organizer_id} exhibitionId={competition.exhibition_id} />

              <Suspense fallback={null}>
                <CompetitionActivityFeed competitionId={competition.id} isOrganizer={!!isOrganizer} />
              </Suspense>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  );
}