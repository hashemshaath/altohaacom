import { useIsAr } from "@/hooks/useIsAr";
import { memo } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

interface Step {
  label: string;
  description?: string;
}

interface StepProgressProps {
  steps: Step[];
  /** 0-indexed current step */
  currentStep: number;
  className?: string;
  variant?: "horizontal" | "vertical";
}

/**
 * Visual step progress indicator for multi-step flows.
 * Shows completed, current, and upcoming steps with connecting lines.
 */
export const StepProgress = memo(function StepProgress({ steps, currentStep, className, variant = "horizontal" }: StepProgressProps) {
  const isAr = useIsAr();

  if (variant === "vertical") {
    return (
      <div className={cn("space-y-0", className)}>
        {steps.map((step, i) => {
          const isCompleted = i < currentStep;
          const isCurrent = i === currentStep;
          return (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
                  isCompleted && "bg-primary border-primary text-primary-foreground",
                  isCurrent && "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/20",
                  !isCompleted && !isCurrent && "border-border bg-muted text-muted-foreground"
                )}>
                  {isCompleted ? <Check className="h-4 w-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                </div>
                {i < steps.length - 1 && (
                  <div className={cn("w-0.5 flex-1 min-h-[24px] transition-colors duration-300", isCompleted ? "bg-primary" : "bg-border")} />
                )}
              </div>
              <div className="pb-6">
                <p className={cn("text-sm font-semibold", isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground")}>
                  {step.label}
                </p>
                {step.description && <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-0", className)}>
      {steps.map((step, i) => {
        const isCompleted = i < currentStep;
        const isCurrent = i === currentStep;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
                isCompleted && "bg-primary border-primary text-primary-foreground scale-90",
                isCurrent && "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/20 scale-105",
                !isCompleted && !isCurrent && "border-border bg-muted text-muted-foreground scale-90"
              )}>
                {isCompleted ? <Check className="h-4 w-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
              </div>
              <p className={cn(
                "text-xs font-semibold text-center leading-tight max-w-[80px]",
                isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.label}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                "h-0.5 flex-1 mx-2 rounded-full transition-colors duration-300",
                isCompleted ? "bg-primary" : "bg-border"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
});
