import { useState, memo } from "react";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";

interface LikeAnimationProps {
  isLiked: boolean;
  count: number;
  onClick: () => void;
  displayCount: string;
}

export function LikeAnimation({ isLiked, count, onClick, displayCount }: LikeAnimationProps) {
  const [animating, setAnimating] = useState(false);

  const handleClick = () => {
    if (!isLiked) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 600);
    }
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "relative inline-flex items-center gap-1 rounded-full px-3 h-8 text-xs transition-all duration-200",
        "hover:text-destructive hover:bg-destructive/10",
        isLiked ? "text-destructive" : "text-muted-foreground"
      )}
    >
      <span className="relative">
        <Heart
          className={cn(
            "h-4 w-4 transition-transform duration-300",
            isLiked && "fill-current",
            animating && "scale-[1.4]"
          )}
        />
        {animating && (
          <>
            <span className="absolute -top-1 -start-1 h-6 w-6 rounded-full bg-destructive/20 animate-ping" />
            {/* Burst particles */}
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <span
                key={deg}
                className="absolute top-1/2 start-1/2 h-1 w-1 rounded-full bg-destructive"
                style={{
                  transform: `rotate(${deg}deg) translateY(-10px)`,
                  animation: "like-burst 0.5s ease-out forwards",
                  opacity: 0,
                }}
              />
            ))}
          </>
        )}
      </span>
      {count > 0 && (
        <span className={cn(
          "tabular-nums transition-all duration-200",
          animating && "scale-110 font-bold"
        )}>
          {displayCount}
        </span>
      )}
      <style>{`
        @keyframes like-burst {
          0% { opacity: 1; transform: rotate(var(--deg, 0deg)) translateY(0px) scale(1); }
          100% { opacity: 0; transform: rotate(var(--deg, 0deg)) translateY(-14px) scale(0); }
        }
      `}</style>
    </button>
  );
}
