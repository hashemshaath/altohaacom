import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Star, Users, ChefHat, Heart, Sparkles, Share2 } from "lucide-react";

interface BadgeCardProps {
  badge: {
    id: string;
    name: string;
    name_ar?: string | null;
    description?: string | null;
    description_ar?: string | null;
    badge_type: string;
    color?: string | null;
  };
  competitionTitle?: string;
  earnedAt?: string;
  shareToken?: string;
  showShare?: boolean;
}

const BADGE_ICONS: Record<string, any> = {
  gold_winner: Trophy,
  silver_winner: Medal,
  bronze_winner: Award,
  participant: Star,
  judge: ChefHat,
  organizer: Users,
  volunteer: Heart,
  sponsor: Sparkles,
  special: Sparkles,
};

export const BadgeCard = memo(function BadgeCard({ badge, competitionTitle, earnedAt, shareToken, showShare }: BadgeCardProps) {
  const { language } = useLanguage();
  const Icon = BADGE_ICONS[badge.badge_type] || Star;
  const name = language === "ar" && badge.name_ar ? badge.name_ar : badge.name;
  const desc = language === "ar" && badge.description_ar ? badge.description_ar : badge.description;

  const handleShare = () => {
    const url = `${window.location.origin}/verify?badge=${shareToken}`;
    const text = language === "ar"
      ? `🏆 حصلت على شارة "${name}" ${competitionTitle ? `في ${competitionTitle}` : ""} على منصة الطهاة!`
      : `🏆 I earned the "${name}" badge ${competitionTitle ? `at ${competitionTitle}` : ""} on Altoha!`;

    if (navigator.share) {
      navigator.share({ title: name, text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
    }
  };

  return (
    <Card className="group overflow-hidden border-border/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20">
      <CardContent className="flex flex-col items-center p-5 text-center">
        <div
          className="mb-3 flex h-18 w-18 items-center justify-center rounded-2xl ring-4 ring-border/20 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl"
          style={{
            backgroundColor: `${badge.color || "#c9a227"}15`,
          }}
        >
          <Icon className="h-8 w-8 transition-transform duration-300 group-hover:rotate-12" style={{ color: badge.color || "#c9a227" }} />
        </div>
        <p className="font-semibold text-sm">{name}</p>
        {desc && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{desc}</p>}
        {competitionTitle && (
          <Badge variant="outline" className="mt-2 text-xs">
            {competitionTitle}
          </Badge>
        )}
        {earnedAt && (
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            {new Date(earnedAt).toLocaleDateString(language === "ar" ? "ar" : "en")}
          </p>
        )}
        {showShare && shareToken && (
          <Button variant="ghost" size="sm" className="mt-2 gap-1.5 text-xs transition-all active:scale-95" onClick={handleShare}>
            <Share2 className="h-3 w-3" />
            {language === "ar" ? "مشاركة" : "Share"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
});
