import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import { Flame, Clock, CheckCircle2, CalendarCheck, Lock } from "lucide-react";

const STATUS_CONFIG: Record<string, {
  icon: React.ElementType;
  labelEn: string;
  labelAr: string;
  classes: string;
}> = {
  registration_open: {
    icon: Flame,
    labelEn: "Open",
    labelAr: "مفتوح",
    classes: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  },
  closing_soon: {
    icon: Clock,
    labelEn: "Closing Soon",
    labelAr: "يغلق قريباً",
    classes: "bg-destructive/10 text-destructive border-destructive/20",
  },
  active: {
    icon: Flame,
    labelEn: "Live",
    labelAr: "مباشر",
    classes: "bg-primary/10 text-primary border-primary/20",
  },
  completed: {
    icon: CheckCircle2,
    labelEn: "Completed",
    labelAr: "مكتمل",
    classes: "bg-muted text-muted-foreground border-border",
  },
  upcoming: {
    icon: CalendarCheck,
    labelEn: "Upcoming",
    labelAr: "قادم",
    classes: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  },
  registration_closed: {
    icon: Lock,
    labelEn: "Closed",
    labelAr: "مغلق",
    classes: "bg-muted text-muted-foreground border-border",
  },
};

interface Props {
  status: string;
  size?: "sm" | "md";
}

export function CompetitionStatusChip({ status, size = "sm" }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.upcoming;
  const Icon = config.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full border font-medium",
      size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
      config.classes,
    )}>
      <Icon className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
      {isAr ? config.labelAr : config.labelEn}
    </span>
  );
}
