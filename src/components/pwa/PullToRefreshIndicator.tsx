import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  pulling: boolean;
  pullDistance: number;
  refreshing: boolean;
  progress: number;
}

export function PullToRefreshIndicator({ pulling, pullDistance, refreshing, progress }: Props) {
  if (!pulling && !refreshing) return null;

  return (
    <div
      className="fixed top-0 inset-x-0 z-[90] flex justify-center pointer-events-none"
      style={{ transform: `translateY(${refreshing ? 60 : pullDistance}px)` }}
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full bg-card border border-border shadow-lg transition-all duration-300",
          refreshing && "animate-bounce"
        )}
        style={{
          opacity: refreshing ? 1 : progress,
          transform: `scale(${refreshing ? 1 : 0.5 + progress * 0.5}) rotate(${progress * 360}deg)`,
        }}
      >
        <RefreshCw
          className={cn("h-5 w-5 text-primary", refreshing && "animate-spin")}
        />
      </div>
    </div>
  );
}
