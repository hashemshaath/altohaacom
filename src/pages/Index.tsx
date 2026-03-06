import React, { lazy, Suspense, useMemo, useEffect } from "react";

/** Thin wrapper to prevent React from attaching refs to lazy function components */
function SectionWrapper({ Component }: { Component: React.LazyExoticComponent<any> }) {
  return <Component />;
}
import { useLanguage } from "@/i18n/LanguageContext";
import { SEOHead } from "@/components/SEOHead";
import { SectionKeyProvider } from "@/components/home/SectionKeyContext";
import { HomepageSectionShell } from "@/components/home/HomepageSectionShell";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { useAdTracking } from "@/hooks/useAdTracking";
import { prefetchCommonRoutes } from "@/lib/prefetch";
import { useHomepageSections } from "@/hooks/useHomepageSections";
import { Skeleton } from "@/components/ui/skeleton";

// ── Eager-loaded critical section ──
import { HeroSection } from "@/components/home/sections/HeroSection";

// ── Lazy-loaded section components ──
const HomeSearch = lazy(() => import("@/components/home/HomeSearch").then(m => ({ default: m.HomeSearch })));
const StatsBar = lazy(() => import("@/components/home/sections/StatsBar"));
const CompetitionsSection = lazy(() => import("@/components/home/sections/CompetitionsSection"));
const RegionalEvents = lazy(() => import("@/components/home/RegionalEvents").then(m => ({ default: m.RegionalEvents })));
const HomeEventsCalendarPreview = lazy(() => import("@/components/home/HomeEventsCalendarPreview").then(m => ({ default: m.HomeEventsCalendarPreview })));
const FeaturedChefsSection = lazy(() => import("@/components/home/sections/FeaturedChefsSection"));
const NewlyJoinedUsers = lazy(() => import("@/components/home/NewlyJoinedUsers").then(m => ({ default: m.NewlyJoinedUsers })));
const StatsPartnersSection = lazy(() => import("@/components/home/sections/StatsPartnersSection"));
const HomeProSuppliers = lazy(() => import("@/components/home/HomeProSuppliers").then(m => ({ default: m.HomeProSuppliers })));
const HomeMasterclasses = lazy(() => import("@/components/home/HomeMasterclasses").then(m => ({ default: m.HomeMasterclasses })));
const ArticlesSection = lazy(() => import("@/components/home/sections/ArticlesSection"));
const HomeTrendingContent = lazy(() => import("@/components/home/HomeTrendingContent").then(m => ({ default: m.HomeTrendingContent })));
const SponsorshipOpportunities = lazy(() => import("@/components/home/SponsorshipOpportunities").then(m => ({ default: m.SponsorshipOpportunities })));
const HomeTestimonials = lazy(() => import("@/components/home/HomeTestimonials").then(m => ({ default: m.HomeTestimonials })));
const PlatformFeatures = lazy(() => import("@/components/home/PlatformFeatures").then(m => ({ default: m.PlatformFeatures })));
const NewsletterSignup = lazy(() => import("@/components/home/NewsletterSignup").then(m => ({ default: m.NewsletterSignup })));
const HomeQuickActions = lazy(() => import("@/components/home/HomeQuickActions").then(m => ({ default: m.HomeQuickActions })));
const GenericHomepageSection = lazy(() => import("@/components/home/sections/GenericHomepageSection"));

// ── Section key → component mapping ──
const SECTION_COMPONENTS: Record<string, React.LazyExoticComponent<any>> = {
  search: HomeSearch,
  stats: StatsBar,
  events_by_category: CompetitionsSection,
  regional_events: RegionalEvents,
  events_calendar: HomeEventsCalendarPreview,
  featured_chefs: FeaturedChefsSection,
  newly_joined: NewlyJoinedUsers,
  sponsors: StatsPartnersSection,
  partners: StatsPartnersSection,
  pro_suppliers: HomeProSuppliers,
  masterclasses: HomeMasterclasses,
  articles: ArticlesSection,
  trending_content: HomeTrendingContent,
  sponsorships: SponsorshipOpportunities,
  testimonials: HomeTestimonials,
  features: PlatformFeatures,
  platform_features: PlatformFeatures,
  newsletter: NewsletterSignup,
  quick_actions: HomeQuickActions,
};

// ── Section loading skeleton ──
const SectionSkeleton = () => (
  <div className="container py-8">
    <div className="space-y-3">
      <Skeleton className="h-4 w-32 rounded-lg" />
      <Skeleton className="h-6 w-56 rounded-xl" />
      <div className="flex gap-3 mt-4 overflow-hidden">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="aspect-[4/3] w-[72vw] sm:w-[45vw] md:w-[32vw] lg:w-[24vw] shrink-0 rounded-2xl" />
        ))}
      </div>
    </div>
  </div>
);

// ── Default section order (used when DB has no data) ──
const DEFAULT_SECTION_KEYS = [
  "search", "stats", "events_by_category", "featured_chefs",
  "pro_suppliers", "masterclasses", "articles", "sponsors",
  "testimonials", "features", "newsletter",
];

const Index = () => {
  const { language } = useLanguage();
  useAdTracking();
  useEffect(() => { prefetchCommonRoutes(); }, []);

  const { data: dbSections = [] } = useHomepageSections();

  // Build the ordered list of section elements
  const renderedSections = useMemo(() => {
    const sectionList = dbSections.length > 0
      ? dbSections
          .filter(s => s.is_visible && s.section_key !== "hero")
          .sort((a, b) => a.sort_order - b.sort_order)
      : DEFAULT_SECTION_KEYS.map((key, i) => ({
          section_key: key,
          is_visible: true,
          sort_order: i + 1,
        }));

    return sectionList.map((s) => {
      const key = s.section_key;
      const Component = SECTION_COMPONENTS[key];

      // No dedicated component → use GenericHomepageSection
      if (!Component) {
        return (
          <Suspense key={key} fallback={<SectionSkeleton />}>
            <SectionKeyProvider sectionKey={key}>
              <HomepageSectionShell>
                <GenericHomepageSection sectionKey={key} />
              </HomepageSectionShell>
            </SectionKeyProvider>
          </Suspense>
        );
      }

      return (
        <Suspense key={key} fallback={<SectionSkeleton />}>
          <SectionKeyProvider sectionKey={key}>
            <HomepageSectionShell>
              <SectionWrapper Component={Component} />
            </HomepageSectionShell>
          </SectionKeyProvider>
        </Suspense>
      );
    });
  }, [dbSections]);

  const showHero = dbSections.length === 0 ||
    dbSections.find(s => s.section_key === "hero")?.is_visible !== false;

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

      <main className="flex flex-col pb-20 md:pb-0">
        {showHero && <HeroSection />}
        {renderedSections}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
