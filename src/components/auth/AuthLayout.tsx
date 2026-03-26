import { memo } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuthHeroPanel, type AuthStage } from "./AuthHeroPanel";

interface AuthLayoutProps {
  children: React.ReactNode;
  stage: AuthStage;
  isAr: boolean;
  showFooter?: boolean;
  currentStep?: number;
  pageType?: "individual" | "company";
}

export const AuthLayout = memo(function AuthLayout({ children, stage, isAr, showFooter = false, currentStep, pageType = "individual" }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <Header />
      <main className="flex flex-1">
        {/* Hero panel — tablet & desktop */}
        <AuthHeroPanel stage={stage} isAr={isAr} currentStep={currentStep} pageType={pageType} />

        {/* Form panel */}
        <div className="relative flex flex-1 items-start md:items-center justify-center px-4 py-4 sm:px-6 sm:py-8 lg:px-10 overflow-hidden">
          {/* Subtle ambient background */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.04),transparent_60%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--accent)/0.03),transparent_60%)]" />
          <div className="relative w-full max-w-md space-y-4 sm:space-y-5 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">{children}</div>
        </div>
      </main>
      {showFooter && <Footer />}
    </div>
  );
});
