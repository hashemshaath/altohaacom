import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Check } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { CACHE } from "@/lib/queryConfig";

const SLIDE_DURATION = 6000;
const SWIPE_THRESHOLD = 50;

const SUPABASE_STORAGE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1`;

function heroImgUrl(path: string, width: number, quality = 80): string {
  if (!path) return "/placeholder.svg";
  if (path.includes("supabase.co/storage/")) {
    const base = path.replace("/object/", "/render/image/");
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}width=${width}&quality=${quality}&format=webp`;
  }
  if (path.startsWith("/")) return path;
  if (!path.startsWith("http")) {
    return `${SUPABASE_STORAGE}/render/image/public/${path}?width=${width}&quality=${quality}&format=webp`;
  }
  return path;
}

function heroSrcSet(path: string): string | undefined {
  if (!path || path.startsWith("/")) return undefined;
  return [
    `${heroImgUrl(path, 390)} 390w`,
    `${heroImgUrl(path, 800)} 800w`,
    `${heroImgUrl(path, 1200)} 1200w`,
  ].join(", ");
}

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

function FallbackHero({ isAr }: { isAr: boolean }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5" dir={isAr ? "rtl" : "ltr"}>
      <div className="container py-12 sm:py-16 lg:py-24">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
          <div className="text-center lg:text-start">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary text-sm font-semibold px-4 py-2 mb-6">
              <Sparkles className="h-4 w-4" />
              {isAr ? "مجتمع الطهاة العالمي" : "Global Chef Community"}
            </div>
            <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight text-foreground mb-4 leading-[1.1]">
              {isAr ? "مجتمع الطهاة العالمي" : "The Global Culinary Community"}
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto lg:mx-0 mb-8">
              {isAr ? "انضم إلى أفضل الطهاة والحكام والمنظمين حول العالم" : "Join the finest chefs, judges, and organizers worldwide"}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link to="/register" className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold px-7 py-3.5 text-base hover:opacity-90 transition-all active:scale-[0.98] shadow-lg shadow-primary/25">
                {isAr ? "انضم الآن مجاناً" : "Join Now — Free"}
              </Link>
              <Link to="/competitions" className="inline-flex items-center justify-center rounded-xl border-2 border-border text-foreground font-semibold px-7 py-3.5 text-base hover:bg-muted/50 transition-all active:scale-[0.98]">
                {isAr ? "استكشف المسابقات" : "Explore Competitions"}
              </Link>
            </div>
            <div className="flex justify-center lg:justify-start gap-4 flex-wrap mt-8">
              {(isAr ? ["مجاني تماماً", "مجتمع عالمي", "بدون بطاقة ائتمان"] : ["Completely Free", "Global Community", "No Credit Card"]).map((item) => (
                <span key={item} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-semantic-success" />
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="hidden lg:flex items-center justify-center">
            <div className="w-full max-w-sm rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border border-border/50 p-10 text-center space-y-4">
              <Sparkles className="h-14 w-14 text-primary mx-auto opacity-40 animate-pulse" />
              <p className="text-xl font-bold text-foreground">{isAr ? "منصة الطهاة الأولى" : "The #1 Culinary Platform"}</p>
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="inline-block h-2 w-2 rounded-full bg-semantic-success animate-pulse" />
                  {isAr ? "جاري التحميل..." : "Loading..."}
                </div>
                <div className="grid grid-cols-3 gap-3 w-full">
                  {[
                    { l: isAr ? "الأعضاء" : "Members" },
                    { l: isAr ? "الفعاليات" : "Events" },
                    { l: isAr ? "المنظمون" : "Organizers" },
                  ].map((s) => (
                    <div key={s.l} className="text-center">
                      <div className="h-6 w-12 mx-auto rounded bg-muted/50 animate-pulse mb-1" />
                      <p className="text-[11px] text-muted-foreground">{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
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
  const [hasInteracted, setHasInteracted] = useState(false);

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
    staleTime: CACHE.long.staleTime,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  // Preload first hero slide image for faster LCP
  useEffect(() => {
    if (!slides.length) return;
    const firstUrl = slides[0]?.image_url;
    if (!firstUrl) return;
    const href = heroImgUrl(firstUrl, 1200, 80);
    // Avoid duplicate preload links
    if (document.querySelector(`link[rel="preload"][href="${CSS.escape(href)}"]`)) return;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = href;
    link.type = "image/webp";
    document.head.appendChild(link);
    return () => { link.remove(); };
  }, [slides]);

  useEffect(() => {
    if (!slides.length) { if (current !== 0) setCurrent(0); setProgress(0); return; }
    if (current > slides.length - 1) { setCurrent(0); setProgress(0); startRef.current = performance.now(); }
  }, [slides.length, current]);

  const goTo = useCallback((idx: number) => { setHasInteracted(true); setCurrent(idx); setProgress(0); startRef.current = performance.now(); }, []);
  const next = useCallback(() => goTo((current + 1) % Math.max(slides.length, 1)), [current, slides.length, goTo]);
  const prev = useCallback(() => goTo((current - 1 + slides.length) % Math.max(slides.length, 1)), [current, slides.length, goTo]);
  const swipe = useSwipe(isAr ? prev : next, isAr ? next : prev);

  useEffect(() => {
    if (slides.length <= 1) return;
    startRef.current = performance.now();
    const tick = (now: number) => {
      if (isPaused) { pausedRef.current = now; rafRef.current = requestAnimationFrame(tick); return; }
      if (pausedRef.current > 0) { startRef.current += now - pausedRef.current; pausedRef.current = 0; }
      const pct = Math.min(((now - startRef.current) / SLIDE_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) { setCurrent((c) => (c + 1) % slides.length); setHasInteracted(true); setProgress(0); startRef.current = now; }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [slides.length, current, isPaused]);

  // Preload next slide image during idle time
  useEffect(() => {
    if (slides.length <= 1) return;
    const cur = ((current % slides.length) + slides.length) % slides.length;
    const nextIdx = (cur + 1) % slides.length;
    const nextUrl = slides[nextIdx]?.image_url;
    if (!nextUrl) return;

    const preload = () => {
      const img = new Image();
      img.src = heroImgUrl(nextUrl, 1200, 80);
    };

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(preload, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    } else {
      const timer = setTimeout(preload, 1000);
      return () => clearTimeout(timer);
    }
  }, [slides, current]);

  if (!slides.length) return <FallbackHero isAr={isAr} />;

  const safeCurrent = ((current % slides.length) + slides.length) % slides.length;
  const slide = slides[safeCurrent];
  const opacity = Math.max((slide?.overlay_opacity || 50) / 100, 0.4);
  const isFirstRender = !hasInteracted && safeCurrent === 0;

  return (
    <section
      className="relative overflow-hidden"
      dir={isAr ? "rtl" : "ltr"}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      {...swipe}
    >
      <div className="relative aspect-[3/4] sm:aspect-[16/9] lg:aspect-[21/8]">
        {slides.map((s, idx) => (
          <div
            key={s.id}
            className={cn(
              "absolute inset-0 will-change-[opacity,transform]",
              idx === 0 && isFirstRender
                ? "opacity-100 scale-100"
                : idx === safeCurrent
                ? "opacity-100 scale-100 transition-all duration-1200 ease-in-out"
                : "opacity-0 scale-[1.03] pointer-events-none transition-all duration-1200 ease-in-out"
            )}
          >
            <img
              src={idx === 0 ? heroImgUrl(s.image_url, 800) : s.image_url}
              srcSet={idx === 0 ? heroSrcSet(s.image_url) : undefined}
              sizes={idx === 0 ? "100vw" : undefined}
              alt={isAr ? s.title_ar || s.title : s.title}
              className="h-full w-full object-cover"
              loading={idx === 0 ? "eager" : "lazy"}
              decoding="async"
              {...(idx === 0 ? { fetchpriority: "high" as const } : {})}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/5" style={{ opacity }} />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent rtl:bg-gradient-to-l" />
          </div>
        ))}

        {/* Content overlay */}
        <div className="container relative flex h-full items-end pb-12 sm:pb-16 lg:pb-20">
          <div key={slide.id} className="max-w-xl space-y-3" style={isFirstRender ? undefined : { animation: "heroFadeUp 0.8s cubic-bezier(0.16,1,0.3,1) forwards" }}>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-white">
              <Sparkles className="h-3 w-3" />
              {isAr ? "مميّز" : "Featured"}
            </span>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] text-white drop-shadow-lg">
              {isAr ? slide.title_ar || slide.title : slide.title}
            </h1>
            {(slide.subtitle || slide.subtitle_ar) && (
              <p className="text-sm sm:text-base lg:text-lg max-w-md leading-relaxed text-white/80 line-clamp-2 font-light">
                {isAr ? slide.subtitle_ar || slide.subtitle : slide.subtitle}
              </p>
            )}
            {slide.link_url && (
              <Link to={slide.link_url} className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground font-bold px-5 py-2.5 text-sm hover:opacity-90 transition-all active:scale-[0.98] shadow-lg shadow-primary/30">
                {isAr ? slide.link_label_ar || slide.link_label || "اكتشف المزيد" : slide.link_label || "Learn More"}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            )}
          </div>
        </div>

        {/* Navigation */}
        {slides.length > 1 && (
          <>
            <div className="absolute top-4 end-4 sm:top-5 sm:end-5 flex items-center gap-1.5 rounded-full bg-black/30 backdrop-blur-xl px-2.5 py-1 text-xs font-mono text-white/85">
              <span className="font-bold">{String(safeCurrent + 1).padStart(2, "0")}</span>
              <span className="text-white/40">/</span>
              <span className="text-white/60">{String(slides.length).padStart(2, "0")}</span>
            </div>
            <button onClick={prev} className="absolute start-3 sm:start-5 top-1/2 -translate-y-1/2 hidden sm:flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur-xl text-white transition-all hover:bg-white/30 active:scale-95" aria-label="Previous">
              <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
            </button>
            <button onClick={next} className="absolute end-3 sm:end-5 top-1/2 -translate-y-1/2 hidden sm:flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur-xl text-white transition-all hover:bg-white/30 active:scale-95" aria-label="Next">
              <ChevronRight className="h-5 w-5 rtl:rotate-180" />
            </button>
            <div className="absolute bottom-4 sm:bottom-6 start-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/30 backdrop-blur-xl px-3 py-2" role="tablist">
              {slides.map((_, idx) => (
                <button key={idx} onClick={() => goTo(idx)} role="tab" aria-selected={idx === safeCurrent} className={cn("relative h-6 rounded-full transition-all duration-500 flex items-center justify-center", idx === safeCurrent ? "w-9" : "w-6 hover:bg-white/20")} aria-label={`Slide ${idx + 1}`}>
                  <span className={cn("block rounded-full", idx === safeCurrent ? "h-1.5 w-8 bg-white/20 relative overflow-hidden" : "h-1.5 w-1.5 bg-white/40")}>
                    {idx === safeCurrent && (
                      <span className="absolute inset-y-0 start-0 rounded-full bg-primary" style={{ width: `${progress}%`, transition: "width 80ms linear" }} />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
