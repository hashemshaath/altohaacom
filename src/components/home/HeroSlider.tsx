import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { HeroSlide } from "@/components/admin/hero/HeroSlideAdmin";
import { HeroSlidePreview } from "@/components/admin/hero/HeroSlidePreview";

function FallbackHero({ isAr }: { isAr: boolean }) {
  return (
    <section className="relative flex items-center justify-center overflow-hidden py-20 md:py-36" aria-label={isAr ? "القسم الرئيسي" : "Hero section"}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-accent/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.12),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--accent)/0.08),transparent_60%)]" />
      <div className="absolute top-20 end-[15%] h-64 w-64 rounded-full bg-primary/8 blur-3xl animate-pulse" />
      <div className="absolute bottom-10 start-[10%] h-48 w-48 rounded-full bg-accent/10 blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />
      <div className="container relative text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 backdrop-blur-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">
            {isAr ? "المنصة الأولى عالمياً" : "The World's #1 Culinary Platform"}
          </span>
        </div>
        <h1 className={cn("text-3xl font-bold sm:text-4xl md:text-5xl lg:text-6xl leading-tight", !isAr && "font-serif")}>
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
            ? "تنافس، تعلّم، وتواصل مع أفضل الطهاة حول العالم."
            : "Compete, learn, and connect with the finest chefs worldwide."}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" className="shadow-lg shadow-primary/25 text-base px-8" asChild>
            <Link to="/register">{isAr ? "ابدأ رحلتك" : "Start Your Journey"} <ArrowRight className="ms-2 h-4 w-4" /></Link>
          </Button>
          <Button size="lg" variant="outline" className="text-base px-8" asChild>
            <Link to="/competitions">{isAr ? "استكشف المسابقات" : "Explore Competitions"}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function HeroSlider() {
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
  });

  const next = useCallback(() => {
    if (slides.length > 0) setCurrent(c => (c + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    if (slides.length > 0) setCurrent(c => (c - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = slides[current]?.autoplay_interval ?? 6000;
    if (interval === 0) return;
    const timer = setInterval(next, interval);
    return () => clearInterval(timer);
  }, [next, slides.length, slides, current]);

  if (!slides.length) return <FallbackHero isAr={isAr} />;

  const slide = slides[current];

  // Localize the active slide for display
  const localizedSlide: HeroSlide = {
    ...slide,
    title: isAr && slide.title_ar ? slide.title_ar : slide.title,
    subtitle: isAr && slide.subtitle_ar ? slide.subtitle_ar : (slide.subtitle ?? null),
    badge_text: isAr && slide.badge_text_ar ? slide.badge_text_ar : (slide.badge_text ?? null),
    link_label: isAr && slide.link_label_ar ? slide.link_label_ar : (slide.link_label ?? null),
    cta_secondary_label: isAr && slide.cta_secondary_label_ar ? slide.cta_secondary_label_ar : (slide.cta_secondary_label ?? null),
  };

  return (
    <div className="relative" aria-label={isAr ? "القسم الرئيسي" : "Hero slider"} role="region">
      {/* Render active slide via template */}
      <div className="relative">
        <HeroSlidePreview slide={localizedSlide} />
      </div>

      {/* Navigation — only when multiple slides */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute start-2 sm:start-4 top-1/2 z-30 -translate-y-1/2 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-background/60 backdrop-blur-md text-foreground shadow-lg ring-1 ring-border/20 transition-all hover:bg-background/90 hover:scale-105 opacity-60 hover:opacity-100"
            aria-label={isAr ? "الشريحة السابقة" : "Previous slide"}
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <button
            onClick={next}
            className="absolute end-2 sm:end-4 top-1/2 z-30 -translate-y-1/2 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-background/60 backdrop-blur-md text-foreground shadow-lg ring-1 ring-border/20 transition-all hover:bg-background/90 hover:scale-105 opacity-60 hover:opacity-100"
            aria-label={isAr ? "الشريحة التالية" : "Next slide"}
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* Progress dots */}
          <div className="absolute bottom-3 inset-x-0 z-30 flex justify-center gap-2">
            {slides.map((_: HeroSlide, i: number) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  i === current
                    ? "w-8 bg-primary shadow-sm shadow-primary/30"
                    : "w-1.5 bg-foreground/25 hover:bg-foreground/40"
                )}
                aria-label={`${isAr ? "انتقل للشريحة" : "Go to slide"} ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
