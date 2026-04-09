import { memo, forwardRef } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSectionConfig } from "@/components/home/SectionKeyContext";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

/**
 * Homepage ad banner section — renders active creatives from ad_placements
 * linked to the homepage. Falls back gracefully if no ads are available.
 */
export const HomepageAdBanner = memo(forwardRef<HTMLElement>(function HomepageAdBanner(_props, _ref) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const config = useSectionConfig();

  const sectionKey = config?.section_key || "ad_banner_top";

  const { data: creative } = useQuery({
    queryKey: ["homepage-ad-banner", sectionKey],
    queryFn: async () => {
      // Find the placement matching this section's homepage location
      const placementSlug = sectionKey === "ad_banner_mid" ? "homepage-mid" : "homepage-top";

      // Try exact slug match first, then fallback to page_location = homepage
      const { data: placements } = await supabase
        .from("ad_placements")
        .select("id, slug, name, name_ar")
        .eq("is_active", true)
        .or(`slug.eq.${placementSlug},page_location.eq.homepage`)
        .order("sort_order")
        .limit(5);

      if (!placements?.length) return null;

      const placementIds = placements.map(p => p.id);

      // Get active creatives for these placements
      const { data: creatives } = await supabase
        .from("ad_creatives")
        .select(`
          id, title, title_ar, body_text, body_text_ar,
          image_url, video_url, destination_url,
          cta_text, cta_text_ar, format,
          campaign_id, placement_id,
          ad_campaigns!inner(status, name, name_ar, companies(name, name_ar, logo_url))
        `)
        .in("placement_id", placementIds)
        .eq("status", "approved")
        .eq("is_active", true)
        .eq("ad_campaigns.status", "active")
        .limit(1);

      if (!creatives?.length) return null;

      const cr = creatives[0] as any;

      // Track impression
      try {
        await supabase.from("ad_impressions").insert({
          campaign_id: cr.campaign_id,
          creative_id: cr.id,
          placement_id: cr.placement_id,
          page_url: window.location.pathname,
          device_type: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
        });
        // Update counts
        await supabase.from("ad_creatives").update({ impressions: (cr.impressions || 0) + 1 }).eq("id", cr.id);
      } catch { /* non-blocking */ }

      return cr;
    },
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  if (!creative) return null;

  const title = isAr ? creative.title_ar || creative.title : creative.title;
  const bodyText = isAr ? creative.body_text_ar || creative.body_text : creative.body_text;
  const ctaText = isAr ? creative.cta_text_ar || creative.cta_text : creative.cta_text;
  const company = creative.ad_campaigns?.companies;
  const companyName = isAr ? company?.name_ar || company?.name : company?.name;

  const handleClick = async () => {
    try {
      await supabase.from("ad_clicks").insert({
        campaign_id: creative.campaign_id,
        creative_id: creative.id,
        placement_id: creative.placement_id,
        destination_url: creative.destination_url,
        page_url: window.location.pathname,
        device_type: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
      });
      await supabase.from("ad_creatives").update({ clicks: (creative.clicks || 0) + 1 }).eq("id", creative.id);
    } catch { /* non-blocking */ }
  };

  // Image banner format
  if (creative.image_url) {
    return (
      <div className="container" dir={isAr ? "rtl" : "ltr"}>
        <a
          href={creative.destination_url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={handleClick}
          className="group block overflow-hidden rounded-2xl border border-border/40 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
        >
          <div className="relative aspect-[4/1] sm:aspect-[5/1] md:aspect-[6/1] bg-muted overflow-hidden">
            <img loading="lazy" src={creative.image_url}
              alt={title || "Advertisement"}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
             
            />
            {/* Overlay with text */}
            {(title || bodyText) && (
              <div className="absolute inset-0 flex items-center bg-gradient-to-r from-black/80 via-black/40 to-transparent p-4 sm:p-6">
                <div className="max-w-md space-y-1.5">
                  {company?.logo_url && (
                    <img src={company.logo_url} alt={company?.name || "Sponsor"} className="h-6 w-auto rounded-lg mb-2" loading="lazy" />
                  )}
                  {title && <h3 className="text-sm sm:text-base font-bold text-foreground line-clamp-1">{title}</h3>}
                  {bodyText && <p className="text-[12px] sm:text-xs text-muted-foreground line-clamp-2">{bodyText}</p>}
                  {ctaText && (
                    <span className="inline-flex items-center gap-1 text-[12px] sm:text-xs font-semibold text-primary">
                      {ctaText} →
                    </span>
                  )}
                </div>
              </div>
            )}
            {/* Sponsor label */}
            <Badge
              variant="secondary"
              className="absolute top-2 end-2 text-[12px] opacity-70 backdrop-blur-sm"
            >
              {isAr ? "إعلان" : "Sponsored"}
            </Badge>
          </div>
        </a>
      </div>
    );
  }

  // Text-only / native ad format
  return (
    <div className="container" dir={isAr ? "rtl" : "ltr"}>
      <a
        href={creative.destination_url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={handleClick}
        className="group block rounded-2xl border border-border/40 bg-muted/20 p-4 sm:p-5 transition-all duration-300 hover:shadow-md hover:bg-muted/40"
      >
        <div className="flex items-center gap-3">
          {company?.logo_url && (
            <img src={company.logo_url} alt={company?.name || "Sponsor"} className="h-10 w-10 rounded-xl object-cover shrink-0" loading="lazy" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              {companyName && <span className="text-[12px] text-muted-foreground">{companyName}</span>}
              <Badge variant="secondary" className="text-[12px] opacity-70">{isAr ? "إعلان" : "Ad"}</Badge>
            </div>
            {title && <h3 className="text-sm font-semibold text-foreground truncate">{title}</h3>}
            {bodyText && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{bodyText}</p>}
          </div>
          {ctaText && (
            <span className="shrink-0 text-xs font-semibold text-primary group-hover:underline">{ctaText} →</span>
          )}
        </div>
      </a>
    </div>
  );
}));

export default HomepageAdBanner;

