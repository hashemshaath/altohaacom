import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { HeroSection } from "@/components/home/sections/HeroSection";
import { useLanguage } from "@/i18n/LanguageContext";
import { useHomepageSections } from "@/hooks/useHomepageSections";
import { useHomepageDataPrefetch } from "@/hooks/useHomepageDataPrefetch";
import { HomeSectionsRenderer } from "@/pages/home/HomeSectionsRenderer";

/* ─── Fallbacks ─── */

function HomeEmergencyHero({ language }: { language: string }) {
  const isAr = language === "ar";
  return (
    <section className="bg-background">
      <div className="container py-16 lg:py-28 text-center">
        <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight text-foreground mb-4">
          {isAr ? "مرحباً بك في مجتمع الطهاة" : "Welcome to the Culinary Community"}
        </h1>
        <p className="text-base text-muted-foreground max-w-lg mx-auto mb-8">
          {isAr
            ? "جارِ تحميل المحتوى..."
            : "Loading content..."}
        </p>
        <Link to="/search" className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-semibold px-6 py-3 text-sm hover:opacity-90 transition-opacity">
          {isAr ? "ابدأ البحث" : "Start searching"}
        </Link>
      </div>
    </section>
  );
}

function HomeEmergencySections({ language }: { language: string }) {
  const isAr = language === "ar";
  return (
    <section className="bg-muted/30">
      <div className="container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2].map((card) => (
            <div key={card} className="rounded-2xl bg-card border border-border/40 p-6">
              <h2 className="text-lg font-bold text-foreground mb-2">
                {isAr ? `قسم ${card + 1}` : `Section ${card + 1}`}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isAr ? "جارِ تحميل المحتوى..." : "Loading..."}
              </p>
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
      ? "منصة الطهاة العالمية — اكتشف معارض الطعام والمشروبات، مسابقات الطهي، الجمعيات والأكاديميات الطهية حول العالم."
      : "Join the world's leading chef community. Discover global food & beverage exhibitions, cooking competitions, culinary academies, and chef associations.";
    const keywords = isAr
      ? "طهاة, مجتمع الطهي, معارض الطعام, مسابقات الطهي"
      : "chefs, culinary community, food exhibitions, cooking competitions";
    return { title, description, keywords };
  }, [isAr]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
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

      <Header />

      <main className="flex-1" role="main" aria-label={isAr ? "المحتوى الرئيسي" : "Homepage content"}>
        <ErrorBoundary fallback={<HomeEmergencyHero language={language} />}>
          {showHero ? <HeroSection /> : <HomeEmergencyHero language={language} />}
        </ErrorBoundary>

        <ErrorBoundary fallback={<HomeEmergencySections language={language} />}>
          {isError ? (
            <HomeEmergencySections language={language} />
          ) : (
            <HomeSectionsRenderer sections={dbSections} />
          )}
        </ErrorBoundary>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
