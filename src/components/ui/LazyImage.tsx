import { useState, useRef, useEffect, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
}

/**
 * Image component with native lazy loading, fade-in animation,
 * and optional fallback for broken images.
 */
export function LazyImage({ className, fallback, onError, onLoad, ...props }: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <img
      {...props}
      loading="lazy"
      decoding="async"
      className={cn(
        "transition-opacity duration-300",
        loaded ? "opacity-100" : "opacity-0",
        error && "hidden",
        className
      )}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
      onError={(e) => {
        setError(true);
        if (fallback) {
          (e.target as HTMLImageElement).src = fallback;
          setError(false);
        }
        onError?.(e);
      }}
    />
  );
}
