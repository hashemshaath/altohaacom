import { useState, useEffect, useRef, memo } from "react";

interface CountUpProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * Animated count-up number for dashboard stats.
 */
export const CountUp = memo(function CountUp({ end, duration = 800, prefix = "", suffix = "", className }: CountUpProps) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<number>();

  useEffect(() => {
    const start = 0;
    const startTime = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      // ease out
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.floor(start + (end - start) * eased));
      if (progress < 1) ref.current = requestAnimationFrame(step);
    };

    ref.current = requestAnimationFrame(step);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [end, duration]);

  return <span className={className}>{prefix}{current.toLocaleString()}{suffix}</span>;
}
