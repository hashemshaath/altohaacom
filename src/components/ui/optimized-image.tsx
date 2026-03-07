import { useState, ImgHTMLAttributes, useRef, useEffect, memo } from "react";
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
  /** Generate srcset for responsive images (Supabase storage only) */
  responsive?: boolean;
}

/** Generate srcset for Supabase storage images using transform API */
function getSupabaseSrcSet(src: string, widths: number[]): string | undefined {
  if (!src.includes("supabase.co/storage/")) return undefined;
  // Use Supabase image transform: /render/image/...?width=X
  const base = src.replace("/object/", "/render/image/");
  return widths.map(w => `${base}${base.includes("?") ? "&" : "?"}width=${w} ${w}w`).join(", ");
}

export const OptimizedImage = memo(function OptimizedImage({
  className,
  alt = "",
  fallback,
  blurUp = false,
  priority = false,
  aspectRatio,
  responsive = false,
  src,
  sizes,
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
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [priority, inView]);

  const srcSet = responsive && src ? getSupabaseSrcSet(src, [320, 640, 960, 1280]) : undefined;
  const defaultSizes = sizes || (responsive ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" : undefined);

  return (
    <div ref={ref} className={cn("relative overflow-hidden", aspectRatio, className)}>
      {!loaded && !error && (
        <Skeleton className="absolute inset-0 h-full w-full" />
      )}
      {inView && src && (
        <img
          {...props}
          src={src}
          srcSet={srcSet}
          sizes={defaultSizes}
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
});
