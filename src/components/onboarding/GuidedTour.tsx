import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const TOUR_KEY = "altoha_tour_completed";

interface TourStep {
  targetSelector: string;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
}

const STEPS: TourStep[] = [
  {
    targetSelector: '[aria-label="Quick search"], [aria-label="البحث السريع"]',
    titleEn: "Search Everything",
    titleAr: "ابحث عن كل شيء",
    descEn: "Find competitions, exhibitions, chefs, and more instantly.",
    descAr: "ابحث عن المسابقات والمعارض والطهاة فوراً.",
  },
  {
    targetSelector: '[aria-label="Platform statistics"], [aria-label="إحصائيات المنصة"]',
    titleEn: "Live Statistics",
    titleAr: "إحصائيات حية",
    descEn: "See our growing global community of culinary professionals.",
    descAr: "شاهد مجتمعنا العالمي المتنامي من المحترفين.",
  },
  {
    targetSelector: '#events-cat-heading',
    titleEn: "Explore Events",
    titleAr: "استكشف الفعاليات",
    descEn: "Browse competitions, exhibitions, and chef's table sessions.",
    descAr: "تصفح المسابقات والمعارض وجلسات طاولة الشيف.",
  },
];

export function GuidedTour() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [step, setStep] = useState(-1); // -1 = not started
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!user) return;
    const done = localStorage.getItem(TOUR_KEY);
    if (done) return;
    // Start tour after a delay
    const timer = setTimeout(() => setStep(0), 3000);
    return () => clearTimeout(timer);
  }, [user]);

  const updatePosition = useCallback(() => {
    if (step < 0 || step >= STEPS.length) return;
    const el = document.querySelector(STEPS[step].targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setPosition({
        top: Math.min(rect.bottom + 12, window.innerHeight - 200),
        left: Math.max(16, Math.min(rect.left, window.innerWidth - 320)),
      });
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [step]);

  useEffect(() => {
    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [updatePosition]);

  const handleNext = () => {
    if (step >= STEPS.length - 1) {
      setStep(-1);
      localStorage.setItem(TOUR_KEY, "true");
    } else {
      setStep(s => s + 1);
    }
  };

  const handleDismiss = () => {
    setStep(-1);
    localStorage.setItem(TOUR_KEY, "true");
  };

  if (step < 0 || step >= STEPS.length) return null;

  const current = STEPS[step];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[9998] bg-background/40 backdrop-blur-[2px]" onClick={handleDismiss} />

      {/* Tooltip */}
      <Card
        className="fixed z-[9999] w-72 sm:w-80 p-4 shadow-2xl border-primary/20 animate-in fade-in slide-in-from-bottom-2 duration-300"
        style={{ top: position.top, left: position.left }}
      >
        <button onClick={handleDismiss} className="absolute top-2 end-2 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <h4 className="text-sm font-bold">{isAr ? current.titleAr : current.titleEn}</h4>
        </div>

        <p className="text-xs text-muted-foreground mb-3">
          {isAr ? current.descAr : current.descEn}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {step + 1} / {STEPS.length}
          </span>
          <div className="flex gap-1.5">
            {step > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setStep(s => s - 1)}>
                <ChevronLeft className="h-3 w-3 me-0.5" />
                {isAr ? "السابق" : "Back"}
              </Button>
            )}
            <Button size="sm" className="h-7 text-xs" onClick={handleNext}>
              {step >= STEPS.length - 1 ? (isAr ? "تم!" : "Done!") : (isAr ? "التالي" : "Next")}
              {step < STEPS.length - 1 && <ChevronRight className="h-3 w-3 ms-0.5" />}
            </Button>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1 mt-2">
          {STEPS.map((_, i) => (
            <div key={i} className={cn("h-1 rounded-full transition-all", i === step ? "w-4 bg-primary" : "w-1 bg-muted-foreground/20")} />
          ))}
        </div>
      </Card>
    </>
  );
}
