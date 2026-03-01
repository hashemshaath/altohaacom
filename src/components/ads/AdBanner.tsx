import { forwardRef, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdBannerProps {
  placementSlug: string;
  className?: string;
}

export const AdBanner = forwardRef<HTMLDivElement, AdBannerProps>(function AdBanner({ placementSlug, className }, ref) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const impressionLogged = useRef(false);

  const { data: creative } = useQuery({
    queryKey: ["ad-creative", placementSlug],
    queryFn: async () => {
      // Get placement
      const { data: placement } = await supabase
        .from("ad_placements")
        .select("id")
        .eq("slug", placementSlug)
        .eq("is_active", true)
        .maybeSingle();

      if (!placement) return null;

      // Get active creative for this placement
      const { data: creative } = await supabase
        .from("ad_creatives")
        .select("*, ad_campaigns!inner(id, status, company_id, start_date, end_date)")
        .eq("placement_id", placement.id)
        .eq("is_active", true)
        .eq("status", "approved")
        .eq("ad_campaigns.status", "active")
        .limit(1)
        .maybeSingle();

      if (!creative) return null;
      return { ...creative, placement_id: placement.id };
    },
    staleTime: 1000 * 60 * 5,
  });

  // Log impression
  useEffect(() => {
    if (creative && !impressionLogged.current) {
      impressionLogged.current = true;
      supabase.from("ad_impressions").insert({
        creative_id: creative.id,
        campaign_id: creative.campaign_id,
        placement_id: creative.placement_id,
        page_url: window.location.pathname,
        device_type: window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop",
      }).then(() => {
        // Update creative impression count
        supabase.from("ad_creatives").update({ impressions: (creative.impressions || 0) + 1 }).eq("id", creative.id);
      });
    }
  }, [creative]);

  const handleClick = useCallback(() => {
    if (!creative) return;
    // Log click
    supabase.from("ad_clicks").insert({
      creative_id: creative.id,
      campaign_id: creative.campaign_id,
      placement_id: creative.placement_id,
      destination_url: creative.destination_url,
      page_url: window.location.pathname,
      device_type: window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop",
    }).then(() => {
      supabase.from("ad_creatives").update({ clicks: (creative.clicks || 0) + 1 }).eq("id", creative.id);
    });
    // Open destination
    window.open(creative.destination_url, "_blank", "noopener");
  }, [creative]);

  if (!creative) return null;

  return (
    <div ref={ref} className={cn("relative group cursor-pointer overflow-hidden rounded-xl border border-border/40", className)} onClick={handleClick}>
      {creative.image_url && (
        <img src={creative.image_url} alt={isAr ? creative.title_ar || creative.title : creative.title || "Ad"} className="w-full h-full object-cover" />
      )}
      {!creative.image_url && (
        <div className="flex flex-col items-center justify-center p-4 bg-muted/50 min-h-[100px]">
          <p className="font-semibold text-sm">{isAr ? creative.title_ar || creative.title : creative.title}</p>
          {creative.body_text && <p className="text-xs text-muted-foreground mt-1">{isAr ? creative.body_text_ar || creative.body_text : creative.body_text}</p>}
          <Button size="sm" variant="secondary" className="mt-2">{isAr ? creative.cta_text_ar : creative.cta_text}</Button>
        </div>
      )}
      <span className="absolute top-1 end-1 text-[9px] bg-background/80 text-muted-foreground px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
        {isAr ? "إعلان" : "Ad"}
      </span>
    </div>
  );
});

AdBanner.displayName = "AdBanner";
