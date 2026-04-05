import React from "react";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAccountType } from "@/hooks/useAccountType";
import { useUserRoles } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, ChevronRight, ChevronLeft, Sparkles, Gavel, Trophy, ChefHat, Users, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const TOUR_PREFIX = "altoha_tour_";

const safeStorageGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeStorageSet = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // no-op
  }
};

interface TourStep {
  targetSelector: string;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  icon?: React.ElementType;
}

// ── Role-specific tour steps ──

const JUDGE_STEPS: TourStep[] = [
  {
    targetSelector: '[href="/judging"], [href="/dashboard"]',
    titleEn: "Your Judging Dashboard",
    titleAr: "لوحة التحكيم الخاصة بك",
    descEn: "Access your assigned competitions, scoring interface, and evaluation tools all in one place.",
    descAr: "اطّلع على المسابقات المسندة إليك وأدوات التقييم والتسجيل في مكان واحد.",
    icon: Gavel,
  },
  {
    targetSelector: '[href="/competitions"]',
    titleEn: "Browse Competitions",
    titleAr: "تصفح المسابقات",
    descEn: "View all competitions — you'll see your assigned ones highlighted with a judge badge.",
    descAr: "عرض جميع المسابقات — ستظهر المسابقات المُسندة إليك بشارة حكم.",
    icon: Trophy,
  },
  {
    targetSelector: '[href="/profile"], [aria-label="User menu"]',
    titleEn: "Judge Profile & Documents",
    titleAr: "الملف الشخصي والمستندات",
    descEn: "Manage your judge profile, upload certifications, and track your judging history.",
    descAr: "أدِر ملفك كحكم، ارفع الشهادات، وتابع سجل التحكيم.",
    icon: Star,
  },
  {
    targetSelector: '[href="/knowledge"]',
    titleEn: "Knowledge & AI Assistant",
    titleAr: "المعرفة ومساعد الذكاء الاصطناعي",
    descEn: "Access judging rubrics, scoring guides, and get AI-powered evaluation assistance.",
    descAr: "اطّلع على معايير التحكيم وأدلة التسجيل واحصل على مساعدة الذكاء الاصطناعي.",
  },
];

const ORGANIZER_STEPS: TourStep[] = [
  {
    targetSelector: '[href="/dashboard"]',
    titleEn: "Organizer Dashboard",
    titleAr: "لوحة تحكم المنظم",
    descEn: "Your command center — manage competitions, exhibitions, and track registrations.",
    descAr: "مركز التحكم — أدِر المسابقات والمعارض وتابع التسجيلات.",
    icon: Users,
  },
  {
    targetSelector: '[href="/competitions"]',
    titleEn: "Create & Manage Competitions",
    titleAr: "إنشاء وإدارة المسابقات",
    descEn: "Use the multi-step wizard to create competitions with categories, criteria, and judges.",
    descAr: "استخدم معالج الخطوات لإنشاء مسابقات بالفئات والمعايير والحكام.",
    icon: Trophy,
  },
  {
    targetSelector: '[href="/exhibitions"]',
    titleEn: "Exhibitions & Events",
    titleAr: "المعارض والفعاليات",
    descEn: "Create exhibitions, manage booths, ticketing, and event schedules.",
    descAr: "أنشئ المعارض وأدِر الأجنحة والتذاكر والجداول الزمنية.",
  },
  {
    targetSelector: '[href="/sponsors"], [href="/for-organizers"]',
    titleEn: "Sponsorships & Partners",
    titleAr: "الرعاية والشراكات",
    descEn: "Attract sponsors, manage partnerships, and grow your event reach.",
    descAr: "استقطب الرعاة وأدِر الشراكات ووسّع نطاق فعالياتك.",
  },
];

const CHEF_STEPS: TourStep[] = [
  {
    targetSelector: '[href="/profile"], [aria-label="User menu"]',
    titleEn: "Your Chef Profile",
    titleAr: "ملفك كطاهٍ",
    descEn: "Build your professional profile — showcase your experience, specialties, and certificates.",
    descAr: "أنشئ ملفك المهني — اعرض خبراتك وتخصصاتك وشهاداتك.",
    icon: ChefHat,
  },
  {
    targetSelector: '[href="/competitions"]',
    titleEn: "Compete & Win",
    titleAr: "نافس واربح",
    descEn: "Register for culinary competitions and showcase your skills to the world.",
    descAr: "سجّل في المسابقات الطهوية واعرض مهاراتك للعالم.",
    icon: Trophy,
  },
  {
    targetSelector: '[href="/recipes"]',
    titleEn: "Share Your Recipes",
    titleAr: "شارك وصفاتك",
    descEn: "Publish your signature recipes, get ratings, and build your following.",
    descAr: "انشر وصفاتك المميزة واحصل على تقييمات وابنِ جمهورك.",
  },
  {
    targetSelector: '[href="/community"]',
    titleEn: "Connect & Grow",
    titleAr: "تواصل وتطوّر",
    descEn: "Network with fellow chefs, join groups, and share your culinary journey.",
    descAr: "تواصل مع الطهاة الآخرين وانضم لمجموعات وشارك رحلتك.",
    icon: Users,
  },
  {
    targetSelector: '[href="/masterclasses"]',
    titleEn: "Learn & Teach",
    titleAr: "تعلّم وعلّم",
    descEn: "Enroll in masterclasses or create your own to share your expertise.",
    descAr: "سجّل في الدروس المتقدمة أو أنشئ دروسك الخاصة لمشاركة خبراتك.",
  },
];

