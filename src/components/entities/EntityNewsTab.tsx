import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Newspaper, Calendar, Eye } from "lucide-react";
import { format } from "date-fns";

interface Props {
  entityId: string;
  entityName: string;
  entityNameAr?: string | null;
}

export const EntityNewsTab = memo(function EntityNewsTab({ entityId, entityName, entityNameAr }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: articles, isLoading } = useQuery({
    queryKey: ["entity-news", entityId],
    queryFn: async () => {
      // Search for articles mentioning this entity
      const { data, error } = await supabase
        .from("articles")
        .select("id, slug, title, title_ar, excerpt, excerpt_ar, featured_image_url, published_at, view_count, type, status")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(20);
      if (error) throw error;

      // Filter articles that mention the entity name in title or content
      const filtered = (data || []).filter(article => {
        const titleMatch = article.title?.toLowerCase().includes(entityName.toLowerCase()) ||
          (entityNameAr && article.title_ar?.includes(entityNameAr));
        return titleMatch;
      });

      return filtered;
    },
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
      </div>
    );
  }

  if (!articles?.length) {
    return (
      <div className="py-12 text-center">
        <Newspaper className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">{isAr ? "لا توجد أخبار حالياً" : "No news articles yet"}</p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          {isAr ? "سيتم عرض الأخبار المتعلقة بالجهة هنا" : "Related news will appear here"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {articles.map(article => {
        const title = isAr && article.title_ar ? article.title_ar : article.title;
        const excerpt = isAr && article.excerpt_ar ? article.excerpt_ar : article.excerpt;

        return (
          <Link key={article.id} to={`/news/${article.slug}`} className="block">
            <Card className="group overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5">
              <CardContent className="flex items-start gap-4 p-4">
                {article.featured_image_url ? (
                  <img
                    src={article.featured_image_url}
                    alt={title}
                    className="h-20 w-28 shrink-0 rounded-xl object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-xl bg-primary/5">
                    <Newspaper className="h-6 w-6 text-primary/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-[10px]">
                      {article.type === "news" ? (isAr ? "أخبار" : "News") : (isAr ? "مقال" : "Article")}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">{title}</h3>
                  {excerpt && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{excerpt}</p>}
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                    {article.published_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(article.published_at), "MMM d, yyyy")}
                      </span>
                    )}
                    {article.view_count > 0 && (
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {article.view_count}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
});
