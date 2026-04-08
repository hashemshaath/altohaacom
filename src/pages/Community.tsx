import { useState, useEffect, lazy, Suspense, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { SEOHead } from "@/components/SEOHead";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { RelatedPages } from "@/components/seo/RelatedPages";
import { useAdTracking } from "@/hooks/useAdTracking";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { CommunityLeftSidebar, type CommunityTab } from "@/components/community/CommunityLeftSidebar";
import { CommunityRightSidebar } from "@/components/community/CommunityRightSidebar";
import { CommunityMobileTabs } from "@/components/community/CommunityMobileTabs";
import { ScrollToTopFAB } from "@/components/mobile/ScrollToTopFAB";
import { FeatureGate } from "@/components/membership/FeatureGate";

const ChefsTab = lazy(() => import("@/components/community/ChefsTab").then(m => ({ default: m.ChefsTab })));
const GroupsTab = lazy(() => import("@/components/community/GroupsTab").then(m => ({ default: m.GroupsTab })));
const RecipesTab = lazy(() => import("@/components/community/RecipesTab").then(m => ({ default: m.RecipesTab })));
const EventsTab = lazy(() => import("@/components/community/EventsTab").then(m => ({ default: m.EventsTab })));
const NetworkTab = lazy(() => import("@/components/community/NetworkTab").then(m => ({ default: m.NetworkTab })));
const LiveSessionsTab = lazy(() => import("@/components/community/LiveSessionsTab").then(m => ({ default: m.LiveSessionsTab })));

function TabFallback() {
  return (
    <div className="p-4 space-y-3">
      <Skeleton className="h-8 w-48 rounded-xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
    </div>
  );
}

export default function Community() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  useAdTracking();

  const [searchParams] = useSearchParams();
  const tagParam = searchParams.get("tag");
  const [activeTab, setActiveTab] = useState<CommunityTab>("feed");
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  useEffect(() => {
    if (tagParam) setActiveTab("feed");
  }, [tagParam]);

  // Stable callbacks to prevent re-renders
  const handleSetActiveTab = useCallback((tab: CommunityTab) => setActiveTab(tab), []);
  const handleSetLeftOpen = useCallback((open: boolean) => setLeftSidebarOpen(open), []);
  const handleSetRightOpen = useCallback((open: boolean) => setRightSidebarOpen(open), []);

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "feed":
      case "bookmarks":
        return <CommunityFeed />;
      case "chefs":
        return <Suspense fallback={<TabFallback />}><div className="px-4 py-3 sm:p-4"><ChefsTab /></div></Suspense>;
      case "recipes":
        return <Suspense fallback={<TabFallback />}><div className="px-4 py-3 sm:p-4"><RecipesTab /></div></Suspense>;
      case "groups":
        return <Suspense fallback={<TabFallback />}><div className="px-4 py-3 sm:p-4"><GroupsTab /></div></Suspense>;
      case "events":
        return <Suspense fallback={<TabFallback />}><div className="px-4 py-3 sm:p-4"><EventsTab /></div></Suspense>;
      case "live":
        return (
          <FeatureGate feature="feature_live_sessions" showUpgrade upgradeVariant="card" featureName="Live Sessions" featureNameAr="الجلسات المباشرة">
            <Suspense fallback={<TabFallback />}><div className="px-4 py-3 sm:p-4"><LiveSessionsTab /></div></Suspense>
          </FeatureGate>
        );
      case "network":
        return user ? <Suspense fallback={<TabFallback />}><div className="px-4 py-3 sm:p-4"><NetworkTab /></div></Suspense> : null;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead
        title={isAr ? "مجتمع الطهاة | شبكة الطهاة المحترفين" : "Culinary Community | Professional Chef Network"}
        description={isAr ? "تواصل مع الطهاة وشارك الوصفات وانضم إلى المجموعات المتخصصة في عالم الطهي" : "Connect with chefs, share recipes, join culinary groups, and grow your professional network on Altoha."}
        keywords={isAr ? "مجتمع الطهاة, شبكة طهاة, وصفات مشتركة, مجموعات طهي, تواصل مهني" : "chef community, chef network, shared recipes, cooking groups, professional networking"}
      />
      <Header />

      <main className="flex-1 safe-area-x">
        <div className="mx-auto max-w-[1280px] flex gap-0 px-0 sm:px-3 lg:px-4 pt-0 sm:pt-3">
          {/* Left Sidebar */}
          <CommunityLeftSidebar
            activeTab={activeTab}
            setActiveTab={handleSetActiveTab}
            leftSidebarOpen={leftSidebarOpen}
            setLeftSidebarOpen={handleSetLeftOpen}
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0 lg:mx-3 xl:mx-4 min-h-screen">
            <div className="lg:rounded-2xl lg:border lg:border-border/20 lg:bg-card/50 lg:backdrop-blur-sm overflow-hidden">
              <CommunityMobileTabs activeTab={activeTab} setActiveTab={handleSetActiveTab} />
              {renderTabContent()}
            </div>
          </div>

          {/* Right Sidebar */}
          <CommunityRightSidebar
            rightSidebarOpen={rightSidebarOpen}
            setRightSidebarOpen={handleSetRightOpen}
          />
        </div>
      </main>

      <div className="container px-4 mt-6">
        <RelatedPages currentPath="/community" />
      </div>
      <div className="pb-20 sm:pb-0" />
      <ScrollToTopFAB />
      <Footer />
    </div>
  );
}
