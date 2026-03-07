import { useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePointsBalance, usePointsLedger, usePointsRewards, useEarningRules, useRedeemReward, useMyRedemptions } from "@/hooks/usePoints";
import { Star, Gift, History, ShoppingBag, Zap, TrendingUp, Loader2, CheckCircle2, Crown, ArrowUp, ArrowDown } from "lucide-react";
import { Link } from "react-router-dom";
import { toEnglishDigits } from "@/lib/formatNumber";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export default function Rewards() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();

  const { data: balance } = usePointsBalance();
  const { data: ledger } = usePointsLedger();
  const { data: rewards } = usePointsRewards();
  const { data: earningRules } = useEarningRules();
  const { data: redemptions } = useMyRedemptions();
  const redeemReward = useRedeemReward();

  const totalEarned = useMemo(() => ledger?.filter((l) => l.points > 0).reduce((sum, l) => sum + l.points, 0) || 0, [ledger]);
  const totalSpent = useMemo(() => ledger?.filter((l) => l.points < 0).reduce((sum, l) => sum + Math.abs(l.points), 0) || 0, [ledger]);

  if (!user) return null;

  return (
    <PageShell
      title={isAr ? "النقاط والمكافآت" : "Points & Rewards"}
      description="Earn and redeem points"
    >
      {/* Hero */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-chart-4/10 via-background to-primary/10 p-6 sm:p-8">
        <div className="pointer-events-none absolute -end-20 -top-20 h-56 w-56 rounded-full bg-chart-4/8 blur-[100px]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-chart-4/10 ring-4 ring-chart-4/5">
              <Star className="h-7 w-7 text-chart-4" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold sm:text-3xl">
                {isAr ? "النقاط والمكافآت" : "Points & Rewards"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isAr ? "اكسب نقاطاً واستبدلها بمكافآت حصرية" : "Earn points and redeem exclusive rewards"}
              </p>
            </div>
          </div>
          <Link to="/referrals">
            <Button variant="outline" className="gap-2">
              <Gift className="h-4 w-4" />
              {isAr ? "الإحالات" : "Referrals"}
            </Button>
          </Link>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <Card className="border-chart-4/20 bg-card/80">
            <CardContent className="p-4 text-center">
              <AnimatedCounter value={balance || 0} className="text-3xl font-bold text-chart-4" />
              <p className="text-xs text-muted-foreground mt-1">{isAr ? "الرصيد الحالي" : "Current Balance"}</p>
            </CardContent>
          </Card>
          <Card className="border-chart-2/20 bg-card/80">
            <CardContent className="p-4 text-center">
              <AnimatedCounter value={totalEarned} className="text-3xl font-bold text-chart-2" />
              <p className="text-xs text-muted-foreground mt-1">{isAr ? "إجمالي المكتسب" : "Total Earned"}</p>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-card/80">
            <CardContent className="p-4 text-center">
              <AnimatedCounter value={totalSpent} className="text-3xl font-bold text-primary" />
              <p className="text-xs text-muted-foreground mt-1">{isAr ? "إجمالي المستبدل" : "Total Redeemed"}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="rewards" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rewards" className="gap-1.5">
            <Gift className="h-4 w-4" />
            <span className="hidden sm:inline">{isAr ? "المكافآت" : "Rewards"}</span>
          </TabsTrigger>
          <TabsTrigger value="earn" className="gap-1.5">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">{isAr ? "اكسب" : "Earn"}</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">{isAr ? "السجل" : "History"}</span>
          </TabsTrigger>
          <TabsTrigger value="redeemed" className="gap-1.5">
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">{isAr ? "مستبدلة" : "Redeemed"}</span>
          </TabsTrigger>
        </TabsList>

        {/* Rewards Catalog */}
        <TabsContent value="rewards">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rewards?.map((reward) => {
              const canAfford = (balance || 0) >= reward.points_cost;
              return (
                <Card key={reward.id} className={`transition-all hover:shadow-md ${canAfford ? "" : "opacity-60"}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="outline" className="capitalize text-xs">{reward.category}</Badge>
                      <Badge className="bg-chart-4/20 text-chart-4 font-bold">
                        <Star className="h-3 w-3 me-1" />
                        <AnimatedCounter value={reward.points_cost} className="inline" />
                      </Badge>
                    </div>
                    <h3 className="font-semibold">{isAr ? reward.name_ar : reward.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{isAr ? reward.description_ar : reward.description}</p>
                    <Button
                      className="w-full mt-4 gap-1.5"
                      disabled={!canAfford || redeemReward.isPending}
                      onClick={() => redeemReward.mutate({ rewardId: reward.id, pointsCost: reward.points_cost })}
                      variant={canAfford ? "default" : "outline"}
                    >
                      {redeemReward.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
                      {canAfford ? (isAr ? "استبدال" : "Redeem") : (isAr ? "نقاط غير كافية" : "Not enough points")}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* How to Earn */}
        <TabsContent value="earn">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                {isAr ? "طرق كسب النقاط" : "Ways to Earn Points"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {earningRules?.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between rounded-xl border p-3.5 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                        <Zap className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{isAr ? rule.action_label_ar : rule.action_label}</p>
                        {rule.max_per_day && (
                          <p className="text-[10px] text-muted-foreground">
                            {isAr ? <>{`الحد الأقصى: `}<AnimatedCounter value={rule.max_per_day} className="inline" />{`/يوم`}</> : `Max: ${rule.max_per_day}/day`}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge className="bg-chart-4/20 text-chart-4 font-bold text-sm">
                      +<AnimatedCounter value={rule.points} className="inline" />
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{isAr ? "سجل النقاط" : "Points History"}</CardTitle>
            </CardHeader>
            <CardContent>
              {!ledger?.length ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  {isAr ? "لا توجد معاملات بعد" : "No transactions yet"}
                </p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {ledger.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between rounded-xl border p-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${entry.points > 0 ? "bg-chart-2/10" : "bg-destructive/10"}`}>
                          {entry.points > 0 ? <ArrowUp className="h-4 w-4 text-chart-2" /> : <ArrowDown className="h-4 w-4 text-destructive" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{isAr ? entry.description_ar : entry.description}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {toEnglishDigits(new Date(entry.created_at).toLocaleDateString(isAr ? "ar" : "en"))} • {isAr ? "الرصيد:" : "Balance:"} <AnimatedCounter value={entry.balance_after} className="inline" />
                          </p>
                        </div>
                      </div>
                      <span className={`font-bold ${entry.points > 0 ? "text-chart-2" : "text-destructive"}`}>
                        {entry.points > 0 ? "+" : ""}<AnimatedCounter value={Math.abs(entry.points)} className="inline" />
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Redeemed */}
        <TabsContent value="redeemed">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{isAr ? "المكافآت المستبدلة" : "Redeemed Rewards"}</CardTitle>
            </CardHeader>
            <CardContent>
              {!redemptions?.length ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  {isAr ? "لم تستبدل أي مكافآت بعد" : "No rewards redeemed yet"}
                </p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {redemptions.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between rounded-xl border p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                          <Gift className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{isAr ? r.points_rewards?.name_ar : r.points_rewards?.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {toEnglishDigits(new Date(r.created_at).toLocaleDateString(isAr ? "ar" : "en"))}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.redemption_code && (
                          <Badge variant="outline" className="font-mono text-xs">{r.redemption_code}</Badge>
                        )}
                        <Badge className={r.status === "fulfilled" ? "bg-chart-2/20 text-chart-2" : "bg-chart-4/20 text-chart-4"}>
                          {r.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
