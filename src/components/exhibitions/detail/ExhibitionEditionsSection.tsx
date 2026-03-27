import { memo, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar, Users, Landmark, Globe, MapPin, ArrowUpRight, TrendingUp,
  TrendingDown, BarChart3, Eye, Award, History, ChevronRight, Trophy,
  Image as ImageIcon, ExternalLink,
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
      pct > 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-500 dark:text-red-400"
    )}>
      {pct > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
      {pct > 0 ? "+" : ""}{pct}%
    </span>
  );
});

export const ExhibitionEditionsSection = memo(function ExhibitionEditionsSection({ seriesId, currentExhibitionId, isAr }: Props) {
  const [expandedEdition, setExpandedEdition] = useState<string | null>(null);

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
      (data || []).forEach((c: any) => {
        counts[c.exhibition_id] = (counts[c.exhibition_id] || 0) + 1;
      });
      return counts;
    },
    enabled: editionIds.length > 0,
    staleTime: 1000 * 60 * 10,
  });

  const pastEditions = useMemo(() => {
    return (editions || []).filter(e => e.id !== currentExhibitionId);
  }, [editions, currentExhibitionId]);

  const currentEdition = useMemo(() => {
    return (editions || []).find(e => e.id === currentExhibitionId);
  }, [editions, currentExhibitionId]);

  // Growth summary
  const growthSummary = useMemo(() => {
    if (!editions || editions.length < 2) return null;
    const sorted = [...editions].sort((a, b) => (a.edition_year || 0) - (b.edition_year || 0));
    const first = parseStats(sorted[0].edition_stats);
    const last = parseStats(sorted[sorted.length - 1].edition_stats);
    return { first, last, totalEditions: sorted.length, firstYear: sorted[0].edition_year, lastYear: sorted[sorted.length - 1].edition_year };
  }, [editions]);

  if (!seriesId || isLoading || pastEditions.length === 0) return null;

  return (
    <section className="mt-8 sm:mt-12">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            <History className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{isAr ? "النسخ السابقة" : "Previous Editions"}</h2>
            <p className="text-xs text-muted-foreground">
              {isAr
                ? `${pastEditions.length} نسخة سابقة من هذا الحدث`
                : `${pastEditions.length} previous edition${pastEditions.length > 1 ? "s" : ""} of this event`}
            </p>
          </div>
        </div>
      </div>

      {/* Growth Overview Card */}
      {growthSummary && (
        <Card className="mb-6 overflow-hidden border-primary/15 bg-gradient-to-br from-primary/5 via-background to-primary/3">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                {isAr ? "نمو السلسلة" : "Series Growth"}
              </span>
              <Badge variant="outline" className="text-[9px] ms-auto">
                {growthSummary.firstYear} → {growthSummary.lastYear}
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: isAr ? "الزوار" : "Visitors", icon: Users, first: growthSummary.first.visitors, last: growthSummary.last.visitors, color: "text-blue-500" },
                { label: isAr ? "العارضون" : "Exhibitors", icon: Landmark, first: growthSummary.first.exhibitors, last: growthSummary.last.exhibitors, color: "text-emerald-500" },
                { label: isAr ? "الدول" : "Countries", icon: Globe, first: growthSummary.first.countries, last: growthSummary.last.countries, color: "text-amber-500" },
                { label: isAr ? "المساحة م²" : "Area m²", icon: MapPin, first: growthSummary.first.area, last: growthSummary.last.area, color: "text-violet-500" },
              ].map(item => (
                <div key={item.label} className="text-center space-y-1">
                  <item.icon className={cn("h-4 w-4 mx-auto", item.color)} />
                  <p className="text-base sm:text-lg font-bold tabular-nums">{item.last?.toLocaleString() || "—"}</p>
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  <GrowthBadge current={item.last} previous={item.first} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edition Cards */}
      <div className="space-y-4">
        {pastEditions.map((edition, idx) => {
          const stats = parseStats(edition.edition_stats);
          const nextEdition = pastEditions[idx + 1];
          const prevStats = nextEdition ? parseStats(nextEdition.edition_stats) : {};
          const compCount = competitionCounts?.[edition.id] || 0;
          const title = isAr && edition.title_ar ? edition.title_ar : edition.title;
          const desc = isAr && edition.description_ar ? edition.description_ar : edition.description;
          const isExpanded = expandedEdition === edition.id;
          const galleryCount = (edition.gallery_urls || []).length;
          const hasStats = stats.visitors || stats.exhibitors || stats.countries || stats.area;

          return (
            <Card
              key={edition.id}
              className={cn(
                "overflow-hidden transition-all duration-300 group",
                isExpanded ? "border-primary/30 shadow-lg shadow-primary/5" : "hover:border-primary/20 hover:shadow-md"
              )}
            >
              <div className="flex flex-col sm:flex-row">
                {/* Cover Image */}
                {edition.cover_image_url && (
                  <div className="relative sm:w-52 h-36 sm:h-auto shrink-0 overflow-hidden">
                    <img
                      src={edition.cover_image_url}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-background/70 to-transparent" />
                    {/* Year overlay */}
                    <div className="absolute top-3 start-3 flex h-10 w-10 items-center justify-center rounded-xl bg-background/90 backdrop-blur-sm border border-border/50 shadow-sm">
                      <span className="text-xs font-bold">{edition.edition_year || "—"}</span>
                    </div>
                  </div>
                )}

                <div className="flex-1 p-4 sm:p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant="outline" className="text-[9px] font-bold">
                          {edition.edition_year || "—"}
                        </Badge>
                        {edition.status === "completed" && (
                          <Badge variant="secondary" className="text-[9px]">
                            {isAr ? "منتهية" : "Completed"}
                          </Badge>
                        )}
                        {compCount > 0 && (
                          <Badge className="text-[9px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                            <Trophy className="h-2.5 w-2.5 me-0.5" />
                            {compCount} {isAr ? "مسابقة" : "comp."}
                          </Badge>
                        )}
                        {galleryCount > 0 && (
                          <Badge variant="outline" className="text-[9px]">
                            <ImageIcon className="h-2.5 w-2.5 me-0.5" />
                            {galleryCount}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-bold text-sm sm:text-base">{title}</h3>
                    </div>
                    <Link
                      to={`/exhibitions/${edition.slug}`}
                      className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(edition.start_date), "dd MMM yyyy", { locale: isAr ? ar : undefined })}
                      {edition.end_date && ` — ${format(new Date(edition.end_date), "dd MMM", { locale: isAr ? ar : undefined })}`}
                    </span>
                    {edition.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {edition.city}
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
                    <p className={cn("text-xs text-muted-foreground mb-3", isExpanded ? "" : "line-clamp-2")}>{desc}</p>
                  )}

                  {/* Stats */}
                  {hasStats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-muted/40 border border-border/30">
                      {stats.visitors && (
                        <div className="text-center">
                          <p className="text-sm font-bold tabular-nums">{stats.visitors.toLocaleString()}</p>
                          <p className="text-[9px] text-muted-foreground">{isAr ? "زائر" : "Visitors"}</p>
                          <GrowthBadge current={stats.visitors} previous={prevStats.visitors} />
                        </div>
                      )}
                      {stats.exhibitors && (
                        <div className="text-center">
                          <p className="text-sm font-bold tabular-nums">{stats.exhibitors.toLocaleString()}</p>
                          <p className="text-[9px] text-muted-foreground">{isAr ? "عارض" : "Exhibitors"}</p>
                          <GrowthBadge current={stats.exhibitors} previous={prevStats.exhibitors} />
                        </div>
                      )}
                      {stats.countries && (
                        <div className="text-center">
                          <p className="text-sm font-bold tabular-nums">{stats.countries}</p>
                          <p className="text-[9px] text-muted-foreground">{isAr ? "دولة" : "Countries"}</p>
                          <GrowthBadge current={stats.countries} previous={prevStats.countries} />
                        </div>
                      )}
                      {stats.area && (
                        <div className="text-center">
                          <p className="text-sm font-bold tabular-nums">{stats.area.toLocaleString()}</p>
                          <p className="text-[9px] text-muted-foreground">{isAr ? "م²" : "m²"}</p>
                          <GrowthBadge current={stats.area} previous={prevStats.area} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expand / View Full Details */}
                  <div className="mt-3 flex items-center gap-3">
                    {(desc || hasStats) && (
                      <button
                        onClick={() => setExpandedEdition(isExpanded ? null : edition.id)}
                        className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {isExpanded ? (isAr ? "عرض أقل" : "Show less") : (isAr ? "عرض المزيد" : "Show more")}
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

                  {/* Expanded: Gallery preview */}
                  {isExpanded && galleryCount > 0 && (
                    <div className="mt-4 pt-3 border-t border-border/30">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        {isAr ? "صور من النسخة" : "Edition Gallery"}
                      </p>
                      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                        {(edition.gallery_urls || []).slice(0, 6).map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt={`${title} ${i + 1}`}
                            className="h-20 w-28 shrink-0 rounded-lg object-cover border border-border/30"
                            loading="lazy"
                          />
                        ))}
                        {galleryCount > 6 && (
                          <Link
                            to={`/exhibitions/${edition.slug}`}
                            className="h-20 w-28 shrink-0 rounded-lg bg-muted/60 border border-border/30 flex items-center justify-center text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                          >
                            +{galleryCount - 6} {isAr ? "صورة" : "more"}
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
});
