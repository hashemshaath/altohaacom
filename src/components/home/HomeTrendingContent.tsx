import { forwardRef, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Eye, Flame } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Link } from "react-router-dom";
import { SectionReveal } from "@/components/ui/section-reveal";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { SectionHeader } from "./SectionHeader";
import { FilterChip } from "./FilterChip";
import { useSectionConfig } from "@/components/home/SectionKeyContext";

const TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  news: { en: "News", ar: "أخبار" },
  article: { en: "Article", ar: "مقال" },
  event: { en: "Event", ar: "فعالية" },
  blog: { en: "Blog", ar: "مدونة" },
  interview: { en: "Interview", ar: "مقابلة" },
};

export const HomeTrendingContent = forwardRef<HTMLDivElement>(function HomeTrendingContent(_props, ref) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const sectionConfig = useSectionConfig();

  const itemCount = sectionConfig?.item_count || 6;
  const showFilters = sectionConfig?.show_filters ?? true;
  const showViewAll = sectionConfig?.show_view_all ?? true;
  const sectionTitle = sectionConfig
    ? (isAr ? sectionConfig.title_ar || "المحتوى الرائج" : sectionConfig.title_en || "Trending Now")
    : (isAr ? "المحتوى الرائج" : "Trending Now");
  const sectionSubtitle = sectionConfig
    ? (isAr ? sectionConfig.subtitle_ar || "" : sectionConfig.subtitle_en || "")
    : (isAr ? "الأكثر قراءة هذا الأسبوع" : "Most read this week");

  const { data: articles = [] } = useQuery({
    queryKey: ["home-trending-articles", itemCount],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("id, title, title_ar, slug, excerpt, excerpt_ar, featured_image_url, published_at, view_count, type")
        .eq("status", "published")
        .order("view_count", { ascending: false })
        .limit(itemCount);
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const types = useMemo(() => {
    const s = new Set<string>();
    articles.forEach((a: any) => { if (a.type) s.add(a.type); });
    return Array.from(s);
  }, [articles]);

  const filtered = useMemo(() => {
    if (!typeFilter) return articles;
    return articles.filter((a: any) => a.type === typeFilter);
  }, [articles, typeFilter]);

  if (articles.length === 0) return null;

  const [featured, ...rest] = filtered;

  return (
    <div ref={ref}>
      <section aria-label={isAr ? "المحتوى الرائج" : "Trending Content"} dir={isAr ? "rtl" : "ltr"}>
        <div className="container">
          <SectionHeader
            icon={TrendingUp}
            badge={isAr ? "رائج" : "Trending"}
            title={sectionTitle}
            subtitle={sectionSubtitle}
            dataSource="articles (by view_count)"
            itemCount={filtered.length}
            viewAllHref={showViewAll ? "/articles" : undefined}
            isAr={isAr}
            filters={showFilters && types.length > 1 ? (
              <>
                <FilterChip label={isAr ? "الكل" : "All"} active={!typeFilter} count={articles.length} onClick={() => setTypeFilter(null)} />
                {types.map(t => {
                  const label = TYPE_LABELS[t];
                  return (
                    <FilterChip
                      key={t}
                      label={label ? (isAr ? label.ar : label.en) : t}
                      active={typeFilter === t}
                      count={articles.filter((a: any) => a.type === t).length}
                      onClick={() => setTypeFilter(typeFilter === t ? null : t)}
                    />
                  );
                })}
              </>
            ) : undefined}
          />

          {featured ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <SectionReveal delay={0}>
                <Link to={`/articles/${featured.slug}`}>
                  <Card className="overflow-hidden group h-full border-border/40 rounded-2xl hover:shadow-lg transition-all">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      {featured.featured_image_url ? (
                        <img src={featured.featured_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <TrendingUp className="h-10 w-10 text-muted-foreground/20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
                      <div className="absolute bottom-0 p-4">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge className="bg-chart-4/90 text-chart-4-foreground text-[10px] gap-1">
                            <Flame className="h-2.5 w-2.5" />
                            {isAr ? "الأكثر رواجاً" : "Top Trending"}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] capitalize">{TYPE_LABELS[featured.type] ? (isAr ? TYPE_LABELS[featured.type].ar : TYPE_LABELS[featured.type].en) : featured.type}</Badge>
                        </div>
                        <h3 className="text-lg font-bold leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                          {isAr && featured.title_ar ? featured.title_ar : featured.title}
                        </h3>
                        {(isAr ? featured.excerpt_ar : featured.excerpt) && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {isAr && featured.excerpt_ar ? featured.excerpt_ar : featured.excerpt}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                          {featured.published_at && <span>{format(new Date(featured.published_at), "d MMM yyyy", { locale: isAr ? ar : undefined })}</span>}
                          {featured.view_count > 0 && (
                            <span className="flex items-center gap-0.5">
                              <Eye className="h-2.5 w-2.5" /> <AnimatedCounter value={featured.view_count} className="inline" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </SectionReveal>

              <div className="flex flex-col gap-3">
                {rest.map((article, i) => (
                  <SectionReveal key={article.id} delay={(i + 1) * 80}>
                    <Link to={`/articles/${article.slug}`}>
                      <Card className="flex overflow-hidden group border-border/40 rounded-2xl hover:shadow-md transition-all h-full">
                        <div className="w-20 sm:w-28 shrink-0 overflow-hidden">
                          {article.featured_image_url ? (
                            <img src={article.featured_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <TrendingUp className="h-5 w-5 text-muted-foreground/20" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <Badge variant="outline" className="text-[9px] capitalize">{TYPE_LABELS[article.type] ? (isAr ? TYPE_LABELS[article.type].ar : TYPE_LABELS[article.type].en) : article.type}</Badge>
                            <span className="text-[9px] text-muted-foreground/60">#{i + 2}</span>
                          </div>
                          <h4 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                            {isAr && article.title_ar ? article.title_ar : article.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                            {article.published_at && <span>{format(new Date(article.published_at), "d MMM", { locale: isAr ? ar : undefined })}</span>}
                            {article.view_count > 0 && (
                              <span className="flex items-center gap-0.5">
                                <Eye className="h-2.5 w-2.5" /> <AnimatedCounter value={article.view_count} className="inline" />
                              </span>
                            )}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </SectionReveal>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {isAr ? "لا توجد نتائج" : "No results for this filter"}
            </div>
          )}
        </div>
      </section>
    </div>
  );
});
