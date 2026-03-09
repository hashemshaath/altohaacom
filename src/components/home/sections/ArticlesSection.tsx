import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Newspaper, BookOpen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useSectionConfig } from "@/components/home/SectionKeyContext";
import { SectionHeader } from "@/components/home/SectionHeader";
import { HorizontalScrollRow } from "@/components/home/HorizontalScrollRow";

const TYPE_MAP: Record<string, { en: string; ar: string; color: string }> = {
  news: { en: "News", ar: "أخبار", color: "bg-chart-1/10 text-chart-1 border-chart-1/20" },
  article: { en: "Article", ar: "مقال", color: "bg-chart-2/10 text-chart-2 border-chart-2/20" },
  blog: { en: "Blog", ar: "مدونة", color: "bg-chart-4/10 text-chart-4 border-chart-4/20" },
  interview: { en: "Interview", ar: "مقابلة", color: "bg-chart-5/10 text-chart-5 border-chart-5/20" },
  event: { en: "Event", ar: "فعالية", color: "bg-chart-3/10 text-chart-3 border-chart-3/20" },
};

function estimateReadTime(excerpt: string | null): number {
  if (!excerpt) return 2;
  const words = excerpt.trim().split(/\s+/).length;
  // Rough estimate: excerpt is ~10% of article
  return Math.max(1, Math.ceil((words * 10) / 200));
}

const ArticlesSection = memo(function ArticlesSection() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const config = useSectionConfig();

  const itemCount = config?.item_count || 8;
  const title = config
    ? (isAr ? config.title_ar || "أحدث المقالات" : config.title_en || "Latest from the Kitchen")
    : (isAr ? "أحدث المقالات" : "Latest from the Kitchen");
  const subtitle = config
    ? (isAr ? config.subtitle_ar || "" : config.subtitle_en || "")
    : (isAr ? "آخر الأخبار والمقالات من عالم الطهي" : "Stay updated with the latest culinary news and stories");
  const showSubtitle = config?.show_subtitle ?? true;
  const showViewAll = config?.show_view_all ?? true;

  const { data: articles = [] } = useQuery({
    queryKey: ["home-articles-minimal", itemCount],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("id, title, title_ar, excerpt, excerpt_ar, featured_image_url, slug, published_at, type")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(itemCount);
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  if (articles.length === 0) return null;

  return (
    <section dir={isAr ? "rtl" : "ltr"}>
      <div className="container">
        <SectionHeader
          icon={Newspaper}
          badge={isAr ? "أخبار ومقالات" : "News & Articles"}
          title={title}
          subtitle={showSubtitle ? subtitle : undefined}
          viewAllHref={showViewAll ? "/articles" : undefined}
          viewAllLabel={isAr ? "عرض جميع المقالات" : "View All Articles"}
          isAr={isAr}
        />

        <HorizontalScrollRow isAr={isAr}>
          {articles.map((article: any) => {
            const typeInfo = article.type && TYPE_MAP[article.type];
            const readTime = estimateReadTime(article.excerpt || article.excerpt_ar);
            return (
              <Link
                key={article.id}
                to={`/news/${article.slug}`}
                className="group block snap-start shrink-0 w-[72vw] sm:w-[45vw] md:w-[32vw] lg:w-[24vw] xl:w-[20vw] touch-manipulation"
              >
                <Card className="overflow-hidden border-border/30 h-full transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 rounded-2xl active:scale-[0.98]">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {article.featured_image_url ? (
                      <img src={article.featured_image_url} alt={isAr ? article.title_ar || article.title : article.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center">
                        <Newspaper className="h-8 w-8 text-muted-foreground/20" />
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-card/60 via-transparent to-transparent" />
                    {/* Type badge */}
                    {typeInfo && (
                      <Badge variant="outline" className={cn("absolute top-2.5 start-2.5 text-[9px] border backdrop-blur-sm", typeInfo.color)}>
                        {isAr ? typeInfo.ar : typeInfo.en}
                      </Badge>
                    )}
                    {/* Reading time pill */}
                    <div className="absolute bottom-2.5 end-2.5 flex items-center gap-1 rounded-lg bg-background/80 backdrop-blur-sm px-2 py-0.5 text-[10px] text-muted-foreground">
                      <BookOpen className="h-2.5 w-2.5" />
                      {readTime} {isAr ? "د" : "min"}
                    </div>
                  </div>
                  <CardContent className="p-3.5">
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {isAr ? article.title_ar || article.title : article.title}
                    </h3>
                    {(article.excerpt || article.excerpt_ar) && (
                      <p className="mt-1.5 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {isAr ? article.excerpt_ar || article.excerpt : article.excerpt}
                      </p>
                    )}
                    {article.published_at && (
                      <p className="mt-2 text-[10px] text-muted-foreground/60 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(article.published_at), { addSuffix: true, locale: isAr ? ar : undefined })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </HorizontalScrollRow>
      </div>
    </section>
  );
});

export default ArticlesSection;
