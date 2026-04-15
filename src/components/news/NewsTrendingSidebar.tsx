import { memo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Flame } from "lucide-react";
import type { NewsArticle } from "./NewsArticleCard";

interface Props {
  articles: NewsArticle[];
  isAr: boolean;
}

export const NewsTrendingSidebar = memo(function NewsTrendingSidebar({ articles, isAr }: Props) {
  // Top 5 by view count
  const trending = [...articles]
    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    .slice(0, 5);

  if (trending.length === 0) return null;

  return (
    <Card className="rounded-2xl border-border/40 sticky top-28">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-bold">
          <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-chart-4/10">
            <Flame className="h-4 w-4 text-chart-4" />
          </div>
          {isAr ? "الأكثر قراءة" : "Most Read"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 pb-4">
        {trending.map((article, i) => {
          const title = isAr && article.title_ar ? article.title_ar : article.title;
          return (
            <Link
              key={article.id}
              to={`/blog/${article.slug}`}
              className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-muted/50"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                  {title}
                </h4>
                <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="h-2.5 w-2.5" />
                  {(article.view_count || 0).toLocaleString()} {isAr ? "مشاهدة" : "views"}
                </span>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
});
