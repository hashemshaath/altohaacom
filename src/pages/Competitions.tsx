import { useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Users, Search, Plus, Globe, Trophy } from "lucide-react";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type CompetitionStatus = Database["public"]["Enums"]["competition_status"];

interface Competition {
  id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  cover_image_url: string | null;
  status: CompetitionStatus;
  registration_start: string | null;
  registration_end: string | null;
  competition_start: string;
  competition_end: string;
  venue: string | null;
  venue_ar: string | null;
  city: string | null;
  country: string | null;
  is_virtual: boolean | null;
  max_participants: number | null;
  organizer_id: string;
}

const statusColors: Record<CompetitionStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  upcoming: "bg-accent/20 text-accent-foreground",
  registration_open: "bg-primary/20 text-primary",
  registration_closed: "bg-muted text-muted-foreground",
  in_progress: "bg-chart-3/20 text-chart-3",
  judging: "bg-chart-4/20 text-chart-4",
  completed: "bg-chart-5/20 text-chart-5",
  cancelled: "bg-destructive/20 text-destructive",
};

export default function Competitions() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: competitions, isLoading } = useQuery({
    queryKey: ["competitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select("*, competition_registrations(id)")
        .order("competition_start", { ascending: true });
      
      if (error) throw error;
      return data as (Competition & { competition_registrations: { id: string }[] })[];
    },
  });

  const { data: userRoles } = useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      return data?.map(r => r.role) || [];
    },
    enabled: !!user,
  });

  const canCreate = userRoles?.some(role => ["organizer", "supervisor"].includes(role));

  const filteredCompetitions = competitions?.filter(comp => {
    const title = language === "ar" && comp.title_ar ? comp.title_ar : comp.title;
    const matchesSearch = title.toLowerCase().includes(search.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "upcoming") return matchesSearch && ["upcoming", "registration_open"].includes(comp.status);
    if (activeTab === "active") return matchesSearch && ["in_progress", "judging"].includes(comp.status);
    if (activeTab === "past") return matchesSearch && ["completed", "cancelled"].includes(comp.status);
    return matchesSearch;
  });

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

  const counts = {
    all: competitions?.length || 0,
    upcoming: competitions?.filter(c => ["upcoming", "registration_open"].includes(c.status)).length || 0,
    active: competitions?.filter(c => ["in_progress", "judging"].includes(c.status)).length || 0,
    past: competitions?.filter(c => ["completed", "cancelled"].includes(c.status)).length || 0,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="Culinary Competitions"
        description="Browse and join culinary competitions worldwide. Showcase your cooking skills and compete with the best chefs."
      />
      <Header />
      
      <main className="container flex-1 py-6 md:py-8">
        {/* Page Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold md:text-3xl">{t("competitionsPage")}</h1>
            <p className="text-sm text-muted-foreground md:text-base">{t("competitionsDesc")}</p>
          </div>
          {canCreate && (
            <Button asChild size="sm" className="w-full sm:w-auto">
              <Link to="/competitions/create">
                <Plus className="mr-2 h-4 w-4" />
                {t("createCompetition")}
              </Link>
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchCompetitions")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="h-auto w-full justify-start overflow-x-auto">
            <TabsTrigger value="all" className="gap-1.5">
              {t("allCompetitions")}
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">{counts.all}</Badge>
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-1.5">
              {t("upcomingCompetitions")}
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">{counts.upcoming}</Badge>
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-1.5">
              {t("activeCompetitions")}
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">{counts.active}</Badge>
            </TabsTrigger>
            <TabsTrigger value="past" className="gap-1.5">
              {t("pastCompetitions")}
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">{counts.past}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-44 w-full" />
                    <CardHeader className="space-y-2 pb-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredCompetitions?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 rounded-full bg-muted p-4">
                  <Trophy className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-1 text-lg font-semibold">{t("noCompetitionsFound")}</h3>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {search
                    ? (language === "ar" ? "جرّب كلمات بحث مختلفة" : "Try different search terms or clear your filters")
                    : (language === "ar" ? "لا توجد مسابقات في هذه الفئة حالياً" : "No competitions in this category yet")}
                </p>
                {search && (
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => setSearch("")}>
                    {language === "ar" ? "مسح البحث" : "Clear search"}
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCompetitions?.map((comp) => (
                  <CompetitionCard
                    key={comp.id}
                    competition={comp}
                    language={language}
                    getStatusLabel={getStatusLabel}
                    t={t}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}

interface CompetitionCardProps {
  competition: Competition & { competition_registrations?: { id: string }[] };
  language: string;
  getStatusLabel: (status: CompetitionStatus) => string;
  t: (key: any) => string;
}

function CompetitionCard({ competition, language, getStatusLabel, t }: CompetitionCardProps) {
  const title = language === "ar" && competition.title_ar ? competition.title_ar : competition.title;
  const venue = language === "ar" && competition.venue_ar ? competition.venue_ar : competition.venue;

  return (
    <Link to={`/competitions/${competition.id}`} className="group block">
      <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        {/* Cover Image */}
        <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 sm:h-44">
          {competition.cover_image_url ? (
            <img
              src={competition.cover_image_url}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Trophy className="h-12 w-12 text-primary/30" />
            </div>
          )}
          <Badge className={`absolute right-3 top-3 text-xs ${statusColors[competition.status]}`}>
            {getStatusLabel(competition.status)}
          </Badge>
        </div>

        <CardHeader className="pb-2">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug group-hover:text-primary transition-colors">{title}</h3>
        </CardHeader>

        <CardContent className="space-y-1.5 pb-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {format(new Date(competition.competition_start), "MMM d, yyyy")}
              {competition.competition_end !== competition.competition_start && (
                <> – {format(new Date(competition.competition_end), "MMM d, yyyy")}</>
              )}
            </span>
          </div>
          
          {competition.is_virtual ? (
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 shrink-0" />
              <span>{t("virtual")}</span>
            </div>
          ) : venue ? (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-1">
                {venue}
                {competition.city && `, ${competition.city}`}
              </span>
            </div>
          ) : null}

          {(competition.competition_registrations?.length || competition.max_participants) ? (
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span>
                {competition.competition_registrations?.length || 0}
                {competition.max_participants ? ` / ${competition.max_participants}` : ""} {t("participants")}
              </span>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
