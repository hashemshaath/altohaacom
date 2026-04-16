import { useIsAr } from "@/hooks/useIsAr";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff } from "lucide-react";
import { useEffect, useState, memo, forwardRef } from "react";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

/**
 * A subtle toast-like banner that shows when the user goes offline.
 */
export const OfflineIndicator = memo(forwardRef<HTMLDivElement>(function OfflineIndicator(_props, _ref) {
  const isAr = useIsAr();
  const [offline, setOffline] = useState(!navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const onOffline = () => { setOffline(true); setShowReconnected(false); };
    const onOnline = () => {
      setOffline(false);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  if (!offline && !showReconnected) return null;

  return (
    <div className={cn(
      "fixed top-0 inset-x-0 z-[100] flex items-center justify-center gap-2 py-1.5 text-xs font-medium",
      "animate-in slide-in-from-top-2 duration-300",
      offline
        ? "bg-destructive text-destructive-foreground"
        : "bg-chart-2 text-chart-2-foreground"
    )}>
      {offline ? (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          {isAr ? "لا يوجد اتصال بالإنترنت" : "You're offline"}
        </>
      ) : (
        <>
          <Wifi className="h-3.5 w-3.5" />
          {isAr ? "تم استعادة الاتصال" : "Back online"}
        </>
      )}
    </div>
  );
}));
