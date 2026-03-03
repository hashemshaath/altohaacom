import { lazy, Suspense, useMemo, useEffect, ComponentType } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { SEOHead } from "@/components/SEOHead";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { useAdTracking } from "@/hooks/useAdTracking";
import { prefetchCommonRoutes } from "@/lib/prefetch";
import { useHomepageSections, type HomepageSection } from "@/hooks/useHomepageSections";
import { Skeleton } from "@/components/ui/skeleton";

// Section components
import { HeroSection } from "@/components/home/sections/HeroSection";

const StatsBar = lazy(() => import("@/components/home/sections/StatsBar"));
const FeaturedChefsSection = lazy(() => import("@/components/home/sections/FeaturedChefsSection"));
const CompetitionsSection = lazy(() => import("@/components/home/sections/CompetitionsSection"));
const ArticlesSection = lazy(() => import("@/components/home/sections/ArticlesSection"));
const StatsPartnersSection = lazy(() => import("@/components/home/sections/StatsPartnersSection"));
const NewsletterSignup = lazy(() => import("@/components/home/NewsletterSignup").then(m => ({ default: m.NewsletterSignup })));
const GenericHomepageSection = lazy(() => import("@/components/home/sections/GenericHomepageSection"));

const SectionFallback = () => (
  <div className="container py-16">
    <div className="space-y-4">
      <Skeleton className="h-6 w-48 mx-auto rounded-xl" />
      <Skeleton className="h-4 w-72 mx-auto rounded-lg" />
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-8">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
        ))}
      </div>
    </div>
  </div>
);

/* Map section_key → dedicated lazy component (if available) */
const DEDICATED_SECTIONS: Record<string, React.LazyExoticComponent<any>> = {
  stats: StatsBar,
  featured_chefs: FeaturedChefsSection,
  events_by_category: CompetitionsSection,
  articles: ArticlesSection,
  partners: StatsPartnersSection,
  sponsors: StatsPartnersSection,
  newsletter: NewsletterSignup,
};

const Index = () => {
  const { language } = useLanguage();
  useAdTracking();
  useEffect(() => { prefetchCommonRoutes(); }, []);
  const { data: sections = [] } = useHomepageSections();

  /* Build dynamic sections following DB sort_order — ALL visible sections render */
  const dynamicSections = useMemo(() => {
    if (sections.length > 0) {
      return sections
        .filter(s => s.is_visible && s.section_key !== "hero")
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(s => {
          const Dedicated = DEDICATED_SECTIONS[s.section_key];
          if (Dedicated) {
            return (
              <Suspense key={s.section_key} fallback={<SectionFallback />}>
                <Dedicated />
              </Suspense>
            );
          }
          // Render generic section for keys without a dedicated component
          return (
            <Suspense key={s.section_key} fallback={<SectionFallback />}>
              <GenericHomepageSection sectionKey={s.section_key} />
            </Suspense>
          );
        });
    }

    // Fallback when no sections configured
    const fallbackKeys = Object.keys(DEDICATED_SECTIONS);
    return fallbackKeys.map(key => {
      const Comp = DEDICATED_SECTIONS[key];
      return (
        <Suspense key={key} fallback={<SectionFallback />}>
          <Comp />
        </Suspense>
      );
    });
  }, [sections]);

  return (
    <div className="flex min-h-screen flex-col bg-background" role="document">
      <OfflineIndicator />
      <SEOHead
        title="Altoha — The Global Culinary Community"
        description="The premier platform for chefs, judges, organizers, and food industry professionals."
        ogImage="/pwa-512x512.png"
        lang={language}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Altoha",
          url: window.location.origin,
          description: "The premier culinary community platform.",
          potentialAction: {
            "@type": "SearchAction",
            target: `${window.location.origin}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <Header />

      <main className="flex flex-col">
        {/* Hero — always first */}
        {sections.find(s => s.section_key === "hero")?.is_visible !== false && <HeroSection />}

        {/* All other sections in DB sort_order */}
        {dynamicSections}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
