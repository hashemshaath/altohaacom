import { memo, useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

/**
 * Shows a non-intrusive banner when the user goes offline.
 * Automatically hides when back online.
 */
export const NetworkStatus = memo(function NetworkStatus() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const { language } = useLanguage();
  const isAr = language === "ar";

  useEffect(() => {
    const goOffline = () => { setIsOffline(true); setWasOffline(true); };
    const goOnline = () => setIsOffline(false);

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  // Auto-dismiss "back online" message after 3s
  useEffect(() => {
    if (!isOffline && wasOffline) {
      const t = setTimeout(() => setWasOffline(false), 3000);
      return () => clearTimeout(t);
    }
  }, [isOffline, wasOffline]);

  if (!isOffline && !wasOffline) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "fixed top-0 inset-x-0 z-[100] flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium transition-all duration-300",
        isOffline
          ? "bg-destructive text-destructive-foreground"
          : "bg-chart-2 text-white"
      )}
    >
      {isOffline ? (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          {isAr ? "لا يوجد اتصال بالإنترنت" : "You are offline"}
        </>
      ) : (
        <>{isAr ? "تم استعادة الاتصال" : "Back online"}</>
      )}
    </div>
  );
});
