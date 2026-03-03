import { forwardRef, useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Quote, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "./SectionHeader";
import { useSectionConfig } from "@/components/home/SectionKeyContext";

export const HomeTestimonials = forwardRef<HTMLDivElement>(function HomeTestimonials(_props, ref) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [current, setCurrent] = useState(0);
  const sectionConfig = useSectionConfig();

  const itemCount = sectionConfig?.item_count || 10;
  const sectionTitle = sectionConfig
    ? (isAr ? sectionConfig.title_ar || "ماذا يقول أعضاؤنا" : sectionConfig.title_en || "What Our Members Say")
    : (isAr ? "ماذا يقول أعضاؤنا" : "What Our Members Say");

  const { data: testimonials = [] } = useQuery({
    queryKey: ["home-testimonials", itemCount],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("testimonials")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(itemCount);
      return (data as any[]) || [];
    },
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const next = useCallback(() => setCurrent(c => (c + 1) % Math.max(testimonials.length, 1)), [testimonials.length]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + testimonials.length) % Math.max(testimonials.length, 1)), [testimonials.length]);

  const touchStart = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { diff > 0 ? (isAr ? prev() : next()) : (isAr ? next() : prev()); }
    touchStart.current = null;
  };

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const interval = setInterval(next, 6000);
    return () => clearInterval(interval);
  }, [next, testimonials.length]);

  if (testimonials.length === 0) return null;

  const t = testimonials[current];
  const name = isAr && t.name_ar ? t.name_ar : t.name;
  const role = isAr && t.role_ar ? t.role_ar : t.role;
  const quote = isAr && t.quote_ar ? t.quote_ar : t.quote;
  const initials = name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div ref={ref}>
      <section aria-label={isAr ? "آراء المستخدمين" : "Testimonials"} dir={isAr ? "rtl" : "ltr"}>
        <div className="container max-w-3xl">
          <SectionHeader
            icon={Quote}
            badge={isAr ? "آراء المجتمع" : "Community Voices"}
            title={sectionTitle}
            dataSource="testimonials"
            itemCount={testimonials.length}
            isAr={isAr}
            className="text-center"
          />

          <Card className="border-border/40 shadow-lg relative overflow-hidden touch-pan-y rounded-2xl bg-gradient-to-br from-card to-card/80" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <div className="absolute top-4 start-4 opacity-[0.04]">
              <Quote className="h-24 w-24" />
            </div>
            <div className="absolute bottom-4 end-4 opacity-[0.04] rotate-180">
              <Quote className="h-16 w-16" />
            </div>
            <CardContent className="p-5 sm:p-8 md:p-10 text-center relative">
              {t.rating && (
                <div className="flex items-center justify-center gap-0.5 mb-5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn("h-4 w-4", i < t.rating ? "text-chart-4 fill-chart-4" : "text-muted-foreground/20")} />
                  ))}
                </div>
              )}

              <p className="text-base sm:text-lg md:text-xl leading-relaxed text-foreground/85 mb-6 italic">
                &ldquo;{quote}&rdquo;
              </p>

              <div className="flex items-center justify-center gap-3">
                <Avatar className="h-12 w-12 ring-2 ring-primary/15 shadow-md">
                  {t.avatar_url && <AvatarImage src={t.avatar_url} alt={name} />}
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">{initials}</AvatarFallback>
                </Avatar>
                <div className="text-start">
                  <p className="text-sm font-bold text-foreground">{name}</p>
                  {role && <p className="text-xs text-muted-foreground">{role}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {testimonials.length > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={prev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex gap-1.5">
                {testimonials.map((_: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      i === current ? "w-6 bg-primary" : "w-2 bg-muted-foreground/20 hover:bg-muted-foreground/40"
                    )}
                  />
                ))}
              </div>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={next}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
});
