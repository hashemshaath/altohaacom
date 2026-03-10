import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Manages dynamic SEO meta tags based on current route.
 * Adds structured data, canonical URLs, and optimized meta.
 */
const routeMeta: Record<string, { title: string; titleAr: string; description: string; descriptionAr: string; type?: string; keywords?: string }> = {
  "/": { title: "Altoha — Professional Culinary Network", titleAr: "الطهاة — شبكة الطهاة المحترفين", description: "Join the leading culinary competition and networking platform for professional chefs worldwide.", descriptionAr: "انضم إلى منصة مسابقات الطهي الرائدة وشبكة الطهاة المحترفين حول العالم.", type: "website", keywords: "culinary competitions, chef community, cooking, مسابقات الطهي" },
  "/competitions": { title: "Culinary Competitions — Altoha", titleAr: "مسابقات الطهي — الطهاة", description: "Browse and join culinary competitions worldwide. Compete with top chefs.", descriptionAr: "تصفح وانضم لمسابقات الطهي حول العالم. تنافس مع أفضل الطهاة.", type: "CollectionPage", keywords: "culinary competitions, chef contest, cooking competition" },
  "/discover": { title: "Discover Competitions — Altoha", titleAr: "اكتشف المسابقات — الطهاة", description: "Discover upcoming culinary competitions and events near you.", descriptionAr: "اكتشف مسابقات الطهي والفعاليات القادمة بالقرب منك.", type: "CollectionPage" },
  "/shop": { title: "Culinary Shop — Altoha", titleAr: "متجر الطهي — الطهاة", description: "Shop professional culinary tools, books, and ingredients.", descriptionAr: "تسوق أدوات الطهي الاحترافية والكتب والمكونات.", type: "Store", keywords: "culinary tools, chef equipment, cooking supplies" },
  "/recipes": { title: "Professional Recipes — Altoha", titleAr: "وصفات احترافية — الطهاة", description: "Discover professional recipes from award-winning chefs worldwide.", descriptionAr: "اكتشف وصفات احترافية من أفضل الطهاة حول العالم.", type: "CollectionPage", keywords: "recipes, professional cooking, chef recipes, وصفات" },
  "/community": { title: "Chef Community — Altoha", titleAr: "مجتمع الطهاة — الطهاة", description: "Connect with fellow chefs, share recipes, and discuss culinary arts.", descriptionAr: "تواصل مع الطهاة وشارك الوصفات وناقش فنون الطهي.", type: "CollectionPage" },
  "/exhibitions": { title: "Culinary Exhibitions — Altoha", titleAr: "معارض الطهي — الطهاة", description: "Explore culinary exhibitions and food events worldwide.", descriptionAr: "استكشف معارض الطهي والفعاليات الغذائية حول العالم.", type: "CollectionPage", keywords: "food exhibitions, culinary events, food shows" },
  "/masterclasses": { title: "Culinary Masterclasses — Altoha", titleAr: "الدروس المتقدمة — الطهاة", description: "Learn from expert chefs through professional culinary masterclasses.", descriptionAr: "تعلم من طهاة خبراء عبر دروس احترافية متقدمة.", type: "CollectionPage", keywords: "cooking masterclass, chef training, culinary education" },
  "/rankings": { title: "Chef Rankings — Altoha", titleAr: "تصنيف الطهاة — الطهاة", description: "Global chef rankings based on competition performance and achievements.", descriptionAr: "تصنيف الطهاة العالمي بناءً على أداء المسابقات والإنجازات.", type: "CollectionPage" },
  "/pro-suppliers": { title: "Culinary Suppliers — Altoha", titleAr: "موردي الطهي — الطهاة", description: "Find trusted culinary suppliers and equipment providers.", descriptionAr: "اعثر على موردي الطهي الموثوقين ومزودي المعدات.", type: "CollectionPage" },
  "/news": { title: "Culinary News — Altoha", titleAr: "أخبار الطهي — الطهاة", description: "Latest culinary news, events, and industry updates.", descriptionAr: "آخر أخبار الطهي والفعاليات وتحديثات الصناعة.", type: "CollectionPage", keywords: "culinary news, food industry, chef news" },
  "/chefs-table": { title: "Chef's Table Experiences — Altoha", titleAr: "تجارب طاولة الشيف — الطهاة", description: "Exclusive chef's table dining experiences with top chefs.", descriptionAr: "تجارب طعام حصرية على طاولة الشيف مع أفضل الطهاة.", type: "CollectionPage" },
  "/mentorship": { title: "Culinary Mentorship — Altoha", titleAr: "الإرشاد المهني — الطهاة", description: "Connect with experienced chef mentors for professional growth.", descriptionAr: "تواصل مع مرشدين خبراء للنمو المهني في الطهي.", type: "CollectionPage" },
  "/establishments": { title: "Culinary Establishments — Altoha", titleAr: "المؤسسات — الطهاة", description: "Discover top culinary establishments and restaurants.", descriptionAr: "اكتشف أفضل المؤسسات والمطاعم.", type: "CollectionPage" },
  "/organizers": { title: "Event Organizers — Altoha", titleAr: "المنظمون — الطهاة", description: "Browse culinary event organizers and competition hosts.", descriptionAr: "تصفح منظمي فعاليات الطهي ومضيفي المسابقات.", type: "CollectionPage" },
  "/events-calendar": { title: "Culinary Events Calendar — Altoha", titleAr: "تقويم الفعاليات — الطهاة", description: "Browse upcoming culinary events, competitions, and exhibitions worldwide.", descriptionAr: "تصفح الفعاليات والمسابقات والمعارض القادمة حول العالم.", type: "CollectionPage" },
  "/membership": { title: "Membership Plans — Altoha", titleAr: "خطط العضوية — الطهاة", description: "Join Altoha membership for exclusive benefits and features.", descriptionAr: "انضم لعضوية الطهاة للحصول على مزايا وميزات حصرية.", type: "WebPage" },
  "/about": { title: "About Altoha", titleAr: "عن الطهاة", description: "Learn about Altoha, the premier professional culinary network.", descriptionAr: "تعرف على الطهاة، الشبكة المهنية الرائدة للطهاة.", type: "AboutPage" },
  "/contact": { title: "Contact Us — Altoha", titleAr: "اتصل بنا — الطهاة", description: "Get in touch with the Altoha team for support and inquiries.", descriptionAr: "تواصل مع فريق الطهاة للدعم والاستفسارات.", type: "ContactPage" },
  "/help": { title: "Help Center — Altoha", titleAr: "مركز المساعدة — الطهاة", description: "Find answers to your questions about using Altoha.", descriptionAr: "اعثر على إجابات لأسئلتك حول استخدام الطهاة.", type: "WebPage" },
  "/for-chefs": { title: "For Chefs — Altoha", titleAr: "للطهاة — الطهاة", description: "Join Altoha as a professional chef. Compete, learn, and grow your career.", descriptionAr: "انضم كطاهٍ محترف. تنافس وتعلم وطوّر مسيرتك.", type: "WebPage" },
  "/for-companies": { title: "For Companies — Altoha", titleAr: "للشركات — الطهاة", description: "Partner with Altoha for culinary talent, sponsorships, and brand visibility.", descriptionAr: "تشارك مع الطهاة للمواهب والرعايات والظهور.", type: "WebPage" },
  "/for-organizers": { title: "For Organizers — Altoha", titleAr: "للمنظمين — الطهاة", description: "Organize culinary competitions and events with Altoha's platform.", descriptionAr: "نظم مسابقات وفعاليات الطهي عبر منصة الطهاة.", type: "WebPage" },
  "/sponsors": { title: "For Sponsors — Altoha", titleAr: "للرعاة — الطهاة", description: "Sponsor culinary competitions and reach professional chefs globally.", descriptionAr: "ارعَ مسابقات الطهي وتواصل مع الطهاة المحترفين عالمياً.", type: "WebPage" },
  "/search": { title: "Search — Altoha", titleAr: "البحث — الطهاة", description: "Search for chefs, competitions, recipes, and culinary content.", descriptionAr: "ابحث عن الطهاة والمسابقات والوصفات والمحتوى.", type: "SearchResultsPage" },
  "/jobs": { title: "Culinary Jobs — Altoha", titleAr: "وظائف الطهي — الطهاة", description: "Browse culinary job opportunities from top restaurants and hotels.", descriptionAr: "تصفح فرص العمل في الطهي من أفضل المطاعم والفنادق.", type: "CollectionPage", keywords: "culinary jobs, chef jobs, restaurant careers" },
  "/privacy": { title: "Privacy Policy — Altoha", titleAr: "سياسة الخصوصية — الطهاة", description: "Altoha privacy policy and data protection practices.", descriptionAr: "سياسة الخصوصية وحماية البيانات في الطهاة.", type: "WebPage" },
  "/terms": { title: "Terms & Conditions — Altoha", titleAr: "الشروط والأحكام — الطهاة", description: "Terms and conditions for using the Altoha platform.", descriptionAr: "الشروط والأحكام لاستخدام منصة الطهاة.", type: "WebPage" },
  "/cookies": { title: "Cookie Policy — Altoha", titleAr: "سياسة ملفات تعريف الارتباط — الطهاة", description: "Cookie policy and tracking information for Altoha.", descriptionAr: "سياسة ملفات تعريف الارتباط في الطهاة.", type: "WebPage" },
  "/verify/certificate": { title: "Verify Certificate — Altoha", titleAr: "التحقق من الشهادة — الطهاة", description: "Verify the authenticity of an Altoha culinary certificate.", descriptionAr: "تحقق من صحة شهادة الطهاة.", type: "WebPage" },
  "/install": { title: "Install Altoha App", titleAr: "تثبيت تطبيق الطهاة", description: "Install the Altoha progressive web app on your device.", descriptionAr: "ثبّت تطبيق الطهاة على جهازك.", type: "WebPage" },
};

