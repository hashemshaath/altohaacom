import { Suspense, lazy } from "react";
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
import { MaintenanceGuard } from "@/components/MaintenanceGuard";
import { ResourceHints } from "@/components/performance/ResourceHints";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { useEnhancedSEO } from "@/hooks/useEnhancedSEO";
import { useLanguage as useLanguageHook } from "@/i18n/LanguageContext";

// Lazy-loaded shell components (non-critical for first paint)
const FloatingHelpButton = lazy(() => import("@/components/FloatingHelpButton").then(m => ({ default: m.FloatingHelpButton })));
const MobileBottomNav = lazy(() => import("@/components/mobile/MobileBottomNav").then(m => ({ default: m.MobileBottomNav })));
const GoogleTrackingProvider = lazy(() => import("@/components/tracking/GoogleTrackingProvider").then(m => ({ default: m.GoogleTrackingProvider })));
const TrackingScriptsInjector = lazy(() => import("@/components/tracking/TrackingScriptsInjector").then(m => ({ default: m.TrackingScriptsInjector })));
const PageTracker = lazy(() => import("@/components/tracking/PageTracker").then(m => ({ default: m.PageTracker })));
import { SmartInstallBanner } from "@/components/pwa/SmartInstallBanner";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";
import { UpdatePrompt } from "@/components/pwa/UpdatePrompt";
import { IOSInstallGuide } from "@/components/pwa/IOSInstallGuide";
import { PullToRefreshIndicator } from "@/components/pwa/PullToRefreshIndicator";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { BackToTop } from "@/components/ui/back-to-top";
import { RoutePrefetcher } from "@/components/ui/route-prefetcher";

const LiveChatWidget = lazy(() => import("@/components/crm/LiveChatWidget").then(m => ({ default: m.LiveChatWidget })));
const WelcomeModal = lazy(() => import("@/components/onboarding/WelcomeModal").then(m => ({ default: m.WelcomeModal })));
const GuidedTour = lazy(() => import("@/components/onboarding/GuidedTour").then(m => ({ default: m.GuidedTour })));
const NotFound = lazy(() => import("./pages/NotFound"));

import { publicRoutes } from "@/routes/publicRoutes";
import { protectedRoutes } from "@/routes/protectedRoutes";
import { adminRoutes } from "@/routes/adminRoutes";
import { companyRoutes } from "@/routes/companyRoutes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3,
      gcTime: 1000 * 60 * 15,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: "always",
    },
    mutations: {
      retry: 0,
    },
  },
});

function AppContent() {
  const ptr = usePullToRefresh();
  useRealtimeNotifications();
  const { language } = useLanguageHook();
  useEnhancedSEO(language);
  return (
    <>
      <ErrorBoundary><PullToRefreshIndicator {...ptr} /></ErrorBoundary>
      <ScrollToTop />
      <SkipToContent />
      <ErrorBoundary>
        <Suspense fallback={null}>
          <GoogleTrackingProvider />
          <TrackingScriptsInjector />
          <PageTracker />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary><Suspense fallback={null}><FloatingHelpButton /></Suspense></ErrorBoundary>
      <MaintenanceGuard>
      <ErrorBoundary>
      <Suspense fallback={<div className="flex h-screen items-center justify-center" role="status" aria-label="Loading"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /><span className="sr-only">Loading page...</span></div>}>
      <main id="main-content" className="pt-14 pb-16 md:pb-0 overflow-x-hidden">
      <Routes>
        {publicRoutes}
        {protectedRoutes}
        {adminRoutes}
        {companyRoutes}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </main>
      </Suspense>
      </ErrorBoundary>
      </MaintenanceGuard>
      <ErrorBoundary><Suspense fallback={null}><LiveChatWidget /></Suspense></ErrorBoundary>
      <ErrorBoundary><Suspense fallback={null}><WelcomeModal /></Suspense></ErrorBoundary>
      <ErrorBoundary><Suspense fallback={null}><GuidedTour /></Suspense></ErrorBoundary>
      <Suspense fallback={null}><MobileBottomNav /></Suspense>
      <ScrollProgress />
      <BackToTop />
      <ErrorBoundary>
        <SmartInstallBanner />
        <IOSInstallGuide />
        <OfflineBanner />
        <UpdatePrompt />
      </ErrorBoundary>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <LanguageProvider>
        <AuthProvider>
          <SiteSettingsProvider>
          <ThemeApplicator />
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ResourceHints />
              <ErrorBoundary><RoutePrefetcher /></ErrorBoundary>
              <AppContent />
            </BrowserRouter>
          </TooltipProvider>
          </SiteSettingsProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
