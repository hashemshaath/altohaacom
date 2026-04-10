import { useEffect, useState } from "react";
import { subscribeScroll } from "@/lib/scrollManager";

/**
 * Tracks page scroll progress as a percentage (0–100).
 * Uses the centralized scroll manager (single RAF-throttled listener).
 */
export function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    return subscribeScroll((scrollY) => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min((scrollY / docHeight) * 100, 100) : 0);
    });
  }, []);

  return progress;
}
