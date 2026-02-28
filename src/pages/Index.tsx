import { lazy, Suspense, memo, useEffect, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { SectionReveal } from "@/components/ui/SectionReveal";
import { Skeleton } from "@/components/ui/skeleton";
import { SEOHead } from "@/components/SEOHead";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { useAdTracking } from "@/hooks/useAdTracking";
import { prefetchCommonRoutes } from "@/lib/prefetch";
import { useHomepageSections, type HomepageSection } from "@/hooks/useHomepageSections";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";

// Above-fold components — eagerly imported for optimal LCP
import { HeroSlider } from "@/components/home/HeroSlider";
import { HomeSearch } from "@/components/home/HomeSearch";
import { HomeStats } from "@/components/home/HomeStats";
import { HomeQuickActions } from "@/components/home/HomeQuickActions";
const HomepageV2 = lazy(() => import("@/components/home/HomepageV2").then(m => ({ default: m.HomepageV2 })));

// Lazy load below-fold components
const EventsByCategory = lazy(() => import("@/components/home/EventsByCategory").then(m => ({ default: m.EventsByCategory })));
const HomeEventsCalendarPreview = lazy(() => import("@/components/home/HomeEventsCalendarPreview").then(m => ({ default: m.HomeEventsCalendarPreview })));
const RegionalEvents = lazy(() => import("@/components/home/RegionalEvents").then(m => ({ default: m.RegionalEvents })));
const HomeArticles = lazy(() => import("@/components/home/HomeArticles").then(m => ({ default: m.HomeArticles })));
const PlatformFeatures = lazy(() => import("@/components/home/PlatformFeatures").then(m => ({ default: m.PlatformFeatures })));
const SponsorshipOpportunities = lazy(() => import("@/components/home/SponsorshipOpportunities").then(m => ({ default: memo(m.SponsorshipOpportunities) })));
const NewsletterSignup = lazy(() => import("@/components/home/NewsletterSignup").then(m => ({ default: m.NewsletterSignup })));
const PartnersLogos = lazy(() => import("@/components/home/PartnersLogos").then(m => ({ default: m.PartnersLogos })));
const SponsorCarousel = lazy(() => import("@/components/home/SponsorCarousel").then(m => ({ default: m.SponsorCarousel })));
const NewlyJoinedUsers = lazy(() => import("@/components/home/NewlyJoinedUsers").then(m => ({ default: m.NewlyJoinedUsers })));
const FeaturedChefs = lazy(() => import("@/components/home/FeaturedChefs").then(m => ({ default: m.FeaturedChefs })));
const HomeMasterclasses = lazy(() => import("@/components/home/HomeMasterclasses").then(m => ({ default: m.HomeMasterclasses })));
const HomeTestimonials = lazy(() => import("@/components/home/HomeTestimonials").then(m => ({ default: m.HomeTestimonials })));
const HomeTrendingContent = lazy(() => import("@/components/home/HomeTrendingContent").then(m => ({ default: m.HomeTrendingContent })));
const AdBanner = lazy(() => import("@/components/ads/AdBanner").then(m => ({ default: m.AdBanner })));
const AdPopup = lazy(() => import("@/components/ads/AdPopup").then(m => ({ default: m.AdPopup })));
const HomeProSuppliers = lazy(() => import("@/components/home/HomeProSuppliers").then(m => ({ default: m.HomeProSuppliers })));

const LazyFallback = memo(({ type = "grid" }: { type?: "grid" | "cards" | "banner" }) => {
  if (type === "banner") {
    return (
      <div className="container py-2">
        <Skeleton className="h-[90px] w-full rounded-xl" />
      </div>
    );
  }
  return (
    <div className="container py-2">
      <div className="space-y-3">
        <Skeleton className="h-5 w-36 rounded-lg" />
        <Skeleton className="h-4 w-56 rounded-md" />
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[16/10] rounded-xl" />
              <Skeleton className="h-4 w-3/4 rounded-md" />
              <Skeleton className="h-3 w-1/2 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
LazyFallback.displayName = "LazyFallback";

/* Map section_key → component */
const SECTION_MAP: Record<string, { Component: React.LazyExoticComponent<any>; fallback?: "grid" | "banner" }> = {
  events_by_category: { Component: EventsByCategory },
  regional_events: { Component: RegionalEvents },
  events_calendar: { Component: HomeEventsCalendarPreview },
  featured_chefs: { Component: FeaturedChefs },
  newly_joined: { Component: NewlyJoinedUsers },
  sponsors: { Component: SponsorCarousel },
  pro_suppliers: { Component: HomeProSuppliers },
  masterclasses: { Component: HomeMasterclasses },
  sponsorships: { Component: SponsorshipOpportunities },
  articles: { Component: HomeArticles },
  features: { Component: PlatformFeatures },
  newsletter: { Component: NewsletterSignup },
  partners: { Component: PartnersLogos },
  testimonials: { Component: HomeTestimonials },
  trending_content: { Component: HomeTrendingContent },
};

function isVisible(sections: HomepageSection[], key: string): boolean {
  const s = sections.find((sec) => sec.section_key === key);
  return s ? s.is_visible : true; // default visible if not in DB
}

const Index = () => {
  const { language } = useLanguage();
  useAdTracking();
  useEffect(() => { prefetchCommonRoutes(); }, []);
  const { data: sections = [] } = useHomepageSections();
  const siteSettings = useSiteSettingsContext();
  const template = (siteSettings?.homepage as any)?.template || "v1";

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden" role="document">
      <OfflineIndicator />
      <SEOHead
        title="Altoha — The Global Culinary Community"
        description="The premier platform for chefs, judges, organizers, and food industry professionals. Compete in world-class competitions, master new skills, and connect with a vibrant culinary community."
        ogImage="/pwa-512x512.png"
        lang={language}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Altoha",
          url: window.location.origin,
          description: "The premier culinary community platform for chefs, judges, organizers, and sponsors.",
          potentialAction: {
            "@type": "SearchAction",
            target: `${window.location.origin}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <Header />

      {template === "v2" ? (
        <HomepageV2 />
      ) : (
        <main className="flex flex-col">
          {/* 1. Hero Slider — eagerly loaded for LCP */}
          {isVisible(sections, "hero") && <HeroSlider />}

          {/* 2. Search Bar */}
          {isVisible(sections, "search") && <HomeSearch />}

          {/* 3. Platform Stats */}
          {isVisible(sections, "stats") && <HomeStats />}

          {/* 3.5 Quick Actions Grid */}
          <HomeQuickActions />

          {/* Ad banner top */}
          {isVisible(sections, "ad_banner_top") && (
            <Suspense fallback={<LazyFallback type="banner" />}>
              <section className="container py-4">
                <AdBanner placementSlug="home-hero-banner" className="w-full rounded-xl overflow-hidden aspect-[728/90] sm:aspect-[970/90] max-h-[120px]" />
              </section>
            </Suspense>
          )}

          {/* Dynamic lazy sections — sorted by sort_order from DB, memoized */}
          {useMemo(() => sections
            .filter((s) => s.is_visible && SECTION_MAP[s.section_key])
            .map((s, idx) => {
              const entry = SECTION_MAP[s.section_key];
              if (!entry) return null;
              return (
                <SectionReveal key={s.section_key} delay={idx * 60}>
                  <Suspense fallback={<LazyFallback type={entry.fallback} />}>
                    <entry.Component />
                  </Suspense>
                </SectionReveal>
              );
            }), [sections])}

          {/* Ad banner mid */}
          {isVisible(sections, "ad_banner_mid") && (
            <Suspense fallback={<LazyFallback type="banner" />}>
              <section className="container py-4">
                <AdBanner placementSlug="in-feed" className="w-full max-w-3xl mx-auto rounded-xl overflow-hidden aspect-[728/90] sm:aspect-[970/250] max-h-[250px]" />
              </section>
            </Suspense>
          )}

          {/* Fallback: render all sections if DB returned nothing */}
          {sections.length === 0 && (
            <>
              <Suspense fallback={<LazyFallback />}><EventsByCategory /></Suspense>
              <Suspense fallback={<LazyFallback type="banner" />}>
                <section className="container py-4">
                  <AdBanner placementSlug="home-hero-banner" className="w-full rounded-xl overflow-hidden aspect-[728/90] sm:aspect-[970/90] max-h-[120px]" />
                </section>
              </Suspense>
              <Suspense fallback={<LazyFallback />}><RegionalEvents /></Suspense>
              <Suspense fallback={<LazyFallback />}><HomeEventsCalendarPreview /></Suspense>
              <Suspense fallback={<LazyFallback />}><FeaturedChefs /></Suspense>
              <Suspense fallback={<LazyFallback />}><NewlyJoinedUsers /></Suspense>
              <Suspense fallback={<LazyFallback />}><SponsorCarousel /></Suspense>
              <Suspense fallback={<LazyFallback />}><HomeProSuppliers /></Suspense>
              <Suspense fallback={<LazyFallback />}><HomeMasterclasses /></Suspense>
              <Suspense fallback={<LazyFallback type="banner" />}>
                <section className="container py-4">
                  <AdBanner placementSlug="in-feed" className="w-full max-w-3xl mx-auto rounded-xl overflow-hidden aspect-[728/90] sm:aspect-[970/250] max-h-[250px]" />
                </section>
              </Suspense>
              <Suspense fallback={<LazyFallback />}><SponsorshipOpportunities /></Suspense>
              <Suspense fallback={<LazyFallback />}><HomeArticles /></Suspense>
              <Suspense fallback={<LazyFallback />}><PlatformFeatures /></Suspense>
              <Suspense fallback={<LazyFallback />}><NewsletterSignup /></Suspense>
              <Suspense fallback={<LazyFallback />}><PartnersLogos /></Suspense>
            </>
          )}

          <Suspense fallback={null}>
            <AdPopup />
          </Suspense>
        </main>
      )}

      <Footer />
    </div>
  );
};

export default Index;
