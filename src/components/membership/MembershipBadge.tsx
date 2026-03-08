import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Crown, Star, Sparkles, Shield } from "lucide-react";

interface MembershipBadgeProps {
  tier: string | null | undefined;
  isAr?: boolean;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
}

const TIER_CONFIG: Record<string, {
  en: string;
  ar: string;
  icon: typeof Crown;
  className: string;
  benefits: { en: string[]; ar: string[] };
}> = {
  professional: {
    en: "Pro",
    ar: "محترف",
    icon: Star,
    className: "bg-primary/10 text-primary border-primary/30 hover:bg-primary/15",
    benefits: {
      en: ["Create competitions & exhibitions", "Professional profile tools", "Priority support", "Advanced analytics"],
      ar: ["إنشاء المسابقات والمعارض", "أدوات الملف المهني", "دعم ذو أولوية", "تحليلات متقدمة"],
    },
  },
  enterprise: {
    en: "Enterprise",
    ar: "مؤسسي",
    icon: Crown,
    className: "bg-chart-3/10 text-chart-3 border-chart-3/30 hover:bg-chart-3/15",
    benefits: {
      en: ["All Pro features", "Team management", "Custom branding", "API access", "Dedicated account manager"],
      ar: ["جميع مميزات المحترف", "إدارة الفريق", "علامة تجارية مخصصة", "الوصول للواجهة البرمجية", "مدير حساب مخصص"],
    },
  },
};

const SIZE_CLASSES = {
  sm: "text-[9px] h-4 px-1.5 gap-0.5",
  md: "text-[10px] h-5 px-2 gap-1",
  lg: "text-xs h-6 px-2.5 gap-1.5",
};

const ICON_SIZES = { sm: "h-2.5 w-2.5", md: "h-3 w-3", lg: "h-3.5 w-3.5" };

export const MembershipBadge = memo(function MembershipBadge({ tier, isAr = false, size = "md", showTooltip = true }: MembershipBadgeProps) {
  if (!tier || tier === "basic") return null;

  const config = TIER_CONFIG[tier];
  if (!config) return null;

  const Icon = config.icon;
  const label = isAr ? config.ar : config.en;

  const badge = (
    <Badge
      variant="outline"
      className={`${config.className} ${SIZE_CLASSES[size]} rounded-xl font-semibold transition-colors cursor-default`}
    >
      <Icon className={ICON_SIZES[size]} />
      {label}
    </Badge>
  );

  if (!showTooltip) return badge;

  const benefits = isAr ? config.benefits.ar : config.benefits.en;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[220px] p-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-xs">
            <Icon className="h-3.5 w-3.5" />
            {isAr ? `عضو ${config.ar}` : `${config.en} Member`}
          </div>
          <ul className="space-y-0.5">
            {benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-1 text-[10px] text-muted-foreground">
                <Sparkles className="h-2.5 w-2.5 mt-0.5 shrink-0 text-primary/60" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
