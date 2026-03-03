import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { usePreloadImage } from "@/hooks/usePreloadImage";

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

export function HeroSection() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [current, setCurrent] = useState(0);

  const { data: slides = [] } = useQuery<HeroSlide[]>({
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
    refetchOnWindowFocus: false,
  });

  // Preload the first slide image for faster LCP
  usePreloadImage(slides[0]?.image_url);

  const next = useCallback(() => setCurrent(c => (c + 1) % Math.max(slides.length, 1)), [slides.length]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + slides.length) % Math.max(slides.length, 1)), [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [slides.length, next]);

  if (slides.length === 0) {
    return (
      <section className="relative flex min-h-[60vh] items-center justify-center bg-muted/30">
        <div className="text-center space-y-5 px-4">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {isAr ? "منصة الطهاة الأولى" : "The #1 Culinary Platform"}
          </div>
          <h1 className="text-4xl font-serif font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl drop-shadow-sm">
            {isAr ? "مجتمع الطهاة العالمي" : "The Global Culinary Community"}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            {isAr ? "انضم إلى أفضل الطهاة والحكام والمنظمين حول العالم" : "Join the finest chefs, judges, and organizers worldwide"}
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
        {/* Background Images */}
        {slides.map((s, idx) => (
          <div
            key={s.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000 ease-in-out",
              idx === current ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            <img
              src={s.image_url}
              alt=""
              className={cn(
                "h-full w-full object-cover",
                idx === current && "animate-ken-burns"
              )}
              loading={idx === 0 ? "eager" : "lazy"}
            />
            {/* Enhanced multi-layer gradient overlay */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"
              style={{ opacity: (s.overlay_opacity || 50) / 100 }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/40 to-transparent" />
          </div>
        ))}

        {/* Content */}
        <div className="container relative flex h-full min-h-[55vh] sm:min-h-[65vh] lg:min-h-[75vh] items-end pb-16 sm:pb-20 lg:pb-24">
          <div
            key={slide.id}
            className="max-w-2xl space-y-5"
            style={{ animation: "heroFadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 backdrop-blur-md border border-primary/25 px-3.5 py-1 text-xs font-semibold text-primary shadow-sm">
              <Sparkles className="h-3 w-3" />
              {isAr ? "مميّز" : "Featured"}
            </div>

            <h1 className="text-3xl font-serif font-bold tracking-tight sm:text-4xl lg:text-5xl leading-[1.15] drop-shadow-sm"
              style={{ textShadow: "0 2px 12px hsl(var(--background) / 0.4)" }}
            >
              {isAr ? slide.title_ar || slide.title : slide.title}
            </h1>

            {(slide.subtitle || slide.subtitle_ar) && (
              <p className="text-base text-muted-foreground sm:text-lg max-w-lg leading-relaxed"
                style={{ textShadow: "0 1px 8px hsl(var(--background) / 0.3)" }}
              >
                {isAr ? slide.subtitle_ar || slide.subtitle : slide.subtitle}
              </p>
            )}

            {slide.link_url && (
              <Button size="lg" className="rounded-xl shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all duration-300" asChild>
                <Link to={slide.link_url}>
                  {isAr ? slide.link_label_ar || slide.link_label || "اكتشف المزيد" : slide.link_label || "Learn More"}
                  <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Navigation Arrows — glassmorphic */}
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

            {/* Slide indicators — pill with glassmorphism */}
            <div className="absolute bottom-5 sm:bottom-7 start-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-card/50 backdrop-blur-xl border border-border/30 px-3 py-2 shadow-[var(--shadow-sm)]">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrent(idx)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-500 ease-out",
                    idx === current
                      ? "w-7 bg-primary shadow-[var(--shadow-glow)]"
                      : "w-2 bg-muted-foreground/25 hover:bg-muted-foreground/50"
                  )}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>


    </section>
  );
}
