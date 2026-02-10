import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Medal, Award, ArrowLeft, User, ChefHat, Sparkles, Filter, Crown } from "lucide-react";
import { SocialShareButtons } from "@/components/competitions/SocialShareButtons";
import { SEOHead } from "@/components/SEOHead";

interface Winner {
  rank: number;
  registration_id: string;
  dish_name: string | null;
  dish_image_url: string | null;
  participant_name: string | null;
  participant_avatar: string | null;
  participant_username: string | null;
  total_score: number;
  category_id: string | null;
  category_name: string | null;
  category_name_ar: string | null;
}

const PODIUM_CONFIG = [
  { rank: 2, icon: Medal, gradient: "from-muted to-muted/50", ring: "ring-muted-foreground/20", medal: "Silver", medalAr: "فضي", textColor: "text-muted-foreground" },
  { rank: 1, icon: Crown, gradient: "from-chart-4/10 to-chart-4/5", ring: "ring-chart-4/30", medal: "Gold", medalAr: "ذهبي", textColor: "text-chart-4" },
  { rank: 3, icon: Award, gradient: "from-chart-4/5 to-muted/30", ring: "ring-chart-4/20", medal: "Bronze", medalAr: "برونزي", textColor: "text-chart-2" },
];

export default function CompetitionResults() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: competition, isLoading: loadingComp } = useQuery({
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
    queryKey: ["result-categories", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("competition_categories").select("id, name, name_ar").eq("competition_id", id!).order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: winners, isLoading: loadingWinners } = useQuery({
    queryKey: ["competition-results", id],
    queryFn: async () => {
      const { data: registrations, error: regError } = await supabase
        .from("competition_registrations")
        .select("id, participant_id, dish_name, dish_image_url, category_id")
        .eq("competition_id", id!)
        .eq("status", "approved");
      if (regError) throw regError;
      if (!registrations?.length) return [];

      const { data: criteria } = await supabase.from("judging_criteria").select("id, weight, max_score").eq("competition_id", id!);
      const registrationIds = registrations.map((r) => r.id);
      const { data: scores } = await supabase.from("competition_scores").select("registration_id, criteria_id, score").in("registration_id", registrationIds);
      const participantIds = registrations.map((r) => r.participant_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url, username").in("user_id", participantIds);
      const categoryIds = registrations.map((r) => r.category_id).filter(Boolean) as string[];
      const { data: cats } = categoryIds.length > 0
        ? await supabase.from("competition_categories").select("id, name, name_ar").in("id", categoryIds)
        : { data: [] };
      const catMap = new Map((cats || []).map((c) => [c.id, c]));

      const results: Winner[] = registrations.map((reg) => {
        const regScores = scores?.filter((s) => s.registration_id === reg.id) || [];
        const profile = profiles?.find((p) => p.user_id === reg.participant_id);
        const cat = reg.category_id ? catMap.get(reg.category_id) : null;
        let totalWeightedScore = 0;
        let totalWeight = 0;
        if (criteria && regScores.length > 0) {
          criteria.forEach((crit) => {
            const criteriaScores = regScores.filter((s) => s.criteria_id === crit.id);
            if (criteriaScores.length > 0) {
              const avgScore = criteriaScores.reduce((sum, s) => sum + Number(s.score), 0) / criteriaScores.length;
              const normalizedScore = (avgScore / crit.max_score) * 100;
              totalWeightedScore += normalizedScore * Number(crit.weight);
              totalWeight += Number(crit.weight);
            }
          });
        }
        const finalScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
        return {
          rank: 0, registration_id: reg.id, dish_name: reg.dish_name, dish_image_url: reg.dish_image_url,
          participant_name: profile?.full_name || null, participant_avatar: profile?.avatar_url || null,
          participant_username: profile?.username || null, total_score: Math.round(finalScore * 100) / 100,
          category_id: reg.category_id, category_name: cat?.name || null, category_name_ar: cat?.name_ar || null,
        };
      });
      results.sort((a, b) => b.total_score - a.total_score);
      results.forEach((r, i) => { r.rank = i + 1; });
      return results;
    },
    enabled: !!id,
  });

  const isLoading = loadingComp || loadingWinners;
  const filteredWinners = winners?.filter((w) => categoryFilter === "all" ? true : w.category_id === categoryFilter);
  const rankedWinners = filteredWinners?.map((w, i) => ({ ...w, rank: i + 1 }));

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="container flex-1 py-8">
          <Skeleton className="mb-4 h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="container flex-1 py-8 text-center">
          <p className="text-muted-foreground">{isAr ? "المسابقة غير موجودة" : "Competition not found"}</p>
        </main>
        <Footer />
      </div>
    );
  }

  const title = isAr && competition.title_ar ? competition.title_ar : competition.title;
  const topThree = rankedWinners?.slice(0, 3) || [];
  const others = rankedWinners?.slice(3) || [];
  const podiumOrder = [topThree[1], topThree[0], topThree[2]].filter(Boolean);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead title={`${title} - ${isAr ? "النتائج" : "Results"}`} description={`Official results for ${title}`} />
      <Header />

      <main className="flex-1">
        {/* ─── Hero Banner ─── */}
        <section className="relative overflow-hidden border-b bg-gradient-to-br from-chart-4/5 via-background to-primary/5">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 start-1/4 h-32 w-32 rounded-full bg-chart-4/5 blur-3xl" />
            <div className="absolute bottom-0 end-1/4 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
          </div>
          <div className="container relative py-10 md:py-14">
            <Button variant="ghost" size="sm" asChild className="mb-6 -ms-2">
              <Link to={`/competitions/${id}`}>
                <ArrowLeft className="me-1.5 h-4 w-4" />
                {isAr ? "العودة للمسابقة" : "Back to Competition"}
              </Link>
            </Button>

            <div className="text-center max-w-2xl mx-auto">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-chart-4/20 bg-chart-4/5 px-4 py-1.5">
                <Sparkles className="h-4 w-4 text-chart-4" />
                <span className="text-sm font-medium">{isAr ? "النتائج الرسمية" : "Official Results"}</span>
                <Sparkles className="h-4 w-4 text-chart-4" />
              </div>
              <h1 className="mb-3 font-serif text-2xl font-bold md:text-3xl lg:text-4xl">{title}</h1>
              <p className="text-muted-foreground">{isAr ? "تهانينا لجميع الفائزين والمشاركين!" : "Congratulations to all winners and participants!"}</p>
            </div>
          </div>
        </section>

        <div className="container py-8">
          {/* Category Filter */}
          {categories && categories.length > 1 && (
            <div className="mb-8 flex justify-center">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-64">
                  <Filter className="h-3.5 w-3.5 me-1.5" />
                  <SelectValue placeholder={isAr ? "جميع الفئات" : "All Categories"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "جميع الفئات" : "All Categories"}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{isAr && cat.name_ar ? cat.name_ar : cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ─── Podium ─── */}
          {topThree.length > 0 ? (
            <div className="mb-12">
              <div className="flex items-end justify-center gap-3 md:gap-5">
                {podiumOrder.map((winner, index) => {
                  if (!winner) return null;
                  const config = PODIUM_CONFIG[index];
                  const Icon = config.icon;
                  const isFirst = config.rank === 1;

                  return (
                    <div key={winner.registration_id} className="flex flex-col items-center">
                      <Card className={`mb-3 w-28 sm:w-36 md:w-44 overflow-hidden border-border/60 bg-gradient-to-b ${config.gradient} ${isFirst ? "shadow-lg shadow-chart-4/10" : ""}`}>
                        <CardContent className="p-4 md:p-5 text-center">
                          {/* Medal Icon */}
                          <div className={`mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-full ${isFirst ? "bg-chart-4/10" : "bg-muted"}`}>
                            <Icon className={`h-4 w-4 ${config.textColor}`} />
                          </div>

                          {/* Dish Image */}
                          <div className="relative mx-auto mb-3 h-16 w-16 md:h-20 md:w-20">
                            {winner.dish_image_url ? (
                              <img src={winner.dish_image_url} alt={winner.dish_name || "Dish"} className={`h-full w-full rounded-full object-cover ring-2 ring-offset-2 ${config.ring} ring-offset-card`} />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center rounded-full bg-muted">
                                <ChefHat className="h-7 w-7 text-muted-foreground/50" />
                              </div>
                            )}
                          </div>

                          <p className="mb-1 truncate text-xs md:text-sm font-semibold">{winner.dish_name || (isAr ? "طبق" : "Dish")}</p>

                          <div className="flex items-center justify-center gap-1.5 text-[10px] md:text-xs text-muted-foreground mb-2">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={winner.participant_avatar || undefined} />
                              <AvatarFallback><User className="h-2 w-2" /></AvatarFallback>
                            </Avatar>
                            <span className="truncate max-w-[70px] md:max-w-[90px]">{winner.participant_name || winner.participant_username || "—"}</span>
                          </div>

                          {winner.category_name && (
                            <Badge variant="outline" className="mb-2 text-[8px] md:text-[9px] h-4 px-1.5">
                              {isAr && winner.category_name_ar ? winner.category_name_ar : winner.category_name}
                            </Badge>
                          )}

                          <p className={`text-xl md:text-2xl font-bold ${isFirst ? "text-chart-4" : "text-primary"}`}>
                            {winner.total_score.toFixed(1)}
                          </p>

                          <Badge className={`mt-2 text-[9px] ${isFirst ? "bg-chart-4/10 text-chart-4 border-chart-4/20" : ""}`} variant="outline">
                            {isAr ? config.medalAr : config.medal}
                          </Badge>

                          <div className="mt-3">
                            <SocialShareButtons
                              title={title}
                              participantName={winner.participant_name || winner.participant_username || "Participant"}
                              rank={winner.rank}
                              score={winner.total_score}
                              competitionUrl={window.location.href}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Podium Block */}
                      <div className={`flex w-20 md:w-28 items-center justify-center rounded-t-xl border border-b-0 bg-gradient-to-t ${config.gradient} ${
                        isFirst ? "h-36 md:h-40" : config.rank === 2 ? "h-28 md:h-32" : "h-20 md:h-24"
                      }`}>
                        <span className={`text-3xl md:text-4xl font-bold ${config.textColor}/50`}>{winner.rank}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <Card className="mb-12 border-border/60">
              <CardContent className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <Trophy className="h-7 w-7 text-muted-foreground/30" />
                </div>
                <p className="text-sm text-muted-foreground">{isAr ? "لا توجد نتائج حتى الآن" : "No results available yet"}</p>
              </CardContent>
            </Card>
          )}

          {/* ─── Other Participants ─── */}
          {others.length > 0 && (
            <div className="max-w-2xl mx-auto">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                {isAr ? "المشاركون الآخرون" : "Other Participants"}
                <Badge variant="secondary" className="ms-1 text-[10px]">{others.length}</Badge>
              </h2>
              <div className="space-y-2">
                {others.map((winner) => (
                  <Card key={winner.registration_id} className="overflow-hidden border-border/60 hover:border-primary/20 hover:shadow-sm transition-all duration-200">
                    <CardContent className="flex items-center gap-3 p-3.5">
                      <span className="w-8 text-center text-sm font-bold text-muted-foreground">{winner.rank}</span>
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-muted">
                        {winner.dish_image_url ? (
                          <img src={winner.dish_image_url} alt={winner.dish_name || "Dish"} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center"><ChefHat className="h-4 w-4 text-muted-foreground/50" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{winner.dish_name || (isAr ? "طبق" : "Dish")}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={winner.participant_avatar || undefined} />
                              <AvatarFallback><User className="h-2 w-2" /></AvatarFallback>
                            </Avatar>
                            <span className="truncate max-w-[100px]">{winner.participant_name || winner.participant_username || "—"}</span>
                          </div>
                          {winner.category_name && (
                            <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                              {isAr && winner.category_name_ar ? winner.category_name_ar : winner.category_name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-lg font-bold text-primary shrink-0">{winner.total_score.toFixed(1)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}