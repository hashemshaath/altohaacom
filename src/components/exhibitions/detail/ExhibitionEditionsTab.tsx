import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar, Users, Landmark, Globe, MapPin, ArrowUpRight, TrendingUp,
  TrendingDown, Minus, BarChart3, Eye, Award, ChevronRight, History,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

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

function TrendIcon({ current, previous }: { current?: number; previous?: number }) {
  if (!current || !previous) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0) return <span className="inline-flex items-center gap-0.5 text-emerald-600 text-[12px] font-semibold"><TrendingUp className="h-3 w-3" />+{pct}%</span>;
  if (pct < 0) return <span className="inline-flex items-center gap-0.5 text-red-500 text-[12px] font-semibold"><TrendingDown className="h-3 w-3" />{pct}%</span>;
  return <span className="inline-flex items-center gap-0.5 text-muted-foreground text-[12px]"><Minus className="h-3 w-3" />0%</span>;
}

export const ExhibitionEditionsTab = memo(function ExhibitionEditionsTab({ seriesId, currentExhibitionId, isAr }: Props) {
  const { data: editions, isLoading } = useQuery({
    queryKey: ["exhibition-editions", seriesId],
    queryFn: async () => {
      if (!seriesId) return [];
      const { data, error } = await supabase
        .from("exhibitions")
        .select("id, title, title_ar, slug, start_date, end_date, edition_year, edition_stats, status, city, country, cover_image_url, logo_url, view_count, description, description_ar")
        .eq("series_id", seriesId)
        .order("edition_year", { ascending: false });
      if (error) throw error;
      return (data || []) as EditionRow[];
    },
    enabled: !!seriesId,
    staleTime: 1000 * 60 * 10,
  });

  // Fetch competition counts for each edition
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

  const sortedEditions = useMemo(() => {
    return (editions || []).sort((a, b) => (b.edition_year || 0) - (a.edition_year || 0));
  }, [editions]);

  // Aggregate growth stats across all editions
  const growthData = useMemo(() => {
    if (!sortedEditions.length) return null;
    const allStats = sortedEditions.map(e => ({ year: e.edition_year, ...parseStats(e.edition_stats) })).filter(s => s.year);
    if (allStats.length < 2) return null;
    const latest = allStats[0];
    const earliest = allStats[allStats.length - 1];
    return { latest, earliest, totalEditions: allStats.length };
  }, [sortedEditions]);

  if (!seriesId) {
    return (
      <div className="text-center py-16">
        <History className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground text-sm">{isAr ? "لا توجد نسخ سابقة مسجلة" : "No previous editions recorded"}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />)}
      </div>
    );
  }

  if (!sortedEditions.length) {
    return (
      <div className="text-center py-16">
        <History className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground text-sm">{isAr ? "لا توجد نسخ سابقة" : "No editions found"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ═══ Growth Summary Banner ═══ */}
      {growthData && (
        <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-sm">{isAr ? "نمو السلسلة عبر السنوات" : "Series Growth Over the Years"}</h3>
              <Badge variant="secondary" className="text-[12px] ms-auto">
                {growthData.totalEditions} {isAr ? "نسخة" : "editions"}
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  label: isAr ? "الزوار" : "Visitors",
                  icon: Users,
                  latest: growthData.latest.visitors,
                  earliest: growthData.earliest.visitors,
                },
                {
                  label: isAr ? "العارضون" : "Exhibitors",
                  icon: Landmark,
                  latest: growthData.latest.exhibitors,
                  earliest: growthData.earliest.exhibitors,
                },
                {
                  label: isAr ? "الدول" : "Countries",
                  icon: Globe,
                  latest: growthData.latest.countries,
                  earliest: growthData.earliest.countries,
                },
                {
                  label: isAr ? "المساحة م²" : "Area m²",
                  icon: MapPin,
                  latest: growthData.latest.area,
                  earliest: growthData.earliest.area,
                },
              ].map(item => (
                <div key={item.label} className="text-center">
                  <item.icon className="h-4 w-4 mx-auto text-primary/60 mb-1" />
                  <p className="text-lg font-bold">{item.latest?.toLocaleString() || "—"}</p>
                  <p className="text-[12px] text-muted-foreground">{item.label}</p>
                  <TrendIcon current={item.latest} previous={item.earliest} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ Edition Timeline ═══ */}
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute top-0 bottom-0 start-[23px] w-px bg-gradient-to-b from-primary via-border to-border/20" />

        <div className="space-y-4">
          {sortedEditions.map((edition, idx) => {
            const isCurrent = edition.id === currentExhibitionId;
            const stats = parseStats(edition.edition_stats);
            const prevEdition = sortedEditions[idx + 1];
            const prevStats = prevEdition ? parseStats(prevEdition.edition_stats) : {};
            const compCount = competitionCounts?.[edition.id] || 0;
            const title = isAr && edition.title_ar ? edition.title_ar : edition.title;
            const desc = isAr && edition.description_ar ? edition.description_ar : edition.description;

            return (
              <div key={edition.id} className="relative ps-14">
                {/* Timeline node */}
                <div className={`absolute start-0 top-4 flex h-12 w-12 items-center justify-center rounded-full border-2 z-10 ${
                  isCurrent
                    ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "border-border bg-background text-muted-foreground"
                }`}>
                  <span className="text-xs font-bold">{edition.edition_year || "—"}</span>
                </div>

                <Card className={`rounded-2xl overflow-hidden transition-all hover:shadow-lg group ${
                  isCurrent ? "border-primary/40 ring-1 ring-primary/20" : "border-border/40 hover:border-primary/30"
                }`}>
                  {/* Edition Header with Cover */}
                  <div className="flex flex-col sm:flex-row">
                    {edition.cover_image_url && (
                      <div className="relative sm:w-48 h-32 sm:h-auto shrink-0 overflow-hidden">
                        <img
                          src={edition.cover_image_url}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-background/60 to-transparent" />
                      </div>
                    )}

                    <CardContent className="flex-1 p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-base group-hover:text-primary transition-colors">
                              {title}
                            </h4>
                            {isCurrent && (
                              <Badge className="text-[12px] gap-1 bg-primary/10 text-primary border-primary/20">
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                                </span>
                                {isAr ? "النسخة الحالية" : "Current Edition"}
                              </Badge>
                            )}
                            {edition.status === "completed" && (
                              <Badge variant="outline" className="text-[12px]">
                                {isAr ? "منتهية" : "Completed"}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(edition.start_date), "dd MMM yyyy", { locale: isAr ? ar : undefined })}
                              {edition.end_date && ` — ${format(new Date(edition.end_date), "dd MMM yyyy", { locale: isAr ? ar : undefined })}`}
                            </span>
                            {edition.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {edition.city}{edition.country ? `, ${edition.country}` : ""}
                              </span>
                            )}
                          </div>
                        </div>
                        {!isCurrent && (
                          <Link
                            to={`/exhibitions/${edition.slug}`}
                            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl bg-muted/50 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        )}
                      </div>

                      {/* Description snippet */}
                      {desc && (
                        <p className="text-[12px] text-muted-foreground line-clamp-2 mb-3">{desc}</p>
                      )}

                      {/* Stats Grid */}
                      {(stats.visitors || stats.exhibitors || stats.countries || stats.area) && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                          {stats.visitors && (
                            <div className="text-center">
                              <Users className="h-3.5 w-3.5 mx-auto text-blue-500 mb-0.5" />
                              <p className="text-sm font-bold">{stats.visitors.toLocaleString()}</p>
                              <p className="text-[12px] text-muted-foreground">{isAr ? "زائر" : "Visitors"}</p>
                              <TrendIcon current={stats.visitors} previous={prevStats.visitors} />
                            </div>
                          )}
                          {stats.exhibitors && (
                            <div className="text-center">
                              <Landmark className="h-3.5 w-3.5 mx-auto text-emerald-500 mb-0.5" />
                              <p className="text-sm font-bold">{stats.exhibitors.toLocaleString()}</p>
                              <p className="text-[12px] text-muted-foreground">{isAr ? "عارض" : "Exhibitors"}</p>
                              <TrendIcon current={stats.exhibitors} previous={prevStats.exhibitors} />
                            </div>
                          )}
                          {stats.countries && (
                            <div className="text-center">
                              <Globe className="h-3.5 w-3.5 mx-auto text-orange-500 mb-0.5" />
                              <p className="text-sm font-bold">{stats.countries}</p>
                              <p className="text-[12px] text-muted-foreground">{isAr ? "دولة" : "Countries"}</p>
                              <TrendIcon current={stats.countries} previous={prevStats.countries} />
                            </div>
                          )}
                          {stats.area && (
                            <div className="text-center">
                              <MapPin className="h-3.5 w-3.5 mx-auto text-violet-500 mb-0.5" />
                              <p className="text-sm font-bold">{stats.area.toLocaleString()}</p>
                              <p className="text-[12px] text-muted-foreground">{isAr ? "م²" : "m²"}</p>
                              <TrendIcon current={stats.area} previous={prevStats.area} />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bottom meta row */}
                      <div className="flex items-center gap-3 mt-3 text-[12px] text-muted-foreground flex-wrap">
                        {(edition.view_count || 0) > 0 && (
                          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{(edition.view_count || 0).toLocaleString()} {isAr ? "مشاهدة" : "views"}</span>
                        )}
                        {compCount > 0 && (
                          <span className="flex items-center gap-1"><Award className="h-3 w-3 text-amber-500" />{compCount} {isAr ? "مسابقة" : "competitions"}</span>
                        )}
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
