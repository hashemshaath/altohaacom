import { memo, forwardRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Globe, Trophy, Clock, ArrowRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { countryFlag } from "@/lib/countryFlag";
import { deriveCompetitionStatus } from "@/lib/competitionStatus";
import { toEnglishDigits } from "@/lib/formatNumber";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import type { Database } from "@/integrations/supabase/types";

type CompetitionStatus = Database["public"]["Enums"]["competition_status"];

export interface Competition {
  id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  cover_image_url: string | null;
  status: CompetitionStatus;
  registration_start: string | null;
  registration_end: string | null;
  competition_start: string;
  competition_end: string;
  venue: string | null;
  venue_ar: string | null;
  city: string | null;
  country: string | null;
  country_code: string | null;
  is_virtual: boolean | null;
  max_participants: number | null;
  organizer_id: string;
  edition_year: number | null;
}

export interface CompetitionWithRegs extends Competition {
  competition_registrations?: { id: string }[];
}

export const statusConfig: Record<CompetitionStatus, { bg: string; dot: string; label: string; labelAr: string }> = {
  pending: { bg: "bg-chart-4/10 text-chart-4", dot: "bg-chart-4", label: "Pending", labelAr: "بانتظار الموافقة" },
  draft: { bg: "bg-muted/60", dot: "bg-muted-foreground", label: "Draft", labelAr: "مسودة" },
  upcoming: { bg: "bg-accent/10 text-accent-foreground", dot: "bg-accent", label: "Upcoming", labelAr: "قادمة" },
  registration_open: { bg: "bg-primary/10 text-primary", dot: "bg-primary", label: "Registration Open", labelAr: "التسجيل مفتوح" },
  registration_closed: { bg: "bg-muted/60 text-muted-foreground", dot: "bg-muted-foreground", label: "Registration Closed", labelAr: "التسجيل مغلق" },
  in_progress: { bg: "bg-chart-3/10 text-chart-3", dot: "bg-chart-3", label: "In Progress", labelAr: "جارية" },
  judging: { bg: "bg-chart-4/10 text-chart-4", dot: "bg-chart-4", label: "Judging", labelAr: "التحكيم" },
  completed: { bg: "bg-chart-5/10 text-chart-5", dot: "bg-chart-5", label: "Completed", labelAr: "مكتملة" },
  cancelled: { bg: "bg-destructive/10 text-destructive", dot: "bg-destructive", label: "Cancelled", labelAr: "ملغاة" },
};

/** Helper to derive status from a competition */
export function getDerivedStatus(comp: Competition) {
  return deriveCompetitionStatus({
    registrationStart: comp.registration_start,
    registrationEnd: comp.registration_end,
    competitionStart: comp.competition_start,
    competitionEnd: comp.competition_end,
    dbStatus: comp.status,
  });
}

/** Determine which tab bucket a competition falls into */
export function getTabBucket(comp: Competition): "upcoming" | "active" | "past" {
  const d = getDerivedStatus(comp);
  if (["registration_upcoming", "registration_open", "registration_closing_soon"].includes(d.status)) return "upcoming";
  if (["in_progress", "competition_starting_soon"].includes(d.status)) return "active";
  if (["ended", "registration_closed"].includes(d.status)) return "past";
  return "upcoming";
}

/* ─── Status Badge (reusable) ─── */
function StatusBadge({ derived, isAr, className = "" }: { derived: ReturnType<typeof getDerivedStatus>; isAr: boolean; className?: string }) {
  return (
    <Badge className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider border-0 shadow-lg backdrop-blur-md rounded-xl ${derived.color} ring-1 ring-white/10 ${className}`}>
      {derived.color.includes("chart-3") ? (
        <span className="relative me-1.5 flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      ) : (
        <span className={`me-1.5 inline-block h-1.5 w-1.5 rounded-full ${derived.dot}`} />
      )}
      {isAr ? derived.labelAr : derived.label}
    </Badge>
  );
}

/* ─── Competition Card — Premium Editorial ─── */
export const CompetitionCard = memo(
  forwardRef<HTMLDivElement, { competition: CompetitionWithRegs; language: string; isAr: boolean }>(
    ({ competition, language, isAr }, ref) => {
      const baseTitle = isAr && competition.title_ar ? competition.title_ar : competition.title;
      const title = competition.edition_year ? `${baseTitle} ${competition.edition_year}` : baseTitle;
      const regCount = competition.competition_registrations?.length || 0;
      const maxP = competition.max_participants;
      const fillPct = maxP ? Math.min(Math.round((regCount / maxP) * 100), 100) : 0;
      const derived = getDerivedStatus(competition);
      const venue = isAr && competition.venue_ar ? competition.venue_ar : competition.venue;

      const [imgLoaded, setImgLoaded] = useState(false);
      const onImgLoad = useCallback(() => setImgLoaded(true), []);

      return (
        <Link to={`/competitions/${competition.id}`} className="group block h-full active:scale-[0.98] transition-transform duration-150">
          <Card ref={ref} className="flex h-full flex-col overflow-hidden rounded-2xl border-border/30 bg-card/80 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:shadow-primary/8 hover:-translate-y-1.5 hover:border-primary/20">
            {/* Image Section */}
            <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-muted" role="img" aria-label={title}>
              {competition.cover_image_url ? (
                <>
                  {!imgLoaded && (
                    <div className="absolute inset-0 bg-muted animate-pulse">
                      <div className="flex h-full items-center justify-center">
                        <Trophy className="h-8 w-8 text-muted-foreground/20" />
                      </div>
                    </div>
                  )}
                  <img src={competition.cover_image_url} alt={title} className={`h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-105 ${imgLoaded ? "opacity-100" : "opacity-0"}`} loading="lazy" decoding="async" onLoad={onImgLoad} />
                </>
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/8 via-muted to-accent/8">
                  <Trophy className="h-12 w-12 sm:h-14 sm:w-14 text-primary/10" />
                </div>
              )}
              {/* Multi-layer gradient for readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

              {/* Status + Countdown */}
              <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3 sm:p-4">
                <StatusBadge derived={derived} isAr={isAr} />
                {derived.daysLeft && derived.daysLeft > 0 && derived.daysLeft <= 30 && (
                  <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-[9px] font-bold bg-background/80 backdrop-blur-md shadow-lg border-0 text-foreground rounded-xl">
                    <Clock className="h-2.5 w-2.5 text-primary" />
                    {isAr ? <><AnimatedCounter value={derived.daysLeft} className="inline" /> يوم</> : <><AnimatedCounter value={derived.daysLeft} className="inline" />D</>}
                  </Badge>
                )}
              </div>

              {/* Bottom overlay with date & participants */}
              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                <div className="flex items-end justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-foreground">
                    <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-xl bg-background/70 backdrop-blur-sm">
                      <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
                    </div>
                    <span className="drop-shadow-md">{toEnglishDigits(format(new Date(competition.competition_start), "MMM d, yyyy"))}</span>
                  </span>
                  {maxP && (
                    <Badge variant="secondary" className="gap-1 px-1.5 py-0.5 text-[9px] font-bold bg-primary/10 backdrop-blur-md border-0 text-primary rounded-xl">
                      <Users className="h-2.5 w-2.5" />
                      <AnimatedCounter value={regCount} className="inline" />/{toEnglishDigits(maxP)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Content Section */}
            <CardContent className="flex flex-1 flex-col p-3.5 sm:p-4">
              <h3 className="mb-2 flex-1 line-clamp-2 text-[13px] sm:text-[14px] font-bold leading-snug tracking-tight group-hover:text-primary transition-colors duration-300">
                {title}
              </h3>

              {/* Capacity Bar */}
              {maxP && maxP > 0 && (
                <div className="mb-3 space-y-1">
                  <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    <span>{isAr ? "السعة" : "Capacity"}</span>
                    <span className={`tabular-nums ${fillPct > 80 ? "text-destructive" : "text-primary"}`}><AnimatedCounter value={fillPct} className="inline" />%</span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-muted/40">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${fillPct > 80 ? "bg-destructive" : "bg-primary"}`}
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Footer: location + arrow */}
              <div className="flex items-center justify-between mt-auto pt-1">
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground min-w-0">
                  {competition.is_virtual ? (
                    <span className="flex items-center gap-1 truncate"><Globe className="h-3 w-3 text-primary shrink-0" />{isAr ? "افتراضية" : "Virtual"}</span>
                  ) : (venue || competition.city) ? (
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="h-3 w-3 shrink-0 text-primary" />
                      <span className="truncate">{competition.country_code ? `${countryFlag(competition.country_code)} ` : ""}{venue || competition.city}</span>
                    </span>
                  ) : null}
                </div>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20">
                  <ArrowRight className="h-3 w-3 rtl:rotate-180 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      );
    }
  )
);

