import { ROUTES } from "@/config/routes";
import { useIsAr } from "@/hooks/useIsAr";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { CACHE } from "@/lib/queryConfig";
import chefsTableHero from "@/assets/chefs-table-hero.jpg";
import entitiesHero from "@/assets/entities-hero.jpg";
import jobsHero from "@/assets/jobs-hero.jpg";


/* ─── Config ─── */
const AUTOPLAY_MS = 5000;
const TRANSITION_MS = 600;

/* ─── Types ─── */
interface HeroSlide {
  id: string;
  image: string;
  overlineEn: string;
  overlineAr: string;
  headingEn: string;
  headingAr: string;
  subtitleEn: string;
  subtitleAr: string;
  primaryLabelEn: string;
  primaryLabelAr: string;
  primaryHref: string;
  secondaryLabelEn: string;
  secondaryLabelAr: string;
  secondaryHref: string;
}

/* ─── Image helper for Supabase-hosted DB slides ─── */
const SUPABASE_STORAGE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1`;
function heroImgUrl(path: string, width = 1600, quality = 82): string {
  if (!path) return "/placeholder.svg";
  if (path.includes("supabase.co/storage/")) {
    const base = path.replace("/object/", "/render/image/");
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}width=${width}&quality=${quality}&format=webp`;
  }
  if (path.startsWith("/") || path.startsWith("http") === false) return path;
  if (!path.startsWith("http")) {
    return `${SUPABASE_STORAGE}/render/image/public/${path}?width=${width}&quality=${quality}&format=webp`;
  }
  return path;
}

/* ─── Fallback slides built from existing project content ─── */
const FALLBACK_SLIDES: HeroSlide[] = [
  {
    id: "fallback-1",
    image: chefsTableHero,
    overlineEn: "GLOBAL CULINARY COMMUNITY",
    overlineAr: "مجتمع الطهاة العالمي",
    headingEn: "Where the World's Finest Chefs Connect",
    headingAr: "حيث يلتقي أمهر طهاة العالم",
    subtitleEn:
      "Join 15,000+ professional chefs across 85 countries — discover competitions, exhibitions, and culinary opportunities.",
    subtitleAr:
      "انضم إلى أكثر من 15,000 طاهٍ محترف في 85 دولة — اكتشف المسابقات والمعارض والفرص الطهوية.",
    primaryLabelEn: "Join Now — Free",
    primaryLabelAr: "انضم الآن مجاناً",
    primaryHref: ROUTES.register,
    secondaryLabelEn: "Explore Competitions",
    secondaryLabelAr: "استكشف المسابقات",
    secondaryHref: ROUTES.competitions,
  },
  {
    id: "fallback-2",
    image: entitiesHero,
    overlineEn: "EXHIBITIONS & EVENTS",
    overlineAr: "المعارض والفعاليات",
    headingEn: "Discover World-Class Food & Beverage Exhibitions",
    headingAr: "اكتشف معارض الأغذية والمشروبات العالمية",
    subtitleEn:
      "Connect with leading organizers, attend premier exhibitions, and grow your culinary network worldwide.",
    subtitleAr:
      "تواصل مع كبار المنظمين، احضر أبرز المعارض، ووسّع شبكتك الطهوية حول العالم.",
    primaryLabelEn: "Browse Exhibitions",
    primaryLabelAr: "تصفّح المعارض",
    primaryHref: ROUTES.exhibitions,
    secondaryLabelEn: "View Organizers",
    secondaryLabelAr: "عرض المنظمين",
    secondaryHref: ROUTES.organizers,
  },
  {
    id: "fallback-3",
    image: jobsHero,
    overlineEn: "CAREER OPPORTUNITIES",
    overlineAr: "الفرص المهنية",
    headingEn: "Find Your Next Culinary Opportunity",
    headingAr: "ابحث عن فرصتك الطهوية القادمة",
    subtitleEn:
      "Discover hand-picked roles from top hotels, restaurants, and culinary brands across the region.",
    subtitleAr:
      "اكتشف وظائف منتقاة من أبرز الفنادق والمطاعم والعلامات الطهوية في المنطقة.",
    primaryLabelEn: "Browse Jobs",
    primaryLabelAr: "تصفّح الوظائف",
    primaryHref: ROUTES.jobs,
    secondaryLabelEn: "For Employers",
    secondaryLabelAr: "لأصحاب العمل",
    secondaryHref: ROUTES.jobs,
  },
];

