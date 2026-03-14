import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

const SLIDE_DURATION = 6000;
const SWIPE_THRESHOLD = 50;

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

function useSwipe(onLeft: () => void, onRight: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const end = useRef<{ x: number; y: number } | null>(null);

  return {
    onTouchStart: useCallback((e: React.TouchEvent) => {
      end.current = null;
      start.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
    }, []),
    onTouchMove: useCallback((e: React.TouchEvent) => {
      end.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
    }, []),
    onTouchEnd: useCallback(() => {
      if (!start.current || !end.current) return;
      const dx = start.current.x - end.current.x;
      const dy = Math.abs(start.current.y - end.current.y);
      if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > dy) {
        dx > 0 ? onLeft() : onRight();
      }
    }, [onLeft, onRight]),
  };
}

export function HeroSection() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const pausedRef = useRef(0);

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

  useEffect(() => {
    if (!slides.length) {
      if (current !== 0) setCurrent(0);
      setProgress(0);
      return;
    }

    if (current > slides.length - 1) {
      setCurrent(0);
      setProgress(0);
      startRef.current = performance.now();
    }
  }, [slides.length, current]);

  const goTo = useCallback((idx: number) => {
    setCurrent(idx);
    setProgress(0);
    startRef.current = performance.now();
  }, []);

  const next = useCallback(
    () => goTo((current + 1) % Math.max(slides.length, 1)),
    [current, slides.length, goTo]
  );

  const prev = useCallback(
    () => goTo((current - 1 + slides.length) % Math.max(slides.length, 1)),
    [current, slides.length, goTo]
  );

  const swipe = useSwipe(isAr ? prev : next, isAr ? next : prev);

  // Auto-advance
  useEffect(() => {
    if (slides.length <= 1) return;
    startRef.current = performance.now();

    const tick = (now: number) => {
      if (isPaused) {
        pausedRef.current = now;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      if (pausedRef.current > 0) {
        startRef.current += now - pausedRef.current;
        pausedRef.current = 0;
      }
      const pct = Math.min(((now - startRef.current) / SLIDE_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        setCurrent((c) => (c + 1) % slides.length);
        setProgress(0);
        startRef.current = now;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [slides.length, current, isPaused]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next]);

  /* ── Empty state ── */
  if (!slides.length) {
    return (
      <section className="relative flex min-h-[50vh] sm:min-h-[60vh] items-center justify-center overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 safe-area-x">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.12),transparent_60%)]" />
        <div className="relative text-center space-y-5 px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-[13px] sm:text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            {isAr ? "منصة الطهاة الأولى" : "The #1 Culinary Platform"}
          </span>
          <h1 className="text-[28px] font-bold tracking-tight sm:text-5xl lg:text-6xl leading-[1.12] text-foreground">
            {isAr ? "مجتمع الطهاة العالمي" : "The Global Culinary Community"}
          </h1>
          <p className="text-[15px] sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            {isAr
              ? "انضم إلى أفضل الطهاة والحكام والمنظمين حول العالم"
              : "Join the finest chefs, judges, and organizers worldwide"}
          </p>
          <Button size="lg" className="rounded-xl shadow-[var(--shadow-md)] h-12 px-6 text-[15px]" asChild>
            <Link to="/register">
              {isAr ? "ابدأ الآن" : "Get Started"}
              <ArrowRight className="ms-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  const safeCurrent = slides.length ? ((current % slides.length) + slides.length) % slides.length : 0;
  const slide = slides[safeCurrent];
  const opacity = Math.max(((slide?.overlay_opacity || 50) / 100), 0.4);

  return (
    <section
      className="relative overflow-hidden bg-background"
      dir={isAr ? "rtl" : "ltr"}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      {...swipe}
    >
      <div className="relative min-h-[48vh] sm:min-h-[55vh] lg:min-h-[75vh]">
        {/* Slide backgrounds */}
        {slides.map((s, idx) => (
          <div
            key={s.id}
            className={cn(
              "absolute inset-0 transition-all duration-[1200ms] ease-in-out",
              idx === safeCurrent ? "opacity-100 scale-100" : "opacity-0 scale-[1.04] pointer-events-none"
            )}
          >
            <img
              src={s.image_url}
              alt={s.title}
              className="h-full w-full object-cover"
              loading={idx === 0 ? "eager" : "lazy"}
              decoding={idx === 0 ? "sync" : "async"}
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/5"
              style={{ opacity }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/15 to-transparent" />
          </div>
        ))}

        {/* Content */}
        <div className="container relative flex h-full min-h-[48vh] sm:min-h-[55vh] lg:min-h-[75vh] items-end pb-16 sm:pb-24 lg:pb-28 px-5 sm:px-6">
          <div
            key={slide.id}
            className="max-w-2xl space-y-3.5 sm:space-y-5"
            style={{ animation: "heroFadeUp 0.8s cubic-bezier(0.16,1,0.3,1) forwards" }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 px-3 py-1.5 text-[11px] sm:text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--hero-foreground))] shadow-sm">
              <Sparkles className="h-3 w-3" />
              {isAr ? "مميّز" : "Featured"}
            </span>

            <h1 className="text-[24px] font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl leading-[1.15] text-[hsl(var(--hero-foreground))] drop-shadow-lg">
              {isAr ? slide.title_ar || slide.title : slide.title}
            </h1>

            {(slide.subtitle || slide.subtitle_ar) && (
              <p className="text-[14px] sm:text-base lg:text-lg max-w-lg leading-relaxed text-[hsl(var(--hero-muted-foreground))] drop-shadow-md">
                {isAr ? slide.subtitle_ar || slide.subtitle : slide.subtitle}
              </p>
            )}

            {slide.link_url && (
              <Button
                size="lg"
                className="group rounded-xl shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all duration-300 h-11 sm:h-12 px-5 sm:px-6 text-[14px] sm:text-base touch-manipulation"
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

        {/* Slide counter */}
        {slides.length > 1 && (
          <div className="absolute top-4 end-4 sm:top-6 sm:end-6 flex items-center gap-1.5 rounded-full bg-card/40 backdrop-blur-xl border border-border/20 px-2.5 py-1 text-[10px] font-mono text-[hsl(var(--hero-foreground)/0.85)]">
            <span className="font-bold">{String(safeCurrent + 1).padStart(2, "0")}</span>
            <span className="text-[hsl(var(--hero-muted-foreground)/0.6)]">/</span>
            <span className="text-[hsl(var(--hero-muted-foreground)/0.85)]">{String(slides.length).padStart(2, "0")}</span>
          </div>
        )}

        {/* Navigation arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute start-2 sm:start-5 top-1/2 -translate-y-1/2 hidden sm:flex h-11 w-11 items-center justify-center rounded-full bg-card/60 backdrop-blur-xl border border-border/40 text-foreground shadow-[var(--shadow-sm)] transition-all duration-300 hover:bg-card/90 hover:scale-105 active:scale-95"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
            </button>
            <button
              onClick={next}
              className="absolute end-2 sm:end-5 top-1/2 -translate-y-1/2 hidden sm:flex h-11 w-11 items-center justify-center rounded-full bg-card/60 backdrop-blur-xl border border-border/40 text-foreground shadow-[var(--shadow-sm)] transition-all duration-300 hover:bg-card/90 hover:scale-105 active:scale-95"
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5 rtl:rotate-180" />
            </button>

            {/* Progress dots */}
            <div className="absolute bottom-4 sm:bottom-7 start-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-card/50 backdrop-blur-xl border border-border/30 px-3 py-2 shadow-[var(--shadow-sm)]">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goTo(idx)}
                  className={cn(
                    "relative h-2 rounded-full transition-all duration-500 ease-out overflow-hidden",
                    idx === safeCurrent ? "w-8 bg-muted-foreground/15" : "w-2 bg-muted-foreground/25 hover:bg-muted-foreground/50"
                  )}
                  aria-label={`Slide ${idx + 1}`}
                >
                  {idx === safeCurrent && (
                    <span
                      className="absolute inset-y-0 start-0 rounded-full bg-primary shadow-[var(--shadow-glow)]"
                      style={{ width: `${progress}%`, transition: "width 80ms linear" }}
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
