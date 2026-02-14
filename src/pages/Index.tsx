import { lazy, Suspense, memo, useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroSlider } from "@/components/home/HeroSlider";
import { HomeSearch } from "@/components/home/HomeSearch";
import { HomeStats } from "@/components/home/HomeStats";
import { useAdTracking } from "@/hooks/useAdTracking";
import { prefetchCommonRoutes } from "@/lib/prefetch";

// Lazy load below-fold components with granular Suspense boundaries
const EventsByCategory = lazy(() => import("@/components/home/EventsByCategory").then(m => ({ default: m.EventsByCategory })));
const RegionalEvents = lazy(() => import("@/components/home/RegionalEvents").then(m => ({ default: m.RegionalEvents })));
const HomeArticles = lazy(() => import("@/components/home/HomeArticles").then(m => ({ default: m.HomeArticles })));
const PlatformFeatures = lazy(() => import("@/components/home/PlatformFeatures").then(m => ({ default: m.PlatformFeatures })));
const SponsorshipOpportunities = lazy(() => import("@/components/home/SponsorshipOpportunities").then(m => ({ default: m.SponsorshipOpportunities })));
const NewsletterSignup = lazy(() => import("@/components/home/NewsletterSignup").then(m => ({ default: m.NewsletterSignup })));
const PartnersLogos = lazy(() => import("@/components/home/PartnersLogos").then(m => ({ default: m.PartnersLogos })));
const SponsorCarousel = lazy(() => import("@/components/home/SponsorCarousel").then(m => ({ default: m.SponsorCarousel })));
const AdBanner = lazy(() => import("@/components/ads/AdBanner").then(m => ({ default: m.AdBanner })));
const AdPopup = lazy(() => import("@/components/ads/AdPopup").then(m => ({ default: m.AdPopup })));

const LazyFallback = memo(() => <div className="h-32 animate-pulse bg-muted/30 rounded-lg mx-3 my-4" />);
LazyFallback.displayName = "LazyFallback";

const Index = () => {
  useAdTracking();
  useEffect(() => { prefetchCommonRoutes(); }, []);
  return (
    <div className="flex min-h-screen flex-col" role="document">
      <SEOHead
        title="Altohaa - The Global Culinary Community"
        description="The premier culinary community platform for chefs, judges, organizers, and sponsors. Compete, learn, and connect worldwide."
        ogImage="/pwa-512x512.png"
      />
      <Header />

      {/* 1. Hero Slider */}
      <HeroSlider />

      {/* 2. Search Bar */}
      <HomeSearch />

      {/* 3. Stats */}
      <div className="mt-6">
        <HomeStats />
      </div>

      {/* Below-fold: granular Suspense boundaries for parallel loading */}
      <Suspense fallback={<LazyFallback />}>
        <section className="container py-4">
          <AdBanner placementSlug="home-hero-banner" className="w-full rounded-xl overflow-hidden aspect-[728/90] sm:aspect-[970/90] max-h-[120px]" />
        </section>
      </Suspense>

      <Suspense fallback={<LazyFallback />}>
        <EventsByCategory />
      </Suspense>

      <Suspense fallback={<LazyFallback />}>
        <RegionalEvents />
      </Suspense>

      <Suspense fallback={<LazyFallback />}>
        <PlatformFeatures />
      </Suspense>

      <Suspense fallback={<LazyFallback />}>
        <SponsorshipOpportunities />
      </Suspense>

      <Suspense fallback={<LazyFallback />}>
        <section className="container py-4">
          <AdBanner placementSlug="in-feed" className="w-full max-w-3xl mx-auto rounded-xl overflow-hidden aspect-[728/90] sm:aspect-[970/250] max-h-[250px]" />
        </section>
      </Suspense>

      <Suspense fallback={<LazyFallback />}>
        <HomeArticles />
      </Suspense>

      <Suspense fallback={<LazyFallback />}>
        <NewsletterSignup />
      </Suspense>

      <Suspense fallback={<LazyFallback />}>
        <SponsorCarousel />
      </Suspense>

      <Suspense fallback={<LazyFallback />}>
        <PartnersLogos />
      </Suspense>

      <Suspense fallback={null}>
        <AdPopup />
      </Suspense>

      <Footer />
    </div>
  );
};

export default Index;