CompetitionCard.displayName = "CompetitionCard";

/* ─── Featured Competition Banner — Premium ─── */
export const FeaturedCompetitionCard = memo(function FeaturedCompetitionCard({
  competition,
  language,
  isAr,
}: {
  competition: CompetitionWithRegs;
  language: string;
  isAr: boolean;
}) {
  const baseTitle = isAr && competition.title_ar ? competition.title_ar : competition.title;
  const title = competition.edition_year ? `${baseTitle} ${competition.edition_year}` : baseTitle;
  const desc = isAr && competition.description_ar ? competition.description_ar : competition.description;
  const derived = getDerivedStatus(competition);
  const regCount = competition.competition_registrations?.length || 0;

  return (
    <Link to={`/competitions/${competition.id}`} className="group mb-10 block">
      <Card className="relative overflow-hidden rounded-2xl border-primary/10 bg-card/80 backdrop-blur-sm shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -top-32 -end-32 h-72 w-72 rounded-full bg-primary/6 blur-[100px] transition-all duration-700 group-hover:bg-primary/10" />

        <div className="relative flex flex-col md:flex-row">
          {/* Image */}
          <div className="relative aspect-[16/9] w-full overflow-hidden md:aspect-auto md:w-2/5 lg:w-1/2">
            {competition.cover_image_url ? (
              <img src={competition.cover_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-[1.03]" />
            ) : (
              <div className="flex h-full min-h-[220px] items-center justify-center bg-gradient-to-br from-primary/8 via-muted/20 to-accent/8">
                <Trophy className="h-20 w-20 text-primary/8" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent opacity-60 md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-background/40" />
            <div className="absolute start-4 top-4 sm:start-5 sm:top-5">
              <Badge className="gap-1.5 bg-primary px-3 py-1.5 text-[10px] font-bold shadow-xl ring-2 ring-primary/20 rounded-xl">
                <Flame className="h-3 w-3" />
                {isAr ? "مسابقة مميزة" : "Featured"}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col justify-between p-5 sm:p-6 md:p-8 lg:p-10">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge derived={derived} isAr={isAr} className="px-3 py-1 text-[10px]" />
                {derived.daysLeft && derived.daysLeft > 0 && derived.daysLeft <= 60 && (
                  <Badge variant="outline" className="gap-1.5 text-[10px] font-bold bg-background/40 backdrop-blur-md border-border/30 rounded-xl">
                    <Clock className="h-3 w-3 text-primary" />
                    {isAr ? <><AnimatedCounter value={derived.daysLeft} className="inline" /> يوم</> : <><AnimatedCounter value={derived.daysLeft} className="inline" /> DAYS LEFT</>}
                  </Badge>
                )}
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold md:text-3xl lg:text-4xl leading-tight tracking-tight group-hover:text-primary transition-colors duration-300">{title}</h2>
              {desc && <p className="line-clamp-2 sm:line-clamp-3 text-sm text-muted-foreground font-medium leading-relaxed">{desc}</p>}
            </div>

            <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm font-semibold text-foreground/80">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-muted/50">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <span className="text-xs sm:text-sm">{toEnglishDigits(format(new Date(competition.competition_start), "MMM d, yyyy"))}</span>
              </div>
              {competition.is_virtual ? (
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-muted/50">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-xs sm:text-sm">{isAr ? "افتراضية" : "Virtual"}</span>
                </div>
              ) : competition.city && (
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-muted/50">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-xs sm:text-sm">{competition.country_code ? `${countryFlag(competition.country_code)} ` : ""}{competition.city}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-muted/50">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <span className="text-xs sm:text-sm"><AnimatedCounter value={regCount} className="inline" /> {isAr ? "مسجل" : "Registered"}</span>
              </div>
              <div className="ms-auto hidden sm:block">
                <Button variant="ghost" className="gap-2 text-primary hover:bg-primary/5 group/btn h-auto p-0">
                  <span className="font-bold uppercase tracking-widest text-xs">{isAr ? "استكشف" : "Explore"}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1 rtl:group-hover/btn:-translate-x-1 rtl:rotate-180" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
});
