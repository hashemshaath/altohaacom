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
  /** Additional keywords for meta keywords tag */
  keywords?: string;
  /** Article-specific: published time */
  publishedTime?: string;
  /** Article-specific: modified time */
  modifiedTime?: string;
  /** Article-specific: author name */
  author?: string;
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
  keywords,
  publishedTime,
  modifiedTime,
  author,
}: SEOHeadProps) {
  useEffect(() => {
    // Title - keep under 60 chars
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

    // Alternate language
    const altLang = lang === "ar" ? "en_US" : "ar_SA";
    setMeta("property", "og:locale:alternate", altLang);

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

    // Keywords
    if (keywords) {
      setMeta("name", "keywords", keywords);
    }

    // Article-specific meta
    if (ogType === "article") {
      if (publishedTime) setMeta("property", "article:published_time", publishedTime);
      if (modifiedTime) setMeta("property", "article:modified_time", modifiedTime);
      if (author) setMeta("property", "article:author", author);
    }

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

    // Alternate language link
    let altLink = document.querySelector('link[rel="alternate"][hreflang]') as HTMLLinkElement | null;
    if (!altLink) {
      altLink = document.createElement("link");
      altLink.setAttribute("rel", "alternate");
      document.head.appendChild(altLink);
    }
    const altHreflang = lang === "ar" ? "en" : "ar";
    altLink.setAttribute("hreflang", altHreflang);
    altLink.setAttribute("href", canonical || window.location.href);

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
      const ld = document.querySelector('script[data-seo-ld]');
      if (ld) ld.remove();
    };
  }, [title, description, ogImage, ogType, canonical, jsonLd, noIndex, lang, keywords, publishedTime, modifiedTime, author]);

  return null;
}
