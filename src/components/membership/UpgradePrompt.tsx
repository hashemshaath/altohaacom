import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Lock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface UpgradePromptProps {
  featureName?: string;
  featureNameAr?: string;
  /** "inline" = small banner, "card" = prominent card, "minimal" = just a lock icon + text */
  variant?: "inline" | "card" | "minimal";
  className?: string;
}

export function UpgradePrompt({
  featureName,
  featureNameAr,
  variant = "inline",
  className,
}: UpgradePromptProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAr = language === "ar";

  const displayName = isAr ? (featureNameAr || featureName) : featureName;

  const handleUpgrade = () => {
    if (!user) {
      navigate("/login");
    } else {
      navigate("/membership");
    }
  };

  if (variant === "minimal") {
    return (
      <button
        onClick={handleUpgrade}
        className={cn(
          "inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors group",
          className
        )}
      >
        <Lock className="h-3 w-3" />
        <span className="group-hover:underline">
          {isAr ? "ترقية للوصول" : "Upgrade to access"}
        </span>
      </button>
    );
  }

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border border-primary/15 bg-gradient-to-r from-primary/5 via-background to-primary/5 px-4 py-3",
          className
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Lock className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {displayName
              ? (isAr ? `${displayName} — ميزة مميزة` : `${displayName} — Premium Feature`)
              : (isAr ? "ميزة مميزة" : "Premium Feature")}
          </p>
          <p className="text-xs text-muted-foreground">
            {isAr
              ? "قم بترقية عضويتك للوصول إلى هذه الميزة"
              : "Upgrade your membership to unlock this feature"}
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleUpgrade}
          className="shrink-0 gap-1.5 rounded-lg text-xs shadow-sm"
        >
          <Crown className="h-3.5 w-3.5" />
          {isAr ? "ترقية" : "Upgrade"}
        </Button>
      </div>
    );
  }

  // card variant
  return (
    <Card className={cn(
      "relative overflow-hidden border-primary/15 bg-gradient-to-br from-primary/5 via-background to-chart-3/5",
      className
    )}>
      {/* Decorative glow */}
      <div className="absolute -top-20 -end-20 h-40 w-40 rounded-full bg-primary/8 blur-3xl" />
      <div className="absolute -bottom-10 -start-10 h-32 w-32 rounded-full bg-chart-3/8 blur-3xl" />

      <CardContent className="relative flex flex-col items-center gap-4 py-8 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-4 ring-primary/5">
          <Sparkles className="h-7 w-7 text-primary" />
        </div>

        <div className="space-y-1.5 max-w-sm">
          <h3 className="text-lg font-bold tracking-tight">
            {displayName
              ? (isAr ? `اكتشف ${displayName}` : `Unlock ${displayName}`)
              : (isAr ? "اكتشف المزيد" : "Unlock More")}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isAr
              ? "قم بترقية عضويتك للوصول إلى هذه الميزة الحصرية والعديد من المزايا الأخرى"
              : "Upgrade your membership to access this exclusive feature and many more premium benefits"}
          </p>
        </div>

        <Button
          onClick={handleUpgrade}
          className="gap-2 rounded-xl px-6 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
        >
          <Crown className="h-4 w-4" />
          {isAr ? "ترقية العضوية" : "Upgrade Membership"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
