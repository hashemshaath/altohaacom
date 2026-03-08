import { memo } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import { Flame, Clock, CheckCircle2, CalendarCheck, Lock, PlayCircle } from "lucide-react";
import { deriveCompetitionStatus, type DerivedStatus } from "@/lib/competitionStatus";

const ICON_MAP: Record<DerivedStatus, React.ElementType> = {
  registration_upcoming: CalendarCheck,
  registration_open: Flame,
  registration_closing_soon: Clock,
  registration_closed: Lock,
  competition_starting_soon: CalendarCheck,
  in_progress: PlayCircle,
  ended: CheckCircle2,
};

interface Props {
  status?: string;
  registrationStart?: string | null;
  registrationEnd?: string | null;
  competitionStart?: string | null;
  competitionEnd?: string | null;
  size?: "sm" | "md";
}

export function CompetitionStatusChip({
  status,
  registrationStart,
  registrationEnd,
  competitionStart,
  competitionEnd,
  size = "sm",
}: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  // Use centralized date-based status engine
  const derived = deriveCompetitionStatus({
    registrationStart,
    registrationEnd,
    competitionStart,
    competitionEnd,
    dbStatus: status,
  });

  const Icon = ICON_MAP[derived.status] || CalendarCheck;

  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full border font-medium",
      size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
      derived.color, "border-current/20",
    )}>
      {derived.status === "in_progress" ? (
        <span className="relative me-0.5 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
        </span>
      ) : (
        <Icon className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
      )}
      {isAr ? derived.labelAr : derived.label}
      {derived.urgent && derived.daysLeft && (
        <span className="ms-0.5 font-bold">({derived.daysLeft}d)</span>
      )}
    </span>
  );
}
