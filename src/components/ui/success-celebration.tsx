import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, PartyPopper, Sparkles } from "lucide-react";

interface SuccessCelebrationProps {
  /** Controls visibility */
  show: boolean;
  /** Auto-hide after ms (0 = no auto-hide) */
  duration?: number;
  title: string;
  description?: string;
  variant?: "default" | "confetti" | "subtle";
  onClose?: () => void;
  className?: string;
}

/**
 * A celebratory feedback overlay for successful actions.
 * Use after form submissions, milestone achievements, etc.
 */
export function SuccessCelebration({
  show,
  duration = 3000,
  title,
  description,
  variant = "default",
  onClose,
  className,
}: SuccessCelebrationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      if (duration > 0) {
        const t = setTimeout(() => {
          setVisible(false);
          onClose?.();
        }, duration);
        return () => clearTimeout(t);
      }
    } else {
      setVisible(false);
    }
  }, [show, duration, onClose]);

  if (!visible) return null;

  const Icon = variant === "confetti" ? PartyPopper : variant === "subtle" ? Sparkles : CheckCircle2;

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center pointer-events-none",
      "animate-in fade-in duration-300",
      className
    )}>
      <div className={cn(
        "pointer-events-auto flex flex-col items-center gap-3 rounded-3xl border px-8 py-6 shadow-2xl backdrop-blur-xl",
        "animate-in zoom-in-90 duration-500",
        variant === "confetti"
          ? "bg-chart-2/10 border-chart-2/30 shadow-chart-2/10"
          : variant === "subtle"
          ? "bg-card/95 border-border/40"
          : "bg-primary/10 border-primary/30 shadow-primary/10"
      )}>
        <div className={cn(
          "flex h-14 w-14 items-center justify-center rounded-2xl",
          variant === "confetti" ? "bg-chart-2/20" : variant === "subtle" ? "bg-muted" : "bg-primary/20"
        )}>
          <Icon className={cn(
            "h-7 w-7",
            variant === "confetti" ? "text-chart-2" : variant === "subtle" ? "text-foreground" : "text-primary"
          )} />
        </div>
        <div className="text-center">
          <p className="font-bold text-base">{title}</p>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      </div>
    </div>
  );
}
