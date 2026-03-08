import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Users, Trophy, BookOpen, Calendar, Eye, Globe, Briefcase } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface StatItem {
  icon: React.ElementType;
  value: string | number;
  label: string;
  labelAr: string;
}

interface Props {
  followerCount: number;
  memberCount?: number | null;
  competitionCount?: number;
  programCount?: number;
  eventCount?: number;
  positionCount?: number;
  foundedYear?: number | null;
  viewCount?: number | null;
  website?: string | null;
}

export const EntityStatsStrip = memo(function EntityStatsStrip({
  followerCount,
  memberCount,
  competitionCount = 0,
  programCount = 0,
  eventCount = 0,
  positionCount = 0,
  foundedYear,
  viewCount,
  website,
}: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const stats: StatItem[] = [
    { icon: Users, value: followerCount, label: "Followers", labelAr: "متابع" },
    ...(memberCount ? [{ icon: Users, value: memberCount, label: "Members", labelAr: "عضو" }] : []),
    ...(positionCount > 0 ? [{ icon: Briefcase, value: positionCount, label: "Team", labelAr: "فريق العمل" }] : []),
    ...(competitionCount > 0 ? [{ icon: Trophy, value: competitionCount, label: "Competitions", labelAr: "مسابقة" }] : []),
    ...(programCount > 0 ? [{ icon: BookOpen, value: programCount, label: "Programs", labelAr: "برنامج" }] : []),
    ...(eventCount > 0 ? [{ icon: Calendar, value: eventCount, label: "Events", labelAr: "فعالية" }] : []),
    ...(foundedYear ? [{ icon: Calendar, value: foundedYear, label: "Founded", labelAr: "تأسست" }] : []),
    ...(viewCount && viewCount > 0 ? [{ icon: Eye, value: viewCount, label: "Views", labelAr: "مشاهدة" }] : []),
    ...(website ? [{ icon: Globe, value: "✓", label: "Website", labelAr: "موقع إلكتروني" }] : []),
  ];

  if (stats.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 py-3">
      {stats.slice(0, 8).map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={i}
            className="flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/30 px-3 py-1.5 backdrop-blur-sm transition-colors hover:bg-muted/60"
          >
            <Icon className="h-3.5 w-3.5 text-primary/70" />
            <span className="text-xs font-bold">
              {typeof stat.value === "number" ? <AnimatedCounter value={stat.value} /> : stat.value}
            </span>
            <span className="text-[10px] text-muted-foreground">{isAr ? stat.labelAr : stat.label}</span>
          </div>
        );
      })}
    </div>
  );
}
