import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSectionConfig } from "@/components/home/SectionKeyContext";

export default function StatsPartnersSection() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const config = useSectionConfig();

  const itemCount = config?.item_count || 12;
  const title = config
    ? (isAr ? config.title_ar || "بثقة من الأفضل" : config.title_en || "Trusted by the Best")
    : (isAr ? "بثقة من الأفضل" : "Trusted by the Best");
  const showTitle = config?.show_title ?? true;

  const { data: partners = [] } = useQuery({
    queryKey: ["partner-logos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("partner_logos")
        .select("id, name, name_ar, logo_url, website_url, sort_order, is_active")
        .eq("is_active", true)
        .order("sort_order");
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: entities = [] } = useQuery({
    queryKey: ["home-entity-logos", itemCount],
    queryFn: async () => {
      const { data } = await supabase
        .from("culinary_entities")
        .select("id, name, name_ar, logo_url, slug, is_verified, is_visible")
        .eq("status", "active")
        .eq("is_visible", true)
        .not("logo_url", "is", null)
        .order("name")
        .limit(itemCount);
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const allLogos = [
    ...partners.map((p: any) => ({ id: p.id, name: isAr ? p.name_ar || p.name : p.name, logo: p.logo_url })),
    ...entities.map((e: any) => ({ id: e.id, name: isAr ? e.name_ar || e.name : e.name, logo: e.logo_url })),
  ].filter(l => l.logo);

  if (allLogos.length === 0) return null;

  const displayLogos = allLogos.slice(0, itemCount);
  // Duplicate logos for seamless infinite scroll effect
  const marqueeLogos = displayLogos.length >= 4 ? [...displayLogos, ...displayLogos] : displayLogos;
  const useMarquee = displayLogos.length >= 4;

  return (
    <section dir={isAr ? "rtl" : "ltr"}>
      <div className="container">
        {showTitle && (
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3 px-3 py-1 text-xs font-semibold uppercase tracking-widest">
              {isAr ? "شركاؤنا" : "Our Partners"}
            </Badge>
            <h2 className={cn("text-2xl font-bold sm:text-3xl text-foreground tracking-tight", !isAr && "font-serif")}>
              {title}
            </h2>
          </div>
        )}

        {useMarquee ? (
          <div className="relative overflow-hidden">
            {/* Fade edges */}
            <div className="pointer-events-none absolute inset-y-0 start-0 z-10 w-16 bg-gradient-to-e from-background to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 end-0 z-10 w-16 bg-gradient-to-s from-background to-transparent" />
            <div
              className={cn(
                "flex items-center gap-10 sm:gap-14",
                isAr ? "animate-marquee-rtl" : "animate-marquee"
              )}
              style={{ width: "max-content" }}
            >
              {marqueeLogos.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  className="flex h-12 shrink-0 items-center justify-center grayscale opacity-50 transition-all duration-300 hover:grayscale-0 hover:opacity-100"
                  title={item.name}
                >
                  <img
                    src={item.logo}
                    alt={item.name}
                    className="h-full max-w-[120px] object-contain"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            {displayLogos.map((item) => (
              <div
                key={item.id}
                className="flex h-12 items-center justify-center grayscale opacity-60 transition-all duration-300 hover:grayscale-0 hover:opacity-100"
                title={item.name}
              >
                <img
                  src={item.logo}
                  alt={item.name}
                  className="h-full max-w-[120px] object-contain"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
