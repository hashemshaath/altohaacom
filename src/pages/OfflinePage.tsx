import { WifiOff, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";

export default function OfflinePage() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      <div className="relative mb-8">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-muted/50 shadow-inner">
          <WifiOff className="h-12 w-12 text-muted-foreground/60" />
        </div>
        <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-destructive/20 animate-pulse" />
      </div>

      <h1 className="text-2xl font-bold mb-2">
        {isAr ? "أنت غير متصل بالإنترنت" : "You're Offline"}
      </h1>
      <p className="text-muted-foreground max-w-sm mb-8 text-sm leading-relaxed">
        {isAr
          ? "لا يمكن الاتصال بالخادم. تحقق من اتصالك بالإنترنت وحاول مرة أخرى."
          : "Can't connect to the server. Check your internet connection and try again."}
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button
          onClick={() => window.location.reload()}
          className="w-full gap-2 active:scale-[0.97] transition-transform"
        >
          <RefreshCw className="h-4 w-4" />
          {isAr ? "إعادة المحاولة" : "Try Again"}
        </Button>
        <Button
          variant="outline"
          onClick={() => window.location.href = "/"}
          className="w-full gap-2 active:scale-[0.97] transition-transform"
        >
          <Home className="h-4 w-4" />
          {isAr ? "العودة للرئيسية" : "Go Home"}
        </Button>
      </div>

      <div className="mt-12 rounded-xl border border-border/40 bg-muted/30 p-4 max-w-sm">
        <p className="text-xs text-muted-foreground">
          {isAr
            ? "💡 بعض الصفحات التي زرتها مسبقاً قد تكون متاحة من الذاكرة المؤقتة."
            : "💡 Some previously visited pages may still be available from cache."}
        </p>
      </div>
    </div>
  );
}
