import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Crown, Trophy, Calendar, MapPin, ArrowRight, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { localizeLocation } from "@/lib/localizeLocation";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { formatCurrency } from "@/lib/currencyFormatter";
import { SectionReveal } from "@/components/ui/section-reveal";
import { SectionHeader } from "./SectionHeader";

const TIER_LABELS: Record<string, { en: string; ar: string; color: string }> = {
  platinum: { en: "Platinum", ar: "بلاتيني", color: "bg-chart-3/10 text-chart-3 border-chart-3/30" },
  gold: { en: "Gold", ar: "ذهبي", color: "bg-chart-4/10 text-chart-4 border-chart-4/30" },
  silver: { en: "Silver", ar: "فضي", color: "bg-muted text-muted-foreground border-border" },
  bronze: { en: "Bronze", ar: "برونزي", color: "bg-chart-2/10 text-chart-2 border-chart-2/30" },
};

export function SponsorshipOpportunities() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: opportunities = [] } = useQuery({
    queryKey: ["home-sponsorship-opportunities"],
    queryFn: async () => {
      const { data: competitions } = await supabase
        .from("competitions")
        .select(`
          id, title, title_ar, cover_image_url, status, competition_start, city, country, country_code, is_virtual,
          competition_sponsors(id, company_id)
        `)
        .in("status", ["registration_open", "upcoming", "in_progress"])
        .order("competition_start", { ascending: true })
        .limit(8);

      const { data: packages } = await supabase
        .from("sponsorship_packages")
        .select("id, name, name_ar, tier, price, currency")
        .eq("is_active", true)
        .order("sort_order")
        .limit(4);

      return (competitions || []).map((c: any) => ({
        ...c,
        currentSponsors: c.competition_sponsors?.length || 0,
        packages: packages || [],
      }));
    },
    staleTime: 1000 * 60 * 5,
  });

  if (opportunities.length === 0) return null;

  return (
    <section className="relative overflow-hidden py-8 md:py-12" dir={isAr ? "rtl" : "ltr"}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent" />
      <div className="container relative">
        <SectionHeader
          icon={Sparkles}
          badge={isAr ? "فرص رعاية حصرية" : "Sponsorship"}
          title={isAr ? "كن شريكاً في صناعة النجاح" : "Be a Partner in Shaping Success"}
          subtitle={isAr ? "ادعم مسابقات الطهي العالمية واربط علامتك بأمهر الطهاة" : "Support world-class culinary competitions & connect your brand with top chefs"}
          dataSource="competitions • sponsorship_packages"
          itemCount={opportunities.length}
          viewAllHref="/sponsors"
          viewAllLabel={isAr ? "جميع الفرص" : "All Opportunities"}
          isAr={isAr}
        />

        {/* Sponsorship Packages */}
        {opportunities[0]?.packages?.length > 0 && (
          <div className="mb-5">
            <ScrollArea className="w-full">
              <div className="flex gap-2.5 pb-2" dir={isAr ? "rtl" : "ltr"}>
                {opportunities[0].packages.map((pkg: any) => {
                  const tier = TIER_LABELS[pkg.tier] || TIER_LABELS.bronze;
                  return (
                    <div
                      key={pkg.id}
                      className={cn("flex shrink-0 items-center gap-2 rounded-full border px-4 py-2", tier.color)}
                    >
                      <Crown className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">
                        {isAr && pkg.name_ar ? pkg.name_ar : pkg.name}
                      </span>
                      {pkg.price && (
                        <span className="text-xs font-bold">
                          {formatCurrency(Number(pkg.price), language as "en" | "ar")}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}

        {/* Competition Cards */}
        <SectionReveal delay={80}>
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {opportunities.slice(0, 4).map((comp: any) => {
              const title = isAr && comp.title_ar ? comp.title_ar : comp.title;
              return (
                <Link key={comp.id} to={`/competitions/${comp.id}`} className="group block">
                  <Card className="h-full overflow-hidden border-border/40 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20">
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                      {comp.cover_image_url ? (
                        <img src={comp.cover_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                          <Trophy className="h-10 w-10 text-primary/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-3">
                        <h3 className="line-clamp-2 text-sm font-bold text-foreground drop-shadow-sm group-hover:text-primary transition-colors">{title}</h3>
                      </div>
                      <Badge className="absolute end-2 top-2 text-[10px] bg-primary/90 shadow-sm gap-1">
                        <Crown className="h-2.5 w-2.5" />
                        {isAr ? "فرصة رعاية" : "Sponsor"}
                      </Badge>
                    </div>
                    <CardContent className="p-3 space-y-2">
                      <div className="space-y-1 text-[11px] text-muted-foreground">
                        {comp.competition_start && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 shrink-0 text-primary/50" />
                            <span>{format(new Date(comp.competition_start), "d MMM yyyy", { locale: isAr ? ar : undefined })}</span>
                          </div>
                        )}
                        {comp.is_virtual ? (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 shrink-0 text-primary/50" />
                            <span>{isAr ? "افتراضي" : "Virtual"}</span>
                          </div>
                        ) : comp.city ? (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 shrink-0 text-primary/50" />
                            <span className="truncate">{localizeLocation({ city: comp.city, country: comp.country, countryCode: comp.country_code }, isAr)}</span>
                          </div>
                        ) : null}
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-border/40">
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>{comp.currentSponsors} {isAr ? "راعٍ" : "sponsors"}</span>
                        </div>
                        <span className="text-[11px] font-medium text-primary">
                          {isAr ? "تقدّم الآن" : "Apply Now"} →
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </SectionReveal>

        {/* Mobile View All */}
        <div className="mt-5 text-center sm:hidden">
          <Button variant="outline" size="sm" asChild>
            <Link to="/sponsors">
              {isAr ? "جميع فرص الرعاية" : "All Sponsorship Opportunities"}
              <ArrowRight className="ms-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
