import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Clock, GraduationCap } from "lucide-react";
import { SectionReveal } from "@/components/ui/section-reveal";
import { cn } from "@/lib/utils";
import { SectionHeader } from "./SectionHeader";
import { FilterChip } from "./FilterChip";
import { useSectionConfig } from "@/components/home/SectionKeyContext";

const LEVEL_LABELS: Record<string, { en: string; ar: string; color: string }> = {
  beginner: { en: "Beginner", ar: "مبتدئ", color: "bg-chart-2/10 text-chart-2 border-chart-2/20" },
  intermediate: { en: "Intermediate", ar: "متوسط", color: "bg-chart-4/10 text-chart-4 border-chart-4/20" },
  advanced: { en: "Advanced", ar: "متقدم", color: "bg-destructive/10 text-destructive border-destructive/20" },
  all_levels: { en: "All Levels", ar: "جميع المستويات", color: "bg-primary/10 text-primary border-primary/20" },
};

const MC_CAT_LABELS: Record<string, { en: string; ar: string }> = {
  pastry: { en: "Pastry", ar: "حلويات" },
  cuisine: { en: "Cuisine", ar: "طبخ" },
  baking: { en: "Baking", ar: "خبز" },
  sushi: { en: "Sushi", ar: "سوشي" },
  chocolate: { en: "Chocolate", ar: "شوكولاتة" },
  plating: { en: "Plating", ar: "تقديم" },
  butchery: { en: "Butchery", ar: "جزارة" },
  beverages: { en: "Beverages", ar: "مشروبات" },
  "culinary arts": { en: "Culinary Arts", ar: "فنون الطهي" },
  "regional cuisine": { en: "Regional Cuisine", ar: "مطبخ إقليمي" },
  "food media": { en: "Food Media", ar: "إعلام غذائي" },
};

export function HomeMasterclasses() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [levelFilter, setLevelFilter] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const sectionConfig = useSectionConfig();

  const itemCount = sectionConfig?.item_count || 8;
  const showFilters = sectionConfig?.show_filters ?? true;
  const showViewAll = sectionConfig?.show_view_all ?? true;
  const sectionTitle = sectionConfig
    ? (isAr ? sectionConfig.title_ar || "طوّر مهاراتك مع الخبراء" : sectionConfig.title_en || "Level Up with Expert-Led Classes")
    : (isAr ? "طوّر مهاراتك مع الخبراء" : "Level Up with Expert-Led Classes");
  const sectionSubtitle = sectionConfig
    ? (isAr ? sectionConfig.subtitle_ar || "" : sectionConfig.subtitle_en || "")
    : (isAr ? "تعلّم من أمهر الطهاة واحترف فنون الطهي" : "Learn from top chefs and master culinary arts");

  const { data: classes = [] } = useQuery({
    queryKey: ["home-masterclasses", itemCount],
    queryFn: async () => {
      const { data } = await supabase
        .from("masterclasses")
        .select("id, title, title_ar, cover_image_url, category, level, price, currency, is_free, start_date, duration_hours, status")
        .in("status", ["published", "upcoming"])
        .order("start_date", { ascending: true, nullsFirst: false })
        .limit(itemCount);
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });

  const categories = useMemo(() => {
    const s = new Set<string>();
    classes.forEach((c: any) => { if (c.category) s.add(c.category); });
    return Array.from(s);
  }, [classes]);

  const levels = useMemo(() => {
    const s = new Set<string>();
    classes.forEach((c: any) => { if (c.level) s.add(c.level); });
    return Array.from(s);
  }, [classes]);

  const filtered = useMemo(() => {
    let result = classes;
    if (levelFilter) result = result.filter((c: any) => c.level === levelFilter);
    if (catFilter) result = result.filter((c: any) => c.category === catFilter);
    return result;
  }, [classes, levelFilter, catFilter]);

  if (classes.length === 0) return null;

  return (
    <section className="container" aria-labelledby="masterclasses-heading" dir={isAr ? "rtl" : "ltr"}>
      <SectionHeader
        icon={GraduationCap}
        badge={isAr ? "دروس متقدمة" : "Masterclasses"}
        title={sectionTitle}
        subtitle={sectionSubtitle}
        dataSource="masterclasses"
        itemCount={filtered.length}
        viewAllHref={showViewAll ? "/masterclasses" : undefined}
        isAr={isAr}
        filters={showFilters && (levels.length > 1 || categories.length > 1) ? (
          <>
            <FilterChip label={isAr ? "الكل" : "All"} active={!levelFilter && !catFilter} count={classes.length} onClick={() => { setLevelFilter(null); setCatFilter(null); }} />
            {levels.map(l => {
              const label = LEVEL_LABELS[l];
              return (
                <FilterChip
                  key={l}
                  label={label ? (isAr ? label.ar : label.en) : l}
                  active={levelFilter === l}
                  count={classes.filter((c: any) => c.level === l).length}
                  onClick={() => setLevelFilter(levelFilter === l ? null : l)}
                />
              );
            })}
            {categories.length > 1 && categories.map(c => {
              const cl = MC_CAT_LABELS[c.toLowerCase()];
              return (
                <FilterChip
                  key={c}
                  label={cl ? (isAr ? cl.ar : cl.en) : c}
                  active={catFilter === c}
                  count={classes.filter((mc: any) => mc.category === c).length}
                  onClick={() => setCatFilter(catFilter === c ? null : c)}
                />
              );
            })}
          </>
        ) : undefined}
      />

      <SectionReveal delay={80}>
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {isAr ? "لا توجد دروس بهذا الفلتر" : "No classes match this filter"}
          </div>
        ) : (
          <div
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0"
            dir={isAr ? "rtl" : "ltr"}
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {filtered.map((mc: any) => {
              const title = isAr && mc.title_ar ? mc.title_ar : mc.title;
              const levelLabel = LEVEL_LABELS[mc.level];

              return (
                <Link key={mc.id} to={`/masterclasses/${mc.id}`} className="group block snap-start min-w-[15rem] shrink-0 sm:min-w-0 sm:shrink touch-manipulation">
                  <Card className="h-full overflow-hidden border-border/40 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20 active:scale-[0.98]">
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                      {mc.cover_image_url ? (
                        <img src={mc.cover_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 will-change-transform" loading="lazy" decoding="async" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/5">
                          <GraduationCap className="h-10 w-10 text-primary/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute end-2 top-2 flex gap-1.5 flex-wrap justify-end">
                        {mc.is_free && (
                          <Badge className="bg-chart-2/90 text-[10px] shadow-sm">
                            {isAr ? "مجاني" : "Free"}
                          </Badge>
                        )}
                        {levelLabel && (
                          <Badge variant="outline" className={cn("text-[10px] border", levelLabel.color)}>
                            {isAr ? levelLabel.ar : levelLabel.en}
                          </Badge>
                        )}
                      </div>
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
                        {mc.category && <Badge variant="outline" className="text-[10px] mb-1">{(() => {
                          const cl = MC_CAT_LABELS[mc.category.toLowerCase()];
                          return cl ? (isAr ? cl.ar : cl.en) : mc.category;
                        })()}</Badge>}
                        <h3 className="line-clamp-2 text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug">{title}</h3>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        {mc.duration_hours && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-primary/50" />
                            {mc.duration_hours} {isAr ? "ساعة" : "hrs"}
                          </span>
                        )}
                        {mc.status === "upcoming" && (
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                            {isAr ? "قريباً" : "Coming Soon"}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </SectionReveal>
    </section>
  );
}
