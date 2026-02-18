import { lazy, Suspense, memo, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { SEOHead } from "@/components/SEOHead";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroSlider } from "@/components/home/HeroSlider";
import { HomeSearch } from "@/components/home/HomeSearch";
import { HomeStats } from "@/components/home/HomeStats";
import { useAdTracking } from "@/hooks/useAdTracking";
import { prefetchCommonRoutes } from "@/lib/prefetch";

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
const AdBanner = lazy(() => import("@/components/ads/AdBanner").then(m => ({ default: m.AdBanner })));
const AdPopup = lazy(() => import("@/components/ads/AdPopup").then(m => ({ default: m.AdPopup })));

const LazyFallback = memo(({ type = "grid" }: { type?: "grid" | "cards" | "banner" }) => {
  if (type === "banner") {
    return (
      <div className="container my-4">
        <Skeleton className="h-[90px] w-full rounded-xl" />
      </div>
    );
  }
  return (
    <div className="container my-4">
      <div className="space-y-3">
        <Skeleton className="h-6 w-40 rounded-lg" />
        <Skeleton className="h-4 w-64 rounded-md" />
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
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

const Index = () => {
  const { language } = useLanguage();
  useAdTracking();
  useEffect(() => { prefetchCommonRoutes(); }, []);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden" role="document">
      {/* Skip to content link for keyboard users */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:top-2 focus:start-2 focus:rounded-md">
        Skip to content
      </a>
      <SEOHead
        title="Altohaa — The Global Culinary Community"
        description="The premier platform for chefs, judges, organizers, and food industry professionals. Compete in world-class competitions, master new skills, and connect with a vibrant culinary community."
        ogImage="/pwa-512x512.png"
        lang={language}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Altohaa",
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

      <main id="main-content">
        {/* 1. Hero Slider */}
        <HeroSlider />

        {/* 2. Search Bar */}
        <HomeSearch />

        {/* 3. Platform Stats */}
        <div className="mt-6">
          <HomeStats />
        </div>

        {/* 4. Events by Category (primary content) */}
        <Suspense fallback={<LazyFallback />}>
          <EventsByCategory />
        </Suspense>

        {/* 5. Ad Banner */}
        <Suspense fallback={<LazyFallback type="banner" />}>
          <section className="container py-4">
            <AdBanner placementSlug="home-hero-banner" className="w-full rounded-xl overflow-hidden aspect-[728/90] sm:aspect-[970/90] max-h-[120px]" />
          </section>
        </Suspense>

        {/* 6. Regional Events */}
        <Suspense fallback={<LazyFallback />}>
          <RegionalEvents />
        </Suspense>

        {/* 6b. Events Calendar Preview */}
        <Suspense fallback={<LazyFallback />}>
          <HomeEventsCalendarPreview />
        </Suspense>

        {/* 7. Featured Chefs */}
        <Suspense fallback={<LazyFallback />}>
          <FeaturedChefs />
        </Suspense>

        {/* 8. Newly Joined Members */}
        <Suspense fallback={<LazyFallback />}>
          <NewlyJoinedUsers />
        </Suspense>

        {/* 9. Sponsors Marquee */}
        <Suspense fallback={<LazyFallback />}>
          <SponsorCarousel />
        </Suspense>

        {/* 10. Masterclasses */}
        <Suspense fallback={<LazyFallback />}>
          <HomeMasterclasses />
        </Suspense>

        {/* 11. In-feed Ad */}
        <Suspense fallback={<LazyFallback type="banner" />}>
          <section className="container py-4">
            <AdBanner placementSlug="in-feed" className="w-full max-w-3xl mx-auto rounded-xl overflow-hidden aspect-[728/90] sm:aspect-[970/250] max-h-[250px]" />
          </section>
        </Suspense>

        {/* 12. Sponsorship Opportunities */}
        <Suspense fallback={<LazyFallback />}>
          <SponsorshipOpportunities />
        </Suspense>

        {/* 11. Articles */}
        <Suspense fallback={<LazyFallback />}>
          <HomeArticles />
        </Suspense>

        {/* 12. Platform Features & Why Altohaa */}
        <Suspense fallback={<LazyFallback />}>
          <PlatformFeatures />
        </Suspense>

        {/* 13. Newsletter */}
        <Suspense fallback={<LazyFallback />}>
          <NewsletterSignup />
        </Suspense>

        {/* 14. Partners */}
        <Suspense fallback={<LazyFallback />}>
          <PartnersLogos />
        </Suspense>

        <Suspense fallback={null}>
          <AdPopup />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
