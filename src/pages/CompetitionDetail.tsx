import { useState, useCallback } from "react";
import { useEventWatchlist } from "@/components/fan/FanEventWatchlist";
import { categoryBadgeText } from "@/lib/categoryUtils";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useAdmin";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "@/hooks/use-toast";
import {
  Calendar, MapPin, Users, Globe, Trophy, ArrowLeft, CheckCircle,
  Settings, Pencil, Award, BookOpen, ClipboardList, Clock, Share2,
  ImageIcon, Twitter, Facebook, Linkedin, Link2, ChevronDown,
  Sparkles, Target, BarChart3, UsersRound, Eye, Flame, Shield, Building2,
  Medal, Info, DoorOpen, Scale, FileSpreadsheet, Radio,
  Swords, Layers, CalendarClock, ChefHat, MessageSquare, ClipboardCheck, MessageCircle, Bookmark, BookmarkCheck,
} from "lucide-react";
import { countryFlag } from "@/lib/countryFlag";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SEOHead } from "@/components/SEOHead";
import { format } from "date-fns";
import { CompetitionStatusManager } from "@/components/competitions/CompetitionStatusManager";
import { RegistrationForm } from "@/components/competitions/RegistrationDialog";
import { RegistrationApprovalPanel } from "@/components/competitions/RegistrationApprovalPanel";
import { JudgeAssignmentPanel } from "@/components/competitions/JudgeAssignmentPanel";
import { CompetitionLeaderboard } from "@/components/competitions/CompetitionLeaderboard";
import { ParticipantsList } from "@/components/competitions/ParticipantsList";
import { JudgesList } from "@/components/competitions/JudgesList";
import { CompetitionKnowledgeTab } from "@/components/competitions/CompetitionKnowledgeTab";
import { CompetitionSponsorsPanel } from "@/components/competitions/CompetitionSponsorsPanel";
import { AutoIssueCertificates } from "@/components/competitions/AutoIssueCertificates";
import { OrderCenterHub } from "@/components/competitions/order-center/OrderCenterHub";
import { CategoryManagementPanel } from "@/components/competitions/CategoryManagementPanel";
import { CompetitionTeamPanel } from "@/components/competitions/CompetitionTeamPanel";
import { BulkImportPanel } from "@/components/admin/BulkImportPanel";
import { ReferenceGalleryPanel } from "@/components/competitions/ReferenceGalleryPanel";
import { RubricTemplatesPanel } from "@/components/competitions/RubricTemplatesPanel";
import { CriteriaManagementPanel } from "@/components/competitions/CriteriaManagementPanel";
import { CompetitionCountdown } from "@/components/competitions/CompetitionCountdown";
import { CompetitionTimeline } from "@/components/competitions/CompetitionTimeline";
import { ParticipantStatsCard } from "@/components/competitions/ParticipantStatsCard";
import { OrganizerCard } from "@/components/competitions/OrganizerCard";
import { CompetitionActivityFeed } from "@/components/competitions/CompetitionActivityFeed";
import { deriveCompetitionStatus } from "@/lib/competitionStatus";
import { QRCodeDisplay } from "@/components/qr/QRCodeDisplay";
import { useEntityQRCode } from "@/hooks/useQRCode";
import { LiveScoringDashboard } from "@/components/competitions/LiveScoringDashboard";
import { TournamentRoundsPanel } from "@/components/competitions/TournamentRoundsPanel";
import { BlindJudgingPanel } from "@/components/competitions/BlindJudgingPanel";
import { EventComments } from "@/components/fan/EventComments";
import { EvaluationStagesPanel } from "@/components/competitions/EvaluationStagesPanel";
import { CompetitionSchedulePanel } from "@/components/competitions/CompetitionSchedulePanel";
import { KitchenStationsPanel } from "@/components/competitions/KitchenStationsPanel";
import { JudgeDeliberationPanel } from "@/components/competitions/JudgeDeliberationPanel";
import { CompetitionFeedbackPanel } from "@/components/competitions/CompetitionFeedbackPanel";
import { PreparationChecklistPanel } from "@/components/competitions/PreparationChecklistPanel";
import { RegistrationStatusBanner } from "@/components/competitions/RegistrationStatusBanner";
import { JudgeAnalyticsPanel } from "@/components/competitions/JudgeAnalyticsPanel";
import { TeamCollaborationPanel } from "@/components/competitions/TeamCollaborationPanel";
import { CompetitionAnalyticsDashboard } from "@/components/competitions/CompetitionAnalyticsDashboard";
import { AdvancedSchedulingPanel } from "@/components/competitions/AdvancedSchedulingPanel";
import { NotificationHub } from "@/components/competitions/NotificationHub";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import type { Database } from "@/integrations/supabase/types";

type CompetitionStatus = Database["public"]["Enums"]["competition_status"];

