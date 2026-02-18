import { ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface FocusTrapProps {
  children: ReactNode;
  active?: boolean;
  className?: string;
  /** Return focus to trigger element on deactivation */
  returnFocus?: boolean;
}

/**
 * Accessible focus trap for modals, dialogs, and drawers.
 * Traps keyboard focus within the container when active.
 */
export function FocusTrap({ children, active = true, className, returnFocus = true }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    previousFocus.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    const focusableSelectors =
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusable = container.querySelectorAll<HTMLElement>(focusableSelectors);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    // Focus first focusable element
    const focusable = container.querySelectorAll<HTMLElement>(focusableSelectors);
    if (focusable.length > 0) {
      setTimeout(() => focusable[0].focus(), 50);
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (returnFocus && previousFocus.current) {
        previousFocus.current.focus();
      }
    };
  }, [active, returnFocus]);

  return (
    <div ref={containerRef} className={cn(className)}>
      {children}
    </div>
  );
}
