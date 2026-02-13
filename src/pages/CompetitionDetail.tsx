import { useState } from "react";
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
import type { Database } from "@/integrations/supabase/types";

type CompetitionStatus = Database["public"]["Enums"]["competition_status"];

const statusConfig: Record<CompetitionStatus, { bg: string; dot: string; label: string; labelAr: string }> = {
  draft: { bg: "bg-muted/60", dot: "bg-muted-foreground", label: "Draft", labelAr: "مسودة" },
  upcoming: { bg: "bg-accent/10 text-accent-foreground", dot: "bg-accent", label: "Upcoming", labelAr: "قادمة" },
  registration_open: { bg: "bg-primary/10 text-primary", dot: "bg-primary", label: "Registration Open", labelAr: "التسجيل مفتوح" },
  registration_closed: { bg: "bg-muted/60 text-muted-foreground", dot: "bg-muted-foreground", label: "Registration Closed", labelAr: "التسجيل مغلق" },
  in_progress: { bg: "bg-chart-3/10 text-chart-3", dot: "bg-chart-3", label: "In Progress", labelAr: "جارية" },
  judging: { bg: "bg-chart-4/10 text-chart-4", dot: "bg-chart-4", label: "Judging", labelAr: "التحكيم" },
  completed: { bg: "bg-chart-5/10 text-chart-5", dot: "bg-chart-5", label: "Completed", labelAr: "مكتملة" },
  cancelled: { bg: "bg-destructive/10 text-destructive", dot: "bg-destructive", label: "Cancelled", labelAr: "ملغاة" },
};

