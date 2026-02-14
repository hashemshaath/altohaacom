import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { FloatingHelpButton } from "@/components/FloatingHelpButton";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { SkipToContent } from "@/components/a11y/SkipToContent";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <SkipToContent />
              <Suspense fallback={null}><LiveChatWidget /></Suspense>
              <FloatingHelpButton />
              <ErrorBoundary>
              <Suspense fallback={<div className="flex h-screen items-center justify-center" role="status" aria-label="Loading"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /><span className="sr-only">Loading page...</span></div>}>
              <main id="main-content" className="pb-16 md:pb-0">
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
              <MobileBottomNav />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
