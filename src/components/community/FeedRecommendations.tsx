import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Hash, TrendingUp } from "lucide-react";

export function FeedRecommendations() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["feed-recommendations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("recommend-feed");
      if (error) throw error;
      return data as {
        suggestions: { theme: string; hashtag: string }[];
        user_interests: string[];
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 30, // 30 min cache
    retry: 1,
  });

  if (!user) return null;

  return (
    <div className="border-b border-border px-4 py-3">
      <div className="flex items-center gap-2 mb-2.5">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {isAr ? "مقترحات لك" : "For You"}
        </h3>
      </div>

      {isLoading ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full shrink-0" />
          ))}
        </div>
      ) : data?.suggestions?.length ? (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {data.suggestions.map((s, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="shrink-0 gap-1.5 cursor-pointer hover:bg-primary/10 transition-colors text-xs py-1.5 px-3 rounded-full"
            >
              <Hash className="h-3 w-3 text-primary" />
              {s.hashtag}
            </Badge>
          ))}
        </div>
      ) : data?.user_interests?.length ? (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {data.user_interests.map((tag, i) => (
            <Badge
              key={i}
              variant="outline"
              className="shrink-0 gap-1 text-xs py-1 px-2.5 rounded-full"
            >
              <TrendingUp className="h-3 w-3" />
              #{tag}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
