import { Suspense, lazy, useEffect, type ComponentType } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SiteSettingsProvider } from "@/contexts/SiteSettingsContext";
import { ThemeApplicator } from "@/components/ThemeApplicator";
import { SkipToContent } from "@/components/a11y/SkipToContent";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RouteAnnouncer } from "@/components/a11y/RouteAnnouncer";
import { MaintenanceGuard } from "@/components/MaintenanceGuard";
import { PageTransition } from "@/components/mobile/PageTransition";
import { ResourceHints } from "@/components/performance/ResourceHints";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useEnhancedSEO } from "@/hooks/useEnhancedSEO";
import { useSEOTracking } from "@/hooks/useSEOTracking";
import { useWebVitalsTracking } from "@/hooks/useWebVitalsTracking";
import { useLanguage as useLanguageHook } from "@/i18n/LanguageContext";
import { LiveChatWidget } from "@/components/support/LiveChatWidget";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";

import { publicRoutes } from "@/routes/publicRoutes";
import { protectedRoutes } from "@/routes/protectedRoutes";
import { adminRoutes } from "@/routes/adminRoutes";
import { companyRoutes } from "@/routes/companyRoutes";

const AchievementCelebration = lazy(() =>
  import("@/components/achievements/AchievementCelebration").then((m) => ({ default: m.AchievementCelebration }))
);

function safeLazy<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      return await factory();
    } catch {
      return { default: (() => null) as T };
    }
  });
}

const FloatingHelpButton = safeLazy(() =>
  import("@/components/FloatingHelpButton").then((m) => ({ default: m.FloatingHelpButton }))
);
const MobileBottomNav = safeLazy(() =>
  import("@/components/mobile/MobileBottomNav").then((m) => ({ default: m.MobileBottomNav }))
);
const GoogleTrackingProvider = safeLazy(() =>
  import("@/components/tracking/GoogleTrackingProvider").then((m) => ({ default: m.GoogleTrackingProvider }))
);
const TrackingScriptsInjector = safeLazy(() =>
  import("@/components/tracking/TrackingScriptsInjector").then((m) => ({ default: m.TrackingScriptsInjector }))
);
const PageTracker = safeLazy(() =>
  import("@/components/tracking/PageTracker").then((m) => ({ default: m.PageTracker }))
);
const SmartInstallBanner = safeLazy(() =>
  import("@/components/pwa/SmartInstallBanner").then((m) => ({ default: m.SmartInstallBanner }))
);
const OfflineBanner = safeLazy(() =>
  import("@/components/pwa/OfflineBanner").then((m) => ({ default: m.OfflineBanner }))
);
const UpdatePrompt = safeLazy(() =>
  import("@/components/pwa/UpdatePrompt").then((m) => ({ default: m.UpdatePrompt }))
);
const IOSInstallGuide = safeLazy(() =>
  import("@/components/pwa/IOSInstallGuide").then((m) => ({ default: m.IOSInstallGuide }))
);
const AnnouncementBanner = safeLazy(() =>
  import("@/components/engagement/AnnouncementBanner").then((m) => ({ default: m.AnnouncementBanner }))
);
const ReEngagementPrompt = safeLazy(() =>
  import("@/components/engagement/ReEngagementPrompt").then((m) => ({ default: m.ReEngagementPrompt }))
);
const PullToRefreshIndicator = safeLazy(() =>
  import("@/components/pwa/PullToRefreshIndicator").then((m) => ({ default: m.PullToRefreshIndicator }))
);
const ScrollProgress = safeLazy(() =>
  import("@/components/ui/scroll-progress").then((m) => ({ default: m.ScrollProgress }))
);
const BackToTop = safeLazy(() =>
  import("@/components/ui/back-to-top").then((m) => ({ default: m.BackToTop }))
);
const RoutePrefetcher = safeLazy(() =>
  import("@/components/ui/route-prefetcher").then((m) => ({ default: m.RoutePrefetcher }))
);
const GuidedTour = safeLazy(() =>
  import("@/components/onboarding/GuidedTour").then((m) => ({ default: m.GuidedTour }))
);
const CommandPalette = safeLazy(() =>
  import("@/components/search/CommandPalette").then((m) => ({ default: m.CommandPalette }))
);
const NotFound = safeLazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3,
      gcTime: 1000 * 60 * 15,
      retry: (failureCount, error: any) => {
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: "always",
      structuralSharing: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

function AppBootMarker() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-app-boot", "ready");
    return () => {
      document.documentElement.removeAttribute("data-app-boot");
    };
  }, []);

  return null;
}

function AppRoutesShell() {
  return (
    <MaintenanceGuard>
      <ErrorBoundary>
        <Suspense
          fallback={
            <div className="flex h-screen items-center justify-center" role="status" aria-label="Loading">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <span className="sr-only">Loading page...</span>
            </div>
          }
        >
          <div id="main-content" className="pb-16 md:pb-0 overflow-x-hidden">
            <PageTransition>
              <Routes>
                {publicRoutes}
                {protectedRoutes}
                {adminRoutes}
                {companyRoutes}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </PageTransition>
          </div>
        </Suspense>
      </ErrorBoundary>
    </MaintenanceGuard>
  );
}

function AppEnhancements() {
  return (
    <ErrorBoundary fallback={null}>
      <Suspense fallback={null}>
        <FloatingHelpButton />
        <LiveChatWidget />
        <WelcomeModal />
        <GuidedTour />
        <CommandPalette />
        <MobileBottomNav />
        <ScrollProgress />
        <BackToTop />
        <SmartInstallBanner />
        <IOSInstallGuide />
        <OfflineBanner />
        <UpdatePrompt />
        <ReEngagementPrompt />
      </Suspense>
    </ErrorBoundary>
  );
}

function AppContent() {
  const ptr = usePullToRefresh();
  useRealtimeNotifications();
  useOfflineSync();

  const { language } = useLanguageHook();
  useEnhancedSEO(language);
  useSEOTracking();
  useWebVitalsTracking();

  return (
    <>
      <AppBootMarker />
      <ScrollToTop />
      <RouteAnnouncer />
      <SkipToContent />

      <Suspense fallback={null}>
        <PullToRefreshIndicator
          pulling={ptr.pulling}
          pullDistance={ptr.pullDistance}
          refreshing={ptr.refreshing}
          progress={ptr.progress}
        />
        <GoogleTrackingProvider />
        <TrackingScriptsInjector />
        <PageTracker />
        <AnnouncementBanner />
      </Suspense>

      <AppRoutesShell />
      <AppEnhancements />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <LanguageProvider>
        <AuthProvider>
          <SiteSettingsProvider>
            <ThemeApplicator />
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Suspense fallback={null}>
                <AchievementCelebration />
              </Suspense>
              <BrowserRouter>
                <ResourceHints />
                <Suspense fallback={null}>
                  <RoutePrefetcher />
                </Suspense>
                <ErrorBoundary>
                  <AppContent />
                </ErrorBoundary>
              </BrowserRouter>
            </TooltipProvider>
          </SiteSettingsProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
