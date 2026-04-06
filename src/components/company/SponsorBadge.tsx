import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";

const tierConfig: Record<string, { color: string; label: string; labelAr: string }> = {
  strategic_partner: { color: "bg-chart-4/15 text-chart-4 border-chart-4/30", label: "Strategic Partner", labelAr: "شريك استراتيجي" },
  platinum: { color: "bg-chart-3/15 text-chart-3 border-chart-3/30", label: "Platinum Partner", labelAr: "الشريك البلاتيني" },
  gold: { color: "bg-chart-4/10 text-chart-4 border-chart-4/20", label: "Gold Sponsor", labelAr: "الراعي الذهبي" },
  silver: { color: "bg-muted text-muted-foreground border-border", label: "Silver Sponsor", labelAr: "الراعي الفضي" },
  participant: { color: "bg-chart-5/10 text-chart-5 border-chart-5/20", label: "Participant", labelAr: "مشارك" },
  organizer: { color: "bg-primary/10 text-primary border-primary/20", label: "Organizer", labelAr: "الجهة المنظمة" },
  official_contractor: { color: "bg-chart-2/10 text-chart-2 border-chart-2/20", label: "Official Contractor", labelAr: "المقاول الرسمي" },
  official_shipping: { color: "bg-chart-3/10 text-chart-3 border-chart-3/20", label: "Official Shipping Provider", labelAr: "مزوّد الشحن الرسمي" },
  supporter: { color: "bg-chart-5/10 text-chart-5 border-chart-5/20", label: "Supporter", labelAr: "داعم" },
  media_partner: { color: "bg-accent text-accent-foreground border-accent", label: "Media Partner", labelAr: "الشريك الإعلامي" },
  partner: { color: "bg-primary/10 text-primary border-primary/20", label: "Partner", labelAr: "شريك" },
  // Legacy
  bronze: { color: "bg-chart-2/10 text-chart-2 border-chart-2/20", label: "Bronze", labelAr: "برونزي" },
  commercial_supporter: { color: "bg-chart-5/10 text-chart-5 border-chart-5/20", label: "Commercial Supporter", labelAr: "الداعم التجاري" },
};

interface SponsorBadgeProps {
  competitionId: string;
  language: string;
  showLogo?: boolean;
  compact?: boolean;
}

export const CompetitionSponsorBadges = memo(function CompetitionSponsorBadges({ competitionId, language, showLogo = true, compact = false }: SponsorBadgeProps) {
  const isAr = language === "ar";

  const { data: sponsors = [] } = useQuery({
    queryKey: ["competitionSponsors", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_sponsors")
        .select("id, tier, status, companies:company_id(id, name, name_ar, logo_url)")
        .eq("competition_id", competitionId)
        .eq("status", "approved");
      if (error) return [];
      return data || [];
    },
    enabled: !!competitionId,
    staleTime: 1000 * 60 * 10,
  });

  if (sponsors.length === 0) return null;

  // Show top sponsor only in compact mode
  const displaySponsors = compact ? sponsors.slice(0, 1) : sponsors.slice(0, 3);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {displaySponsors.map((sponsor) => {
        const company = sponsor.companies;
        const tier = tierConfig[sponsor.tier] || tierConfig.silver;
        const name = isAr && company?.name_ar ? company.name_ar : company?.name;

        return (
          <Badge
            key={sponsor.id}
            variant="outline"
            className={`${tier.color} gap-1 text-[9px] font-bold uppercase tracking-wider py-0.5 px-2 backdrop-blur-sm`}
          >
            {showLogo && company?.logo_url ? (
              <img src={company.logo_url} alt={name} className="h-3 w-3 rounded-sm object-contain" />
            ) : (
              <Crown className="h-2.5 w-2.5" />
            )}
            {compact ? (isAr ? "مُرعى" : "Sponsored") : name}
          </Badge>
        );
      })}
      {!compact && sponsors.length > 3 && (
        <Badge variant="secondary" className="text-[9px] py-0.5 px-1.5">
          +{sponsors.length - 3}
        </Badge>
      )}
    </div>
  );
});
