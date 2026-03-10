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
// Route prefetching handled by RoutePrefetcher component in App
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
const HomepageAdBanner = lazy(() => import("@/components/home/sections/HomepageAdBanner"));
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
  // Ad banner placements
  ad_banner_top: HomepageAdBanner,
  ad_banner_mid: HomepageAdBanner,
  ad_banner_bottom: HomepageAdBanner,
};

// ── Section loading skeletons (varied) ──
const skeletonElements = [
  // Card grid
  <div key="skel-grid" className="container py-5 md:py-8 space-y-3">
    <Skeleton className="h-4 w-28 rounded-lg" />
    <Skeleton className="h-5 w-48 rounded-xl" />
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="rounded-2xl border border-border/20 overflow-hidden">
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="p-2.5 space-y-1.5">
            <Skeleton className="h-3 w-3/4 rounded-lg" />
            <Skeleton className="h-2 w-1/2 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  </div>,
  // Horizontal scroll
  <div key="skel-scroll" className="container py-5 md:py-8 space-y-3">
    <Skeleton className="h-4 w-32 rounded-lg" />
    <Skeleton className="h-5 w-52 rounded-xl" />
    <div className="flex gap-3 mt-3 overflow-hidden">
      {[1, 2, 3].map(i => (
        <Skeleton key={i} className="aspect-[4/3] w-[72vw] sm:w-[45vw] md:w-[32vw] lg:w-[24vw] shrink-0 rounded-2xl" />
      ))}
    </div>
  </div>,
  // Stats bar
  <div key="skel-stats" className="container py-4 md:py-6">
    <div className="flex gap-3 overflow-hidden">
      {[1, 2, 3, 4].map(i => (
        <Skeleton key={i} className="h-16 flex-1 min-w-[120px] rounded-2xl" />
      ))}
    </div>
  </div>,
];

let skeletonIdx = 0;
function getSectionSkeleton() {
  const el = skeletonElements[skeletonIdx % skeletonElements.length];
  skeletonIdx++;
  return el;
}

// ── Default section order (used when DB has no data) ──
const DEFAULT_SECTION_KEYS = [
  "search", "stats", "events_by_category", "featured_chefs",
  "pro_suppliers", "masterclasses", "articles", "sponsors",
  "testimonials", "features", "newsletter",
];

const Index = () => {
  const { language } = useLanguage();
  useAdTracking();
  // Route prefetching is handled by RoutePrefetcher in App.tsx

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
          <Suspense key={key} fallback={getSectionSkeleton()}>
            <SectionKeyProvider sectionKey={key}>
              <HomepageSectionShell>
                <GenericHomepageSection sectionKey={key} />
              </HomepageSectionShell>
            </SectionKeyProvider>
          </Suspense>
        );
      }

      return (
        <Suspense key={key} fallback={getSectionSkeleton()}>
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
        title={language === "ar" ? "الطهاة — المجتمع الطهوي العالمي" : "Altoha — Global Culinary Community"}
        description={language === "ar" ? "المنصة الأولى للطهاة والحكام والمنظمين ومحترفي صناعة الأغذية حول العالم" : "The premier platform for chefs, judges, organizers, and food industry professionals worldwide"}
        keywords={language === "ar" ? "طهاة, مسابقات طهي, وصفات, معارض أغذية, تصنيف الطهاة, مجتمع الطهاة, منصة طهي" : "chefs, culinary competitions, recipes, food exhibitions, chef rankings, culinary community, cooking platform"}
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

      <main className="flex flex-col pb-20 sm:pb-0">
        {showHero && <HeroSection />}
        {renderedSections}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
