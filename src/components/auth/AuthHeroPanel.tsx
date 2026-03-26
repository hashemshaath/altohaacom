import { useState, useEffect, useCallback, memo } from "react";
import { Trophy, Globe, GraduationCap, Award, CheckCircle } from "lucide-react";
import { useAuthHeroSlides, type AuthHeroSlide } from "@/hooks/useAuthHeroSlides";
import authHeroFallback from "@/assets/auth-hero.jpg";

const features = [
  { icon: Trophy, labelEn: "Compete Globally", labelAr: "تنافس عالمياً" },
  { icon: GraduationCap, labelEn: "Learn from the Best", labelAr: "تعلم من الأفضل" },
  { icon: Globe, labelEn: "Connect Worldwide", labelAr: "تواصل حول العالم" },
  { icon: Award, labelEn: "Earn Certificates", labelAr: "احصل على شهادات" },
];

export type AuthStage = "login" | "register" | "verify" | "details" | "credentials" | "reset";

interface Props {
  stage: AuthStage;
  isAr: boolean;
  currentStep?: number;
  totalSteps?: number;
  pageType?: "individual" | "company";
}

/* ── Step Dots ── */
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2" dir="ltr">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-500 ${
            i < current
              ? "w-6 bg-primary"
              : i === current
              ? "w-8 bg-primary shadow-sm shadow-primary/50"
              : "w-4 bg-muted-foreground/20"
          }`}
        />
      ))}
    </div>
  );
}

/* ── Slide Indicator Dots ── */
function SlideDots({ total, active, onSelect }: { total: number; active: number; onSelect: (i: number) => void }) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center gap-1.5" dir="ltr">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={`h-1.5 rounded-full transition-all duration-500 ${
            i === active ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"
          }`}
        />
      ))}
    </div>
  );
}

export const AuthHeroPanel = memo(function AuthHeroPanel({
  stage,
  isAr,
  currentStep,
  totalSteps = 4,
  pageType = "individual",
}: Props) {
  const { data: slides = [] } = useAuthHeroSlides(pageType);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const isSignUpFlow = ["register", "verify", "details", "credentials"].includes(stage);

  // Auto-advance slides
  const nextSlide = useCallback(() => {
    if (slides.length <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
      setIsTransitioning(false);
    }, 500);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [nextSlide, slides.length]);

  const handleDotSelect = (i: number) => {
    if (i === activeSlide) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveSlide(i);
      setIsTransitioning(false);
    }, 400);
  };

  // Current slide data
  const currentSlide: AuthHeroSlide | null = slides[activeSlide] || null;
  const imgSrc = currentSlide?.image_url || authHeroFallback;
  const title = currentSlide
    ? (isAr ? currentSlide.title_ar || currentSlide.title : currentSlide.title) || ""
    : "";
  const subtitle = currentSlide
    ? (isAr ? currentSlide.subtitle_ar || currentSlide.subtitle : currentSlide.subtitle) || ""
    : "";

  return (
    <div className="hidden md:flex md:w-[460px] lg:w-[560px] xl:w-[660px] relative flex-col overflow-hidden border-e border-white/5 self-stretch min-h-[100dvh] sticky top-0">
      {/* Background image with smooth transition */}
      <div className="absolute inset-0">
        <img
          src={imgSrc}
          alt={title || "Culinary excellence"}
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-in-out ${
            isTransitioning ? "opacity-0 scale-110" : "opacity-90 scale-105"
          }`}
        />
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/25" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-transparent to-transparent opacity-60" />

      {/* Animated orbs */}
      <div className="absolute -top-20 -start-20 h-64 w-64 rounded-full bg-primary/20 blur-[100px] animate-pulse" />
      <div className="absolute top-1/2 -end-20 h-48 w-48 rounded-full bg-chart-3/15 blur-[80px] animate-pulse" style={{ animationDelay: "2s" }} />

      {/* Logo */}
      <div className="relative z-10 p-8 xl:p-12">
        <div className="flex items-center gap-3 group cursor-pointer">
          <img src="/altoha-logo.png" alt="Altoha" className="h-12 w-auto drop-shadow-2xl transition-transform group-hover:scale-110" />
          <span className="font-serif text-2xl font-black text-white tracking-tighter drop-shadow-lg">Altoha</span>
        </div>
      </div>

      {/* Dynamic slide content */}
      <div className="relative z-10 flex flex-1 flex-col justify-center px-8 xl:px-12">
        <div className={`space-y-5 transition-all duration-500 ${isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}>
          {title && (
            <h2 className={`${isAr ? "font-sans" : "font-serif"} text-3xl font-black xl:text-5xl leading-[1.1] text-white drop-shadow-2xl tracking-tight`}>
              {title}
            </h2>
          )}
          <div className="h-1.5 w-20 bg-primary/60 rounded-full" />
          {subtitle && (
            <p className="text-lg leading-relaxed max-w-sm text-white/80 font-medium italic drop-shadow-md">
              "{subtitle}"
            </p>
          )}
        </div>
      </div>

      {/* Bottom section */}
      <div className="relative z-10 p-6 xl:p-8 space-y-4">
        {/* Slide dots */}
        <SlideDots total={slides.length} active={activeSlide} onSelect={handleDotSelect} />

        {isSignUpFlow && currentStep !== undefined && (
          <div className="space-y-2">
            <StepDots current={currentStep} total={totalSteps} />
            <p className="text-xs text-white/50">
              {isAr ? `الخطوة ${currentStep + 1} من ${totalSteps}` : `Step ${currentStep + 1} of ${totalSteps}`}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {features.map((f) => (
            <div
              key={f.labelEn}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/85 backdrop-blur-md"
            >
              <f.icon className="h-3.5 w-3.5 text-primary" />
              {isAr ? f.labelAr : f.labelEn}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-white/45">
          <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
          {isAr
            ? "مجاني بالكامل · بدون بطاقة ائتمان · إعداد في دقائق"
            : "Completely Free · No Credit Card · Setup in Minutes"}
        </div>
      </div>
    </div>
  );
});
