import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { Button } from "@/components/ui/button";
import { RelatedPages } from "@/components/seo/RelatedPages";
import { HeroSection } from "@/components/home/sections/HeroSection";
import { SectionDivider } from "@/components/home/SectionDivider";
import { useLanguage } from "@/i18n/LanguageContext";
import { useHomepageSections } from "@/hooks/useHomepageSections";
import { useHomepageDataPrefetch } from "@/hooks/useHomepageDataPrefetch";
import { HomeSectionsRenderer } from "@/pages/home/HomeSectionsRenderer";
import { Shield, Globe, Award, Building2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

/* ─── Trust Badges (Real Data) ─── */

function TrustBadges({ isAr, dir }: { isAr: boolean; dir: "ltr" | "rtl" }) {
  const { data: stats } = useQuery({
    queryKey: ["home-stats"],
    queryFn: async () => {
      const results = await Promise.allSettled([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("competitions").select("id", { count: "exact", head: true }),
        supabase.from("culinary_entities").select("id", { count: "exact", head: true }),
        supabase.from("exhibitions").select("id", { count: "exact", head: true }),
        supabase.from("organizers").select("id", { count: "exact", head: true }),
      ]);
      const getCount = (r: PromiseSettledResult<any>) =>
        r.status === "fulfilled" ? (r.value.count ?? 0) : 0;
      return {
        members: getCount(results[0]),
        competitions: getCount(results[1]),
        entities: getCount(results[2]),
        exhibitions: getCount(results[3]),
        organizers: getCount(results[4]),
      };
    },
    staleTime: 1000 * 60 * 10,
  });

  const s = stats as any;
  const badges = [
    { icon: Shield, label: isAr ? "أعضاء" : "Members", sub: s?.members > 0 ? `${s.members}+` : "—" },
    { icon: Globe, label: isAr ? "معارض" : "Exhibitions", sub: s?.exhibitions > 0 ? `${s.exhibitions}+` : "—" },
    { icon: Award, label: isAr ? "مسابقات" : "Competitions", sub: s?.competitions > 0 ? `${s.competitions}+` : "—" },
    { icon: Building2, label: isAr ? "منظمون" : "Organizers", sub: s?.organizers > 0 ? `${s.organizers}+` : "—" },
    { icon: Globe, label: isAr ? "جمعيات" : "Associations", sub: s?.entities > 0 ? `${s.entities}+` : "—" },
  ];

  return (
    <section
      className="bg-[#F8FAFC] dark:bg-[hsl(213_30%_9%)]"
      dir={dir}
      aria-label={isAr ? "إحصائيات المنصة" : "Platform statistics"}
    >
      <div className="h-px bg-gradient-to-r from-transparent via-[#E5E7EB] to-transparent dark:via-border/30" aria-hidden="true" />
      <div className="container px-5 sm:px-6 py-4 sm:py-5">
        <ul className="flex items-center justify-around gap-1" role="list">
          {badges.map((b, i) => (
            <li key={i} className="group flex items-center gap-2.5 transition-transform duration-200 hover:scale-105 cursor-default">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary transition-all group-hover:bg-primary/12 group-hover:shadow-[var(--shadow-sm)]" aria-hidden="true">
                <b.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-foreground leading-none">{b.label}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-none mt-0.5 font-medium">{b.sub}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-[#E5E7EB] to-transparent dark:via-border/30" aria-hidden="true" />
    </section>
  );
}

/* ─── Main Component ─── */

const Index = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";

  // Prefetch ALL homepage data in a single parallel batch
  // This populates React Query cache before individual sections mount
  useHomepageDataPrefetch();

  const { data: dbSections = [], isError } = useHomepageSections();

  const showHero = useMemo(() => {
    if (dbSections.length === 0) return true;
    return dbSections.find((s) => s.section_key === "hero")?.is_visible !== false;
  }, [dbSections]);

  const seo = useMemo(() => {
    const title = isAr
      ? "الطهاة | مجتمع الطهاة العالمي — مسابقات ومعارض وأكاديميات الطهي"
      : "AlToha | Global Chef Community — Culinary Competitions, Exhibitions & Academies";
    const description = isAr
      ? "منصة الطهاة العالمية — اكتشف معارض الطعام والمشروبات، مسابقات الطهي، الجمعيات والأكاديميات الطهية حول العالم. انضم لمجتمع الطهاة المحترفين."
      : "Join the world's leading chef community. Discover global food & beverage exhibitions, cooking competitions, culinary academies, and chef associations. Connect with professional chefs worldwide.";
    const keywords = isAr
      ? "طهاة, مجتمع الطهي, معارض الطعام, مسابقات الطهي, أكاديميات الطهي, جمعيات الطهاة, فعاليات الطهي, الطاهي المحترف, طبخ, فنون الطهي"
      : "chefs, culinary community, food exhibitions, cooking competitions, culinary academies, chef associations, culinary events, professional chef, gastronomy";
    return { title, description, keywords };
  }, [isAr]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <OfflineIndicator />
      <SEOHead
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        ogImage="https://altoha.com/og-image.png"
        canonical="https://altoha.com/"
        lang={language}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "AlToha",
            alternateName: "الطهاة",
            url: "https://altoha.com",
            logo: {
              "@type": "ImageObject",
              url: "https://altoha.com/og-image.png",
              width: 1200,
              height: 630,
            },
            description: seo.description,
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer support",
              url: "https://altoha.com/contact",
              availableLanguage: ["English", "Arabic"],
            },
            sameAs: [
              "https://www.instagram.com/altohaglobal",
              "https://www.facebook.com/altohaglobal",
              "https://x.com/altohaglobal",
              "https://www.linkedin.com/company/altoha",
              "https://www.youtube.com/@altohaglobal",
              "https://www.tiktok.com/@altohaglobal",
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: isAr ? "الطهاة" : "AlToha",
            alternateName: isAr ? "AlToha" : "الطهاة",
            url: "https://altoha.com",
            inLanguage: ["en", "ar"],
            description: seo.description,
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: "https://altoha.com/search?q={search_term_string}",
              },
              "query-input": "required name=search_term_string",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: isAr ? "الصفحة الرئيسية — الطهاة" : "Homepage — AlToha",
            description: seo.description,
            url: "https://altoha.com/",
            isPartOf: { "@type": "WebSite", url: "https://altoha.com" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: isAr ? "الرئيسية" : "Home", item: "https://altoha.com/" },
              ],
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "MobileApplication",
            name: "AlToha",
            operatingSystem: "Any",
            applicationCategory: "SocialNetworkingApplication",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            url: "https://altoha.com",
            description: isAr
              ? "تطبيق الطهاة — شبكة الطهي الاحترافية"
              : "AlToha — Professional Culinary Network App",
          },
        ]}
      />

      <Header />

      <main className="flex-1 safe-area-x" role="main" aria-label={isAr ? "المحتوى الرئيسي" : "Homepage content"}>
        {/* Hero — above-fold, eagerly rendered for LCP */}
        <ErrorBoundary fallback={<HomeEmergencyHero language={language} />}>
          {showHero ? <HeroSection /> : <HomeEmergencyHero language={language} />}
        </ErrorBoundary>

        {/* Social proof — trust badges */}
        <TrustBadges isAr={isAr} dir={isAr ? "rtl" : "ltr"} />

        {/* Dynamic sections — lazy-loaded below fold */}
        <ErrorBoundary fallback={<HomeEmergencySections language={language} />}>
          {isError ? (
            <HomeEmergencySections language={language} />
          ) : (
            <HomeSectionsRenderer sections={dbSections} />
          )}
        </ErrorBoundary>

        <nav className="container px-5 sm:px-6 pb-12 pt-4" aria-label={isAr ? "صفحات ذات صلة" : "Related pages"}>
          <RelatedPages currentPath="/" />
        </nav>
      </main>

      {/* Hairline transition into footer */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#E5E7EB] to-transparent dark:via-border/30" aria-hidden="true" />
      <Footer />
    </div>
  );
};

export default Index;
