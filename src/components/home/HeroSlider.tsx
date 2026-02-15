import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
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

  // Fallback hero when no slides configured
  if (!slides.length) {
    return (
      <section className="relative flex items-center justify-center overflow-hidden py-32 md:py-44">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-accent/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--accent)/0.08),transparent_60%)]" />
        
        {/* Floating orbs */}
        <div className="absolute top-20 end-[15%] h-64 w-64 rounded-full bg-primary/8 blur-3xl animate-pulse" />
        <div className="absolute bottom-10 start-[10%] h-48 w-48 rounded-full bg-accent/10 blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />

        <div className="container relative text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {isAr ? "المنصة الأولى عالمياً" : "The World's #1 Culinary Platform"}
            </span>
          </div>
          <h1 className="font-serif text-4xl font-bold sm:text-5xl md:text-6xl lg:text-7xl leading-tight">
            <span className="bg-gradient-to-br from-primary via-primary/80 to-accent bg-clip-text text-transparent">
              {isAr ? "ارتقِ بشغفك" : "Elevate Your"}
            </span>
            <br />
            <span className="text-foreground">
              {isAr ? "في عالم الطهي" : "Culinary Journey"}
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground leading-relaxed">
            {isAr
              ? "تنافس، تعلّم، وتواصل مع أفضل الطهاة حول العالم. منصة واحدة تجمع المسابقات والمعارض والدروس الاحترافية."
              : "Compete, learn, and connect with the finest chefs worldwide. One platform uniting competitions, exhibitions, and professional growth."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="shadow-lg shadow-primary/25 text-base px-8" asChild>
              <Link to="/register">
                {isAr ? "ابدأ رحلتك" : "Start Your Journey"}
                <ArrowRight className="ms-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8" asChild>
              <Link to="/competitions">
                {isAr ? "استكشف المسابقات" : "Explore Competitions"}
              </Link>
            </Button>
          </div>
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
          {/* Enhanced gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
          <div className={cn(
            "absolute inset-0",
            isAr
              ? "bg-gradient-to-l from-background/50 via-background/20 to-transparent"
              : "bg-gradient-to-r from-background/50 via-background/20 to-transparent"
          )} />
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
            aria-label={isAr ? "الشريحة السابقة" : "Previous slide"}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute end-4 top-1/2 z-30 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-background/70 backdrop-blur-md text-foreground shadow-lg ring-1 ring-border/20 transition-all hover:bg-background/90 hover:scale-105"
            aria-label={isAr ? "الشريحة التالية" : "Next slide"}
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
                aria-label={`${isAr ? "انتقل للشريحة" : "Go to slide"} ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
