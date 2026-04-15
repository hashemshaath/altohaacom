import { useState, useEffect, memo } from "react";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  articleId: string;
  isAr: boolean;
}

/**
 * Shows real recent readers count based on page view events
 * from the last 5 minutes in ad_user_behaviors.
 */
export const ArticleLiveReaders = memo(function ArticleLiveReaders({ articleId, isAr }: Props) {
  const [count, setCount] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let visTimer: ReturnType<typeof setTimeout>;

    async function fetchRecentReaders() {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { count: readerCount } = await supabase
        .from("ad_user_behaviors")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "page_view")
        .like("page_url", `%${articleId}%`)
        .gte("created_at", fiveMinAgo);

      if (cancelled) return;
      if (readerCount && readerCount > 0) {
        setCount(readerCount);
        visTimer = setTimeout(() => { if (!cancelled) setVisible(true); }, 1000);
      }
    }

    fetchRecentReaders();

    // Refresh every 60 seconds
    const interval = setInterval(fetchRecentReaders, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(visTimer);
    };
  }, [articleId]);

  if (count === null || count === 0) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border border-border/30 bg-card/80 backdrop-blur-sm px-3 py-1.5 transition-all duration-500",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <Users className="h-3 w-3 text-muted-foreground" />
      <span className="text-xs font-medium text-muted-foreground">
        {count} {isAr ? "يقرأون الآن" : "reading now"}
      </span>
    </div>
  );
});