/* ─── Hero Section ─── */
export function HeroSection() {
  const isAr = useIsAr();
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Pull DB slides if available, otherwise use fallback
  const { data: dbSlides } = useQuery({
    queryKey: ["hero-slides-v2"],
    queryFn: async () => {
      const { data } = await supabase
        .from("hero_slides")
        .select("id,title,title_ar,subtitle,subtitle_ar,image_url,link_label,link_label_ar,link_url,sort_order")
        .eq("is_active", true)
        .order("sort_order");
      return data || [];
    },
    staleTime: CACHE.long.staleTime,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  const slides: HeroSlide[] = useMemo(() => {
    if (!dbSlides || dbSlides.length === 0) return FALLBACK_SLIDES;
    // Map DB rows; pad with fallback secondary CTA
    const mapped: HeroSlide[] = dbSlides.map((s: any, i: number) => ({
      id: s.id,
      image: heroImgUrl(s.image_url, 1600),
      overlineEn: "FEATURED",
      overlineAr: "مميّز",
      headingEn: s.title || "",
      headingAr: s.title_ar || s.title || "",
      subtitleEn: s.subtitle || "",
      subtitleAr: s.subtitle_ar || s.subtitle || "",
      primaryLabelEn: s.link_label || "Learn More",
      primaryLabelAr: s.link_label_ar || s.link_label || "اعرف المزيد",
      primaryHref: s.link_url || ROUTES.competitions,
      secondaryLabelEn: "Explore Competitions",
      secondaryLabelAr: "استكشف المسابقات",
      secondaryHref: ROUTES.competitions,
    }));
    return mapped.length >= 3 ? mapped : [...mapped, ...FALLBACK_SLIDES.slice(mapped.length)];
  }, [dbSlides]);

  const total = slides.length;

  const goTo = useCallback((idx: number) => {
    setCurrent(((idx % total) + total) % total);
  }, [total]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Auto-play
  useEffect(() => {
    if (isPaused || total <= 1) return;
    timerRef.current = window.setTimeout(() => {
      setCurrent((c) => (c + 1) % total);
    }, AUTOPLAY_MS);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [current, isPaused, total]);

  // Preload next image
  useEffect(() => {
    if (total <= 1) return;
    const nextIdx = (current + 1) % total;
    const img = new Image();
    img.src = slides[nextIdx].image;
  }, [current, total, slides]);

  return (
    <section
      className="hero-slider"
      dir={isAr ? "rtl" : "ltr"}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-roledescription="carousel"
      aria-label={isAr ? "العرض الرئيسي" : "Hero slider"}
    >
      {/* Slides */}
      {slides.map((slide, idx) => {
        const isActive = idx === current;
        const heading = isAr ? slide.headingAr : slide.headingEn;
        const subtitle = isAr ? slide.subtitleAr : slide.subtitleEn;
        const overline = isAr ? slide.overlineAr : slide.overlineEn;
        const primaryLabel = isAr ? slide.primaryLabelAr : slide.primaryLabelEn;
        const secondaryLabel = isAr ? slide.secondaryLabelAr : slide.secondaryLabelEn;

        return (
          <div
            key={slide.id}
            className={`hero-slide ${isActive ? "is-active" : "is-inactive"}`}
            aria-hidden={!isActive}
            role="group"
            aria-roledescription="slide"
            aria-label={`${idx + 1} / ${total}`}
          >
            <img
              src={slide.image}
              alt={heading}
              className="hero-slide__img"
              loading={idx === 0 ? "eager" : "lazy"}
              decoding={idx === 0 ? "sync" : "async"}
              fetchPriority={idx === 0 ? "high" : undefined}
            />
            <div className="hero-slide__overlay" />
            <div className="hero-slide__content-wrap">
              <div className="hero-slide__content">
                <p className="hero-slide__overline">{overline}</p>
                <h1 className="hero-slide__heading">{heading}</h1>
                {subtitle && <p className="hero-slide__subtitle">{subtitle}</p>}
                <div className="hero-slide__buttons">
                  <Link to={slide.primaryHref} className="hero-btn hero-btn--primary">
                    {primaryLabel}
                  </Link>
                  <Link to={slide.secondaryHref} className="hero-btn hero-btn--secondary">
                    {secondaryLabel}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Arrows (desktop) */}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="hero-arrow hero-arrow--left"
            aria-label={isAr ? "السابق" : "Previous slide"}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            className="hero-arrow hero-arrow--right"
            aria-label={isAr ? "التالي" : "Next slide"}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {total > 1 && (
        <div className="hero-dots" role="tablist">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => goTo(idx)}
              className={`hero-dot ${idx === current ? "is-active" : ""}`}
              aria-label={`${isAr ? "الشريحة" : "Slide"} ${idx + 1}`}
              aria-selected={idx === current}
              role="tab"
            />
          ))}
        </div>
      )}

      {/* Scoped styles */}
      <style>{`
        .hero-slider {
          position: relative;
          width: 100%;
          height: 92vh;
          min-height: 640px;
          overflow: hidden;
          background: #1C1C1A;
        }
        @media (max-width: 1024px) {
          .hero-slider { height: 80vh; min-height: 520px; }
        }
        @media (max-width: 768px) {
          .hero-slider { height: 75vh; min-height: 480px; }
        }

        .hero-slide {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          transform: translateX(40px);
          transition: opacity ${TRANSITION_MS}ms ease-in-out, transform ${TRANSITION_MS}ms ease-in-out;
          pointer-events: none;
          will-change: opacity, transform;
        }
        .hero-slide.is-active {
          opacity: 1;
          transform: translateX(0);
          pointer-events: auto;
          z-index: 2;
        }
        .hero-slide.is-inactive {
          opacity: 0;
          transform: translateX(-40px);
          z-index: 1;
        }

        .hero-slide__img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .hero-slide__overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(28,28,26,0) 0%, rgba(28,28,26,0.35) 55%, rgba(28,28,26,0.75) 100%);
        }

        .hero-slide__content-wrap {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: flex-end;
          padding-bottom: 12vh;
        }
        .hero-slide__content {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 80px;
          color: #FEFCF8;
        }
        @media (max-width: 1024px) {
          .hero-slide__content { padding: 0 48px; }
          .hero-slide__content-wrap { padding-bottom: 14vh; }
        }
        @media (max-width: 768px) {
          .hero-slide__content { padding: 0 24px; }
          /* Leave room for dots above the 64px mobile bottom nav */
          .hero-slide__content-wrap {
            padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px) + 56px);
          }
        }

        .hero-slide__overline {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #C05B2E;
          margin: 0 0 12px 0;
        }
        .hero-slide__heading {
          font-size: 3rem;
          font-weight: 700;
          color: #FEFCF8;
          line-height: 1.1;
          letter-spacing: -0.02em;
          max-width: 700px;
          margin: 0 0 20px 0;
        }
        @media (max-width: 768px) {
          .hero-slide__heading { font-size: 2rem; }
        }
        .hero-slide__subtitle {
          font-size: 1.125rem;
          color: rgba(254,252,248,0.8);
          line-height: 1.6;
          max-width: 560px;
          margin: 0 0 32px 0;
        }
        @media (max-width: 768px) {
          .hero-slide__subtitle { font-size: 1rem; margin-bottom: 24px; }
        }

        .hero-slide__buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .hero-slide__search {
          margin-top: 32px;
          max-width: 680px;
        }
        @media (max-width: 768px) {
          .hero-slide__search { margin-top: 24px; max-width: 100%; }
        }
        @media (max-width: 768px) {
          .hero-slide__buttons {
            flex-direction: column;
            gap: 10px;
            width: 100%;
          }
        }

        .hero-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 52px;
          padding: 0 32px;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          text-decoration: none;
          transition: background 200ms ease, transform 200ms ease, border-color 200ms ease;
          cursor: pointer;
          white-space: nowrap;
        }
        @media (max-width: 768px) {
          .hero-btn { height: 48px; width: 100%; }
        }
        .hero-btn--primary {
          background: #C05B2E;
          color: #FEFCF8;
          border: 1.5px solid #C05B2E;
        }
        .hero-btn--primary:hover {
          background: #A34D24;
          border-color: #A34D24;
          transform: translateY(-1px);
        }
        .hero-btn--secondary {
          background: transparent;
          color: #FEFCF8;
          border: 1.5px solid rgba(254,252,248,0.6);
        }
        .hero-btn--secondary:hover {
          background: rgba(254,252,248,0.1);
          border-color: rgba(254,252,248,0.8);
        }

        /* Arrows */
        .hero-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 48px;
          height: 48px;
          border-radius: 9999px;
          background: rgba(254,252,248,0.15);
          border: 1px solid rgba(254,252,248,0.2);
          color: #FEFCF8;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 5;
          transition: background 200ms ease;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .hero-arrow:hover { background: rgba(254,252,248,0.25); }
        .hero-arrow--left { left: 24px; }
        .hero-arrow--right { right: 24px; }
        @media (max-width: 768px) {
          .hero-arrow { display: none; }
        }

        /* Dots */
        .hero-dots {
          position: absolute;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
          z-index: 5;
        }
        @media (max-width: 768px) {
          /* Lift dots above mobile bottom nav (64px + safe-area) */
          .hero-dots {
            bottom: calc(64px + env(safe-area-inset-bottom, 0px) + 16px);
          }
        }
        .hero-dot {
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background: rgba(254,252,248,0.4);
          border: none;
          cursor: pointer;
          padding: 0;
          transition: width 300ms ease, background 300ms ease;
        }
        .hero-dot.is-active {
          width: 24px;
          background: #C05B2E;
        }
      `}</style>
    </section>
  );
}
