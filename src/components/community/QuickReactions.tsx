import { memo, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const REACTIONS = [
  { emoji: "👏", label: "clap", labelAr: "تصفيق" },
  { emoji: "🔥", label: "fire", labelAr: "ناري" },
  { emoji: "❤️", label: "love", labelAr: "حب" },
  { emoji: "😮", label: "wow", labelAr: "واو" },
  { emoji: "😂", label: "haha", labelAr: "هاها" },
  { emoji: "🤔", label: "thinking", labelAr: "تفكير" },
] as const;

interface QuickReactionsProps {
  postId: string;
  className?: string;
}

export const QuickReactions = memo(function QuickReactions({ postId, className }: QuickReactionsProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const [reacting, setReacting] = useState<string | null>(null);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);

  const handleReact = useCallback(async (reactionType: string) => {
    if (!user || reacting) return;
    setReacting(reactionType);
    
    try {
      if (selectedReaction === reactionType) {
        // Remove reaction
        await supabase
          .from("article_reactions")
          .delete()
          .eq("article_id", postId)
          .eq("user_id", user.id)
          .eq("reaction_type", reactionType);
        setSelectedReaction(null);
      } else {
        // Remove existing & add new
        if (selectedReaction) {
          await supabase
            .from("article_reactions")
            .delete()
            .eq("article_id", postId)
            .eq("user_id", user.id);
        }
        await supabase
          .from("article_reactions")
          .insert({ article_id: postId, user_id: user.id, reaction_type: reactionType });
        setSelectedReaction(reactionType);
      }
    } catch {
      toast({ title: isAr ? "حدث خطأ" : "Error occurred", variant: "destructive" });
    } finally {
      setReacting(null);
    }
  }, [user, postId, selectedReaction, reacting, isAr, toast]);

  if (!user) return null;

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {REACTIONS.map((r) => (
        <Button
          key={r.label}
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 w-7 p-0 rounded-lg text-sm transition-all duration-200 hover:scale-125 active:scale-90",
            selectedReaction === r.label && "bg-primary/10 ring-1 ring-primary/30 scale-110"
          )}
          onClick={(e) => { e.stopPropagation(); handleReact(r.label); }}
          disabled={!!reacting}
          title={isAr ? r.labelAr : r.label}
        >
          {r.emoji}
        </Button>
      ))}
    </div>
  );
});
