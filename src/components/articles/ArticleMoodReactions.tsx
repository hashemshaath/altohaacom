import { useState, useEffect, memo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

function getSessionId(): string {
  let sid = sessionStorage.getItem("reaction_session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("reaction_session_id", sid);
  }
  return sid;
}

export const ArticleMoodReactions = memo(function ArticleMoodReactions({ articleId, isAr }: Props) {
  const { user } = useAuth();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [animating, setAnimating] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch real reaction counts and user's own reactions from DB
  useEffect(() => {
    async function fetchReactions() {
      try {
        // Get all reaction counts for this article
        const { data: allReactions } = await supabase
          .from("article_reactions")
          .select("reaction_type")
          .eq("article_id", articleId);

        const reactionCounts: Record<string, number> = {};
        REACTIONS.forEach(r => { reactionCounts[r.key] = 0; });
        (allReactions || []).forEach((r: any) => {
          reactionCounts[r.reaction_type] = (reactionCounts[r.reaction_type] || 0) + 1;
        });
        setCounts(reactionCounts);

        // Get user's own reactions
        const sessionId = getSessionId();
        const userFilter = user?.id
          ? { column: "user_id", value: user.id }
          : { column: "session_id", value: sessionId };

        let userQuery = supabase
          .from("article_reactions")
          .select("reaction_type")
          .eq("article_id", articleId);
        
        if (user?.id) {
          userQuery = userQuery.eq("user_id", user.id);
        } else {
          userQuery = userQuery.eq("session_id", sessionId).is("user_id", null);
        }
        
        const { data: userReactions } = await userQuery;

        const userSelected: Record<string, boolean> = {};
        (userReactions || []).forEach((r: any) => {
          userSelected[r.reaction_type] = true;
        });
        setSelected(userSelected);
      } catch (err) {
        console.error("Failed to fetch reactions:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReactions();
  }, [articleId, user?.id]);

  const handleReaction = useCallback(async (key: string) => {
    const isActive = !!selected[key];
    const sessionId = getSessionId();

    // Optimistic update
    setSelected(prev => ({ ...prev, [key]: !isActive }));
    setCounts(prev => ({ ...prev, [key]: Math.max(0, (prev[key] || 0) + (isActive ? -1 : 1)) }));
    setAnimating(key);
    setTimeout(() => setAnimating(null), 600);

    try {
      if (isActive) {
        // Remove reaction
        const query = supabase
          .from("article_reactions")
          .delete()
          .eq("article_id", articleId)
          .eq("reaction_type", key);

        if (user?.id) {
          await query.eq("user_id", user.id);
        } else {
          await query.eq("session_id", sessionId).is("user_id", null);
        }
      } else {
        // Add reaction
        await supabase.from("article_reactions").insert({
          article_id: articleId,
          reaction_type: key,
          user_id: user?.id || null,
          session_id: user?.id ? null : sessionId,
        });

        const reaction = REACTIONS.find(r => r.key === key);
        if (reaction) {
          toast(isAr ? `${reaction.emoji} شكراً لتفاعلك!` : `${reaction.emoji} Thanks for reacting!`, {
            duration: 1500,
          });
        }
      }
    } catch (err) {
      // Revert on error
      setSelected(prev => ({ ...prev, [key]: isActive }));
      setCounts(prev => ({ ...prev, [key]: Math.max(0, (prev[key] || 0) + (isActive ? 1 : -1)) }));
    }
  }, [selected, articleId, isAr, user?.id]);

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
          const count = counts[r.key] || 0;
          
          return (
            <button
              key={r.key}
              onClick={() => handleReaction(r.key)}
              disabled={loading}
              className={cn(
                "group flex flex-col items-center gap-1.5 rounded-2xl border px-4 py-3 min-w-[72px] transition-all duration-200 active:scale-90 touch-manipulation",
                isActive
                  ? "border-primary/25 bg-primary/8 shadow-sm shadow-primary/10"
                  : "border-border/30 bg-card hover:border-border/50 hover:bg-muted/30",
                loading && "opacity-50"
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
              {count > 0 && (
                <span className={cn(
                  "text-[9px] tabular-nums",
                  isActive ? "text-primary/70" : "text-muted-foreground/50"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});
