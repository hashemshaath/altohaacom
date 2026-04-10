import { forwardRef, useState, useCallback, useMemo, type ImgHTMLAttributes } from "react";
import { getAdaptiveQuality, getQualityTier } from "@/lib/networkQuality";

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Supabase storage path or full URL */
  src: string | undefined | null;
  /** Desired display width for Supabase image transform */
  width?: number;
  /** Image quality (1-100), default 80 */
  quality?: number;
  /** Show a shimmer placeholder while loading */
  shimmer?: boolean;
  /** Fallback element when image fails or src is missing */
  fallback?: React.ReactNode;
  /** Aspect ratio class e.g. "aspect-video", "aspect-square" */
  aspectRatio?: string;
}

const SUPABASE_STORAGE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1`;

function transformUrl(src: string, width: number, quality: number): string {
  if (!src) return "/placeholder.svg";

  // Supabase storage URLs — use image transform API
  if (src.includes("supabase.co/storage/")) {
    const base = src.replace("/object/", "/render/image/");
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}width=${width}&quality=${quality}&format=webp`;
  }

  // Relative Supabase paths
  if (!src.startsWith("http") && !src.startsWith("/")) {
    return `${SUPABASE_STORAGE}/render/image/public/${src}?width=${width}&quality=${quality}&format=webp`;
  }

  return src;
}

function buildSrcSet(src: string, quality: number): string | undefined {
  if (!src || src.startsWith("/")) return undefined;
  if (!src.includes("supabase.co/storage/") && (src.startsWith("http") || src.startsWith("/"))) return undefined;

  return [
    `${transformUrl(src, 400, quality)} 400w`,
    `${transformUrl(src, 800, quality)} 800w`,
    `${transformUrl(src, 1200, quality)} 1200w`,
  ].join(", ");
}

/**
 * Performance-optimized image component with:
 * - Automatic Supabase image transforms (resize + WebP)
 * - Responsive srcSet generation
 * - Shimmer placeholder during load
 * - Graceful error fallback
 * - Native lazy loading + async decode
 */
export const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(
  function OptimizedImage(
    {
      src,
      alt = "",
      width: displayWidth = 800,
      quality = 80,
      shimmer = true,
      fallback,
      aspectRatio,
      className,
      loading = "lazy",
      sizes,
      onLoad,
      onError,
      ...props
    },
    ref
  ) {
    const [state, setState] = useState<"loading" | "loaded" | "error">("loading");

    const handleLoad = useCallback(
      (e: React.SyntheticEvent<HTMLImageElement>) => {
        setState("loaded");
        onLoad?.(e);
      },
      [onLoad]
    );

    const handleError = useCallback(
      (e: React.SyntheticEvent<HTMLImageElement>) => {
        setState("error");
        onError?.(e);
      },
      [onError]
    );

    const isValidSrc =
      src &&
      typeof src === "string" &&
      (src.startsWith("http") || src.startsWith("/") || !src.includes(" "));

    if (!isValidSrc || state === "error") {
      return (
        <div
          className={cn(
            "h-full w-full bg-muted/40 flex items-center justify-center",
            aspectRatio,
            className
          )}
          role="img"
          aria-label={alt || "Image placeholder"}
        >
          {fallback || <div className="h-10 w-10 rounded-full bg-muted/60" />}
        </div>
      );
    }

    const optimizedSrc = transformUrl(src, displayWidth, quality);
    const srcSet = buildSrcSet(src, quality);

    return (
      <div className={cn("relative overflow-hidden", aspectRatio)}>
        {/* Shimmer placeholder */}
        {shimmer && state === "loading" && (
          <div className="absolute inset-0 bg-muted/30 animate-pulse" />
        )}
        <img
          ref={ref}
          src={optimizedSrc}
          srcSet={srcSet}
          sizes={sizes || `(max-width: 640px) 400px, (max-width: 1024px) 800px, ${displayWidth}px`}
          alt={alt}
          loading={loading}
          decoding="async"
          className={cn(
            "transition-opacity duration-300",
            state === "loaded" ? "opacity-100" : "opacity-0",
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      </div>
    );
  }
);
