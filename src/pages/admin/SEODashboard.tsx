import { useIsAr } from "@/hooks/useIsAr";
import { lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Search, Globe, Send, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_GROUPS, getVitalStatus, PUBLIC_ROUTES } from "./seo/seoDashboardTypes";
import { useSEODashboardData } from "./seo/useSEODashboardData";
import {
  VitalsSection, CrawlersSection, KeywordsSection, IndexingSection,
  PagesSection, DevicesSection, HealthSection, CrawlLogSection,
  UrlHealthSection, SitemapConfigSection, RobotsTxtSection,
} from "./seo/SEODashboardSections";

// Lazy load sub-components
const SEOAuditPanel = lazy(() => import("@/components/admin/seo/SEOAuditPanel").then(m => ({ default: m.SEOAuditPanel })));
const SEOMetaConfigurator = lazy(() => import("@/components/admin/seo/SEOMetaConfigurator").then(m => ({ default: m.SEOMetaConfigurator })));
const SEOContentAnalysis = lazy(() => import("@/components/admin/seo/SEOContentAnalysis").then(m => ({ default: m.SEOContentAnalysis })));
const SEORecommendations = lazy(() => import("@/components/admin/seo/SEORecommendations").then(m => ({ default: m.SEORecommendations })));
const SEOStructuredData = lazy(() => import("@/components/admin/seo/SEOStructuredData").then(m => ({ default: m.SEOStructuredData })));
const SEOCompetitorTracker = lazy(() => import("@/components/admin/seo/SEOCompetitorTracker").then(m => ({ default: m.SEOCompetitorTracker })));
const SEOBacklinkMonitor = lazy(() => import("@/components/admin/seo/SEOBacklinkMonitor").then(m => ({ default: m.SEOBacklinkMonitor })));
const SEOKeywordGapAnalyzer = lazy(() => import("@/components/admin/seo/SEOKeywordGapAnalyzer").then(m => ({ default: m.SEOKeywordGapAnalyzer })));
const SEOTechnicalChecklist = lazy(() => import("@/components/admin/seo/SEOTechnicalChecklist").then(m => ({ default: m.SEOTechnicalChecklist })));
const SEOCrawlAnalytics = lazy(() => import("@/components/admin/seo/SEOCrawlAnalytics").then(m => ({ default: m.SEOCrawlAnalytics })));
const SEOInternalLinkAnalyzer = lazy(() => import("@/components/admin/seo/SEOInternalLinkAnalyzer").then(m => ({ default: m.SEOInternalLinkAnalyzer })));
const SEOPageSpeedMonitor = lazy(() => import("@/components/admin/seo/SEOPageSpeedMonitor").then(m => ({ default: m.SEOPageSpeedMonitor })));
const SEOGSCPerformance = lazy(() => import("@/components/admin/seo/SEOGSCPerformance").then(m => ({ default: m.SEOGSCPerformance })));
const SEOContentGapAnalyzer = lazy(() => import("@/components/admin/seo/SEOContentGapAnalyzer").then(m => ({ default: m.SEOContentGapAnalyzer })));
import { SEOOverviewSection } from "@/pages/admin/seo/SEOOverviewSection";

function SectionSkeleton() {
  const isAr = useIsAr();
  return <div className="flex items-center justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
}

