import { useMemo, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Gift, Star, Copy, Share2, TrendingUp, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { useReferralCode, useReferralStats } from "@/hooks/useReferral";
import { usePointsBalance } from "@/hooks/usePoints";
import { useToast } from "@/hooks/use-toast";

const REWARD_TIERS = [
  { target: 5, reward: 500, label: "Bronze", labelAr: "برونزي" },
  { target: 15, reward: 1500, label: "Silver", labelAr: "فضي" },
  { target: 30, reward: 5000, label: "Gold", labelAr: "ذهبي" },
];

export function ReferralWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const { data: referralCode } = useReferralCode();
  const { data: stats } = useReferralStats();
  const { data: pointsBalance } = usePointsBalance();

  const invites = stats?.invitationsCount || 0;
  const converts = stats?.conversionsCount || 0;
  const conversionRate = invites > 0 ? Math.round((converts / invites) * 100) : 0;

  const currentTier = useMemo(() => {
    for (let i = REWARD_TIERS.length - 1; i >= 0; i--) {
      if (converts >= REWARD_TIERS[i].target) return i;
    }
    return -1;
  }, [converts]);

  const nextTier = currentTier < REWARD_TIERS.length - 1 ? REWARD_TIERS[currentTier + 1] : null;
  const progressToNext = nextTier ? Math.min(100, Math.round((converts / nextTier.target) * 100)) : 100;

  const referralLink = referralCode?.code
    ? `${window.location.origin}/auth?ref=${referralCode.code}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: isAr ? "تم نسخ الرابط!" : "Link copied!" });
  };

  return (
    <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-primary/5 via-background to-chart-4/5">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{isAr ? "ادعُ واكسب" : "Invite & Earn"}</h3>
              <p className="text-[10px] text-muted-foreground">{isAr ? "اكسب نقاطاً لكل صديق" : "Earn points per friend"}</p>
            </div>
          </div>
          <Badge className="bg-chart-4/20 text-chart-4 font-bold">
            <Star className="h-3 w-3 me-1" />
            {pointsBalance || 0}
          </Badge>
        </div>

        {/* Funnel Stats */}
        <div className="grid grid-cols-3 gap-1.5 mb-4">
          <div className="rounded-xl bg-muted/50 p-2 text-center">
            <p className="text-lg font-bold">{invites}</p>
            <p className="text-[9px] text-muted-foreground uppercase">{isAr ? "دعوات" : "Invites"}</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-2 text-center">
            <p className="text-lg font-bold">{converts}</p>
            <p className="text-[9px] text-muted-foreground uppercase">{isAr ? "تحويلات" : "Converts"}</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-2 text-center">
            <p className="text-lg font-bold flex items-center justify-center gap-0.5">
              {conversionRate}%
              <TrendingUp className="h-3 w-3 text-chart-5" />
            </p>
            <p className="text-[9px] text-muted-foreground uppercase">{isAr ? "معدل" : "Rate"}</p>
          </div>
        </div>

        {/* Tier Progress */}
        {nextTier && (
          <div className="mb-4 rounded-xl bg-muted/30 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] font-semibold">
                  {isAr ? `هدف ${nextTier.labelAr}` : `${nextTier.label} Goal`}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">
                {converts}/{nextTier.target}
              </span>
            </div>
            <Progress value={progressToNext} className="h-1.5" />
            <p className="text-[9px] text-muted-foreground mt-1.5">
              {isAr
                ? `${nextTier.target - converts} دعوة متبقية لكسب ${nextTier.reward} نقطة`
                : `${nextTier.target - converts} more to earn ${nextTier.reward} points`}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={copyLink} className="flex-1 gap-1.5 text-xs">
            <Copy className="h-3.5 w-3.5" />
            {isAr ? "نسخ" : "Copy"}
          </Button>
          <Link to="/referrals" className="flex-1">
            <Button size="sm" className="w-full gap-1.5 text-xs">
              <Share2 className="h-3.5 w-3.5" />
              {isAr ? "التفاصيل" : "Details"}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}