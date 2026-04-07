import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { RelatedPages } from "@/components/seo/RelatedPages";
import { HeroSection } from "@/components/home/sections/HeroSection";
import { useLanguage } from "@/i18n/LanguageContext";
import { useHomepageSections } from "@/hooks/useHomepageSections";
import { useHomepageDataPrefetch } from "@/hooks/useHomepageDataPrefetch";
import { HomeSectionsRenderer } from "@/pages/home/HomeSectionsRenderer";
import { Sparkles } from "lucide-react";

/* ─── Emergency Fallbacks ─── */

function HomeEmergencyHero({ language }: { language: string }) {
  const isAr = language === "ar";
  return (
    <section className="section-white">
      <div className="mx-auto max-w-[var(--container-max)] px-[var(--container-px-mobile)] lg:px-[var(--container-px)] py-12 lg:py-24 text-center">
        <h1 className="t-hero mb-4">
          {isAr ? "مرحباً بك في مجتمع الطهاة" : "Welcome to the Culinary Community"}
        </h1>
        <p className="t-body-lg max-w-lg mx-auto mb-7">
          {isAr
            ? "نقوم الآن بإعادة تحميل الصفحة الرئيسية بأمان لضمان عرض المحتوى بالكامل."
            : "We are safely rebuilding the homepage view to ensure all content appears correctly."}
        </p>
        <Link to="/search" className="btn btn-primary">
          {isAr ? "ابدأ البحث" : "Start searching"}
        </Link>
      </div>
    </section>
  );
}

function HomeEmergencySections({ language }: { language: string }) {
  const isAr = language === "ar";
  return (
    <section className="section-surface">
      <div className="mx-auto max-w-[var(--container-max)] px-[var(--container-px-mobile)] lg:px-[var(--container-px)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {[0, 1, 2].map((card) => (
            <article key={card} className="card-surface">
              <h2 className="t-h4 mb-2">
                {isAr ? `قسم رئيسي ${card + 1}` : `Homepage Section ${card + 1}`}
              </h2>
              <p className="t-small">
                {isAr ? "جارِ تحميل المحتوى..." : "Loading section content..."}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Main Component ─── */

const Index = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";

  useHomepageDataPrefetch();

  const { data: dbSections = [], isError } = useHomepageSections();

  const showHero = useMemo(() => {
    if (dbSections.length === 0) return true;
    return dbSections.find((s) => s.section_key === "hero")?.is_visible !== false;
  }, [dbSections]);

  const seo = useMemo(() => {
    const title = isAr
      ? "الطهاة | مجتمع الطهاة العالمي — مسابقات ومعارض وأكاديميات الطهي"
      : "AlToha | Global Chef Community — Culinary Competitions, Exhibitions & Academies";
    const description = isAr
      ? "منصة الطهاة العالمية — اكتشف معارض الطعام والمشروبات، مسابقات الطهي، الجمعيات والأكاديميات الطهية حول العالم. انضم لمجتمع الطهاة المحترفين."
      : "Join the world's leading chef community. Discover global food & beverage exhibitions, cooking competitions, culinary academies, and chef associations. Connect with professional chefs worldwide.";
    const keywords = isAr
      ? "طهاة, مجتمع الطهي, معارض الطعام, مسابقات الطهي, أكاديميات الطهي, جمعيات الطهاة, فعاليات الطهي, الطاهي المحترف, طبخ, فنون الطهي"
      : "chefs, culinary community, food exhibitions, cooking competitions, culinary academies, chef associations, culinary events, professional chef, gastronomy";
    return { title, description, keywords };
  }, [isAr]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-surface)]">
      <OfflineIndicator />
      <SEOHead
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        ogImage="https://altoha.com/og-image.png"
        canonical="https://altoha.com/"
        lang={language}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "AlToha",
            alternateName: "الطهاة",
            url: "https://altoha.com",
            logo: {
              "@type": "ImageObject",
              url: "https://altoha.com/og-image.png",
              width: 1200,
              height: 630,
            },
            description: seo.description,
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer support",
              url: "https://altoha.com/contact",
              availableLanguage: ["English", "Arabic"],
            },
            sameAs: [
              "https://www.instagram.com/altohaglobal",
              "https://www.facebook.com/altohaglobal",
              "https://x.com/altohaglobal",
              "https://www.linkedin.com/company/altoha",
              "https://www.youtube.com/@altohaglobal",
              "https://www.tiktok.com/@altohaglobal",
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: isAr ? "الطهاة" : "AlToha",
            alternateName: isAr ? "AlToha" : "الطهاة",
            url: "https://altoha.com",
            inLanguage: ["en", "ar"],
            description: seo.description,
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: "https://altoha.com/search?q={search_term_string}",
              },
              "query-input": "required name=search_term_string",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: isAr ? "الصفحة الرئيسية — الطهاة" : "Homepage — AlToha",
            description: seo.description,
            url: "https://altoha.com/",
            isPartOf: { "@type": "WebSite", url: "https://altoha.com" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: isAr ? "الرئيسية" : "Home", item: "https://altoha.com/" },
              ],
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "MobileApplication",
            name: "AlToha",
            operatingSystem: "Any",
            applicationCategory: "SocialNetworkingApplication",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            url: "https://altoha.com",
            description: isAr
              ? "تطبيق الطهاة — شبكة الطهي الاحترافية"
              : "AlToha — Professional Culinary Network App",
          },
        ]}
      />

      <Header />

      <main className="flex-1 safe-area-x" role="main" aria-label={isAr ? "المحتوى الرئيسي" : "Homepage content"}>
        {/* SECTION 1: Hero — bg-white */}
        <ErrorBoundary fallback={<HomeEmergencyHero language={language} />}>
          {showHero ? <HeroSection /> : <HomeEmergencyHero language={language} />}
        </ErrorBoundary>

        {/* Dynamic sections — rendered via HomeSectionsRenderer */}
        <ErrorBoundary fallback={<HomeEmergencySections language={language} />}>
          {isError ? (
            <HomeEmergencySections language={language} />
          ) : (
            <HomeSectionsRenderer sections={dbSections} />
          )}
        </ErrorBoundary>

        {/* Related pages */}
        <nav
          className="section-white"
          style={{ paddingBlock: "var(--space-8)" }}
          aria-label={isAr ? "صفحات ذات صلة" : "Related pages"}
        >
          <div className="mx-auto max-w-[var(--container-max)] px-[var(--container-px-mobile)] lg:px-[var(--container-px)]">
            <RelatedPages currentPath="/" />
          </div>
        </nav>
      </main>

      {/* Hairline before footer */}
      <div className="h-px bg-[var(--color-border-light)]" aria-hidden="true" />
      <Footer />
    </div>
  );
};

export default Index;
