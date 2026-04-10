import { memo, useMemo, useState, forwardRef } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Calendar, Users, ChevronDown, ChevronUp, History, TrendingUp, ArrowRight, MapPin } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { countryFlag } from "@/lib/countryFlag";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { getDerivedStatus, type CompetitionWithRegs } from "./CompetitionCard";

interface Props {
  competitions: CompetitionWithRegs[];
  isAr: boolean;
}

/** Strips trailing year (4 digits) from title to find base name */
function getBaseName(title: string): string {
  return title.replace(/\s*\d{4}\s*$/, "").trim();
}

interface SeriesGroup {
  baseName: string;
  editions: CompetitionWithRegs[];
  latestEdition: CompetitionWithRegs;
  totalRegistrations: number;
  totalEditions: number;
  years: number[];
}

export const CompetitionEditionsSection = memo(forwardRef<HTMLElement, Props>(function CompetitionEditionsSection({ competitions, isAr }, ref) {
  const [expandedSeries, setExpandedSeries] = useState<string | null>(null);

  const seriesGroups = useMemo(() => {
    // Group by base name (case-insensitive)
    const groups = new Map<string, CompetitionWithRegs[]>();

    for (const comp of competitions) {
      const title = comp.title || "";
      const base = getBaseName(title).toLowerCase();
      if (!groups.has(base)) groups.set(base, []);
      groups.get(base)!.push(comp);
    }

    // Only keep groups with 2+ editions
    const result: SeriesGroup[] = [];
    for (const [, editions] of groups) {
      if (editions.length < 2) continue;

      // Sort by edition_year desc, then competition_start desc
      editions.sort((a, b) => {
        if (a.edition_year && b.edition_year) return b.edition_year - a.edition_year;
        return new Date(b.competition_start).getTime() - new Date(a.competition_start).getTime();
      });

      const latest = editions[0];
      const baseName = getBaseName(isAr && latest.title_ar ? latest.title_ar : latest.title);
      const totalRegs = editions.reduce((sum, e) => sum + (e.competition_registrations?.length || 0), 0);
      const years = editions.map(e => e.edition_year).filter(Boolean).sort((a, b) => b! - a!) as number[];

      result.push({
        baseName,
        editions,
        latestEdition: latest,
        totalRegistrations: totalRegs,
        totalEditions: editions.length,
        years,
      });
    }

    return result.sort((a, b) => b.totalEditions - a.totalEditions);
  }, [competitions, isAr]);

  if (seriesGroups.length === 0) return null;

  return (
    <section ref={ref} className="space-y-4" aria-label={isAr ? "إصدارات المسابقات" : "Competition Series & Editions"}>
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
          <History className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-bold tracking-tight">
            {isAr ? "سلاسل المسابقات والإصدارات السابقة" : "Competition Series & Past Editions"}
          </h2>
          <p className="text-[12px] text-muted-foreground">
            {isAr ? "تصفح الإصدارات السابقة ونتائجها" : "Browse previous editions and their results"}
          </p>
        </div>
        <Badge variant="secondary" className="ms-auto text-[12px] font-bold rounded-lg">
          {seriesGroups.length} {isAr ? "سلسلة" : "series"}
        </Badge>
      </div>

      <div className="space-y-3">
        {seriesGroups.map((group) => {
          const isExpanded = expandedSeries === group.baseName;
          const latest = group.latestEdition;

          return (
            <Card
              key={group.baseName}
              className="overflow-hidden rounded-2xl border-border/30 transition-all duration-300 hover:shadow-md"
            >
              {/* Series Header */}
              <button
                onClick={() => setExpandedSeries(isExpanded ? null : group.baseName)}
                className="w-full text-start"
                aria-expanded={isExpanded}
                aria-controls={`editions-${group.baseName}`}
              >
                <CardContent className="flex items-center gap-3 p-4">
                  {/* Series Image/Icon */}
                  <div className="h-14 w-14 shrink-0 rounded-xl overflow-hidden bg-primary/5 ring-1 ring-border/20">
                    {latest.cover_image_url ? (
                      <img loading="lazy"
                        src={latest.cover_image_url}
                        alt={group.baseName}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Trophy className="h-6 w-6 text-primary/30" />
                      </div>
                    )}
                  </div>

                  {/* Series Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate">{group.baseName}</h3>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[12px] gap-1 rounded-lg h-5">
                        <Calendar className="h-2.5 w-2.5" />
                        {group.totalEditions} {isAr ? "إصدارات" : "editions"}
                      </Badge>
                      {group.totalRegistrations > 0 && (
                        <Badge variant="outline" className="text-[12px] gap-1 rounded-lg h-5">
                          <Users className="h-2.5 w-2.5" />
                          <AnimatedCounter value={group.totalRegistrations} className="inline" />
                        </Badge>
                      )}
                      {group.years.length > 0 && (
                        <span className="text-[12px] text-muted-foreground font-medium">
                          {group.years[group.years.length - 1]} – {group.years[0]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expand icon */}
                  <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 transition-colors hover:bg-muted">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardContent>
              </button>

              {/* Editions Timeline */}
              {isExpanded && (
                <div
                  id={`editions-${group.baseName}`}
                  className="border-t border-border/20 bg-muted/5"
                >
                  <div className="p-4 space-y-0">
                    {group.editions.map((edition, idx) => {
                      const title = isAr && edition.title_ar ? edition.title_ar : edition.title;
                      const derived = getDerivedStatus(edition);
                      const regs = edition.competition_registrations?.length || 0;
                      const isFirst = idx === 0;

                      return (
                        <div key={edition.id} className="relative flex gap-3">
                          {/* Timeline Node */}
                          <div className="flex flex-col items-center shrink-0">
                            <div
                              className={`h-3 w-3 rounded-full ring-2 ring-background z-10 ${
                                isFirst
                                  ? "bg-primary ring-primary/20"
                                  : "bg-muted-foreground/30 ring-border/20"
                              }`}
                            />
                            {idx < group.editions.length - 1 && (
                              <div className="w-px flex-1 bg-border/30 min-h-[40px]" />
                            )}
                          </div>

                          {/* Edition Card */}
                          <Link
                            to={`/competitions/${edition.id}`}
                            className="group flex-1 mb-3 rounded-xl border border-border/20 bg-card p-3 transition-all hover:shadow-sm hover:border-primary/20 hover:-translate-y-0.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {edition.edition_year && (
                                    <Badge
                                      variant={isFirst ? "default" : "secondary"}
                                      className="text-[12px] font-black rounded-lg h-5 px-2"
                                    >
                                      {edition.edition_year}
                                    </Badge>
                                  )}
                                  <Badge
                                    className={`text-[12px] h-4 px-1.5 rounded-md border-0 ${derived.color}`}
                                  >
                                    {isAr ? derived.labelAr : derived.label}
                                  </Badge>
                                  {isFirst && (
                                    <Badge className="text-[12px] h-4 px-1.5 rounded-md border-0 bg-chart-3/10 text-chart-3">
                                      {isAr ? "أحدث" : "Latest"}
                                    </Badge>
                                  )}
                                </div>
                                <h4 className="text-xs font-semibold truncate group-hover:text-primary transition-colors">
                                  {title}
                                </h4>
                                <div className="mt-1 flex items-center gap-3 text-[12px] text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-2.5 w-2.5" />
                                    {format(new Date(edition.competition_start), "MMM d, yyyy", {
                                      locale: isAr ? ar : undefined,
                                    })}
                                  </span>
                                  {regs > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Users className="h-2.5 w-2.5" />
                                      {regs} {isAr ? "مسجل" : "registered"}
                                    </span>
                                  )}
                                  {edition.city && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-2.5 w-2.5" />
                                      {edition.country_code && countryFlag(edition.country_code)}{" "}
                                      {edition.city}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="shrink-0 flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                                <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                              </div>
                            </div>
                          </Link>
                        </div>
                      );
                    })}
                  </div>

                  {/* Series Stats Footer */}
                  {group.totalEditions >= 2 && (
                    <div className="border-t border-border/10 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                        <TrendingUp className="h-3 w-3 text-chart-3" />
                        <span className="font-medium">
                          {isAr
                            ? `${group.totalEditions} إصدارات منذ ${group.years[group.years.length - 1]}`
                            : `${group.totalEditions} editions since ${group.years[group.years.length - 1]}`}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-[12px] rounded-lg" asChild>
                        <Link to={`/competitions/${group.latestEdition.id}`}>
                          {isAr ? "أحدث إصدار" : "Latest Edition"}
                          <ArrowRight className="ms-1 h-3 w-3 rtl:rotate-180" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}));
