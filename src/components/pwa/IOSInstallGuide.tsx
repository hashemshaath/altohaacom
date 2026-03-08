import { useState, useEffect, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Share, Plus, X, ArrowDown } from "lucide-react";

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function isInStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
}

export function IOSInstallGuide() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isIOS() || isInStandaloneMode()) return;
    const dismissed = localStorage.getItem("ios_install_dismissed");
    if (dismissed) {
      const ts = parseInt(dismissed);
      if (Date.now() - ts < 14 * 24 * 60 * 60 * 1000) return; // 14 days
    }
    // Delay show for better UX
    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem("ios_install_dismissed", Date.now().toString());
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 inset-x-0 z-50 px-3 md:hidden animate-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-2xl border border-primary/20 bg-card/95 p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-chart-4/20">
            <Plus className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">
              {isAr ? "أضف Altoha لشاشتك الرئيسية" : "Add Altoha to Home Screen"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAr ? "للحصول على تجربة أفضل وأسرع" : "For a faster, app-like experience"}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 -mt-1 -me-1" onClick={dismiss}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Steps */}
        <div className="mt-3 space-y-2.5">
          <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <span className="text-xs font-bold text-primary">1</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Share className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium">
                {isAr ? 'اضغط على زر "مشاركة"' : 'Tap the "Share" button'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <span className="text-xs font-bold text-primary">2</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowDown className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium">
                {isAr ? 'مرر للأسفل واضغط "أضف للشاشة الرئيسية"' : 'Scroll down & tap "Add to Home Screen"'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <span className="text-xs font-bold text-primary">3</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium">
                {isAr ? 'اضغط "إضافة" للتثبيت' : 'Tap "Add" to install'}
              </span>
            </div>
          </div>
        </div>

        <Button size="sm" variant="outline" className="w-full mt-3" onClick={dismiss}>
          {isAr ? "فهمت" : "Got it"}
        </Button>
      </div>
    </div>
  );
}
