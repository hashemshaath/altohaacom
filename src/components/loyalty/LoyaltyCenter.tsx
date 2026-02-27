import { useLanguage } from "@/i18n/LanguageContext";
import { useLoyaltyTiers, useUserTier, useChallenges, useUserChallenges, useRewardsCatalog, useUserRedemptions, useRedeemLoyaltyReward, useUserBadges, useUserStreaks } from "@/hooks/useLoyalty";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Crown, Trophy, Gift, Flame, Star, Lock, Check, Sparkles } from "lucide-react";
import { SeasonalChallenges } from "./SeasonalChallenges";

export function LoyaltyCenter() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();

  const { data: tiers = [] } = useLoyaltyTiers();
  const { data: tierData } = useUserTier();
  const { data: challenges = [] } = useChallenges();
  const { data: userChallenges = [] } = useUserChallenges();
  const { data: rewards = [] } = useRewardsCatalog();
  const { data: redemptions = [] } = useUserRedemptions();
  const { data: badges = [] } = useUserBadges();
  const { data: streaks = [] } = useUserStreaks();
  const redeemMutation = useRedeemLoyaltyReward();

  const currentTier = tierData?.currentTier;
  const nextTier = tierData?.nextTier;
  const points = tierData?.points || 0;
  const progress = tierData?.progress || 0;

  const getUserChallengeProgress = (challengeId: string) => {
    return userChallenges.find((uc: any) => uc.challenge_id === challengeId);
  };

  const handleRedeem = (reward: any) => {
    if (points < reward.points_cost) {
      toast({ title: isAr ? "نقاط غير كافية" : "Not enough points", variant: "destructive" });
      return;
    }
    redeemMutation.mutate(
      { rewardId: reward.id, pointsCost: reward.points_cost },
      { onSuccess: () => toast({ title: isAr ? "تم الاستبدال بنجاح!" : "Redeemed successfully!" }) }
    );
  };

  const difficultyColors: Record<string, string> = {
    easy: "bg-chart-3/10 text-chart-3",
    medium: "bg-chart-1/10 text-chart-1",
    hard: "bg-destructive/10 text-destructive",
    legendary: "bg-primary/10 text-primary",
  };

  const loginStreak = streaks.find((s: any) => s.streak_type === "daily_login");

  return (
    <div className="space-y-6">
      {/* Tier Progress Hero */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Current Tier */}
            <div className="text-center">
              <span className="text-5xl">{currentTier?.icon_emoji || "⭐"}</span>
              <h2 className="text-xl font-bold mt-2">{isAr ? currentTier?.name_ar : currentTier?.name}</h2>
              <p className="text-sm text-muted-foreground">{isAr ? "مستواك الحالي" : "Your Current Tier"}</p>
            </div>

            {/* Progress */}
            <div className="flex-1 w-full space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{points.toLocaleString()} {isAr ? "نقطة" : "points"}</span>
                {nextTier && (
                  <span className="text-sm text-muted-foreground">
                    {nextTier.min_points.toLocaleString()} {isAr ? "للمستوى التالي" : "for next tier"}
                  </span>
                )}
              </div>
              <Progress value={progress} className="h-3" />
              <div className="flex gap-1 justify-between">
                {tiers.map((t: any) => (
                  <div key={t.id} className="flex flex-col items-center">
                    <span className={`text-sm ${points >= t.min_points ? "" : "opacity-40"}`}>{t.icon_emoji}</span>
                    <span className="text-[10px] text-muted-foreground">{t.min_points.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Multiplier */}
            <div className="text-center bg-primary/10 rounded-xl p-4">
              <Sparkles className="h-5 w-5 text-primary mx-auto" />
              <p className="text-2xl font-bold text-primary">×{currentTier?.multiplier || 1}</p>
              <p className="text-xs text-muted-foreground">{isAr ? "مضاعف النقاط" : "Points Multiplier"}</p>
            </div>
          </div>

          {/* Streak */}
          {loginStreak && (
            <div className="mt-4 flex items-center gap-3 bg-muted/50 rounded-lg p-3">
              <Flame className="h-5 w-5 text-chart-1" />
              <div>
                <span className="font-bold text-lg">{loginStreak.current_streak}</span>
                <span className="text-sm text-muted-foreground ms-1">{isAr ? "يوم متتالي" : "day streak"}</span>
              </div>
              <Badge variant="outline" className="ms-auto">
                {isAr ? "الأعلى:" : "Best:"} {loginStreak.longest_streak}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seasonal/Active Challenges Widget */}
      <SeasonalChallenges />

      <Tabs defaultValue="challenges">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="challenges"><Trophy className="h-4 w-4 me-1" />{isAr ? "التحديات" : "Challenges"}</TabsTrigger>
          <TabsTrigger value="rewards"><Gift className="h-4 w-4 me-1" />{isAr ? "المكافآت" : "Rewards"}</TabsTrigger>
          <TabsTrigger value="badges"><Star className="h-4 w-4 me-1" />{isAr ? "الشارات" : "Badges"}</TabsTrigger>
          <TabsTrigger value="tiers"><Crown className="h-4 w-4 me-1" />{isAr ? "المستويات" : "Tiers"}</TabsTrigger>
        </TabsList>

        {/* Challenges */}
        <TabsContent value="challenges" className="space-y-3">
          {challenges.map((c: any) => {
            const userProgress = getUserChallengeProgress(c.id);
            const pct = userProgress ? Math.min((userProgress.progress / c.target_count) * 100, 100) : 0;
            const completed = userProgress?.completed_at;

            return (
              <Card key={c.id} className={completed ? "opacity-70" : ""}>
                <CardContent className="p-4 flex items-center gap-4">
                  <span className="text-3xl">{c.icon_emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">{isAr ? c.title_ar : c.title}</h3>
                      <Badge variant="outline" className={`text-[10px] ${difficultyColors[c.difficulty] || ""}`}>{c.difficulty}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{isAr ? c.description_ar : c.description}</p>
                    <div className="mt-2">
                      <Progress value={pct} className="h-1.5" />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {userProgress?.progress || 0} / {c.target_count}
                      </p>
                    </div>
                  </div>
                  <div className="text-center shrink-0">
                    {completed ? (
                      <div className="flex items-center gap-1 text-chart-3">
                        <Check className="h-4 w-4" />
                        <span className="text-xs font-medium">{isAr ? "مكتمل" : "Done"}</span>
                      </div>
                    ) : (
                      <div>
                        <p className="text-lg font-bold text-primary">{c.reward_points}</p>
                        <p className="text-[10px] text-muted-foreground">{isAr ? "نقطة" : "pts"}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Rewards */}
        <TabsContent value="rewards">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((r: any) => {
              const canAfford = points >= r.points_cost;
              const tierIndex = tiers.findIndex((t: any) => t.slug === r.min_tier);
              const userTierIndex = tiers.findIndex((t: any) => t.slug === currentTier?.slug);
              const tierLocked = tierIndex > userTierIndex;

              return (
                <Card key={r.id} className={`${r.is_featured ? "border-primary/30" : ""}`}>
                  <CardContent className="p-4 space-y-3">
                    {r.is_featured && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                        {isAr ? "مميز" : "Featured"}
                      </Badge>
                    )}
                    <h3 className="font-semibold">{isAr ? r.name_ar : r.name}</h3>
                    <p className="text-xs text-muted-foreground">{isAr ? r.description_ar : r.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-primary" />
                        <span className="font-bold text-primary">{r.points_cost.toLocaleString()}</span>
                      </div>
                      {tierLocked ? (
                        <Badge variant="outline" className="text-[10px]">
                          <Lock className="h-3 w-3 me-1" />
                          {r.min_tier}
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          disabled={!canAfford || redeemMutation.isPending}
                          onClick={() => handleRedeem(r)}
                        >
                          {isAr ? "استبدال" : "Redeem"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Badges */}
        <TabsContent value="badges">
          {badges.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {badges.map((b: any) => (
                <Card key={b.id} className="text-center">
                  <CardContent className="p-4 space-y-2">
                    <span className="text-3xl">{b.badge_icon}</span>
                    <p className="font-medium text-sm">{isAr ? b.badge_name_ar : b.badge_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(b.earned_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>{isAr ? "لم تحصل على شارات بعد. أكمل التحديات لكسب الشارات!" : "No badges yet. Complete challenges to earn badges!"}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tiers */}
        <TabsContent value="tiers" className="space-y-3">
          {tiers.map((t: any) => {
            const isCurrentTier = t.slug === currentTier?.slug;
            const isReached = points >= t.min_points;

            return (
              <Card key={t.id} className={`${isCurrentTier ? "border-primary ring-1 ring-primary/20" : ""} ${!isReached ? "opacity-50" : ""}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <span className="text-4xl">{t.icon_emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">{isAr ? t.name_ar : t.name}</h3>
                      {isCurrentTier && <Badge>{isAr ? "حالي" : "Current"}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{t.min_points.toLocaleString()} {isAr ? "نقطة" : "points"} • ×{t.multiplier} {isAr ? "مضاعف" : "multiplier"}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(t.benefits as string[] || []).map((b: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-[10px]">{b}</Badge>
                      ))}
                    </div>
                  </div>
                  {isReached ? (
                    <Check className="h-6 w-6 text-chart-3" />
                  ) : (
                    <Lock className="h-6 w-6 text-muted-foreground" />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
