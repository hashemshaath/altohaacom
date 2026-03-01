import { useEffect, useState, useCallback, memo, lazy, Suspense } from "react";

/**
 * Hook to lazy-render below-the-fold sections using IntersectionObserver.
 * Triggers rendering 300px before the element enters viewport.
 */
export function useInViewport(rootMargin = "300px") {
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, rootMargin]);

  return { setRef, isVisible };
}

/**
 * Wrapper for lazy-rendered viewport sections
 */
export function ViewportSection({ children, fallback, className }: { children: React.ReactNode; fallback?: React.ReactNode; className?: string }) {
  const { setRef, isVisible } = useInViewport();
  return (
    <div ref={setRef} className={className}>
      {isVisible ? children : (fallback || <div className="h-32 animate-pulse bg-muted rounded-xl" />)}
    </div>
  );
}

/**
 * Resource preconnect for faster API/CDN loading
 */
export function preconnectTo(url: string) {
  if (typeof document === "undefined") return;
  const existing = document.querySelector(`link[href="${url}"][rel="preconnect"]`);
  if (existing) return;
  const link = document.createElement("link");
  link.rel = "preconnect";
  link.href = url;
  link.crossOrigin = "anonymous";
  document.head.appendChild(link);
}

/**
 * Image with lazy loading and blur placeholder
 */
export function OptimizedImage({ src, alt, className, width, height }: { src: string; alt: string; className?: string; width?: number; height?: number }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return <div className={`bg-muted flex items-center justify-center ${className}`}><span className="text-muted-foreground text-xs">⚠️</span></div>;
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded && <div className="absolute inset-0 bg-muted animate-pulse" />}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}

/**
 * SEO meta tag manager
 */
export function setMetaTags({ title, description, canonicalUrl, ogImage, ogType = "website" }: {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
}) {
  if (typeof document === "undefined") return;

  document.title = title;

  const metaUpdates: [string, string, string][] = [
    ["name", "description", description],
    ["property", "og:title", title],
    ["property", "og:description", description],
    ["property", "og:type", ogType],
    ["name", "twitter:title", title],
    ["name", "twitter:description", description],
  ];

  if (ogImage) {
    metaUpdates.push(["property", "og:image", ogImage]);
    metaUpdates.push(["name", "twitter:image", ogImage]);
    metaUpdates.push(["name", "twitter:card", "summary_large_image"]);
  }

  metaUpdates.forEach(([attr, key, content]) => {
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  });

  // Canonical URL
  if (canonicalUrl) {
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonicalUrl;
  }
}

/**
 * JSON-LD structured data injector
 */
export function setJsonLd(data: Record<string, any>) {
  if (typeof document === "undefined") return;

  let script = document.querySelector('script[data-jsonld="true"]');
  if (!script) {
    script = document.createElement("script");
    script.setAttribute("type", "application/ld+json");
    script.setAttribute("data-jsonld", "true");
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify({ "@context": "https://schema.org", ...data });
}
