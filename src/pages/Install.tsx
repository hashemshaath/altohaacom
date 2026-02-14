import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Wifi, WifiOff, Zap, Globe, CheckCircle } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const { language } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const isAr = language === "ar";

  const features = [
    {
      icon: Zap,
      title: isAr ? "سريع البرق" : "Lightning Fast",
      desc: isAr ? "يعمل بسرعة فائقة مثل التطبيقات الأصلية" : "Loads instantly, just like a native app",
    },
    {
      icon: WifiOff,
      title: isAr ? "يعمل بدون إنترنت" : "Works Offline",
      desc: isAr ? "تصفح المحتوى المخزن حتى بدون اتصال" : "Browse cached content even without connection",
    },
    {
      icon: Smartphone,
      title: isAr ? "تجربة التطبيق الأصلي" : "Native App Feel",
      desc: isAr ? "شاشة كاملة بدون شريط المتصفح" : "Full screen experience without browser bar",
    },
    {
      icon: Globe,
      title: isAr ? "دائماً محدث" : "Always Updated",
      desc: isAr ? "يتم التحديث تلقائياً في الخلفية" : "Auto-updates in the background seamlessly",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 via-background to-background py-16">
          <div className="absolute -top-32 start-1/4 h-64 w-64 rounded-full bg-primary/8 blur-[100px] animate-pulse pointer-events-none" />
          <div className="absolute -top-20 end-1/3 h-48 w-48 rounded-full bg-accent/10 blur-[80px] animate-pulse [animation-delay:1s] pointer-events-none" />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <div className="container relative text-center max-w-2xl">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15 shadow-lg shadow-primary/10">
              <Download className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-serif text-3xl font-bold md:text-4xl">
              {isAr ? "ثبّت تطبيق Altohaa" : "Install Altohaa"}
            </h1>
            <p className="mt-3 text-base text-muted-foreground max-w-md mx-auto">
              {isAr
                ? "أضف Altohaa إلى شاشتك الرئيسية للوصول السريع"
                : "Add Altohaa to your home screen for quick access"}
            </p>
          </div>
        </section>

        <div className="container max-w-2xl py-10">
          {isInstalled ? (
            <Card className="mb-8 border-chart-5/30 bg-chart-5/5">
              <CardContent className="flex items-center gap-3 pt-6">
                <CheckCircle className="h-6 w-6 text-chart-5" />
                <p className="font-medium">
                  {isAr ? "التطبيق مثبت بالفعل! 🎉" : "App is already installed! 🎉"}
                </p>
              </CardContent>
            </Card>
          ) : deferredPrompt ? (
            <Card className="mb-8 border-primary/20">
              <CardContent className="pt-6 text-center">
                <Button size="lg" onClick={handleInstall} className="gap-2 shadow-lg shadow-primary/20">
                  <Download className="h-5 w-5" />
                  {isAr ? "تثبيت التطبيق" : "Install App"}
                </Button>
              </CardContent>
            </Card>
          ) : isIOS ? (
            <Card className="mb-8 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  {isAr ? "كيفية التثبيت على iPhone" : "How to Install on iPhone"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>1. {isAr ? "اضغط على زر المشاركة" : "Tap the Share button"} ↗</p>
                <p>2. {isAr ? "مرر لأسفل واضغط" : "Scroll down and tap"} "{isAr ? "إضافة إلى الشاشة الرئيسية" : "Add to Home Screen"}"</p>
                <p>3. {isAr ? "اضغط إضافة" : "Tap Add"}</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-8 border-border/50">
              <CardContent className="pt-6 text-center text-muted-foreground">
                <p>
                  {isAr
                    ? "افتح هذه الصفحة في متصفح الجوال لتثبيت التطبيق"
                    : "Open this page in your mobile browser to install the app"}
                </p>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((f, i) => (
              <Card key={i} className="border-border/50 transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-primary/20">
                <CardContent className="flex items-start gap-3 pt-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/10">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{f.title}</p>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
