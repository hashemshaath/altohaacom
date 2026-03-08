import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Trophy, Medal, Award, Star, TrendingUp, Crown } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface Props {
  userId: string;
  isAr: boolean;
}

export function PublicProfileAchievements({ userId, isAr }: Props) {
  // Fetch rankings
  const { data: rankings = [] } = useQuery({
    queryKey: ["user-rankings", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("chef_rankings")
        .select("id, user_id, ranking_period, period_value, rank, previous_rank, rank_change, total_points, average_score, gold_medals, silver_medals, bronze_medals, competitions_entered, competitions_won, specialty, country_code, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(3);
      return data || [];
    },
    enabled: !!userId,
  });

  // Fetch awards
  const { data: awards = [] } = useQuery({
    queryKey: ["user-awards-display", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_global_awards")
        .select("*, global_awards_system(*)")
        .eq("user_id", userId)
        .eq("is_public", true);
      return data || [];
    },
    enabled: !!userId,
  });

  // Fetch competition stats
  const { data: compStats } = useQuery({
    queryKey: ["user-comp-stats", userId],
    queryFn: async () => {
      const { count: totalComps } = await supabase
        .from("competition_registrations")
        .select("id", { count: "exact", head: true })
        .eq("participant_id", userId)
        .eq("status", "approved");

      const { data: certificates } = await supabase
        .from("certificates")
        .select("achievement, type")
        .eq("recipient_id", userId)
        .limit(20);

      return {
        competitions: totalComps || 0,
        certificates: certificates?.length || 0,
      };
    },
    enabled: !!userId,
  });

  const hasRankings = rankings.length > 0;
  const hasAwards = awards.length > 0;
  const hasStats = compStats && (compStats.competitions > 0 || compStats.certificates > 0);

  if (!hasRankings && !hasAwards && !hasStats) return null;

  const topRanking = rankings[0];
  const totalMedals = rankings.reduce((acc: number, r: any) => acc + (r.gold_medals || 0) + (r.silver_medals || 0) + (r.bronze_medals || 0), 0);
  const totalGold = rankings.reduce((acc: number, r: any) => acc + (r.gold_medals || 0), 0);
  const totalSilver = rankings.reduce((acc: number, r: any) => acc + (r.silver_medals || 0), 0);
  const totalBronze = rankings.reduce((acc: number, r: any) => acc + (r.bronze_medals || 0), 0);

  return (
    <div>
      {/* Section Title */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-chart-4/10">
          <Trophy className="h-4 w-4 text-chart-4" />
        </div>
        <h2 className="text-base font-bold">{isAr ? "الإنجازات" : "Achievements"}</h2>
        <div className="flex-1 h-px bg-border/25" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Ranking Card */}
        {hasRankings && topRanking && (
          <Card className="rounded-2xl border-border/25 overflow-hidden group hover:shadow-lg hover:shadow-chart-4/10 transition-all duration-500 hover:border-chart-4/30">
            <div className="h-0.5 bg-gradient-to-r from-chart-4/60 via-chart-4/30 to-transparent" />
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-chart-4/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Crown className="h-4.5 w-4.5 text-chart-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{isAr ? "التصنيف" : "Ranking"}</p>
                    <p className="text-[10px] text-muted-foreground">{isAr ? "تصنيف عام" : "Overall"}</p>
                  </div>
                </div>
                {topRanking.rank && (
                  <div className="text-center">
                    <span className="text-2xl font-bold tabular-nums text-chart-4">#<AnimatedCounter value={topRanking.rank} className="inline" /></span>
                    {topRanking.rank_change !== null && topRanking.rank_change !== 0 && (
                      <div className={`flex items-center justify-center gap-0.5 text-[10px] ${topRanking.rank_change > 0 ? "text-chart-2" : "text-destructive"}`}>
                        <TrendingUp className={`h-2.5 w-2.5 ${topRanking.rank_change < 0 ? "rotate-180" : ""}`} />
                        <AnimatedCounter value={Math.abs(topRanking.rank_change)} className="inline" />
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center gap-1">
                <span className="text-xs font-bold tabular-nums"><AnimatedCounter value={topRanking.total_points} className="inline" /></span>
                <span className="text-[10px] text-muted-foreground">{isAr ? "نقطة" : "pts"}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Medals Card */}
        {totalMedals > 0 && (
          <Card className="rounded-2xl border-border/25 overflow-hidden group hover:shadow-lg hover:shadow-primary/10 transition-all duration-500 hover:border-primary/30">
            <div className="h-0.5 bg-gradient-to-r from-[#FFD700]/60 via-[#C0C0C0]/40 to-[#CD7F32]/30" />
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Medal className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold">{isAr ? "الميداليات" : "Medals"}</p>
                  <p className="text-[10px] text-muted-foreground"><AnimatedCounter value={totalMedals} className="inline" /> {isAr ? "إجمالي" : "total"}</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4">
                {totalGold > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center gap-0.5 cursor-default">
                        <div className="h-8 w-8 rounded-full bg-[#FFD700]/15 flex items-center justify-center border border-[#FFD700]/30">
                          <span className="text-sm font-bold tabular-nums text-[#FFD700]"><AnimatedCounter value={totalGold} /></span>
                        </div>
                        <span className="text-[9px] text-muted-foreground">{isAr ? "ذهب" : "Gold"}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>{isAr ? "ميدالية ذهبية" : "Gold Medal"}</TooltipContent>
                  </Tooltip>
                )}
                {totalSilver > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center gap-0.5 cursor-default">
                        <div className="h-8 w-8 rounded-full bg-[#C0C0C0]/15 flex items-center justify-center border border-[#C0C0C0]/30">
                          <span className="text-sm font-bold tabular-nums text-[#C0C0C0]"><AnimatedCounter value={totalSilver} /></span>
                        </div>
                        <span className="text-[9px] text-muted-foreground">{isAr ? "فضة" : "Silver"}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>{isAr ? "ميدالية فضية" : "Silver Medal"}</TooltipContent>
                  </Tooltip>
                )}
                {totalBronze > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center gap-0.5 cursor-default">
                        <div className="h-8 w-8 rounded-full bg-[#CD7F32]/15 flex items-center justify-center border border-[#CD7F32]/30">
                          <span className="text-sm font-bold tabular-nums text-[#CD7F32]"><AnimatedCounter value={totalBronze} /></span>
                        </div>
                        <span className="text-[9px] text-muted-foreground">{isAr ? "برونز" : "Bronze"}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>{isAr ? "ميدالية برونزية" : "Bronze Medal"}</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Awards */}
        {hasAwards && (
          <Card className="rounded-2xl border-border/25 overflow-hidden group hover:shadow-lg hover:shadow-chart-3/10 transition-all duration-500 hover:border-chart-3/30 sm:col-span-2">
            <div className="h-0.5 bg-gradient-to-r from-chart-3/60 via-chart-3/30 to-transparent" />
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-9 w-9 rounded-xl bg-chart-3/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Award className="h-4.5 w-4.5 text-chart-3" />
                </div>
                <div>
                  <p className="text-xs font-semibold">{isAr ? "الجوائز والتقديرات" : "Awards & Recognition"}</p>
                  <p className="text-[10px] text-muted-foreground"><AnimatedCounter value={awards.length} className="inline" /> {isAr ? "جائزة" : "awards"}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {awards.map((ua: any) => {
                  const award = ua.global_awards_system;
                  return (
                    <Tooltip key={ua.id}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 bg-chart-3/5 border border-chart-3/15 rounded-xl px-3 py-2 hover:bg-chart-3/10 transition-colors cursor-default">
                          {award?.logo_url ? (
                            <img src={award.logo_url} alt={award.name} className="h-5 w-5 object-contain" />
                          ) : (
                            <Star className="h-4 w-4 text-chart-3" />
                          )}
                          <span className="text-xs font-medium">{isAr ? (award?.name_ar || award?.name) : award?.name}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{isAr ? (award?.description_ar || award?.description || award?.name) : (award?.description || award?.name)}</TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Competition Stats */}
        {hasStats && !hasRankings && (
          <Card className="rounded-2xl border-border/25 overflow-hidden group hover:shadow-lg transition-all duration-500 sm:col-span-2">
            <CardContent className="p-4">
              <div className="flex items-center gap-4 justify-center">
                {compStats.competitions > 0 && (
                  <div className="flex flex-col items-center gap-1">
                    <div className="h-12 w-12 rounded-xl bg-chart-4/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Trophy className="h-5 w-5 text-chart-4" />
                    </div>
                    <span className="text-lg font-bold tabular-nums"><AnimatedCounter value={compStats.competitions} /></span>
                    <span className="text-[10px] text-muted-foreground">{isAr ? "مسابقة" : "Competitions"}</span>
                  </div>
                )}
                {compStats.certificates > 0 && (
                  <div className="flex flex-col items-center gap-1">
                    <div className="h-12 w-12 rounded-xl bg-chart-2/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Award className="h-5 w-5 text-chart-2" />
                    </div>
                    <span className="text-lg font-bold tabular-nums"><AnimatedCounter value={compStats.certificates} /></span>
                    <span className="text-[10px] text-muted-foreground">{isAr ? "شهادة" : "Certificates"}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
