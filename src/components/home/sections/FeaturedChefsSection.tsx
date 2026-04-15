import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChefHat, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDisplayName } from "@/lib/getDisplayName";
import { countryFlag } from "@/lib/countryFlag";
import { useAllCountries } from "@/hooks/useCountries";
import { memo, forwardRef } from "react";
import { useSectionConfig } from "@/components/home/SectionKeyContext";
import { SectionHeader } from "@/components/home/SectionHeader";
import { HorizontalScrollRow } from "@/components/home/HorizontalScrollRow";
import { CACHE } from "@/lib/queryConfig";

const RANK_COLORS = [
  "from-amber-400 to-yellow-500",
  "from-slate-300 to-slate-400",
  "from-orange-400 to-amber-600",
];

const FeaturedChefsSection = memo(forwardRef<HTMLElement>(function FeaturedChefsSection(_props, _ref) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: allCountries = [] } = useAllCountries();
  const config = useSectionConfig();

  const itemCount = config?.item_count || 8;
  const title = config
    ? (isAr ? config.title_ar || "أبرز الطهاة" : config.title_en || "Meet Our Top Chefs")
    : (isAr ? "أبرز الطهاة" : "Meet Our Top Chefs");
  const subtitle = config
    ? (isAr ? config.subtitle_ar || "" : config.subtitle_en || "")
    : (isAr ? "تعرّف على أمهر الطهاة في مجتمعنا" : "Discover the most talented chefs in our community");
  const showSubtitle = config?.show_subtitle ?? true;
  const showViewAll = config?.show_view_all ?? true;

  const { data: chefs = [], isLoading } = useQuery({
    queryKey: ["featured-chefs-home", itemCount],
    queryFn: async () => {
      const { data: ranked } = await supabase
        .from("chef_rankings")
        .select("user_id, total_points, gold_medals, silver_medals, bronze_medals, rank")
        .eq("ranking_period", "all_time")
        .order("total_points", { ascending: false })
        .limit(itemCount);

      if (ranked && ranked.length > 0) {
        const userIds = ranked.map((r) => r.user_id);
        const { data: profiles } = await supabase
          .from("profiles_public")
          .select("user_id, username, full_name, full_name_ar, display_name, display_name_ar, avatar_url, country_code, city, specialization, specialization_ar, is_verified, nationality")
          .in("user_id", userIds);
        const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
        return ranked.map((r) => ({ ...r, ...(profileMap.get(r.user_id) || {}), show_nationality: true }));
      }

      const { data: profiles } = await supabase
        .from("profiles_public")
        .select("user_id, username, full_name, full_name_ar, display_name, display_name_ar, avatar_url, country_code, city, specialization, specialization_ar, is_verified, nationality, account_type")
        .in("account_type", ["professional"])
        .order("is_verified", { ascending: false })
        .limit(itemCount);
      return (profiles || []).map((p) => ({ ...p, total_points: 0, gold_medals: 0, silver_medals: 0, bronze_medals: 0, show_nationality: true }));
    },
    staleTime: CACHE.long.staleTime,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  // Deduplicate by user_id
  const uniqueChefs = chefs.filter(
    (chef, index, self) => chef.user_id && self.findIndex((c) => c.user_id === chef.user_id) === index
  );

  if (!isLoading && uniqueChefs.length === 0) {
    return (
      <section dir={isAr ? "rtl" : "ltr"}>
        <div className="container">
          <SectionHeader icon={ChefHat} badge={isAr ? "طهاة مميزون" : "Featured Chefs"} title={title} subtitle={showSubtitle ? subtitle : undefined} viewAllHref={showViewAll ? "/community" : undefined} isAr={isAr} />
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">{isAr ? "انضم إلى مجتمعنا لتظهر هنا!" : "Join our community to be featured here!"}</div>
        </div>
      </section>
    );
  }

  return (
    <section dir={isAr ? "rtl" : "ltr"}>
      <div className="container">
        <SectionHeader icon={ChefHat} badge={isAr ? "طهاة مميزون" : "Featured Chefs"} title={title} subtitle={showSubtitle ? subtitle : undefined} viewAllHref={showViewAll ? "/community" : undefined} viewAllLabel={isAr ? "عرض الكل" : "View All"} isAr={isAr} />

        <HorizontalScrollRow isAr={isAr}>
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={`sk-${i}`} className="snap-start shrink-0 w-[38vw] sm:w-[28vw] md:w-[20vw] lg:w-[15vw] xl:w-[12vw]">
                  <div className="flex flex-col items-center gap-3 rounded-2xl bg-muted/30 p-5 animate-pulse">
                    <div className="h-16 w-16 rounded-full bg-muted" />
                    <div className="h-3 w-20 bg-muted rounded" />
                    <div className="h-2.5 w-14 bg-muted rounded" />
                  </div>
                </div>
              ))
            : uniqueChefs.map((chef, idx) => {
                const name = getDisplayName(chef, isAr);
                const spec = isAr && chef.specialization_ar ? chef.specialization_ar : chef.specialization;
                const initials = name ? name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() : "?";
                const hasMedals = chef.gold_medals > 0 || chef.silver_medals > 0 || chef.bronze_medals > 0;
                const countryObj = allCountries.find((c) => c.code === chef.country_code);
                const countryName = countryObj ? (isAr ? countryObj.name_ar || countryObj.name : countryObj.name) : "";
                const natCode = chef.show_nationality !== false ? chef.nationality : null;

                return (
                  <Link
                    key={chef.user_id}
                    to={chef.username ? `/${chef.username}` : `/profile/${chef.user_id}`}
                    className="group snap-start shrink-0 w-[38vw] sm:w-[28vw] md:w-[20vw] lg:w-[15vw] xl:w-[12vw] touch-manipulation"
                  >
                    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/30 bg-card p-5 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-0.5 h-full active:scale-[0.98] shadow-sm">
                      <div className="relative">
                        <Avatar className={cn("h-16 w-16 ring-2 ring-border/30 transition-all duration-300 group-hover:ring-primary/40 group-hover:scale-105", idx < 3 && "ring-primary/30")}>
                          <AvatarImage src={chef.avatar_url} alt={name} loading="lazy" />
                          <AvatarFallback className="bg-primary/10 text-foreground font-bold">{initials}</AvatarFallback>
                        </Avatar>
                        {chef.is_verified && (
                          <div className="absolute -bottom-0.5 -end-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                            <Star className="h-2.5 w-2.5 fill-current" />
                          </div>
                        )}
                        {idx < 3 && (
                          <div className={cn("absolute -top-1.5 -end-1.5 flex h-5.5 w-5.5 items-center justify-center rounded-full text-xs font-bold text-white shadow-md ring-2 ring-background bg-gradient-to-br", RANK_COLORS[idx])}>
                            {idx + 1}
                          </div>
                        )}
                        {natCode && <div className="absolute -bottom-0.5 -start-0.5 text-sm leading-none">{countryFlag(natCode)}</div>}
                      </div>
                      <div className="text-center min-w-0 w-full">
                        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{name || (isAr ? "طاهٍ" : "Chef")}</h3>
                        {spec && (
                          <p className="mt-0.5 text-xs text-muted-foreground truncate flex items-center justify-center gap-1">
                            <ChefHat className="h-3 w-3 shrink-0" />
                            {spec}
                          </p>
                        )}
                        {countryName && <p className="mt-0.5 text-xs text-muted-foreground/60 truncate">{countryFlag(chef.country_code)} {countryName}</p>}
                      </div>
                      {hasMedals && (
                        <div className="flex items-center justify-center gap-1.5 text-xs">
                          {chef.gold_medals > 0 && <span>🥇{chef.gold_medals}</span>}
                          {chef.silver_medals > 0 && <span>🥈{chef.silver_medals}</span>}
                          {chef.bronze_medals > 0 && <span>🥉{chef.bronze_medals}</span>}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
        </HorizontalScrollRow>
      </div>
    </section>
  );
}));

export default FeaturedChefsSection;
