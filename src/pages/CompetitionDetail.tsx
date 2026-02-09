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
import { Calendar, MapPin, Users, Globe, Trophy, ArrowLeft, CheckCircle, Settings, Pencil, Award, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { CompetitionStatusManager } from "@/components/competitions/CompetitionStatusManager";
import { RegistrationForm } from "@/components/competitions/RegistrationDialog";
import { RegistrationApprovalPanel } from "@/components/competitions/RegistrationApprovalPanel";
import { JudgeAssignmentPanel } from "@/components/competitions/JudgeAssignmentPanel";
import { CompetitionLeaderboard } from "@/components/competitions/CompetitionLeaderboard";
import { ParticipantsList } from "@/components/competitions/ParticipantsList";
import { JudgesList } from "@/components/competitions/JudgesList";
import { CompetitionKnowledgeTab } from "@/components/competitions/CompetitionKnowledgeTab";
import type { Database } from "@/integrations/supabase/types";

type CompetitionStatus = Database["public"]["Enums"]["competition_status"];

const statusColors: Record<CompetitionStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  upcoming: "bg-accent/20 text-accent",
  registration_open: "bg-primary/20 text-primary",
  registration_closed: "bg-muted text-muted-foreground",
  in_progress: "bg-chart-3/20 text-chart-3",
  judging: "bg-chart-4/20 text-chart-4",
  completed: "bg-chart-5/20 text-chart-5",
  cancelled: "bg-destructive/20 text-destructive",
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
          <Skeleton className="h-64 w-full rounded-lg" />
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
          <p className="text-muted-foreground">Competition not found</p>
          <Button asChild className="mt-4">
            <Link to="/competitions">Back to Competitions</Link>
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
      <Header />
      
      <main className="container flex-1 py-8">
        {/* Back Button */}
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/competitions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("competitionsPage")}
          </Link>
        </Button>

        {/* Hero Section */}
        <div className="relative mb-8 overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
          {competition.cover_image_url ? (
            <img
              src={competition.cover_image_url}
              alt={title}
              className="h-64 w-full object-cover md:h-80"
            />
          ) : (
            <div className="flex h-64 items-center justify-center md:h-80">
              <Trophy className="h-24 w-24 text-primary/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-start justify-between">
              <div>
                <Badge className={`mb-2 ${statusColors[competition.status as CompetitionStatus]}`}>
                  {getStatusLabel(competition.status as CompetitionStatus)}
                </Badge>
                <h1 className="font-serif text-3xl font-bold md:text-4xl">{title}</h1>
              </div>
              <div className="flex gap-2">
                {competition.status === "completed" && (
                  <Button asChild variant="secondary" size="sm">
                    <Link to={`/competitions/${id}/results`}>
                      <Award className="mr-2 h-4 w-4" />
                      {language === "ar" ? "النتائج" : "Results"}
                    </Link>
                  </Button>
                )}
                {isOrganizer && (
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/competitions/${id}/edit`}>
                      <Pencil className="mr-2 h-4 w-4" />
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
          <div className="mb-8">
            <RegistrationForm
              competitionId={competition.id}
              competitionTitle={title}
              categories={categories || []}
              onCancel={() => setShowRegistrationForm(false)}
              onSuccess={() => setShowRegistrationForm(false)}
            />
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="flex-wrap">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="participants" className="gap-1">
                  <Users className="h-4 w-4" />
                  {language === "ar" ? "المشاركين" : "Participants"}
                </TabsTrigger>
                <TabsTrigger value="categories">{t("categories")}</TabsTrigger>
                <TabsTrigger value="criteria">{t("criteria")}</TabsTrigger>
                <TabsTrigger value="leaderboard" className="gap-1">
                  <Trophy className="h-4 w-4" />
                  {language === "ar" ? "المتصدرين" : "Leaderboard"}
                </TabsTrigger>
                <TabsTrigger value="knowledge" className="gap-1">
                  <BookOpen className="h-4 w-4" />
                  {language === "ar" ? "قاعدة المعرفة" : "Knowledge"}
                </TabsTrigger>
                {isOrganizer && (
                  <TabsTrigger value="manage" className="gap-1">
                    <Settings className="h-4 w-4" />
                    {language === "ar" ? "إدارة" : "Manage"}
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-6">
                {description && (
                  <Card>
                    <CardContent className="prose prose-sm max-w-none p-6 dark:prose-invert">
                      <p className="whitespace-pre-wrap">{description}</p>
                    </CardContent>
                  </Card>
                )}
                
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
                          <CardTitle className="text-lg">
                            {language === "ar" && cat.name_ar ? cat.name_ar : cat.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                          {language === "ar" && cat.description_ar
                            ? cat.description_ar
                            : cat.description}
                          {cat.max_participants && (
                            <p className="mt-2">
                              <Users className="mr-1 inline h-4 w-4" />
                              Max {cat.max_participants} participants
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No categories defined yet.</p>
                )}
              </TabsContent>

              <TabsContent value="criteria" className="mt-6">
                {criteria && criteria.length > 0 ? (
                  <div className="space-y-4">
                    {criteria.map((crit) => (
                      <Card key={crit.id}>
                        <CardContent className="flex items-start justify-between p-4">
                          <div>
                            <h4 className="font-medium">
                              {language === "ar" && crit.name_ar ? crit.name_ar : crit.name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {language === "ar" && crit.description_ar
                                ? crit.description_ar
                                : crit.description}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">Max: {crit.max_score}</Badge>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Weight: {(Number(crit.weight) * 100).toFixed(0)}%
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No judging criteria defined yet.</p>
                )}
              </TabsContent>

              <TabsContent value="leaderboard" className="mt-6">
                <CompetitionLeaderboard competitionId={competition.id} />
              </TabsContent>

              <TabsContent value="knowledge" className="mt-6">
                <CompetitionKnowledgeTab competitionId={competition.id} isOrganizer={isOrganizer} />
              </TabsContent>

              {isOrganizer && (
                <TabsContent value="manage" className="mt-6 space-y-8">
                  <CompetitionStatusManager
                    competitionId={competition.id}
                    currentStatus={competition.status}
                    competitionTitle={title}
                  />
                  <JudgeAssignmentPanel competitionId={competition.id} />
                  <RegistrationApprovalPanel competitionId={competition.id} />
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("registerForCompetition")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {myRegistration ? (
                  <div className="flex items-center gap-2 text-primary">
                    <CheckCircle className="h-5 w-5" />
                    <span>
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
                  <Button asChild className="w-full">
                    <Link to="/auth">{t("signIn")} to Register</Link>
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Registration is currently closed.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t("startDate")}</p>
                    <p className="text-muted-foreground">
                      {format(new Date(competition.competition_start), "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t("endDate")}</p>
                    <p className="text-muted-foreground">
                      {format(new Date(competition.competition_end), "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>

                {competition.is_virtual ? (
                  <div className="flex items-start gap-3">
                    <Globe className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{t("venue")}</p>
                      <p className="text-muted-foreground">{t("virtual")}</p>
                    </div>
                  </div>
                ) : venue && (
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{t("venue")}</p>
                      <p className="text-muted-foreground">
                        {venue}
                        {competition.city && <>, {competition.city}</>}
                        {competition.country && <>, {competition.country}</>}
                      </p>
                    </div>
                  </div>
                )}

                {competition.max_participants && (
                  <div className="flex items-start gap-3">
                    <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{t("participants")}</p>
                      <p className="text-muted-foreground">
                        Max {competition.max_participants}
                      </p>
                    </div>
                  </div>
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
