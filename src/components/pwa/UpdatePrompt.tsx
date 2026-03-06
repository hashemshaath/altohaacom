import { forwardRef } from "react";
import { usePWAUpdate } from "@/hooks/usePWA";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export const UpdatePrompt = forwardRef<HTMLDivElement>(function UpdatePrompt(_props, ref) {
  const { needsUpdate, update } = usePWAUpdate();
  const { language } = useLanguage();
  const isAr = language === "ar";

  if (!needsUpdate) return null;

  return (
    <div ref={ref} className="fixed top-2 inset-x-0 z-[100] flex justify-center px-3 animate-in slide-in-from-top duration-500">
      <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-card/95 p-3 shadow-lg backdrop-blur-md">
        <RefreshCw className="h-5 w-5 text-primary animate-spin" />
        <p className="text-sm font-medium">
          {isAr ? "تحديث جديد متاح" : "A new update is available"}
        </p>
        <Button size="sm" onClick={update}>
          {isAr ? "تحديث" : "Update"}
        </Button>
      </div>
    </div>
  );
});
