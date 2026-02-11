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

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="Altohaa - The Global Culinary Community"
        description="The premier culinary community platform for chefs, judges, organizers, and sponsors. Compete, learn, and connect worldwide."
        ogImage="/pwa-512x512.png"
      />
      <Header />

      {/* 1. Hero Slider (admin-controlled) */}
      <HeroSlider />

      {/* 2. Search Bar */}
      <HomeSearch />

      {/* 3. Stats */}
      <div className="mt-6">
        <HomeStats />
      </div>

      {/* 4. Events by Category (Competitions, Exhibitions, Tastings) */}
      <EventsByCategory />

      {/* 5. Regional Events (Middle East vs Global) */}
      <RegionalEvents />

      {/* 6. Platform Services & Features */}
      <PlatformFeatures />

      {/* 7. News & Articles */}
      <HomeArticles />

      {/* 8. Newsletter Signup */}
      <NewsletterSignup />

      {/* 9. Partners & Association Logos */}
      <PartnersLogos />

      <Footer />
    </div>
  );
};

export default Index;
