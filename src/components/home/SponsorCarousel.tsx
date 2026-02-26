import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

const tierStyles: Record<string, { border: string; bg: string; label: string; labelAr: string }> = {
  platinum: { border: "border-chart-4/30", bg: "bg-gradient-to-br from-chart-4/10 to-chart-4/5", label: "Platinum", labelAr: "بلاتيني" },
  gold: { border: "border-chart-4/20", bg: "bg-gradient-to-br from-chart-4/8 to-background", label: "Gold", labelAr: "ذهبي" },
  silver: { border: "border-border/60", bg: "bg-muted/30", label: "Silver", labelAr: "فضي" },
  bronze: { border: "border-chart-3/20", bg: "bg-chart-3/5", label: "Bronze", labelAr: "برونزي" },
};

export function SponsorCarousel() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: sponsors = [] } = useQuery({
    queryKey: ["homepage-sponsors"],
    queryFn: async () => {
      const [hRes, cRes] = await Promise.all([
        supabase
          .from("homepage_sponsors")
          .select("*")
          .eq("is_active", true)
          .order("sort_order"),
        supabase
          .from("competition_sponsors")
          .select("id, company_id, tier, logo_url, companies(name, name_ar, logo_url, website)")
          .eq("status", "approved")
          .limit(20),
      ]);

      const homepageSponsors = (hRes.data || []).map((s: any) => ({
        id: s.id,
        name: isAr ? s.name_ar || s.name : s.name,
        logo: s.logo_url,
        website: s.website_url,
        tier: s.tier || "silver",
        source: "homepage",
      }));

      const compSponsors = (cRes.data || []).map((s: any) => ({
        id: s.id,
        name: isAr ? s.companies?.name_ar || s.companies?.name : s.companies?.name,
        logo: s.logo_url || s.companies?.logo_url,
        website: s.companies?.website,
        tier: s.tier || "silver",
        source: "competition",
      }));

      const seen = new Set<string>();
      const all = [...homepageSponsors, ...compSponsors].filter((s) => {
        if (!s.logo || seen.has(s.name)) return false;
        seen.add(s.name);
        return true;
      });

      const tierOrder = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
      return all.sort((a, b) => (tierOrder[a.tier as keyof typeof tierOrder] || 3) - (tierOrder[b.tier as keyof typeof tierOrder] || 3));
    },
    staleTime: 1000 * 60 * 5,
  });

  if (sponsors.length === 0) return null;

  const nonPlatinum = sponsors.filter(s => s.tier !== "platinum");
  const platinums = sponsors.filter(s => s.tier === "platinum");

  return (
    <section className="py-8 md:py-12 overflow-hidden">
      <div className="container">
        <div className="mb-8 text-center">
          <Badge variant="secondary" className="mb-3 gap-1">
            <Crown className="h-3 w-3 text-chart-4" />
            {isAr ? "الرعاة الرسميون" : "Official Sponsors"}
          </Badge>
          <h2 className={cn("text-2xl font-bold sm:text-3xl", !isAr && "font-serif")}>
            {isAr ? "بدعم من أفضل الشركاء" : "Powered by Top Partners"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
            {isAr ? "شركاؤنا الذين يصنعون معنا مستقبل الطهي" : "Our partners who shape the future of culinary arts with us"}
          </p>
        </div>

        {/* Platinum sponsors */}
        {platinums.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="h-px flex-1 bg-gradient-to-e from-transparent to-chart-4/30" />
              <Badge className="bg-chart-4/10 text-chart-4 border-chart-4/20 gap-1 text-[10px] uppercase tracking-widest">
                <Crown className="h-3 w-3" />
                {isAr ? "الرعاة البلاتينيون" : "Platinum Sponsors"}
              </Badge>
              <div className="h-px flex-1 bg-gradient-to-s from-transparent to-chart-4/30" />
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {platinums.map(sponsor => (
                <a
                  key={sponsor.id}
                  href={sponsor.website || "#"}
                  target={sponsor.website ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-2 sm:gap-3 rounded-2xl border border-chart-4/30 bg-gradient-to-br from-chart-4/10 to-chart-4/5 p-4 sm:p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 min-w-[130px] sm:min-w-[160px]"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-background/90 p-3 shadow-md ring-1 ring-chart-4/20">
                    <img src={sponsor.logo} alt={sponsor.name} className="h-full w-full object-contain transition-transform group-hover:scale-110" loading="lazy" />
                  </div>
                  <p className="text-sm font-bold truncate max-w-[140px]">{sponsor.name}</p>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Scrolling marquee for other sponsors */}
        {nonPlatinum.length > 0 && (
          <div className="relative overflow-hidden">
            {/* Fade edges using logical gradient directions */}
            <div className="absolute inset-y-0 start-0 w-20 z-10 pointer-events-none bg-gradient-to-e from-background to-transparent" />
            <div className="absolute inset-y-0 end-0 w-20 z-10 pointer-events-none bg-gradient-to-s from-background to-transparent" />
            <style>{`@keyframes marquee-ltr { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
@keyframes marquee-rtl { 0% { transform: translateX(0); } 100% { transform: translateX(50%); } }`}</style>
            <div
              className="flex gap-6 py-4"
              style={{
                width: "max-content",
                animation: `${isAr ? "marquee-rtl" : "marquee-ltr"} ${Math.max(20, nonPlatinum.length * 4)}s linear infinite`,
              }}
            >
              {[...nonPlatinum, ...nonPlatinum].map((sponsor, idx) => {
                const tier = tierStyles[sponsor.tier] || tierStyles.silver;
                return (
                  <a
                    key={`${sponsor.id}-${idx}`}
                    href={sponsor.website || "#"}
                    target={sponsor.website ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className={`group flex flex-col items-center gap-3 rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 min-w-[130px] ${tier.border} ${tier.bg}`}
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-background/80 p-2 shadow-sm">
                      <img src={sponsor.logo} alt={sponsor.name} className="h-full w-full object-contain transition-all duration-300 group-hover:scale-110" loading="lazy" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium truncate max-w-[110px]">{sponsor.name}</p>
                      <Badge variant="outline" className="mt-1 text-[8px] uppercase tracking-wider">
                        {isAr ? tier.labelAr : tier.label}
                      </Badge>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
