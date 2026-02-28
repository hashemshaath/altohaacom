import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Newspaper, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { SectionReveal } from "@/components/ui/section-reveal";

const TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  news: { en: "News", ar: "أخبار" },
  article: { en: "Article", ar: "مقال" },
  event: { en: "Event", ar: "فعالية" },
  blog: { en: "Blog", ar: "مدونة" },
  interview: { en: "Interview", ar: "مقابلة" },
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
  const typeLabel = (type: string) => {
    const t = TYPE_LABELS[type];
    return t ? (isAr ? t.ar : t.en) : type;
  };

  return (
    <section className="container py-8 md:py-12" aria-labelledby="articles-heading">
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
        {/* Magazine layout: featured + sidebar */}
        <div className="grid gap-3 lg:grid-cols-5">
          {/* Featured article — large */}
          <Link to={`/news/${featured.slug}`} className="group block lg:col-span-3">
            <Card interactive className="h-full overflow-hidden border-border/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/25">
              <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                {featured.featured_image_url ? (
                  <img src={featured.featured_image_url} alt={featuredTitle} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <Newspaper className="h-12 w-12 text-primary/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-[10px]">{typeLabel(featured.type)}</Badge>
                    {featured.published_at && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {formatDistanceToNow(new Date(featured.published_at), { addSuffix: true, locale: isAr ? ar : undefined })}
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

          {/* Sidebar articles */}
          <div className="grid gap-3 grid-cols-2 lg:col-span-2 lg:grid-cols-1">
            {rest.map((article: any) => {
              const title = isAr && article.title_ar ? article.title_ar : article.title;
              return (
                <Link key={article.id} to={`/news/${article.slug}`} className="group block">
                  <Card interactive className="h-full overflow-hidden border-border/40 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/20">
                    <div className="flex gap-3 p-2.5 lg:p-3">
                      {/* Thumbnail */}
                      <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {article.featured_image_url ? (
                          <img src={article.featured_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                            <Newspaper className="h-5 w-5 text-primary/20" />
                          </div>
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">{typeLabel(article.type)}</Badge>
                        </div>
                        <h3 className="line-clamp-2 text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                          {title}
                        </h3>
                        {article.published_at && (
                          <p className="mt-1 text-[10px] text-muted-foreground/70 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {format(new Date(article.published_at), "MMM d, yyyy")}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </SectionReveal>
    </section>
  );
}
