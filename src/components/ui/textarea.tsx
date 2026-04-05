
import { cn } from "@/lib/utils";
import React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Max character count — shows counter when set */
  maxCharacters?: number;
  /** Auto-resize height to fit content */
  autoResize?: boolean;
  /** Visual state override */
  state?: "default" | "error" | "success";
}

const stateClasses: Record<string, string> = {
  error: "border-destructive/60 focus-visible:ring-destructive/30 focus-visible:border-destructive hover:border-destructive/80",
  success: "border-emerald-500/60 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 hover:border-emerald-500/80",
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, dir, maxCharacters, autoResize, state = "default", value, onChange, ...props }, ref) => {
    const resolvedDir = dir ?? (document.documentElement.getAttribute("dir") as "ltr" | "rtl" | undefined) ?? undefined;
    const internalRef = React.useRef<HTMLTextAreaElement | null>(null);

    const charCount = typeof value === "string" ? value.length : 0;
    const isOverLimit = maxCharacters ? charCount > maxCharacters : false;
    const effectiveState = isOverLimit ? "error" : state;
    const stateClass = stateClasses[effectiveState] ?? "";

    // Auto-resize logic
    const adjustHeight = React.useCallback(() => {
      const el = internalRef.current;
      if (!el || !autoResize) return;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }, [autoResize]);

    React.useEffect(() => {
      adjustHeight();
    }, [value, adjustHeight]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e);
      // Defer resize to after state update
      requestAnimationFrame(adjustHeight);
    };

    const setRefs = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        internalRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
      },
      [ref]
    );

    return (
      <div className="relative w-full">
        <textarea
          dir={resolvedDir}
          value={value}
          onChange={handleChange}
          ref={setRefs}
          className={cn(
            "flex min-h-[100px] w-full rounded-xl border border-input bg-background px-3.5 py-3 text-base md:text-sm ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation transition-all duration-200 hover:border-ring/50 focus-visible:border-primary/40 focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.06)]",
            autoResize && "resize-none overflow-hidden",
            stateClass,
            className,
          )}
          {...props}
        />
        {maxCharacters != null && (
          <span
            className={cn(
              "absolute end-2 bottom-2 text-[10px] tabular-nums transition-colors duration-200",
              isOverLimit ? "text-destructive font-medium" : "text-muted-foreground/70"
            )}
          >
            {charCount}/{maxCharacters}
          </span>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
