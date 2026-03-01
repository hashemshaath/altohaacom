import { X, Reply } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReplyPreviewProps {
  replyToMessage: { id: string; content: string; senderName: string } | null;
  onClear: () => void;
  isMine?: boolean;
  compact?: boolean;
}

/** Inline preview shown above the input when replying, or inside a bubble for context */
export function ReplyPreview({ replyToMessage, onClear, compact }: ReplyPreviewProps) {
  if (!replyToMessage) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 mb-1 rounded-lg bg-muted/40 px-2.5 py-1.5 border-s-2 border-primary/50">
        <Reply className="h-3 w-3 text-primary/70 shrink-0 scale-x-[-1]" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold text-primary/80 truncate">{replyToMessage.senderName}</p>
          <p className="text-[10px] text-muted-foreground truncate leading-tight">{replyToMessage.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-primary/5 border border-primary/15 px-3 py-2.5 mx-3 mt-2 animate-in slide-in-from-bottom-2 duration-200 backdrop-blur-sm">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
        <Reply className="h-4 w-4 text-primary scale-x-[-1]" />
      </div>
      <div className="min-w-0 flex-1 border-s-2 border-primary/30 ps-2.5">
        <p className="text-[11px] font-bold text-primary">{replyToMessage.senderName}</p>
        <p className="text-xs text-muted-foreground truncate leading-snug">{replyToMessage.content}</p>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="h-7 w-7 shrink-0 flex items-center justify-center rounded-full hover:bg-destructive/10 transition-colors"
      >
        <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
      </button>
    </div>
  );
}
