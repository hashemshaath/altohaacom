import { useIsAr } from "@/hooks/useIsAr";
import { memo, forwardRef } from "react";
import { ROUTES } from "@/config/routes";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Clock, Newspaper, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useSectionConfig } from "@/components/home/SectionKeyContext";
import { SectionHeader } from "@/components/home/SectionHeader";
import { HorizontalScrollRow } from "@/components/home/HorizontalScrollRow";
import { ImageWithFallback } from "@/components/home/ImageWithFallback";
import { CACHE } from "@/lib/queryConfig";

const TYPE_COLORS: Record<string, string> = {
  news: "bg-semantic-info-bg text-semantic-info dark:bg-semantic-info/20 dark:text-semantic-info",
  article: "bg-semantic-success-bg text-semantic-success dark:bg-semantic-success/20 dark:text-semantic-success",
  blog: "bg-semantic-warning-bg text-semantic-warning dark:bg-semantic-warning/20 dark:text-semantic-warning",
  interview: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary",
  event: "bg-semantic-error-bg text-semantic-error dark:bg-semantic-error/20 dark:text-semantic-error",
};

const TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  news: { en: "News", ar: "أخبار" },
  article: { en: "Article", ar: "مقال" },
  blog: { en: "Blog", ar: "مدونة" },
  interview: { en: "Interview", ar: "مقابلة" },
  event: { en: "Event", ar: "فعالية" },
};

function estimateReadTime(excerpt: string | null): number {
  if (!excerpt) return 2;
  return Math.max(1, Math.ceil((excerpt.trim().split(/\s+/).length * 10) / 200));
}

const ArticlesSection = memo(forwardRef<HTMLElement>(function ArticlesSection(_props, _ref) {
  const isAr = useIsAr();
  const config = useSectionConfig();

  const itemCount = config?.item_count || 8;
  const title = config
    ? (isAr ? config.title_ar || "أحدث المقالات" : config.title_en || "Latest Stories")
    : (isAr ? "أحدث المقالات" : "Latest Stories");
  const subtitle = config
    ? (isAr ? config.subtitle_ar || "" : config.subtitle_en || "")
    : (isAr ? "آخر الأخبار من عالم الطهي" : "Stay updated with culinary news");
  const showSubtitle = config?.show_subtitle ?? true;
  const showViewAll = config?.show_view_all ?? true;

  const { data: articles = [], isLoading } = useQuery({
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
    staleTime: CACHE.long.staleTime,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  if (!isLoading && articles.length === 0) return null;

  return (
    <section dir={isAr ? "rtl" : "ltr"}>
      <div className="container">
        <SectionHeader
          icon={Newspaper}
          badge={isAr ? "أخبار ومقالات" : "News & Articles"}
          title={title}
          subtitle={showSubtitle ? subtitle : undefined}
          viewAllHref={showViewAll ? "/blog" : undefined}
          isAr={isAr}
        />

        <HorizontalScrollRow isAr={isAr}>
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="snap-start shrink-0 w-[75vw] sm:w-[45vw] md:w-[32vw] lg:w-[24vw] xl:w-[20vw] animate-pulse">
                  <div className="rounded-2xl border border-border/30 bg-card overflow-hidden">
                    <Skeleton className="aspect-[16/10]" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                </div>
              ))
            : articles.map((article) => {
            const readTime = estimateReadTime(article.excerpt || article.excerpt_ar);
            const typeLabel = article.type && TYPE_LABELS[article.type];
            const typeColor = article.type && TYPE_COLORS[article.type];

            return (
              <Link
                key={article.id}
                to={ROUTES.article(article.slug)}
                className="group block snap-start shrink-0 w-[75vw] sm:w-[45vw] md:w-[32vw] lg:w-[24vw] xl:w-[20vw] touch-manipulation"
              >
                <div className="overflow-hidden rounded-2xl border border-border/30 bg-card h-full transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 active:scale-[0.98] shadow-sm">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <ImageWithFallback
                      src={article.featured_image_url}
                      alt={isAr ? article.title_ar || article.title : article.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      fallbackIcon={<Newspaper className="h-10 w-10 text-muted-foreground/20" />}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    {typeLabel && typeColor && (
                      <Badge className={cn("absolute top-2.5 start-2.5 text-xs font-bold border-0", typeColor)}>
                        {isAr ? typeLabel.ar : typeLabel.en}
                      </Badge>
                    )}
                    <div className="absolute bottom-2.5 end-2.5 flex items-center gap-1 rounded-lg bg-card/90 backdrop-blur-sm px-2 py-1 text-xs text-muted-foreground">
                      <BookOpen className="h-3 w-3" />
                      {readTime} {isAr ? "د" : "min"}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {isAr ? article.title_ar || article.title : article.title}
                    </h3>
                    {(article.excerpt || article.excerpt_ar) && (
                      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {isAr ? article.excerpt_ar || article.excerpt : article.excerpt}
                      </p>
                    )}
                    {article.published_at && (
                      <p className="mt-2 text-xs text-muted-foreground/60 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(article.published_at), { addSuffix: true, locale: isAr ? ar : undefined })}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </HorizontalScrollRow>
      </div>
    </section>
  );
}));

export default ArticlesSection;
