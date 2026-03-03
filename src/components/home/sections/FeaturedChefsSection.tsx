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
import { localizeCity } from "@/lib/localizeLocation";
import { useAllCountries } from "@/hooks/useCountries";

export default function FeaturedChefsSection() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: allCountries = [] } = useAllCountries();

  const { data: chefs = [] } = useQuery({
    queryKey: ["featured-chefs-home"],
    queryFn: async () => {
      const { data: ranked } = await supabase
        .from("chef_rankings")
        .select("user_id, total_points, gold_medals, silver_medals, bronze_medals, rank")
        .eq("ranking_period", "all_time")
        .order("total_points", { ascending: false })
        .limit(6);

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
        .limit(6);
      return (profiles || []).map((p: any) => ({
        ...p, total_points: p.loyalty_points || 0,
        gold_medals: 0, silver_medals: 0, bronze_medals: 0,
      }));
    },
    staleTime: 1000 * 60 * 10,
  });

  if (chefs.length === 0) return null;

  return (
    <section className="py-16 sm:py-24" dir={isAr ? "rtl" : "ltr"}>
      <div className="container">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-3 px-3 py-1 text-xs font-semibold uppercase tracking-widest">
            {isAr ? "طهاة مميزون" : "Featured Chefs"}
          </Badge>
          <h2 className={cn("text-2xl font-bold sm:text-3xl lg:text-4xl text-foreground tracking-tight", !isAr && "font-serif")}>
            {isAr ? "أبرز الطهاة على المنصة" : "Meet Our Top Chefs"}
          </h2>
          <p className="mt-2 text-muted-foreground max-w-lg mx-auto">
            {isAr ? "تعرّف على أمهر الطهاة في مجتمعنا العالمي" : "Discover the most talented chefs in our global community"}
          </p>
        </div>

        {/* Grid */}
        <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {chefs.map((chef: any, idx: number) => {
            const name = getDisplayName(chef, isAr);
            const spec = isAr && chef.specialization_ar ? chef.specialization_ar : chef.specialization;
            const initials = name ? name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() : "?";
            const hasMedals = chef.gold_medals > 0 || chef.silver_medals > 0 || chef.bronze_medals > 0;
            const countryObj = allCountries.find((c: any) => c.code === chef.country_code);
            const countryName = countryObj ? (isAr ? countryObj.name_ar || countryObj.name : countryObj.name) : "";

            return (
              <Link
                key={chef.user_id || idx}
                to={chef.username ? `/${chef.username}` : `/profile/${chef.user_id}`}
                className="group text-center"
              >
                <div className="relative mx-auto mb-3 w-fit">
                  <Avatar className={cn(
                    "h-20 w-20 sm:h-24 sm:w-24 ring-2 ring-border/40 transition-all duration-300 group-hover:ring-primary/40 group-hover:scale-105",
                    idx < 3 && "ring-primary/20"
                  )}>
                    <AvatarImage src={chef.avatar_url} alt={name} loading="lazy" />
                    <AvatarFallback className="bg-muted text-muted-foreground font-bold text-lg">{initials}</AvatarFallback>
                  </Avatar>
                  {chef.is_verified && (
                    <div className="absolute -bottom-0.5 -end-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                      <Star className="h-2.5 w-2.5 fill-current" />
                    </div>
                  )}
                  {idx < 3 && (
                    <div className="absolute -top-1 -end-1 flex h-6 w-6 items-center justify-center rounded-full bg-chart-4 text-chart-4-foreground text-[10px] font-bold shadow-sm">
                      #{idx + 1}
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {name || (isAr ? "طاهٍ" : "Chef")}
                </h3>
                {spec && (
                  <p className="mt-0.5 text-xs text-muted-foreground truncate flex items-center justify-center gap-1">
                    <ChefHat className="h-3 w-3 shrink-0" />
                    {spec}
                  </p>
                )}
                {countryName && (
                  <p className="mt-0.5 text-[10px] text-muted-foreground/60 truncate">
                    {countryFlag(chef.country_code)} {countryName}
                  </p>
                )}
                {hasMedals && (
                  <div className="mt-1.5 flex items-center justify-center gap-2 text-[11px]">
                    {chef.gold_medals > 0 && <span className="text-chart-4">🥇{chef.gold_medals}</span>}
                    {chef.silver_medals > 0 && <span className="text-muted-foreground">🥈{chef.silver_medals}</span>}
                    {chef.bronze_medals > 0 && <span className="text-chart-3">🥉{chef.bronze_medals}</span>}
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* View All */}
        <div className="mt-10 text-center">
          <Button variant="outline" className="rounded-xl" asChild>
            <Link to="/community">
              {isAr ? "عرض جميع الطهاة" : "View All Chefs"}
              <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
