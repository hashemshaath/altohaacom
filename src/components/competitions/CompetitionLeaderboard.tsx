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

const RANK_ICONS = [Trophy, Medal, Award];
const RANK_COLORS = [
  "text-chart-4",
  "text-muted-foreground",
  "text-chart-5",
];

export function CompetitionLeaderboard({
  competitionId,
  showTopOnly = false,
}: CompetitionLeaderboardProps) {
  const { language } = useLanguage();

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["competition-leaderboard", competitionId],
    queryFn: async () => {
      // Get all approved registrations
      const { data: registrations, error: regError } = await supabase
        .from("competition_registrations")
        .select(`
          id,
          participant_id,
          dish_name,
          dish_image_url,
          category_id
        `)
        .eq("competition_id", competitionId)
        .eq("status", "approved");

      if (regError) throw regError;
      if (!registrations?.length) return [];

      // Get categories
      const { data: categories } = await supabase
        .from("competition_categories")
        .select("id, name, name_ar")
        .eq("competition_id", competitionId);

      // Get judging criteria with weights
      const { data: criteria } = await supabase
        .from("judging_criteria")
        .select("id, weight, max_score")
        .eq("competition_id", competitionId);

      // Get all scores for this competition's registrations
      const registrationIds = registrations.map((r) => r.id);
      const { data: scores } = await supabase
        .from("competition_scores")
        .select("registration_id, criteria_id, score")
        .in("registration_id", registrationIds);

      // Get participant profiles
      const participantIds = registrations.map((r) => r.participant_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, display_name, avatar_url, username")
        .in("user_id", participantIds);

      // Calculate weighted scores for each registration
      const entries: LeaderboardEntry[] = registrations.map((reg) => {
        const regScores = scores?.filter((s) => s.registration_id === reg.id) || [];
        const profile = profiles?.find((p) => p.user_id === reg.participant_id);
        const category = categories?.find((c) => c.id === reg.category_id);

        // Calculate weighted score
        let totalWeightedScore = 0;
        let totalWeight = 0;

        if (criteria && regScores.length > 0) {
          criteria.forEach((crit) => {
            const criteriaScores = regScores.filter((s) => s.criteria_id === crit.id);
            if (criteriaScores.length > 0) {
              // Average score from all judges for this criteria
              const avgScore =
                criteriaScores.reduce((sum, s) => sum + Number(s.score), 0) /
                criteriaScores.length;
              // Normalize to percentage and apply weight
              const normalizedScore = (avgScore / crit.max_score) * 100;
              totalWeightedScore += normalizedScore * Number(crit.weight);
              totalWeight += Number(crit.weight);
            }
          });
        }

        // Final weighted average
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

      // Sort by score descending and assign ranks
      entries.sort((a, b) => b.total_weighted_score - a.total_weighted_score);
      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return showTopOnly ? entries.slice(0, 3) : entries;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            {language === "ar" ? "لوحة المتصدرين" : "Leaderboard"}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <ChefHat className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">
            {language === "ar"
              ? "لا توجد نتائج حتى الآن"
              : "No results yet"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          {language === "ar" ? "لوحة المتصدرين" : "Leaderboard"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {leaderboard.map((entry) => {
          const RankIcon = RANK_ICONS[entry.rank - 1] || null;
          const rankColor = RANK_COLORS[entry.rank - 1] || "text-muted-foreground";

          return (
            <div
              key={entry.registration_id}
              className={`flex items-center gap-4 rounded-xl border p-4 transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 ${
                entry.rank <= 3 ? "bg-accent/5 border-primary/10" : ""
              }`}
            >
              {/* Rank */}
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-muted/50">
                {RankIcon ? (
                  <RankIcon className={`h-6 w-6 ${rankColor}`} />
                ) : (
                  <span className="text-lg font-bold text-muted-foreground">
                    {entry.rank}
                  </span>
                )}
              </div>

              {/* Dish Image */}
              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border/30">
                {entry.dish_image_url ? (
                  <img
                    src={entry.dish_image_url}
                    alt={entry.dish_name || "Dish"}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ChefHat className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h4 className="font-medium">
                  {entry.dish_name || (language === "ar" ? "طبق بدون اسم" : "Unnamed Dish")}
                </h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={entry.participant_avatar || undefined} />
                    <AvatarFallback>
                      <User className="h-2 w-2" />
                    </AvatarFallback>
                  </Avatar>
                  <span>
                    {entry.participant_name ||
                      entry.participant_username ||
                      (language === "ar" ? "مشارك" : "Participant")}
                  </span>
                </div>
                {entry.category_name && (
                  <Badge variant="outline" className="mt-1">
                    {language === "ar" && entry.category_name_ar
                      ? entry.category_name_ar
                      : entry.category_name}
                  </Badge>
                )}
              </div>

              {/* Score */}
              <div className="text-end">
                <p className="text-2xl font-bold text-primary">
                  {entry.total_weighted_score.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {entry.scores_count > 0
                    ? `${entry.scores_count} ${language === "ar" ? "تقييمات" : "scores"}`
                    : language === "ar"
                    ? "لا تقييمات"
                    : "No scores"}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
