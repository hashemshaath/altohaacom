import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getDisplayName } from "@/lib/getDisplayName";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Award, ChefHat, MapPin, Star, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionReveal } from "@/components/ui/section-reveal";
import { countryFlag } from "@/lib/countryFlag";
import { useAllCountries } from "@/hooks/useCountries";
import { localizeCity } from "@/lib/localizeLocation";
import { SectionHeader } from "./SectionHeader";
import { FilterChip } from "./FilterChip";

export function FeaturedChefs() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: allCountries = [] } = useAllCountries();
  const [specFilter, setSpecFilter] = useState<string | null>(null);

  const { data: chefs = [] } = useQuery({
    queryKey: ["featured-chefs-home"],
    queryFn: async () => {
      const { data: ranked } = await supabase
        .from("chef_rankings")
        .select("user_id, total_points, gold_medals, silver_medals, bronze_medals, rank")
        .eq("ranking_period", "all_time")
        .order("total_points", { ascending: false })
        .limit(8);

      if (ranked && ranked.length > 0) {
        const userIds = ranked.map((r: any) => r.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, full_name, full_name_ar, display_name, display_name_ar, avatar_url, country_code, city, specialization, specialization_ar, is_verified, nationality, show_nationality")
          .in("user_id", userIds);
        const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
        return ranked.map((r: any) => ({ ...r, ...(profileMap.get(r.user_id) || {}) }));
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, full_name_ar, display_name, display_name_ar, avatar_url, country_code, city, specialization, specialization_ar, is_verified, loyalty_points, nationality, show_nationality")
        .eq("is_verified", true)
        .order("loyalty_points", { ascending: false, nullsFirst: false })
        .limit(8);
      return (profiles || []).map((p: any) => ({
        ...p,
        total_points: p.loyalty_points || 0,
        gold_medals: 0, silver_medals: 0, bronze_medals: 0,
      }));
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });

  // Extract unique specializations for filter
  const specializations = useMemo(() => {
    const specs = new Set<string>();
    chefs.forEach((c: any) => {
      const s = isAr && c.specialization_ar ? c.specialization_ar : c.specialization;
      if (s) specs.add(s);
    });
    return Array.from(specs).slice(0, 5);
  }, [chefs, isAr]);

  const filteredChefs = useMemo(() => {
    if (!specFilter) return chefs;
    return chefs.filter((c: any) => {
      const s = isAr && c.specialization_ar ? c.specialization_ar : c.specialization;
      return s === specFilter;
    });
  }, [chefs, specFilter, isAr]);

  if (chefs.length === 0) return null;

  return (
    <section className="relative overflow-hidden py-8 md:py-12" aria-labelledby="featured-chefs-heading">
      <div className="absolute inset-0 bg-muted/20" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.03),transparent_60%)]" />
      <div className="container relative" dir={isAr ? "rtl" : "ltr"}>
        <SectionHeader
          icon={Award}
          badge={isAr ? "طهاة مميزون" : "Featured Chefs"}
          title={isAr ? "أبرز الطهاة على المنصة" : "Top Chefs on the Platform"}
          subtitle={isAr ? "تعرّف على أمهر الطهاة المسجلين في مجتمعنا العالمي" : "Meet the most skilled chefs in our global community"}
          dataSource={isAr ? "chef_rankings + profiles" : "chef_rankings + profiles"}
          itemCount={filteredChefs.length}
          viewAllHref="/community"
          viewAllLabel={isAr ? "عرض الكل" : "View All"}
          isAr={isAr}
          filters={specializations.length > 1 ? (
            <>
              <FilterChip
                label={isAr ? "الكل" : "All"}
                active={!specFilter}
                count={chefs.length}
                onClick={() => setSpecFilter(null)}
              />
              {specializations.map(s => (
                <FilterChip
                  key={s}
                  label={s}
                  active={specFilter === s}
                  count={chefs.filter((c: any) => (isAr && c.specialization_ar ? c.specialization_ar : c.specialization) === s).length}
                  onClick={() => setSpecFilter(specFilter === s ? null : s)}
                />
              ))}
            </>
          ) : undefined}
        />

        <SectionReveal delay={80}>
          <div
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2 sm:grid sm:grid-cols-3 md:grid-cols-4 sm:overflow-visible sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0"
            dir={isAr ? "rtl" : "ltr"}
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {filteredChefs.map((chef: any, idx: number) => {
              const name = getDisplayName(chef, isAr);
              const spec = isAr && chef.specialization_ar ? chef.specialization_ar : chef.specialization;
              const initials = name ? name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() : "?";
              const hasMedals = chef.gold_medals > 0 || chef.silver_medals > 0 || chef.bronze_medals > 0;
              const nationalityEmoji = chef.show_nationality !== false && chef.nationality ? countryFlag(chef.nationality) : "";
              const countryObj = allCountries.find((c: any) => c.code === chef.country_code);
              const countryName = countryObj ? (isAr ? countryObj.name_ar || countryObj.name : countryObj.name) : chef.country_code;
              const locationParts = [localizeCity(chef.city || "", isAr), countryName].filter(Boolean).join(", ");
              const isTop3 = idx < 3 && chef.rank;

              return (
                <Link
                  key={chef.user_id || idx}
                  to={chef.username ? `/${chef.username}` : `/profile/${chef.user_id}`}
                  className="group block snap-start min-w-[11rem] shrink-0 sm:min-w-0 sm:shrink"
                >
                  <Card className="h-full border-border/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1.5 hover:border-primary/20 overflow-hidden active:scale-[0.98] rounded-2xl">
                    <CardContent className="p-3 sm:p-4 text-center">
                      <div className="relative mx-auto mb-3 w-fit">
                        <Avatar className={cn(
                          "h-16 w-16 sm:h-16 sm:w-16 shadow-md transition-all duration-300 group-hover:scale-110",
                          isTop3 ? "ring-2 ring-chart-4/40" : "ring-2 ring-primary/15",
                        )}>
                          <AvatarImage src={chef.avatar_url} alt={name} loading="lazy" />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">{initials}</AvatarFallback>
                        </Avatar>
                        {chef.is_verified && (
                          <div className="absolute -bottom-1 -end-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                            <Star className="h-2.5 w-2.5 fill-current" />
                          </div>
                        )}
                        {nationalityEmoji && (
                          <span className="absolute -top-1 -start-1 text-sm leading-none drop-shadow">{nationalityEmoji}</span>
                        )}
                        {isTop3 && (
                          <div className="absolute -top-1.5 -end-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-chart-4 text-chart-4-foreground text-[9px] font-bold shadow-sm">
                            #{idx + 1}
                          </div>
                        )}
                      </div>
                      <h3 className="text-sm font-bold truncate text-foreground group-hover:text-primary transition-colors">
                        {name || (isAr ? "طاهٍ" : "Chef")}
                      </h3>
                      {spec && (
                        <div className="mt-0.5 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                          <ChefHat className="h-3 w-3 shrink-0" />
                          <span className="truncate">{spec}</span>
                        </div>
                      )}
                      {chef.country_code && (
                        <div className="mt-0.5 flex items-center justify-center gap-1 text-[10px] text-muted-foreground/70">
                          <MapPin className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate">{countryFlag(chef.country_code)} {locationParts}</span>
                        </div>
                      )}
                      {hasMedals && (
                        <div className="mt-2 flex items-center justify-center gap-2.5 text-[11px]">
                          {chef.gold_medals > 0 && <span className="flex items-center gap-0.5 text-chart-4"><Trophy className="h-3 w-3" />{chef.gold_medals}</span>}
                          {chef.silver_medals > 0 && <span className="flex items-center gap-0.5 text-muted-foreground"><Trophy className="h-3 w-3" />{chef.silver_medals}</span>}
                          {chef.bronze_medals > 0 && <span className="flex items-center gap-0.5 text-chart-3"><Trophy className="h-3 w-3" />{chef.bronze_medals}</span>}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
