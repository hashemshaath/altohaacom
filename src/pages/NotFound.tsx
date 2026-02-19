import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, SearchX, Home, HelpCircle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const NotFound = () => {
  const location = useLocation();
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4" dir={isAr ? "rtl" : "ltr"}>
      {/* Ambient glow */}
      <div className="absolute -top-32 start-1/4 h-64 w-64 rounded-full bg-primary/8 blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute -top-20 end-1/3 h-48 w-48 rounded-full bg-accent/10 blur-[80px] animate-pulse [animation-delay:1s] pointer-events-none" />

      <div className="relative flex flex-col items-center text-center animate-fade-in">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/60 ring-1 ring-border/50 shadow-sm">
          <SearchX className="h-10 w-10 text-muted-foreground/40" />
        </div>
        <h1 className="font-serif text-6xl font-bold text-primary sm:text-8xl">404</h1>
        <p className="mt-3 text-xl font-semibold text-foreground">
          {isAr ? "الصفحة غير موجودة" : "Page not found"}
        </p>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          {isAr
            ? "الصفحة التي تبحث عنها غير موجودة أو ربما تم نقلها."
            : "The page you're looking for doesn't exist or may have been moved."}
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button asChild className="shadow-sm shadow-primary/20">
            <Link to="/">
              <Home className="me-2 h-4 w-4" />
              {isAr ? "العودة للرئيسية" : "Return to Home"}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/help-center">
              <HelpCircle className="me-2 h-4 w-4" />
              {isAr ? "مركز المساعدة" : "Help Center"}
            </Link>
          </Button>
        </div>

        <p className="mt-8 text-xs text-muted-foreground/60">
          {isAr ? "المسار المطلوب:" : "Requested path:"}{" "}
          <code className="rounded bg-muted/50 px-1.5 py-0.5 text-xs">{location.pathname}</code>
        </p>
      </div>
    </div>
  );
};

export default NotFound;
