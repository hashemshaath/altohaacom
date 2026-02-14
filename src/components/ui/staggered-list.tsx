import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface StaggeredListProps {
  children: React.ReactNode;
  className?: string;
  /** Delay between each child in ms */
  stagger?: number;
}

export function StaggeredList({ children, className, stagger = 60 }: StaggeredListProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.05 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn(className)}>
      {React.Children.map(children, (child, i) => (
        <div
          className={cn(
            "transition-all duration-500 ease-out",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
          style={{ transitionDelay: visible ? `${i * stagger}ms` : "0ms" }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
