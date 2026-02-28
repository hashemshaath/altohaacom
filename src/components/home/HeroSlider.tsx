import { useState, useEffect, useCallback, useRef, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Pause, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { HeroSlide } from "@/components/admin/hero/HeroSlideAdmin";
import { HeroSlidePreview } from "@/components/admin/hero/HeroSlidePreview";

// ── Fallback (no DB slides) ───────────────────────────────────────────────────
const FallbackHero = memo(function FallbackHero({ isAr }: { isAr: boolean }) {
  return (
    <section
      className="relative flex items-center justify-center overflow-hidden"
      style={{ minHeight: 520 }}
      aria-label={isAr ? "القسم الرئيسي" : "Hero section"}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-accent/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.12),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--accent)/0.08),transparent_60%)]" />
      <div className="absolute top-20 end-[15%] h-64 w-64 rounded-full bg-primary/8 blur-3xl animate-pulse" />
      <div
        className="absolute bottom-10 start-[10%] h-48 w-48 rounded-full bg-accent/10 blur-3xl animate-pulse"
        style={{ animationDelay: "1.5s" }}
      />
      <div className="container relative text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 backdrop-blur-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">
            {isAr ? "المنصة الأولى عالمياً" : "The World's #1 Culinary Platform"}
          </span>
        </div>
        <h1 className="text-3xl font-bold sm:text-4xl md:text-5xl lg:text-6xl leading-tight">
          <span className="bg-gradient-to-br from-primary via-primary/80 to-accent bg-clip-text text-transparent">
            {isAr ? "ارتقِ بشغفك" : "Elevate Your"}
          </span>
          <br />
          <span className="text-foreground">{isAr ? "في عالم الطهي" : "Culinary Journey"}</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground leading-relaxed">
          {isAr
            ? "تنافس، تعلّم، وتواصل مع أفضل الطهاة حول العالم."
            : "Compete, learn, and connect with the finest chefs worldwide."}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" className="shadow-lg shadow-primary/25 text-base px-8" asChild>
            <Link to="/register">
              {isAr ? "ابدأ رحلتك" : "Start Your Journey"}{" "}
              <ArrowRight className="ms-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="text-base px-8" asChild>
            <Link to="/competitions">{isAr ? "استكشف المسابقات" : "Explore Competitions"}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
});

// ── Height helper ─────────────────────────────────────────────────────────────
function resolveHeight(slide: HeroSlide): number {
  if (slide.height_preset === "viewport") return window.innerHeight;
  if (slide.height_preset === "custom" && slide.custom_height) return slide.custom_height;
  const map: Record<string, number> = { compact: 360, medium: 520, large: 680, cinematic: 800 };
  return map[slide.height_preset] ?? 520;
}

// ── Slide wrapper ─────────────────────────────────────────────────────────────
const SlideWrapper = memo(function SlideWrapper({
  slide, isActive, height, isFirst,
}: { slide: HeroSlide; isActive: boolean; height: number; isFirst?: boolean }) {
  const effect = slide.animation_effect || "fade";
  return (
    <>
      {isFirst && slide.image_url && <link rel="preload" as="image" href={slide.image_url} />}
      <div
        className={cn(
          "w-full transition-all duration-700",
          !isActive && "absolute inset-0 pointer-events-none",
          effect === "fade"  && (isActive ? "opacity-100" : "opacity-0"),
          effect === "slide" && (isActive ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"),
          effect === "zoom"  && (isActive ? "scale-100 opacity-100" : "scale-110 opacity-0"),
          effect === "blur"  && (isActive ? "blur-0 opacity-100" : "blur-md opacity-0"),
          effect === "none"  && (isActive ? "opacity-100" : "opacity-0"),
        )}
        aria-hidden={!isActive}
        style={!isActive ? { height } : undefined}
      >
        <HeroSlidePreview slide={slide} />
      </div>
    </>
  );
});

// ── Touch swipe hook ──────────────────────────────────────────────────────────
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
    const distX = touchStart.current.x - touchEnd.current.x;
    const distY = Math.abs(touchStart.current.y - touchEnd.current.y);
    if (Math.abs(distX) > 50 && Math.abs(distX) > distY) {
      if (distX > 0) onSwipeLeft(); else onSwipeRight();
    }
  }, [onSwipeLeft, onSwipeRight]);
  return { onTouchStart, onTouchMove, onTouchEnd };
}

// ── Inject progress animation keyframes ───────────────────────────────────────
const styleId = "hero-progress-style";
if (typeof document !== "undefined" && !document.getElementById(styleId)) {
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `@keyframes hero-progress { from { width: 0% } to { width: 100% } }`;
  document.head.appendChild(style);
}

