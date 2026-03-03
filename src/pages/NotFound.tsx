import { useLocation, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  SearchX, Home, HelpCircle, ArrowLeft, AlertTriangle,
  RefreshCw, ExternalLink, WifiOff, Lock, FileQuestion,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface DiagnosisItem {
  icon: React.ElementType;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
}

function getDiagnosis(pathname: string): DiagnosisItem[] {
  const items: DiagnosisItem[] = [];

  if (pathname.includes("/admin")) {
    items.push({
      icon: Lock,
      titleEn: "Admin Route",
      titleAr: "مسار إداري",
      descEn: "This admin page may have been moved or requires special permissions.",
      descAr: "قد تكون هذه الصفحة الإدارية قد نُقلت أو تتطلب صلاحيات خاصة.",
    });
  }

  if (/\/[a-f0-9-]{36}/i.test(pathname)) {
    items.push({
      icon: FileQuestion,
      titleEn: "Resource Not Found",
      titleAr: "المورد غير موجود",
      descEn: "The specific item (ID) in the URL may have been deleted or doesn't exist.",
      descAr: "العنصر المحدد في الرابط قد يكون حُذف أو غير موجود.",
    });
  }

  if (pathname.split("/").some(seg => seg.includes("%"))) {
    items.push({
      icon: AlertTriangle,
      titleEn: "Malformed URL",
      titleAr: "رابط غير صالح",
      descEn: "The URL contains encoded or malformed characters.",
      descAr: "يحتوي الرابط على أحرف مشفرة أو غير صحيحة.",
    });
  }

  // Always add common reasons
  items.push({
    icon: ExternalLink,
    titleEn: "Outdated or Broken Link",
    titleAr: "رابط قديم أو معطّل",
    descEn: "The link you followed may be outdated. Pages can be moved or renamed.",
    descAr: "الرابط الذي اتبعته قد يكون قديمًا. يمكن أن تُنقل الصفحات أو يُعاد تسميتها.",
  });

  items.push({
    icon: AlertTriangle,
    titleEn: "Typo in URL",
    titleAr: "خطأ كتابي في الرابط",
    descEn: "Check the URL for any spelling mistakes and try again.",
    descAr: "تحقق من الرابط بحثًا عن أخطاء إملائية وحاول مرة أخرى.",
  });

  return items;
}

function getSuggestedLinks(pathname: string) {
  const links: { to: string; labelEn: string; labelAr: string }[] = [
    { to: "/", labelEn: "Homepage", labelAr: "الصفحة الرئيسية" },
  ];

  if (pathname.startsWith("/admin")) {
    links.push({ to: "/admin", labelEn: "Admin Dashboard", labelAr: "لوحة التحكم" });
  }
  if (pathname.includes("competition") || pathname.includes("event")) {
    links.push({ to: "/competitions", labelEn: "Competitions", labelAr: "المسابقات" });
  }
  if (pathname.includes("article") || pathname.includes("blog")) {
    links.push({ to: "/articles", labelEn: "Articles", labelAr: "المقالات" });
  }
  if (pathname.includes("chef") || pathname.includes("profile")) {
    links.push({ to: "/chefs", labelEn: "Chefs", labelAr: "الطهاة" });
  }

  links.push({ to: "/help-center", labelEn: "Help Center", labelAr: "مركز المساعدة" });
  return links;
}

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const diagnosis = getDiagnosis(location.pathname);
  const suggestions = getSuggestedLinks(location.pathname);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      {/* Ambient glow */}
      <div className="absolute -top-32 start-1/4 h-64 w-64 rounded-full bg-primary/8 blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute -top-20 end-1/3 h-48 w-48 rounded-full bg-destructive/6 blur-[80px] animate-pulse [animation-delay:1s] pointer-events-none" />

      <div className="relative flex flex-col items-center text-center animate-fade-in max-w-lg w-full">
        {/* Icon */}
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/20 shadow-sm">
          <SearchX className="h-10 w-10 text-destructive/60" />
        </div>

        {/* Title */}
        <h1 className="font-serif text-6xl font-bold text-primary sm:text-7xl">404</h1>
        <p className="mt-2 text-lg font-semibold text-foreground">
          {isAr ? "الصفحة غير موجودة" : "Page Not Found"}
        </p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          {isAr
            ? "لم نتمكن من العثور على الصفحة المطلوبة. قد تكون محذوفة أو نُقلت أو أن الرابط غير صحيح."
            : "We couldn't find the page you requested. It may have been deleted, moved, or the URL might be incorrect."}
        </p>

        {/* Requested path */}
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/50 border border-border/50 px-3 py-1.5">
          <span className="text-[10px] text-muted-foreground">{isAr ? "المسار:" : "Path:"}</span>
          <code className="text-xs font-mono text-destructive/80 truncate max-w-[300px]">{location.pathname}</code>
        </div>

        {/* Primary actions */}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button onClick={() => navigate(-1)} variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            {isAr ? "رجوع" : "Go Back"}
          </Button>
          <Button asChild size="sm" className="gap-1.5 shadow-sm shadow-primary/20">
            <Link to="/">
              <Home className="h-3.5 w-3.5" />
              {isAr ? "الرئيسية" : "Home"}
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.location.reload()}>
            <RefreshCw className="h-3.5 w-3.5" />
            {isAr ? "إعادة تحميل" : "Reload"}
          </Button>
        </div>

        {/* Diagnosis card */}
        <Card className="mt-6 w-full border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-foreground">
                {isAr ? "التشخيص والأسباب المحتملة" : "Diagnosis & Possible Causes"}
              </h2>
            </div>
            <div className="space-y-2">
              {diagnosis.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 rounded-lg bg-muted/30 border border-border/30 p-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                    <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="text-start min-w-0">
                    <p className="text-xs font-medium text-foreground">{isAr ? item.titleAr : item.titleEn}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{isAr ? item.descAr : item.descEn}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Suggested links */}
        <div className="mt-4 w-full">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {isAr ? "صفحات مقترحة:" : "Suggested pages:"}
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {suggestions.map((link) => (
              <Button key={link.to} asChild variant="ghost" size="sm" className="h-7 text-xs px-2.5 rounded-full border border-border/40">
                <Link to={link.to}>{isAr ? link.labelAr : link.labelEn}</Link>
              </Button>
            ))}
          </div>
        </div>

        {/* Error code footer */}
        <div className="mt-6 flex items-center gap-2 text-[10px] text-muted-foreground/50">
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-mono">HTTP 404</Badge>
          <span>•</span>
          <span>{new Date().toLocaleString(isAr ? "ar" : "en", { dateStyle: "medium", timeStyle: "short" })}</span>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
