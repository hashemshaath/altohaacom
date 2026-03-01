import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award, User, ChefHat } from "lucide-react";

interface CompetitionLeaderboardProps {
  competitionId: string;
  showTopOnly?: boolean;
}

interface LeaderboardEntry {
  registration_id: string;
  participant_id: string;
  dish_name: string | null;
  dish_image_url: string | null;
  category_name: string | null;
  category_name_ar: string | null;
  participant_name: string | null;
  participant_avatar: string | null;
  participant_username: string | null;
  total_weighted_score: number;
  scores_count: number;
  rank: number;
}

const RANK_CONFIG = [
  { icon: Trophy, gradient: "from-chart-4/20 to-chart-4/5", border: "border-chart-4/30", text: "text-chart-4", shadow: "shadow-chart-4/10", label: "1st" },
  { icon: Medal, gradient: "from-muted/40 to-muted/10", border: "border-border/50", text: "text-muted-foreground", shadow: "shadow-muted/10", label: "2nd" },
  { icon: Award, gradient: "from-chart-5/15 to-chart-5/5", border: "border-chart-5/25", text: "text-chart-5", shadow: "shadow-chart-5/10", label: "3rd" },
];

export function CompetitionLeaderboard({
  competitionId,
  showTopOnly = false,
}: CompetitionLeaderboardProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["competition-leaderboard", competitionId],
    queryFn: async () => {
      const { data: registrations, error: regError } = await supabase
        .from("competition_registrations")
        .select(`id, participant_id, dish_name, dish_image_url, category_id`)
        .eq("competition_id", competitionId)
        .eq("status", "approved");

      if (regError) throw regError;
      if (!registrations?.length) return [];

      const { data: categories } = await supabase
        .from("competition_categories")
        .select("id, name, name_ar")
        .eq("competition_id", competitionId);

      const { data: criteria } = await supabase
        .from("judging_criteria")
        .select("id, weight, max_score")
        .eq("competition_id", competitionId);

      const registrationIds = registrations.map((r) => r.id);
      const { data: scores } = await supabase
        .from("competition_scores")
        .select("registration_id, criteria_id, score")
        .in("registration_id", registrationIds);

      const participantIds = registrations.map((r) => r.participant_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, display_name, avatar_url, username")
        .in("user_id", participantIds);

      const entries: LeaderboardEntry[] = registrations.map((reg) => {
        const regScores = scores?.filter((s) => s.registration_id === reg.id) || [];
        const profile = profiles?.find((p) => p.user_id === reg.participant_id);
        const category = categories?.find((c) => c.id === reg.category_id);

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
          registration_id: reg.id,
          participant_id: reg.participant_id,
          dish_name: reg.dish_name,
          dish_image_url: reg.dish_image_url,
          category_name: category?.name || null,
          category_name_ar: category?.name_ar || null,
          participant_name: profile?.display_name || profile?.full_name || null,
          participant_avatar: profile?.avatar_url || null,
          participant_username: profile?.username || null,
          total_weighted_score: Math.round(finalScore * 100) / 100,
          scores_count: regScores.length,
          rank: 0,
        };
      });

      entries.sort((a, b) => b.total_weighted_score - a.total_weighted_score);
      entries.forEach((entry, index) => { entry.rank = index + 1; });

      return showTopOnly ? entries.slice(0, 3) : entries;
    },
  });

  if (isLoading) {
    return (
      <Card className="rounded-3xl border-border/30 shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <Card className="rounded-3xl border-border/30 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Trophy className="h-4.5 w-4.5 text-primary" />
            </div>
            {isAr ? "لوحة المتصدرين" : "Leaderboard"}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
            <ChefHat className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            {isAr ? "لا توجد نتائج حتى الآن" : "No results yet"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border-border/30 shadow-sm overflow-hidden">
      <CardHeader className="border-b border-border/20 bg-gradient-to-r from-primary/[0.04] to-transparent">
        <CardTitle className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Trophy className="h-4.5 w-4.5 text-primary" />
          </div>
          {isAr ? "لوحة المتصدرين" : "Leaderboard"}
          <Badge variant="secondary" className="ms-auto text-[10px] font-bold tabular-nums">
            {leaderboard.length} {isAr ? "متسابق" : "entries"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-5 space-y-2.5">
        {leaderboard.map((entry) => {
          const isTop3 = entry.rank <= 3;
          const config = isTop3 ? RANK_CONFIG[entry.rank - 1] : null;
          const RankIcon = config?.icon || null;

          return (
            <div
              key={entry.registration_id}
              className={`
                group relative flex items-center gap-3 sm:gap-4 rounded-2xl border p-3 sm:p-4
                transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5
                ${isTop3
                  ? `bg-gradient-to-r ${config!.gradient} ${config!.border} ${config!.shadow} shadow-sm`
                  : "border-border/20 hover:border-border/40 hover:bg-muted/20"
                }
              `}
            >
              {/* Rank */}
              <div className={`
                flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold transition-transform duration-300 group-hover:scale-110
                ${isTop3
                  ? `bg-gradient-to-br ${config!.gradient} ${config!.text}`
                  : "bg-muted/50 text-muted-foreground"
                }
              `}>
                {RankIcon ? (
                  <RankIcon className="h-5.5 w-5.5" />
                ) : (
                  <span className="text-lg tabular-nums">{entry.rank}</span>
                )}
              </div>

              {/* Dish Image */}
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted ring-2 ring-border/20 transition-all duration-300 group-hover:ring-primary/20">
                {entry.dish_image_url ? (
                  <img
                    src={entry.dish_image_url}
                    alt={entry.dish_name || "Dish"}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ChefHat className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">
                  {entry.dish_name || (isAr ? "طبق بدون اسم" : "Unnamed Dish")}
                </h4>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                  <Avatar className="h-4 w-4 ring-1 ring-border/30">
                    <AvatarImage src={entry.participant_avatar || undefined} />
                    <AvatarFallback className="text-[7px]">
                      <User className="h-2.5 w-2.5" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">
                    {entry.participant_name || entry.participant_username || (isAr ? "مشارك" : "Participant")}
                  </span>
                </div>
                {entry.category_name && (
                  <Badge variant="outline" className="mt-1.5 text-[9px] px-1.5 py-0 rounded-md">
                    {isAr && entry.category_name_ar ? entry.category_name_ar : entry.category_name}
                  </Badge>
                )}
              </div>

              {/* Score */}
              <div className="text-end shrink-0">
                <p className={`text-2xl font-black tabular-nums ${isTop3 ? config!.text : "text-primary"}`}>
                  {entry.total_weighted_score.toFixed(1)}
                </p>
                <p className="text-[10px] text-muted-foreground font-medium">
                  {entry.scores_count > 0
                    ? `${entry.scores_count} ${isAr ? "تقييم" : "scores"}`
                    : isAr ? "لا تقييمات" : "No scores"}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