export function useEnhancedSEO(language: string) {
  const location = useLocation();
  const isAr = language === "ar";

  useEffect(() => {
    const path = location.pathname;
    const meta = routeMeta[path];
    if (!meta) return;

    const origin = window.location.origin;
    const fullUrl = `${origin}${path}`;

    // Set canonical URL
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = fullUrl;

    // Set hreflang alternates (en, ar, x-default)
    ["en", "ar", "x-default"].forEach(lang => {
      const id = `hreflang-${lang}`;
      let link = document.getElementById(id) as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.id = id;
        link.rel = "alternate";
        link.hreflang = lang;
        document.head.appendChild(link);
      }
      link.href = lang === "x-default" ? fullUrl : `${fullUrl}?lang=${lang}`;
    });

    // Set description meta
    const setMeta = (attr: string, key: string, content: string) => {
      let tag = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attr, key);
        document.head.appendChild(tag);
      }
      tag.content = content;
    };

    const title = isAr ? meta.titleAr : meta.title;
    const desc = isAr ? meta.descriptionAr : meta.description;

    // Set document title (critical for SEO + browser tabs)
    document.title = title;

    // Standard meta
    setMeta("name", "description", desc);
    if (meta.keywords) setMeta("name", "keywords", meta.keywords);

    // Open Graph tags
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:url", fullUrl);
    setMeta("property", "og:type", meta.type === "website" ? "website" : "article");
    setMeta("property", "og:site_name", "Altoha");
    setMeta("property", "og:locale", isAr ? "ar_SA" : "en_US");
    setMeta("property", "og:locale:alternate", isAr ? "en_US" : "ar_SA");

    // Twitter card
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", desc);

    // Inject JSON-LD (remove page-level SEOHead LD first to avoid duplicates)
    const existingPageLd = document.querySelector('script[data-seo-ld]');
    if (existingPageLd) existingPageLd.remove();
    
    const ldId = "enhanced-seo-jsonld";
    let script = document.getElementById(ldId) as HTMLScriptElement;
    if (!script) {
      script = document.createElement("script");
      script.id = ldId;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    
    const jsonLdItems: any[] = [];

    // Related links for this page (SEO relatedLink signal)
    const relatedLinks: Record<string, string[]> = {
      "/": ["/competitions", "/recipes", "/news", "/exhibitions", "/rankings", "/jobs"],
      "/competitions": ["/discover", "/rankings", "/events-calendar", "/masterclasses"],
      "/recipes": ["/community", "/masterclasses", "/shop", "/competitions"],
      "/news": ["/competitions", "/exhibitions", "/community", "/recipes"],
      "/community": ["/recipes", "/news", "/mentorship", "/rankings"],
      "/exhibitions": ["/competitions", "/events-calendar", "/organizers", "/pro-suppliers"],
      "/masterclasses": ["/recipes", "/competitions", "/mentorship", "/community"],
      "/rankings": ["/competitions", "/masterclasses", "/community", "/discover"],
      "/establishments": ["/jobs", "/pro-suppliers", "/rankings", "/competitions"],
      "/jobs": ["/establishments", "/rankings", "/community", "/membership"],
      "/shop": ["/pro-suppliers", "/recipes", "/masterclasses"],
      "/mentorship": ["/masterclasses", "/community", "/rankings", "/competitions"],
      "/events-calendar": ["/competitions", "/exhibitions", "/organizers"],
    };

    // Primary page schema with relatedLink
    const pageSchema: any = {
      "@context": "https://schema.org",
      "@type": meta.type || "WebPage",
      name: title,
      description: desc,
      url: fullUrl,
      inLanguage: isAr ? "ar" : "en",
      isPartOf: {
        "@type": "WebSite",
        name: "Altoha",
        url: origin,
      },
    };
    if (relatedLinks[path]) {
      pageSchema.relatedLink = relatedLinks[path].map(p => `${origin}${p}`);
    }
    jsonLdItems.push(pageSchema);

    // BreadcrumbList for non-homepage
    if (path !== "/") {
      const segments = path.split("/").filter(Boolean);
      const breadcrumbs = [
        { "@type": "ListItem", position: 1, name: "Home", item: origin },
      ];
      let currentPath = "";
      segments.forEach((seg, i) => {
        currentPath += `/${seg}`;
        breadcrumbs.push({
          "@type": "ListItem",
          position: i + 2,
          name: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "),
          item: `${origin}${currentPath}`,
        });
      });
      jsonLdItems.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs,
      });
    }

    // Homepage-specific rich schemas
    if (path === "/") {
      jsonLdItems.push({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Altoha",
        alternateName: "الطهاة",
        url: origin,
        logo: {
          "@type": "ImageObject",
          url: `${origin}/og-image.png`,
          width: 1200,
          height: 630,
        },
        description: isAr
          ? "منصة الطهي الاحترافية الرائدة — مسابقات، معارض، تواصل بين الطهاة"
          : "The leading professional culinary platform — competitions, exhibitions, and chef networking",
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          url: `${origin}/contact`,
          availableLanguage: ["English", "Arabic"],
        },
        sameAs: [],
      });
      jsonLdItems.push({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Altoha",
        alternateName: "الطهاة",
        url: origin,
        inLanguage: ["en", "ar"],
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${origin}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      });
    }

    script.textContent = JSON.stringify(
      jsonLdItems.length === 1 ? jsonLdItems[0] : jsonLdItems
    );

    return () => {
      // Cleanup handled by overwrite on next route
    };
  }, [location.pathname, isAr]);
}
