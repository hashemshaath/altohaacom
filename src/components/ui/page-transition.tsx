import { ReactNode, useEffect, useState, memo } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export const PageTransition = memo(function PageTransition({ children, className }: PageTransitionProps) {
  const location = useLocation();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(false);
    const timer = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => cancelAnimationFrame(timer);
  }, [location.pathname]);

  return (
    <div
      className={cn(
        "transition-all duration-350 ease-out-quint",
        visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-[0.995]",
        className
      )}
    >
      {children}
    </div>
  );
});
