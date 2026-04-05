import { memo, useMemo, useState, forwardRef } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar, Users, Landmark, Globe, MapPin, TrendingUp,
  TrendingDown, BarChart3, Eye, History, ChevronRight, Trophy,
  Image as ImageIcon, ExternalLink, ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Props {
  seriesId: string | null;
  currentExhibitionId: string;
  isAr: boolean;
}

interface EditionRow {
  id: string;
  title: string;
  title_ar: string | null;
  slug: string;
  start_date: string;
  end_date: string;
  edition_year: number | null;
  edition_stats: any;
  status: string;
  city: string | null;
  country: string | null;
  cover_image_url: string | null;
  logo_url: string | null;
  view_count: number | null;
  description: string | null;
  description_ar: string | null;
  gallery_urls: string[] | null;
  includes_competitions: boolean | null;
}

function parseStats(raw: any): { visitors?: number; exhibitors?: number; countries?: number; area?: number } {
  if (!raw) return {};
  const s = typeof raw === "string" ? JSON.parse(raw) : raw;
  return {
    visitors: s.visitors ? Number(s.visitors) : undefined,
    exhibitors: s.exhibitors ? Number(s.exhibitors) : undefined,
    countries: s.countries ? Number(s.countries) : undefined,
    area: s.area ? Number(s.area) : undefined,
  };
}

const GrowthBadge = memo(function GrowthBadge({ current, previous }: { current?: number; previous?: number }) {
  if (!current || !previous) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return null;
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 text-[10px] font-bold rounded-full px-1.5 py-0.5",
      pct > 0 ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
    )}>
      {pct > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
      {pct > 0 ? "+" : ""}{pct}%
    </span>
  );
});

/* ── Stat Pill ── */
const StatPill = forwardRef<HTMLDivElement, { value: string; label: string; growth?: React.ReactNode }>(
  function StatPill({ value, label, growth }, ref) {
    return (
      <div ref={ref} className="flex flex-col items-center gap-0.5 rounded-xl bg-muted/50 px-3 py-2 min-w-[70px]">
        <span className="text-sm font-bold tabular-nums">{value}</span>
        <span className="text-[9px] text-muted-foreground leading-none">{label}</span>
        {growth}
      </div>
    );
  }
);

/* ── Timeline Dot ── */
function TimelineDot({ year, isCurrent }: { year: number | null; isCurrent: boolean }) {
  return (
    <div className={cn(
      "absolute start-0 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border-2 font-bold text-xs transition-all",
      isCurrent
        ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25"
        : "border-border bg-card text-muted-foreground hover:border-primary/40"
    )}>
      {year ? `'${String(year).slice(-2)}` : "—"}
    </div>
  );
}

