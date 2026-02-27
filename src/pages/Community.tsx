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
import { Users } from "lucide-react";
import { FeatureGate } from "@/components/membership/FeatureGate";

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
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
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

      {/* Editorial Community Hero */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-background to-chart-2/6" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.10),transparent_70%)]" />
        <div className="container relative py-8 md:py-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 ring-1 ring-primary/20">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
                  {isAr ? "مجتمع الطهاة" : "Culinary Community"}
                </span>
              </div>
              <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">
                {isAr ? "المجتمع" : "Community"}
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed md:text-base">
                {isAr
                  ? "ماذا يحدث في مجتمع الطهاة؟"
                  : "What's happening in the chef community?"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="container flex-1">
        <div className="mx-auto max-w-[1200px] flex gap-0 lg:gap-2">
          <CommunityLeftSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            leftSidebarOpen={leftSidebarOpen}
            setLeftSidebarOpen={setLeftSidebarOpen}
          />

          <div className="flex-1 min-w-0 border-x border-border min-h-screen">
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
      <Footer />
    </div>
  );
}
