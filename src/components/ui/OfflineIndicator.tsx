import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff } from "lucide-react";
import { useEffect, useState, memo } from "react";

/**
 * A subtle toast-like banner that shows when the user goes offline.
 * Auto-hides when connectivity is restored.
 */
export const OfflineIndicator = memo(function OfflineIndicator() {
  const { language } = useLanguage();
  const isAr = language === "ar";
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
        : "bg-chart-2 text-white"
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
});
