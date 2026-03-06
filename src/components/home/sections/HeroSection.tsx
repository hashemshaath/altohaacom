import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useState, useEffect, useCallback, useRef, memo } from "react";
import { cn } from "@/lib/utils";

const SLIDE_DURATION = 6000;

interface HeroSlide {
  id: string;
  title: string;
  title_ar: string;
  subtitle: string;
  subtitle_ar: string;
  image_url: string;
  link_label: string;
  link_label_ar: string;
  link_url: string;
  overlay_opacity: number;
  is_active: boolean;
  sort_order: number;
}

/* ── Slide background — memoised to avoid heavy re-renders ── */
const SlideBackground = memo(function SlideBackground({
  slide,
  isActive,
  isFirst,
}: {
  slide: HeroSlide;
  isActive: boolean;
  isFirst: boolean;
}) {
  return (
    <div
      className={cn(
        "absolute inset-0 transition-all duration-[1200ms] ease-in-out will-change-[opacity,transform]",
        isActive ? "opacity-100 scale-100" : "opacity-0 scale-[1.04] pointer-events-none"
      )}
    >
      <img
        src={slide.image_url}
        alt=""
        className={cn("h-full w-full object-cover", isActive && "animate-ken-burns")}
        loading={isFirst ? "eager" : "lazy"}
        decoding={isFirst ? "sync" : "async"}
        fetchPriority={isFirst ? "high" : undefined}
      />
      {/* Triple-layer gradient for text readability */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent"
        style={{ opacity: Math.max((slide.overlay_opacity || 50) / 100, 0.55) }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-background/15 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
});

export function HeroSection() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<number | null>(null);
  const lastTickRef = useRef(0);

  const { data: slides = [] } = useQuery<HeroSlide[]>({
    queryKey: ["hero-slides"],
    queryFn: async () => {
      const { data } = await supabase
        .from("hero_slides")
        .select("id,title,title_ar,subtitle,subtitle_ar,image_url,link_label,link_label_ar,link_url,overlay_opacity,is_active,sort_order")
        .eq("is_active", true)
        .order("sort_order");
      return (data || []) as HeroSlide[];
    },
    staleTime: 1000 * 60 * 10,
  });

  const goTo = useCallback((idx: number) => {
    setCurrent(idx);
    setProgress(0);
    lastTickRef.current = performance.now();
  }, []);

  const next = useCallback(
    () => goTo((current + 1) % Math.max(slides.length, 1)),
    [current, slides.length, goTo]
  );
  const prev = useCallback(
    () => goTo((current - 1 + slides.length) % Math.max(slides.length, 1)),
    [current, slides.length, goTo]
  );

  // RAF-based progress + auto-advance
  useEffect(() => {
    if (slides.length <= 1) return;
    lastTickRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - lastTickRef.current;
      const pct = Math.min((elapsed / SLIDE_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        setCurrent((c) => (c + 1) % slides.length);
        setProgress(0);
        lastTickRef.current = now;
      }
      progressRef.current = requestAnimationFrame(tick);
    };

    progressRef.current = requestAnimationFrame(tick);
    return () => {
      if (progressRef.current) cancelAnimationFrame(progressRef.current);
    };
  }, [slides.length, current]);

  /* ── Fallback: no slides ── */
  if (slides.length === 0) {
    return (
      <section className="relative flex min-h-[60vh] items-center justify-center bg-muted/30 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_60%)]" />

        <div className="text-center space-y-6 px-4 relative">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {isAr ? "منصة الطهاة الأولى" : "The #1 Culinary Platform"}
          </div>
          <h1 className={cn(
            "text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.08]",
            !isAr && "font-serif"
          )}>
            {isAr ? "مجتمع الطهاة العالمي" : "The Global Culinary Community"}
          </h1>
          <p className="text-base text-muted-foreground max-w-xl mx-auto leading-relaxed sm:text-lg">
            {isAr
              ? "انضم إلى أفضل الطهاة والحكام والمنظمين حول العالم"
              : "Join the finest chefs, judges, and organizers worldwide"}
          </p>
          <Button size="lg" className="rounded-xl mt-2 shadow-[var(--shadow-md)]" asChild>
            <Link to="/register">
              {isAr ? "ابدأ الآن" : "Get Started"}
              <ArrowRight className="ms-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  const slide = slides[current];

  return (
    <section className="relative overflow-hidden bg-background" dir={isAr ? "rtl" : "ltr"}>
      <div className="relative min-h-[55vh] sm:min-h-[65vh] lg:min-h-[75vh]">
        {/* Background slides */}
        {slides.map((s, idx) => (
          <SlideBackground
            key={s.id}
            slide={s}
            isActive={idx === current}
            isFirst={idx === 0}
          />
        ))}

        {/* Content */}
        <div className="container relative flex h-full min-h-[55vh] sm:min-h-[65vh] lg:min-h-[75vh] items-end pb-20 sm:pb-24 lg:pb-28">
          <div
            key={slide.id}
            className="max-w-2xl space-y-5"
            style={{
              animation: "heroFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 backdrop-blur-md border border-primary/25 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary shadow-sm">
              <Sparkles className="h-3 w-3" />
              {isAr ? "مميّز" : "Featured"}
            </div>

            {/* Title — font-serif for English, font-sans (Noto Sans Arabic) for Arabic */}
            <h1
              className={cn(
                "text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl leading-[1.08] text-foreground",
                !isAr && "font-serif"
              )}
              style={{
                textShadow:
                  "0 2px 16px hsl(var(--background) / 0.5), 0 4px 32px hsl(var(--background) / 0.3)",
              }}
            >
              {isAr ? slide.title_ar || slide.title : slide.title}
            </h1>

            {/* Subtitle */}
            {(slide.subtitle || slide.subtitle_ar) && (
              <p
                className="text-sm font-normal text-muted-foreground sm:text-base lg:text-lg max-w-lg leading-relaxed"
                style={{
                  textShadow: "0 1px 10px hsl(var(--background) / 0.4)",
                }}
              >
                {isAr ? slide.subtitle_ar || slide.subtitle : slide.subtitle}
              </p>
            )}

            {slide.link_url && (
              <Button
                size="lg"
                className="group rounded-xl shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all duration-300"
                asChild
              >
                <Link to={slide.link_url}>
                  {isAr
                    ? slide.link_label_ar || slide.link_label || "اكتشف المزيد"
                    : slide.link_label || "Learn More"}
                  <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Navigation arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute start-3 sm:start-5 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-card/60 backdrop-blur-xl border border-border/40 text-foreground shadow-[var(--shadow-sm)] transition-all duration-300 hover:bg-card/90 hover:shadow-[var(--shadow-md)] hover:scale-105 active:scale-95"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
            </button>
            <button
              onClick={next}
              className="absolute end-3 sm:end-5 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-card/60 backdrop-blur-xl border border-border/40 text-foreground shadow-[var(--shadow-sm)] transition-all duration-300 hover:bg-card/90 hover:shadow-[var(--shadow-md)] hover:scale-105 active:scale-95"
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5 rtl:rotate-180" />
            </button>

            {/* Progress indicators */}
            <div className="absolute bottom-5 sm:bottom-7 start-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-card/50 backdrop-blur-xl border border-border/30 px-3 py-2 shadow-[var(--shadow-sm)]">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goTo(idx)}
                  className={cn(
                    "relative h-2 rounded-full transition-all duration-500 ease-out overflow-hidden",
                    idx === current
                      ? "w-8 bg-muted-foreground/15"
                      : "w-2 bg-muted-foreground/25 hover:bg-muted-foreground/50"
                  )}
                  aria-label={`Slide ${idx + 1}`}
                >
                  {idx === current && (
                    <span
                      className="absolute inset-y-0 start-0 rounded-full bg-primary shadow-[var(--shadow-glow)]"
                      style={{
                        width: `${progress}%`,
                        transition: "width 80ms linear",
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
