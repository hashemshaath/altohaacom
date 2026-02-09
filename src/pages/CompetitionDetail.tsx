import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  Calendar,
  MapPin,
  Users,
  Globe,
  Trophy,
  ArrowLeft,
  CheckCircle,
  Settings,
  Pencil,
  Award,
  BookOpen,
  ClipboardList,
  Clock,
  Share2,
  ImageIcon,
  Twitter,
  Facebook,
  Linkedin,
  Link2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import { RequirementsListPanel } from "@/components/competitions/RequirementsListPanel";
import { CategoryManagementPanel } from "@/components/competitions/CategoryManagementPanel";
import { CompetitionTeamPanel } from "@/components/competitions/CompetitionTeamPanel";
import { ReferenceGalleryPanel } from "@/components/competitions/ReferenceGalleryPanel";
import { RubricTemplatesPanel } from "@/components/competitions/RubricTemplatesPanel";
import { CriteriaManagementPanel } from "@/components/competitions/CriteriaManagementPanel";
import { CompetitionCountdown } from "@/components/competitions/CompetitionCountdown";
import { ParticipantStatsCard } from "@/components/competitions/ParticipantStatsCard";
import { OrganizerCard } from "@/components/competitions/OrganizerCard";
import { CompetitionActivityFeed } from "@/components/competitions/CompetitionActivityFeed";
import type { Database } from "@/integrations/supabase/types";

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted/60 text-muted-foreground/50">{icon}</div>
      <p className="text-sm text-muted-foreground max-w-xs">{text}</p>
    </div>
  );
}

type CompetitionStatus = Database["public"]["Enums"]["competition_status"];

const statusColors: Record<CompetitionStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  upcoming: "bg-accent text-accent-foreground",
  registration_open: "bg-primary/15 text-primary",
  registration_closed: "bg-muted text-muted-foreground",
  in_progress: "bg-chart-3/15 text-chart-3",
  judging: "bg-chart-4/15 text-chart-4",
  completed: "bg-chart-5/15 text-chart-5",
  cancelled: "bg-destructive/15 text-destructive",
};

