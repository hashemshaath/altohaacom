import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Newspaper } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useSectionConfig } from "@/components/home/SectionKeyContext";
import { SectionHeader } from "@/components/home/SectionHeader";
import { HorizontalScrollRow } from "@/components/home/HorizontalScrollRow";

const TYPE_MAP: Record<string, { en: string; ar: string }> = {
  news: { en: "News", ar: "أخبار" },
  article: { en: "Article", ar: "مقال" },
  blog: { en: "Blog", ar: "مدونة" },
  interview: { en: "Interview", ar: "مقابلة" },
  event: { en: "Event", ar: "فعالية" },
};

export default function ArticlesSection() {
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
          {articles.map((article: any) => (
            <Link
              key={article.id}
              to={`/articles/${article.slug}`}
              className="group block snap-start shrink-0 w-[72vw] sm:w-[45vw] md:w-[32vw] lg:w-[24vw] xl:w-[20vw] touch-manipulation"
            >
              <Card className="overflow-hidden border-border/30 h-full transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 rounded-2xl active:scale-[0.98]">
                <div className="relative aspect-[16/10] overflow-hidden">
                  {article.featured_image_url ? (
                    <img src={article.featured_image_url} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="h-full w-full bg-muted flex items-center justify-center">
                      <Newspaper className="h-8 w-8 text-muted-foreground/20" />
                    </div>
                  )}
                  {article.type && TYPE_MAP[article.type] && (
                    <Badge variant="secondary" className="absolute top-2 start-2 text-[9px]">
                      {isAr ? TYPE_MAP[article.type].ar : TYPE_MAP[article.type].en}
                    </Badge>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                    {isAr ? article.title_ar || article.title : article.title}
                  </h3>
                  {(article.excerpt || article.excerpt_ar) && (
                    <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
                      {isAr ? article.excerpt_ar || article.excerpt : article.excerpt}
                    </p>
                  )}
                  {article.published_at && (
                    <p className="mt-1.5 text-[10px] text-muted-foreground/60 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(article.published_at), { addSuffix: true, locale: isAr ? ar : undefined })}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </HorizontalScrollRow>
      </div>
    </section>
  );
}
