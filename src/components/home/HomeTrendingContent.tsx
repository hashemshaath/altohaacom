import { forwardRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Eye, ArrowRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { SectionReveal } from "@/components/ui/section-reveal";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

export const HomeTrendingContent = forwardRef<HTMLDivElement>(function HomeTrendingContent(_props, ref) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: articles = [] } = useQuery({
    queryKey: ["home-trending-articles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("id, title, title_ar, slug, excerpt, excerpt_ar, featured_image_url, published_at, view_count, type")
        .eq("status", "published")
        .order("view_count", { ascending: false })
        .limit(4);
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  if (articles.length === 0) return null;

  const [featured, ...rest] = articles;

  return (
    <div ref={ref}>
      <section className="py-10 md:py-14" aria-label={isAr ? "المحتوى الرائج" : "Trending Content"} dir={isAr ? "rtl" : "ltr"}>
        <div className="container">
          <SectionReveal>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chart-4/10 ring-1 ring-chart-4/20">
                  <TrendingUp className="h-4 w-4 text-chart-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{isAr ? "المحتوى الرائج" : "Trending Now"}</h2>
                  <p className="text-xs text-muted-foreground">{isAr ? "الأكثر قراءة هذا الأسبوع" : "Most read this week"}</p>
                </div>
              </div>
              <Link to="/articles">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-full">
                  {isAr ? "عرض الكل" : "View All"}
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </SectionReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <SectionReveal delay={0}>
              <Link to={`/articles/${featured.slug}`}>
                <Card className="overflow-hidden group h-full border-border/40 hover:shadow-lg transition-all">
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
                        <Badge variant="outline" className="text-[10px] capitalize">{featured.type}</Badge>
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
                            <Eye className="h-2.5 w-2.5" /> {featured.view_count.toLocaleString()}
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
                    <Card className="flex overflow-hidden group border-border/40 hover:shadow-md transition-all h-full">
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
                          <Badge variant="outline" className="text-[9px] capitalize">{article.type}</Badge>
                          <span className="text-[9px] text-muted-foreground/60">#{i + 2}</span>
                        </div>
                        <h4 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                          {isAr && article.title_ar ? article.title_ar : article.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                          {article.published_at && <span>{format(new Date(article.published_at), "d MMM", { locale: isAr ? ar : undefined })}</span>}
                          {article.view_count > 0 && (
                            <span className="flex items-center gap-0.5">
                              <Eye className="h-2.5 w-2.5" /> {article.view_count.toLocaleString()}
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
        </div>
      </section>
    </div>
  );
});
