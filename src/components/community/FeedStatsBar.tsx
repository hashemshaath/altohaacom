import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { TrendingUp, Users, FileText, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Compact real-time stats bar shown above the feed.
 */
export const FeedStatsBar = memo(function FeedStatsBar() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";

  const { data: stats } = useQuery({
    queryKey: ["feed-stats-bar", user?.id],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const [postsToday, activeUsers] = await Promise.all([
        supabase
          .from("posts")
          .select("id", { count: "exact", head: true })
          .gte("created_at", todayISO)
          .eq("moderation_status", "approved"),
        supabase
          .from("posts")
          .select("author_id")
          .gte("created_at", todayISO)
          .eq("moderation_status", "approved"),
      ]);

      const uniqueAuthors = new Set(activeUsers.data?.map(p => p.author_id) || []);

      return {
        postsToday: postsToday.count || 0,
        activeToday: uniqueAuthors.size,
      };
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  if (!stats || (stats.postsToday === 0 && stats.activeToday === 0)) return null;

  const items = [
    { icon: FileText, label: isAr ? "منشور اليوم" : "Posts today", value: stats.postsToday, color: "text-primary" },
    { icon: Users, label: isAr ? "نشط اليوم" : "Active today", value: stats.activeToday, color: "text-chart-3" },
  ].filter(i => i.value > 0);

  if (items.length === 0) return null;

  return (
    <div className="flex items-center gap-4 border-b border-border/30 px-4 py-2 bg-muted/10">
      <Zap className="h-3.5 w-3.5 text-chart-4 shrink-0" />
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-1.5 text-[11px]">
          <item.icon className={cn("h-3 w-3", item.color)} />
          <AnimatedCounter value={item.value} className={cn("font-bold tabular-nums", item.color)} />
          <span className="text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
});
