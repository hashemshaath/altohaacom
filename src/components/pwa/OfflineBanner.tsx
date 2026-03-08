import { memo } from "react";
import { useOnlineStatus } from "@/hooks/usePWA";
import { useLanguage } from "@/i18n/LanguageContext";
import { WifiOff } from "lucide-react";

export const OfflineBanner = memo(function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const { language } = useLanguage();
  const isAr = language === "ar";

  if (isOnline) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[100] bg-destructive text-destructive-foreground px-4 py-2 text-center text-sm font-medium animate-in slide-in-from-top duration-300">
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span>{isAr ? "أنت غير متصل بالإنترنت" : "You're offline"}</span>
      </div>
    </div>
  );
});
