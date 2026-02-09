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
import { Trophy, Medal, Award, ArrowLeft, User, ChefHat, Sparkles } from "lucide-react";
import { SocialShareButtons } from "@/components/competitions/SocialShareButtons";

interface Winner {
  rank: number;
  registration_id: string;
  dish_name: string | null;
  dish_image_url: string | null;
  participant_name: string | null;
  participant_avatar: string | null;
  participant_username: string | null;
  total_score: number;
}

const PODIUM_CONFIG = [
  { rank: 2, icon: Medal, color: "text-gray-400", bgColor: "bg-gray-100 dark:bg-gray-800", height: "h-32" },
  { rank: 1, icon: Trophy, color: "text-yellow-500", bgColor: "bg-yellow-50 dark:bg-yellow-900/20", height: "h-40" },
  { rank: 3, icon: Award, color: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-900/20", height: "h-24" },
];

export default function CompetitionResults() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();

  const { data: competition, isLoading: loadingComp } = useQuery({
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

  const { data: winners, isLoading: loadingWinners } = useQuery({
    queryKey: ["competition-results", id],
    queryFn: async () => {
      // Get all approved registrations
      const { data: registrations, error: regError } = await supabase
        .from("competition_registrations")
        .select("id, participant_id, dish_name, dish_image_url")
        .eq("competition_id", id)
        .eq("status", "approved");

      if (regError) throw regError;
      if (!registrations?.length) return [];

      // Get judging criteria with weights
      const { data: criteria } = await supabase
        .from("judging_criteria")
        .select("id, weight, max_score")
        .eq("competition_id", id);

      // Get all scores
      const registrationIds = registrations.map((r) => r.id);
      const { data: scores } = await supabase
        .from("competition_scores")
        .select("registration_id, criteria_id, score")
        .in("registration_id", registrationIds);

      // Get profiles
      const participantIds = registrations.map((r) => r.participant_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, username")
        .in("user_id", participantIds);

      // Calculate scores
      const results: Winner[] = registrations.map((reg) => {
        const regScores = scores?.filter((s) => s.registration_id === reg.id) || [];
        const profile = profiles?.find((p) => p.user_id === reg.participant_id);

        let totalWeightedScore = 0;
        let totalWeight = 0;

        if (criteria && regScores.length > 0) {
          criteria.forEach((crit) => {
            const criteriaScores = regScores.filter((s) => s.criteria_id === crit.id);
            if (criteriaScores.length > 0) {
              const avgScore =
                criteriaScores.reduce((sum, s) => sum + Number(s.score), 0) /
                criteriaScores.length;
              const normalizedScore = (avgScore / crit.max_score) * 100;
              totalWeightedScore += normalizedScore * Number(crit.weight);
              totalWeight += Number(crit.weight);
            }
          });
        }

        const finalScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

        return {
          rank: 0,
          registration_id: reg.id,
          dish_name: reg.dish_name,
          dish_image_url: reg.dish_image_url,
          participant_name: profile?.full_name || null,
          participant_avatar: profile?.avatar_url || null,
          participant_username: profile?.username || null,
          total_score: Math.round(finalScore * 100) / 100,
        };
      });

      // Sort and assign ranks
      results.sort((a, b) => b.total_score - a.total_score);
      results.forEach((r, i) => {
        r.rank = i + 1;
      });

      return results;
    },
    enabled: !!id,
  });

  const isLoading = loadingComp || loadingWinners;

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-8">
          <Skeleton className="mb-4 h-8 w-48" />
          <Skeleton className="h-64 w-full" />
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
          <p className="text-muted-foreground">
            {language === "ar" ? "المسابقة غير موجودة" : "Competition not found"}
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  const title =
    language === "ar" && competition.title_ar ? competition.title_ar : competition.title;
  const topThree = winners?.slice(0, 3) || [];
  const others = winners?.slice(3) || [];

  // Reorder for podium display: [2nd, 1st, 3rd]
  const podiumOrder = [topThree[1], topThree[0], topThree[2]].filter(Boolean);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="container flex-1 py-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to={`/competitions/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {language === "ar" ? "العودة للمسابقة" : "Back to Competition"}
          </Link>
        </Button>

        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            <Badge variant="outline" className="text-lg">
              {language === "ar" ? "النتائج الرسمية" : "Official Results"}
            </Badge>
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </div>
          <h1 className="mb-2 font-serif text-3xl font-bold md:text-4xl">{title}</h1>
          <p className="text-muted-foreground">
            {language === "ar" ? "تهانينا لجميع الفائزين!" : "Congratulations to all winners!"}
          </p>
        </div>

        {/* Podium */}
        {topThree.length > 0 ? (
          <div className="mb-12">
            <div className="flex items-end justify-center gap-4 md:gap-8">
              {podiumOrder.map((winner, index) => {
                if (!winner) return null;
                const config = PODIUM_CONFIG[index];
                const Icon = config.icon;

                return (
                  <div key={winner.registration_id} className="flex flex-col items-center">
                    {/* Winner Card */}
                    <Card className={`mb-2 w-32 md:w-40 ${config.bgColor}`}>
                      <CardContent className="p-4 text-center">
                        <div className="relative mx-auto mb-2 h-16 w-16 md:h-20 md:w-20">
                          {winner.dish_image_url ? (
                            <img
                              src={winner.dish_image_url}
                              alt={winner.dish_name || "Dish"}
                              className="h-full w-full rounded-full object-cover ring-2 ring-offset-2"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center rounded-full bg-muted">
                              <ChefHat className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-background shadow">
                            <Icon className={`h-5 w-5 ${config.color}`} />
                          </div>
                        </div>

                        <p className="mb-1 truncate text-sm font-medium">
                          {winner.dish_name || (language === "ar" ? "طبق" : "Dish")}
                        </p>

                        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={winner.participant_avatar || undefined} />
                            <AvatarFallback>
                              <User className="h-2 w-2" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">
                            {winner.participant_name || winner.participant_username || "—"}
                          </span>
                        </div>

                        <p className="mt-2 text-lg font-bold text-primary">
                          {winner.total_score.toFixed(1)}
                        </p>

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
                    <div
                      className={`flex w-24 items-center justify-center rounded-t-lg ${config.bgColor} ${config.height} md:w-32`}
                    >
                      <span className="text-3xl font-bold">{winner.rank}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <Card className="mb-12">
            <CardContent className="py-12 text-center">
              <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                {language === "ar"
                  ? "لا توجد نتائج حتى الآن"
                  : "No results available yet"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Other Participants */}
        {others.length > 0 && (
          <div>
            <h2 className="mb-4 text-xl font-semibold">
              {language === "ar" ? "المشاركون الآخرون" : "Other Participants"}
            </h2>
            <div className="space-y-2">
              {others.map((winner) => (
                <Card key={winner.registration_id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <span className="w-8 text-center text-lg font-bold text-muted-foreground">
                      {winner.rank}
                    </span>

                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                      {winner.dish_image_url ? (
                        <img
                          src={winner.dish_image_url}
                          alt={winner.dish_name || "Dish"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ChefHat className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="font-medium">
                        {winner.dish_name || (language === "ar" ? "طبق" : "Dish")}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={winner.participant_avatar || undefined} />
                          <AvatarFallback>
                            <User className="h-2 w-2" />
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {winner.participant_name || winner.participant_username || "—"}
                        </span>
                      </div>
                    </div>

                    <p className="text-xl font-bold text-primary">
                      {winner.total_score.toFixed(1)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
