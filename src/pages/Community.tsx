import { useState, useEffect, lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { SEOHead } from "@/components/SEOHead";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdTracking } from "@/hooks/useAdTracking";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { CommunityLeftSidebar, type CommunityTab } from "@/components/community/CommunityLeftSidebar";
import { CommunityRightSidebar } from "@/components/community/CommunityRightSidebar";
import { CommunityMobileTabs } from "@/components/community/CommunityMobileTabs";
import { ScrollToTopFAB } from "@/components/mobile/ScrollToTopFAB";
import { Users } from "lucide-react";
import { FeatureGate } from "@/components/membership/FeatureGate";
import { ActivityPulse } from "@/components/ui/activity-pulse";

// Lazy load heavy tabs
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead
        title={isAr ? "مجتمع الطهاة" : "Culinary Community"}
        description={isAr ? "تواصل مع الطهاة وشارك الوصفات وانضم إلى المجموعات" : "Connect with chefs, share recipes, join groups on Altoha."}
      />
      <Header />

      {/* Editorial Community Hero — compact on mobile */}
      <section className="relative overflow-hidden border-b border-border/30">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-chart-2/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/30 to-transparent" />
        <div className="container relative py-3 sm:py-8 md:py-12">
          <div className="flex flex-col gap-2 sm:gap-4 md:flex-row md:items-end md:justify-between" style={{ animation: "heroFadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
            <div className="max-w-2xl space-y-2 sm:space-y-4">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-primary/10 px-3 sm:px-4 py-1.5 sm:py-2 ring-1 ring-primary/15 shadow-sm shadow-primary/5">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
                  {isAr ? "مجتمع الطهاة" : "Culinary Community"}
                </span>
                <ActivityPulse status="live" size="sm" />
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl lg:text-[2.75rem]">
                {isAr ? "المجتمع" : "Community"}
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed md:text-base max-w-lg hidden sm:block">
                {isAr
                  ? "ماذا يحدث في مجتمع الطهاة؟"
                  : "What's happening in the chef community?"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="container flex-1 px-0 sm:px-4">
        <div className="mx-auto max-w-[1200px] flex gap-0 lg:gap-3">
          <CommunityLeftSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            leftSidebarOpen={leftSidebarOpen}
            setLeftSidebarOpen={setLeftSidebarOpen}
          />

          <div className="flex-1 min-w-0 border-x border-border/30 min-h-screen">
            <CommunityMobileTabs activeTab={activeTab} setActiveTab={setActiveTab} />

            {(activeTab === "feed" || activeTab === "bookmarks") && <CommunityFeed />}
            {activeTab === "chefs" && <Suspense fallback={<TabFallback />}><div className="p-4"><ChefsTab /></div></Suspense>}
            {activeTab === "recipes" && <Suspense fallback={<TabFallback />}><div className="p-4"><RecipesTab /></div></Suspense>}
            {activeTab === "groups" && <Suspense fallback={<TabFallback />}><div className="p-4"><GroupsTab /></div></Suspense>}
            {activeTab === "events" && <Suspense fallback={<TabFallback />}><div className="p-4"><EventsTab /></div></Suspense>}
            {activeTab === "live" && <FeatureGate feature="feature_live_sessions" showUpgrade upgradeVariant="card" featureName="Live Sessions" featureNameAr="الجلسات المباشرة"><Suspense fallback={<TabFallback />}><div className="p-4"><LiveSessionsTab /></div></Suspense></FeatureGate>}
            {activeTab === "network" && user && <Suspense fallback={<TabFallback />}><div className="p-4"><NetworkTab /></div></Suspense>}
          </div>

          <CommunityRightSidebar
            rightSidebarOpen={rightSidebarOpen}
            setRightSidebarOpen={setRightSidebarOpen}
          />
        </div>
      </main>
      <div className="pb-20 sm:pb-0" />
      <ScrollToTopFAB />
      <Footer />
      
    </div>
  );
}
