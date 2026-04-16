import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Eye, Newspaper, Star } from "lucide-react";
import { format, subDays, isAfter } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { NewsArticle } from "./NewsArticleCard";
import { cn } from "@/lib/utils";

/**
 * Weekly digest widget showing top articles from the past 7 days
 * with curated picks and engagement stats.
 */
export const NewsWeeklyDigest = memo(function NewsWeeklyDigest({
  articles,
  isAr,
}: {
  articles: NewsArticle[];
  isAr: boolean;
}) {
  const weekAgo = subDays(new Date(), 7);

  const digest = useMemo(() => {
    // Articles from last 7 days
    const recent = articles.filter(a => {
      const date = new Date(a.published_at || a.created_at);
      return isAfter(date, weekAgo);
    });

    // Top by views
    const topViewed = [...recent].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 3);

    // Stats
    const totalArticles = recent.length;
    const totalViews = recent.reduce((s, a) => s + (a.view_count || 0), 0);
    const types = new Set(recent.map(a => a.type));

    // Editor's pick (featured + highest views)
    const editorPick = recent.find(a => a.is_featured) || topViewed[0];

    return { topViewed, totalArticles, totalViews, typeCount: types.size, editorPick };
  }, [articles, weekAgo]);

  if (digest.totalArticles === 0) return null;

  const weekLabel = isAr
    ? `${format(weekAgo, "d MMM", { locale: ar })} — ${format(new Date(), "d MMM", { locale: ar })}`
    : `${format(weekAgo, "MMM d", { locale: enUS })} — ${format(new Date(), "MMM d", { locale: enUS })}`;

  return (
    <Card className="rounded-2xl border-border/40 overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b border-border/20 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Newspaper className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold">{isAr ? "ملخص الأسبوع" : "Weekly Digest"}</h3>
        </div>
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <Calendar className="h-2.5 w-2.5" />
          {weekLabel}
        </p>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center rounded-lg bg-muted/30 py-2">
            <p className="text-sm font-bold tabular-nums">{digest.totalArticles}</p>
            <p className="text-xs text-muted-foreground uppercase">{isAr ? "مقالات" : "Articles"}</p>
          </div>
          <div className="text-center rounded-lg bg-muted/30 py-2">
            <p className="text-sm font-bold tabular-nums">{digest.totalViews.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground uppercase">{isAr ? "مشاهدات" : "Views"}</p>
          </div>
          <div className="text-center rounded-lg bg-muted/30 py-2">
            <p className="text-sm font-bold tabular-nums">{digest.typeCount}</p>
            <p className="text-xs text-muted-foreground uppercase">{isAr ? "أنواع" : "Types"}</p>
          </div>
        </div>

        {/* Editor's Pick */}
        {digest.editorPick && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Star className="h-3 w-3 text-chart-4" />
              <span className="text-xs font-bold uppercase tracking-wider text-chart-4">
                {isAr ? "اختيار المحرر" : "Editor's Pick"}
              </span>
            </div>
            <Link to={`/blog/${digest.editorPick.slug}`} className="group block">
              <div className="rounded-xl border border-border/30 p-2.5 hover:bg-muted/30 transition-colors">
                <div className="flex gap-2.5">
                  {digest.editorPick.featured_image_url && (
                    <div className="h-14 w-14 rounded-lg overflow-hidden shrink-0 bg-muted">
                      <img
                        src={digest.editorPick.featured_image_url}
                        alt={digest.editorPick.title || "Editor's pick"}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                      {isAr && digest.editorPick.title_ar ? digest.editorPick.title_ar : digest.editorPick.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-0.5"><Eye className="h-2 w-2" />{digest.editorPick.view_count}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Top viewed */}
        {digest.topViewed.length > 1 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {isAr ? "الأكثر قراءة هذا الأسبوع" : "Most Read This Week"}
            </p>
            <div className="space-y-1.5">
              {digest.topViewed.slice(0, 3).map((article, i) => {
                const artTitle = isAr && article.title_ar ? article.title_ar : article.title;
                return (
                  <Link
                    key={article.id}
                    to={`/blog/${article.slug}`}
                    className="group flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-muted/40 transition-colors"
                  >
                    <span className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-xs font-black",
                      i === 0 ? "bg-primary/10 text-primary" : "bg-muted/60 text-muted-foreground"
                    )}>
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors flex-1">
                      {artTitle}
                    </span>
                    <span className="text-sm text-muted-foreground tabular-nums shrink-0">
                      {(article.view_count || 0).toLocaleString()}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
