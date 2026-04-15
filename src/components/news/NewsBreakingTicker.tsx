import { memo, useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Zap, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Link } from "react-router-dom";
import { CACHE } from "@/lib/queryConfig";

interface BreakingArticle {
  id: string;
  title: string;
  title_ar: string | null;
  slug: string;
  type: string;
  published_at: string | null;
}

export const NewsBreakingTicker = memo(function NewsBreakingTicker({ isAr }: { isAr: boolean }) {
  const [dismissed, setDismissed] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: breakingArticles } = useQuery({
    queryKey: ["breaking-news-ticker"],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("id, title, title_ar, slug, type, published_at")
        .eq("status", "published")
        .eq("is_featured", true)
        .order("published_at", { ascending: false })
        .limit(5);
      return (data || []) as BreakingArticle[];
    },
    staleTime: CACHE.medium.staleTime,
  });

  const articles = breakingArticles || [];

  // Auto-rotate
  useEffect(() => {
    if (articles.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % articles.length);
    }, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [articles.length]);

  const handlePrev = useCallback(() => {
    setCurrentIdx(prev => (prev - 1 + articles.length) % articles.length);
  }, [articles.length]);

  const handleNext = useCallback(() => {
    setCurrentIdx(prev => (prev + 1) % articles.length);
  }, [articles.length]);

  if (dismissed || !articles.length) return null;

  const current = articles[currentIdx];
  const title = isAr && current.title_ar ? current.title_ar : current.title;

  return (
    <div className="relative bg-primary/5 border-b border-primary/10 overflow-hidden">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center gap-3">
          {/* Badge */}
          <Badge className="shrink-0 rounded-lg bg-primary text-primary-foreground text-[12px] px-2 py-0.5 gap-1 uppercase tracking-wider font-bold animate-pulse">
            <Zap className="h-3 w-3" />
            {isAr ? "عاجل" : "Breaking"}
          </Badge>

          {/* Navigation */}
          {articles.length > 1 && (
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={handlePrev}
                className="h-6 w-6 rounded-md hover:bg-muted/60 flex items-center justify-center transition-colors touch-manipulation"
              >
                <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-180" />
              </button>
              <span className="text-[12px] text-muted-foreground tabular-nums w-8 text-center">
                {currentIdx + 1}/{articles.length}
              </span>
              <button
                onClick={handleNext}
                className="h-6 w-6 rounded-md hover:bg-muted/60 flex items-center justify-center transition-colors touch-manipulation"
              >
                <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
              </button>
            </div>
          )}

          {/* Title */}
          <Link
            to={`/blog/${current.slug}`}
            className="flex-1 text-xs sm:text-sm font-medium truncate hover:text-primary transition-colors"
          >
            <span
              key={current.id}
              className="inline-block animate-in fade-in slide-in-from-bottom-1 duration-300"
            >
              {title}
            </span>
          </Link>

          {/* Progress dots */}
          {articles.length > 1 && (
            <div className="hidden sm:flex items-center gap-1 shrink-0">
              {articles.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIdx(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300 touch-manipulation",
                    i === currentIdx ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/20 hover:bg-muted-foreground/40"
                  )}
                />
              ))}
            </div>
          )}

          {/* Dismiss */}
          <button
            onClick={() => setDismissed(true)}
            className="h-6 w-6 rounded-md hover:bg-muted/60 flex items-center justify-center transition-colors shrink-0 touch-manipulation"
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
});