export default function CompetitionDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const isAr = language === "ar";

  const { data: competition, isLoading } = useQuery({
    queryKey: ["competition", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: categories } = useQuery({
    queryKey: ["competition-categories", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_categories")
        .select("*")
        .eq("competition_id", id)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: criteria } = useQuery({
    queryKey: ["judging-criteria", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("judging_criteria")
        .select("*")
        .eq("competition_id", id)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: myRegistration } = useQuery({
    queryKey: ["my-registration", id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("competition_registrations")
        .select("*")
        .eq("competition_id", id)
        .eq("participant_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!id && !!user,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="container flex-1 py-6 md:py-8">
          <Skeleton className="mb-4 h-7 w-36 rounded-md" />
          <Skeleton className="h-48 w-full rounded-xl sm:h-56 md:h-72" />
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
            <div className="hidden lg:block space-y-4">
              <Card className="overflow-hidden">
                <div className="border-b bg-muted/30 px-4 py-3">
                  <Skeleton className="h-4 w-28" />
                </div>
                <div className="space-y-3 p-4">
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              </Card>
              <Card className="overflow-hidden">
                <div className="border-b bg-muted/30 px-4 py-3">
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="space-y-3 p-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </Card>
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
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/60">
            <Trophy className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="font-semibold">{isAr ? "المسابقة غير موجودة" : "Competition not found"}</p>
          <p className="mt-1 text-sm text-muted-foreground">{isAr ? "تحقق من الرابط وحاول مرة أخرى" : "Check the link and try again"}</p>
          <Button asChild variant="outline" size="sm" className="mt-5">
            <Link to="/competitions">
              <ArrowLeft className="me-1.5 h-4 w-4" />
              {isAr ? "العودة" : "Back to Competitions"}
            </Link>
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

  const getStatusLabel = (status: CompetitionStatus): string => {
    const labels: Record<CompetitionStatus, string> = {
      draft: t("draft"),
      upcoming: t("upcoming"),
      registration_open: t("registrationOpen"),
      registration_closed: t("registrationClosed"),
      in_progress: t("inProgress"),
      judging: t("judging"),
      completed: t("completed"),
      cancelled: t("cancelled"),
    };
    return labels[status];
  };

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
            : {
                "@type": "Place",
                name: venue || undefined,
                address: {
                  "@type": "PostalAddress",
                  addressLocality: competition.city,
                  addressCountry: competition.country,
                },
              },
          image: competition.cover_image_url || undefined,
          eventStatus: "https://schema.org/EventScheduled",
        }}
      />
      <Header />

      <main className="container flex-1 py-6 md:py-8">
        {/* Back Button */}
        <Button variant="ghost" size="sm" asChild className="mb-4 -ms-2">
          <Link to="/competitions">
            <ArrowLeft className="me-1.5 h-4 w-4" />
            {t("competitionsPage")}
          </Link>
        </Button>

        {/* Hero Section */}
        <div className="relative mb-6 overflow-hidden rounded-xl">
          {competition.cover_image_url ? (
            <img
              src={competition.cover_image_url}
              alt={title}
              className="h-48 w-full object-cover sm:h-56 md:h-72 lg:h-80"
              loading="eager"
            />
          ) : (
            <div className="flex h-48 items-center justify-center bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 sm:h-56 md:h-72 lg:h-80">
              <Trophy className="h-20 w-20 text-primary/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 p-4 md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={statusColors[competition.status as CompetitionStatus]}>
                    {getStatusLabel(competition.status as CompetitionStatus)}
                  </Badge>
                  {competition.competition_number && (
                    <Badge variant="outline" className="font-mono text-xs">
                      {competition.competition_number}
                    </Badge>
                  )}
                </div>
                <h1 className="font-serif text-xl font-bold sm:text-2xl md:text-3xl lg:text-4xl leading-tight">
                  {title}
                </h1>
                {/* Inline meta on hero */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(competition.competition_start), "MMM d")} –{" "}
                    {format(new Date(competition.competition_end), "MMM d, yyyy")}
                  </span>
                  {competition.is_virtual ? (
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {t("virtual")}
                    </span>
                  ) : (
                    (venue || competition.city) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {venue || competition.city}
                      </span>
                    )
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Share2 className="me-1.5 h-4 w-4" />
                      {isAr ? "مشاركة" : "Share"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => {
                      const text = encodeURIComponent(`${title} - ${isAr ? "مسابقة على التوحاء" : "Competition on Altohaa"}`);
                      const url = encodeURIComponent(window.location.href);
                      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank", "width=600,height=400");
                    }}>
                      <Twitter className="h-4 w-4" /> Twitter / X
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => {
                      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, "_blank", "width=600,height=400");
                    }}>
                      <Facebook className="h-4 w-4" /> Facebook
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => {
                      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, "_blank", "width=600,height=400");
                    }}>
                      <Linkedin className="h-4 w-4" /> LinkedIn
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast({ title: isAr ? "تم نسخ الرابط!" : "Link copied!" });
                    }}>
                      <Link2 className="h-4 w-4" /> {isAr ? "نسخ الرابط" : "Copy Link"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {competition.status === "completed" && (
                  <Button asChild variant="secondary" size="sm">
                    <Link to={`/competitions/${id}/results`}>
                      <Award className="me-1.5 h-4 w-4" />
                      {isAr ? "النتائج" : "Results"}
                    </Link>
                  </Button>
                )}
                {isOrganizer && (
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/competitions/${id}/edit`}>
                      <Pencil className="me-1.5 h-4 w-4" />
                      {isAr ? "تعديل" : "Edit"}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Inline Registration Form */}
        {showRegistrationForm && (
          <div className="mb-6">
            <RegistrationForm
              competitionId={competition.id}
              competitionTitle={title}
              categories={categories || []}
              onCancel={() => setShowRegistrationForm(false)}
              onSuccess={() => setShowRegistrationForm(false)}
            />
          </div>
        )}

        {/* Mobile registration CTA + details */}
        <div className="mb-6 space-y-3 lg:hidden">
          {canRegister && !showRegistrationForm && (
            <Button className="w-full" onClick={() => setShowRegistrationForm(true)}>
              {t("registerNow")}
            </Button>
          )}
          {myRegistration && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex items-center gap-2 p-3">
                <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium text-primary">
                  {myRegistration.status === "approved"
                    ? t("alreadyRegistered")
                    : t("registrationPending")}
                </span>
              </CardContent>
            </Card>
          )}

          {/* Mobile key details */}
          <Card className="overflow-hidden">
            <CardContent className="flex flex-wrap gap-x-6 gap-y-2 p-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  {format(new Date(competition.competition_start), "MMM d")} – {format(new Date(competition.competition_end), "MMM d, yyyy")}
                </span>
              </div>
              {competition.is_virtual ? (
                <div className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{t("virtual")}</span>
                </div>
              ) : venue ? (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{venue}{competition.city && `, ${competition.city}`}</span>
                </div>
              ) : null}
              {competition.max_participants && (
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{isAr ? `الحد الأقصى ${competition.max_participants}` : `Max ${competition.max_participants}`}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                <TabsList className="h-auto w-max justify-start gap-0.5 bg-muted/50 p-1">
                  <TabsTrigger value="overview" className="text-xs sm:text-sm">
                    {isAr ? "نظرة عامة" : "Overview"}
                  </TabsTrigger>
                  <TabsTrigger value="participants" className="gap-1 text-xs sm:text-sm">
                    <Users className="h-3.5 w-3.5 hidden sm:block" />
                    {isAr ? "المشاركين" : "Participants"}
                  </TabsTrigger>
                  <TabsTrigger value="categories" className="text-xs sm:text-sm">
                    {t("categories")}
                  </TabsTrigger>
                  <TabsTrigger value="criteria" className="text-xs sm:text-sm">
                    {t("criteria")}
                  </TabsTrigger>
                  <TabsTrigger value="leaderboard" className="gap-1 text-xs sm:text-sm">
                    <Trophy className="h-3.5 w-3.5 hidden sm:block" />
                    {isAr ? "المتصدرين" : "Leaderboard"}
                  </TabsTrigger>
                  <TabsTrigger value="team" className="gap-1 text-xs sm:text-sm">
                    <Users className="h-3.5 w-3.5 hidden sm:block" />
                    {isAr ? "الفريق" : "Team"}
                  </TabsTrigger>
                  <TabsTrigger value="knowledge" className="gap-1 text-xs sm:text-sm">
                    <BookOpen className="h-3.5 w-3.5 hidden sm:block" />
                    {isAr ? "المعرفة" : "Knowledge"}
                  </TabsTrigger>
                  <TabsTrigger value="gallery" className="gap-1 text-xs sm:text-sm">
                    <ImageIcon className="h-3.5 w-3.5 hidden sm:block" />
                    {isAr ? "المعرض" : "Gallery"}
                  </TabsTrigger>
                  {isOrganizer && (
                    <TabsTrigger value="requirements" className="gap-1 text-xs sm:text-sm">
                      <ClipboardList className="h-3.5 w-3.5 hidden sm:block" />
                      {isAr ? "المتطلبات" : "Requirements"}
                    </TabsTrigger>
                  )}
                  {isOrganizer && (
                    <TabsTrigger value="manage" className="gap-1 text-xs sm:text-sm">
                      <Settings className="h-3.5 w-3.5 hidden sm:block" />
                      {isAr ? "إدارة" : "Manage"}
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              <TabsContent value="overview" className="mt-6 space-y-6">
                {description && (
                  <Card>
                    <CardContent className="prose prose-sm max-w-none p-4 md:p-6 dark:prose-invert">
                      <p className="whitespace-pre-wrap">{description}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Registration Timeline */}
                {(competition.registration_start || competition.registration_end) && (
                  <Card className="overflow-hidden">
                    <div className="border-b bg-muted/30 px-4 py-3">
                      <h3 className="flex items-center gap-2 font-semibold text-sm">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                        </div>
                        {isAr ? "الجدول الزمني" : "Timeline"}
                      </h3>
                    </div>
                    <CardContent className="p-4">
                      <div className="relative border-s-2 border-border ps-6 space-y-6">
                        {competition.registration_start && (
                          <div className="relative">
                            <div className="absolute -start-[29px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-background" />
                            <p className="text-xs text-muted-foreground">{isAr ? "بداية التسجيل" : "Registration Opens"}</p>
                            <p className="text-sm font-medium">{format(new Date(competition.registration_start), "MMMM d, yyyy")}</p>
                          </div>
                        )}
                        {competition.registration_end && (
                          <div className="relative">
                            <div className="absolute -start-[29px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-chart-4 bg-background" />
                            <p className="text-xs text-muted-foreground">{isAr ? "نهاية التسجيل" : "Registration Closes"}</p>
                            <p className="text-sm font-medium">{format(new Date(competition.registration_end), "MMMM d, yyyy")}</p>
                          </div>
                        )}
                        <div className="relative">
                          <div className="absolute -start-[29px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-chart-3 bg-background" />
                          <p className="text-xs text-muted-foreground">{isAr ? "بداية المسابقة" : "Competition Starts"}</p>
                          <p className="text-sm font-medium">{format(new Date(competition.competition_start), "MMMM d, yyyy 'at' h:mm a")}</p>
                        </div>
                        <div className="relative">
                          <div className="absolute -start-[29px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-chart-5 bg-background" />
                          <p className="text-xs text-muted-foreground">{isAr ? "نهاية المسابقة" : "Competition Ends"}</p>
                          <p className="text-sm font-medium">{format(new Date(competition.competition_end), "MMMM d, yyyy 'at' h:mm a")}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Rules Summary */}
                {(competition.rules_summary || competition.rules_summary_ar) && (
                  <Card className="overflow-hidden">
                    <div className="border-b bg-muted/30 px-4 py-3">
                      <h3 className="flex items-center gap-2 font-semibold text-sm">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-chart-4/10">
                          <BookOpen className="h-3.5 w-3.5 text-chart-4" />
                        </div>
                        {isAr ? "القواعد والشروط" : "Rules & Regulations"}
                      </h3>
                    </div>
                    <CardContent className="p-4 md:p-6">
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {isAr && competition.rules_summary_ar ? competition.rules_summary_ar : competition.rules_summary}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Scoring Notes */}
                {(competition.scoring_notes || competition.scoring_notes_ar) && (
                  <Card className="overflow-hidden">
                    <div className="border-b bg-muted/30 px-4 py-3">
                      <h3 className="flex items-center gap-2 font-semibold text-sm">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-chart-3/10">
                          <ClipboardList className="h-3.5 w-3.5 text-chart-3" />
                        </div>
                        {isAr ? "ملاحظات التقييم" : "Scoring Methodology"}
                      </h3>
                    </div>
                    <CardContent className="p-4 md:p-6">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed text-muted-foreground">
                        {isAr && competition.scoring_notes_ar ? competition.scoring_notes_ar : competition.scoring_notes}
                      </p>
                      {criteria && criteria.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {criteria.map((crit) => (
                            <div key={crit.id} className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                                {(Number(crit.weight) * 100).toFixed(0)}%
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium">{isAr && crit.name_ar ? crit.name_ar : crit.name}</p>
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {isAr && crit.description_ar ? crit.description_ar : crit.description}
                                </p>
                              </div>
                              <Badge variant="outline" className="ms-auto shrink-0 text-[10px]">
                                {isAr ? "الأقصى" : "Max"}: {crit.max_score}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Categories Quick View */}
                {categories && categories.length > 0 && (
                  <Card className="overflow-hidden">
                    <div className="border-b bg-muted/30 px-4 py-3 flex items-center justify-between">
                      <h3 className="flex items-center gap-2 font-semibold text-sm">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                          <Trophy className="h-3.5 w-3.5 text-primary" />
                        </div>
                        {isAr ? "الفئات" : "Categories"}
                        <Badge variant="secondary" className="ms-1">{categories.length}</Badge>
                      </h3>
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => setActiveTab("categories")}>
                        {isAr ? "عرض الكل" : "View All"}
                      </Button>
                    </div>
                    <CardContent className="p-4">
                      <div className="grid gap-2 sm:grid-cols-2">
                        {categories.slice(0, 6).map((cat) => (
                          <div key={cat.id} className="flex items-center gap-3 rounded-lg border p-2.5">
                            {cat.cover_image_url ? (
                              <img src={cat.cover_image_url} alt={cat.name} className="h-10 w-10 rounded-md object-cover shrink-0" />
                            ) : (
                              <div className="h-10 w-10 rounded-md bg-primary/5 flex items-center justify-center shrink-0">
                                <Trophy className="h-4 w-4 text-primary/30" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{isAr && cat.name_ar ? cat.name_ar : cat.name}</p>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                {cat.max_participants && <span><Users className="inline h-2.5 w-2.5 me-0.5" />{cat.max_participants}</span>}
                                <Badge variant="outline" className="text-[9px] h-4 px-1">{cat.gender === "male" ? (isAr ? "ذكور" : "Male") : cat.gender === "female" ? (isAr ? "إناث" : "Female") : (isAr ? "مختلط" : "Mixed")}</Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {categories.length > 6 && (
                        <p className="text-xs text-center text-muted-foreground mt-3">
                          {isAr ? `+${categories.length - 6} فئات أخرى` : `+${categories.length - 6} more categories`}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Sponsors */}
                <CompetitionSponsorsPanel competitionId={competition.id} isOrganizer={isOrganizer} />

                {/* Judges Panel */}
                <JudgesList competitionId={competition.id} />
              </TabsContent>

              <TabsContent value="participants" className="mt-6">
                <ParticipantsList competitionId={competition.id} />
              </TabsContent>

              <TabsContent value="categories" className="mt-6">
                <CategoryManagementPanel
                  competitionId={competition.id}
                  isOrganizer={isOrganizer}
                  competitionStatus={competition.status}
                />
              </TabsContent>

              <TabsContent value="criteria" className="mt-6">
                <CriteriaManagementPanel
                  competitionId={competition.id}
                  isOrganizer={isOrganizer}
                />
              </TabsContent>

              <TabsContent value="leaderboard" className="mt-6">
                <CompetitionLeaderboard competitionId={competition.id} />
              </TabsContent>

              <TabsContent value="team" className="mt-6">
                <CompetitionTeamPanel competitionId={competition.id} isOrganizer={isOrganizer} />
              </TabsContent>

              <TabsContent value="knowledge" className="mt-6">
                <CompetitionKnowledgeTab competitionId={competition.id} isOrganizer={isOrganizer} />
              </TabsContent>

              <TabsContent value="gallery" className="mt-6 space-y-6">
                <ReferenceGalleryPanel competitionId={competition.id} isAdmin={isOrganizer} />
                {isOrganizer && <RubricTemplatesPanel competitionId={competition.id} isAdmin={isOrganizer} />}
              </TabsContent>

              {isOrganizer && (
                <TabsContent value="requirements" className="mt-6">
                  <RequirementsListPanel competitionId={competition.id} isOrganizer={isOrganizer} />
                </TabsContent>
              )}

              {isOrganizer && (
                <TabsContent value="manage" className="mt-6 space-y-8">
                  <CompetitionStatusManager
                    competitionId={competition.id}
                    currentStatus={competition.status}
                    competitionTitle={title}
                  />
                  <JudgeAssignmentPanel competitionId={competition.id} />
                  <RegistrationApprovalPanel competitionId={competition.id} />
                  {competition.status === "completed" && (
                    <AutoIssueCertificates competitionId={competition.id} />
                  )}
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="hidden space-y-4 lg:block">
            {/* Countdown */}
            {competition.status === "registration_open" && competition.registration_end && (
              <CompetitionCountdown
                targetDate={competition.registration_end}
                label="Registration Closes In"
                labelAr="ينتهي التسجيل خلال"
              />
            )}
            {["upcoming", "registration_open", "registration_closed"].includes(competition.status) && (
              <CompetitionCountdown
                targetDate={competition.competition_start}
                label="Competition Starts In"
                labelAr="تبدأ المسابقة خلال"
              />
            )}
            <Card className="overflow-hidden">
              <div className="border-b bg-muted/30 px-4 py-3">
                <h3 className="flex items-center gap-2 font-semibold text-sm">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                    <Trophy className="h-3.5 w-3.5 text-primary" />
                  </div>
                  {t("registerForCompetition")}
                </h3>
              </div>
              <CardContent className="p-4 space-y-3">
                {myRegistration ? (
                  <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-3">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm font-medium text-primary">
                      {myRegistration.status === "approved"
                        ? t("alreadyRegistered")
                        : t("registrationPending")}
                    </span>
                  </div>
                ) : canRegister ? (
                  <Button
                    className="w-full"
                    onClick={() => setShowRegistrationForm(true)}
                    disabled={showRegistrationForm}
                  >
                    {t("registerNow")}
                  </Button>
                ) : !user ? (
                  <Button asChild className="w-full" variant="outline">
                    <Link to="/auth">
                      {isAr ? "سجل الدخول للتسجيل" : "Sign in to Register"}
                    </Link>
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {isAr ? "التسجيل مغلق حالياً" : "Registration is currently closed."}
                  </p>
                )}

                {competition.registration_end && (
                  <p className="text-[10px] text-center text-muted-foreground">
                    {isAr ? "ينتهي التسجيل:" : "Registration ends:"}{" "}
                    <span className="font-medium">{format(new Date(competition.registration_end), "MMM d, yyyy")}</span>
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Details Card */}
            <Card className="overflow-hidden">
              <div className="border-b bg-muted/30 px-4 py-3">
                <h3 className="flex items-center gap-2 font-semibold text-sm">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/10">
                    <Calendar className="h-3.5 w-3.5 text-accent-foreground" />
                  </div>
                  {isAr ? "التفاصيل" : "Details"}
                </h3>
              </div>
              <CardContent className="p-0">
                {competition.competition_number && (
                  <>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <Trophy className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{isAr ? "رقم المسابقة" : "Competition No."}</p>
                        <p className="text-sm font-mono font-medium">{competition.competition_number}</p>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}
                <div className="flex items-center gap-3 px-4 py-3">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("startDate")}</p>
                    <p className="text-sm font-medium">
                      {format(new Date(competition.competition_start), "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <Separator />

                <div className="flex items-center gap-3 px-4 py-3">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("endDate")}</p>
                    <p className="text-sm font-medium">
                      {format(new Date(competition.competition_end), "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <Separator />

                {competition.is_virtual ? (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("venue")}</p>
                      <p className="text-sm font-medium">{t("virtual")}</p>
                    </div>
                  </div>
                ) : venue ? (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("venue")}</p>
                      <p className="text-sm font-medium">
                        {venue}
                        {competition.city && <>, {competition.city}</>}
                        {competition.country && <>, {competition.country}</>}
                      </p>
                    </div>
                  </div>
                ) : null}

                {competition.max_participants && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-3 px-4 py-3">
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("participants")}</p>
                        <p className="text-sm font-medium">
                          {isAr ? `الحد الأقصى ${competition.max_participants}` : `Max ${competition.max_participants}`}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Participant Stats */}
            <ParticipantStatsCard competitionId={competition.id} maxParticipants={competition.max_participants} />

            {/* Organizer */}
            <OrganizerCard organizerId={competition.organizer_id} />

            {/* Activity Feed */}
            <CompetitionActivityFeed competitionId={competition.id} isOrganizer={!!isOrganizer} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}