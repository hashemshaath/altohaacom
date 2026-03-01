import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Trophy, Users, FileText, Flame } from "lucide-react";

/**
 * Shows trending/popular items when search is empty.
 * Displays top competitions, popular members, and recent articles.
 */
export function TrendingSearches({ onSelect }: { onSelect?: (term: string) => void }) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["trending-searches"],
    queryFn: async () => {
      const [comps, members, articles] = await Promise.all([
        supabase
          .from("competitions")
          .select("id, title, title_ar, status")
          .in("status", ["registration_open", "upcoming"])
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("profiles")
          .select("user_id, full_name, full_name_ar, username, avatar_url")
          .eq("account_status", "active")
          .eq("is_verified", true)
          .order("view_count", { ascending: false })
          .limit(3),
        supabase
          .from("articles")
          .select("id, title, title_ar, slug, type")
          .eq("status", "published")
          .order("view_count", { ascending: false })
          .limit(3),
      ]);
      return {
        competitions: comps.data || [],
        members: members.data || [],
        articles: articles.data || [],
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  if (!data) return null;

  const hasData = data.competitions.length > 0 || data.members.length > 0 || data.articles.length > 0;
  if (!hasData) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-2">
        <Flame className="h-3.5 w-3.5 text-chart-1" />
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          {isAr ? "رائج الآن" : "Trending Now"}
        </p>
      </div>

      {data.competitions.length > 0 && (
        <div className="space-y-0.5">
          {data.competitions.map((c: any) => (
            <Link
              key={c.id}
              to={`/competitions/${c.id}`}
              onClick={() => onSelect?.(isAr && c.title_ar ? c.title_ar : c.title)}
              className="flex items-center gap-3 rounded-md p-2 hover:bg-accent transition-colors"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
                <Trophy className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm truncate flex-1">
                {isAr && c.title_ar ? c.title_ar : c.title}
              </span>
              <Badge variant="outline" className="text-[10px] capitalize shrink-0">
                {c.status}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {data.members.length > 0 && (
        <div className="space-y-0.5">
          {data.members.map((m: any) => (
            <Link
              key={m.user_id}
              to={`/${m.username || m.user_id}`}
              onClick={() => onSelect?.(m.full_name || m.username || "")}
              className="flex items-center gap-3 rounded-md p-2 hover:bg-accent transition-colors"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-chart-4/10">
                <Users className="h-3.5 w-3.5 text-chart-4" />
              </div>
              <span className="text-sm truncate flex-1">
                {isAr && m.full_name_ar ? m.full_name_ar : m.full_name || m.username}
              </span>
              <TrendingUp className="h-3 w-3 text-muted-foreground shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {data.articles.length > 0 && (
        <div className="space-y-0.5">
          {data.articles.map((a: any) => (
            <Link
              key={a.id}
              to={`/news/${a.slug}`}
              onClick={() => onSelect?.(isAr && a.title_ar ? a.title_ar : a.title)}
              className="flex items-center gap-3 rounded-md p-2 hover:bg-accent transition-colors"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-chart-5/10">
                <FileText className="h-3.5 w-3.5 text-chart-5" />
              </div>
              <span className="text-sm truncate flex-1">
                {isAr && a.title_ar ? a.title_ar : a.title}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
