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
import { FloatingHelpButton } from "@/components/FloatingHelpButton";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { SkipToContent } from "@/components/a11y/SkipToContent";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GoogleTrackingProvider } from "@/components/tracking/GoogleTrackingProvider";
import { TrackingScriptsInjector } from "@/components/tracking/TrackingScriptsInjector";
import { MaintenanceGuard } from "@/components/MaintenanceGuard";
import { PageTracker } from "@/components/tracking/PageTracker";
import { SmartInstallBanner } from "@/components/pwa/SmartInstallBanner";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";
import { UpdatePrompt } from "@/components/pwa/UpdatePrompt";

const LiveChatWidget = lazy(() => import("@/components/crm/LiveChatWidget").then(m => ({ default: m.LiveChatWidget })));
const NotFound = lazy(() => import("./pages/NotFound"));

import { publicRoutes } from "@/routes/publicRoutes";
import { protectedRoutes } from "@/routes/protectedRoutes";
import { adminRoutes } from "@/routes/adminRoutes";
import { companyRoutes } from "@/routes/companyRoutes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: "always",
    },
    mutations: {
      retry: 0,
    },
  },
});

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
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <SkipToContent />
              <GoogleTrackingProvider />
              <TrackingScriptsInjector />
              <PageTracker />
              <Suspense fallback={null}><LiveChatWidget /></Suspense>
              <FloatingHelpButton />
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
              <MobileBottomNav />
              <SmartInstallBanner />
              <OfflineBanner />
              <UpdatePrompt />
            </BrowserRouter>
          </TooltipProvider>
          </SiteSettingsProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
