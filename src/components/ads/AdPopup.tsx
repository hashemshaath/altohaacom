import { useState, useEffect, useCallback, useRef, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const AdPopup = memo(function AdPopup() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [visible, setVisible] = useState(false);
  const impressionLogged = useRef(false);

  const { data: creative } = useQuery({
    queryKey: ["ad-popup"],
    queryFn: async () => {
      const { data: placement } = await supabase
        .from("ad_placements")
        .select("id")
        .eq("slug", "popup-overlay")
        .eq("is_active", true)
        .maybeSingle();

      if (!placement) return null;

      const { data } = await supabase
        .from("ad_creatives")
        .select("*, ad_campaigns!inner(id, status)")
        .eq("placement_id", placement.id)
        .eq("is_active", true)
        .eq("status", "approved")
        .eq("ad_campaigns.status", "active")
        .limit(1)
        .maybeSingle();

      if (!data) return null;
      return { ...data, placement_id: placement.id };
    },
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    if (!creative) return;
    // Check if popup was already dismissed in this session
    const dismissed = sessionStorage.getItem("ad_popup_dismissed");
    if (dismissed) return;

    // Show popup after 5 seconds
    const timer = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(timer);
  }, [creative]);

  useEffect(() => {
    if (creative && visible && !impressionLogged.current) {
      impressionLogged.current = true;
      supabase.from("ad_impressions").insert({
        creative_id: creative.id,
        campaign_id: creative.campaign_id,
        placement_id: creative.placement_id,
        page_url: window.location.pathname,
        device_type: window.innerWidth < 768 ? "mobile" : "desktop",
      });
    }
  }, [creative, visible]);

  const handleClick = useCallback(() => {
    if (!creative) return;
    supabase.from("ad_clicks").insert({
      creative_id: creative.id,
      campaign_id: creative.campaign_id,
      placement_id: creative.placement_id,
      destination_url: creative.destination_url,
      page_url: window.location.pathname,
    });
    window.open(creative.destination_url, "_blank", "noopener");
    setVisible(false);
    sessionStorage.setItem("ad_popup_dismissed", "true");
  }, [creative]);

  const handleClose = () => {
    setVisible(false);
    sessionStorage.setItem("ad_popup_dismissed", "true");
  };

  if (!creative || !visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-sm" onClick={handleClose}>
      <div className="relative mx-4 max-w-md w-full rounded-2xl border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="absolute top-2 end-2 z-10 h-8 w-8 rounded-full bg-background/80" onClick={handleClose}>
          <X className="h-4 w-4" />
        </Button>
        {creative.image_url && (
          <div className="cursor-pointer" onClick={handleClick}>
            <img src={creative.image_url} alt={creative.title || "Ad"} className="w-full object-cover max-h-[300px]" loading="lazy" />
          </div>
        )}
        <div className="p-5">
          {creative.title && <h3 className="font-bold text-lg mb-1">{isAr ? creative.title_ar || creative.title : creative.title}</h3>}
          {creative.body_text && <p className="text-sm text-muted-foreground mb-3">{isAr ? creative.body_text_ar || creative.body_text : creative.body_text}</p>}
          <Button className="w-full" onClick={handleClick}>{isAr ? creative.cta_text_ar : creative.cta_text}</Button>
        </div>
        <span className="absolute bottom-2 end-3 text-[9px] text-muted-foreground">{isAr ? "إعلان ممول" : "Sponsored"}</span>
      </div>
    </div>
  );
});
