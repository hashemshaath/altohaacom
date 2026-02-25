import { memo, forwardRef } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Globe, Trophy, Clock, ArrowRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { countryFlag } from "@/lib/countryFlag";
import { deriveCompetitionStatus } from "@/lib/competitionStatus";
import { toEnglishDigits } from "@/lib/formatNumber";
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
    <Badge className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider border-0 shadow-xl backdrop-blur-md ${derived.color} ring-1 ring-white/10 ${className}`}>
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

/* ─── Competition Card ─── */
export const CompetitionCard = memo(
  forwardRef<HTMLDivElement, { competition: CompetitionWithRegs; language: string; isAr: boolean }>(
    ({ competition, language, isAr }, ref) => {
      const baseTitle = isAr && competition.title_ar ? competition.title_ar : competition.title;
      const title = competition.edition_year ? `${baseTitle} ${competition.edition_year}` : baseTitle;
      const regCount = competition.competition_registrations?.length || 0;
      const maxP = competition.max_participants;
      const fillPct = maxP ? Math.min(Math.round((regCount / maxP) * 100), 100) : 0;
      const derived = getDerivedStatus(competition);

      return (
        <Link to={`/competitions/${competition.id}`} className="group block h-full">
          <Card ref={ref} className="flex h-full flex-col overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1 hover:border-primary/25 hover:bg-card">
            <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-muted">
              {competition.cover_image_url ? (
                <img src={competition.cover_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" loading="lazy" />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                  <Trophy className="h-14 w-14 text-primary/15" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

              {/* Top Info Bar */}
              <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
                <StatusBadge derived={derived} isAr={isAr} />
                {derived.daysLeft && derived.daysLeft > 0 && derived.daysLeft <= 30 && (
                  <Badge variant="secondary" className="gap-1.5 px-2 py-0.5 text-[9px] font-bold bg-background/80 backdrop-blur-md shadow-lg border-border/40 text-foreground">
                    <Clock className="h-2.5 w-2.5 text-primary" />
                    {isAr ? `${toEnglishDigits(derived.daysLeft)} يوم` : `${derived.daysLeft}D`}
                  </Badge>
                )}
              </div>

              {/* Bottom Info Bar */}
              <div className="absolute inset-x-0 bottom-0 p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[10px] font-bold text-foreground drop-shadow-md">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-background/60 backdrop-blur-md shadow-sm">
                      <Calendar className="h-3 w-3 text-primary" />
                    </div>
                    {toEnglishDigits(format(new Date(competition.competition_start), "MMM d, yyyy"))}
                  </span>
                  {maxP && (
                    <Badge variant="secondary" className="gap-1.5 px-2 py-0.5 text-[10px] font-bold bg-primary/10 backdrop-blur-md border-primary/20 text-primary shadow-sm">
                      <Users className="h-3 w-3" />
                      {toEnglishDigits(regCount)} <span className="opacity-50 text-[8px]">/</span> {toEnglishDigits(maxP)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <CardContent className="flex flex-1 flex-col p-3 sm:p-5">
              <h3 className="mb-2 sm:mb-4 flex-1 line-clamp-2 text-sm sm:text-base font-black leading-tight group-hover:text-primary transition-colors duration-300">
                {title}
              </h3>

              {maxP && maxP > 0 && (
                <div className="mb-2 sm:mb-4 space-y-1">
                  <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <span>{isAr ? "سعة المشاركة" : "Capacity"}</span>
                    <span className={fillPct > 80 ? "text-destructive" : "text-primary"}>{toEnglishDigits(fillPct)}%</span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-muted/50">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${fillPct > 80 ? "bg-destructive" : "bg-primary"}`}
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground min-w-0">
                  {competition.is_virtual ? (
                    <span className="flex items-center gap-1 truncate"><Globe className="h-3 w-3 text-primary shrink-0" /><span className="truncate">{isAr ? "افتراضية" : "Virtual"}</span></span>
                  ) : competition.city ? (
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="h-3 w-3 shrink-0 text-primary" />
                      <span className="truncate">{competition.country_code ? `${countryFlag(competition.country_code)} ` : ""}{competition.city}</span>
                    </span>
                  ) : null}
                </div>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/5 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105">
                  <ArrowRight className="h-3 w-3 rtl:rotate-180" />
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

/* ─── Featured Competition Banner ─── */
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
    <Link to={`/competitions/${competition.id}`} className="group mb-12 block">
      <Card className="relative overflow-hidden border-primary/15 bg-card/60 backdrop-blur-sm shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/30">
        <div className="pointer-events-none absolute -top-24 -end-24 h-64 w-64 rounded-full bg-primary/10 blur-[80px] transition-all duration-500 group-hover:bg-primary/15" />
        <div className="relative flex flex-col md:flex-row">
          <div className="relative aspect-[16/9] w-full overflow-hidden md:aspect-auto md:w-2/5 lg:w-1/2">
            {competition.cover_image_url ? (
              <img src={competition.cover_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-1" />
            ) : (
              <div className="flex h-full min-h-[250px] items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                <Trophy className="h-24 w-24 text-primary/10" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-60" />
            <div className="absolute start-5 top-5">
              <Badge className="gap-2 bg-primary px-4 py-1.5 text-xs font-bold shadow-xl ring-4 ring-primary/20">
                <Flame className="h-3.5 w-3.5" />
                {isAr ? "مسابقة مميزة" : "Featured Spotlight"}
              </Badge>
            </div>
          </div>
          <div className="flex flex-1 flex-col justify-between p-6 md:p-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <StatusBadge derived={derived} isAr={isAr} className="px-3 py-1 text-[10px]" />
                {derived.daysLeft && derived.daysLeft > 0 && derived.daysLeft <= 60 && (
                  <Badge variant="outline" className="gap-1.5 text-[10px] font-bold bg-background/40 backdrop-blur-md border-border/40">
                    <Clock className="h-3 w-3 text-primary" />
                    {isAr ? `${toEnglishDigits(derived.daysLeft)} يوم متبقي` : `${derived.daysLeft} DAYS LEFT`}
                  </Badge>
                )}
              </div>
              <h2 className="font-serif text-2xl font-black md:text-3xl lg:text-4xl leading-tight group-hover:text-primary transition-colors duration-300">{title}</h2>
              {desc && <p className="line-clamp-3 text-sm md:text-base text-muted-foreground font-medium leading-relaxed">{desc}</p>}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm font-semibold text-foreground/80">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                {toEnglishDigits(format(new Date(competition.competition_start), "MMMM d, yyyy"))}
              </div>
              {competition.is_virtual ? (
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </div>
                  {isAr ? "مسابقة افتراضية" : "Virtual Competition"}
                </div>
              ) : competition.city && (
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  {competition.country_code ? `${countryFlag(competition.country_code)} ` : ""}{competition.city}{competition.country ? `, ${competition.country}` : ""}
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                {toEnglishDigits(regCount)} {isAr ? "مسجل" : "Registered"}
              </div>
              <div className="ms-auto">
                <Button variant="ghost" className="gap-2 text-primary hover:bg-primary/5 p-0 hover:p-2 transition-all group/btn">
                  <span className="font-bold uppercase tracking-widest text-xs">{isAr ? "استكشف الآن" : "Explore Now"}</span>
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