// ── Main slider ───────────────────────────────────────────────────────────────
export function HeroSlider() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const { data: rawSlides = [] } = useQuery<HeroSlide[]>({
    queryKey: ["hero-slides"],
    queryFn: async () => {
      const { data } = await supabase
        .from("hero_slides")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      return (data || []) as HeroSlide[];
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });

  const slides: HeroSlide[] = rawSlides.map((s) => ({
    ...s,
    title:               isAr && s.title_ar              ? s.title_ar              : s.title,
    subtitle:            isAr && s.subtitle_ar           ? s.subtitle_ar           : s.subtitle,
    badge_text:          isAr && s.badge_text_ar         ? s.badge_text_ar         : s.badge_text,
    link_label:          isAr && s.link_label_ar         ? s.link_label_ar         : s.link_label,
    cta_secondary_label: isAr && s.cta_secondary_label_ar ? s.cta_secondary_label_ar : s.cta_secondary_label,
  }));

  const next = useCallback(() => {
    if (slides.length > 0) setCurrent((c) => (c + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    if (slides.length > 0) setCurrent((c) => (c - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const swipe = useSwipe(isAr ? prev : next, isAr ? next : prev);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const interval = slides[current]?.autoplay_interval ?? 6000;
    if (interval === 0) return;
    const timer = setInterval(next, interval);
    return () => clearInterval(timer);
  }, [next, slides.length, slides, current, paused]);

  if (!slides.length) return <FallbackHero isAr={isAr} />;

  const activeHeight = resolveHeight(slides[current]);
  const activeSlide = slides[current];

  return (
    <section
      className="relative overflow-hidden will-change-[height] group/hero"
      style={{ height: activeHeight, transition: "height 0.5s ease" }}
      aria-label={isAr ? "القسم الرئيسي" : "Hero slider"}
      role="region"
      {...swipe}
    >
      {slides.map((slide, i) => (
        <SlideWrapper key={slide.id} slide={slide} isActive={i === current} height={activeHeight} isFirst={i === 0} />
      ))}

      {slides.length > 1 && (
        <>
          {/* Navigation arrows */}
          <button
            onClick={prev}
            className="absolute start-2 sm:start-4 top-1/2 z-30 -translate-y-1/2 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-background/50 backdrop-blur-md text-foreground shadow-lg ring-1 ring-border/20 transition-all hover:bg-background/80 hover:scale-110 opacity-0 group-hover/hero:opacity-80"
            aria-label={isAr ? "الشريحة السابقة" : "Previous slide"}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute end-2 sm:end-4 top-1/2 z-30 -translate-y-1/2 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-background/50 backdrop-blur-md text-foreground shadow-lg ring-1 ring-border/20 transition-all hover:bg-background/80 hover:scale-110 opacity-0 group-hover/hero:opacity-80"
            aria-label={isAr ? "الشريحة التالية" : "Next slide"}
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Bottom bar: progress indicators + counter + pause */}
          <div className="absolute bottom-0 inset-x-0 z-30">
            <div className="flex items-end justify-between px-4 pb-4">
              {/* Progress dots */}
              <div className="flex items-center gap-1.5">
                {slides.map((_: HeroSlide, i: number) => {
                  const isActive = i === current;
                  const interval = slides[i]?.autoplay_interval ?? 6000;
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrent(i)}
                      className={cn(
                        "relative h-1.5 rounded-full transition-all duration-500 overflow-hidden",
                        isActive ? "w-10 bg-foreground/20 backdrop-blur-sm" : "w-1.5 bg-foreground/25 hover:bg-foreground/40"
                      )}
                      aria-label={`${isAr ? "انتقل للشريحة" : "Go to slide"} ${i + 1}`}
                    >
                      {isActive && interval > 0 && !paused && (
                        <span
                          key={`progress-${i}-${current}`}
                          className="absolute inset-y-0 start-0 rounded-full bg-primary shadow-sm shadow-primary/40"
                          style={{ animation: `hero-progress ${interval}ms linear forwards` }}
                        />
                      )}
                      {isActive && (interval === 0 || paused) && (
                        <span className="absolute inset-0 rounded-full bg-primary shadow-sm shadow-primary/40" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Counter + Pause */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPaused(p => !p)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-background/50 backdrop-blur-md text-foreground/70 ring-1 ring-border/20 hover:bg-background/80 transition-all"
                  aria-label={paused ? (isAr ? "تشغيل" : "Play") : (isAr ? "إيقاف" : "Pause")}
                >
                  {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                </button>
                <div className="flex items-center gap-1 rounded-full bg-background/50 backdrop-blur-md px-2.5 py-1 text-[10px] font-medium text-foreground/80 ring-1 ring-border/20">
                  <span className="tabular-nums font-bold">{String(current + 1).padStart(2, "0")}</span>
                  <span className="text-foreground/30">/</span>
                  <span className="tabular-nums text-foreground/50">{String(slides.length).padStart(2, "0")}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
