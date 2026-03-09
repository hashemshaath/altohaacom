import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useState, useEffect, useCallback, useRef, memo, forwardRef } from "react";
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

/* ── Memoised slide background ── */
const SlideBackground = memo(forwardRef<HTMLDivElement, {
  slide: HeroSlide;
  isActive: boolean;
  isFirst: boolean;
}>(function SlideBackground({ slide, isActive, isFirst }, ref) {
  const opacity = Math.max((slide.overlay_opacity || 50) / 100, 0.55);

  return (
    <div
      ref={ref}
      className={cn(
        "absolute inset-0 transition-all duration-[1200ms] ease-in-out will-change-[opacity,transform]",
        isActive ? "opacity-100 scale-100" : "opacity-0 scale-[1.04] pointer-events-none"
      )}
    >
      <img
        src={slide.image_url}
        alt={slide.title}
        className={cn("h-full w-full object-cover", isActive && "animate-ken-burns")}
        loading={isFirst ? "eager" : "lazy"}
        decoding={isFirst ? "sync" : "async"}
        {...(isFirst ? { fetchPriority: "high" } : {})}
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent"
        style={{ opacity }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-background/15 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}));

/* ── Touch swipe hook ── */
function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchEnd = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    touchEnd.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return;
    const dx = touchStart.current.x - touchEnd.current.x;
    const dy = Math.abs(touchStart.current.y - touchEnd.current.y);
    // Only horizontal swipes (ignore vertical scrolling)
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > dy) {
      if (dx > 0) onSwipeLeft();
      else onSwipeRight();
    }
  }, [onSwipeLeft, onSwipeRight]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}

export const HeroSection = memo(function HeroSection() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const rafRef = useRef<number>(0);
  const startRef = useRef(0);
  const pausedAtRef = useRef(0);

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

  // Touch swipe (RTL-aware)
  const swipeHandlers = useSwipe(
    isAr ? prev : next,
    isAr ? next : prev
  );

  // Auto-advance with pause support
  useEffect(() => {
    if (slides.length <= 1) return;
    startRef.current = performance.now();

    const tick = (now: number) => {
      if (isPaused) {
        pausedAtRef.current = now;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      // Adjust start time if resuming from pause
      if (pausedAtRef.current > 0) {
        startRef.current += now - pausedAtRef.current;
        pausedAtRef.current = 0;
      }
      const pct = Math.min(((now - startRef.current) / SLIDE_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        setCurrent(c => (c + 1) % slides.length);
        setProgress(0);
        startRef.current = now;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [slides.length, current, isPaused]);

  // Keyboard navigation
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
      <section className="relative flex min-h-[55vh] sm:min-h-[60vh] items-center justify-center bg-muted/30 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="text-center space-y-6 px-4 relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {isAr ? "منصة الطهاة الأولى" : "The #1 Culinary Platform"}
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.1] font-sans">
            {isAr ? "مجتمع الطهاة العالمي" : "The Global Culinary Community"}
          </h1>
          <p className="text-base text-muted-foreground max-w-xl mx-auto leading-relaxed sm:text-lg font-sans">
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
    <section
      className="relative overflow-hidden bg-background"
      dir={isAr ? "rtl" : "ltr"}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      {...swipeHandlers}
    >
      <div className="relative min-h-[50vh] sm:min-h-[55vh] lg:min-h-[75vh]">
        {slides.map((s, idx) => (
          <SlideBackground key={s.id} slide={s} isActive={idx === current} isFirst={idx === 0} />
        ))}

        {/* Content */}
        <div className="container relative flex h-full min-h-[50vh] sm:min-h-[55vh] lg:min-h-[75vh] items-end pb-14 sm:pb-24 lg:pb-28">
          <div
            key={slide.id}
            className="max-w-2xl space-y-4 sm:space-y-5"
            style={{ animation: "heroFadeUp 0.8s cubic-bezier(0.16,1,0.3,1) forwards" }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 backdrop-blur-md border border-primary/25 px-3 py-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-primary shadow-sm">
              <Sparkles className="h-3 w-3" />
              {isAr ? "مميّز" : "Featured"}
            </span>

            <h1 className="text-2xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl leading-[1.1] text-foreground drop-shadow-lg font-sans">
              {isAr ? slide.title_ar || slide.title : slide.title}
            </h1>

            {(slide.subtitle || slide.subtitle_ar) && (
              <p className="text-xs sm:text-base lg:text-lg max-w-lg leading-relaxed text-muted-foreground drop-shadow-md font-sans">
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

        {/* Slide counter */}
        {slides.length > 1 && (
          <div className="absolute top-4 end-4 sm:top-6 sm:end-6 flex items-center gap-1.5 rounded-full bg-card/40 backdrop-blur-xl border border-border/20 px-2.5 py-1 text-[10px] font-mono text-foreground/70">
            <span className="font-bold">{String(current + 1).padStart(2, "0")}</span>
            <span className="text-muted-foreground/50">/</span>
            <span className="text-muted-foreground/70">{String(slides.length).padStart(2, "0")}</span>
          </div>
        )}

        {/* Navigation */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute start-2 sm:start-5 top-1/2 -translate-y-1/2 hidden sm:flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-card/60 backdrop-blur-xl border border-border/40 text-foreground shadow-[var(--shadow-sm)] transition-all duration-300 hover:bg-card/90 hover:shadow-[var(--shadow-md)] hover:scale-105 active:scale-95 touch-manipulation"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
            </button>
            <button
              onClick={next}
              className="absolute end-2 sm:end-5 top-1/2 -translate-y-1/2 hidden sm:flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-card/60 backdrop-blur-xl border border-border/40 text-foreground shadow-[var(--shadow-sm)] transition-all duration-300 hover:bg-card/90 hover:shadow-[var(--shadow-md)] hover:scale-105 active:scale-95 touch-manipulation"
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
                    idx === current ? "w-8 bg-muted-foreground/15" : "w-2 bg-muted-foreground/25 hover:bg-muted-foreground/50"
                  )}
                  aria-label={`Slide ${idx + 1}`}
                >
                  {idx === current && (
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
});
