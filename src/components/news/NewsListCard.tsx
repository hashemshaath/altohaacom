import { memo } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Eye, BookOpen, Newspaper, TrendingUp, Award } from "lucide-react";
import { ShareButton } from "@/components/ui/share-button";
import type { NewsArticle } from "./NewsArticleCard";

const TYPE_ICONS: Record<string, React.ElementType> = {
  news: Newspaper,
  blog: TrendingUp,
  exhibition: Award,
  article: Newspaper,
  interview: TrendingUp,
};

function estimateReadTime(excerpt: string | null): number {
  if (!excerpt) return 3;
  return Math.max(1, Math.ceil((excerpt.trim().split(/\s+/).length * 10) / 200));
}

interface Props {
  article: NewsArticle;
  isAr: boolean;
  formatDate: (d: string) => string;
  typeBadgeLabel: (t: string) => string;
}

export const NewsListCard = memo(function NewsListCard({ article, isAr, formatDate, typeBadgeLabel }: Props) {
  const title = isAr && article.title_ar ? article.title_ar : article.title;
  const excerpt = isAr && article.excerpt_ar ? article.excerpt_ar : article.excerpt;
  const TypeIcon = TYPE_ICONS[article.type] || Newspaper;
  const readTime = estimateReadTime(excerpt);

  return (
    <Link to={`/news/${article.slug}`} className="group block" role="listitem">
      <article>
        <Card className="overflow-hidden rounded-2xl border-border/40 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/20">
          <div className="flex gap-4 p-4">
            {/* Image */}
            <div className="relative h-28 w-44 shrink-0 overflow-hidden rounded-xl bg-muted hidden sm:block">
              {article.featured_image_url ? (
                <img src={article.featured_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                  <TypeIcon className="h-8 w-8 text-primary/20" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col justify-between min-w-0">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-[9px] rounded-md gap-1 px-1.5 py-0">
                    <TypeIcon className="h-2.5 w-2.5" />
                    {typeBadgeLabel(article.type)}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5">
                    <BookOpen className="h-2.5 w-2.5" /> {readTime} {isAr ? "د" : "min"}
                  </span>
                  {(article.view_count ?? 0) >= 100 && (
                    <Badge variant="secondary" className="text-[8px] px-1.5 py-0 h-4 rounded-lg gap-0.5 bg-chart-4/10 text-chart-4 border-0">
                      🔥 {isAr ? "رائج" : "Trending"}
                    </Badge>
                  )}
                </div>
                <h3 className="text-sm font-semibold line-clamp-1 group-hover:text-primary transition-colors mb-1">{title}</h3>
                {excerpt && <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{excerpt}</p>}
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" />{formatDate(article.published_at || article.created_at)}</span>
                  <span className="flex items-center gap-1"><Eye className="h-2.5 w-2.5" />{article.view_count}</span>
                </div>
                <ShareButton title={title} url={`/news/${article.slug}`} isAr={isAr} />
              </div>
            </div>
          </div>
        </Card>
      </article>
    </Link>
  );
});
