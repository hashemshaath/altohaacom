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

export function AuthLayout({ children, stage, isAr, showFooter = false, currentStep }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col" dir={isAr ? "rtl" : "ltr"}>
      <Header />
      <main className="flex flex-1">
        {/* Hero panel — desktop only */}
        <AuthHeroPanel stage={stage} isAr={isAr} currentStep={currentStep} />

        {/* Form panel */}
        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
          <div className="w-full max-w-md space-y-5">{children}</div>
        </div>
      </main>
      {showFooter && <Footer />}
    </div>
  );
}
