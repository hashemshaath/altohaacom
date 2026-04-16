import { memo, useState, useCallback, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const PLACEHOLDER = "/placeholder.svg";

export interface SafeImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "onError"> {
  src?: string | null;
  alt: string;
  fallback?: string;
}

/**
 * Safe image component that handles null/undefined/empty src and broken URLs.
 * Falls back to a placeholder automatically.
 */
export const SafeImage = memo(function SafeImage({
  src,
  alt,
  fallback = PLACEHOLDER,
  className,
  ...rest
}: SafeImageProps) {
  const [errored, setErrored] = useState(false);

  const handleError = useCallback(() => setErrored(true), []);

  const safeSrc = (!src || errored) ? fallback : src;

  return (
    <img
      src={safeSrc}
      alt={alt}
      onError={handleError}
      loading="lazy"
      decoding="async"
      className={cn("object-cover", className)}
      {...rest}
    />
  );
});
