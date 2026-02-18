import { cn } from "@/lib/utils";

interface LiveRegionProps {
  message: string;
  /** "polite" waits for idle, "assertive" interrupts */
  politeness?: "polite" | "assertive";
  className?: string;
}

/**
 * ARIA live region for announcing dynamic content changes to screen readers.
 * Use for toast-like messages, form validation, loading states, etc.
 */
export function LiveRegion({ message, politeness = "polite", className }: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className={cn("sr-only", className)}
    >
      {message}
    </div>
  );
}
