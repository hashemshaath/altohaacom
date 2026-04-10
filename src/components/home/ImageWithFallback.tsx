import { forwardRef, useState, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ImageWithFallbackProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallbackIcon?: React.ReactNode;
}

/**
 * Image component with automatic fallback on error or missing src.
 * Optimized with lazy loading, async decoding, and fade-in transition.
 */
export const ImageWithFallback = forwardRef<HTMLImageElement, ImageWithFallbackProps>(function ImageWithFallback({
  src,
  alt,
  className,
  fallbackIcon,
  loading = "lazy",
  decoding = "async",
  ...props
}, ref) {
  const [hasError, setHasError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const isValidUrl =
    src &&
    typeof src === "string" &&
    (src.startsWith("http://") ||
      src.startsWith("https://") ||
      src.startsWith("/"));

  if (!isValidUrl || hasError) {
    return (
      <div
        className={cn(
          "h-full w-full bg-muted/40 flex items-center justify-center",
          className
        )}
        role="img"
        aria-label={alt || "Image placeholder"}
      >
        {fallbackIcon || (
          <div className="h-10 w-10 rounded-full bg-muted/60" />
        )}
      </div>
    );
  }

  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      loading={loading}
      decoding={decoding as any}
      className={cn(
        className,
        "transition-opacity duration-300",
        loaded ? "opacity-100" : "opacity-0"
      )}
      onLoad={() => setLoaded(true)}
      onError={() => setHasError(true)}
      {...props}
    />
  );
});
