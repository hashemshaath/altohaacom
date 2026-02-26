import { useEffect, useRef, useCallback } from "react";

/**
 * Traps keyboard focus within a container element.
 * Useful for modals, dialogs, and drawers.
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(active = true) {
  const ref = useRef<T>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!active || !ref.current || e.key !== "Tab") return;

    const focusable = ref.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [active]);

  useEffect(() => {
    if (!active) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, active]);

  // Auto-focus first focusable element on mount
  useEffect(() => {
    if (!active || !ref.current) return;
    const timer = setTimeout(() => {
      const first = ref.current?.querySelector<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      first?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [active]);

  return ref;
}
