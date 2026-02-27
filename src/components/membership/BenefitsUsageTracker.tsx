import { useLanguage } from "@/i18n/LanguageContext";
import { useBenefitUsage } from "@/hooks/useBenefitUsage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText, Camera, MessageSquare, Trophy, Video, Link, Zap, ChefHat,
  Infinity, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, any> = {
  FileText, Camera, MessageSquare, Trophy, Video, Link, Zap, ChefHat,
};

export function BenefitsUsageTracker() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: benefits, isLoading } = useBenefitUsage();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!benefits || benefits.length === 0) return null;

  // Group by category
  const categories = new Map<string, typeof benefits>();
  for (const b of benefits) {
    if (!categories.has(b.category)) categories.set(b.category, []);
    categories.get(b.category)!.push(b);
  }

  const CATEGORY_LABELS: Record<string, { en: string; ar: string }> = {
    content: { en: "Content", ar: "المحتوى" },
    engagement: { en: "Engagement", ar: "التفاعل" },
    activity: { en: "Activity", ar: "النشاط" },
    tools: { en: "Tools", ar: "الأدوات" },
    general: { en: "General", ar: "عام" },
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          {isAr ? "استخدام المزايا هذا الشهر" : "Benefits Usage This Month"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {Array.from(categories.entries()).map(([category, items]) => (
          <div key={category} className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {CATEGORY_LABELS[category]?.[isAr ? "ar" : "en"] || category}
            </p>
            <div className="space-y-3">
              {items.map((benefit) => {
                const Icon = ICON_MAP[benefit.iconName] || Zap;
                const isUnlimited = benefit.monthlyLimit === null;
                const isNearLimit = !isUnlimited && benefit.percentUsed >= 80;
                const isAtLimit = !isUnlimited && benefit.percentUsed >= 100;

                return (
                  <div key={benefit.benefitCode} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={cn("h-3.5 w-3.5", isAtLimit ? "text-destructive" : "text-muted-foreground")} />
                        <span className="text-sm font-medium">
                          {isAr ? (benefit.benefitNameAr || benefit.benefitName) : benefit.benefitName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isAtLimit && <AlertTriangle className="h-3 w-3 text-destructive" />}
                        {isNearLimit && !isAtLimit && <AlertTriangle className="h-3 w-3 text-chart-2" />}
                        <span className={cn(
                          "text-xs font-medium tabular-nums",
                          isAtLimit ? "text-destructive" : isNearLimit ? "text-chart-2" : "text-muted-foreground"
                        )}>
                          {benefit.currentUsage}
                          {isUnlimited ? (
                            <span className="inline-flex items-center ms-0.5">
                              /<Infinity className="h-3 w-3 inline" />
                            </span>
                          ) : (
                            <span>/{benefit.monthlyLimit}</span>
                          )}
                        </span>
                        {isUnlimited && (
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                            {isAr ? "غير محدود" : "Unlimited"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {!isUnlimited && (
                      <Progress
                        value={benefit.percentUsed}
                        className={cn(
                          "h-1.5",
                          isAtLimit && "[&>div]:bg-destructive",
                          isNearLimit && !isAtLimit && "[&>div]:bg-chart-2"
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
