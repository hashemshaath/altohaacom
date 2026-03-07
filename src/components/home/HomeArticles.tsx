import { useState, useMemo, memo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper, Clock, Eye } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { SectionReveal } from "@/components/ui/section-reveal";
import { SectionHeader } from "./SectionHeader";
import { FilterChip } from "./FilterChip";

const TYPE_LABELS: Record<string, { en: string; ar: string; color: string }> = {
  news: { en: "News", ar: "أخبار", color: "bg-chart-1/10 text-chart-1 border-chart-1/20" },
  article: { en: "Article", ar: "مقال", color: "bg-chart-2/10 text-chart-2 border-chart-2/20" },
  event: { en: "Event", ar: "فعالية", color: "bg-chart-3/10 text-chart-3 border-chart-3/20" },
  blog: { en: "Blog", ar: "مدونة", color: "bg-chart-4/10 text-chart-4 border-chart-4/20" },
  interview: { en: "Interview", ar: "مقابلة", color: "bg-chart-5/10 text-chart-5 border-chart-5/20" },
};

export function HomeArticles() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const { data: articles = [] } = useQuery({
    queryKey: ["home-articles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("id, title, title_ar, excerpt, excerpt_ar, featured_image_url, slug, published_at, type, view_count")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(9);
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });

  const types = useMemo(() => {
    const t = new Set<string>();
    articles.forEach((a: any) => { if (a.type) t.add(a.type); });
    return Array.from(t);
  }, [articles]);

  const filtered = useMemo(() => {
    if (!typeFilter) return articles;
    return articles.filter((a: any) => a.type === typeFilter);
  }, [articles, typeFilter]);

  if (filtered.length === 0 && articles.length === 0) return null;

  const featured = filtered[0];
  const rest = filtered.slice(1, 5);

  const typeTag = (type: string) => {
    const t = TYPE_LABELS[type];
    if (!t) return <Badge variant="outline" className="text-[10px]">{type}</Badge>;
    return (
      <Badge variant="outline" className={cn("text-[10px] border", t.color)}>
        {isAr ? t.ar : t.en}
      </Badge>
    );
  };

  return (
    <section className="container py-8 md:py-12" aria-labelledby="articles-heading" dir={isAr ? "rtl" : "ltr"}>
      <SectionHeader
        icon={Newspaper}
        badge={isAr ? "أحدث المقالات" : "Latest Articles"}
        title={isAr ? "قصص ملهمة من عالم الطهي" : "Inspiring Culinary Stories"}
        subtitle={isAr ? "أخبار الطهاة والشركات والجمعيات مع نصائح ملهمة" : "Chef stories, company news, and association updates"}
        dataSource="articles"
        itemCount={filtered.length}
        viewAllHref="/news"
        isAr={isAr}
        filters={types.length > 1 ? (
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
        <SectionReveal delay={80}>
          <div className="grid gap-3 lg:grid-cols-5">
            {/* Featured article */}
            <Link to={`/news/${featured.slug}`} className="group block lg:col-span-3">
              <Card interactive className="h-full overflow-hidden border-border/40">
                <div className="relative aspect-[16/9] sm:aspect-[16/10] overflow-hidden bg-muted">
                  {featured.featured_image_url ? (
                    <img src={featured.featured_image_url} alt={isAr && featured.title_ar ? featured.title_ar : featured.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 will-change-transform" loading="lazy" decoding="async" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                      <Newspaper className="h-12 w-12 text-primary/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {typeTag(featured.type)}
                      {featured.published_at && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {formatDistanceToNow(new Date(featured.published_at), { addSuffix: true, locale: isAr ? ar : undefined })}
                        </span>
                      )}
                      {featured.view_count > 0 && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Eye className="h-2.5 w-2.5" />
                          <AnimatedCounter value={featured.view_count} className="inline" />
                        </span>
                      )}
                    </div>
                    <h3 className="line-clamp-2 text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                      {isAr && featured.title_ar ? featured.title_ar : featured.title}
                    </h3>
                    {(isAr ? featured.excerpt_ar : featured.excerpt) && (
                      <p className="mt-1.5 line-clamp-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {isAr && featured.excerpt_ar ? featured.excerpt_ar : featured.excerpt}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </Link>

            {/* Sidebar articles */}
            <div className="lg:col-span-2">
              <div className="lg:hidden -mx-4 px-4 overflow-x-auto snap-x snap-mandatory scrollbar-none" dir={isAr ? "rtl" : "ltr"}>
                <div className="flex gap-3 pb-2" style={{ width: `${rest.length * 75}vw` }}>
                  {rest.map((article: any) => (
                    <Link key={article.id} to={`/news/${article.slug}`} className="group block snap-start" style={{ width: "72vw", flexShrink: 0 }}>
                      <Card interactive className="h-full overflow-hidden border-border/40">
                        <div className="flex gap-3 p-2.5">
                          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                            {article.featured_image_url ? (
                              <img src={article.featured_image_url} alt={isAr && article.title_ar ? article.title_ar : article.title} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                            ) : (
                              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                                <Newspaper className="h-5 w-5 text-primary/20" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">{typeTag(article.type)}</div>
                            <h3 className="line-clamp-2 text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                              {isAr && article.title_ar ? article.title_ar : article.title}
                            </h3>
                            <div className="mt-1 flex items-center gap-2">
                              {article.published_at && (
                                <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
                                  <Clock className="h-2.5 w-2.5" />
                                  {format(new Date(article.published_at), "d MMM yyyy", { locale: isAr ? ar : undefined })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="hidden lg:grid gap-3 lg:grid-cols-1">
                {rest.map((article: any) => (
                  <Link key={article.id} to={`/news/${article.slug}`} className="group block">
                    <Card interactive className="h-full overflow-hidden border-border/40">
                      <div className="flex gap-3 p-2.5 lg:p-3">
                        <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                          {article.featured_image_url ? (
                            <img src={article.featured_image_url} alt={isAr && article.title_ar ? article.title_ar : article.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" decoding="async" />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                              <Newspaper className="h-5 w-5 text-primary/20" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">{typeTag(article.type)}</div>
                          <h3 className="line-clamp-2 text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                            {isAr && article.title_ar ? article.title_ar : article.title}
                          </h3>
                          <div className="mt-1 flex items-center gap-2">
                            {article.published_at && (
                              <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                {format(new Date(article.published_at), "d MMM yyyy", { locale: isAr ? ar : undefined })}
                              </p>
                            )}
                            {article.view_count > 0 && (
                              <span className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
                                <Eye className="h-2.5 w-2.5" />
                                {article.view_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </SectionReveal>
      ) : (
        <div className="py-8 text-center text-sm text-muted-foreground">
          {isAr ? "لا توجد مقالات بهذا التصنيف" : "No articles for this filter"}
        </div>
      )}
    </section>
  );
}
