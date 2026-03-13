import { useMemo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { Button } from "@/components/ui/button";
import { RelatedPages } from "@/components/seo/RelatedPages";
import { HeroSection } from "@/components/home/sections/HeroSection";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAdTracking } from "@/hooks/useAdTracking";
import { useHomepageSections } from "@/hooks/useHomepageSections";
import { HomeSectionsRenderer } from "@/pages/home/HomeSectionsRenderer";
import EditorialHomepage from "@/pages/home/EditorialHomepage";
import {
  HomepageLayoutSwitcher,
  getStoredLayout,
  type HomepageLayout,
} from "@/pages/home/HomepageLayoutSwitcher";
import { Shield, Globe, Award } from "lucide-react";

/* ─── Emergency Fallbacks ─── */

function HomeEmergencyHero({ language }: { language: string }) {
  const isAr = language === "ar";
  return (
    <section className="container py-12 md:py-16 text-center">
      <h1 className="text-3xl md:text-5xl font-bold text-foreground">
        {isAr ? "مرحباً بك في مجتمع الطهاة" : "Welcome to the Culinary Community"}
      </h1>
      <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
        {isAr
          ? "نقوم الآن بإعادة تحميل الصفحة الرئيسية بأمان لضمان عرض المحتوى بالكامل."
          : "We are safely rebuilding the homepage view to ensure all content appears correctly."}
      </p>
      <Button asChild className="mt-6 rounded-xl">
        <Link to="/search">{isAr ? "ابدأ البحث" : "Start searching"}</Link>
      </Button>
    </section>
  );
}

function HomeEmergencySections({ language }: { language: string }) {
  const isAr = language === "ar";
  return (
    <section className="container pb-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2].map((card) => (
          <article key={card} className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold text-foreground">
              {isAr ? `قسم رئيسي ${card + 1}` : `Homepage Section ${card + 1}`}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isAr ? "جارِ تحميل المحتوى..." : "Loading section content..."}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ─── Trust Badges ─── */

function TrustBadges({ isAr }: { isAr: boolean }) {
  const badges = [
    {
      icon: Shield,
      label: isAr ? "منصة موثوقة" : "Trusted Platform",
      sub: isAr ? "+50,000 طاهٍ" : "50,000+ Chefs",
    },
    {
      icon: Globe,
      label: isAr ? "تغطية عالمية" : "Global Coverage",
      sub: isAr ? "+120 دولة" : "120+ Countries",
    },
    {
      icon: Award,
      label: isAr ? "مسابقات معتمدة" : "Certified Events",
      sub: isAr ? "+500 مسابقة" : "500+ Competitions",
    },
  ];

  return (
    <section className="border-y border-border/40 bg-muted/30">
      <div className="container py-4">
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 md:gap-14">
          {badges.map((b, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <b.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground leading-none">{b.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{b.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Boot Watchdog ─── */

function useBootWatchdog() {
  const [booted, setBooted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      document.documentElement.setAttribute("data-app-boot", "ready");
      setBooted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);
  return booted;
}

/* ─── Classic Layout (original) ─── */

function ClassicLayout({
  language,
  isAr,
  showHero,
  dbSections,
  isError,
}: {
  language: string;
  isAr: boolean;
  showHero: boolean;
  dbSections: any[];
  isError: boolean;
}) {
  return (
    <>
      <ErrorBoundary fallback={<HomeEmergencyHero language={language} />}>
        {showHero ? <HeroSection /> : <HomeEmergencyHero language={language} />}
      </ErrorBoundary>
      <TrustBadges isAr={isAr} />
      <ErrorBoundary fallback={<HomeEmergencySections language={language} />}>
        {isError ? (
          <HomeEmergencySections language={language} />
        ) : (
          <HomeSectionsRenderer sections={dbSections} />
        )}
      </ErrorBoundary>
      <div className="container pb-10">
        <RelatedPages currentPath="/" />
      </div>
    </>
  );
}

/* ─── Main Component ─── */

const Index = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  useAdTracking();
  useBootWatchdog();

  const [layout, setLayout] = useState<HomepageLayout>(getStoredLayout);

  const { data: dbSections = [], isError } = useHomepageSections();

  const showHero = useMemo(() => {
    if (dbSections.length === 0) return true;
    return dbSections.find((s) => s.section_key === "hero")?.is_visible !== false;
  }, [dbSections]);

  const seo = useMemo(() => {
    const title = isAr
      ? "الطهاة | المجتمع الطهوي العالمي"
      : "Altoha | Global Culinary Community";
    const description = isAr
      ? "المنصة الأولى للطهاة والحكام والمنظمين ومحترفي صناعة الأغذية حول العالم."
      : "The premier platform for chefs, judges, organizers, and food industry professionals worldwide.";
    const keywords = isAr
      ? "طهاة, مسابقات طهي, وصفات, معارض أغذية, تصنيف الطهاة, مجتمع الطهاة"
      : "chefs, culinary competitions, recipes, food exhibitions, chef rankings, culinary community";
    return { title, description, keywords };
  }, [isAr]);

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
        {layout === "editorial" ? (
          <ErrorBoundary fallback={<HomeEmergencyHero language={language} />}>
            <EditorialHomepage />
          </ErrorBoundary>
        ) : (
          <ClassicLayout
            language={language}
            isAr={isAr}
            showHero={showHero}
            dbSections={dbSections}
            isError={isError}
          />
        )}
      </main>

      <Footer />

      {/* Layout Switcher FAB */}
      <HomepageLayoutSwitcher current={layout} onChange={setLayout} />
    </div>
  );
};

export default Index;
