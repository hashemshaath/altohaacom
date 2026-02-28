import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Newspaper, Clock, Eye } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { SectionReveal } from "@/components/ui/section-reveal";

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

  const { data: articles = [] } = useQuery({
    queryKey: ["home-articles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("id, title, title_ar, excerpt, excerpt_ar, featured_image_url, slug, published_at, type, view_count")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });

  if (articles.length === 0) return null;

  const featured = articles[0];
  const rest = articles.slice(1);
  const featuredTitle = isAr && featured.title_ar ? featured.title_ar : featured.title;
  const featuredExcerpt = isAr && featured.excerpt_ar ? featured.excerpt_ar : featured.excerpt;

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
      <SectionReveal>
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="secondary" className="mb-1.5 gap-1">
              <Newspaper className="h-3 w-3" />
              {isAr ? "أحدث المقالات" : "Latest Articles"}
            </Badge>
            <h2 id="articles-heading" className={cn("text-xl font-bold sm:text-2xl text-foreground tracking-tight", !isAr && "font-serif")}>
              {isAr ? "قصص ملهمة من عالم الطهي" : "Inspiring Culinary Stories"}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {isAr ? "أخبار الطهاة والشركات والجمعيات مع نصائح ملهمة" : "Chef stories, company news, and association updates"}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/news">
              {isAr ? "عرض الكل" : "View All"}
              <ArrowRight className="ms-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </SectionReveal>

      <SectionReveal delay={80}>
        <div className="grid gap-3 lg:grid-cols-5">
          {/* Featured article — enhanced with better mobile touch target */}
          <Link to={`/news/${featured.slug}`} className="group block lg:col-span-3">
            <Card interactive className="h-full overflow-hidden border-border/40">
              <div className="relative aspect-[16/9] sm:aspect-[16/10] overflow-hidden bg-muted">
                {featured.featured_image_url ? (
                  <img
                    src={featured.featured_image_url}
                    alt={featuredTitle}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 will-change-transform"
                    loading="lazy"
                    decoding="async"
                  />
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
                        {featured.view_count.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <h3 className="line-clamp-2 text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                    {featuredTitle}
                  </h3>
                  {featuredExcerpt && (
                    <p className="mt-1.5 line-clamp-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">{featuredExcerpt}</p>
                  )}
                </div>
              </div>
            </Card>
          </Link>

          {/* Sidebar articles — mobile: horizontal scroll, desktop: vertical stack */}
          <div className="lg:col-span-2">
            {/* Mobile horizontal scroll */}
            <div className="lg:hidden -mx-4 px-4 overflow-x-auto snap-x snap-mandatory scrollbar-none" dir={isAr ? "rtl" : "ltr"}>
              <div className="flex gap-3 pb-2" style={{ width: `${rest.length * 75}vw` }}>
                {rest.map((article: any) => {
                  const title = isAr && article.title_ar ? article.title_ar : article.title;
                  return (
                    <Link key={article.id} to={`/news/${article.slug}`} className="group block snap-start" style={{ width: "72vw", flexShrink: 0 }}>
                      <Card interactive className="h-full overflow-hidden border-border/40">
                        <div className="flex gap-3 p-2.5">
                          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                            {article.featured_image_url ? (
                              <img src={article.featured_image_url} alt={title} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                            ) : (
                              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                                <Newspaper className="h-5 w-5 text-primary/20" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">{typeTag(article.type)}</div>
                            <h3 className="line-clamp-2 text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug">{title}</h3>
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
                  );
                })}
              </div>
            </div>
            {/* Desktop vertical stack */}
            <div className="hidden lg:grid gap-3 lg:grid-cols-1">
              {rest.map((article: any) => {
                const title = isAr && article.title_ar ? article.title_ar : article.title;
                return (
                  <Link key={article.id} to={`/news/${article.slug}`} className="group block">
                    <Card interactive className="h-full overflow-hidden border-border/40">
                      <div className="flex gap-3 p-2.5 lg:p-3">
                        <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {article.featured_image_url ? (
                            <img src={article.featured_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" decoding="async" />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                              <Newspaper className="h-5 w-5 text-primary/20" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">{typeTag(article.type)}</div>
                          <h3 className="line-clamp-2 text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug">{title}</h3>
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
                );
              })}
            </div>
          </div>
        </div>
      </SectionReveal>
    </section>
  );
}
