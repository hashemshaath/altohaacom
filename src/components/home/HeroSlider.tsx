import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function HeroSlider() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [current, setCurrent] = useState(0);

  const { data: slides = [] } = useQuery({
    queryKey: ["hero-slides"],
    queryFn: async () => {
      const { data } = await supabase
        .from("hero_slides")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      return data || [];
    },
  });

  const next = useCallback(() => {
    if (slides.length > 0) setCurrent((c) => (c + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    if (slides.length > 0) setCurrent((c) => (c - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, slides.length]);

  if (!slides.length) {
    return (
      <section className="relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background py-28 md:py-40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_70%)]" />
        <div className="container relative text-center">
          <div className="mx-auto mb-5 rounded-2xl bg-primary/5 p-5 ring-1 ring-primary/15 inline-block shadow-lg shadow-primary/5">
            <img src="/altohaa-logo.png" alt="Altohaa" className="h-16 w-auto sm:h-20" />
          </div>
          <h1 className="font-serif text-4xl font-bold sm:text-5xl md:text-6xl">
            <span className="bg-gradient-to-br from-primary via-primary/80 to-accent bg-clip-text text-transparent">Altohaa</span>
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            {isAr ? "منصة مجتمع الطهي العالمي" : "The Global Culinary Community"}
          </p>
        </div>
      </section>
    );
  }

  const slide = slides[current];
  const title = isAr && slide.title_ar ? slide.title_ar : slide.title;
  const subtitle = isAr && slide.subtitle_ar ? slide.subtitle_ar : slide.subtitle;
  const linkLabel = isAr && slide.link_label_ar ? slide.link_label_ar : slide.link_label;

  return (
    <section className="relative h-[360px] sm:h-[440px] md:h-[560px] lg:h-[620px] overflow-hidden">
      {/* Slides */}
      {slides.map((s: any, i: number) => (
        <div
          key={s.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000 ease-in-out",
            i === current ? "opacity-100 z-10" : "opacity-0 z-0"
          )}
        >
          <img
            src={s.image_url}
            alt={isAr && s.title_ar ? s.title_ar : s.title}
            className={cn(
              "h-full w-full object-cover transition-transform duration-[8000ms] ease-out",
              i === current ? "scale-105" : "scale-100"
            )}
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
          />
          {/* Enhanced gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-background/20 to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="absolute inset-0 z-20 flex items-end pb-16 sm:pb-20 md:items-center md:pb-0">
        <div className="container">
          <div className="max-w-2xl animate-fade-in">
            <h1 className="font-serif text-2xl font-bold text-foreground sm:text-4xl md:text-5xl lg:text-6xl drop-shadow-sm leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-4 text-base text-muted-foreground sm:text-lg md:text-xl max-w-lg leading-relaxed">
                {subtitle}
              </p>
            )}
            {slide.link_url && linkLabel && (
              <Button size="lg" className="mt-7 shadow-lg shadow-primary/25 text-base px-8" asChild>
                <Link to={slide.link_url}>
                  {linkLabel}
                  <ArrowRight className="ms-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute start-4 top-1/2 z-30 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-background/70 backdrop-blur-md text-foreground shadow-lg ring-1 ring-border/20 transition-all hover:bg-background/90 hover:scale-105"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute end-4 top-1/2 z-30 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-background/70 backdrop-blur-md text-foreground shadow-lg ring-1 ring-border/20 transition-all hover:bg-background/90 hover:scale-105"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Progress dots */}
          <div className="absolute bottom-5 inset-x-0 z-30 flex justify-center gap-2.5">
            {slides.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={cn(
                  "h-2 rounded-full transition-all duration-500",
                  i === current ? "w-10 bg-primary shadow-sm shadow-primary/30" : "w-2 bg-foreground/25 hover:bg-foreground/40"
                )}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
