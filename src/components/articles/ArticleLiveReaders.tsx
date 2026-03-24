import { useState, useEffect, memo } from "react";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  articleId: string;
  isAr: boolean;
}

/**
 * Social proof widget showing simulated "live readers" count.
 * Uses a deterministic seed from articleId + time window for consistency.
 */
export const ArticleLiveReaders = memo(function ArticleLiveReaders({ articleId, isAr }: Props) {
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Seed from article ID for consistency
    let seed = 0;
    for (let i = 0; i < articleId.length; i++) seed += articleId.charCodeAt(i);
    
    const base = (seed % 8) + 2; // 2–9 base readers
    const hourVariance = new Date().getHours() % 4;
    const initial = base + hourVariance;
    
    setCount(initial);
    // Show after a brief delay for natural feel
    const showTimer = setTimeout(() => setVisible(true), 2000);

    // Simulate fluctuation every 15-30s
    const interval = setInterval(() => {
      setCount(prev => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        return Math.max(1, Math.min(prev + delta, initial + 5));
      });
    }, 15000 + Math.random() * 15000);

    return () => {
      clearTimeout(showTimer);
      clearInterval(interval);
    };
  }, [articleId]);

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
      <span className="text-[11px] font-medium text-muted-foreground">
        {count} {isAr ? "يقرأون الآن" : "reading now"}
      </span>
    </div>
  );
});
