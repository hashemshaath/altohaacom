import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ResultRevealProps {
  children: ReactNode;
  /** Delay before reveal in ms */
  delay?: number;
  className?: string;
  /** Animation style */
  variant?: "fade-up" | "scale" | "blur";
}

/**
 * Wraps content and reveals it with a polished animation.
 * Great for scores, results, before/after, certificates.
 */
export function ResultReveal({ children, delay = 0, className, variant = "fade-up" }: ResultRevealProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const variants = {
    "fade-up": {
      hidden: "opacity-0 translate-y-4",
      visible: "opacity-100 translate-y-0",
    },
    scale: {
      hidden: "opacity-0 scale-90",
      visible: "opacity-100 scale-100",
    },
    blur: {
      hidden: "opacity-0 blur-sm",
      visible: "opacity-100 blur-0",
    },
  };

  const v = variants[variant];

  return (
    <div
      className={cn(
        "transition-all duration-700 ease-out",
        visible ? v.visible : v.hidden,
        className
      )}
    >
      {children}
    </div>
  );
}