export const ExhibitionEditionsSection = memo(function ExhibitionEditionsSection({ seriesId, currentExhibitionId, isAr }: Props) {
  const [expandedEdition, setExpandedEdition] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const { data: editions, isLoading } = useQuery({
    queryKey: ["exhibition-editions", seriesId],
    queryFn: async () => {
      if (!seriesId) return [];
      const { data, error } = await supabase
        .from("exhibitions")
        .select("id, title, title_ar, slug, start_date, end_date, edition_year, edition_stats, status, city, country, cover_image_url, logo_url, view_count, description, description_ar, gallery_urls, includes_competitions")
        .eq("series_id", seriesId)
        .order("edition_year", { ascending: false });
      if (error) throw error;
      return (data || []) as EditionRow[];
    },
    enabled: !!seriesId,
    staleTime: 1000 * 60 * 10,
  });

  const editionIds = useMemo(() => (editions || []).map(e => e.id), [editions]);

  const { data: competitionCounts } = useQuery({
    queryKey: ["edition-competition-counts", editionIds],
    queryFn: async () => {
      if (editionIds.length === 0) return {};
      const { data } = await supabase
        .from("competitions")
        .select("exhibition_id, id")
        .in("exhibition_id", editionIds);
      const counts: Record<string, number> = {};
      (data || []).forEach((c) => {
        counts[c.exhibition_id] = (counts[c.exhibition_id] || 0) + 1;
      });
      return counts;
    },
    enabled: editionIds.length > 0,
    staleTime: 1000 * 60 * 10,
  });

  const pastEditions = useMemo(() => (editions || []).filter(e => e.id !== currentExhibitionId), [editions, currentExhibitionId]);

  const growthSummary = useMemo(() => {
    if (!editions || editions.length < 2) return null;
    const sorted = [...editions].sort((a, b) => (a.edition_year || 0) - (b.edition_year || 0));
    const first = parseStats(sorted[0].edition_stats);
    const last = parseStats(sorted[sorted.length - 1].edition_stats);
    return { first, last, totalEditions: sorted.length, firstYear: sorted[0].edition_year, lastYear: sorted[sorted.length - 1].edition_year };
  }, [editions]);

  const visibleEditions = useMemo(() => showAll ? pastEditions : pastEditions.slice(0, 3), [pastEditions, showAll]);

  if (!seriesId || isLoading || pastEditions.length === 0) return null;

  // JSON-LD for SEO — EventSeries structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EventSeries",
    name: editions?.[0]?.title || "Exhibition Series",
    ...(editions?.[0]?.title_ar && { alternateName: editions[0].title_ar }),
    numberOfEvents: editions?.length || 0,
    subEvent: (editions || []).map(e => ({
      "@type": "Event",
      name: e.title,
      ...(e.title_ar && { alternateName: e.title_ar }),
      startDate: e.start_date,
      endDate: e.end_date,
      url: `${window.location.origin}/exhibitions/${e.slug}`,
      ...(e.cover_image_url && { image: e.cover_image_url }),
      location: e.city ? { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: e.city, addressCountry: e.country || undefined } } : undefined,
    })),
  };

  return (
    <section className="mt-10 sm:mt-14" aria-labelledby="editions-heading" itemScope itemType="https://schema.org/EventSeries">
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ═══ Section Header ═══ */}
      <div className="flex items-end justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/10">
            <History className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 id="editions-heading" className="text-lg sm:text-xl font-bold tracking-tight">
              {isAr ? "النسخ السابقة" : "Previous Editions"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAr
                ? `تصفح ${pastEditions.length} نسخة سابقة وإحصائياتها`
                : `Browse ${pastEditions.length} past edition${pastEditions.length > 1 ? "s" : ""} and their stats`}
            </p>
          </div>
        </div>
        {growthSummary && (
          <Badge variant="outline" className="text-[10px] font-semibold hidden sm:flex gap-1">
            <BarChart3 className="h-3 w-3" />
            {growthSummary.totalEditions} {isAr ? "نسخة" : "editions"} · {growthSummary.firstYear}–{growthSummary.lastYear}
          </Badge>
        )}
      </div>

      {/* ═══ Growth Summary — Compact Horizontal ═══ */}
      {growthSummary && (
        <div className="mb-6 flex items-stretch gap-3 overflow-x-auto scrollbar-none pb-1" role="region" aria-label={isAr ? "إحصائيات نمو السلسلة" : "Series growth statistics"}>
          {[
            { label: isAr ? "الزوار" : "Visitors", first: growthSummary.first.visitors, last: growthSummary.last.visitors },
            { label: isAr ? "العارضون" : "Exhibitors", first: growthSummary.first.exhibitors, last: growthSummary.last.exhibitors },
            { label: isAr ? "الدول" : "Countries", first: growthSummary.first.countries, last: growthSummary.last.countries },
            { label: isAr ? "المساحة م²" : "Area m²", first: growthSummary.first.area, last: growthSummary.last.area },
          ].filter(i => i.last).map(item => (
            <StatPill
              key={item.label}
              value={item.last?.toLocaleString() || "—"}
              label={item.label}
              growth={<GrowthBadge current={item.last} previous={item.first} />}
            />
          ))}
        </div>
      )}

      {/* ═══ Timeline ═══ */}
      <div className="relative" role="list" aria-label={isAr ? "قائمة النسخ السابقة" : "Previous editions list"}>
        {/* Vertical line */}
        <div className="absolute top-0 bottom-0 start-[21px] w-0.5 bg-gradient-to-b from-primary/40 via-border to-transparent rounded-full" aria-hidden="true" />

        <div className="space-y-4">
          {visibleEditions.map((edition, idx) => {
            const stats = parseStats(edition.edition_stats);
            const nextEdition = visibleEditions[idx + 1];
            const prevStats = nextEdition ? parseStats(nextEdition.edition_stats) : {};
            const compCount = competitionCounts?.[edition.id] || 0;
            const edTitle = isAr && edition.title_ar ? edition.title_ar : edition.title;
            const desc = isAr && edition.description_ar ? edition.description_ar : edition.description;
            const isExpanded = expandedEdition === edition.id;
            const galleryCount = (edition.gallery_urls || []).length;
            const hasStats = stats.visitors || stats.exhibitors || stats.countries || stats.area;

            return (
              <article
                key={edition.id}
                role="listitem"
                className="relative ps-16"
                itemScope
                itemType="https://schema.org/Event"
              >
                <meta itemProp="name" content={edition.title} />
                <meta itemProp="startDate" content={edition.start_date} />
                {edition.end_date && <meta itemProp="endDate" content={edition.end_date} />}
                <link itemProp="url" href={`/exhibitions/${edition.slug}`} />

                {/* Timeline dot */}
                <TimelineDot year={edition.edition_year} isCurrent={false} />

                <Card className={cn(
                  "overflow-hidden transition-all duration-300 group",
                  isExpanded ? "border-primary/30 shadow-md" : "hover:border-primary/20 hover:shadow-sm"
                )}>
                  <div className="flex flex-col sm:flex-row">
                    {/* Cover */}
                    {edition.cover_image_url && (
                      <Link to={`/exhibitions/${edition.slug}`} className="relative sm:w-48 h-32 sm:h-auto shrink-0 overflow-hidden block" aria-label={`${edTitle} - ${isAr ? "عرض التفاصيل" : "View details"}`}>
                        <img
                          src={edition.cover_image_url}
                          alt={`${edTitle} ${edition.edition_year || ""}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          decoding="async"
                          itemProp="image"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-background/60 to-transparent" />
                      </Link>
                    )}

                    <CardContent className="flex-1 p-4 sm:p-5">
                      {/* Title Row */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            {compCount > 0 && (
                              <Badge variant="secondary" className="text-[9px] gap-0.5">
                                <Trophy className="h-2.5 w-2.5" />{compCount}
                              </Badge>
                            )}
                            {galleryCount > 0 && (
                              <Badge variant="outline" className="text-[9px] gap-0.5">
                                <ImageIcon className="h-2.5 w-2.5" />{galleryCount}
                              </Badge>
                            )}
                          </div>
                          <Link to={`/exhibitions/${edition.slug}`} className="group/title">
                            <h3 className="font-bold text-sm sm:text-base group-hover/title:text-primary transition-colors leading-tight">
                              {edTitle}
                            </h3>
                          </Link>
                        </div>
                        <Link
                          to={`/exhibitions/${edition.slug}`}
                          className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                          aria-label={`${isAr ? "فتح" : "Open"} ${edTitle}`}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </div>

                      {/* Meta line */}
                      <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground mb-2.5 flex-wrap">
                        <time className="flex items-center gap-1" dateTime={edition.start_date}>
                          <Calendar className="h-3 w-3" />
                          {format(new Date(edition.start_date), "MMM yyyy", { locale: isAr ? ar : undefined })}
                        </time>
                        {edition.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {edition.city}{edition.country ? `, ${edition.country}` : ""}
                          </span>
                        )}
                        {(edition.view_count || 0) > 50 && (
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />{(edition.view_count || 0).toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {desc && (
                        <p className={cn("text-xs text-muted-foreground leading-relaxed", isExpanded ? "" : "line-clamp-2")}>{desc}</p>
                      )}

                      {/* Stats row */}
                      {hasStats && (
                        <div className="mt-3 flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
                          {stats.visitors && (
                            <StatPill value={stats.visitors.toLocaleString()} label={isAr ? "زائر" : "Visitors"} growth={<GrowthBadge current={stats.visitors} previous={prevStats.visitors} />} />
                          )}
                          {stats.exhibitors && (
                            <StatPill value={stats.exhibitors.toLocaleString()} label={isAr ? "عارض" : "Exhibitors"} growth={<GrowthBadge current={stats.exhibitors} previous={prevStats.exhibitors} />} />
                          )}
                          {stats.countries && (
                            <StatPill value={String(stats.countries)} label={isAr ? "دولة" : "Countries"} growth={<GrowthBadge current={stats.countries} previous={prevStats.countries} />} />
                          )}
                          {stats.area && (
                            <StatPill value={stats.area.toLocaleString()} label={isAr ? "م²" : "m²"} growth={<GrowthBadge current={stats.area} previous={prevStats.area} />} />
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-3 flex items-center gap-3 pt-2 border-t border-border/20">
                        {(desc || galleryCount > 0) && (
                          <button
                            onClick={() => setExpandedEdition(isExpanded ? null : edition.id)}
                            className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                            aria-expanded={isExpanded}
                          >
                            <ChevronDown className={cn("h-3 w-3 transition-transform", isExpanded && "rotate-180")} />
                            {isExpanded ? (isAr ? "أقل" : "Less") : (isAr ? "المزيد" : "More")}
                          </button>
                        )}
                        <Link
                          to={`/exhibitions/${edition.slug}`}
                          className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 ms-auto"
                        >
                          {isAr ? "عرض النسخة الكاملة" : "View Full Edition"}
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>

                      {/* Expanded gallery */}
                      {isExpanded && galleryCount > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/20">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                            {isAr ? "صور من النسخة" : "Edition Gallery"}
                          </p>
                          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                            {(edition.gallery_urls || []).slice(0, 5).map((url, i) => (
                              <img
                                key={i}
                                src={url}
                                alt={`${edTitle} - ${isAr ? "صورة" : "Photo"} ${i + 1}`}
                                className="h-16 w-24 shrink-0 rounded-lg object-cover border border-border/30 hover:opacity-90 transition-opacity"
                                loading="lazy"
                                decoding="async"
                              />
                            ))}
                            {galleryCount > 5 && (
                              <Link
                                to={`/exhibitions/${edition.slug}`}
                                className="h-16 w-24 shrink-0 rounded-lg bg-muted/60 border border-border/30 flex items-center justify-center text-[10px] font-semibold text-muted-foreground hover:text-primary transition-colors"
                              >
                                +{galleryCount - 5}
                              </Link>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </div>
                </Card>
              </article>
            );
          })}
        </div>

        {/* Show more / less */}
        {pastEditions.length > 3 && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline transition-colors"
              aria-expanded={showAll}
            >
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showAll && "rotate-180")} />
              {showAll
                ? (isAr ? "عرض أقل" : "Show fewer editions")
                : (isAr ? `عرض كل ${pastEditions.length} نسخة` : `Show all ${pastEditions.length} editions`)}
            </button>
          </div>
        )}
      </div>
    </section>
  );
});
