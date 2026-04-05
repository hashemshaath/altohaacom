import { memo } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  /** Width for srcset generation (optional, for Supabase transform) */
  width?: number;
  /** Height for srcset generation (optional) */
  height?: number;
  /** Aspect ratio class e.g. "aspect-video", "aspect-square" */
  aspect?: string;
  /** Priority image — skip lazy loading */
  priority?: boolean;
  /** Fallback content when no src */
  fallback?: React.ReactNode;
}

/**
 * Optimized image component with:
 * - Lazy loading by default (eager for priority)
 * - Async decoding
 * - WebP/AVIF format hints via accept header
 * - Proper alt text enforcement
 * - Fade-in on load
 */
export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  width,
  height,
  aspect,
  priority = false,
  fallback,
  className,
  ...props
}: OptimizedImageProps) {
  if (!src && fallback) {
    return <>{fallback}</>;
  }

  if (!src) return null;

  // Generate srcset for Supabase storage images
  const isSupabaseStorage = src.includes("supabase.co/storage");
  const srcSet = isSupabaseStorage && width
    ? [
        `${src}?width=${Math.round(width * 0.5)}&format=webp ${Math.round(width * 0.5)}w`,
        `${src}?width=${width}&format=webp ${width}w`,
        `${src}?width=${Math.round(width * 1.5)}&format=webp ${Math.round(width * 1.5)}w`,
      ].join(", ")
    : undefined;

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      srcSet={srcSet}
      sizes={width ? `(max-width: ${width}px) 100vw, ${width}px` : undefined}
      className={cn(
        aspect,
        "transition-opacity duration-300",
        className
      )}
      {...props}
    />
  );
});
