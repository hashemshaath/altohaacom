import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChefHat, MapPin, Star, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDisplayName } from "@/lib/getDisplayName";
import { countryFlag } from "@/lib/countryFlag";
import { useAllCountries } from "@/hooks/useCountries";
import { forwardRef } from "react";
import { useSectionConfig } from "@/components/home/SectionKeyContext";

const FeaturedChefsSection = forwardRef<HTMLElement>(function FeaturedChefsSection(_props, ref) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: allCountries = [] } = useAllCountries();
  const config = useSectionConfig();

  const itemCount = config?.item_count || 6;
  const title = config
    ? (isAr ? config.title_ar || "أبرز الطهاة على المنصة" : config.title_en || "Meet Our Top Chefs")
    : (isAr ? "أبرز الطهاة على المنصة" : "Meet Our Top Chefs");
  const subtitle = config
    ? (isAr ? config.subtitle_ar || "" : config.subtitle_en || "")
    : (isAr ? "تعرّف على أمهر الطهاة في مجتمعنا العالمي" : "Discover the most talented chefs in our global community");
  const showTitle = config?.show_title ?? true;
  const showSubtitle = config?.show_subtitle ?? true;
  const showViewAll = config?.show_view_all ?? true;

  const { data: chefs = [] } = useQuery({
    queryKey: ["featured-chefs-home", itemCount],
    queryFn: async () => {
      const { data: ranked } = await supabase
        .from("chef_rankings")
        .select("user_id, total_points, gold_medals, silver_medals, bronze_medals, rank")
        .eq("ranking_period", "all_time")
        .order("total_points", { ascending: false })
        .limit(itemCount);

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
        .limit(itemCount);
      return (profiles || []).map((p: any) => ({
        ...p, total_points: p.loyalty_points || 0,
        gold_medals: 0, silver_medals: 0, bronze_medals: 0,
      }));
    },
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  if (chefs.length === 0) return null;

  // Determine grid columns based on item count
  const gridCols = itemCount <= 4 ? "lg:grid-cols-4" : itemCount <= 6 ? "lg:grid-cols-6" : "lg:grid-cols-6";

  return (
    <section ref={ref} dir={isAr ? "rtl" : "ltr"}>
      <div className="container">
        {showTitle && title && (
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3 px-3 py-1 text-xs font-semibold uppercase tracking-widest">
              {isAr ? "طهاة مميزون" : "Featured Chefs"}
            </Badge>
            <h2 className={cn("text-2xl font-bold sm:text-3xl lg:text-4xl text-foreground tracking-tight", !isAr && "font-serif")}>
              {title}
            </h2>
            {showSubtitle && subtitle && (
              <p className="mt-2 text-muted-foreground max-w-lg mx-auto">{subtitle}</p>
            )}
          </div>
        )}

        <div className={cn("grid gap-4 grid-cols-2 sm:grid-cols-3", gridCols)}>
          {chefs.map((chef: any, idx: number) => {
            const name = getDisplayName(chef, isAr);
            const spec = isAr && chef.specialization_ar ? chef.specialization_ar : chef.specialization;
            const initials = name ? name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() : "?";
            const hasMedals = chef.gold_medals > 0 || chef.silver_medals > 0 || chef.bronze_medals > 0;
            const countryObj = allCountries.find((c: any) => c.code === chef.country_code);
            const countryName = countryObj ? (isAr ? countryObj.name_ar || countryObj.name : countryObj.name) : "";
            const natCode = chef.show_nationality !== false ? chef.nationality : null;
            const natObj = natCode ? allCountries.find((c: any) => c.code === natCode) : null;
            const natName = natObj ? (isAr ? natObj.name_ar || natObj.name : natObj.name) : "";

            return (
              <Link
                key={chef.user_id || idx}
                to={chef.username ? `/${chef.username}` : `/profile/${chef.user_id}`}
                className="group flex flex-col items-center gap-2.5 rounded-2xl border border-border/30 bg-card/50 backdrop-blur-sm p-5 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:bg-card hover:-translate-y-1"
              >
                <div className="relative">
                  <Avatar className={cn(
                    "h-16 w-16 sm:h-20 sm:w-20 ring-2 ring-border/40 transition-all duration-300 group-hover:ring-primary/40 group-hover:scale-105",
                    idx < 3 && "ring-primary/30"
                  )}>
                    <AvatarImage src={chef.avatar_url} alt={name} loading="lazy" />
                    <AvatarFallback className="bg-muted text-muted-foreground font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  {chef.is_verified && (
                    <div className="absolute -bottom-0.5 -end-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                      <Star className="h-2.5 w-2.5 fill-current" />
                    </div>
                  )}
                  {idx < 3 && (
                    <div className={cn(
                      "absolute -top-1.5 -end-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold shadow-sm ring-2 ring-background",
                      idx === 0 && "bg-chart-4 text-chart-4-foreground",
                      idx === 1 && "bg-muted-foreground/70 text-background",
                      idx === 2 && "bg-chart-3 text-chart-3-foreground"
                    )}>
                      {idx + 1}
                    </div>
                  )}
                  {natCode && (
                    <div className="absolute -bottom-0.5 -start-0.5 text-base leading-none" title={natName}>
                      {countryFlag(natCode)}
                    </div>
                  )}
                </div>
                <div className="text-center min-w-0 w-full">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {name || (isAr ? "طاهٍ" : "Chef")}
                  </h3>
                  {spec && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground truncate flex items-center justify-center gap-1">
                      <ChefHat className="h-3 w-3 shrink-0" />
                      {spec}
                    </p>
                  )}
                  {countryName && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground/50 truncate">
                      {countryFlag(chef.country_code)} {countryName}
                    </p>
                  )}
                </div>
                {hasMedals && (
                  <div className="flex items-center justify-center gap-2 text-[11px]">
                    {chef.gold_medals > 0 && <span className="text-chart-4">🥇{chef.gold_medals}</span>}
                    {chef.silver_medals > 0 && <span className="text-muted-foreground">🥈{chef.silver_medals}</span>}
                    {chef.bronze_medals > 0 && <span className="text-chart-3">🥉{chef.bronze_medals}</span>}
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {showViewAll && (
          <div className="mt-10 text-center">
            <Button variant="outline" className="rounded-xl" asChild>
              <Link to="/community">
                {isAr ? "عرض جميع الطهاة" : "View All Chefs"}
                <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
});

export default FeaturedChefsSection;
