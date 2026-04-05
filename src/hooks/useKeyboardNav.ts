import { useCallback, useRef, KeyboardEvent } from "react";

/**
 * Hook that provides keyboard navigation (arrow keys, Home, End)
 * for list-like components following WAI-ARIA listbox pattern.
 */
export function useKeyboardNav<T extends HTMLElement = HTMLElement>(
  itemCount: number,
  options?: {
    onSelect?: (index: number) => void;
    orientation?: "vertical" | "horizontal";
    loop?: boolean;
  }
) {
  const currentIndex = useRef(0);
  const containerRef = useRef<T>(null);

  const { onSelect, orientation = "vertical", loop = true } = options || {};

  const focusItem = useCallback((index: number) => {
    const container = containerRef.current;
    if (!container) return;
    const items = container.querySelectorAll<HTMLElement>('[role="option"], [role="menuitem"], [role="tab"], [data-nav-item]');
    const target = items[index];
    if (target) {
      target.focus();
      currentIndex.current = index;
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const prevKey = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
      const nextKey = orientation === "vertical" ? "ArrowDown" : "ArrowRight";

      let newIndex = currentIndex.current;

      switch (e.key) {
        case nextKey:
          e.preventDefault();
          newIndex = currentIndex.current + 1;
          if (newIndex >= itemCount) newIndex = loop ? 0 : itemCount - 1;
          break;
        case prevKey:
          e.preventDefault();
          newIndex = currentIndex.current - 1;
          if (newIndex < 0) newIndex = loop ? itemCount - 1 : 0;
          break;
        case "Home":
          e.preventDefault();
          newIndex = 0;
          break;
        case "End":
          e.preventDefault();
          newIndex = itemCount - 1;
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          onSelect?.(currentIndex.current);
          return;
        default:
          return;
      }

      focusItem(newIndex);
    },
    [itemCount, orientation, loop, focusItem, onSelect]
  );

  return { containerRef, handleKeyDown, focusItem, currentIndex };
}
