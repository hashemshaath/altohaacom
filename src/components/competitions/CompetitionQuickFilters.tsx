import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import { Flame, CalendarCheck, Trophy, Clock } from "lucide-react";

const FILTERS = [
  { id: "all", icon: Trophy, en: "All", ar: "الكل" },
  { id: "upcoming", icon: CalendarCheck, en: "Upcoming", ar: "قادمة" },
  { id: "active", icon: Flame, en: "Active", ar: "نشطة" },
  { id: "past", icon: Clock, en: "Past", ar: "سابقة" },
] as const;

interface Props {
  active: string;
  onChange: (id: string) => void;
  counts?: Record<string, number>;
}

export const CompetitionQuickFilters = memo(function CompetitionQuickFilters({ active, onChange, counts }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      {FILTERS.map((f) => {
        const Icon = f.icon;
        const isActive = active === f.id;
        const count = counts?.[f.id];
        return (
          <button
            key={f.id}
            onClick={() => onChange(f.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 whitespace-nowrap",
              "border active:scale-95",
              isActive
                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/15"
                : "bg-card text-muted-foreground border-border/50 hover:bg-muted hover:text-foreground hover:border-border hover:shadow-sm"
            )}
          >
            <Icon className={cn("h-3.5 w-3.5 transition-transform", isActive && "scale-110")} />
            {isAr ? f.ar : f.en}
            {count != null && count > 0 && (
              <span className={cn(
                "rounded-full px-1.5 py-0.5 text-[9px] font-black leading-none tabular-nums",
                isActive ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"
              )}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
