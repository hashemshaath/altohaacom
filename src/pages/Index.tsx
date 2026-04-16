import { ROUTES } from "@/config/routes";
import { useIsAr } from "@/hooks/useIsAr";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import { HeroSection } from "@/components/home/sections/HeroSection";
import { useLanguage } from "@/i18n/LanguageContext";
import { useHomepageSections } from "@/hooks/useHomepageSections";
import { useHomepageDataPrefetch } from "@/hooks/useHomepageDataPrefetch";
import { useRoutePrefetch } from "@/hooks/useRoutePrefetch";
import { useWebVitals } from "@/hooks/useWebVitals";
import { HomeSectionsRenderer } from "@/pages/home/HomeSectionsRenderer";

/* ─── Fallbacks ─── */

function HomeEmergencyHero({ language }: { language: string }) {
  const isAr = language === "ar";
  return (
    <section className="bg-background">
      <div className="container py-16 lg:py-28 text-center">
        <h1 className="text-h1 lg:text-display tracking-tight text-foreground mb-4">
          {isAr ? "مرحباً بك في مجتمع الطهاة" : "Welcome to the Culinary Community"}
        </h1>
        <p className="text-body text-muted-foreground max-w-lg mx-auto mb-8">
          {isAr ? "اكتشف المسابقات والمعارض والطهاة حول العالم" : "Discover competitions, exhibitions, and chefs worldwide"}
        </p>
        <div className="flex gap-3 justify-center">
          <Link to={ROUTES.competitions} className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-semibold px-6 py-3 text-sm hover:opacity-90 transition-opacity">
            {isAr ? "المسابقات" : "Competitions"}
          </Link>
          <Link to={ROUTES.exhibitions} className="inline-flex items-center justify-center rounded-xl border border-border text-foreground font-semibold px-6 py-3 text-sm hover:bg-muted/50 transition-opacity">
            {isAr ? "المعارض" : "Exhibitions"}
          </Link>
        </div>
      </div>
    </section>
  );
}

function HomeEmergencySections({ language }: { language: string }) {
  return (
    <section className="bg-muted/30">
      <div className="container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2].map((card) => (
            <div key={card} className="rounded-2xl bg-card border border-border/40 p-6 animate-pulse">
              <div className="h-5 w-2/3 rounded bg-muted mb-3" />
              <div className="h-3 w-full rounded bg-muted/60 mb-2" />
              <div className="h-3 w-4/5 rounded bg-muted/40" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Main ─── */

const Index = () => {
  const { language } = useLanguage();
  const isAr = useIsAr();

  useHomepageDataPrefetch();
  useRoutePrefetch();
  useWebVitals();

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
      ? "منصة الطهاة العالمية — اكتشف معارض الطعام والمشروبات، مسابقات الطهي، الجمعيات والأكاديميات الطهية حول العالم."
      : "Join the world's leading chef community. Discover global food & beverage exhibitions, cooking competitions, culinary academies, and chef associations.";
    const keywords = isAr
      ? "طهاة, مجتمع الطهي, معارض الطعام, مسابقات الطهي"
      : "chefs, culinary community, food exhibitions, cooking competitions";
    return { title, description, keywords };
  }, [isAr]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      
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
            logo: { "@type": "ImageObject", url: "https://altoha.com/og-image.png", width: 1200, height: 630 },
            description: seo.description,
            sameAs: [
              "https://www.instagram.com/altohaglobal",
              "https://www.facebook.com/altohaglobal",
              "https://x.com/altohaglobal",
              "https://www.linkedin.com/company/altoha",
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: isAr ? "الطهاة" : "AlToha",
            url: "https://altoha.com",
            inLanguage: ["en", "ar"],
            potentialAction: {
              "@type": "SearchAction",
              target: { "@type": "EntryPoint", urlTemplate: "https://altoha.com/search?q={search_term_string}" },
              "query-input": "required name=search_term_string",
            },
          },
        ]}
      />

      <ErrorBoundary fallback={<HomeEmergencyHero language={language} />}>
        <Header />
      </ErrorBoundary>

      <main className="flex-1" role="main" aria-label={isAr ? "المحتوى الرئيسي" : "Homepage content"}>
        <SectionErrorBoundary name="hero">
          {showHero ? <HeroSection /> : <HomeEmergencyHero language={language} />}
        </SectionErrorBoundary>

        <SectionErrorBoundary name="home-sections">
          {isError ? (
            <HomeEmergencySections language={language} />
          ) : (
            <HomeSectionsRenderer sections={dbSections} />
          )}
        </SectionErrorBoundary>
      </main>

      <SectionErrorBoundary name="footer" variant="compact">
        <Footer />
      </SectionErrorBoundary>
    </div>
  );
};

export default Index;
