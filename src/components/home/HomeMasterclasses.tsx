import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { SafeImage } from "@/components/ui/SafeImage";
import { ROUTES } from "@/config/routes";
import { useIsAr } from "@/hooks/useIsAr";
import { useState, useMemo, memo, forwardRef } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "./SectionHeader";
import { FilterChip } from "./FilterChip";
import { useSectionConfig } from "@/components/home/SectionKeyContext";
import { HorizontalScrollRow } from "./HorizontalScrollRow";
import { CACHE } from "@/lib/queryConfig";

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

export const HomeMasterclasses = memo(forwardRef<HTMLElement>(function HomeMasterclasses(_props, _ref) {
  const isAr = useIsAr();
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

  const { data: classes = [] , isLoading, isError } = useQuery({
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
    staleTime: CACHE.long.staleTime,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  const categories = useMemo(() => {
    const s = new Set<string>();
    classes.forEach((c) => { if (c.category) s.add(c.category); });
    return Array.from(s);
  }, [classes]);

  const levels = useMemo(() => {
    const s = new Set<string>();
    classes.forEach((c) => { if (c.level) s.add(c.level); });
    return Array.from(s);
  }, [classes]);

  const filtered = useMemo(() => {
    let result = classes;
    if (levelFilter) result = result.filter((c) => c.level === levelFilter);
    if (catFilter) result = result.filter((c) => c.category === catFilter);
    return result;
  }, [classes, levelFilter, catFilter]);

  if (classes.length === 0) return null;

  if (isLoading) return (

    <section className="container py-6">

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">

        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}

      </div>

    </section>

  );


  if (isError) return null;


  return (
    <section className="container" aria-labelledby="masterclasses-heading" dir={isAr ? "rtl" : "ltr"}>
      <SectionHeader
        icon={GraduationCap}
        badge={isAr ? "دروس متقدمة" : "Masterclasses"}
        title={sectionTitle}
        subtitle={sectionSubtitle}
        dataSource="masterclasses"
        itemCount={filtered.length}
        viewAllHref={showViewAll ? ROUTES.masterclasses : undefined}
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
                  count={classes.filter((c) => c.level === l).length}
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
                  count={classes.filter((mc) => mc.category === c).length}
                  onClick={() => setCatFilter(catFilter === c ? null : c)}
                />
              );
            })}
          </>
        ) : undefined}
      />

      {filtered.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          {isAr ? "لا توجد دروس بهذا الفلتر" : "No classes match this filter"}
        </div>
      ) : (
        <HorizontalScrollRow isAr={isAr}>
          {filtered.map((mc) => {
            const title = isAr && mc.title_ar ? mc.title_ar : mc.title;
            const levelLabel = LEVEL_LABELS[mc.level];

            return (
              <Link key={mc.id} to={ROUTES.masterclass(mc.id)} className="group block snap-start shrink-0 w-[64vw] sm:w-[40vw] md:w-[30vw] lg:w-[22vw] xl:w-[18vw] touch-manipulation">
                <Card className="card-flex overflow-hidden border-border/40 rounded-2xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/20 active:scale-[0.98]">
                  <div className="card-image-wrap" style={{ aspectRatio: "16 / 10" }}>
                    {mc.cover_image_url ? (
                      <SafeImage src={mc.cover_image_url} alt={title} width={400} height={250} className="card-image transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="card-image flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/5">
                        <GraduationCap className="h-10 w-10 text-primary/30" />
                      </div>
                    )}
                    <div className="absolute end-2 top-2 flex gap-1.5 flex-wrap justify-end">
                      {mc.is_free && (
                        <Badge className="bg-chart-2/90 text-xs shadow-sm">
                          {isAr ? "مجاني" : "Free"}
                        </Badge>
                      )}
                      {levelLabel && (
                        <Badge variant="outline" className={cn("text-xs border", levelLabel.color)}>
                          {isAr ? levelLabel.ar : levelLabel.en}
                        </Badge>
                      )}
                    </div>
                    {!mc.is_free && mc.price && (
                      <div className="absolute start-2 bottom-2">
                        <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-xs font-bold shadow-sm">
                          {mc.currency || "$"} {mc.price}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="card-body-grow flex flex-col p-3">
                    <div className="mb-1.5">
                      {mc.category && <Badge variant="outline" className="text-xs mb-1">{(() => {
                        const cl = MC_CAT_LABELS[mc.category.toLowerCase()];
                        return cl ? (isAr ? cl.ar : cl.en) : mc.category;
                      })()}</Badge>}
                      <h3 className="clamp-2 typo-card-title text-foreground group-hover:text-primary transition-colors leading-snug">{title}</h3>
                    </div>
                    <div className="card-cta-bottom flex items-center gap-3 typo-card-meta text-muted-foreground">
                      {mc.duration_hours && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-primary/50" />
                          {mc.duration_hours} {isAr ? "ساعة" : "hrs"}
                        </span>
                      )}
                      {mc.status === "upcoming" && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          {isAr ? "قريباً" : "Coming Soon"}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </HorizontalScrollRow>
      )}
    </section>
  );
}));
