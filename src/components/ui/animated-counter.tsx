import { forwardRef, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

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
