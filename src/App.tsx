import { Suspense, lazy, useEffect, forwardRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
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
import { GoogleTrackingProvider } from "@/components/tracking/GoogleTrackingProvider";
import { TrackingScriptsInjector } from "@/components/tracking/TrackingScriptsInjector";
import { FloatingHelpButton } from "@/components/FloatingHelpButton";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { PageTracker } from "@/components/tracking/PageTracker";
import { SmartInstallBanner } from "@/components/pwa/SmartInstallBanner";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";
import { UpdatePrompt } from "@/components/pwa/UpdatePrompt";
import { IOSInstallGuide } from "@/components/pwa/IOSInstallGuide";
import { AnnouncementBanner } from "@/components/engagement/AnnouncementBanner";
import { ReEngagementPrompt } from "@/components/engagement/ReEngagementPrompt";
import { PullToRefreshIndicator } from "@/components/pwa/PullToRefreshIndicator";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { BackToTop } from "@/components/ui/back-to-top";
import { GuidedTour } from "@/components/onboarding/GuidedTour";
import { CommandPalette } from "@/components/search/CommandPalette";
import { safeLazy } from "@/lib/safeLazy";

import { publicRoutes } from "@/routes/publicRoutes";
import { protectedRoutes } from "@/routes/protectedRoutes";
import { adminRoutes } from "@/routes/adminRoutes";
import { companyRoutes } from "@/routes/companyRoutes";

const AIChatbot = safeLazy(() => import("@/components/ai/AIChatbot"));
const AchievementCelebration = safeLazy(() =>
  import("@/components/achievements/AchievementCelebration").then((m) => ({ default: m.AchievementCelebration }))
);
const RoutePrefetcher = safeLazy(() =>
  import("@/components/ui/route-prefetcher").then((m) => ({ default: m.RoutePrefetcher }))
);
const NotFound = lazy(() => import("./pages/NotFound"));

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

const AppEnhancements = forwardRef<HTMLDivElement, { isHome: boolean }>(function AppEnhancements({ isHome }, _ref) {
  return (
    <ErrorBoundary fallback={null}>
      <MobileBottomNav />
      <ScrollProgress />
      <BackToTop />
      <SmartInstallBanner />
      <IOSInstallGuide />
      <OfflineBanner />
      <UpdatePrompt />

      {!isHome && (
        <>
          <FloatingHelpButton />
          <LiveChatWidget />
          <WelcomeModal />
          <GuidedTour />
          <CommandPalette />
          <ReEngagementPrompt />
        </>
      )}
    </ErrorBoundary>
  );
});

AppEnhancements.displayName = "AppEnhancements";

function AppContent() {
  const ptr = usePullToRefresh();
  useRealtimeNotifications();
  useOfflineSync();

  const { language } = useLanguageHook();
  const location = useLocation();
  const isHome = location.pathname === "/";

  useEnhancedSEO(language);
  useSEOTracking();
  useWebVitalsTracking();

  return (
    <>
      <AppBootMarker />
      <ScrollToTop />
      <RouteAnnouncer />
      <SkipToContent />

      <PullToRefreshIndicator
        pulling={ptr.pulling}
        pullDistance={ptr.pullDistance}
        refreshing={ptr.refreshing}
        progress={ptr.progress}
      />
      <GoogleTrackingProvider />
      <TrackingScriptsInjector />
      <PageTracker />
      {!isHome && <AnnouncementBanner />}

      <AppRoutesShell />
      <AppEnhancements isHome={isHome} />
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
              <ErrorBoundary fallback={null}>
                <Suspense fallback={null}>
                  <AchievementCelebration />
                </Suspense>
              </ErrorBoundary>
              <BrowserRouter>
                <ResourceHints />
                <ErrorBoundary fallback={null}>
                  <Suspense fallback={null}>
                    <RoutePrefetcher />
                  </Suspense>
                </ErrorBoundary>
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
