import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Hash, ArrowUpRight, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { CACHE } from "@/lib/queryConfig";

/**
 * Shows related topic clusters — groups articles by tags
 * and shows other articles sharing the same tags.
 */
export const NewsRelatedTopics = memo(function NewsRelatedTopics({
  currentArticleId,
  articleTags,
  isAr,
}: {
  currentArticleId: string;
  articleTags: { id: string; name: string; name_ar: string | null; slug: string }[];
  isAr: boolean;
}) {
  // Fetch other articles that share the same tags
  const tagIds = articleTags.map(t => t.id);

  const { data: relatedByTag } = useQuery({
    queryKey: ["related-by-tags", currentArticleId, tagIds],
    queryFn: async () => {
      if (!tagIds.length) return [];
      const { data } = await supabase
        .from("article_tags")
        .select("article_id, tag_id, articles!inner(id, title, title_ar, slug, type, featured_image_url, view_count, published_at, status)")
        .in("tag_id", tagIds)
        .neq("article_id", currentArticleId)
        .limit(30);

      if (!data) return [];

      // Deduplicate and score by shared tag count
      const articleMap: Record<string, { article: any; sharedTags: string[]; score: number }> = {};
      data.forEach((row) => {
        const art = row.articles;
        if (!art || art.status !== "published") return;
        if (!articleMap[art.id]) {
          articleMap[art.id] = { article: art, sharedTags: [], score: 0 };
        }
        articleMap[art.id].sharedTags.push(row.tag_id);
        articleMap[art.id].score++;
      });

      return Object.values(articleMap)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);
    },
    enabled: tagIds.length > 0,
    staleTime: CACHE.medium.staleTime,
  });

  if (!articleTags.length || !relatedByTag?.length) return null;

  return (
    <section className="mt-10 pt-8 border-t border-border/30">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Layers className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="font-serif text-lg font-bold">{isAr ? "مواضيع ذات صلة" : "Related Topics"}</h3>
          <p className="text-xs text-muted-foreground">{isAr ? "مقالات تشترك في نفس الموضوعات" : "Articles sharing similar topics"}</p>
        </div>
      </div>

      {/* Tag pills */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {articleTags.map(tag => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="rounded-xl text-[12px] px-2.5 py-1 gap-1 cursor-default"
          >
            <Hash className="h-2.5 w-2.5" />
            {isAr && tag.name_ar ? tag.name_ar : tag.name}
          </Badge>
        ))}
      </div>

      {/* Related articles grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {relatedByTag.map(({ article, sharedTags, score }) => {
          const artTitle = isAr && article.title_ar ? article.title_ar : article.title;
          return (
            <Link
              key={article.id}
              to={`/blog/${article.slug}`}
              className="group"
            >
              <Card className="h-full overflow-hidden rounded-xl border-border/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <CardContent className="p-3.5 flex gap-3">
                  {article.featured_image_url ? (
                    <div className="h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-muted">
                      <img
                        src={article.featured_image_url}
                        alt={artTitle}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-16 shrink-0 rounded-lg bg-gradient-to-br from-primary/10 to-muted flex items-center justify-center">
                      <Hash className="h-5 w-5 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <h4 className="text-xs font-semibold line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                      {artTitle}
                    </h4>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="outline" className="text-[12px] px-1.5 py-0 h-4 rounded-md border-primary/20 text-primary gap-0.5">
                        <Layers className="h-2 w-2" />
                        {score} {isAr ? "وسم مشترك" : score === 1 ? "shared tag" : "shared tags"}
                      </Badge>
                      <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ms-auto" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
});
