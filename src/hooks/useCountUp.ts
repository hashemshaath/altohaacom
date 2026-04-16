import { useEffect, useState } from "react";

export function useCountUp(end: number, isActive: boolean, duration = 1500) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!isActive || end === 0) {
      if (!isActive) setValue(0);
      return;
    }

    let startTime: number | null = null;
    let raf: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * end));

      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [end, isActive, duration]);

  return value;
}
