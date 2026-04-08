import { useState, useEffect, memo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { SmilePlus } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

const REACTIONS = [
  { type: "fire", emoji: "🔥", label: "Fire", labelAr: "نار" },
  { type: "chef_kiss", emoji: "👨‍🍳", label: "Chef Kiss", labelAr: "قبلة الشيف" },
  { type: "star", emoji: "⭐", label: "Star", labelAr: "نجمة" },
  { type: "love", emoji: "❤️", label: "Love", labelAr: "حب" },
  { type: "bravo", emoji: "👏", label: "Bravo", labelAr: "برافو" },
] as const;

interface PostReactionsProps {
  postId: string;
  initialReactions?: Array<{ type: string; count: number; hasReacted: boolean }>;
}

interface ReactionCount {
  type: string;
  count: number;
  hasReacted: boolean;
}

export const PostReactions = memo(function PostReactions({ postId, initialReactions }: PostReactionsProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [reactions, setReactions] = useState<ReactionCount[]>(initialReactions || []);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  // Only fetch if no initialReactions provided (fallback for standalone usage)
  useEffect(() => {
    if (initialReactions) return;
    let cancelled = false;
    const fetchReactions = async () => {
      const { data: allReactions } = await supabase
        .from("post_reactions")
        .select("reaction_type, user_id")
        .eq("post_id", postId);

      if (cancelled || !allReactions) return;

      const counts = new Map<string, { count: number; hasReacted: boolean }>();
      allReactions.forEach((r) => {
        const existing = counts.get(r.reaction_type) || { count: 0, hasReacted: false };
        existing.count++;
        if (user && r.user_id === user.id) existing.hasReacted = true;
        counts.set(r.reaction_type, existing);
      });

      setReactions(
        REACTIONS.filter((r) => counts.has(r.type)).map((r) => ({
          type: r.type,
          count: counts.get(r.type)!.count,
          hasReacted: counts.get(r.type)!.hasReacted,
        }))
      );
    };
    fetchReactions();
    return () => { cancelled = true; };
  }, [postId, user?.id, initialReactions]);

  const toggleReaction = useCallback(async (type: string) => {
    if (!user || pending) return;
    setPending(true);

    const existing = reactions.find((r) => r.type === type);

    // Optimistic update
    if (existing?.hasReacted) {
      setReactions(prev =>
        prev.map(r => r.type === type ? { ...r, count: r.count - 1, hasReacted: false } : r)
          .filter(r => r.count > 0)
      );
    } else if (existing) {
      setReactions(prev =>
        prev.map(r => r.type === type ? { ...r, count: r.count + 1, hasReacted: true } : r)
      );
    } else {
      setReactions(prev => [...prev, { type, count: 1, hasReacted: true }]);
    }

    try {
      if (existing?.hasReacted) {
        await supabase.from("post_reactions").delete()
          .eq("post_id", postId).eq("user_id", user.id).eq("reaction_type", type);
      } else {
        await supabase.from("post_reactions").insert({
          post_id: postId, user_id: user.id, reaction_type: type,
        });
      }
    } catch {
      // Revert on error - refetch
      const { data } = await supabase
        .from("post_reactions")
        .select("reaction_type, user_id")
        .eq("post_id", postId);
      if (data) {
        const counts = new Map<string, { count: number; hasReacted: boolean }>();
        data.forEach((r) => {
          const ex = counts.get(r.reaction_type) || { count: 0, hasReacted: false };
          ex.count++;
          if (r.user_id === user.id) ex.hasReacted = true;
          counts.set(r.reaction_type, ex);
        });
        setReactions(
          REACTIONS.filter((r) => counts.has(r.type)).map((r) => ({
            type: r.type,
            count: counts.get(r.type)!.count,
            hasReacted: counts.get(r.type)!.hasReacted,
          }))
        );
      }
    } finally {
      setPending(false);
      setOpen(false);
    }
  }, [user, postId, reactions, pending]);

  const getEmoji = (type: string) => REACTIONS.find((r) => r.type === type)?.emoji || "";

  return (
    <div className="flex items-center gap-1">
      {reactions.map((r) => (
        <button
          key={r.type}
          onClick={() => toggleReaction(r.type)}
          disabled={pending}
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs transition-all duration-200 hover:scale-110 active:scale-95",
            r.hasReacted
              ? "bg-primary/15 ring-1 ring-primary/30"
              : "bg-muted/60 hover:bg-muted"
          )}
        >
          <span className="text-sm">{getEmoji(r.type)}</span>
          <span className="tabular-nums text-[12px] font-semibold text-muted-foreground">
            <AnimatedCounter value={r.count} className="inline" />
          </span>
        </button>
      ))}

      {user && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
              disabled={pending}
            >
              <SmilePlus className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-1.5" side="top" align="start">
            <div className="flex items-center gap-0.5">
              {REACTIONS.map((r) => (
                <button
                  key={r.type}
                  onClick={() => toggleReaction(r.type)}
                  title={isAr ? r.labelAr : r.label}
                  disabled={pending}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-lg transition-all duration-200 hover:scale-125 hover:bg-muted active:scale-95"
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
});
