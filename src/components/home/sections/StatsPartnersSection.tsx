import { memo, forwardRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import { useSectionConfig } from "@/components/home/SectionKeyContext";

interface LogoItem { id: string; name: string; logo_url: string; website_url: string | null; }

const StatsPartnersSection = memo(forwardRef<HTMLElement>(function StatsPartnersSection(_props, _ref) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const config = useSectionConfig();

  const sectionKey = config?.section_key || "sponsors";
  const isSponsors = sectionKey === "sponsors";
  const itemCount = config?.item_count || 24;

  const heading = isAr ? "يثق بنا طهاة من أبرز المؤسسات حول العالم" : "Trusted by chefs from leading institutions worldwide";

  const { data: logos = [] } = useQuery({
    queryKey: ["section-logos", sectionKey, itemCount],
    queryFn: async () => {
      const query = supabase.from("partner_logos").select("id, name, name_ar, logo_url, website_url, category, sort_order, is_active").eq("is_active", true).order("sort_order");
      if (isSponsors) query.eq("category", "sponsor"); else query.neq("category", "sponsor");
      const { data } = await query.limit(itemCount);
      if (!data?.length) {
        const { data: allData } = await supabase.from("partner_logos").select("id, name, name_ar, logo_url, website_url, category, sort_order, is_active").eq("is_active", true).order("sort_order").limit(itemCount);
        return (allData || []).map((p) => ({ id: p.id, name: isAr ? p.name_ar || p.name : p.name, logo_url: p.logo_url, website_url: p.website_url })) as LogoItem[];
      }
      return (data || []).map((p) => ({ id: p.id, name: isAr ? p.name_ar || p.name : p.name, logo_url: p.logo_url, website_url: p.website_url })) as LogoItem[];
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: entities = [] } = useQuery({
    queryKey: ["section-entity-logos", sectionKey, itemCount],
    enabled: !isSponsors,
    queryFn: async () => {
      const { data } = await supabase.from("culinary_entities").select("id, name, name_ar, logo_url, slug, is_verified").eq("status", "active").eq("is_visible", true).not("logo_url", "is", null).order("name").limit(itemCount);
      return (data || []).map((e) => ({ id: e.id, name: isAr ? e.name_ar || e.name : e.name, logo_url: e.logo_url, website_url: null })) as LogoItem[];
    },
    staleTime: 1000 * 60 * 10,
  });

  const allLogos = useMemo(() => {
    const combined = isSponsors ? logos : [...logos, ...entities].slice(0, itemCount);
    return [...combined, ...combined, ...combined, ...combined];
  }, [logos, entities, isSponsors, itemCount]);

  if ((isSponsors ? logos : [...logos, ...entities]).length === 0) return null;

  return (
    <section dir={isAr ? "rtl" : "ltr"} className="py-10 sm:py-14 border-y border-border/30">
      <p className="text-sm text-center text-muted-foreground font-medium mb-8">{heading}</p>

      <div className="relative w-full overflow-hidden group/marquee">
        <div className="pointer-events-none absolute inset-y-0 start-0 z-10 w-16 sm:w-28 bg-gradient-to-r from-background to-transparent" aria-hidden />
        <div className="pointer-events-none absolute inset-y-0 end-0 z-10 w-16 sm:w-28 bg-gradient-to-l from-background to-transparent" aria-hidden />

        <div
          className={cn("flex items-center w-max group-hover/marquee:[animation-play-state:paused]", isAr ? "animate-marquee-rtl" : "animate-marquee")}
          style={{ animationDuration: "60s", gap: "40px" }}
        >
          {allLogos.map((item, i) => {
            const Wrapper = item.website_url ? "a" : "div";
            const linkProps = item.website_url ? { href: item.website_url, target: "_blank" as const, rel: "noopener noreferrer" } : {};
            return (
              <Wrapper key={`${item.id}-${i}`} {...linkProps} className="shrink-0 flex items-center justify-center" title={item.name}>
                <img loading="lazy" src={item.logo_url} alt={item.name} className="h-8 w-auto max-w-[120px] object-contain grayscale opacity-40 transition-all duration-300 hover:grayscale-0 hover:opacity-100" />
              </Wrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
});

export default StatsPartnersSection;
