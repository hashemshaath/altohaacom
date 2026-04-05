import { memo } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Eye, ArrowRight, BookOpen, Newspaper, TrendingUp, Award } from "lucide-react";
import { ShareButton } from "@/components/ui/share-button";

const TYPE_ICONS: Record<string, React.ElementType> = {
  news: Newspaper,
  blog: TrendingUp,
  exhibition: Award,
  article: Newspaper,
  interview: TrendingUp,
};

interface Article {
  id: string;
  title: string;
  title_ar: string | null;
  slug: string;
  excerpt: string | null;
  excerpt_ar: string | null;
  type: string;
  featured_image_url: string | null;
  view_count: number;
  published_at: string | null;
  created_at: string;
}

interface Props {
  article: Article;
  isAr: boolean;
  formatDate: (d: string) => string;
  typeBadgeLabel: (t: string) => string;
}

function estimateReadTime(excerpt: string | null): number {
  if (!excerpt) return 3;
  return Math.max(1, Math.ceil((excerpt.trim().split(/\s+/).length * 10) / 200));
}

export const NewsHeroCard = memo(function NewsHeroCard({ article, isAr, formatDate, typeBadgeLabel }: Props) {
  const title = isAr && article.title_ar ? article.title_ar : article.title;
  const excerpt = isAr && article.excerpt_ar ? article.excerpt_ar : article.excerpt;
  const TypeIcon = TYPE_ICONS[article.type] || Newspaper;
  const readTime = estimateReadTime(excerpt);

  return (
    <Link to={`/blog/${article.slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden rounded-2xl border-border/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/20 relative">
        <div className="relative aspect-[16/10] overflow-hidden">
          {article.featured_image_url ? (
            <img src={article.featured_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="eager" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/15 to-primary/5">
              <TypeIcon className="h-16 w-16 text-primary/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
          <Badge className="absolute start-4 top-4 gap-1.5 text-[10px] rounded-xl" variant="secondary">
            <TypeIcon className="h-3 w-3" />
            {typeBadgeLabel(article.type)}
          </Badge>
          <div className="absolute top-4 end-4 flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-background/80 backdrop-blur-sm px-2 py-1 text-[10px] text-muted-foreground">
              <BookOpen className="h-2.5 w-2.5" />
              {readTime} {isAr ? "د" : "min"}
            </div>
            <ShareButton title={title} url={`/news/${article.slug}`} isAr={isAr} />
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 p-5 md:p-6">
          {(article.view_count ?? 0) >= 100 && (
            <Badge variant="secondary" className="text-[9px] px-2 py-0.5 rounded-lg gap-1 bg-chart-4/10 text-chart-4 border-0 mb-2">
              🔥 {isAr ? "رائج" : "Trending"}
            </Badge>
          )}
          <h3 className="text-xl md:text-2xl font-bold line-clamp-2 mb-2 group-hover:text-primary transition-colors">{title}</h3>
          {excerpt && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{excerpt}</p>}
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(article.published_at || article.created_at)}</span>
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{article.view_count}</span>
            <span className="ms-auto flex items-center gap-1 text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              {isAr ? "اقرأ المزيد" : "Read more"}
              <ArrowRight className="h-3 w-3 rtl:rotate-180" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
});
