import { useLanguage } from "@/i18n/LanguageContext";
import { Check, FileText, Calendar, Building, Eye } from "lucide-react";

const STEPS = [
  { number: 1, label: "Basic Info", labelAr: "المعلومات", icon: FileText },
  { number: 2, label: "Date & Location", labelAr: "التاريخ والموقع", icon: Calendar },
  { number: 3, label: "Organizer & Tickets", labelAr: "المنظم والتذاكر", icon: Building },
  { number: 4, label: "Review", labelAr: "مراجعة", icon: Eye },
];

export function ExhibitionStepIndicator({ currentStep }: { currentStep: number }) {
  const { language } = useLanguage();

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isComplete = step.number < currentStep;
          const isCurrent = step.number === currentStep;

          return (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`relative flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-medium transition-all duration-300 ${
                    isCurrent
                      ? "bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/20"
                      : isComplete
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isComplete ? (
                    <Check className="h-4.5 w-4.5" />
                  ) : (
                    <Icon className="h-4.5 w-4.5" />
                  )}
                  {isCurrent && (
                    <span className="absolute -inset-0.5 animate-pulse rounded-2xl border-2 border-primary/30" />
                  )}
                </div>
                <span
                  className={`hidden text-xs sm:block ${
                    isCurrent
                      ? "font-semibold text-primary"
                      : isComplete
                      ? "font-medium text-foreground/70"
                      : "text-muted-foreground"
                  }`}
                >
                  {language === "ar" ? step.labelAr : step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`mx-1.5 h-0.5 w-8 rounded-full transition-colors duration-300 sm:mx-3 sm:w-14 md:w-20 ${
                    isComplete ? "bg-primary/40" : "bg-muted"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
