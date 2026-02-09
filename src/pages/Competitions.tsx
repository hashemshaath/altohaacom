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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Users, Search, Plus, Globe, Trophy, ArrowRight, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, differenceInDays, isFuture } from "date-fns";
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
  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");

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

  const countries = Array.from(
    new Set(competitions?.map(c => c.country).filter(Boolean) as string[])
  ).sort();

  const filteredCompetitions = competitions?.filter(comp => {
    const title = isAr && comp.title_ar ? comp.title_ar : comp.title;
    const matchesSearch = title.toLowerCase().includes(search.toLowerCase());
    const matchesCountry = countryFilter === "all" || comp.country === countryFilter;
    
    let matchesTab = true;
    if (activeTab === "upcoming") matchesTab = ["upcoming", "registration_open"].includes(comp.status);
    else if (activeTab === "active") matchesTab = ["in_progress", "judging"].includes(comp.status);
    else if (activeTab === "past") matchesTab = ["completed", "cancelled"].includes(comp.status);
    
    return matchesSearch && matchesCountry && matchesTab;
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
      
      <main className="container flex-1 py-8 md:py-12">
        {/* Page Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Trophy className="h-4 w-4 text-primary" />
              </div>
              <h1 className="font-serif text-2xl font-bold md:text-3xl">{t("competitionsPage")}</h1>
            </div>
            <p className="text-sm text-muted-foreground md:text-base">{t("competitionsDesc")}</p>
          </div>
          {canCreate && (
            <Button asChild size="sm" className="w-full sm:w-auto">
              <Link to="/competitions/create">
                <Plus className="me-1.5 h-4 w-4" />
                {t("createCompetition")}
              </Link>
            </Button>
          )}
        </div>

        {/* Search & Tabs Row */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchCompetitions")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-10"
            />
          </div>
          {countries.length > 1 && (
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <MapPin className="me-1.5 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder={isAr ? "الدولة" : "Country"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "جميع الدول" : "All Countries"}</SelectItem>
                {countries.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="h-auto w-full justify-start overflow-x-auto bg-muted/50">
            {(["all", "upcoming", "active", "past"] as const).map((tab) => (
              <TabsTrigger key={tab} value={tab} className="gap-1.5 text-xs sm:text-sm">
                <span className="hidden xs:inline">
                  {tab === "all" && t("allCompetitions")}
                  {tab === "upcoming" && t("upcomingCompetitions")}
                  {tab === "active" && t("activeCompetitions")}
                  {tab === "past" && t("pastCompetitions")}
                </span>
                <span className="xs:hidden">
                  {tab === "all" && (isAr ? "الكل" : "All")}
                  {tab === "upcoming" && (isAr ? "قادمة" : "Upcoming")}
                  {tab === "active" && (isAr ? "نشطة" : "Active")}
                  {tab === "past" && (isAr ? "سابقة" : "Past")}
                </span>
                <Badge variant="secondary" className="ms-0.5 h-5 min-w-5 px-1.5 text-[10px]">
                  {counts[tab]}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-[16/10] w-full" />
                    <CardContent className="space-y-2.5 p-4">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredCompetitions?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 rounded-2xl bg-muted/60 p-5">
                  <Trophy className="h-10 w-10 text-muted-foreground/40" />
                </div>
                <h3 className="mb-1 text-lg font-semibold">{t("noCompetitionsFound")}</h3>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {search
                    ? (isAr ? "جرّب كلمات بحث مختلفة" : "Try different search terms or clear your filters")
                    : (isAr ? "لا توجد مسابقات في هذه الفئة حالياً" : "No competitions in this category yet")}
                </p>
                {search && (
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => setSearch("")}>
                    {isAr ? "مسح البحث" : "Clear search"}
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
  const isAr = language === "ar";
  const title = isAr && competition.title_ar ? competition.title_ar : competition.title;
  const venue = isAr && competition.venue_ar ? competition.venue_ar : competition.venue;

  return (
    <Link to={`/competitions/${competition.id}`} className="group block">
      <Card className="h-full overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5">
        {/* Cover Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {competition.cover_image_url ? (
            <img
              src={competition.cover_image_url}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/5 to-muted">
              <Trophy className="h-10 w-10 text-muted-foreground/20" />
            </div>
          )}
          <div className="absolute start-2.5 top-2.5 flex flex-wrap gap-1.5">
            <Badge className={`text-[10px] font-medium ${statusColors[competition.status]}`}>
              {getStatusLabel(competition.status)}
            </Badge>
            {isFuture(new Date(competition.competition_start)) && (() => {
              const daysLeft = differenceInDays(new Date(competition.competition_start), new Date());
              if (daysLeft <= 30 && daysLeft > 0) {
                return (
                  <Badge variant="secondary" className="gap-1 text-[10px]">
                    <Clock className="h-2.5 w-2.5" />
                    {isAr ? `${daysLeft} يوم` : `${daysLeft}d left`}
                  </Badge>
                );
              }
              return null;
            })()}
          </div>
        </div>

        <CardContent className="p-4">
          <h3 className="mb-2.5 line-clamp-2 text-sm font-semibold leading-snug group-hover:text-primary transition-colors">
            {title}
          </h3>

          <div className="space-y-1.5 text-[12px] text-muted-foreground">
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
            ) : competition.city ? (
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="line-clamp-1">
                  {competition.city}{competition.country ? `, ${competition.country}` : ""}
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
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
