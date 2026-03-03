import { useEffect } from "react";

/**
 * Preloads an image by injecting a <link rel="preload"> tag into <head>.
 * Useful for LCP optimization (e.g. hero slide images).
 */
export function usePreloadImage(src: string | undefined | null) {
  useEffect(() => {
    if (!src) return;

    // Avoid duplicates
    const existing = document.querySelector(`link[rel="preload"][href="${src}"]`);
    if (existing) return;

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = src;
    document.head.appendChild(link);

    return () => {
      // Don't remove — the browser cache benefit persists
    };
  }, [src]);
}
