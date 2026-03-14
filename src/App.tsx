import { Suspense, lazy, useEffect } from "react";
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
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { BackToTop } from "@/components/ui/back-to-top";
import { AnnouncementBanner } from "@/components/engagement/AnnouncementBanner";
import { safeLazy } from "@/lib/safeLazy";

import { publicRoutes } from "@/routes/publicRoutes";
import { protectedRoutes } from "@/routes/protectedRoutes";
import { adminRoutes } from "@/routes/adminRoutes";
import { companyRoutes } from "@/routes/companyRoutes";

// Lazy-load non-critical components
const AIChatbot = safeLazy(() => import("@/components/ai/AIChatbot"));
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
    },
    mutations: { retry: 0 },
  },
});

/** Marks the app as booted for the index.html watchdog */
function AppBootMarker() {
  useEffect(() => {
    document.documentElement.setAttribute("data-app-boot", "ready");
    return () => { document.documentElement.removeAttribute("data-app-boot"); };
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
    <MaintenanceGuard>
      <ErrorBoundary>
        <Suspense fallback={RouteSpinner}>
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

/** Non-critical overlays and global widgets */
function AppOverlays({ isHome }: { isHome: boolean }) {
  return (
    <ErrorBoundary fallback={null}>
      <MobileBottomNav />
      <ScrollProgress />
      <BackToTop />
      <Suspense fallback={null}>
        <AIChatbot />
      </Suspense>
    </ErrorBoundary>
  );
}

/** Root content inside the router */
function AppContent() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <>
      <AppBootMarker />
      <ScrollToTop />
      <RouteAnnouncer />
      <SkipToContent />
      {!isHome && <AnnouncementBanner />}
      <AppRoutes />
      <AppOverlays isHome={isHome} />
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
              <BrowserRouter>
                <ResourceHints />
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
