import { memo, useEffect, useState, useRef } from "react";
import { Clock } from "lucide-react";

interface Props {
  totalReadingTime: number;
  isAr?: boolean;
}

export const ArticleEstimatedTimeLeft = memo(function ArticleEstimatedTimeLeft({ totalReadingTime, isAr }: Props) {
  const [timeLeft, setTimeLeft] = useState(totalReadingTime);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const el = document.documentElement;
        const progress = el.scrollHeight - el.clientHeight > 0
          ? el.scrollTop / (el.scrollHeight - el.clientHeight)
          : 0;
        const remaining = Math.max(0, Math.ceil(totalReadingTime * (1 - progress)));
        setTimeLeft(remaining);
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [totalReadingTime]);

  if (timeLeft <= 0) return null;

  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums shrink-0">
      <Clock className="h-3 w-3" />
      {timeLeft} {isAr ? "د متبقية" : "min left"}
    </span>
  );
});
