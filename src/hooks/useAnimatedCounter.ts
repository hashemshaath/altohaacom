import { useEffect, useState } from "react";

/**
 * Animated counter that counts up from 0 to a target value.
 * Used in admin dashboard stat cards for a polished feel.
 */
export function useAnimatedCounter(target: number, duration = 800) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    let raf: number;

    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}
