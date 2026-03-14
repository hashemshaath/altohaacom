import { memo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Eye, BookOpen, Newspaper, TrendingUp, Award } from "lucide-react";
import { ShareButton } from "@/components/ui/share-button";

const TYPE_ICONS: Record<string, React.ElementType> = {
  news: Newspaper,
  blog: TrendingUp,
  exhibition: Award,
  article: Newspaper,
  interview: TrendingUp,
};

export interface NewsArticle {
  id: string;
  title: string;
  title_ar: string | null;
  slug: string;
  excerpt: string | null;
  excerpt_ar: string | null;
  type: string;
  featured_image_url: string | null;
  is_featured: boolean;
  view_count: number;
  published_at: string | null;
  created_at: string;
  category_id: string | null;
  author_id: string | null;
  event_start: string | null;
  event_end: string | null;
  event_location: string | null;
  event_location_ar: string | null;
}

function estimateReadTime(excerpt: string | null): number {
  if (!excerpt) return 3;
  return Math.max(1, Math.ceil((excerpt.trim().split(/\s+/).length * 10) / 200));
}

interface Props {
  article: NewsArticle;
  isAr: boolean;
  formatDate: (d: string) => string;
  typeBadgeLabel: (t: string) => string;
  compact?: boolean;
}

export const NewsArticleCard = memo(function NewsArticleCard({ article, isAr, formatDate, typeBadgeLabel, compact }: Props) {
  const title = isAr && article.title_ar ? article.title_ar : article.title;
  const excerpt = isAr && article.excerpt_ar ? article.excerpt_ar : article.excerpt;
  const TypeIcon = TYPE_ICONS[article.type] || Newspaper;
  const readTime = estimateReadTime(excerpt);

  if (compact) {
    return (
      <Link to={`/news/${article.slug}`} className="group block" role="listitem">
        <article>
          <Card className="h-full overflow-hidden rounded-2xl border-border/40 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/20">
            <div className="flex gap-3 p-3">
              <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-muted">
                {article.featured_image_url ? (
                  <img src={article.featured_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <TypeIcon className="h-6 w-6 text-primary/20" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Badge variant="secondary" className="text-[8px] rounded-md gap-1 px-1.5 py-0">
                      <TypeIcon className="h-2 w-2" />
                      {typeBadgeLabel(article.type)}
                    </Badge>
                    <span className="text-[9px] text-muted-foreground/60 flex items-center gap-0.5">
                      <BookOpen className="h-2 w-2" /> {readTime} {isAr ? "د" : "m"}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">{title}</h3>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" />{formatDate(article.published_at || article.created_at)}</span>
                  <span className="flex items-center gap-1"><Eye className="h-2.5 w-2.5" />{article.view_count}</span>
                </div>
              </div>
            </div>
          </Card>
        </article>
      </Link>
    );
  }

  return (
    <Link to={`/news/${article.slug}`} className="group block" role="listitem">
      <article>
        <Card className="h-full overflow-hidden rounded-2xl border-border/40 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20 flex flex-col">
          <div className="relative aspect-video overflow-hidden bg-muted">
            {article.featured_image_url ? (
              <img src={article.featured_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                <TypeIcon className="h-10 w-10 text-primary/20" />
              </div>
            )}
            <Badge className="absolute start-3 top-3 gap-1 text-[10px] rounded-xl" variant="secondary">
              <TypeIcon className="h-2.5 w-2.5" />
              {typeBadgeLabel(article.type)}
            </Badge>
            <div className="absolute bottom-3 end-3 flex items-center gap-1 rounded-lg bg-background/80 backdrop-blur-sm px-2 py-0.5 text-[10px] text-muted-foreground">
              <BookOpen className="h-2.5 w-2.5" />
              {readTime} {isAr ? "د" : "min"}
            </div>
          </div>
          <CardContent className="flex flex-1 flex-col p-5">
            <h3 className="mb-2 text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">{title}</h3>
            {excerpt && <p className="mb-3 flex-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">{excerpt}</p>}
            {article.type === "exhibition" && article.event_start && (
              <div className="mb-3 rounded-xl bg-muted/50 p-2.5 text-xs">
                <p className="font-medium">
                  {formatDate(article.event_start)}
                  {article.event_end && ` – ${formatDate(article.event_end)}`}
                </p>
                {article.event_location && (
                  <p className="text-muted-foreground">{isAr && article.event_location_ar ? article.event_location_ar : article.event_location}</p>
                )}
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border/40 pt-3 text-[11px] text-muted-foreground mt-auto">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(article.published_at || article.created_at)}</span>
              <div className="flex items-center gap-2.5">
                {(article.view_count ?? 0) >= 100 && (
                  <Badge variant="secondary" className="text-[8px] px-1.5 py-0 h-4 rounded-lg gap-0.5 bg-chart-4/10 text-chart-4 border-0">
                    🔥 {isAr ? "رائج" : "Trending"}
                  </Badge>
                )}
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{article.view_count}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </article>
    </Link>
  );
});