const statusConfig: Record<CompetitionStatus, { bg: string; dot: string; label: string; labelAr: string }> = {
  pending: { bg: "bg-chart-4/10 text-chart-4", dot: "bg-chart-4", label: "Pending Approval", labelAr: "بانتظار الموافقة" },
  draft: { bg: "bg-muted/60", dot: "bg-muted-foreground", label: "Draft", labelAr: "مسودة" },
  upcoming: { bg: "bg-accent/10 text-accent-foreground", dot: "bg-accent", label: "Upcoming", labelAr: "قادمة" },
  registration_open: { bg: "bg-primary/10 text-primary", dot: "bg-primary", label: "Registration Open", labelAr: "التسجيل مفتوح" },
  registration_closed: { bg: "bg-muted/60 text-muted-foreground", dot: "bg-muted-foreground", label: "Registration Closed", labelAr: "التسجيل مغلق" },
  in_progress: { bg: "bg-chart-3/10 text-chart-3", dot: "bg-chart-3", label: "In Progress", labelAr: "جارية" },
  judging: { bg: "bg-chart-4/10 text-chart-4", dot: "bg-chart-4", label: "Judging", labelAr: "التحكيم" },
  completed: { bg: "bg-chart-5/10 text-chart-5", dot: "bg-chart-5", label: "Completed", labelAr: "مكتملة" },
  cancelled: { bg: "bg-destructive/10 text-destructive", dot: "bg-destructive", label: "Cancelled", labelAr: "ملغاة" },
};

