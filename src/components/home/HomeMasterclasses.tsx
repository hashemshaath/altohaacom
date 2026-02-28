import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, BookOpen, Clock, GraduationCap, Users } from "lucide-react";
import { SectionReveal } from "@/components/ui/section-reveal";
import { cn } from "@/lib/utils";

const LEVEL_LABELS: Record<string, { en: string; ar: string }> = {
  beginner: { en: "Beginner", ar: "مبتدئ" },
  intermediate: { en: "Intermediate", ar: "متوسط" },
  advanced: { en: "Advanced", ar: "متقدم" },
  all_levels: { en: "All Levels", ar: "جميع المستويات" },
};

export function HomeMasterclasses() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: classes = [] } = useQuery({
    queryKey: ["home-masterclasses"],
    queryFn: async () => {
      const { data } = await supabase
        .from("masterclasses")
        .select("id, title, title_ar, cover_image_url, category, level, price, currency, is_free, start_date, duration_hours, status")
        .in("status", ["published", "upcoming"])
        .order("start_date", { ascending: true, nullsFirst: false })
        .limit(4);
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });

  if (classes.length === 0) return null;

  return (
    <section className="container py-8 md:py-12" aria-labelledby="masterclasses-heading">
      <SectionReveal>
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="secondary" className="mb-1.5 gap-1">
              <GraduationCap className="h-3 w-3" />
              {isAr ? "دروس متقدمة" : "Masterclasses"}
            </Badge>
            <h2 id="masterclasses-heading" className={cn("text-xl font-bold sm:text-2xl text-foreground tracking-tight", !isAr && "font-serif")}>
              {isAr ? "طوّر مهاراتك مع الخبراء" : "Level Up with Expert-Led Classes"}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {isAr ? "تعلّم من أمهر الطهاة واحترف فنون الطهي" : "Learn from top chefs and master culinary arts"}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/masterclasses">
              {isAr ? "عرض الكل" : "View All"}
              <ArrowRight className="ms-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </SectionReveal>

      <SectionReveal delay={80}>
      {/* Horizontal scroll on mobile, responsive grid on desktop */}
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0" dir={isAr ? "rtl" : "ltr"}>
        {classes.map((mc: any) => {
          const title = isAr && mc.title_ar ? mc.title_ar : mc.title;
          const levelLabel = LEVEL_LABELS[mc.level];

          return (
            <Link key={mc.id} to={`/masterclasses/${mc.id}`} className="group block snap-start min-w-[14rem] shrink-0 sm:min-w-0 sm:shrink">
              <Card className="h-full overflow-hidden border-border/40 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20">
                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                  {mc.cover_image_url ? (
                    <img src={mc.cover_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/5">
                      <GraduationCap className="h-10 w-10 text-primary/30" />
                    </div>
                  )}
                  {/* Hover gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute end-2 top-2 flex gap-1.5">
                    {mc.is_free && (
                      <Badge className="bg-chart-2/90 text-[10px] shadow-sm">
                        {isAr ? "مجاني" : "Free"}
                      </Badge>
                    )}
                    {levelLabel && (
                      <Badge variant="secondary" className="text-[10px]">
                        {isAr ? levelLabel.ar : levelLabel.en}
                      </Badge>
                    )}
                  </div>
                  {/* Price badge at bottom */}
                  {!mc.is_free && mc.price && (
                    <div className="absolute start-2 bottom-2">
                      <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-[10px] font-bold shadow-sm">
                        {mc.currency || "$"} {mc.price}
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <div className="mb-1.5">
                    {mc.category && <Badge variant="outline" className="text-[10px] mb-1">{mc.category}</Badge>}
                    <h3 className="line-clamp-2 text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug">{title}</h3>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    {mc.duration_hours && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-primary/50" />
                        {mc.duration_hours} {isAr ? "ساعة" : "hrs"}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
      </SectionReveal>
    </section>
  );
}
