import { useState } from "react";
import { Pin, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import type { Message } from "@/hooks/useMessagesData";

interface PinnedMessagesBarProps {
  pinnedMessages: Message[];
  isAr: boolean;
  onUnpin: (msgId: string) => void;
  onJumpTo: (msgId: string) => void;
}

export function PinnedMessagesBar({ pinnedMessages, isAr, onUnpin, onJumpTo }: PinnedMessagesBarProps) {
  const [expanded, setExpanded] = useState(false);

  if (!pinnedMessages.length) return null;

  return (
    <div className="border-b border-border/40 bg-chart-4/5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-chart-4/10 transition-colors"
      >
        <Pin className="h-3 w-3 text-chart-4 shrink-0" />
        <span className="font-medium text-chart-4">
          {pinnedMessages.length} {isAr ? "رسائل مثبتة" : "pinned message(s)"}
        </span>
        {!expanded && (
          <span className="text-muted-foreground truncate flex-1 text-start">
            — {pinnedMessages[pinnedMessages.length - 1].content.substring(0, 50)}
          </span>
        )}
        {expanded ? <ChevronUp className="h-3 w-3 ms-auto shrink-0" /> : <ChevronDown className="h-3 w-3 ms-auto shrink-0" />}
      </button>
      {expanded && (
        <ScrollArea className="max-h-32 px-3 pb-2">
          <div className="space-y-1.5">
            {pinnedMessages.map((msg) => (
              <div
                key={msg.id}
                className="flex items-start gap-2 rounded-lg bg-background/80 p-2 text-xs group cursor-pointer hover:bg-background transition-colors"
                onClick={() => onJumpTo(msg.id)}
              >
                <Pin className="h-3 w-3 text-chart-4 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="truncate">{msg.content}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(msg.created_at), "MMM d, h:mm a")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0"
                  onClick={(e) => { e.stopPropagation(); onUnpin(msg.id); }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
