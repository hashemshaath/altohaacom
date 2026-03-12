import { useMemo } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { RelatedPages } from "@/components/seo/RelatedPages";
import { HeroSection } from "@/components/home/sections/HeroSection";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAdTracking } from "@/hooks/useAdTracking";
import { useHomepageSections } from "@/hooks/useHomepageSections";
import { HomeSectionsRenderer } from "@/pages/home/HomeSectionsRenderer";

const Index = () => {
  const { language } = useLanguage();
  useAdTracking();

  const { data: dbSections = [] } = useHomepageSections();

  const showHero = useMemo(() => {
    if (dbSections.length === 0) return true;
    return dbSections.find((s) => s.section_key === "hero")?.is_visible !== false;
  }, [dbSections]);

  const seo = useMemo(() => {
    const title =
      language === "ar"
        ? "الطهاة | المجتمع الطهوي العالمي"
        : "Altoha | Global Culinary Community";
    const description =
      language === "ar"
        ? "المنصة الأولى للطهاة والحكام والمنظمين ومحترفي صناعة الأغذية حول العالم."
        : "The premier platform for chefs, judges, organizers, and food industry professionals worldwide.";
    const keywords =
      language === "ar"
        ? "طهاة, مسابقات طهي, وصفات, معارض أغذية, تصنيف الطهاة, مجتمع الطهاة"
        : "chefs, culinary competitions, recipes, food exhibitions, chef rankings, culinary community";
    return { title, description, keywords };
  }, [language]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <OfflineIndicator />
      <SEOHead
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        ogImage="/pwa-512x512.png"
        canonical={`${window.location.origin}/`}
        lang={language}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Altoha",
          url: window.location.origin,
          description: seo.description,
          potentialAction: {
            "@type": "SearchAction",
            target: `${window.location.origin}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }}
      />

      <Header />

      <main className="flex-1" aria-label="Homepage content">
        {showHero && <HeroSection />}
        <HomeSectionsRenderer sections={dbSections} />
        <div className="container pb-10">
          <RelatedPages currentPath="/" />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
