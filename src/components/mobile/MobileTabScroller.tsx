import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Tab {
  value: string;
  label: string;
  icon?: React.ElementType;
  badge?: number;
}

interface MobileTabScrollerProps {
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * A horizontally scrollable tab bar optimized for mobile.
 * Automatically scrolls the active tab into view.
 */
export function MobileTabScroller({ tabs, value, onChange, className }: MobileTabScrollerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);

  // Scroll active tab into center view
  useEffect(() => {
    const el = activeRef.current;
    const container = scrollRef.current;
    if (!el || !container) return;
    const elLeft = el.offsetLeft;
    const elWidth = el.offsetWidth;
    const containerWidth = container.offsetWidth;
    const scrollTarget = elLeft - containerWidth / 2 + elWidth / 2;
    container.scrollTo({ left: scrollTarget, behavior: "smooth" });
  }, [value]);

  // Detect if tabs overflow (to show scroll hint gradient)
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const check = () => setIsScrollable(container.scrollWidth > container.clientWidth + 4);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(container);
    return () => ro.disconnect();
  }, [tabs]);

  return (
    <div className={cn("relative", className)}>
      {/* Scroll hint gradient on the right */}
      {isScrollable && (
        <div className="pointer-events-none absolute end-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10" />
      )}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-none snap-x snap-mandatory -mx-0.5 px-0.5"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = tab.value === value;
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              ref={isActive ? activeRef : undefined}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.value)}
              className={cn(
                "relative flex shrink-0 snap-start items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 touch-manipulation active:scale-[0.95] whitespace-nowrap mx-0.5",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={cn(
                    "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold",
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-primary/15 text-primary"
                  )}
                >
                  {tab.badge > 99 ? "99+" : tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
