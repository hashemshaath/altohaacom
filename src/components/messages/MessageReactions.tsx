import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { SmilePlus } from "lucide-react";
import { cn } from "@/lib/utils";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "🔥", "👏"];

interface MessageReactionsProps {
  reactions: Record<string, string[]>; // emoji -> user_ids
  currentUserId: string;
  onReact: (emoji: string) => void;
  isMine: boolean;
}

export function MessageReactions({ reactions, currentUserId, onReact, isMine }: MessageReactionsProps) {
  const [open, setOpen] = useState(false);

  const hasReactions = Object.keys(reactions).length > 0;

  return (
    <div className={cn("flex items-center gap-1 flex-wrap", isMine ? "justify-end" : "justify-start")}>
      {/* Existing reactions */}
      {Object.entries(reactions).map(([emoji, userIds]) => {
        const iReacted = userIds.includes(currentUserId);
        return (
          <button
            key={emoji}
            onClick={() => onReact(emoji)}
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs transition-all hover:scale-110",
              iReacted
                ? "bg-primary/15 ring-1 ring-primary/30"
                : "bg-muted/80 hover:bg-muted"
            )}
          >
            <span>{emoji}</span>
            {userIds.length > 1 && (
              <span className="text-[10px] text-muted-foreground font-medium">{userIds.length}</span>
            )}
          </button>
        );
      })}

      {/* Add reaction button */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "inline-flex items-center justify-center rounded-full h-5 w-5 transition-all",
              hasReactions
                ? "bg-muted/60 hover:bg-muted"
                : "opacity-0 group-hover:opacity-100 bg-muted/60 hover:bg-muted"
            )}
          >
            <SmilePlus className="h-3 w-3 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-1.5" side="top" align={isMine ? "end" : "start"}>
          <div className="flex gap-0.5">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => { onReact(emoji); setOpen(false); }}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted text-lg transition-transform hover:scale-125"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
