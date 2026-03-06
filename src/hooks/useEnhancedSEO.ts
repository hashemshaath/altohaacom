import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Manages dynamic SEO meta tags based on current route.
 * Adds structured data, canonical URLs, and optimized meta.
 */
const routeMeta: Record<string, { title: string; titleAr: string; description: string; descriptionAr: string; type?: string }> = {
  "/": { title: "Altoha — Professional Culinary Network", titleAr: "الطهاة — شبكة الطهاة المحترفين", description: "Join the leading culinary competition and networking platform for professional chefs worldwide.", descriptionAr: "انضم إلى منصة مسابقات الطهي الرائدة وشبكة الطهاة المحترفين حول العالم.", type: "website" },
  "/competitions": { title: "Culinary Competitions — Altoha", titleAr: "مسابقات الطهي — الطهاة", description: "Browse and join culinary competitions worldwide. Compete with top chefs.", descriptionAr: "تصفح وانضم لمسابقات الطهي حول العالم. تنافس مع أفضل الطهاة.", type: "CollectionPage" },
  "/discover": { title: "Discover Competitions — Altoha", titleAr: "اكتشف المسابقات — الطهاة", description: "Discover upcoming culinary competitions and events near you.", descriptionAr: "اكتشف مسابقات الطهي والفعاليات القادمة بالقرب منك.", type: "CollectionPage" },
  "/shop": { title: "Culinary Shop — Altoha", titleAr: "متجر الطهي — الطهاة", description: "Shop professional culinary tools, books, and ingredients.", descriptionAr: "تسوق أدوات الطهي الاحترافية والكتب والمكونات.", type: "Store" },
  "/recipes": { title: "Recipes — Altoha", titleAr: "الوصفات — الطهاة", description: "Discover professional recipes from top chefs.", descriptionAr: "اكتشف وصفات احترافية من أفضل الطهاة.", type: "CollectionPage" },
  "/community": { title: "Chef Community — Altoha", titleAr: "مجتمع الطهاة — الطهاة", description: "Connect with fellow chefs, share recipes, and discuss culinary arts.", descriptionAr: "تواصل مع الطهاة وشارك الوصفات وناقش فنون الطهي.", type: "CollectionPage" },
  "/exhibitions": { title: "Culinary Exhibitions — Altoha", titleAr: "معارض الطهي — الطهاة", description: "Explore culinary exhibitions and food events worldwide.", descriptionAr: "استكشف معارض الطهي والفعاليات الغذائية حول العالم.", type: "CollectionPage" },
  "/masterclasses": { title: "Masterclasses — Altoha", titleAr: "الدروس المتقدمة — الطهاة", description: "Learn from expert chefs through professional masterclasses.", descriptionAr: "تعلم من طهاة خبراء عبر دروس احترافية متقدمة.", type: "CollectionPage" },
  "/rankings": { title: "Chef Rankings — Altoha", titleAr: "تصنيف الطهاة — الطهاة", description: "Global chef rankings based on competition performance.", descriptionAr: "تصنيف الطهاة العالمي بناءً على أداء المسابقات.", type: "CollectionPage" },
  "/suppliers": { title: "Culinary Suppliers — Altoha", titleAr: "موردي الطهي — الطهاة", description: "Find trusted culinary suppliers and equipment providers.", descriptionAr: "اعثر على موردي الطهي الموثوقين ومزودي المعدات.", type: "CollectionPage" },
  "/news": { title: "Culinary News — Altoha", titleAr: "أخبار الطهي — الطهاة", description: "Latest culinary news, events, and industry updates.", descriptionAr: "آخر أخبار الطهي والفعاليات وتحديثات الصناعة.", type: "CollectionPage" },
  "/tastings": { title: "Chef's Table Tastings — Altoha", titleAr: "تذوق طاولة الشيف — الطهاة", description: "Exclusive chef's table tasting experiences with top chefs.", descriptionAr: "تجارب تذوق حصرية على طاولة الشيف مع أفضل الطهاة.", type: "CollectionPage" },
};

export function useEnhancedSEO(language: string) {
  const location = useLocation();
  const isAr = language === "ar";

  useEffect(() => {
    const path = location.pathname;
    const meta = routeMeta[path];
    if (!meta) return;

    // Set canonical URL
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `${window.location.origin}${path}`;

    // Set hreflang alternates
    ["en", "ar"].forEach(lang => {
      const id = `hreflang-${lang}`;
      let link = document.getElementById(id) as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.id = id;
        link.rel = "alternate";
        link.hreflang = lang;
        document.head.appendChild(link);
      }
      link.href = `${window.location.origin}${path}?lang=${lang}`;
    });

    // Set Open Graph tags
    const ogTags: Record<string, string> = {
      "og:title": isAr ? meta.titleAr : meta.title,
      "og:description": isAr ? meta.descriptionAr : meta.description,
      "og:url": `${window.location.origin}${path}`,
      "og:type": meta.type === "website" ? "website" : "article",
      "og:site_name": "Altoha",
      "og:locale": isAr ? "ar_SA" : "en_US",
    };

    Object.entries(ogTags).forEach(([property, content]) => {
      let tag = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("property", property);
        document.head.appendChild(tag);
      }
      tag.content = content;
    });

    // Set Twitter card
    const twitterTags: Record<string, string> = {
      "twitter:card": "summary_large_image",
      "twitter:title": isAr ? meta.titleAr : meta.title,
      "twitter:description": isAr ? meta.descriptionAr : meta.description,
    };

    Object.entries(twitterTags).forEach(([name, content]) => {
      let tag = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.name = name;
        document.head.appendChild(tag);
      }
      tag.content = content;
    });

    // Inject JSON-LD
    const ldId = "enhanced-seo-jsonld";
    let script = document.getElementById(ldId) as HTMLScriptElement;
    if (!script) {
      script = document.createElement("script");
      script.id = ldId;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    
    const origin = window.location.origin;
    const jsonLdItems: any[] = [];

    // Primary page schema
    const pageSchema: any = {
      "@context": "https://schema.org",
      "@type": meta.type || "WebPage",
      name: isAr ? meta.titleAr : meta.title,
      description: isAr ? meta.descriptionAr : meta.description,
      url: `${origin}${path}`,
      inLanguage: isAr ? "ar" : "en",
      isPartOf: {
        "@type": "WebSite",
        name: "Altoha",
        url: origin,
      },
    };
    jsonLdItems.push(pageSchema);

    // Homepage-specific rich schemas
    if (path === "/") {
      jsonLdItems.push({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Altoha",
        url: origin,
        description: isAr
          ? "منصة الطهي الاحترافية الرائدة — مسابقات، معارض، تواصل بين الطهاة"
          : "The leading professional culinary platform — competitions, exhibitions, and chef networking",
        sameAs: [],
      });
      jsonLdItems.push({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Altoha",
        url: origin,
        potentialAction: {
          "@type": "SearchAction",
          target: `${origin}/discover?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      });
    }

    script.textContent = JSON.stringify(
      jsonLdItems.length === 1 ? jsonLdItems[0] : jsonLdItems
    );

    return () => {
      // Cleanup is handled by overwriting on next route
    };
  }, [location.pathname, isAr]);
}
