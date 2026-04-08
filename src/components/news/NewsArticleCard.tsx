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
      <Link to={`/blog/${article.slug}`} className="group block" role="listitem">
        <article>
          <Card className="h-full overflow-hidden rounded-xl border-border/20 transition-all duration-200 hover:shadow-md hover:border-primary/15">
            <div className="flex gap-3 p-3">
              <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
                {article.featured_image_url ? (
                  <img src={article.featured_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" decoding="async" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <TypeIcon className="h-6 w-6 text-primary/15" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Badge variant="secondary" className="text-[10px] rounded-md gap-0.5 px-1.5 py-0 h-4 bg-muted/60">
                      <TypeIcon className="h-2 w-2" />
                      {typeBadgeLabel(article.type)}
                    </Badge>
                  </div>
                  <h3 className="text-[13px] font-semibold line-clamp-2 group-hover:text-primary transition-colors leading-snug">{title}</h3>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 mt-1">
                  <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{formatDate(article.published_at || article.created_at)}</span>
                  <span>·</span>
                  <span className="flex items-center gap-0.5"><BookOpen className="h-2.5 w-2.5" />{readTime}{isAr ? "د" : "m"}</span>
                </div>
              </div>
            </div>
          </Card>
        </article>
      </Link>
    );
  }

  return (
    <Link to={`/blog/${article.slug}`} className="group block" role="listitem">
      <article>
        <Card className="h-full overflow-hidden rounded-xl border-border/15 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/15 flex flex-col">
          <div className="relative aspect-[16/10] overflow-hidden bg-muted">
            {article.featured_image_url ? (
              <img src={article.featured_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" decoding="async" />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                <TypeIcon className="h-10 w-10 text-primary/15" />
              </div>
            )}
            {/* Subtle bottom gradient for text readability */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent" />
            <Badge className="absolute start-3 top-3 gap-1 text-[10px] rounded-lg bg-white/15 backdrop-blur-md border-white/10 text-white font-semibold">
              <TypeIcon className="h-2.5 w-2.5" />
              {typeBadgeLabel(article.type)}
            </Badge>
            <div className="absolute top-3 end-3 flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 rounded-md bg-white/10 backdrop-blur-md px-1.5 py-0.5 text-[10px] text-white/80">
                <BookOpen className="h-2.5 w-2.5" />
                {readTime} {isAr ? "د" : "min"}
              </div>
              <ShareButton title={title} url={`/news/${article.slug}`} isAr={isAr} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <CardContent className="flex flex-1 flex-col p-4">
            <h3 className="mb-1.5 text-[14px] font-semibold line-clamp-2 group-hover:text-primary transition-colors leading-snug">{title}</h3>
            {excerpt && <p className="mb-2 flex-1 text-[12px] text-muted-foreground/60 line-clamp-2 leading-relaxed">{excerpt}</p>}
            {article.type === "exhibition" && article.event_start && (
              <div className="mb-2 rounded-lg bg-muted/30 p-2 text-[11px]">
                <p className="font-medium">
                  {formatDate(article.event_start)}
                  {article.event_end && ` – ${formatDate(article.event_end)}`}
                </p>
                {article.event_location && (
                  <p className="text-muted-foreground/60">{isAr && article.event_location_ar ? article.event_location_ar : article.event_location}</p>
                )}
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border/10 pt-2.5 text-[11px] text-muted-foreground/50 mt-auto">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(article.published_at || article.created_at)}</span>
              <div className="flex items-center gap-2">
                {(article.view_count ?? 0) >= 100 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 rounded-md gap-0.5 bg-chart-4/8 text-chart-4 border-0">
                    🔥 {isAr ? "رائج" : "Hot"}
                  </Badge>
                )}
                <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" />{article.view_count}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </article>
    </Link>
  );
});
