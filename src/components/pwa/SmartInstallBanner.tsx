import { memo } from "react";
import { useInstallPrompt } from "@/hooks/usePWA";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Download, X, Smartphone, Zap, WifiOff } from "lucide-react";

export const SmartInstallBanner = memo(function SmartInstallBanner() {
  const { canInstall, install, dismiss } = useInstallPrompt();
  const { language } = useLanguage();
  const isAr = language === "ar";

  if (!canInstall) return null;

  const features = [
    { icon: Zap, labelEn: "Fast", labelAr: "سريع" },
    { icon: WifiOff, labelEn: "Offline", labelAr: "بدون نت" },
    { icon: Smartphone, labelEn: "Native feel", labelAr: "تجربة أصلية" },
  ];

  return (
    <div className="fixed bottom-20 inset-x-0 z-50 px-3 md:bottom-4 md:px-0 md:flex md:justify-center animate-in slide-in-from-bottom-4 duration-500 safe-area-bottom">
      <div className="rounded-2xl border border-primary/20 bg-card/95 p-3.5 sm:p-4 shadow-xl backdrop-blur-md md:max-w-md">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-chart-4/20">
            <Download className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">
              {isAr ? "ثبّت تطبيق Altoha" : "Install Altoha App"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAr ? "احصل على تجربة أفضل مباشرة من شاشتك" : "Get the best experience right from your screen"}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 -mt-1 -me-1" onClick={dismiss}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Feature pills */}
        <div className="flex items-center gap-2 mt-3 mb-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.labelEn} className="flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1">
                <Icon className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-medium text-muted-foreground">{isAr ? f.labelAr : f.labelEn}</span>
              </div>
            );
          })}
        </div>

        <Button size="sm" onClick={install} className="w-full active:scale-[0.98] transition-transform">
          <Download className="me-2 h-4 w-4" />
          {isAr ? "تثبيت الآن" : "Install Now"}
        </Button>
      </div>
    </div>
  );
}
