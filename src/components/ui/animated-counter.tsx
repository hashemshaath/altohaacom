import { forwardRef, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  format?: boolean;
}

export const AnimatedCounter = forwardRef<HTMLSpanElement, AnimatedCounterProps>(
  function AnimatedCounter({ value, duration = 1200, className, prefix = "", suffix = "", format = true }, forwardedRef) {
    const [display, setDisplay] = useState(0);
    const started = useRef(false);

    useEffect(() => {
      if (started.current) {
        const start = display;
        const diff = value - start;
        const startTime = performance.now();
        const tick = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(Math.round(start + diff * eased));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      } else {
        started.current = true;
        setDisplay(value);
      }
    }, [value, duration]);

    const formatted = format ? display.toLocaleString() : display.toString();

    return (
      <span ref={forwardedRef} className={cn("tabular-nums", className)}>
        {prefix}{formatted}{suffix}
      </span>
    );
  }
);

AnimatedCounter.displayName = "AnimatedCounter";
