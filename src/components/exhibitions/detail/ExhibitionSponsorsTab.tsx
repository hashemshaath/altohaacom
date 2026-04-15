import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Award, Building } from "lucide-react";

interface SponsorInfo { name?: string; name_ar?: string; tier?: string; logo_url?: string; }

const TIER_CONFIG: Record<string, { icon: typeof Star; gradient: string; label: string; labelAr: string; order: number }> = {
  // Sponsors & Supporters
  strategic_partner: { icon: Award, gradient: "from-chart-4/20 to-chart-4/5", label: "Strategic Partner", labelAr: "شريك استراتيجي", order: 0 },
  platinum: { icon: Award, gradient: "from-chart-3/20 to-chart-3/5", label: "Platinum Partner", labelAr: "الشريك البلاتيني", order: 1 },
  gold: { icon: Star, gradient: "from-chart-4/20 to-chart-4/5", label: "Gold Sponsor", labelAr: "الراعي الذهبي", order: 2 },
  silver: { icon: Star, gradient: "from-muted-foreground/20 to-muted-foreground/5", label: "Silver Sponsor", labelAr: "الراعي الفضي", order: 3 },
  participant: { icon: Star, gradient: "from-chart-5/20 to-chart-5/5", label: "Participant", labelAr: "مشارك", order: 4 },
  organizer: { icon: Building, gradient: "from-primary/20 to-primary/5", label: "Organizer", labelAr: "الجهة المنظمة", order: 5 },
  official_contractor: { icon: Building, gradient: "from-chart-2/20 to-chart-2/5", label: "Official Contractor", labelAr: "المقاول الرسمي", order: 6 },
  official_shipping: { icon: Building, gradient: "from-chart-3/20 to-chart-3/5", label: "Official Shipping Provider", labelAr: "مزوّد الشحن الرسمي", order: 7 },
  supporter: { icon: Star, gradient: "from-chart-5/20 to-chart-5/5", label: "Supporter", labelAr: "داعم", order: 8 },
  media_partner: { icon: Star, gradient: "from-accent/20 to-accent/5", label: "Media Partner", labelAr: "الشريك الإعلامي", order: 9 },
  // Partners (separate section)
  partner: { icon: Star, gradient: "from-primary/20 to-primary/5", label: "Partner", labelAr: "شريك", order: 10 },
  // Legacy tiers kept for backward compatibility
  patron: { icon: Award, gradient: "from-chart-4/20 to-chart-4/5", label: "Patron", labelAr: "راعي رسمي", order: 11 },
  bronze: { icon: Star, gradient: "from-chart-2/20 to-chart-2/5", label: "Bronze", labelAr: "برونزي", order: 12 },
  commercial_supporter: { icon: Star, gradient: "from-chart-5/20 to-chart-5/5", label: "Commercial Supporter", labelAr: "الداعم التجاري", order: 13 },
};

interface Props {
  sponsors: SponsorInfo[];
  isAr: boolean;
}

export const ExhibitionSponsorsTab = memo(function ExhibitionSponsorsTab({ sponsors, isAr }: Props) {
  const sorted = [...sponsors].sort((a, b) => (TIER_CONFIG[a.tier || ""]?.order ?? 99) - (TIER_CONFIG[b.tier || ""]?.order ?? 99));
  const byTier = sorted.reduce<Record<string, SponsorInfo[]>>((acc, s) => {
    const tier = s.tier || "other";
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(s);
    return acc;
  }, {});

  const partnerTiers = new Set(["partner"]);
  const sponsorEntries = Object.entries(byTier).filter(([tier]) => !partnerTiers.has(tier));
  const partnerEntries = Object.entries(byTier).filter(([tier]) => partnerTiers.has(tier));

  const renderTierSection = ([tier, tierSponsors]: [string, SponsorInfo[]]) => {
    const config = TIER_CONFIG[tier];
    const tierLabel = config ? (isAr ? config.labelAr : config.label) : tier;
    return (
      <section key={tier}>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
          <div className={`flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br ${config?.gradient || "from-muted to-muted/50"}`}>
            {config ? <config.icon className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}
          </div>
          {tierLabel}
          <Badge variant="outline" className="text-xs ms-1">{tierSponsors.length}</Badge>
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {tierSponsors.map((sponsor, i) => (
            <Card key={i} className="overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]">
              <CardContent className="flex flex-col items-center p-4 text-center">
                {sponsor.logo_url ? (
                  <img src={sponsor.logo_url} alt={sponsor.name} className="mb-2 h-12 w-auto max-w-[120px] object-contain" loading="lazy" />
                ) : (
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-muted"><Building className="h-5 w-5 text-muted-foreground" /></div>
                )}
                <p className="text-xs font-medium">{isAr && sponsor.name_ar ? sponsor.name_ar : sponsor.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-10">
      {sponsorEntries.length > 0 && (
        <div className="space-y-8">
          <h2 className="text-base font-bold tracking-wide border-b pb-2">
            {isAr ? "الرعاة والداعمون" : "Sponsors & Supporters"}
          </h2>
          {sponsorEntries.map(renderTierSection)}
        </div>
      )}
      {partnerEntries.length > 0 && (
        <div className="space-y-8">
          <h2 className="text-base font-bold tracking-wide border-b pb-2">
            {isAr ? "الشركاء" : "Partners"}
          </h2>
          {partnerEntries.map(renderTierSection)}
        </div>
      )}
    </div>
  );
});
