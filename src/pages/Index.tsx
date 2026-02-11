import { SEOHead } from "@/components/SEOHead";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroSlider } from "@/components/home/HeroSlider";
import { HomeSearch } from "@/components/home/HomeSearch";
import { HomeStats } from "@/components/home/HomeStats";
import { EventsByCategory } from "@/components/home/EventsByCategory";
import { RegionalEvents } from "@/components/home/RegionalEvents";
import { HomeArticles } from "@/components/home/HomeArticles";
import { PlatformFeatures } from "@/components/home/PlatformFeatures";
import { NewsletterSignup } from "@/components/home/NewsletterSignup";
import { PartnersLogos } from "@/components/home/PartnersLogos";
import { AdBanner } from "@/components/ads/AdBanner";
import { AdPopup } from "@/components/ads/AdPopup";
import { useAdTracking } from "@/hooks/useAdTracking";

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

      {/* Leaderboard Ad — full width, contained, professional */}
      <section className="container py-4">
        <AdBanner placementSlug="home-hero-banner" className="w-full rounded-xl overflow-hidden aspect-[728/90] sm:aspect-[970/90] max-h-[120px]" />
      </section>

      {/* 4. Events by Category */}
      <EventsByCategory />

      {/* 5. Regional Events */}
      <RegionalEvents />

      {/* 6. Platform Services & Features */}
      <PlatformFeatures />

      {/* In-feed Ad — contained, centered */}
      <section className="container py-4">
        <AdBanner placementSlug="in-feed" className="w-full max-w-3xl mx-auto rounded-xl overflow-hidden aspect-[728/90] sm:aspect-[970/250] max-h-[250px]" />
      </section>

      {/* 7. News & Articles */}
      <HomeArticles />

      {/* 8. Newsletter */}
      <NewsletterSignup />

      {/* 9. Partners */}
      <PartnersLogos />

      {/* Pop-up Ad */}
      <AdPopup />

      <Footer />
    </div>
  );
};

export default Index;
