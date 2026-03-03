import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
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
        <div className="text-center space-y-4 px-4">
          <h1 className="text-4xl font-serif font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {isAr ? "مجتمع الطهاة العالمي" : "The Global Culinary Community"}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            {isAr ? "انضم إلى أفضل الطهاة والحكام والمنظمين حول العالم" : "Join the finest chefs, judges, and organizers worldwide"}
          </p>
          <Button size="lg" className="rounded-xl mt-2" asChild>
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
        {/* Background Image */}
        {slides.map((s, idx) => (
          <div
            key={s.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000 ease-in-out",
              idx === current ? "opacity-100" : "opacity-0"
            )}
          >
            <img
              src={s.image_url}
              alt=""
              className="h-full w-full object-cover"
              loading={idx === 0 ? "eager" : "lazy"}
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"
              style={{ opacity: (s.overlay_opacity || 50) / 100 }}
            />
          </div>
        ))}

        {/* Content */}
        <div className="container relative flex h-full min-h-[55vh] sm:min-h-[65vh] lg:min-h-[75vh] items-end pb-16 sm:pb-20 lg:pb-24">
          <div className="max-w-2xl space-y-4 animate-fade-in">
            <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-tight">
              {isAr ? slide.title_ar || slide.title : slide.title}
            </h1>
            {(slide.subtitle || slide.subtitle_ar) && (
              <p className="text-base text-muted-foreground sm:text-lg max-w-lg leading-relaxed">
                {isAr ? slide.subtitle_ar || slide.subtitle : slide.subtitle}
              </p>
            )}
            {slide.link_url && (
              <Button size="lg" className="rounded-xl shadow-md" asChild>
                <Link to={slide.link_url}>
                  {isAr ? slide.link_label_ar || slide.link_label || "اكتشف المزيد" : slide.link_label || "Learn More"}
                  <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Navigation */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute start-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border/50 text-foreground shadow-sm transition-all hover:bg-background hover:shadow-md"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
            </button>
            <button
              onClick={next}
              className="absolute end-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border/50 text-foreground shadow-sm transition-all hover:bg-background hover:shadow-md"
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5 rtl:rotate-180" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-6 start-1/2 -translate-x-1/2 flex gap-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrent(idx)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-500",
                    idx === current ? "w-8 bg-primary" : "w-1.5 bg-foreground/20 hover:bg-foreground/40"
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
