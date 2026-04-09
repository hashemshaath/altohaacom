import { memo, useEffect, useState, useRef } from "react";
import { useNavigation, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * Thin progress bar at top of viewport during route transitions.
 * Uses CSS animations for smooth UX without actual progress tracking.
 */
export const RouteLoadingBar = memo(function RouteLoadingBar() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname !== prevPath.current) {
      prevPath.current = location.pathname;
      setLoading(true);
      const t = setTimeout(() => setLoading(false), 400);
      return () => clearTimeout(t);
    }
  }, [location.pathname]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[99] h-[2px] overflow-hidden">
      <div
        className="h-full bg-primary animate-[routeProgress_400ms_ease-out_forwards]"
        style={{
          // @ts-ignore - inline keyframes fallback
          animation: "routeProgress 400ms ease-out forwards",
        }}
      />
      <style>{`
        @keyframes routeProgress {
          0% { width: 0%; }
          60% { width: 85%; }
          100% { width: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
});
