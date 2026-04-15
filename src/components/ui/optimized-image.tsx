import { memo, useState, useCallback, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Supabase Storage image transformation helper.
 * Appends ?width=X&height=Y&format=webp&quality=Q to Supabase storage URLs.
 */
function getSupabaseTransformUrl(
  src: string,
  width: number,
  options?: { height?: number; quality?: number; format?: string }
): string {
  // Only transform Supabase storage URLs
  if (!src.includes("supabase.co/storage/v1/object/")) return src;

  const url = new URL(src);
  // Use render endpoint for transforms
  const renderPath = url.pathname.replace(
    "/storage/v1/object/public/",
    "/storage/v1/render/image/public/"
  );
  url.pathname = renderPath;
  url.searchParams.set("width", String(width));
  if (options?.height) url.searchParams.set("height", String(options.height));
  url.searchParams.set("quality", String(options?.quality ?? 75));
  url.searchParams.set("format", options?.format ?? "webp");
  return url.toString();
}

/**
 * Generate srcSet for responsive images.
 * For Supabase URLs, uses transform API. For others, returns undefined.
 */
function buildSrcSet(
  src: string,
  widths: number[],
  quality?: number
): string | undefined {
  if (!src.includes("supabase.co/storage/v1/object/")) return undefined;
  return widths
    .map((w) => `${getSupabaseTransformUrl(src, w, { quality })} ${w}w`)
    .join(", ");
}

/** Default responsive breakpoints */
const DEFAULT_WIDTHS = [320, 640, 768, 1024, 1280, 1536];
const DEFAULT_SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

export interface OptimizedImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "srcSet"> {
  /** Image source URL */
  src: string;
  /** Alt text (required for a11y) */
  alt: string;
  /** Explicit width to prevent CLS */
  width?: number | string;
  /** Explicit height to prevent CLS */
  height?: number | string;
  /** Whether this is an above-the-fold / LCP image */
  priority?: boolean;
  /** Custom responsive widths for srcSet generation */
  responsiveWidths?: number[];
  /** Custom sizes attribute */
  sizes?: string;
  /** Compression quality 1-100 */
  quality?: number;
  /** Aspect ratio for skeleton placeholder (e.g. "16/9") */
  aspectRatio?: string;
  /** Show skeleton placeholder while loading */
  showSkeleton?: boolean;
  /** Fallback src if main image fails */
  fallbackSrc?: string;
  /** Container className */
  containerClassName?: string;
}

export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  responsiveWidths = DEFAULT_WIDTHS,
  sizes = DEFAULT_SIZES,
  quality = 75,
  aspectRatio,
  showSkeleton = true,
  fallbackSrc,
  className,
  containerClassName,
  style,
  ...rest
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = useCallback(() => setLoaded(true), []);
  const handleError = useCallback(() => {
    setError(true);
    if (fallbackSrc) setLoaded(true);
  }, [fallbackSrc]);

  const isSupabase = src?.includes("supabase.co/storage/v1/object/");
  const isUnsplash = src?.includes("unsplash.com");
  const isExternal = src?.startsWith("http");

  // Build optimized src for Supabase images
  const optimizedSrc = isSupabase
    ? getSupabaseTransformUrl(src, typeof width === "number" ? width : 1024, { quality })
    : src;

  // Build srcSet
  const srcSet = isSupabase ? buildSrcSet(src, responsiveWidths, quality) : undefined;

  // For Unsplash, use their built-in sizing
  const unsplashSrc =
    isUnsplash && !src.includes("&w=")
      ? `${src}${src.includes("?") ? "&" : "?"}w=${typeof width === "number" ? width : 1024}&q=${quality}&fm=webp&auto=format`
      : undefined;

  const finalSrc = error && fallbackSrc ? fallbackSrc : unsplashSrc || optimizedSrc;

  const imgElement = (
    <img
      src={finalSrc}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      {...(priority ? { fetchPriority: "high" } : {})}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      onLoad={handleLoad}
      onError={handleError}
      className={cn(
        "transition-opacity duration-300",
        !loaded && showSkeleton && "opacity-0",
        loaded && "opacity-100",
        className
      )}
      style={{
        ...(aspectRatio && !height ? { aspectRatio } : {}),
        ...style,
      }}
      {...rest}
    />
  );

  if (!showSkeleton) return imgElement;

  return (
    <div
      className={cn("relative overflow-hidden", containerClassName)}
      style={{
        ...(width ? { width: typeof width === "number" ? `${width}px` : width } : {}),
        ...(aspectRatio && !height ? { aspectRatio } : {}),
      }}
    >
      {/* Skeleton placeholder */}
      {!loaded && (
        <div
          className="absolute inset-0 animate-pulse bg-muted/40 rounded"
          style={aspectRatio ? { aspectRatio } : undefined}
        />
      )}
      {imgElement}
    </div>
  );
});

/**
 * Helper: get Supabase-transformed URL directly (for backgrounds, og images, etc.)
 */
export function getOptimizedUrl(
  src: string,
  width: number,
  options?: { height?: number; quality?: number; format?: string }
): string {
  if (!src) return src;
  if (src.includes("supabase.co/storage/v1/object/")) {
    return getSupabaseTransformUrl(src, width, options);
  }
  if (src.includes("unsplash.com") && !src.includes("&w=")) {
    return `${src}${src.includes("?") ? "&" : "?"}w=${width}&q=${options?.quality ?? 75}&fm=webp&auto=format`;
  }
  return src;
}
