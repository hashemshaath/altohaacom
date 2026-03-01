import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Award, Building } from "lucide-react";

interface SponsorInfo { name?: string; name_ar?: string; tier?: string; logo_url?: string; }

const TIER_CONFIG: Record<string, { icon: typeof Star; gradient: string; label: string; labelAr: string; order: number }> = {
  patron: { icon: Award, gradient: "from-chart-4/20 to-chart-4/5", label: "Patron", labelAr: "راعي رسمي", order: 0 },
  platinum: { icon: Star, gradient: "from-chart-3/20 to-chart-3/5", label: "Platinum", labelAr: "بلاتيني", order: 1 },
  gold: { icon: Star, gradient: "from-chart-4/20 to-chart-4/5", label: "Gold", labelAr: "ذهبي", order: 2 },
  partner: { icon: Star, gradient: "from-primary/20 to-primary/5", label: "Partner", labelAr: "شريك", order: 3 },
  silver: { icon: Star, gradient: "from-muted-foreground/20 to-muted-foreground/5", label: "Silver", labelAr: "فضي", order: 4 },
  bronze: { icon: Star, gradient: "from-chart-2/20 to-chart-2/5", label: "Bronze", labelAr: "برونزي", order: 5 },
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

  return (
    <div className="space-y-8">
      {Object.entries(byTier).map(([tier, tierSponsors]) => {
        const config = TIER_CONFIG[tier];
        const tierLabel = config ? (isAr ? config.labelAr : config.label) : tier;
        return (
          <section key={tier}>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
              <div className={`flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br ${config?.gradient || "from-muted to-muted/50"}`}>
                {config ? <config.icon className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}
              </div>
              {tierLabel}
              <Badge variant="outline" className="text-[9px] ms-1">{tierSponsors.length}</Badge>
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
      })}
    </div>
  );
});