const PRO_STEPS: TourStep[] = [
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

const FAN_STEPS: TourStep[] = [
  {
    targetSelector: '[aria-label="Quick search"], [aria-label="البحث السريع"]',
    titleEn: "Discover Chefs & Recipes",
    titleAr: "اكتشف الطهاة والوصفات",
    descEn: "Search for your favorite chefs, recipes, and culinary events.",
    descAr: "ابحث عن طهاتك المفضلين والوصفات والفعاليات.",
  },
  {
    targetSelector: '[aria-label="Platform statistics"], [aria-label="إحصائيات المنصة"]',
    titleEn: "Join a Global Community",
    titleAr: "انضم لمجتمع عالمي",
    descEn: "Thousands of chefs and food lovers are already here!",
    descAr: "آلاف الطهاة ومحبي الطعام موجودون هنا بالفعل!",
  },
  {
    targetSelector: '#events-cat-heading',
    titleEn: "Follow Events & Competitions",
    titleAr: "تابع الفعاليات والمسابقات",
    descEn: "Watch competitions, attend exhibitions, and cheer for your favorites.",
    descAr: "شاهد المسابقات واحضر المعارض وشجع المفضلين لديك.",
  },
  {
    targetSelector: '[href="/recipes"]',
    titleEn: "Save Your Favorite Recipes",
    titleAr: "احفظ وصفاتك المفضلة",
    descEn: "Browse recipes, rate them, and save favorites to your collection.",
    descAr: "تصفح الوصفات وقيّمها واحفظ المفضلة في مجموعتك.",
  },
  {
    targetSelector: '[href="/community"]',
    titleEn: "Connect With Chefs",
    titleAr: "تواصل مع الطهاة",
    descEn: "Follow chefs, comment on posts, and share content you love.",
    descAr: "تابع الطهاة وعلّق على المنشورات وشارك المحتوى.",
  },
];

/** Determine the best tour for the user based on their roles */
function selectTour(roles: string[], isFan: boolean): { key: string; steps: TourStep[]; label: string; labelAr: string } {
  if (roles.includes("judge") || roles.includes("head_judge") || roles.includes("lead_judge")) {
    return { key: "judge", steps: JUDGE_STEPS, label: "Judge Tour", labelAr: "جولة الحكم" };
  }
  if (roles.includes("organizer") || roles.includes("supervisor")) {
    return { key: "organizer", steps: ORGANIZER_STEPS, label: "Organizer Tour", labelAr: "جولة المنظم" };
  }
  if (roles.includes("chef") || roles.includes("contestant")) {
    return { key: "chef", steps: CHEF_STEPS, label: "Chef Tour", labelAr: "جولة الطاهي" };
  }
  if (isFan) {
    return { key: "fan", steps: FAN_STEPS, label: "Welcome Tour", labelAr: "جولة ترحيبية" };
  }
  return { key: "pro", steps: PRO_STEPS, label: "Welcome Tour", labelAr: "جولة ترحيبية" };
}

export function GuidedTour() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { isFan } = useAccountType();
  const { data: userRoles = [] } = useUserRoles();
  const isAr = language === "ar";

  const tour = selectTour(userRoles, isFan);
  const STEPS = tour.steps;
  const tourStorageKey = TOUR_PREFIX + tour.key;

  const [step, setStep] = useState(-1);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [tooltipSide, setTooltipSide] = useState<"bottom" | "top">("bottom");

  useEffect(() => {
    if (!user) return;
    const done = safeStorageGet(tourStorageKey);
    if (done) return;
    const timer = setTimeout(() => setStep(0), 3000);
    return () => clearTimeout(timer);
  }, [user, tourStorageKey]);

  const updatePosition = useCallback(() => {
    if (step < 0 || step >= STEPS.length) return;

    const el = document.querySelector(STEPS[step].targetSelector);
    if (!el) {
      const nextIndex = STEPS.findIndex(
        (candidate, idx) => idx > step && Boolean(document.querySelector(candidate.targetSelector))
      );

      if (nextIndex >= 0) {
        setStep(nextIndex);
      } else {
        safeStorageSet(tourStorageKey, "true");
        setStep(-1);
      }
      return;
    }

    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const tooltipHeight = 220;

    if (spaceBelow >= tooltipHeight || spaceBelow >= spaceAbove) {
      setTooltipSide("bottom");
      setPosition({
        top: Math.min(rect.bottom + 12, window.innerHeight - tooltipHeight),
        left: Math.max(16, Math.min(rect.left, window.innerWidth - 330)),
      });
    } else {
      setTooltipSide("top");
      setPosition({
        top: Math.max(16, rect.top - tooltipHeight - 12),
        left: Math.max(16, Math.min(rect.left, window.innerWidth - 330)),
      });
    }

    el.scrollIntoView({ behavior: "smooth", block: "center" });

    // Highlight target element
    el.classList.add("ring-2", "ring-primary", "ring-offset-2", "rounded-lg", "z-[9999]", "relative");

    // Clean up previous highlights
    return () => {
      document.querySelectorAll(".ring-primary.ring-2").forEach((e) => {
        e.classList.remove("ring-2", "ring-primary", "ring-offset-2", "rounded-lg", "z-[9999]", "relative");
      });
    };
  }, [step, STEPS, tourStorageKey]);

  useEffect(() => {
    const cleanup = updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => {
      cleanup?.();
      window.removeEventListener("resize", updatePosition);
    };
  }, [updatePosition]);

  const handleNext = () => {
    // Clean highlights before moving
    document.querySelectorAll(".ring-primary.ring-2").forEach(e => {
      e.classList.remove("ring-2", "ring-primary", "ring-offset-2", "rounded-lg", "z-[9999]", "relative");
    });

    if (step >= STEPS.length - 1) {
      setStep(-1);
      safeStorageSet(tourStorageKey, "true");
    } else {
      setStep(s => s + 1);
    }
  };

  const handleDismiss = () => {
    document.querySelectorAll(".ring-primary.ring-2").forEach(e => {
      e.classList.remove("ring-2", "ring-primary", "ring-offset-2", "rounded-lg", "z-[9999]", "relative");
    });
    setStep(-1);
    safeStorageSet(tourStorageKey, "true");
  };

  if (step < 0 || step >= STEPS.length) return null;

  const current = STEPS[step];
  const StepIcon = current.icon || Sparkles;

  return (
    <>
      {/* Backdrop (non-blocking, transparent to avoid dark-screen perception) */}
      <div className="fixed inset-0 z-[9998] pointer-events-none" aria-hidden="true" />

      {/* Tooltip */}
      <Card
        className={cn(
          "fixed z-[9999] w-[300px] sm:w-[340px] p-5 shadow-2xl border-primary/20 pointer-events-auto",
          "animate-in fade-in duration-300",
          tooltipSide === "bottom" ? "slide-in-from-top-2" : "slide-in-from-bottom-2"
        )}
        style={{ top: position.top, left: position.left }}
      >
        <button
          onClick={handleDismiss}
          className="absolute top-3 end-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close tour"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Tour label */}
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-[9px] font-bold uppercase tracking-wider text-primary/70 bg-primary/8 px-2 py-0.5 rounded-full">
            {isAr ? tour.labelAr : tour.label}
          </span>
        </div>

        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <StepIcon className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-bold leading-snug">{isAr ? current.titleAr : current.titleEn}</h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {isAr ? current.descAr : current.descEn}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {step + 1} / {STEPS.length}
          </span>
          <div className="flex gap-1.5">
            {step > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs px-2.5" onClick={() => {
                document.querySelectorAll(".ring-primary.ring-2").forEach(e => {
                  e.classList.remove("ring-2", "ring-primary", "ring-offset-2", "rounded-lg", "z-[9999]", "relative");
                });
                setStep(s => s - 1);
              }}>
                <ChevronLeft className="h-3 w-3 me-0.5" />
                {isAr ? "السابق" : "Back"}
              </Button>
            )}
            <Button size="sm" className="h-7 text-xs px-3" onClick={handleNext}>
              {step >= STEPS.length - 1 ? (isAr ? "ابدأ الآن!" : "Get Started!") : (isAr ? "التالي" : "Next")}
              {step < STEPS.length - 1 && <ChevronRight className="h-3 w-3 ms-0.5" />}
            </Button>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mt-3">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                document.querySelectorAll(".ring-primary.ring-2").forEach(e => {
                  e.classList.remove("ring-2", "ring-primary", "ring-offset-2", "rounded-lg", "z-[9999]", "relative");
                });
                setStep(i);
              }}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                i === step ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/20 hover:bg-muted-foreground/40"
              )}
              aria-label={`Step ${i + 1}`}
            />
          ))}
        </div>
      </Card>
    </>
  );
}
