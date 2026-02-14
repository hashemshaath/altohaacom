import { lazy, Suspense } from "react";
import { SEOHead } from "@/components/SEOHead";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroSlider } from "@/components/home/HeroSlider";
import { HomeSearch } from "@/components/home/HomeSearch";
import { HomeStats } from "@/components/home/HomeStats";
import { useAdTracking } from "@/hooks/useAdTracking";

// Lazy load below-fold components
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

const Index = () => {
  useAdTracking();
  return (
    <div className="flex min-h-screen flex-col">
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

      {/* Below-fold: lazy loaded */}
      <Suspense fallback={<div className="h-32" />}>
        {/* Leaderboard Ad */}
        <section className="container py-4">
          <AdBanner placementSlug="home-hero-banner" className="w-full rounded-xl overflow-hidden aspect-[728/90] sm:aspect-[970/90] max-h-[120px]" />
        </section>

        {/* 4. Events by Category */}
        <EventsByCategory />

        {/* 5. Regional Events */}
        <RegionalEvents />

        {/* 6. Platform Services & Features */}
        <PlatformFeatures />

        {/* 6.5. Sponsorship Opportunities */}
        <SponsorshipOpportunities />

        {/* In-feed Ad */}
        <section className="container py-4">
          <AdBanner placementSlug="in-feed" className="w-full max-w-3xl mx-auto rounded-xl overflow-hidden aspect-[728/90] sm:aspect-[970/250] max-h-[250px]" />
        </section>

        {/* 7. News & Articles */}
        <HomeArticles />

        {/* 8. Newsletter */}
        <NewsletterSignup />

        {/* 9. Sponsor Carousel */}
        <SponsorCarousel />

        {/* 10. Partners */}
        <PartnersLogos />

        {/* Pop-up Ad */}
        <AdPopup />
      </Suspense>

      <Footer />
    </div>
  );
};

export default Index;