/* ─── Collapsible Section ─── */
function Section({
  icon, title, defaultOpen = true, badge, children,
}: {
  icon: React.ReactNode; title: string; defaultOpen?: boolean; badge?: React.ReactNode; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="overflow-hidden border-border/60">
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-5 py-4 text-start hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 shrink-0">
              {icon}
            </div>
            <h3 className="font-semibold text-sm">{title}</h3>
            {badge}
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Separator />
          <div className="p-5">{children}</div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export default function CompetitionDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const isAr = language === "ar";
  const { data: qrCode } = useEntityQRCode("competition", id, "competition");

  const { data: competition, isLoading } = useQuery({
    queryKey: ["competition", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("competitions").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Competition not found");
      return data;
    },
    enabled: !!id,
  });

  const { data: categories } = useQuery({
    queryKey: ["competition-categories", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("competition_categories").select("*").eq("competition_id", id).order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: criteria } = useQuery({
    queryKey: ["judging-criteria", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("judging_criteria").select("*").eq("competition_id", id).order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: myRegistration } = useQuery({
    queryKey: ["my-registration", id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("competition_registrations").select("*").eq("competition_id", id).eq("participant_id", user.id).maybeSingle();
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

  // Check if user has supervisor/judge/organizer role
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
        <main className="container flex-1 py-8">
          <Skeleton className="mb-4 h-7 w-36" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
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
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Trophy className="h-8 w-8 text-muted-foreground/30" />
          </div>
          <p className="font-semibold">{isAr ? "المسابقة غير موجودة" : "Competition not found"}</p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link to="/competitions"><ArrowLeft className="me-1.5 h-4 w-4" />{isAr ? "العودة" : "Back"}</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const title = isAr && competition.title_ar ? competition.title_ar : competition.title;
  const description = isAr && competition.description_ar ? competition.description_ar : competition.description;
  const venue = isAr && competition.venue_ar ? competition.venue_ar : competition.venue;
  const canRegister = competition.status === "registration_open" && user && !myRegistration;
  const isOrganizer = user && competition.organizer_id === user.id;
  const canSeeKnowledge = isOrganizer || isAdmin || userRoles?.some(r => ["judge", "supervisor"].includes(r));
  const hasWinners = competition.status === "completed";

  // Separate supervising bodies by role
  const supervisors = supervisingBodies?.filter(b => b.bodyRole === "supervisor") || [];
  const accreditors = supervisingBodies?.filter(b => b.bodyRole !== "supervisor") || [];

  const navItems = [
    { id: "overview", icon: <Eye className="h-3.5 w-3.5" />, label: isAr ? "نظرة عامة" : "Overview" },
    { id: "judges", icon: <Scale className="h-3.5 w-3.5" />, label: isAr ? "لجنة التحكيم" : "Judging Panel" },
    { id: "contestants", icon: <Users className="h-3.5 w-3.5" />, label: isAr ? "المتسابقين" : "Contestants" },
    { id: "categories", icon: <Target className="h-3.5 w-3.5" />, label: isAr ? "الفئات" : "Categories" },
    { id: "criteria", icon: <BarChart3 className="h-3.5 w-3.5" />, label: isAr ? "المعايير" : "Criteria" },
    { id: "live-scoring", icon: <Radio className="h-3.5 w-3.5" />, label: isAr ? "النتائج المباشرة" : "Live Scores" },
    { id: "winners", icon: <Medal className="h-3.5 w-3.5" />, label: isAr ? "الفائزين" : "Winners" },
    { id: "team", icon: <UsersRound className="h-3.5 w-3.5" />, label: isAr ? "الفريق" : "Team" },
    ...(canSeeKnowledge ? [{ id: "knowledge", icon: <BookOpen className="h-3.5 w-3.5" />, label: isAr ? "المعرفة" : "Knowledge" }] : []),
    { id: "gallery", icon: <ImageIcon className="h-3.5 w-3.5" />, label: isAr ? "المعرض" : "Gallery" },
    ...(user ? [{ id: "requirements", icon: <ClipboardList className="h-3.5 w-3.5" />, label: isAr ? "مركز الطلبات" : "Order Center" }] : []),
    ...(isOrganizer ? [{ id: "manage", icon: <Settings className="h-3.5 w-3.5" />, label: isAr ? "إدارة" : "Manage" }] : []),
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead
        title={title}
        description={description || `${title} - Culinary competition on Altohaa`}
        ogImage={competition.cover_image_url || undefined}
        ogType="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Event",
          name: title,
          description: description || undefined,
          startDate: competition.competition_start,
          endDate: competition.competition_end,
          location: competition.is_virtual
            ? { "@type": "VirtualLocation" }
            : { "@type": "Place", name: venue || undefined, address: { "@type": "PostalAddress", addressLocality: competition.city, addressCountry: competition.country } },
          image: competition.cover_image_url || undefined,
          eventStatus: "https://schema.org/EventScheduled",
        }}
      />
      <Header />

      <main className="flex-1">
        {/* ─── Hero Section ─── */}
        <section className="relative overflow-hidden">
          {competition.cover_image_url ? (
            <img src={competition.cover_image_url} alt={title} className="h-64 w-full object-cover sm:h-72 md:h-80 lg:h-[24rem]" loading="eager" />
          ) : (
            <div className="flex h-64 items-center justify-center bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 sm:h-72 md:h-80 lg:h-[24rem]">
              <Trophy className="h-28 w-28 text-primary/10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />

          <div className="absolute inset-x-0 bottom-0">
            <div className="container pb-6 md:pb-8">
              <Button variant="ghost" size="sm" asChild className="mb-4 -ms-2 text-foreground/80 hover:text-foreground">
                <Link to="/competitions"><ArrowLeft className="me-1.5 h-4 w-4" />{isAr ? "المسابقات" : "Competitions"}</Link>
              </Button>

              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-3 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={statusConfig[competition.status as CompetitionStatus].bg}>
                      <span className={`me-1.5 inline-block h-1.5 w-1.5 rounded-full ${statusConfig[competition.status as CompetitionStatus].dot}`} />
                      {isAr ? statusConfig[competition.status as CompetitionStatus].labelAr : statusConfig[competition.status as CompetitionStatus].label}
                    </Badge>
                    {competition.edition_year && (
                      <Badge variant="outline" className="bg-background/60 backdrop-blur-sm text-xs">{competition.edition_year}</Badge>
                    )}
                    {competition.competition_number && (
                      <Badge variant="outline" className="font-mono text-xs bg-background/60 backdrop-blur-sm">{competition.competition_number}</Badge>
                    )}
                  </div>
                  <h1 className="font-serif text-2xl font-bold sm:text-3xl md:text-4xl lg:text-5xl leading-tight drop-shadow-sm">{title}</h1>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(competition.competition_start), "MMM d")} – {format(new Date(competition.competition_end), "MMM d, yyyy")}
                    </span>
                    {competition.is_virtual ? (
                      <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />{isAr ? "افتراضية" : "Virtual"}</span>
                    ) : (venue || competition.city) && (
                      <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{competition.country_code ? `${countryFlag(competition.country_code)} ` : ""}{venue || competition.city}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="bg-background/80 backdrop-blur-sm">
                        <Share2 className="me-1.5 h-4 w-4" />{isAr ? "مشاركة" : "Share"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => {
                        const text = encodeURIComponent(`${title}`);
                        const url = encodeURIComponent(window.location.href);
                        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank", "width=600,height=400");
                      }}><Twitter className="h-4 w-4" /> Twitter / X</DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => {
                        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, "_blank", "width=600,height=400");
                      }}><Facebook className="h-4 w-4" /> Facebook</DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => {
                        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, "_blank", "width=600,height=400");
                      }}><Linkedin className="h-4 w-4" /> LinkedIn</DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast({ title: isAr ? "تم نسخ الرابط!" : "Link copied!" });
                      }}><Link2 className="h-4 w-4" /> {isAr ? "نسخ الرابط" : "Copy Link"}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {competition.status === "completed" && (
                    <Button asChild variant="secondary" size="sm" className="bg-background/80 backdrop-blur-sm">
                      <Link to={`/competitions/${id}/results`}><Award className="me-1.5 h-4 w-4" />{isAr ? "النتائج" : "Results"}</Link>
                    </Button>
                  )}
                  {isOrganizer && (
                    <Button asChild variant="outline" size="sm" className="bg-background/80 backdrop-blur-sm">
                      <Link to={`/competitions/${id}/edit`}><Pencil className="me-1.5 h-4 w-4" />{isAr ? "تعديل" : "Edit"}</Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Navigation Tabs (pill style) ─── */}
        <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur-sm">
          <div className="container">
            <div className="flex gap-1 overflow-x-auto py-2 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                    activeSection === item.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Inline Registration Form ─── */}
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

        <div className="container py-8">
          {/* ─── Quick Stats Bar ─── */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: <Calendar className="h-4 w-4 text-primary" />, label: isAr ? "تاريخ البداية" : "Start Date", value: format(new Date(competition.competition_start), "MMM d, yyyy") },
              { icon: <Calendar className="h-4 w-4 text-accent" />, label: isAr ? "تاريخ النهاية" : "End Date", value: format(new Date(competition.competition_end), "MMM d, yyyy") },
              { icon: competition.is_virtual ? <Globe className="h-4 w-4 text-chart-3" /> : <MapPin className="h-4 w-4 text-chart-3" />, label: isAr ? "الموقع" : "Location", value: competition.is_virtual ? (isAr ? "افتراضية" : "Virtual") : (competition.city || venue || "—") },
              { icon: <Users className="h-4 w-4 text-chart-4" />, label: isAr ? "الحد الأقصى" : "Capacity", value: competition.max_participants ? `${competition.max_participants}` : (isAr ? "غير محدود" : "Unlimited") },
            ].map((stat, i) => (
              <Card key={i} className="border-border/60">
                <CardContent className="flex items-center gap-3 p-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted shrink-0">{stat.icon}</div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                    <p className="text-sm font-semibold truncate">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ─── Registration CTA ─── */}
          {canRegister && !showRegistrationForm && (
            <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
              <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{isAr ? "التسجيل مفتوح الآن!" : "Registration is open!"}</p>
                    <p className="text-xs text-muted-foreground">{isAr ? "سجّل الآن لتأمين مكانك في المسابقة" : "Secure your spot in this competition today"}</p>
                  </div>
                </div>
                <Button onClick={() => setShowRegistrationForm(true)} className="shadow-lg shadow-primary/20">
                  {t("registerNow")}
                </Button>
              </CardContent>
            </Card>
          )}
          {myRegistration && (
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardContent className="flex items-center gap-3 p-4">
                <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm font-medium text-primary">
                  {myRegistration.status === "approved" ? t("alreadyRegistered") : t("registrationPending")}
                </span>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {/* ─── Main Content ─── */}
            <div className="lg:col-span-2 space-y-4">
              {activeSection === "overview" && (
                <>
                  {/* Description */}
                  {description && (
                    <Section icon={<BookOpen className="h-4 w-4 text-primary" />} title={isAr ? "نبذة عن المسابقة" : "About this Competition"}>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{description}</p>
                    </Section>
                  )}

                  {/* Competition specialty (changed from "types") */}
                  {competitionTypes && competitionTypes.length > 0 && (
                    <Section icon={<Flame className="h-4 w-4 text-primary" />} title={isAr ? "تخصص المسابقة" : "Competition Specialty"} badge={<Badge variant="secondary" className="text-[10px]">{competitionTypes.length}</Badge>}>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {competitionTypes.map((type: any) => (
                          <div key={type.id} className="group relative overflow-hidden rounded-xl border border-border/60 hover:shadow-md transition-all hover:-translate-y-0.5">
                            {type.cover_image_url ? (
                              <div className="relative h-28">
                                <img src={type.cover_image_url} alt={type.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                                <div className="absolute bottom-0 inset-x-0 p-3">
                                  <p className="text-sm font-semibold text-foreground">{isAr && type.name_ar ? type.name_ar : type.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{isAr ? "تخصص" : "Specialty"}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-primary/5 to-transparent">
                                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                  <Flame className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold">{isAr && type.name_ar ? type.name_ar : type.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{isAr ? "تخصص" : "Specialty"}</p>
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
                    <Section icon={<Shield className="h-4 w-4 text-primary" />} title={isAr ? "الجهات المشرفة" : "Supervising Bodies"} badge={<Badge variant="secondary" className="text-[10px]">{supervisors.length}</Badge>}>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {supervisors.map((entity) => (
                          <div key={entity.id} className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
                            {entity.logo_url ? (
                              <img src={entity.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                                <Building2 className="h-4 w-4 text-primary/30" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {isAr && entity.name_ar ? entity.name_ar : entity.name}
                                {entity.abbreviation && <span className="text-muted-foreground"> ({entity.abbreviation})</span>}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {isAr ? "جهة مشرفة" : "Supervising Body"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Accrediting Bodies */}
                  {accreditors.length > 0 && (
                    <Section icon={<Award className="h-4 w-4 text-primary" />} title={isAr ? "جهات الاعتماد" : "Accrediting Bodies"} badge={<Badge variant="secondary" className="text-[10px]">{accreditors.length}</Badge>}>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {accreditors.map((entity) => (
                          <div key={entity.id} className="flex items-center gap-3 rounded-xl border border-primary/20 p-3 bg-primary/5">
                            {entity.logo_url ? (
                              <img src={entity.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Award className="h-4 w-4 text-primary/50" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {isAr && entity.name_ar ? entity.name_ar : entity.name}
                                {entity.abbreviation && <span className="text-muted-foreground"> ({entity.abbreviation})</span>}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {isAr ? "جهة اعتماد" : "Accrediting Body"}
                              </p>
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
                    <Section icon={<DoorOpen className="h-4 w-4 text-primary" />} title={isAr ? "معلومات الموقع والدخول" : "Venue & Entry Information"}>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium">{venue}</p>
                            <p className="text-xs text-muted-foreground">{competition.city}, {competition.country}</p>
                          </div>
                        </div>
                        {competition.competition_start && (
                          <div className="flex items-start gap-3">
                            <Clock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm font-medium">{isAr ? "وقت الدخول" : "Entry Time"}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(competition.competition_start), "h:mm a")}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium">{isAr ? "تعليمات للمتسابقين" : "Instructions for Contestants"}</p>
                            <ul className="text-xs text-muted-foreground mt-1 space-y-1 list-disc list-inside">
                              <li>{isAr ? "يرجى الحضور قبل 30 دقيقة من الموعد" : "Please arrive 30 minutes before the scheduled time"}</li>
                              <li>{isAr ? "إحضار بطاقة الهوية أو التسجيل" : "Bring your ID or registration confirmation"}</li>
                              <li>{isAr ? "الالتزام بزي المسابقة المطلوب" : "Wear the required competition uniform"}</li>
                              <li>{isAr ? "الأدوات الشخصية مسموح بها وفق القواعد" : "Personal tools are allowed per the rules"}</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </Section>
                  )}

                  {/* Rules */}
                  {(competition.rules_summary || competition.rules_summary_ar) && (
                    <Section icon={<BookOpen className="h-4 w-4 text-primary" />} title={isAr ? "القواعد والشروط" : "Rules & Regulations"} defaultOpen={false}>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                        {isAr && competition.rules_summary_ar ? competition.rules_summary_ar : competition.rules_summary}
                      </p>
                    </Section>
                  )}

                  {/* Scoring Notes */}
                  {(competition.scoring_notes || competition.scoring_notes_ar) && (
                    <Section icon={<BarChart3 className="h-4 w-4 text-primary" />} title={isAr ? "منهجية التقييم" : "Scoring Methodology"} defaultOpen={false}>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed text-muted-foreground mb-4">
                        {isAr && competition.scoring_notes_ar ? competition.scoring_notes_ar : competition.scoring_notes}
                      </p>
                      {criteria && criteria.length > 0 && (
                        <div className="space-y-2">
                          {criteria.map((crit) => (
                            <div key={crit.id} className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2.5">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary shrink-0">
                                {(Number(crit.weight) * 100).toFixed(0)}%
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">{isAr && crit.name_ar ? crit.name_ar : crit.name}</p>
                                <p className="text-[11px] text-muted-foreground truncate">{isAr && crit.description_ar ? crit.description_ar : crit.description}</p>
                              </div>
                              <Badge variant="outline" className="shrink-0 text-[10px]">{isAr ? "الأقصى" : "Max"}: {crit.max_score}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </Section>
                  )}

                  {/* Categories Quick View with covers */}
                  {categories && categories.length > 0 && (
                    <Section
                      icon={<Target className="h-4 w-4 text-primary" />}
                      title={isAr ? "الفئات" : "Categories"}
                      badge={<Badge variant="secondary" className="text-[10px]">{categories.length}</Badge>}
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        {categories.slice(0, 6).map((cat) => (
                          <div
                            key={cat.id}
                            className="group relative overflow-hidden rounded-xl border border-border/60 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer"
                            onClick={() => setActiveSection("categories")}
                          >
                            {cat.cover_image_url ? (
                              <div className="relative h-24">
                                <img src={cat.cover_image_url} alt={cat.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                                <div className="absolute bottom-0 inset-x-0 p-3">
                                  <p className="text-sm font-semibold text-foreground">{isAr && cat.name_ar ? cat.name_ar : cat.name}</p>
                                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                    {cat.max_participants && <span><Users className="inline h-2.5 w-2.5 me-0.5" />{cat.max_participants}</span>}
                                    <Badge variant="outline" className="text-[9px] h-4 px-1 bg-background/60">{cat.gender === "male" ? (isAr ? "ذكور" : "Male") : cat.gender === "female" ? (isAr ? "إناث" : "Female") : (isAr ? "مختلط" : "Mixed")}</Badge>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 p-3.5">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center shrink-0">
                                  <Trophy className="h-5 w-5 text-primary/40" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold truncate">{isAr && cat.name_ar ? cat.name_ar : cat.name}</p>
                                  {cat.description && (
                                    <p className="text-[11px] text-muted-foreground truncate">{isAr && cat.description_ar ? cat.description_ar : cat.description}</p>
                                  )}
                                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                    {cat.max_participants && <span><Users className="inline h-2.5 w-2.5 me-0.5" />{cat.max_participants}</span>}
                                    <Badge variant="outline" className="text-[9px] h-4 px-1">{cat.gender === "male" ? (isAr ? "ذكور" : "Male") : cat.gender === "female" ? (isAr ? "إناث" : "Female") : (isAr ? "مختلط" : "Mixed")}</Badge>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {categories.length > 6 && (
                        <Button variant="ghost" size="sm" className="mt-3 w-full text-xs" onClick={() => setActiveSection("categories")}>
                          {isAr ? `عرض جميع الفئات (${categories.length})` : `View all categories (${categories.length})`}
                        </Button>
                      )}
                    </Section>
                  )}

                  {/* Sponsors */}
                  <CompetitionSponsorsPanel competitionId={competition.id} isOrganizer={isOrganizer} />
                </>
              )}

              {activeSection === "judges" && <JudgesList competitionId={competition.id} isOrganizer={!!isOrganizer} />}
              {activeSection === "contestants" && <ParticipantsList competitionId={competition.id} isOrganizer={!!isOrganizer} />}
              {activeSection === "categories" && <CategoryManagementPanel competitionId={competition.id} isOrganizer={isOrganizer} competitionStatus={competition.status} />}
              {activeSection === "criteria" && <CriteriaManagementPanel competitionId={competition.id} isOrganizer={isOrganizer} />}
              {activeSection === "live-scoring" && <LiveScoringDashboard competitionId={competition.id} isOrganizer={isOrganizer} />}
              {activeSection === "winners" && (
                hasWinners ? (
                  <CompetitionLeaderboard competitionId={competition.id} />
                ) : (
                  <Card className="border-primary/20">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-chart-4/10">
                        <Medal className="h-10 w-10 text-primary" />
                      </div>
                      <h3 className="font-serif text-lg font-bold mb-2">
                        {isAr ? "لم يتم إعلان الفائزين بعد" : "Winners Not Announced Yet"}
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        {isAr
                          ? "شارك لتكون من الفائزين بالميدالية الذهبية 🏅 سيتم الإعلان عن النتائج بعد انتهاء المسابقة والتحكيم."
                          : "Participate to be among the Gold Medal winners 🏅 Results will be announced after the competition and judging conclude."}
                      </p>
                      {canRegister && (
                        <Button className="mt-6 shadow-lg shadow-primary/20" onClick={() => { setShowRegistrationForm(true); setActiveSection("overview"); }}>
                          <Sparkles className="me-1.5 h-4 w-4" />
                          {isAr ? "سجّل الآن" : "Register Now"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              )}
              {activeSection === "team" && <CompetitionTeamPanel competitionId={competition.id} isOrganizer={isOrganizer} />}
              {activeSection === "knowledge" && canSeeKnowledge && <CompetitionKnowledgeTab competitionId={competition.id} isOrganizer={isOrganizer} />}
              {activeSection === "gallery" && <ReferenceGalleryPanel competitionId={competition.id} isAdmin={isOrganizer} />}
              {activeSection === "requirements" && user && <OrderCenterHub competitionId={competition.id} isOrganizer={!!isOrganizer} />}
              {isOrganizer && activeSection === "manage" && (
                <div className="space-y-4">
                  <CompetitionStatusManager competitionId={competition.id} currentStatus={competition.status} competitionTitle={title} />
                  <JudgeAssignmentPanel competitionId={competition.id} />
                  <RegistrationApprovalPanel competitionId={competition.id} />
                  {competition.status === "completed" && <AutoIssueCertificates competitionId={competition.id} />}

                  {/* Bulk Import Section */}
                  <Section icon={<FileSpreadsheet className="h-4 w-4 text-primary" />} title={isAr ? "استيراد جماعي من ملف إكسل" : "Bulk Import from Excel"} defaultOpen={false}>
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
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
                            onImportComplete={() => {
                              // Refresh relevant queries
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </Section>
                </div>
              )}
            </div>

            {/* ─── Sidebar ─── */}
            <div className="space-y-4">
              {/* Countdown */}
              {competition.status === "registration_open" && competition.registration_end && (
                <CompetitionCountdown targetDate={competition.registration_end} label="Registration Closes In" labelAr="ينتهي التسجيل خلال" />
              )}
              {["upcoming", "registration_open", "registration_closed"].includes(competition.status) && (
                <CompetitionCountdown targetDate={competition.competition_start} label="Competition Starts In" labelAr="تبدأ المسابقة خلال" />
              )}

              {/* Registration Card */}
              <Card className="overflow-hidden border-border/60 transition-shadow hover:shadow-md">
                <div className="border-b bg-gradient-to-r from-primary/5 to-transparent px-5 py-3.5">
                  <h3 className="flex items-center gap-2 font-semibold text-sm">
                    <Trophy className="h-4 w-4 text-primary" />
                    {isAr ? "التسجيل" : "Registration"}
                  </h3>
                </div>
                <CardContent className="p-5 space-y-3">
                  {myRegistration ? (
                    <div className="flex items-center gap-2 rounded-xl bg-primary/10 p-3">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-medium text-primary">
                        {myRegistration.status === "approved" ? t("alreadyRegistered") : t("registrationPending")}
                      </span>
                    </div>
                  ) : canRegister ? (
                    <Button className="w-full shadow-lg shadow-primary/20" onClick={() => setShowRegistrationForm(true)} disabled={showRegistrationForm}>
                      {t("registerNow")}
                    </Button>
                  ) : !user ? (
                    <Button asChild className="w-full" variant="outline">
                      <Link to="/login">{isAr ? "سجل الدخول للتسجيل" : "Sign in to Register"}</Link>
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center">{isAr ? "التسجيل مغلق حالياً" : "Registration is currently closed."}</p>
                  )}
                  {competition.registration_end && (
                    <p className="text-[10px] text-center text-muted-foreground">
                      {isAr ? "ينتهي التسجيل:" : "Deadline:"}{" "}
                      <span className="font-medium">{format(new Date(competition.registration_end), "MMM d, yyyy")}</span>
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Participant Stats */}
              <ParticipantStatsCard competitionId={competition.id} maxParticipants={competition.max_participants} />

              {/* Quick Info Card */}
              <Card className="overflow-hidden border-border/60">
                <div className="border-b bg-gradient-to-r from-accent/5 to-transparent px-5 py-3.5">
                  <h3 className="flex items-center gap-2 font-semibold text-sm">
                    <BookOpen className="h-4 w-4 text-primary" />
                    {isAr ? "معلومات سريعة" : "Quick Info"}
                  </h3>
                </div>
                <CardContent className="p-5 space-y-3">
                  {competition.country_code && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{isAr ? "الدولة" : "Country"}</span>
                      <span className="font-medium">{countryFlag(competition.country_code)} {competition.country}</span>
                    </div>
                  )}
                  {competition.edition_year && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{isAr ? "النسخة" : "Edition"}</span>
                      <span className="font-medium">{competition.edition_year}</span>
                    </div>
                  )}
                  {competition.max_participants && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{isAr ? "السعة" : "Capacity"}</span>
                      <span className="font-medium">{competition.max_participants}</span>
                    </div>
                  )}
                  {competition.is_virtual !== null && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{isAr ? "النوع" : "Format"}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {competition.is_virtual ? (isAr ? "افتراضية" : "Virtual") : (isAr ? "حضورية" : "In-Person")}
                      </Badge>
                    </div>
                  )}
                  {competition.registration_fee_type === "paid" && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{isAr ? "رسوم التسجيل" : "Entry Fee"}</span>
                      <span className="font-medium">{competition.registration_fee} {competition.registration_currency}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* QR Code */}
              {qrCode && (
                <QRCodeDisplay
                  code={qrCode.code}
                  label={isAr ? "رمز QR للمسابقة" : "Competition QR Code"}
                  size={140}
                  compact={false}
                />
              )}

              {/* Organizer - uses exhibition's organizer when linked */}
              <OrganizerCard organizerId={competition.organizer_id} exhibitionId={competition.exhibition_id} />

              {/* Activity Feed */}
              <CompetitionActivityFeed competitionId={competition.id} isOrganizer={!!isOrganizer} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
