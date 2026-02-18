import { forwardRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Award, BadgeCheck, Shield, Star } from "lucide-react";

interface ChefBadgeProps {
  userId: string;
  className?: string;
  showTooltip?: boolean;
}

type BadgeLevel = "verified" | "professional" | "champion" | "admin";

const BADGE_CONFIG: Record<BadgeLevel, { icon: any; color: string; label: string; labelAr: string }> = {
  verified: { icon: BadgeCheck, color: "text-primary", label: "Verified Chef", labelAr: "طاهٍ موثق" },
  professional: { icon: Award, color: "text-chart-2", label: "Professional Chef", labelAr: "طاهٍ محترف" },
  champion: { icon: Star, color: "text-chart-4", label: "Competition Champion", labelAr: "بطل المسابقات" },
  admin: { icon: Shield, color: "text-chart-3", label: "Community Admin", labelAr: "مشرف المجتمع" },
};

export const ChefBadge = forwardRef<HTMLSpanElement, ChefBadgeProps>(
  function ChefBadge({ userId, className, showTooltip = true }, ref) {
    const { language } = useLanguage();
    const isAr = language === "ar";

    const { data: badges = [] } = useQuery({
      queryKey: ["chef-badges", userId],
      queryFn: async () => {
        const result: BadgeLevel[] = [];

        const verifRes = await (supabase
          .from("verification_requests")
          .select("status, verification_level")
          .eq("user_id", userId)
          .eq("status", "approved")
          .limit(1) as any);

        if (verifRes.data?.length) {
          const tier = verifRes.data[0].verification_level;
          if (tier === "professional" || tier === "organization") result.push("professional");
          else result.push("verified");
        }

        try {
          const { data: regData } = await supabase.rpc("get_user_competition_role", { p_user_id: userId, p_competition_id: "00000000-0000-0000-0000-000000000000" }) as any;
          const { data: rankings } = await supabase.from("chef_rankings").select("id").eq("user_id", userId).limit(1);
          if (rankings && rankings.length > 0) result.push("champion");
        } catch {
          // skip
        }

        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "supervisor");

        if (roles?.length) result.push("admin");

        return result;
      },
      staleTime: 1000 * 60 * 10,
    });

    if (badges.length === 0) return null;

    return (
      <TooltipProvider>
        <span ref={ref} className={cn("inline-flex items-center gap-0.5", className)}>
          {badges.map((badge) => {
            const config = BADGE_CONFIG[badge];
            const Icon = config.icon;
            const content = (
              <Icon key={badge} className={cn("h-3.5 w-3.5", config.color)} />
            );
            if (!showTooltip) return content;
            return (
              <Tooltip key={badge}>
                <TooltipTrigger asChild>
                  <span className="inline-flex">{content}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{isAr ? config.labelAr : config.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </span>
      </TooltipProvider>
    );
  }
);
