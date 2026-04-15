import { useIsAr } from "@/hooks/useIsAr";
import { memo, useEffect, useState, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";

/**
 * Shows a real-time pulse of community activity — new posts appearing in real time.
 */
export const CommunityActivityPulse = memo(function CommunityActivityPulse() {
  const isAr = useIsAr();
  const [recentCount, setRecentCount] = useState(0);
  const [pulse, setPulse] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const channel = supabase
      .channel("activity-pulse")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        () => {
          setRecentCount(prev => prev + 1);
          setPulse(true);
          clearTimeout(timeout.current);
          timeout.current = setTimeout(() => setPulse(false), 2000);
        }
      )
      .subscribe();

    // Reset counter every 5 minutes
    const resetInterval = setInterval(() => setRecentCount(0), 300000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(resetInterval);
      clearTimeout(timeout.current);
    };
  }, []);

  if (recentCount === 0) return null;

  return (
    <div className={cn(
      "flex items-center gap-2 rounded-xl border border-border/30 bg-card px-3 py-2 transition-all duration-500",
      pulse && "border-primary/40 shadow-sm shadow-primary/10"
    )}>
      <div className="relative flex h-5 w-5 items-center justify-center">
        <Zap className={cn("h-3.5 w-3.5 text-chart-4 transition-transform duration-300", pulse && "scale-125")} />
        {pulse && (
          <span className="absolute inset-0 animate-ping rounded-full bg-chart-4/20" />
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        <span className="font-bold text-foreground tabular-nums">{recentCount}</span>{" "}
        {isAr ? "منشور جديد الآن" : recentCount === 1 ? "new post just now" : "new posts recently"}
      </p>
    </div>
  );
});
