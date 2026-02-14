import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";

const tierStyles: Record<string, { border: string; bg: string; label: string; labelAr: string }> = {
  platinum: { border: "border-chart-4/30", bg: "bg-gradient-to-br from-chart-4/10 to-chart-4/5", label: "Platinum", labelAr: "بلاتيني" },
  gold: { border: "border-chart-4/20", bg: "bg-gradient-to-br from-chart-4/8 to-background", label: "Gold", labelAr: "ذهبي" },
  silver: { border: "border-border/60", bg: "bg-muted/30", label: "Silver", labelAr: "فضي" },
  bronze: { border: "border-chart-3/20", bg: "bg-chart-3/5", label: "Bronze", labelAr: "برونزي" },
};

export function SponsorCarousel() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  // Fetch from both homepage_sponsors and active competition sponsors
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

      // Deduplicate by name
      const seen = new Set<string>();
      const all = [...homepageSponsors, ...compSponsors].filter((s) => {
        if (!s.logo || seen.has(s.name)) return false;
        seen.add(s.name);
        return true;
      });

      // Sort by tier priority
      const tierOrder = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
      return all.sort((a, b) => (tierOrder[a.tier as keyof typeof tierOrder] || 3) - (tierOrder[b.tier as keyof typeof tierOrder] || 3));
    },
    staleTime: 1000 * 60 * 5,
  });

  if (sponsors.length === 0) return null;

  return (
    <section className="py-10 md:py-14 overflow-hidden">
      <div className="container">
        <div className="mb-8 text-center">
          <Badge variant="secondary" className="mb-3 gap-1">
            <Crown className="h-3 w-3 text-chart-4" />
            {isAr ? "الرعاة الرسميون" : "Official Sponsors"}
          </Badge>
          <h2 className="font-serif text-2xl font-bold sm:text-3xl">
            {isAr ? "بدعم من أفضل الشركاء" : "Powered by Top Partners"}
          </h2>
        </div>

        {/* Scrolling marquee */}
        <div className="relative">
          <div className="absolute inset-y-0 start-0 w-20 bg-gradient-to-e from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 end-0 w-20 bg-gradient-to-s from-background to-transparent z-10 pointer-events-none" />
          <style>{`@keyframes marquee-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
          <div className="flex gap-8 py-4" style={{ width: "max-content", animation: "marquee-scroll 30s linear infinite" }}>
            {[...sponsors, ...sponsors].map((sponsor, idx) => {
              const tier = tierStyles[sponsor.tier] || tierStyles.silver;
              return (
                <a
                  key={`${sponsor.id}-${idx}`}
                  href={sponsor.website || "#"}
                  target={sponsor.website ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className={`group flex flex-col items-center gap-3 rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 min-w-[140px] ${tier.border} ${tier.bg}`}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-background/80 p-2 shadow-sm">
                    <img
                      src={sponsor.logo}
                      alt={sponsor.name}
                      className="h-full w-full object-contain transition-all duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium truncate max-w-[120px]">{sponsor.name}</p>
                    <Badge variant="outline" className="mt-1 text-[8px] uppercase tracking-wider">
                      {isAr ? tier.labelAr : tier.label}
                    </Badge>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