/* ─── Section Wrapper — premium editorial feel ─── */
function Section({
  icon, title, defaultOpen = true, badge, children, accent = false,
}: {
  icon: React.ReactNode; title: string; defaultOpen?: boolean; badge?: React.ReactNode; children: React.ReactNode; accent?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="scroll-mt-36" id={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className={`overflow-hidden rounded-2xl border transition-all duration-300 ${accent ? "border-primary/15 bg-primary/[0.02]" : "border-border/40 bg-card"} ${open ? "shadow-sm" : "shadow-none"}`}>
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-5 py-4 text-start hover:bg-muted/20 transition-colors group">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:bg-primary/12">
              <span className="text-primary">{icon}</span>
            </div>
            <div>
              <h3 className="font-semibold text-[15px] tracking-tight">{title}</h3>
              {badge && <div className="mt-0.5">{badge}</div>}
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground/60 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
          <div className="mx-5 mb-0.5">
            <Separator className="opacity-30" />
          </div>
          <div className="p-5 sm:p-6">{children}</div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default function CompetitionDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const [activeSection, setActiveSection] = useState<string>("overview");
  const setActiveTab = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(`section-${id}`);
    if (el) {
      const offset = 140;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const isAr = language === "ar";
  const { data: qrCode } = useEntityQRCode("competition", id, "competition");
  const { isWatched, toggle: toggleWatchlist } = useEventWatchlist("competition", id);

  const { data: competition, isLoading } = useQuery({
    queryKey: ["competition", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("competitions").select("id, title, title_ar, description, description_ar, cover_image_url, rules_summary, rules_summary_ar, scoring_notes, scoring_notes_ar, registration_start, registration_end, competition_start, competition_end, is_virtual, venue, venue_ar, city, country, country_code, edition_year, max_participants, exhibition_id, organizer_id, competition_number, status, registration_fee_type, registration_fee, registration_currency, registration_tax_rate, registration_tax_name, registration_tax_name_ar, allowed_entry_types, max_team_size, min_team_size, series_id, created_at, blind_judging_enabled, blind_code_prefix").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Competition not found");
      return data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 3,
  });

  const { data: categories } = useQuery({
    queryKey: ["competition-categories", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("competition_categories").select("id, name, name_ar, description, description_ar, max_participants, gender, sort_order, cover_image_url, participant_level, status").eq("competition_id", id).order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  const { data: criteria } = useQuery({
    queryKey: ["judging-criteria", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("judging_criteria").select("id, name, name_ar, description, description_ar, max_score, weight, sort_order").eq("competition_id", id).order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  const { data: myRegistration } = useQuery({
    queryKey: ["my-registration", id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("competition_registrations").select("id, status, competition_id, participant_id, category_id, dish_name, entry_type, team_name, registered_at").eq("competition_id", id).eq("participant_id", user.id).maybeSingle();
      return data;
    },
    enabled: !!id && !!user,
  });

  const { data: competitionTypes } = useQuery({
    queryKey: ["competition-detail-types", id],
    queryFn: async () => {
      const { data: assignments } = await supabase.from("competition_type_assignments").select("type_id").eq("competition_id", id);
      if (!assignments || assignments.length === 0) return [];
      const typeIds = assignments.map((a) => a.type_id);
      const { data: types } = await supabase.from("competition_types").select("id, name, name_ar, icon, cover_image_url").in("id", typeIds);
      return types || [];
    },
    enabled: !!id,
  });

  const { data: supervisingBodies } = useQuery({
    queryKey: ["competition-detail-bodies", id],
    queryFn: async () => {
      const { data: assignments } = await supabase.from("competition_supervising_bodies").select("entity_id, role").eq("competition_id", id);
      if (!assignments || assignments.length === 0) return [];
      const entityIds = assignments.map((a) => a.entity_id);
      const roles = new Map(assignments.map(a => [a.entity_id, a.role]));
      const { data: entities } = await supabase.from("culinary_entities").select("id, name, name_ar, abbreviation, logo_url, type, country").in("id", entityIds);
      return (entities || []).map(e => ({ ...e, bodyRole: roles.get(e.id) || "supervisor" }));
    },
    enabled: !!id,
  });

  const { data: userRoles } = useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user!.id);
      return data?.map(r => r.role) || [];
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1">
          <Skeleton className="h-56 w-full sm:h-80 md:h-96" />
          <div className="border-b border-border/40 px-3 sm:px-4 py-2.5 sm:py-3">
            <div className="container flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-24 rounded-full shrink-0" />
              ))}
            </div>
          </div>
          <div className="container py-5 md:py-8">
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-5">
                <Skeleton className="h-44 w-full rounded-2xl" />
                <Skeleton className="h-60 w-full rounded-2xl" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-32 w-full rounded-2xl" />
                <Skeleton className="h-48 w-full rounded-2xl" />
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
  const title = competition.edition_year ? `${baseTitle} +${competition.edition_year}` : baseTitle;
  const description = isAr && competition.description_ar ? competition.description_ar : competition.description;
  const venue = isAr && competition.venue_ar ? competition.venue_ar : competition.venue;
  const canRegister = competition.status === "registration_open" && user && !myRegistration;
  const isOrganizer = user && competition.organizer_id === user.id;
  const canSeeKnowledge = isOrganizer || isAdmin || userRoles?.some(r => ["judge", "supervisor"].includes(r));
  const hasWinners = competition.status === "completed";

  const supervisors = supervisingBodies?.filter(b => b.bodyRole === "supervisor") || [];
  const accreditors = supervisingBodies?.filter(b => b.bodyRole !== "supervisor") || [];

  const navItems = [
    { id: "overview", icon: <Eye className="h-4 w-4" />, label: isAr ? "نظرة عامة" : "Overview" },
    { id: "rounds", icon: <Swords className="h-4 w-4" />, label: isAr ? "الجولات" : "Rounds" },
    { id: "judges", icon: <Scale className="h-4 w-4" />, label: isAr ? "لجنة التحكيم" : "Judging Panel" },
    { id: "contestants", icon: <Users className="h-4 w-4" />, label: isAr ? "المتسابقين" : "Contestants" },
    { id: "categories", icon: <Target className="h-4 w-4" />, label: isAr ? "الفئات" : "Categories" },
    { id: "criteria", icon: <BarChart3 className="h-4 w-4" />, label: isAr ? "المعايير" : "Criteria" },
    { id: "stages", icon: <Layers className="h-4 w-4" />, label: isAr ? "مراحل التقييم" : "Eval Stages" },
    { id: "live-scoring", icon: <Radio className="h-4 w-4" />, label: isAr ? "النتائج المباشرة" : "Live Scores" },
    { id: "schedule", icon: <CalendarClock className="h-4 w-4" />, label: isAr ? "الجدول" : "Schedule" },
    { id: "stations", icon: <ChefHat className="h-4 w-4" />, label: isAr ? "المحطات" : "Stations" },
    { id: "winners", icon: <Medal className="h-4 w-4" />, label: isAr ? "الفائزين" : "Winners" },
    { id: "feedback", icon: <MessageCircle className="h-4 w-4" />, label: isAr ? "الملاحظات" : "Feedback" },
    { id: "checklist", icon: <ClipboardCheck className="h-4 w-4" />, label: isAr ? "قائمة التحضير" : "Prep List" },
    { id: "team", icon: <UsersRound className="h-4 w-4" />, label: isAr ? "الفريق" : "Team" },
    { id: "collaboration", icon: <ClipboardList className="h-4 w-4" />, label: isAr ? "التعاون" : "Collaboration" },
    ...(canSeeKnowledge ? [{ id: "knowledge", icon: <BookOpen className="h-4 w-4" />, label: isAr ? "المعرفة" : "Knowledge" }] : []),
    ...(canSeeKnowledge ? [{ id: "deliberation", icon: <MessageSquare className="h-4 w-4" />, label: isAr ? "المداولات" : "Deliberation" }] : []),
    ...(canSeeKnowledge ? [{ id: "judge-analytics", icon: <BarChart3 className="h-4 w-4" />, label: isAr ? "تحليل الحكام" : "Judge Analytics" }] : []),
    { id: "gallery", icon: <ImageIcon className="h-4 w-4" />, label: isAr ? "المعرض" : "Gallery" },
    ...(isOrganizer ? [{ id: "analytics", icon: <BarChart3 className="h-4 w-4" />, label: isAr ? "التحليلات" : "Analytics" }] : []),
    ...(isOrganizer ? [{ id: "adv-schedule", icon: <CalendarClock className="h-4 w-4" />, label: isAr ? "جدول متقدم" : "Adv. Schedule" }] : []),
    ...(isOrganizer ? [{ id: "notifications", icon: <MessageSquare className="h-4 w-4" />, label: isAr ? "الإشعارات" : "Notifications" }] : []),
    ...(user ? [{ id: "requirements", icon: <ClipboardList className="h-4 w-4" />, label: isAr ? "مركز الطلبات" : "Order Center" }] : []),
    ...(isOrganizer ? [{ id: "manage", icon: <Settings className="h-4 w-4" />, label: isAr ? "إدارة" : "Manage" }] : []),
  ];

  // Breadcrumb structured data
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": isAr ? "الرئيسية" : "Home", "item": window.location.origin },
      { "@type": "ListItem", "position": 2, "name": isAr ? "المسابقات" : "Competitions", "item": `${window.location.origin}/competitions` },
      { "@type": "ListItem", "position": 3, "name": title },
    ],
  };

  const eventLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: title,
    description: description || undefined,
    startDate: competition.competition_start,
    endDate: competition.competition_end,
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
    organizer: { "@type": "Organization", name: "Altoha", url: window.location.origin },
    ...(competition.max_participants ? { maximumAttendeeCapacity: competition.max_participants } : {}),
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead
        title={title}
        description={description || `${title} - Culinary competition on Altoha`}
        ogImage={competition.cover_image_url || undefined}
        ogType="article"
        keywords={`${title}, culinary competition, ${competition.city || ""}, ${competition.country || ""}, chef competition`}
        jsonLd={eventLd}
      />
      {/* Breadcrumb JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Header />

      <main className="flex-1">
        {/* ─── Hero Section — Cinematic ─── */}
        <section className="relative overflow-hidden">
          <div className="relative h-48 w-full sm:h-72 md:h-[26rem] lg:h-[30rem]">
            {competition.cover_image_url ? (
              <img
                src={competition.cover_image_url}
                alt={title}
                className="h-full w-full object-cover"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-muted/30 to-background">
                <Trophy className="h-28 w-28 sm:h-40 sm:w-40 text-primary/[0.06]" />
              </div>
            )}
            {/* Cinematic gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" style={{ top: "50%" }} />
          </div>

          {/* Hero content bar — below image overlay */}
          <div className="absolute inset-x-0 bottom-0">
             <div className="container pb-5 sm:pb-8 md:pb-10">
                <div className="max-w-4xl space-y-2 sm:space-y-4 animate-fade-in">
                <Button
                  variant="ghost"
                  size="sm"
                  className="group -ms-2 w-fit text-foreground/80 hover:bg-foreground/5 hover:text-foreground"
                  asChild
                >
                  <Link to="/competitions">
                    <ArrowLeft className="me-2 h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                    {isAr ? "جميع المسابقات" : "All Competitions"}
                  </Link>
                </Button>

                {/* Badges row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`${statusConfig[competition.status as CompetitionStatus].bg} px-3.5 py-1.5 font-bold uppercase tracking-wider text-[10px] shadow-sm`}>
                    {statusConfig[competition.status as CompetitionStatus].dot.includes("chart-3") ? (
                      <span className="relative me-2 flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
                      </span>
                    ) : (
                      <span className={`me-2 inline-block h-2 w-2 rounded-full ${statusConfig[competition.status as CompetitionStatus].dot}`} />
                    )}
                    {isAr ? statusConfig[competition.status as CompetitionStatus].labelAr : statusConfig[competition.status as CompetitionStatus].label}
                  </Badge>
                  {competition.edition_year && (
                    <Badge variant="outline" className="bg-muted/60 border-border/60 font-bold text-[10px] px-3 py-1">{competition.edition_year}</Badge>
                  )}
                  {competition.competition_number && (
                    <Badge variant="outline" className="font-mono text-[10px] font-bold bg-muted/60 border-border/60 px-3 py-1 uppercase tracking-[0.15em]">{competition.competition_number}</Badge>
                  )}
                </div>

                {/* Title */}
                <h1 className="font-serif text-xl font-bold leading-[1.1] tracking-tight sm:text-3xl md:text-4xl lg:text-5xl text-foreground">
                  {title}
                </h1>

                {/* Meta info */}
                <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm text-muted-foreground flex-wrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-medium">{format(new Date(competition.competition_start), "MMM d")} – {format(new Date(competition.competition_end), "MMM d, yyyy")}</span>
                  </div>
                  {competition.is_virtual ? (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      <span className="font-medium">{isAr ? "افتراضية" : "Virtual"}</span>
                    </div>
                  ) : (venue || competition.city) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-medium">{competition.country_code ? `${countryFlag(competition.country_code)} ` : ""}{venue || competition.city}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Info Bar + Actions ─── */}
        <div className="border-y border-border/30 bg-card/60 backdrop-blur-md">
          <div className="container py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-5">
                {[
                  { label: isAr ? "الفئات" : "Categories", value: categories?.length || 0 },
                  { label: isAr ? "المعايير" : "Criteria", value: criteria?.length || 0 },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <p className="text-lg font-bold tabular-nums text-foreground">{stat.value}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2.5">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 rounded-xl px-4 text-xs font-semibold border-border/50" onClick={async (e) => {
                      // Try native share first on mobile
                      if (navigator.share) {
                        e.preventDefault();
                        try {
                          await navigator.share({ title, text: description || title, url: window.location.href });
                        } catch { /* user cancelled */ }
                      }
                    }}>
                      <Share2 className="me-1.5 h-3.5 w-3.5" />{isAr ? "مشاركة" : "Share"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5">
                    <DropdownMenuItem className="cursor-pointer gap-2.5 rounded-xl py-2 text-xs font-medium" onClick={() => {
                      const text = encodeURIComponent(`${title}`);
                      const url = encodeURIComponent(window.location.href);
                      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank", "width=600,height=400");
                    }}>
                      <Twitter className="h-3.5 w-3.5" /> Twitter / X
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer gap-2.5 rounded-xl py-2 text-xs font-medium" onClick={() => {
                      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, "_blank", "width=600,height=400");
                    }}>
                      <Facebook className="h-3.5 w-3.5" /> Facebook
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer gap-2.5 rounded-xl py-2 text-xs font-medium" onClick={() => {
                      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, "_blank", "width=600,height=400");
                    }}>
                      <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer gap-2.5 rounded-xl py-2 text-xs font-medium" onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast({ title: isAr ? "تم نسخ الرابط!" : "Link copied!" });
                    }}>
                      <Link2 className="h-3.5 w-3.5" /> {isAr ? "نسخ الرابط" : "Copy Link"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {user && (
                  <Button variant="outline" size="sm" className="h-9 rounded-xl px-4 text-xs font-semibold border-border/50" onClick={toggleWatchlist}>
                    {isWatched ? <BookmarkCheck className="me-1.5 h-3.5 w-3.5 text-primary" /> : <Bookmark className="me-1.5 h-3.5 w-3.5" />}
                    {isWatched ? (isAr ? "في القائمة" : "Saved") : (isAr ? "أضف للقائمة" : "Watchlist")}
                  </Button>
                )}

                {competition.status === "completed" && (
                  <Button asChild variant="outline" size="sm" className="h-9 rounded-xl px-4 text-xs font-semibold border-border/50">
                    <Link to={`/competitions/${id}/results`}><Award className="me-1.5 h-3.5 w-3.5" />{isAr ? "النتائج" : "Results"}</Link>
                  </Button>
                )}
                {isOrganizer && (
                  <Button asChild variant="outline" size="sm" className="h-9 rounded-xl px-4 text-xs font-semibold border-border/50">
                    <Link to={`/competitions/${id}/edit`}><Pencil className="me-1.5 h-3.5 w-3.5" />{isAr ? "تعديل" : "Edit"}</Link>
                  </Button>
                )}
                {canRegister && !showRegistrationForm && (
                  <Button className="h-9 rounded-xl px-5 text-xs font-bold shadow-md shadow-primary/15" onClick={() => setShowRegistrationForm(true)}>
                    <Sparkles className="me-1.5 h-3.5 w-3.5" />{t("registerNow")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Navigation Pills ─── */}
        <div className="sticky top-14 z-30 border-b border-border/30 bg-background/95 backdrop-blur-xl">
          <div className="container">
            <div className="flex gap-0.5 sm:gap-1 overflow-x-auto py-2 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0 snap-x scroll-smooth">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { try { if ("vibrate" in navigator) navigator.vibrate(8); } catch {} setActiveTab(item.id); }}
                  className={`
                    snap-start inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold transition-all duration-200 active:scale-[0.96] touch-manipulation select-none
                    ${activeSection === item.id
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}
                  `}
                >
                  <span className={`hidden sm:inline ${activeSection === item.id ? "text-primary-foreground" : "text-primary/70"}`}>
                    {item.icon}
                  </span>
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>


        {/* ─── Inline Registration ─── */}
        {showRegistrationForm && (
          <div className="container py-6">
            <RegistrationForm
              competitionId={competition.id}
              competitionTitle={title}
              categories={categories || []}
              onCancel={() => setShowRegistrationForm(false)}
              onSuccess={() => setShowRegistrationForm(false)}
            />
          </div>
        )}

        <div className="container py-8 sm:py-10">
          {/* ─── Registration banners ─── */}
          {canRegister && !showRegistrationForm && (
            <div className="mb-8 rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/[0.04] via-transparent to-accent/[0.04] p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 shrink-0">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-[15px]">{isAr ? "التسجيل مفتوح الآن!" : "Registration is open!"}</p>
                    <p className="text-sm text-muted-foreground">{isAr ? "سجّل الآن لتأمين مكانك في المسابقة" : "Secure your spot in this competition today"}</p>
                  </div>
                </div>
                <Button onClick={() => setShowRegistrationForm(true)} className="shadow-md shadow-primary/15 rounded-xl h-10 px-6 font-bold">
                  {t("registerNow")}
                </Button>
              </div>
            </div>
          )}
          {myRegistration && (
            <div className="mb-8">
              <RegistrationStatusBanner
                registration={myRegistration}
                competitionStatus={competition.status}
              />
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-3">
            {/* ─── Main Content ─── */}
            <div className="lg:col-span-2 space-y-5">
              {activeSection === "overview" && (
                <>
                  {/* Description */}
                  {description && (
                    <Section icon={<BookOpen className="h-4 w-4" />} title={isAr ? "نبذة عن المسابقة" : "About this Competition"}>
                      <p className="whitespace-pre-wrap text-sm leading-[1.8] text-muted-foreground">{description}</p>
                    </Section>
                  )}

                  {/* Competition specialty */}
                  {competitionTypes && competitionTypes.length > 0 && (
                    <Section icon={<Flame className="h-4 w-4" />} title={isAr ? "تخصص المسابقة" : "Competition Specialty"} badge={<Badge variant="secondary" className="text-[10px]">{competitionTypes.length}</Badge>}>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {competitionTypes.map((type: any) => (
                          <div key={type.id} className="group relative overflow-hidden rounded-2xl border border-border/40 bg-muted/20 hover:bg-muted/40 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                            {type.cover_image_url ? (
                              <div className="relative h-32">
                                <img src={type.cover_image_url} alt={type.name} className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-500" loading="lazy" decoding="async" />
                                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                                <div className="absolute bottom-0 inset-x-0 p-4">
                                  <p className="text-sm font-bold text-foreground">{isAr && type.name_ar ? type.name_ar : type.name}</p>
                                  <p className="text-[11px] text-muted-foreground mt-0.5">{isAr ? "تخصص" : "Specialty"}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-4 p-4">
                                <div className="h-14 w-14 rounded-2xl bg-primary/8 flex items-center justify-center shrink-0">
                                  <Flame className="h-6 w-6 text-primary/60" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold">{isAr && type.name_ar ? type.name_ar : type.name}</p>
                                  <p className="text-[11px] text-muted-foreground mt-0.5">{isAr ? "تخصص" : "Specialty"}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Supervising Bodies */}
                  {supervisors.length > 0 && (
                    <Section icon={<Shield className="h-4 w-4" />} title={isAr ? "الجهات المشرفة" : "Supervising Bodies"} badge={<Badge variant="secondary" className="text-[10px]">{supervisors.length}</Badge>}>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {supervisors.map((entity) => (
                          <div key={entity.id} className="flex items-center gap-4 rounded-2xl border border-border/40 bg-muted/20 p-4 transition-all hover:bg-muted/40 hover:shadow-sm">
                            {entity.logo_url ? (
                              <img src={entity.logo_url} alt="" className="h-12 w-12 rounded-xl object-contain shrink-0 bg-background p-1" loading="lazy" />
                            ) : (
                              <div className="h-12 w-12 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                                <Building2 className="h-5 w-5 text-primary/40" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate">
                                {isAr && entity.name_ar ? entity.name_ar : entity.name}
                                {entity.abbreviation && <span className="text-muted-foreground font-normal"> ({entity.abbreviation})</span>}
                              </p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">{isAr ? "جهة مشرفة" : "Supervising Body"}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Accrediting Bodies */}
                  {accreditors.length > 0 && (
                    <Section icon={<Award className="h-4 w-4" />} title={isAr ? "جهات الاعتماد" : "Accrediting Bodies"} badge={<Badge variant="secondary" className="text-[10px]">{accreditors.length}</Badge>} accent>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {accreditors.map((entity) => (
                          <div key={entity.id} className="flex items-center gap-4 rounded-2xl border border-primary/15 bg-primary/[0.03] p-4 transition-all hover:bg-primary/[0.06] hover:shadow-sm">
                            {entity.logo_url ? (
                              <img src={entity.logo_url} alt="" className="h-12 w-12 rounded-xl object-contain shrink-0 bg-background p-1" loading="lazy" />
                            ) : (
                              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <Award className="h-5 w-5 text-primary/50" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate">
                                {isAr && entity.name_ar ? entity.name_ar : entity.name}
                                {entity.abbreviation && <span className="text-muted-foreground font-normal"> ({entity.abbreviation})</span>}
                              </p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">{isAr ? "جهة اعتماد" : "Accrediting Body"}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Judging Panel Preview */}
                  <JudgesList competitionId={competition.id} isOrganizer={!!isOrganizer} />

                  {/* Timeline */}
                  <CompetitionTimeline
                    registrationStart={competition.registration_start}
                    registrationEnd={competition.registration_end}
                    competitionStart={competition.competition_start}
                    competitionEnd={competition.competition_end}
                  />

                  {/* Venue & Instructions */}
                  {!competition.is_virtual && (venue || competition.city) && (
                    <Section icon={<DoorOpen className="h-4 w-4" />} title={isAr ? "معلومات الموقع والدخول" : "Venue & Entry Information"}>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/8 shrink-0 mt-0.5">
                            <MapPin className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{venue}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{competition.city}, {competition.country}</p>
                          </div>
                        </div>
                        {competition.competition_start && (
                          <div className="flex items-start gap-3.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/8 shrink-0 mt-0.5">
                              <Clock className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{isAr ? "وقت الدخول" : "Entry Time"}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(competition.competition_start), "h:mm a")}</p>
                            </div>
                          </div>
                        )}
                        <div className="rounded-2xl bg-muted/30 border border-border/30 p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Info className="h-4 w-4 text-primary" />
                            <p className="text-sm font-semibold">{isAr ? "تعليمات للمتسابقين" : "Instructions for Contestants"}</p>
                          </div>
                          <ul className="text-[13px] text-muted-foreground space-y-2 list-none">
                            {[
                              isAr ? "يرجى الحضور قبل 30 دقيقة من الموعد" : "Please arrive 30 minutes before the scheduled time",
                              isAr ? "إحضار بطاقة الهوية أو التسجيل" : "Bring your ID or registration confirmation",
                              isAr ? "الالتزام بزي المسابقة المطلوب" : "Wear the required competition uniform",
                              isAr ? "الأدوات الشخصية مسموح بها وفق القواعد" : "Personal tools are allowed per the rules",
                            ].map((text, i) => (
                              <li key={i} className="flex items-start gap-2.5">
                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0" />
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
                    <Section icon={<BookOpen className="h-4 w-4" />} title={isAr ? "القواعد والشروط" : "Rules & Regulations"} defaultOpen={false}>
                      <p className="whitespace-pre-wrap text-sm leading-[1.8] text-muted-foreground">
                        {isAr && competition.rules_summary_ar ? competition.rules_summary_ar : competition.rules_summary}
                      </p>
                    </Section>
                  )}

                  {/* Scoring Notes */}
                  {(competition.scoring_notes || competition.scoring_notes_ar) && (
                    <Section icon={<BarChart3 className="h-4 w-4" />} title={isAr ? "منهجية التقييم" : "Scoring Methodology"} defaultOpen={false}>
                      <p className="text-sm whitespace-pre-wrap leading-[1.8] text-muted-foreground mb-5">
                        {isAr && competition.scoring_notes_ar ? competition.scoring_notes_ar : competition.scoring_notes}
                      </p>
                      {criteria && criteria.length > 0 && (
                        <div className="space-y-2.5">
                          {criteria.map((crit) => (
                            <div key={crit.id} className="flex items-center gap-3.5 rounded-2xl bg-muted/30 border border-border/30 px-4 py-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary shrink-0">
                                {(Number(crit.weight) * 100).toFixed(0)}%
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold">{isAr && crit.name_ar ? crit.name_ar : crit.name}</p>
                                <p className="text-[12px] text-muted-foreground truncate mt-0.5">{isAr && crit.description_ar ? crit.description_ar : crit.description}</p>
                              </div>
                              <Badge variant="outline" className="shrink-0 text-[10px] rounded-xl">{isAr ? "الأقصى" : "Max"}: {crit.max_score}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </Section>
                  )}

                  {/* Categories */}
                  {categories && categories.length > 0 && (
                    <Section
                      icon={<Target className="h-4 w-4" />}
                      title={isAr ? "الفئات" : "Categories"}
                      badge={<Badge variant="secondary" className="text-[10px]">{categories.length}</Badge>}
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        {categories.slice(0, 6).map((cat) => (
                          <div
                            key={cat.id}
                            className="group relative overflow-hidden rounded-2xl border border-border/40 bg-muted/20 hover:bg-muted/40 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                            onClick={() => setActiveSection("categories")}
                          >
                            {cat.cover_image_url ? (
                              <div className="relative h-28">
                                <img src={cat.cover_image_url} alt={cat.name} className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-500" loading="lazy" decoding="async" />
                                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                                <div className="absolute bottom-0 inset-x-0 p-3.5">
                                  <p className="text-sm font-bold text-foreground">{isAr && cat.name_ar ? cat.name_ar : cat.name}</p>
                                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                    {cat.max_participants && <span><Users className="inline h-2.5 w-2.5 me-0.5" />{cat.max_participants}</span>}
                                    <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-background/60 rounded-md">{categoryBadgeText(cat.gender, cat.participant_level, isAr)}</Badge>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-4 p-4">
                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/8 to-accent/8 flex items-center justify-center shrink-0">
                                  <Trophy className="h-6 w-6 text-primary/40" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold truncate">{isAr && cat.name_ar ? cat.name_ar : cat.name}</p>
                                  {cat.description && (
                                    <p className="text-[12px] text-muted-foreground truncate mt-0.5">{isAr && cat.description_ar ? cat.description_ar : cat.description}</p>
                                  )}
                                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                                    {cat.max_participants && <span><Users className="inline h-2.5 w-2.5 me-0.5" />{cat.max_participants}</span>}
                                    <Badge variant="outline" className="text-[9px] h-4 px-1.5 rounded-md">{categoryBadgeText(cat.gender, cat.participant_level, isAr)}</Badge>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {categories.length > 6 && (
                        <Button variant="ghost" size="sm" className="mt-4 w-full text-xs rounded-xl" onClick={() => setActiveSection("categories")}>
                          {isAr ? `عرض جميع الفئات (${categories.length})` : `View all categories (${categories.length})`}
                        </Button>
                      )}
                    </Section>
                  )}

                  {/* Sponsors */}
                  <CompetitionSponsorsPanel competitionId={competition.id} isOrganizer={isOrganizer} />
                </>
              )}

              {activeSection === "rounds" && <TournamentRoundsPanel competitionId={competition.id} isOrganizer={!!isOrganizer} />}
              {activeSection === "judges" && <JudgesList competitionId={competition.id} isOrganizer={!!isOrganizer} />}
              {activeSection === "contestants" && <ParticipantsList competitionId={competition.id} isOrganizer={!!isOrganizer} />}
              {activeSection === "categories" && <CategoryManagementPanel competitionId={competition.id} isOrganizer={isOrganizer} competitionStatus={competition.status} />}
              {activeSection === "criteria" && <CriteriaManagementPanel competitionId={competition.id} isOrganizer={isOrganizer} />}
              {activeSection === "stages" && <EvaluationStagesPanel competitionId={competition.id} isOrganizer={!!isOrganizer} />}
              {activeSection === "live-scoring" && <LiveScoringDashboard competitionId={competition.id} isOrganizer={isOrganizer} />}
              {activeSection === "schedule" && <CompetitionSchedulePanel competitionId={competition.id} isOrganizer={!!isOrganizer} />}
              {activeSection === "stations" && <KitchenStationsPanel competitionId={competition.id} isOrganizer={!!isOrganizer} />}
              {activeSection === "feedback" && <CompetitionFeedbackPanel competitionId={competition.id} />}
              {activeSection === "checklist" && <PreparationChecklistPanel competitionId={competition.id} />}
              {activeSection === "deliberation" && canSeeKnowledge && <JudgeDeliberationPanel competitionId={competition.id} />}
              {activeSection === "winners" && (
                hasWinners ? (
                  <CompetitionLeaderboard competitionId={competition.id} />
                ) : (
                  <div className="rounded-2xl border border-primary/15 bg-primary/[0.02] p-12 text-center">
                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-chart-4/10">
                      <Medal className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="font-serif text-xl font-bold mb-2">
                      {isAr ? "لم يتم إعلان الفائزين بعد" : "Winners Not Announced Yet"}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                      {isAr
                        ? "شارك لتكون من الفائزين بالميدالية الذهبية 🏅 سيتم الإعلان عن النتائج بعد انتهاء المسابقة والتحكيم."
                        : "Participate to be among the Gold Medal winners 🏅 Results will be announced after the competition and judging conclude."}
                    </p>
                    {canRegister && (
                      <Button className="mt-6 shadow-md shadow-primary/15 rounded-xl" onClick={() => { setShowRegistrationForm(true); setActiveSection("overview"); }}>
                        <Sparkles className="me-1.5 h-4 w-4" />
                        {isAr ? "سجّل الآن" : "Register Now"}
                      </Button>
                    )}
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
                <div className="space-y-5">
                  <CompetitionStatusManager competitionId={competition.id} currentStatus={competition.status} competitionTitle={title} />
                  <BlindJudgingPanel competitionId={competition.id} isOrganizer={true} blindJudgingEnabled={competition.blind_judging_enabled} blindCodePrefix={competition.blind_code_prefix || "ENTRY"} />
                  <JudgeAssignmentPanel competitionId={competition.id} />
                  <RegistrationApprovalPanel competitionId={competition.id} />
                  {competition.status === "completed" && <AutoIssueCertificates competitionId={competition.id} />}

                  <Section icon={<FileSpreadsheet className="h-4 w-4" />} title={isAr ? "استيراد جماعي من ملف إكسل" : "Bulk Import from Excel"} defaultOpen={false}>
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {isAr
                          ? "قم بتنزيل القالب، واملأه، ثم ارفعه لاستيراد المشاركين أو المحكمين أو الفائزين أو المتطوعين أو الرعاة. رقم المسابقة سيُملأ تلقائياً."
                          : "Download the template, fill it out, then upload to import participants, judges, winners, volunteers, or sponsors. The competition number is auto-filled."}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {(["participant", "judge", "winner", "volunteer", "sponsor"] as const).map(type => (
                          <BulkImportPanel
                            key={type}
                            entityType={type}
                            competitionNumber={competition.competition_number || ""}
                            onImportComplete={() => {}}
                          />
                        ))}
                      </div>
                    </div>
                  </Section>
                </div>
              )}
              {/* Comments Section */}
              <Card className="p-5">
                <EventComments eventType="competition" eventId={competition.id} />
              </Card>
            </div>

            {/* ─── Sidebar ─── */}
            <div className="space-y-5 lg:sticky lg:top-[120px] lg:self-start">
              {/* Countdown */}
              {competition.status === "registration_open" && competition.registration_end && (
                <CompetitionCountdown targetDate={competition.registration_end} label="Registration Closes In" labelAr="ينتهي التسجيل خلال" />
              )}
              {["upcoming", "registration_open", "registration_closed"].includes(competition.status) && (
                <CompetitionCountdown targetDate={competition.competition_start} label="Competition Starts In" labelAr="تبدأ المسابقة خلال" />
              )}

              {/* Registration Card */}
              <div className="overflow-hidden rounded-2xl border border-border/40 bg-card">
                <div className="border-b border-border/30 bg-gradient-to-r from-primary/[0.04] to-transparent px-5 py-3.5">
                  <h3 className="flex items-center gap-2.5 font-bold text-sm">
                    <Trophy className="h-4 w-4 text-primary" />
                    {isAr ? "التسجيل" : "Registration"}
                  </h3>
                </div>
                <div className="p-5 space-y-3">
                  {myRegistration ? (
                    <div className="flex items-center gap-2.5 rounded-xl bg-primary/8 p-3.5">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-semibold text-primary">
                        {myRegistration.status === "approved" ? t("alreadyRegistered") : t("registrationPending")}
                      </span>
                    </div>
                  ) : canRegister ? (
                    <Button className="w-full shadow-md shadow-primary/15 rounded-xl h-10 font-bold" onClick={() => setShowRegistrationForm(true)} disabled={showRegistrationForm}>
                      {t("registerNow")}
                    </Button>
                  ) : !user ? (
                    <Button asChild className="w-full rounded-xl h-10" variant="outline">
                      <Link to="/login">{isAr ? "سجل الدخول للتسجيل" : "Sign in to Register"}</Link>
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">{isAr ? "التسجيل مغلق حالياً" : "Registration is currently closed."}</p>
                  )}
                  {competition.registration_end && (
                    <p className="text-[11px] text-center text-muted-foreground">
                      {isAr ? "ينتهي التسجيل:" : "Deadline:"}{" "}
                      <span className="font-semibold text-foreground">{format(new Date(competition.registration_end), "MMM d, yyyy")}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Participant Stats */}
              <ParticipantStatsCard competitionId={competition.id} maxParticipants={competition.max_participants} />

              {/* Quick Info Card */}
              <div className="overflow-hidden rounded-2xl border border-border/40 bg-card">
                <div className="border-b border-border/30 bg-gradient-to-r from-accent/[0.04] to-transparent px-5 py-3.5">
                  <h3 className="flex items-center gap-2.5 font-bold text-sm">
                    <BookOpen className="h-4 w-4 text-primary" />
                    {isAr ? "معلومات سريعة" : "Quick Info"}
                  </h3>
                </div>
                <div className="p-5 space-y-3.5">
                  {[
                    competition.country_code && { label: isAr ? "الدولة" : "Country", value: `${countryFlag(competition.country_code)} ${competition.country}` },
                    competition.edition_year && { label: isAr ? "النسخة" : "Edition", value: competition.edition_year },
                    competition.max_participants && { label: isAr ? "السعة" : "Capacity", value: competition.max_participants },
                    competition.is_virtual !== null && { label: isAr ? "النوع" : "Format", value: competition.is_virtual ? (isAr ? "افتراضية" : "Virtual") : (isAr ? "حضورية" : "In-Person"), badge: true },
                    competition.registration_fee_type === "paid" && { label: isAr ? "رسوم التسجيل" : "Entry Fee", value: `${competition.registration_fee} ${competition.registration_currency}` },
                  ].filter(Boolean).map((item: any, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      {item.badge ? (
                        <Badge variant="outline" className="text-[10px] rounded-xl">{item.value}</Badge>
                      ) : (
                        <span className="font-semibold">{item.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* QR Code */}
              {qrCode && (
                <QRCodeDisplay
                  code={qrCode.code}
                  label={isAr ? "رمز QR للمسابقة" : "Competition QR Code"}
                  size={140}
                  compact={false}
                />
              )}

              {/* Organizer */}
              <OrganizerCard organizerId={competition.organizer_id} exhibitionId={competition.exhibition_id} />

              {/* Activity Feed */}
              <CompetitionActivityFeed competitionId={competition.id} isOrganizer={!!isOrganizer} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  );
}
