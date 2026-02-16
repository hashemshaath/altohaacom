import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description?: string;
  ogImage?: string;
  ogType?: string;
  canonical?: string;
  jsonLd?: Record<string, unknown>;
  noIndex?: boolean;
  lang?: string;
}

export function SEOHead({
  title,
  description,
  ogImage,
  ogType = "website",
  canonical,
  jsonLd,
  noIndex,
  lang,
}: SEOHeadProps) {
  useEffect(() => {
    // Title
    const fullTitle = title.includes("Altohaa") ? title : `${title} | Altohaa`;
    document.title = fullTitle;

    // Helper to set/create meta tags
    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    if (description) {
      setMeta("name", "description", description);
      setMeta("property", "og:description", description);
      setMeta("name", "twitter:description", description);
    }

    setMeta("property", "og:title", fullTitle);
    setMeta("name", "twitter:title", fullTitle);
    setMeta("property", "og:type", ogType);
    setMeta("property", "og:locale", lang === "ar" ? "ar_SA" : "en_US");

    if (ogImage) {
      const imageUrl = ogImage.startsWith("http") ? ogImage : `${window.location.origin}${ogImage}`;
      setMeta("property", "og:image", imageUrl);
      setMeta("property", "og:image:width", "1200");
      setMeta("property", "og:image:height", "630");
      setMeta("name", "twitter:image", imageUrl);
      setMeta("name", "twitter:card", "summary_large_image");
    }

    setMeta("property", "og:url", canonical || window.location.href);
    setMeta("property", "og:site_name", "Altohaa");
    setMeta("name", "twitter:card", ogImage ? "summary_large_image" : "summary");
    setMeta("name", "theme-color", "#1a1a2e");

    // Robots noindex
    if (noIndex) {
      setMeta("name", "robots", "noindex, nofollow");
    } else {
      const robotsEl = document.querySelector('meta[name="robots"]');
      if (robotsEl) robotsEl.remove();
    }

    // Canonical link
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonical || window.location.href);

    // JSON-LD
    const existingLd = document.querySelector('script[data-seo-ld]');
    if (existingLd) existingLd.remove();
    if (jsonLd) {
      const script = document.createElement("script");
      script.setAttribute("type", "application/ld+json");
      script.setAttribute("data-seo-ld", "true");
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      // Cleanup JSON-LD on unmount
      const ld = document.querySelector('script[data-seo-ld]');
      if (ld) ld.remove();
    };
  }, [title, description, ogImage, ogType, canonical, jsonLd, noIndex, lang]);

  return null;
}
