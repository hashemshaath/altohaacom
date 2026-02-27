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

// Lazy-loaded shell components (non-critical for first paint)
const FloatingHelpButton = lazy(() => import("@/components/FloatingHelpButton").then(m => ({ default: m.FloatingHelpButton })));
const MobileBottomNav = lazy(() => import("@/components/mobile/MobileBottomNav").then(m => ({ default: m.MobileBottomNav })));
const GoogleTrackingProvider = lazy(() => import("@/components/tracking/GoogleTrackingProvider").then(m => ({ default: m.GoogleTrackingProvider })));
const TrackingScriptsInjector = lazy(() => import("@/components/tracking/TrackingScriptsInjector").then(m => ({ default: m.TrackingScriptsInjector })));
const PageTracker = lazy(() => import("@/components/tracking/PageTracker").then(m => ({ default: m.PageTracker })));
const SmartInstallBanner = lazy(() => import("@/components/pwa/SmartInstallBanner").then(m => ({ default: m.SmartInstallBanner })));
const OfflineBanner = lazy(() => import("@/components/pwa/OfflineBanner").then(m => ({ default: m.OfflineBanner })));
const UpdatePrompt = lazy(() => import("@/components/pwa/UpdatePrompt").then(m => ({ default: m.UpdatePrompt })));
const IOSInstallGuide = lazy(() => import("@/components/pwa/IOSInstallGuide").then(m => ({ default: m.IOSInstallGuide })));
const PullToRefreshIndicator = lazy(() => import("@/components/pwa/PullToRefreshIndicator").then(m => ({ default: m.PullToRefreshIndicator })));
const ScrollProgress = lazy(() => import("@/components/ui/scroll-progress").then(m => ({ default: m.ScrollProgress })));
const BackToTop = lazy(() => import("@/components/ui/back-to-top").then(m => ({ default: m.BackToTop })));
const RoutePrefetcher = lazy(() => import("@/components/ui/route-prefetcher").then(m => ({ default: m.RoutePrefetcher })));

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
  return (
    <>
      <Suspense fallback={null}><PullToRefreshIndicator {...ptr} /></Suspense>
      <ScrollToTop />
      <SkipToContent />
      <Suspense fallback={null}>
        <GoogleTrackingProvider />
        <TrackingScriptsInjector />
        <PageTracker />
      </Suspense>
      <Suspense fallback={null}><FloatingHelpButton /></Suspense>
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
      <Suspense fallback={null}>
        <MobileBottomNav />
        <ScrollProgress />
        <BackToTop />
        <SmartInstallBanner />
        <IOSInstallGuide />
        <OfflineBanner />
        <UpdatePrompt />
      </Suspense>
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
              <Suspense fallback={null}><RoutePrefetcher /></Suspense>
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
