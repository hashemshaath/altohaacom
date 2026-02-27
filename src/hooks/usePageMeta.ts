import { useEffect } from "react";

interface PageMeta {
  title: string;
  description?: string;
  ogImage?: string;
}

/**
 * Sets document title and meta tags for SEO.
 * Cleans up on unmount.
 */
export function usePageMeta({ title, description, ogImage }: PageMeta) {
  useEffect(() => {
    const prev = document.title;
    document.title = `${title} | الطهاة - Altoha`;

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(name.startsWith("og:") ? "property" : "name", name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    if (description) {
      setMeta("description", description);
      setMeta("og:description", description);
    }
    setMeta("og:title", title);
    if (ogImage) setMeta("og:image", ogImage);

    return () => { document.title = prev; };
  }, [title, description, ogImage]);
}
