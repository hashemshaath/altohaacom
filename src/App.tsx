import { Suspense, lazy, useLayoutEffect, memo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, MutationCache } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SiteSettingsProvider } from "@/contexts/SiteSettingsContext";
import { ThemeApplicator } from "@/components/ThemeApplicator";
import { SkipToContent } from "@/components/a11y/SkipToContent";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { RouteAnnouncer } from "@/components/a11y/RouteAnnouncer";
import { MaintenanceGuard } from "@/components/MaintenanceGuard";
import { PageTransition } from "@/components/mobile/PageTransition";
import { ResourceHints } from "@/components/performance/ResourceHints";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { BackToTop } from "@/components/ui/back-to-top";
import { safeLazy } from "@/lib/safeLazy";
const CommandPalette = safeLazy(() => import("@/components/search/CommandPalette").then(m => ({ default: m.CommandPalette })));
const AnnouncementBanner = safeLazy(() => import("@/components/engagement/AnnouncementBanner").then(m => ({ default: m.AnnouncementBanner })));
import { GoogleTrackingProvider } from "@/components/tracking/GoogleTrackingProvider";
import { PageTracker } from "@/components/tracking/PageTracker";
import { useSEOTracking } from "@/hooks/useSEOTracking";
import { useWebVitalsTracking } from "@/hooks/useWebVitalsTracking";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { useOfflineMutationManager } from "@/hooks/useOfflineMutationManager";
import { RouteLoadingBar } from "@/components/RouteLoadingBar";

import { publicRoutes } from "@/routes/publicRoutes";
import { protectedRoutes } from "@/routes/protectedRoutes";
import { adminRoutes } from "@/routes/adminRoutes";
import { companyRoutes } from "@/routes/companyRoutes";

// Lazy-load non-critical components
const AIChatbot = safeLazy(() => import("@/components/ai/AIChatbot"));
const NotFound = lazy(() => import("./pages/NotFound"));

import { handleSupabaseError, redirectOnSessionExpiry } from "@/lib/supabaseErrorHandler";
import { AppError } from "@/lib/AppError";
import { CACHE } from "@/lib/queryConfig";

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => {
      const appError = error instanceof AppError ? error : handleSupabaseError(error);
      if (import.meta.env.DEV) {
        console.error("[Mutation Error]", appError.code, appError.message);
      }
      // Auto-redirect on session expiry
      redirectOnSessionExpiry(appError);
    },
  }),
  defaultOptions: {
    queries: {
      ...CACHE.default,
      networkMode: "offlineFirst",
      retry: (failureCount, error) => {
        const appError = error instanceof AppError ? error : handleSupabaseError(error);
        if (!appError.isRetryable) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: "always",
    },
    mutations: {
      retry: 0,
      networkMode: "offlineFirst",
    },
  },
});

/** Marks the app as booted for the index.html watchdog */
function AppBootMarker() {
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-app-boot", "ready");
    (window as Window & { __markBootReady?: () => void }).__markBootReady?.();
    try {
      window.sessionStorage.removeItem("altoha-chunk-reload-once");
    } catch {
      // Ignore restricted storage environments
    }
  }, []);
  return null;
}

/** Loading spinner shown while route chunks load */
const RouteSpinner = (
  <div className="flex h-screen items-center justify-center" role="status" aria-label="Loading">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    <span className="sr-only">Loading page...</span>
  </div>
);

/** All application routes */
function AppRoutes() {
  return (
    <SectionErrorBoundary name="app-routes">
      <MaintenanceGuard>
        <Suspense fallback={RouteSpinner}>
          <div id="main-content" className="min-h-screen pb-16 md:pb-0">
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
      </MaintenanceGuard>
    </SectionErrorBoundary>
  );
}

/** Non-critical overlays and global widgets */
const AppOverlays = memo(function AppOverlays({ isHome }: { isHome: boolean }) {
  return (
    <SectionErrorBoundary name="overlays" variant="compact">
      <MobileBottomNav />
      {!isHome && <ScrollProgress />}
      <BackToTop />
      {!isHome && (
        <Suspense fallback={null}>
          <AIChatbot />
        </Suspense>
      )}
    </SectionErrorBoundary>
  );
});

/** Root content inside the router */
function AppContent() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  // SEO analytics tracking hooks (page views + Core Web Vitals)
  useSEOTracking();
  useWebVitalsTracking();
  useOfflineMutationManager();

  return (
    <>
      <AppBootMarker />
      <OfflineIndicator />
      <RouteLoadingBar />
      <ScrollToTop />
      <RouteAnnouncer />
      <SkipToContent />
      {/* ─── Global Tracking ─── */}
      <GoogleTrackingProvider />
      <PageTracker />
      <Suspense fallback={null}>
        {!isHome && <AnnouncementBanner />}
        <CommandPalette />
      </Suspense>
      <AppRoutes />
      <AppOverlays isHome={isHome} />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <div>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <LanguageProvider>
            <AuthProvider>
              <SiteSettingsProvider>
                <ThemeApplicator />
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <ResourceHints />
                    <ErrorBoundary>
                      <div>
                        <AppContent />
                      </div>
                    </ErrorBoundary>
                  </BrowserRouter>
                </TooltipProvider>
              </SiteSettingsProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </div>
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;
