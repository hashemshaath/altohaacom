import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { useActiveBonusCampaigns } from "@/hooks/useReferralExtras";
import { Zap, Clock } from "lucide-react";

export const BonusCampaignBanner = memo(function BonusCampaignBanner() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: campaigns } = useActiveBonusCampaigns();

  if (!campaigns?.length) return null;

  const campaign = campaigns[0]; // Show the most recent active campaign
  const endsAt = new Date(campaign.ends_at);
  const now = new Date();
  const hoursLeft = Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60)));
  const daysLeft = Math.floor(hoursLeft / 24);

  const timeLabel = daysLeft > 0
    ? `${daysLeft}${isAr ? " يوم" : "d"} ${hoursLeft % 24}${isAr ? " ساعة" : "h"}`
    : `${hoursLeft}${isAr ? " ساعة" : "h"}`;

  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-chart-4/30 bg-gradient-to-r from-chart-4/10 via-primary/5 to-chart-2/10 p-4">
      <div className="pointer-events-none absolute -end-8 -top-8 h-24 w-24 rounded-full bg-chart-4/15 blur-[40px] animate-pulse" />
      <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-4/20 animate-pulse">
            <Zap className="h-5 w-5 text-chart-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">
                {isAr ? campaign.name_ar || campaign.name : campaign.name}
              </h3>
              <Badge className="bg-chart-4/20 text-chart-4 text-[10px] animate-pulse">
                {isAr ? campaign.badge_text_ar || "مكافأة" : campaign.badge_text || "BONUS"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAr ? campaign.description_ar || campaign.description : campaign.description}
              {campaign.multiplier && Number(campaign.multiplier) > 1 && (
                <span className="font-bold text-chart-4"> • {campaign.multiplier}x {isAr ? "نقاط" : "points"}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{isAr ? "ينتهي خلال" : "Ends in"} {timeLabel}</span>
        </div>
      </div>
    </div>
  );
}
