import { useState, ImgHTMLAttributes, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
  /** Use blur-up placeholder effect */
  blurUp?: boolean;
  /** Priority loading (above the fold) */
  priority?: boolean;
  /** Aspect ratio class like aspect-video, aspect-square */
  aspectRatio?: string;
}

export function OptimizedImage({
  className,
  alt = "",
  fallback,
  blurUp = false,
  priority = false,
  aspectRatio,
  src,
  ...props
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(priority);
  const ref = useRef<HTMLDivElement>(null);

  // Intersection observer for deferred off-screen images
  useEffect(() => {
    if (priority || inView) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [priority, inView]);

  return (
    <div ref={ref} className={cn("relative overflow-hidden", aspectRatio, className)}>
      {!loaded && !error && (
        <Skeleton className="absolute inset-0 h-full w-full" />
      )}
      {inView && src && (
        <img
          {...props}
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : undefined}
          onLoad={() => setLoaded(true)}
          onError={(e) => {
            setError(true);
            if (fallback) (e.target as HTMLImageElement).src = fallback;
          }}
          className={cn(
            "h-full w-full object-cover transition-all duration-500",
            loaded ? "opacity-100 scale-100" : "opacity-0 scale-[1.02]",
            blurUp && !loaded && "blur-sm",
          )}
        />
      )}
    </div>
  );
}
