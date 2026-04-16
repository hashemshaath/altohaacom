import { ROUTES } from "@/config/routes";
import { useIsAr } from "@/hooks/useIsAr";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Check, Trophy, Globe, Users } from "lucide-react";
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

/* ── Trust indicator stats ── */
function TrustStats({ isAr }: { isAr: boolean }) {
  const stats = isAr
    ? [
        { icon: Users, value: "15,000+", label: "طاهٍ مسجّل" },
        { icon: Trophy, value: "200+", label: "مسابقة عالمية" },
        { icon: Globe, value: "85+", label: "دولة" },
      ]
    : [
        { icon: Users, value: "15,000+", label: "Registered Chefs" },
        { icon: Trophy, value: "200+", label: "Global Competitions" },
        { icon: Globe, value: "85+", label: "Countries" },
      ];

  return (
    <div className="flex items-center gap-5 sm:gap-7">
      {stats.map((s, i) => (
        <div key={s.label} className="flex items-center gap-2">
          {i > 0 && <div className="w-px h-8 bg-[#1C1C1A]/10 -ms-3 me-2 hidden sm:block" />}
          <s.icon className="h-4 w-4 shrink-0 hidden sm:block" style={{ color: "#C05B2E" }} />
          <div>
            <p className="text-sm sm:text-base font-bold tracking-tight" style={{ color: "#C05B2E" }}>{s.value}</p>
            <p className="text-[0.7rem] sm:text-xs leading-tight" style={{ color: "#6B6560" }}>{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Fallback Hero (no slides) ── */
function FallbackHero() {
  const isAr = useIsAr();
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #F5F0E8 0%, #EDE7DB 100%)", minHeight: "70vh" }}
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="container h-full flex items-center py-12 lg:py-0" style={{ minHeight: "inherit" }}>
        <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-8 lg:gap-12 items-center w-full">
          {/* Text column */}
          <div className="order-2 lg:order-1 text-center lg:text-start space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" style={{ background: "rgba(192,91,46,0.1)", color: "#C05B2E" }}>
              <Sparkles className="h-4 w-4" />
              {isAr ? "مجتمع الطهاة العالمي" : "Global Chef Community"}
            </div>

            <h1
              className="text-[2rem] lg:text-[3rem] font-bold leading-[1.15] tracking-[-0.02em]"
              style={{ color: "#1C1C1A" }}
            >
              {isAr ? "مجتمع الطهاة العالمي" : "The Global Culinary Community"}
            </h1>

            <p
              className="text-[1.125rem] leading-relaxed max-w-[480px] mx-auto lg:mx-0"
              style={{ color: "#6B6560" }}
            >
              {isAr
                ? "انضم إلى أفضل الطهاة والحكام والمنظمين حول العالم"
                : "Join the finest chefs, judges, and organizers worldwide"}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                to={ROUTES.register}
                className="inline-flex items-center justify-center font-bold text-base transition-all active:scale-[0.98] w-full sm:w-auto"
                style={{
                  background: "#C05B2E",
                  color: "#FEFCF8",
                  padding: "14px 32px",
                  borderRadius: "8px",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#A34D24")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#C05B2E")}
              >
                {isAr ? "انضم الآن مجاناً" : "Join Now — Free"}
              </Link>
              <Link
                to={ROUTES.competitions}
                className="inline-flex items-center justify-center font-semibold text-base transition-all active:scale-[0.98] w-full sm:w-auto"
                style={{
                  border: "1.5px solid #C05B2E",
                  color: "#C05B2E",
                  background: "transparent",
                  padding: "14px 32px",
                  borderRadius: "8px",
                }}
              >
                {isAr ? "استكشف المسابقات" : "Explore Competitions"}
              </Link>
            </div>

            <TrustStats isAr={isAr} />
          </div>

          {/* Image column */}
          <div className="order-1 lg:order-2 flex items-center justify-center">
            <div className="w-full max-w-md lg:max-w-none aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 flex items-center justify-center">
              <Sparkles className="h-16 w-16 text-brand-primary opacity-30 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Main Hero ── */
export function HeroSection() {
  const isAr = useIsAr();
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

  if (!slides.length) return <FallbackHero />;

  const safeCurrent = ((current % slides.length) + slides.length) % slides.length;
  const slide = slides[safeCurrent];
  const isFirstRender = !hasInteracted && safeCurrent === 0;

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #F5F0E8 0%, #EDE7DB 100%)" }}
      dir={isAr ? "rtl" : "ltr"}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      {...swipe}
    >
      {/* Subtle decorative circles */}
      <div className="absolute -top-32 -start-32 w-96 h-96 rounded-full opacity-[0.07]" style={{ background: "radial-gradient(circle, #C05B2E 0%, transparent 70%)" }} />
      <div className="absolute -bottom-24 -end-24 w-72 h-72 rounded-full opacity-[0.05]" style={{ background: "radial-gradient(circle, #C05B2E 0%, transparent 70%)" }} />
      <div className="min-h-[520px] lg:min-h-[600px] lg:h-[75vh] max-h-[780px]">
        <div className="container h-full">
          <div className="grid grid-cols-1 lg:grid-cols-[50fr_50fr] gap-6 lg:gap-14 h-full items-center">

            {/* ── Text column ── */}
            <div className="order-2 lg:order-1 text-center lg:text-start space-y-4 py-6 lg:py-0">
              <div
                key={`badge-${slide.id}`}
                className={cn(!isFirstRender && "animate-[heroFadeUp_0.6s_ease-out_forwards]")}
              >
                <span
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-label font-bold uppercase tracking-widest"
                  style={{ background: "rgba(192,91,46,0.1)", color: "#C05B2E" }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {isAr ? "مميّز" : "Featured"}
                </span>
              </div>

              <div
                key={`title-${slide.id}`}
                className={cn(!isFirstRender && "animate-[heroFadeUp_0.7s_ease-out_forwards]")}
              >
                <h1
                  className="text-[1.75rem] sm:text-[2rem] lg:text-[2.75rem] xl:text-[3.25rem] font-bold leading-[1.12] tracking-[-0.025em]"
                  style={{ color: "#1C1C1A" }}
                >
                  {isAr ? slide.title_ar || slide.title : slide.title}
                </h1>
              </div>

              {(slide.subtitle || slide.subtitle_ar) && (
                <div
                  key={`sub-${slide.id}`}
                  className={cn(!isFirstRender && "animate-[heroFadeUp_0.8s_ease-out_forwards]")}
                >
                  <p
                    className="text-[1.125rem] leading-relaxed max-w-[480px] mx-auto lg:mx-0 line-clamp-3"
                    style={{ color: "#6B6560" }}
                  >
                    {isAr ? slide.subtitle_ar || slide.subtitle : slide.subtitle}
                  </p>
                </div>
              )}

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-1">
                {slide.link_url && (
                  <Link
                    to={slide.link_url}
                    className="inline-flex items-center justify-center gap-2 font-bold text-base transition-all active:scale-[0.98] w-full sm:w-auto"
                    style={{
                      background: "#C05B2E",
                      color: "#FEFCF8",
                      padding: "14px 32px",
                      borderRadius: "8px",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#A34D24")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#C05B2E")}
                  >
                    {isAr ? slide.link_label_ar || slide.link_label || "اكتشف المزيد" : slide.link_label || "Learn More"}
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </Link>
                )}
                <Link
                  to={ROUTES.competitions}
                  className="inline-flex items-center justify-center font-semibold text-base transition-all active:scale-[0.98] w-full sm:w-auto"
                  style={{
                    border: "1.5px solid #C05B2E",
                    color: "#C05B2E",
                    background: "transparent",
                    padding: "14px 32px",
                    borderRadius: "8px",
                  }}
                >
                  {isAr ? "استكشف المسابقات" : "Explore Competitions"}
                </Link>
              </div>

              {/* Trust Stats */}
              <div className="pt-2">
                <TrustStats isAr={isAr} />
              </div>
            </div>

            {/* ── Image column ── */}
            <div className="order-1 lg:order-2 relative h-[35vh] lg:h-[85%] min-h-[250px]">
              <div className="relative h-full w-full rounded-2xl lg:rounded-3xl overflow-hidden shadow-[0_25px_60px_-12px_rgba(0,0,0,0.15)]">
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
                      sizes={idx === 0 ? "(max-width: 1024px) 100vw, 45vw" : undefined}
                      alt={isAr ? s.title_ar || s.title : s.title}
                      className="h-full w-full object-cover"
                      width={1200}
                      height={600}
                      loading={idx === 0 ? "eager" : "lazy"}
                      decoding={idx === 0 ? "sync" : "async"}
                      fetchPriority={idx === 0 ? "high" : undefined}
                    />
                  </div>
                ))}

                {/* Slide counter */}
                {slides.length > 1 && (
                  <div className="absolute top-4 end-4 flex items-center gap-1.5 rounded-full bg-black/30 backdrop-blur-xl px-2.5 py-1 text-xs font-mono text-white/85">
                    <span className="font-bold">{String(safeCurrent + 1).padStart(2, "0")}</span>
                    <span className="text-white/40">/</span>
                    <span className="text-white/60">{String(slides.length).padStart(2, "0")}</span>
                  </div>
                )}
              </div>

              {/* Navigation arrows */}
              {slides.length > 1 && (
                <>
                  <button
                    onClick={prev}
                    className="absolute start-3 top-1/2 -translate-y-1/2 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-md transition-all hover:bg-white active:scale-95"
                    style={{ color: "#1C1C1A" }}
                    aria-label="Previous"
                  >
                    <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
                  </button>
                  <button
                    onClick={next}
                    className="absolute end-3 top-1/2 -translate-y-1/2 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-md transition-all hover:bg-white active:scale-95"
                    style={{ color: "#1C1C1A" }}
                    aria-label="Next"
                  >
                    <ChevronRight className="h-5 w-5 rtl:rotate-180" />
                  </button>
                </>
              )}

              {/* Dot indicators */}
              {slides.length > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4" role="tablist">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => goTo(idx)}
                      role="tab"
                      aria-selected={idx === safeCurrent}
                      className={cn(
                        "relative rounded-full transition-all duration-500",
                        idx === safeCurrent ? "w-8 h-2" : "w-2 h-2 hover:bg-brand-primary/40"
                      )}
                      style={{
                        background: idx === safeCurrent ? "rgba(192,91,46,0.2)" : "rgba(28,28,26,0.15)",
                      }}
                      aria-label={`Slide ${idx + 1}`}
                    >
                      {idx === safeCurrent && (
                        <span
                          className="absolute inset-y-0 start-0 rounded-full"
                          style={{
                            background: "#C05B2E",
                            width: `${progress}%`,
                            transition: "width 80ms linear",
                          }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
