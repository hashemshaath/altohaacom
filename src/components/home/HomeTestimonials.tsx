import { forwardRef, useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Quote, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { SectionReveal } from "@/components/ui/section-reveal";
import { cn } from "@/lib/utils";

export const HomeTestimonials = forwardRef<HTMLDivElement>(function HomeTestimonials(_props, ref) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [current, setCurrent] = useState(0);

  const { data: testimonials = [] } = useQuery({
    queryKey: ["home-testimonials"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("testimonials")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(10);
      return (data as any[]) || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const next = useCallback(() => setCurrent(c => (c + 1) % Math.max(testimonials.length, 1)), [testimonials.length]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + testimonials.length) % Math.max(testimonials.length, 1)), [testimonials.length]);

  // Auto-rotate
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
      <section className="py-10 md:py-14" aria-label={isAr ? "آراء المستخدمين" : "Testimonials"}>
        <div className="container max-w-3xl">
          <SectionReveal>
            <div className="text-center mb-8">
              <Badge variant="secondary" className="mb-3">
                <Quote className="me-1 h-3 w-3" />
                {isAr ? "آراء المجتمع" : "Community Voices"}
              </Badge>
              <h2 className="text-2xl font-bold sm:text-3xl">
                {isAr ? "ماذا يقول أعضاؤنا" : "What Our Members Say"}
              </h2>
            </div>
          </SectionReveal>

          <SectionReveal delay={100}>
            <Card className="border-border/40 shadow-lg relative overflow-hidden">
              <div className="absolute top-4 start-4 opacity-5">
                <Quote className="h-20 w-20" />
              </div>
              <CardContent className="p-8 sm:p-10 text-center relative">
                <p className="text-lg sm:text-xl leading-relaxed text-foreground/90 mb-6 italic">
                  &ldquo;{quote}&rdquo;
                </p>

                {t.rating && (
                  <div className="flex items-center justify-center gap-0.5 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={cn("h-4 w-4", i < t.rating ? "text-chart-4 fill-chart-4" : "text-muted-foreground/20")} />
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-center gap-3">
                  <Avatar className="h-11 w-11 ring-2 ring-primary/10">
                    {t.avatar_url && <AvatarImage src={t.avatar_url} alt={name} />}
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="text-start">
                    <p className="text-sm font-semibold">{name}</p>
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
          </SectionReveal>
        </div>
      </section>
    </div>
  );
});
