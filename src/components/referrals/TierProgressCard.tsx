import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useReferralTiers } from "@/hooks/useReferralExtras";
import { useReferralStats } from "@/hooks/useReferral";
import { Layers, ChevronRight, Star } from "lucide-react";

export const TierProgressCard = memo(function TierProgressCard() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: tiers } = useReferralTiers();
  const { data: stats } = useReferralStats();

  if (!tiers?.length) return null;

  const currentConversions = stats?.conversionsCount || 0;

  // Find current tier
  const currentTier = tiers
    .filter((t) => currentConversions >= t.min_referrals)
    .sort((a, b) => b.min_referrals - a.min_referrals)[0];

  const nextTier = tiers.find((t) => t.min_referrals > currentConversions);

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
            <Layers className="h-4 w-4 text-primary" />
          </div>
          {isAr ? "مستويات المكافآت" : "Reward Tiers"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tiers.map((tier) => {
            const isActive = currentTier?.id === tier.id;
            const isCompleted = currentConversions >= tier.min_referrals;
            const rangeLabel = tier.max_referrals
              ? `${tier.min_referrals}–${tier.max_referrals}`
              : `${tier.min_referrals}+`;

            return (
              <div
                key={tier.id}
                className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                  isActive
                    ? "border-primary/30 bg-primary/5 shadow-sm"
                    : isCompleted
                    ? "border-chart-2/20 bg-chart-2/5"
                    : "opacity-60"
                }`}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                  isActive ? "bg-primary/10" : isCompleted ? "bg-chart-2/10" : "bg-muted"
                }`}>
                  {isActive ? (
                    <ChevronRight className="h-4 w-4 text-primary" />
                  ) : (
                    <Star className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {isAr ? tier.label_ar || tier.label : tier.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {rangeLabel} {isAr ? "إحالة" : "referrals"}
                  </p>
                </div>
                <Badge variant={isActive ? "default" : "outline"} className="text-[10px]">
                  +{tier.bonus_points} {isAr ? "نقطة إضافية" : "bonus pts"}
                </Badge>
              </div>
            );
          })}
        </div>
        {nextTier && (
          <p className="mt-3 text-xs text-muted-foreground text-center">
            {isAr
              ? `${nextTier.min_referrals - currentConversions} إحالة أخرى للوصول إلى المستوى التالي`
              : `${nextTier.min_referrals - currentConversions} more referral${nextTier.min_referrals - currentConversions > 1 ? "s" : ""} to reach the next tier`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
