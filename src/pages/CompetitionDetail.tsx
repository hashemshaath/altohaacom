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
} from "lucide-react";
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
import type { Database } from "@/integrations/supabase/types";

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 rounded-full bg-muted p-3 text-muted-foreground">{icon}</div>
      <p className="text-sm text-muted-foreground">{text}</p>
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
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-8">
          <Skeleton className="mb-4 h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-8 text-center">
          <Trophy className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">{language === "ar" ? "المسابقة غير موجودة" : "Competition not found"}</p>
          <Button asChild className="mt-4" variant="outline">
            <Link to="/competitions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {language === "ar" ? "العودة" : "Back to Competitions"}
            </Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const title = language === "ar" && competition.title_ar ? competition.title_ar : competition.title;
  const description = language === "ar" && competition.description_ar ? competition.description_ar : competition.description;
  const venue = language === "ar" && competition.venue_ar ? competition.venue_ar : competition.venue;

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
    <div className="flex min-h-screen flex-col">
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
                <Badge className={statusColors[competition.status as CompetitionStatus]}>
                  {getStatusLabel(competition.status as CompetitionStatus)}
                </Badge>
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
                {competition.status === "completed" && (
                  <Button asChild variant="secondary" size="sm">
                    <Link to={`/competitions/${id}/results`}>
                      <Award className="me-1.5 h-4 w-4" />
                      {language === "ar" ? "النتائج" : "Results"}
                    </Link>
                  </Button>
                )}
                {isOrganizer && (
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/competitions/${id}/edit`}>
                      <Pencil className="me-1.5 h-4 w-4" />
                      {language === "ar" ? "تعديل" : "Edit"}
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

        {/* Mobile registration CTA */}
        {canRegister && !showRegistrationForm && (
          <div className="mb-6 lg:hidden">
            <Button className="w-full" onClick={() => setShowRegistrationForm(true)}>
              {t("registerNow")}
            </Button>
          </div>
        )}
        {myRegistration && (
          <div className="mb-6 lg:hidden">
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
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                <TabsList className="h-auto w-max justify-start gap-0.5 bg-muted/50 p-1">
                  <TabsTrigger value="overview" className="text-xs sm:text-sm">
                    {language === "ar" ? "نظرة عامة" : "Overview"}
                  </TabsTrigger>
                  <TabsTrigger value="participants" className="gap-1 text-xs sm:text-sm">
                    <Users className="h-3.5 w-3.5 hidden sm:block" />
                    {language === "ar" ? "المشاركين" : "Participants"}
                  </TabsTrigger>
                  <TabsTrigger value="categories" className="text-xs sm:text-sm">
                    {t("categories")}
                  </TabsTrigger>
                  <TabsTrigger value="criteria" className="text-xs sm:text-sm">
                    {t("criteria")}
                  </TabsTrigger>
                  <TabsTrigger value="leaderboard" className="gap-1 text-xs sm:text-sm">
                    <Trophy className="h-3.5 w-3.5 hidden sm:block" />
                    {language === "ar" ? "المتصدرين" : "Leaderboard"}
                  </TabsTrigger>
                  <TabsTrigger value="knowledge" className="gap-1 text-xs sm:text-sm">
                    <BookOpen className="h-3.5 w-3.5 hidden sm:block" />
                    {language === "ar" ? "المعرفة" : "Knowledge"}
                  </TabsTrigger>
                  {isOrganizer && (
                    <TabsTrigger value="requirements" className="gap-1 text-xs sm:text-sm">
                      <ClipboardList className="h-3.5 w-3.5 hidden sm:block" />
                      {language === "ar" ? "المتطلبات" : "Requirements"}
                    </TabsTrigger>
                  )}
                  {isOrganizer && (
                    <TabsTrigger value="manage" className="gap-1 text-xs sm:text-sm">
                      <Settings className="h-3.5 w-3.5 hidden sm:block" />
                      {language === "ar" ? "إدارة" : "Manage"}
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

                {/* Sponsors */}
                <CompetitionSponsorsPanel competitionId={competition.id} isOrganizer={isOrganizer} />

                {/* Judges Panel */}
                <JudgesList competitionId={competition.id} />
              </TabsContent>

              <TabsContent value="participants" className="mt-6">
                <ParticipantsList competitionId={competition.id} />
              </TabsContent>

              <TabsContent value="categories" className="mt-6">
                {categories && categories.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {categories.map((cat) => (
                      <Card key={cat.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">
                            {language === "ar" && cat.name_ar ? cat.name_ar : cat.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                          {language === "ar" && cat.description_ar ? cat.description_ar : cat.description}
                          {cat.max_participants && (
                            <p className="mt-2 flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {language === "ar" ? `الحد الأقصى ${cat.max_participants}` : `Max ${cat.max_participants} participants`}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Users className="h-6 w-6" />}
                    text={language === "ar" ? "لم يتم تحديد فئات بعد" : "No categories defined yet."}
                  />
                )}
              </TabsContent>

              <TabsContent value="criteria" className="mt-6">
                {criteria && criteria.length > 0 ? (
                  <div className="space-y-3">
                    {criteria.map((crit) => (
                      <Card key={crit.id}>
                        <CardContent className="flex items-start justify-between gap-4 p-4">
                          <div className="min-w-0">
                            <h4 className="font-medium text-sm">
                              {language === "ar" && crit.name_ar ? crit.name_ar : crit.name}
                            </h4>
                            {(crit.description || crit.description_ar) && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {language === "ar" && crit.description_ar ? crit.description_ar : crit.description}
                              </p>
                            )}
                          </div>
                          <div className="shrink-0 text-end space-y-1">
                            <Badge variant="outline" className="text-xs">
                              {language === "ar" ? "الأقصى" : "Max"}: {crit.max_score}
                            </Badge>
                            <p className="text-[11px] text-muted-foreground">
                              {language === "ar" ? "الوزن" : "Weight"}: {(Number(crit.weight) * 100).toFixed(0)}%
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<ClipboardList className="h-6 w-6" />}
                    text={language === "ar" ? "لم يتم تحديد معايير بعد" : "No judging criteria defined yet."}
                  />
                )}
              </TabsContent>

              <TabsContent value="leaderboard" className="mt-6">
                <CompetitionLeaderboard competitionId={competition.id} />
              </TabsContent>

              <TabsContent value="knowledge" className="mt-6">
                <CompetitionKnowledgeTab competitionId={competition.id} isOrganizer={isOrganizer} />
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
            {/* Registration Card */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-sm">{t("registerForCompetition")}</h3>
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
                      {language === "ar" ? "سجل الدخول للتسجيل" : "Sign in to Register"}
                    </Link>
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {language === "ar" ? "التسجيل مغلق حالياً" : "Registration is currently closed."}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Details Card */}
            <Card>
              <CardContent className="p-4 space-y-0">
                <h3 className="font-semibold text-sm mb-3">
                  {language === "ar" ? "التفاصيل" : "Details"}
                </h3>

                <div className="flex items-center gap-3 py-2.5">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{t("startDate")}</p>
                    <p className="text-sm font-medium">
                      {format(new Date(competition.competition_start), "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <Separator />

                <div className="flex items-center gap-3 py-2.5">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{t("endDate")}</p>
                    <p className="text-sm font-medium">
                      {format(new Date(competition.competition_end), "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <Separator />

                {competition.is_virtual ? (
                  <div className="flex items-center gap-3 py-2.5">
                    <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t("venue")}</p>
                      <p className="text-sm font-medium">{t("virtual")}</p>
                    </div>
                  </div>
                ) : venue ? (
                  <div className="flex items-center gap-3 py-2.5">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{t("venue")}</p>
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
                    <div className="flex items-center gap-3 py-2.5">
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t("participants")}</p>
                        <p className="text-sm font-medium">
                          {language === "ar" ? `الحد الأقصى ${competition.max_participants}` : `Max ${competition.max_participants}`}
                        </p>
                      </div>
                    </div>
                  </>
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
