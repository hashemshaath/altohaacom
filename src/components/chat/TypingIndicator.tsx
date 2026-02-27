/**
 * Typing indicator dots animation for chat interfaces.
 */
export function TypingIndicator({ name, isAr }: { name?: string; isAr?: boolean }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex items-center gap-1 rounded-2xl bg-muted/60 px-3 py-2">
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      {name && (
        <span className="text-[10px] text-muted-foreground">
          {isAr ? `${name} يكتب...` : `${name} is typing...`}
        </span>
      )}
    </div>
  );
}
