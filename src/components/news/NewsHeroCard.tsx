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
      <Card className="h-full overflow-hidden rounded-2xl border-0 transition-all duration-300 hover:shadow-2xl relative">
        <div className="relative aspect-[16/10] overflow-hidden">
          {article.featured_image_url ? (
            <img
              src={article.featured_image_url}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              loading="eager"
              fetchPriority="high"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/15 to-primary/5">
              <TypeIcon className="h-16 w-16 text-primary/20" />
            </div>
          )}
          {/* Cinematic overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/5" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />

          {/* Top badges */}
          <div className="absolute start-4 top-4 flex items-center gap-2">
            <Badge className="gap-1.5 text-[11px] rounded-lg bg-white/15 backdrop-blur-md border-white/10 text-white font-semibold">
              <TypeIcon className="h-3 w-3" />
              {typeBadgeLabel(article.type)}
            </Badge>
            {(article.view_count ?? 0) >= 100 && (
              <Badge className="text-[11px] px-2 py-0.5 rounded-lg gap-1 bg-orange-500/20 backdrop-blur-md text-orange-200 border-orange-500/20 font-semibold">
                🔥 {isAr ? "رائج" : "Trending"}
              </Badge>
            )}
          </div>
          <div className="absolute top-4 end-4 flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-white/10 backdrop-blur-md px-2 py-1 text-[11px] text-white/80">
              <BookOpen className="h-2.5 w-2.5" />
              {readTime} {isAr ? "د" : "min"}
            </div>
            <ShareButton title={title} url={`/news/${article.slug}`} isAr={isAr} />
          </div>

          {/* Bottom content */}
          <div className="absolute bottom-0 inset-x-0 p-5 md:p-6">
            <h3 className="text-xl md:text-2xl font-bold line-clamp-2 mb-2 text-white group-hover:text-white/90 transition-colors leading-tight">{title}</h3>
            {excerpt && <p className="text-sm text-white/60 line-clamp-2 mb-3 leading-relaxed">{excerpt}</p>}
            <div className="flex items-center gap-4 text-[12px] text-white/50">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(article.published_at || article.created_at)}</span>
              <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{article.view_count}</span>
              <span className="ms-auto flex items-center gap-1 text-white/70 font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 rtl:-translate-x-2 rtl:group-hover:-translate-x-0">
                {isAr ? "اقرأ المزيد" : "Read more"}
                <ArrowRight className="h-3 w-3 rtl:rotate-180" />
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
});
