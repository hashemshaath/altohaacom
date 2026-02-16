import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Award, ChefHat, MapPin, Star, Trophy } from "lucide-react";
import { SectionReveal } from "@/components/ui/section-reveal";

export function FeaturedChefs() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: chefs = [] } = useQuery({
    queryKey: ["featured-chefs-home"],
    queryFn: async () => {
      // Try rankings first, fall back to verified profiles
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
          .select("user_id, full_name, full_name_ar, avatar_url, country_code, city, specialization, specialization_ar, is_verified")
          .in("user_id", userIds);

        const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
        return ranked.map((r: any) => ({ ...r, ...(profileMap.get(r.user_id) || {}) }));
      }

      // Fallback: verified profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, full_name_ar, avatar_url, country_code, city, specialization, specialization_ar, is_verified, loyalty_points")
        .eq("is_verified", true)
        .order("loyalty_points", { ascending: false, nullsFirst: false })
        .limit(8);
      return (profiles || []).map((p: any) => ({
        ...p,
        total_points: p.loyalty_points || 0,
        gold_medals: 0,
        silver_medals: 0,
        bronze_medals: 0,
      }));
    },
    staleTime: 1000 * 60 * 5,
  });

  if (chefs.length === 0) return null;

  return (
    <section className="relative overflow-hidden py-12 md:py-16" aria-labelledby="featured-chefs-heading">
      <div className="absolute inset-0 bg-muted/30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.04),transparent_60%)]" />
      <div className="container relative">
        <SectionReveal>
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="secondary" className="mb-2 gap-1">
                <Award className="h-3 w-3" />
                {isAr ? "طهاة مميزون" : "Featured Chefs"}
              </Badge>
              <h2 id="featured-chefs-heading" className="font-serif text-2xl font-bold sm:text-3xl">
                {isAr ? "أبرز الطهاة على المنصة" : "Top Chefs on the Platform"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {isAr ? "تعرّف على أمهر الطهاة المسجلين في مجتمعنا العالمي" : "Meet the most skilled chefs in our global community"}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/community">
                {isAr ? "عرض الكل" : "View All"}
                <ArrowRight className="ms-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </SectionReveal>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
          {chefs.map((chef: any, idx: number) => {
            const name = isAr && chef.full_name_ar ? chef.full_name_ar : chef.full_name;
            const spec = isAr && chef.specialization_ar ? chef.specialization_ar : chef.specialization;
            const initials = name ? name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() : "?";
            const hasMedals = chef.gold_medals > 0 || chef.silver_medals > 0 || chef.bronze_medals > 0;

            return (
              <Link key={chef.user_id || idx} to={`/profile/${chef.user_id}`} className="group block">
                <Card className="h-full border-border/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20 overflow-hidden">
                  <CardContent className="p-4 text-center">
                    <div className="relative mx-auto mb-3 w-fit">
                      <Avatar className="h-18 w-18 sm:h-20 sm:w-20 ring-2 ring-primary/20 shadow-lg transition-transform duration-300 group-hover:scale-105">
                        <AvatarImage src={chef.avatar_url} alt={name} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      {chef.is_verified && (
                        <div className="absolute -bottom-1 -end-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                          <Star className="h-3 w-3 fill-current" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                      {name || (isAr ? "طاهٍ" : "Chef")}
                    </h3>
                    {spec && (
                      <div className="mt-1 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                        <ChefHat className="h-3 w-3 shrink-0" />
                        <span className="truncate">{spec}</span>
                      </div>
                    )}
                    {chef.country_code && (
                      <div className="mt-0.5 flex items-center justify-center gap-1 text-[10px] text-muted-foreground/70">
                        <MapPin className="h-2.5 w-2.5 shrink-0" />
                        <span>{chef.city ? `${chef.city}, ` : ""}{chef.country_code}</span>
                      </div>
                    )}
                    {hasMedals && (
                      <div className="mt-2 flex items-center justify-center gap-2 text-[11px]">
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
      </div>
    </section>
  );
}
