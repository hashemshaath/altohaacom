import { useLanguage } from "@/i18n/LanguageContext";
import { Check } from "lucide-react";

interface Step {
  number: number;
  label: string;
  labelAr: string;
}

const STEPS: Step[] = [
  { number: 1, label: "Basic Info", labelAr: "المعلومات" },
  { number: 2, label: "Schedule", labelAr: "الجدول" },
  { number: 3, label: "Categories", labelAr: "الفئات" },
  { number: 4, label: "Criteria", labelAr: "المعايير" },
  { number: 5, label: "Review", labelAr: "مراجعة" },
];

interface StepIndicatorProps {
  currentStep: number;
  totalSteps?: number;
}

export function StepIndicator({ currentStep, totalSteps = 5 }: StepIndicatorProps) {
  const { language } = useLanguage();
  const steps = STEPS.slice(0, totalSteps);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  step.number === currentStep
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : step.number < currentStep
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step.number < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.number
                )}
              </div>
              <span
                className={`hidden text-xs sm:block ${
                  step.number === currentStep
                    ? "font-medium text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {language === "ar" ? step.labelAr : step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`mx-1 h-0.5 w-8 sm:mx-2 sm:w-12 md:w-16 ${
                  step.number < currentStep ? "bg-primary/30" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
