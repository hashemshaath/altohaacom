import { memo, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Eye, Calendar, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { CACHE } from "@/lib/queryConfig";

interface Props {
  currentArticleId: string;
  articleType: string;
  categoryId: string | null;
  tags: Array<{ id: string; name: string; name_ar: string | null }>;
  isAr: boolean;
}

const READING_HISTORY_KEY = "reading-history";

function getReadingHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(READING_HISTORY_KEY) || "[]");
  } catch { return []; }
}

function addToReadingHistory(articleId: string) {
  try {
    const history = getReadingHistory();
    const updated = [articleId, ...history.filter(id => id !== articleId)].slice(0, 50);
    localStorage.setItem(READING_HISTORY_KEY, JSON.stringify(updated));
  } catch {}
}

export const ArticleSmartRecommendations = memo(function ArticleSmartRecommendations({
  currentArticleId, articleType, categoryId, tags, isAr,
}: Props) {
  // Track current article
  useEffect(() => { addToReadingHistory(currentArticleId); }, [currentArticleId]);

  const tagIds = tags.map(t => t.id);

  const { data: candidates = [] } = useQuery({
    queryKey: ["smart-recs", currentArticleId],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("id, title, title_ar, slug, excerpt, excerpt_ar, featured_image_url, type, published_at, view_count, category_id")
        .eq("status", "published")
        .neq("id", currentArticleId)
        .order("published_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    staleTime: CACHE.medium.staleTime,
  });

  const { data: tagMap = {} } = useQuery({
    queryKey: ["smart-recs-tags", currentArticleId],
    queryFn: async () => {
      const ids = candidates.map(c => c.id);
      if (!ids.length) return {};
      const { data } = await supabase
        .from("article_tags")
        .select("article_id, tag_id")
        .in("article_id", ids);
      const map: Record<string, string[]> = {};
      (data || []).forEach(r => {
        if (!map[r.article_id]) map[r.article_id] = [];
        map[r.article_id].push(r.tag_id);
      });
      return map;
    },
    enabled: candidates.length > 0,
    staleTime: CACHE.medium.staleTime,
  });

  const readHistory = getReadingHistory();

  const scored = useMemo(() => {
    return candidates
      .filter(c => !readHistory.includes(c.id)) // exclude already read
      .map(c => {
        let score = 0;
        
        // Same type bonus
        if (c.type === articleType) score += 15;
        
        // Same category bonus
        if (categoryId && c.category_id === categoryId) score += 20;
        
        // Tag overlap — strongest signal
        const cTags = tagMap[c.id] || [];
        const sharedTags = cTags.filter(t => tagIds.includes(t)).length;
        score += sharedTags * 25;
        
        // Popularity boost
        score += Math.min((c.view_count || 0) / 50, 10);
        
        // Recency boost (last 7 days)
        const daysAgo = (Date.now() - new Date(c.published_at || "").getTime()) / (1000 * 60 * 60 * 24);
        if (daysAgo < 7) score += 10;
        else if (daysAgo < 30) score += 5;
        
        return { ...c, score, sharedTags };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [candidates, tagMap, articleType, categoryId, tagIds, readHistory]);

  if (scored.length === 0) return null;

  return (
    <div className="mt-10 pt-8 border-t border-border/30">
      <div className="flex items-center gap-2 mb-5">
        <div className="h-8 w-8 rounded-xl bg-chart-4/10 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-chart-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold">{isAr ? "مُقترحات ذكية لك" : "Smart Picks for You"}</h3>
          <p className="text-[12px] text-muted-foreground">
            {isAr ? "بناءً على اهتماماتك وسجل قراءتك" : "Based on your interests & reading history"}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {scored.map((article, idx) => {
          const t = isAr && article.title_ar ? article.title_ar : article.title;
          const e = isAr && article.excerpt_ar ? article.excerpt_ar : article.excerpt;
          const matchPct = Math.min(Math.round(article.score), 99);
          
          return (
            <Link key={article.id} to={`/blog/${article.slug}`} className="group block">
              <Card className="overflow-hidden rounded-2xl border-border/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <CardContent className="p-0 flex">
                  {article.featured_image_url ? (
                    <div className="w-28 sm:w-36 relative overflow-hidden shrink-0">
                      <img
                        src={article.featured_image_url}
                        alt={t}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute top-2 start-2">
                        <Badge className="text-[12px] rounded-lg px-1.5 py-0 h-4 bg-chart-4/90 text-white border-0">
                          {matchPct}% {isAr ? "تطابق" : "match"}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="w-28 sm:w-36 bg-gradient-to-br from-chart-4/10 to-muted flex items-center justify-center shrink-0 relative">
                      <Sparkles className="h-6 w-6 text-muted-foreground/20" />
                      <div className="absolute top-2 start-2">
                        <Badge className="text-[12px] rounded-lg px-1.5 py-0 h-4 bg-chart-4/90 text-white border-0">
                          {matchPct}%
                        </Badge>
                      </div>
                    </div>
                  )}
                  <div className="flex-1 p-3.5 sm:p-4 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors mb-1">
                        {t}
                      </h4>
                      {e && (
                        <p className="text-[12px] text-muted-foreground line-clamp-1 leading-relaxed">{e}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2.5 text-[12px] text-muted-foreground">
                      {article.published_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5" />
                          {format(new Date(article.published_at), "MMM dd", { locale: isAr ? ar : enUS })}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Eye className="h-2.5 w-2.5" />
                        {(article.view_count || 0).toLocaleString()}
                      </span>
                      {article.sharedTags > 0 && (
                        <span className="text-chart-4">
                          {article.sharedTags} {isAr ? "وسوم مشتركة" : "shared tags"}
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
    </div>
  );
});
