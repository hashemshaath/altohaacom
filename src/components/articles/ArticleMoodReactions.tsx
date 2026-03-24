import { useState, memo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  articleId: string;
  isAr: boolean;
}

const REACTIONS = [
  { emoji: "🔥", labelEn: "Fire", labelAr: "ممتاز", key: "fire" },
  { emoji: "💡", labelEn: "Insightful", labelAr: "ملهم", key: "insightful" },
  { emoji: "❤️", labelEn: "Love", labelAr: "أحببته", key: "love" },
  { emoji: "👏", labelEn: "Bravo", labelAr: "برافو", key: "bravo" },
  { emoji: "🤔", labelEn: "Hmm", labelAr: "مثير للتفكير", key: "thinking" },
  { emoji: "😮", labelEn: "Wow", labelAr: "مذهل", key: "wow" },
];

const STORAGE_KEY = "article-mood-reactions";

function getStored(articleId: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const all = JSON.parse(raw);
    return all[articleId] || {};
  } catch { return {}; }
}

function setStored(articleId: string, reactions: Record<string, boolean>) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[articleId] = reactions;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

export const ArticleMoodReactions = memo(function ArticleMoodReactions({ articleId, isAr }: Props) {
  const [selected, setSelected] = useState<Record<string, boolean>>(() => getStored(articleId));
  const [animating, setAnimating] = useState<string | null>(null);

  // Simulate counts from article ID seed
  const baseCounts = REACTIONS.reduce((acc, r) => {
    let seed = 0;
    for (let i = 0; i < articleId.length; i++) seed += articleId.charCodeAt(i);
    acc[r.key] = ((seed * (r.key.charCodeAt(0) + 1)) % 30) + 3;
    return acc;
  }, {} as Record<string, number>);

  const handleReaction = useCallback((key: string) => {
    const next = { ...selected, [key]: !selected[key] };
    setSelected(next);
    setStored(articleId, next);
    setAnimating(key);
    setTimeout(() => setAnimating(null), 600);
    
    if (!selected[key]) {
      const reaction = REACTIONS.find(r => r.key === key);
      if (reaction) {
        toast(isAr ? `${reaction.emoji} شكراً لتفاعلك!` : `${reaction.emoji} Thanks for reacting!`, {
          duration: 1500,
        });
      }
    }
  }, [selected, articleId, isAr]);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/20 p-6">
      <p className="text-sm font-semibold mb-1">
        {isAr ? "ما شعورك تجاه هذا المقال؟" : "How does this article make you feel?"}
      </p>
      <p className="text-[11px] text-muted-foreground mb-5">
        {isAr ? "اختر تفاعلك — يمكنك اختيار أكثر من واحد" : "Pick your reaction — select as many as you like"}
      </p>
      
      <div className="flex flex-wrap gap-2">
        {REACTIONS.map((r) => {
          const isActive = !!selected[r.key];
          const count = baseCounts[r.key] + (isActive ? 1 : 0);
          
          return (
            <button
              key={r.key}
              onClick={() => handleReaction(r.key)}
              className={cn(
                "group flex flex-col items-center gap-1.5 rounded-2xl border px-4 py-3 min-w-[72px] transition-all duration-200 active:scale-90 touch-manipulation",
                isActive
                  ? "border-primary/25 bg-primary/8 shadow-sm shadow-primary/10"
                  : "border-border/30 bg-card hover:border-border/50 hover:bg-muted/30"
              )}
            >
              <span
                className={cn(
                  "text-2xl transition-transform duration-300",
                  animating === r.key && "scale-150",
                  !isActive && "grayscale-[0.3] group-hover:grayscale-0"
                )}
              >
                {r.emoji}
              </span>
              <span className={cn(
                "text-[9px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {isAr ? r.labelAr : r.labelEn}
              </span>
              <span className={cn(
                "text-[9px] tabular-nums",
                isActive ? "text-primary/70" : "text-muted-foreground/50"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
