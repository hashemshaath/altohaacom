import { SafeImage } from "@/components/ui/SafeImage";
import { ROUTES } from "@/config/routes";
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
    <Link to={ROUTES.article(article.slug)} className="group block" role="listitem">
      <article>
        <Card className="overflow-hidden rounded-xl border-border/15 transition-all duration-200 hover:shadow-md hover:border-primary/15">
          <div className="flex gap-4 p-3.5">
            {/* Image */}
            <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-lg bg-muted hidden sm:block">
              {article.featured_image_url ? (
                <SafeImage src={article.featured_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                  <TypeIcon className="h-8 w-8 text-primary/15" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col justify-between min-w-0">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant="secondary" className="text-[0.625rem] rounded-md gap-0.5 px-1.5 py-0 h-4 bg-muted/50">
                    <TypeIcon className="h-2.5 w-2.5" />
                    {typeBadgeLabel(article.type)}
                  </Badge>
                  <span className="text-[0.625rem] text-muted-foreground/40 flex items-center gap-0.5">
                    <BookOpen className="h-2.5 w-2.5" /> {readTime} {isAr ? "د" : "min"}
                  </span>
                  {(article.view_count ?? 0) >= 100 && (
                    <Badge variant="secondary" className="text-[0.625rem] px-1.5 py-0 h-4 rounded-md gap-0.5 bg-chart-4/8 text-chart-4 border-0">
                      🔥
                    </Badge>
                  )}
                </div>
                <h3 className="text-[14px] font-semibold line-clamp-1 group-hover:text-primary transition-colors mb-1 leading-snug">{title}</h3>
                {excerpt && <p className="text-xs text-muted-foreground/50 line-clamp-2 leading-relaxed">{excerpt}</p>}
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2.5 text-[0.625rem] text-muted-foreground/40">
                  <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{formatDate(article.published_at || article.created_at)}</span>
                  <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{article.view_count}</span>
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
