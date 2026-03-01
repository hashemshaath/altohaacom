import { forwardRef } from "react";
import { BadgeCheck, ShieldCheck, Award, Building2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";

interface VerifiedBadgeProps {
  level?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

const levelConfig: Record<string, { icon: typeof BadgeCheck; color: string; label: string; labelAr: string }> = {
  basic: {
    icon: BadgeCheck,
    color: "text-chart-3",
    label: "Verified",
    labelAr: "موثّق",
  },
  identity: {
    icon: ShieldCheck,
    color: "text-primary",
    label: "Identity Verified",
    labelAr: "هوية موثّقة",
  },
  professional: {
    icon: Award,
    color: "text-accent",
    label: "Professionally Verified",
    labelAr: "موثّق مهنياً",
  },
  organization: {
    icon: Building2,
    color: "text-chart-1",
    label: "Verified Organization",
    labelAr: "مؤسسة موثّقة",
  },
};

const sizeMap = { sm: "h-3.5 w-3.5", md: "h-4.5 w-4.5", lg: "h-5.5 w-5.5" };

export const VerifiedBadge = forwardRef<HTMLSpanElement, VerifiedBadgeProps>(
  ({ level, size = "md", className, showLabel = false }, ref) => {
    const { language } = useLanguage();
    if (!level || level === "none") return null;

    const config = levelConfig[level] || levelConfig.basic;
    const Icon = config.icon;
    const label = language === "ar" ? config.labelAr : config.label;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span ref={ref} className={cn("inline-flex items-center gap-1 group/badge", className)}>
            <span className="relative">
              <Icon className={cn(sizeMap[size], config.color, "transition-transform duration-300 group-hover/badge:scale-110")} />
              {level === "professional" || level === "organization" ? (
                <span className={cn("absolute -inset-1 rounded-full opacity-0 group-hover/badge:opacity-100 transition-opacity duration-300", level === "professional" ? "bg-accent/20" : "bg-chart-1/20")} />
              ) : null}
            </span>
            {showLabel && <span className={cn("text-xs font-medium", config.color)}>{label}</span>}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="flex items-center gap-1.5">
          <Icon className={cn("h-3.5 w-3.5", config.color)} />
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }
);
VerifiedBadge.displayName = "VerifiedBadge";
