import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";

const tierConfig: Record<string, { color: string; label: string; labelAr: string }> = {
  platinum: { color: "bg-chart-4/15 text-chart-4 border-chart-4/30", label: "Platinum", labelAr: "بلاتيني" },
  gold: { color: "bg-chart-4/10 text-chart-4 border-chart-4/20", label: "Gold", labelAr: "ذهبي" },
  silver: { color: "bg-muted text-muted-foreground border-border", label: "Silver", labelAr: "فضي" },
  bronze: { color: "bg-chart-2/10 text-chart-2 border-chart-2/20", label: "Bronze", labelAr: "برونزي" },
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
      {displaySponsors.map((sponsor: any) => {
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
}
