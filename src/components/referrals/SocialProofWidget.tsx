import { useLanguage } from "@/i18n/LanguageContext";
import { useSocialProofStats } from "@/hooks/useReferralExtras";
import { Users, TrendingUp } from "lucide-react";

export function SocialProofWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: stats } = useSocialProofStats();

  if (!stats || (stats.recentConversions === 0 && stats.totalActiveReferrers === 0)) return null;

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
      {stats.recentConversions > 0 && (
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-chart-2" />
          <span>
            <span className="font-bold text-foreground">{stats.recentConversions}</span>{" "}
            {isAr ? "صديق انضم هذا الشهر" : "friends joined this month"}
          </span>
        </div>
      )}
      {stats.totalActiveReferrers > 0 && (
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-primary" />
          <span>
            <span className="font-bold text-foreground">{stats.totalActiveReferrers}</span>{" "}
            {isAr ? "مُحيل نشط" : "active referrers"}
          </span>
        </div>
      )}
    </div>
  );
}
