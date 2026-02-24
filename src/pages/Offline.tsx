import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { WifiOff, RefreshCw } from "lucide-react";

export default function Offline() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-muted mb-6">
        <WifiOff className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold mb-2">
        {isAr ? "أنت غير متصل" : "You're Offline"}
      </h1>
      <p className="text-muted-foreground max-w-xs mb-6">
        {isAr
          ? "تحقق من اتصالك بالإنترنت وحاول مرة أخرى. بعض المحتوى المحفوظ مسبقاً قد يكون متاحاً."
          : "Check your internet connection and try again. Some previously cached content may still be available."}
      </p>
      <Button onClick={() => window.location.reload()} className="gap-2">
        <RefreshCw className="h-4 w-4" />
        {isAr ? "إعادة المحاولة" : "Try Again"}
      </Button>
    </div>
  );
}
