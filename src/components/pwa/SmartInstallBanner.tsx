import { useInstallPrompt } from "@/hooks/usePWA";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

export function SmartInstallBanner() {
  const { canInstall, install, dismiss } = useInstallPrompt();
  const { language } = useLanguage();
  const isAr = language === "ar";

  if (!canInstall) return null;

  return (
    <div className="fixed bottom-20 inset-x-0 z-50 px-3 md:bottom-4 md:px-0 md:flex md:justify-center animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-card/95 p-3 shadow-lg backdrop-blur-md md:max-w-md">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold line-clamp-1">
            {isAr ? "ثبّت Altohaa" : "Install Altohaa"}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {isAr ? "أضفه لشاشتك الرئيسية" : "Add to your home screen"}
          </p>
        </div>
        <Button size="sm" onClick={install} className="shrink-0">
          {isAr ? "تثبيت" : "Install"}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={dismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