export default function SEODashboard() {
  const isAr = useIsAr();
  const data = useSEODashboardData(isAr);
  const { activeSection, setActiveSection, range, setRange, pinging, handlePingSitemap, activeSectionInfo,
    totalViews, uniqueSessions, bounceRate, avgDuration, prevTotalViews, prevUniqueSessions, prevBounceRate, prevAvgDuration,
    vitalsAgg, indexingStatus, trackedKeywords, topPages,
  } = data;

  const renderContent = () => {
    switch (activeSection) {
      case "overview": return <SEOOverviewSection isAr={isAr} range={range} totalViews={totalViews} prevTotalViews={prevTotalViews} uniqueSessions={uniqueSessions} prevUniqueSessions={prevUniqueSessions} bounceRate={bounceRate} prevBounceRate={prevBounceRate} avgDuration={avgDuration} prevAvgDuration={prevAvgDuration} vitalsAgg={vitalsAgg} indexingStatus={indexingStatus} trackedKeywords={trackedKeywords} totalPages={indexingStatus?.length || PUBLIC_ROUTES.length} />;
      case "gsc-performance": return <Suspense fallback={<SectionSkeleton />}><SEOGSCPerformance isAr={isAr} /></Suspense>;
      case "vitals": return <VitalsSection isAr={isAr} data={data} />;
      case "keywords": return <KeywordsSection isAr={isAr} data={data} />;
      case "indexing": return <IndexingSection isAr={isAr} data={data} />;
      case "crawlers": return <CrawlersSection isAr={isAr} data={data} />;
      case "pages": return <PagesSection isAr={isAr} data={data} />;
      case "devices": return <DevicesSection isAr={isAr} data={data} />;
      case "health": return <HealthSection isAr={isAr} data={data} />;
      case "crawl": return <CrawlLogSection isAr={isAr} data={data} />;
      case "keyword-gaps": return <Suspense fallback={<SectionSkeleton />}><SEOKeywordGapAnalyzer isAr={isAr} /></Suspense>;
      case "competitors": return <Suspense fallback={<SectionSkeleton />}><SEOCompetitorTracker isAr={isAr} /></Suspense>;
      case "backlinks": return <Suspense fallback={<SectionSkeleton />}><SEOBacklinkMonitor isAr={isAr} /></Suspense>;
      case "content": return <Suspense fallback={<SectionSkeleton />}><SEOContentAnalysis isAr={isAr} /></Suspense>;
      case "content-gaps": return <Suspense fallback={<SectionSkeleton />}><SEOContentGapAnalyzer isAr={isAr} /></Suspense>;
      case "meta": return <Suspense fallback={<SectionSkeleton />}><SEOMetaConfigurator isAr={isAr} /></Suspense>;
      case "schema": return <Suspense fallback={<SectionSkeleton />}><SEOStructuredData isAr={isAr} /></Suspense>;
      case "technical": return <Suspense fallback={<SectionSkeleton />}><SEOTechnicalChecklist isAr={isAr} /></Suspense>;
      case "audit": return <Suspense fallback={<SectionSkeleton />}><SEOAuditPanel /></Suspense>;
      case "crawl-analytics": return <Suspense fallback={<SectionSkeleton />}><SEOCrawlAnalytics isAr={isAr} range={range} /></Suspense>;
      case "internal-links": return <Suspense fallback={<SectionSkeleton />}><SEOInternalLinkAnalyzer isAr={isAr} /></Suspense>;
      case "page-speed": return <Suspense fallback={<SectionSkeleton />}><SEOPageSpeedMonitor isAr={isAr} /></Suspense>;
      case "recommendations": return (
        <Suspense fallback={<SectionSkeleton />}>
          <SEORecommendations isAr={isAr} seoData={{
            totalViews, bounceRate, avgDuration, topPages,
            vitalsPass: vitalsAgg ? (["lcp", "inp", "cls", "fcp", "ttfb"] as const).filter(m => vitalsAgg[m] != null && getVitalStatus(m, vitalsAgg[m]!) === "good").length : 0,
            vitalsTotal: 5,
            indexedPages: indexingStatus?.filter((s) => s.status === "indexed").length || 0,
            totalPages: indexingStatus?.length || PUBLIC_ROUTES.length,
            issueCount: 0, keywords: trackedKeywords || [],
          }} />
        </Suspense>
      );
      case "url-health": return <UrlHealthSection isAr={isAr} />;
      case "sitemap-config": return <SitemapConfigSection isAr={isAr} data={data} />;
      case "robots-txt": return <RobotsTxtSection isAr={isAr} data={data} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            {isAr ? "لوحة تحكم SEO" : "SEO Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? "تتبع محركات البحث والأداء في الوقت الفعلي" : "Real-time search engine tracking & performance"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-border overflow-hidden text-xs">
            {[7, 14, 30].map(d => (
              <button key={d} onClick={() => setRange(d)} className={`px-3 py-1.5 transition-colors ${range === d ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{d}d</button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={() => window.open(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-sitemap`, "_blank", "noopener,noreferrer")}>
            <Globe className="h-3.5 w-3.5" />{isAr ? "خريطة الموقع" : "Sitemap"}
          </Button>
          <Button onClick={handlePingSitemap} disabled={pinging} size="sm" className="gap-1.5 rounded-xl">
            <Send className="h-3.5 w-3.5" />{pinging ? (isAr ? "جارٍ..." : "Pinging...") : (isAr ? "إرسال" : "Ping")}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden mb-4">
        <div className="flex overflow-x-auto gap-1 pb-2 scrollbar-hide">
          {NAV_GROUPS.flatMap(g => g.items).map(item => (
            <button key={item.key} onClick={() => setActiveSection(item.key)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-colors shrink-0",
                activeSection === item.key ? "bg-primary text-primary-foreground font-medium" : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}>
              <item.icon className="h-3 w-3" />{isAr ? item.labelAr : item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex gap-5">
        <nav className="w-56 shrink-0 hidden lg:block">
          <div className="sticky top-4 space-y-1">
            {NAV_GROUPS.map(group => (
              <div key={group.label} className="mb-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold px-3 mb-1.5 flex items-center gap-1.5">
                  <group.icon className="h-3 w-3" />{isAr ? group.labelAr : group.label}
                </p>
                {group.items.map(item => (
                  <button key={item.key} onClick={() => setActiveSection(item.key)}
                    className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all text-start",
                      activeSection === item.key ? "bg-primary/10 text-primary font-medium shadow-sm" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}>
                    <item.icon className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{isAr ? item.labelAr : item.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </nav>

        <div className="flex-1 min-w-0">
          {activeSectionInfo && activeSection !== "overview" && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
              <button onClick={() => setActiveSection("overview")} className="hover:text-foreground transition-colors">{isAr ? "نظرة عامة" : "Overview"}</button>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">{isAr ? activeSectionInfo.labelAr : activeSectionInfo.label}</span>
            </div>
          )}
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
