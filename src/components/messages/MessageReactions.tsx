import { useState, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { SmilePlus } from "lucide-react";
import { cn } from "@/lib/utils";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "🔥", "👏"];
const EXTENDED_REACTIONS = ["🎉", "🤔", "😍", "💯", "🙏", "😢", "👨‍🍳", "⭐", "🍽️", "🥇"];

interface MessageReactionsProps {
  reactions: Record<string, string[]>; // emoji -> user_ids
  currentUserId: string;
  onReact: (emoji: string) => void;
  isMine: boolean;
}

export function MessageReactions({ reactions, currentUserId, onReact, isMine }: MessageReactionsProps) {
  const [open, setOpen] = useState(false);
  const [showExtended, setShowExtended] = useState(false);
  const [animatingEmoji, setAnimatingEmoji] = useState<string | null>(null);

  const hasReactions = Object.keys(reactions).length > 0;

  const handleReact = useCallback((emoji: string) => {
    setAnimatingEmoji(emoji);
    onReact(emoji);
    setOpen(false);
    setShowExtended(false);
    setTimeout(() => setAnimatingEmoji(null), 600);
  }, [onReact]);

  return (
    <div className={cn("flex items-center gap-1 flex-wrap", isMine ? "justify-end" : "justify-start")}>
      {/* Existing reactions */}
      {Object.entries(reactions).map(([emoji, userIds]) => {
        const iReacted = userIds.includes(currentUserId);
        const isAnimating = animatingEmoji === emoji;
        return (
          <button
            key={emoji}
            onClick={() => handleReact(emoji)}
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs transition-all duration-200",
              iReacted
                ? "bg-primary/15 ring-1 ring-primary/30 shadow-sm"
                : "bg-muted/80 hover:bg-muted",
              isAnimating && "animate-bounce"
            )}
          >
            <span className={cn("transition-transform duration-200", iReacted && "scale-110")}>{emoji}</span>
            {userIds.length > 1 && (
              <span className="text-[10px] text-muted-foreground font-medium tabular-nums">{userIds.length}</span>
            )}
          </button>
        );
      })}

      {/* Add reaction button */}
      <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setShowExtended(false); }}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "inline-flex items-center justify-center rounded-full h-6 w-6 transition-all duration-200",
              hasReactions
                ? "bg-muted/60 hover:bg-muted hover:scale-110"
                : "opacity-0 group-hover:opacity-100 bg-muted/60 hover:bg-muted hover:scale-110"
            )}
          >
            <SmilePlus className="h-3 w-3 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-2 border-border/50 shadow-xl"
          side="top"
          align={isMine ? "end" : "start"}
        >
          <div className="flex gap-0.5">
            {QUICK_REACTIONS.map((emoji, i) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-accent text-lg transition-all duration-150 hover:scale-130 active:scale-95"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                {emoji}
              </button>
            ))}
          </div>
          {showExtended && (
            <div className="flex gap-0.5 mt-1 pt-1 border-t border-border/30 animate-in fade-in-0 slide-in-from-bottom-1 duration-200">
              {EXTENDED_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-accent text-base transition-all duration-150 hover:scale-125 active:scale-95"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowExtended(!showExtended)}
            className="w-full mt-1 text-[10px] text-muted-foreground hover:text-foreground text-center py-1 rounded-md hover:bg-accent transition-colors"
          >
            {showExtended ? "▲" : "▼ more"}
          </button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
