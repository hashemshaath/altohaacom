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
}

export const AuthLayout = memo(function AuthLayout({ children, stage, isAr, showFooter = false, currentStep }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <Header />
      <main className="flex flex-1">
        {/* Hero panel — tablet & desktop */}
        <AuthHeroPanel stage={stage} isAr={isAr} currentStep={currentStep} />

        {/* Form panel */}
        <div className="flex flex-1 items-start md:items-center justify-center px-4 py-4 sm:px-6 sm:py-8 lg:px-10">
          <div className="w-full max-w-md space-y-4 sm:space-y-5">{children}</div>
        </div>
      </main>
      {showFooter && <Footer />}
    </div>
  );
});
