import { useEffect, useRef, useCallback, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdVerticalProps {
  placementSlug?: string;
  className?: string;
}

export const AdVertical = memo(function AdVertical({ placementSlug = "sidebar-vertical", className }: AdVerticalProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const impressionLogged = useRef(false);

  const { data: creative } = useQuery({
    queryKey: ["ad-vertical", placementSlug],
    queryFn: async () => {
      const { data: placement } = await supabase
        .from("ad_placements")
        .select("id")
        .eq("slug", placementSlug)
        .eq("is_active", true)
        .maybeSingle();

      if (!placement) return null;

      const { data } = await supabase
        .from("ad_creatives")
        .select("*, ad_campaigns!inner(id, status, company_id)")
        .eq("placement_id", placement.id)
        .eq("is_active", true)
        .eq("status", "approved")
        .eq("ad_campaigns.status", "active")
        .limit(1)
        .maybeSingle();

      if (!data) return null;
      return { ...data, placement_id: placement.id };
    },
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (creative && !impressionLogged.current) {
      impressionLogged.current = true;
      supabase.from("ad_impressions").insert({
        creative_id: creative.id,
        campaign_id: creative.campaign_id,
        placement_id: creative.placement_id,
        page_url: window.location.pathname,
        device_type: window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop",
      });
    }
  }, [creative]);

  const handleClick = useCallback(() => {
    if (!creative) return;
    supabase.from("ad_clicks").insert({
      creative_id: creative.id,
      campaign_id: creative.campaign_id,
      placement_id: creative.placement_id,
      destination_url: creative.destination_url,
      page_url: window.location.pathname,
      device_type: window.innerWidth < 768 ? "mobile" : "desktop",
    });
    window.open(creative.destination_url, "_blank", "noopener");
  }, [creative]);

  if (!creative) return null;

  return (
    <div
      className={cn(
        "relative group cursor-pointer overflow-hidden rounded-xl border border-border/40 bg-card shadow-sm transition-shadow hover:shadow-md",
        className
      )}
      onClick={handleClick}
    >
      {creative.image_url ? (
        <img
          src={creative.image_url}
          alt={isAr ? creative.title_ar || creative.title : creative.title || "Ad"}
          className="w-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-5 text-center min-h-[250px]">
          <p className="font-semibold text-sm mb-1">
            {isAr ? creative.title_ar || creative.title : creative.title}
          </p>
          {creative.body_text && (
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              {isAr ? creative.body_text_ar || creative.body_text : creative.body_text}
            </p>
          )}
          <Button size="sm" variant="secondary">
            {isAr ? creative.cta_text_ar || creative.cta_text : creative.cta_text}
          </Button>
        </div>
      )}
      <span className="absolute top-1.5 end-1.5 text-[9px] bg-background/80 text-muted-foreground px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
        {isAr ? "إعلان" : "Ad"}
      </span>
    </div>
  );
}
