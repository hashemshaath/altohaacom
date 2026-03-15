import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import { useSectionConfig } from "@/components/home/SectionKeyContext";
import { SectionHeader } from "@/components/home/SectionHeader";
import { Handshake, Award, ExternalLink } from "lucide-react";

interface LogoItem {
  id: string;
  name: string;
  logo_url: string;
  website_url: string | null;
  category: string;
}

const StatsPartnersSection = memo(function StatsPartnersSection() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const config = useSectionConfig();

  const title = config
    ? (isAr ? config.title_ar || config.title_en : config.title_en || "")
    : "";
  const showTitle = config?.show_title ?? true;
  const showViewAll = config?.show_view_all ?? false;
  const itemCount = config?.item_count || 12;

  // Determine if this is sponsors or partners based on section key in config
  const sectionKey = config?.section_key || "sponsors";
  const isSponsors = sectionKey === "sponsors";

  const defaultTitle = isSponsors
    ? (isAr ? "الرعاة" : "Sponsors")
    : (isAr ? "الشركاء" : "Partners");

  const defaultBadge = isSponsors
    ? (isAr ? "رعاتنا" : "Our Sponsors")
    : (isAr ? "شركاؤنا" : "Our Partners");

  const SectionIcon = isSponsors ? Award : Handshake;

  const { data: logos = [] } = useQuery({
    queryKey: ["section-logos", sectionKey, itemCount],
    queryFn: async () => {
      // Fetch partner_logos filtered by category
      const query = supabase
        .from("partner_logos")
        .select("id, name, name_ar, logo_url, website_url, category, sort_order, is_active")
        .eq("is_active", true)
        .order("sort_order");

      if (isSponsors) {
        query.eq("category", "sponsor");
      } else {
        query.neq("category", "sponsor");
      }

      const { data } = await query.limit(itemCount);

      // If no category-filtered results, fall back to all logos
      if (!data?.length) {
        const { data: allData } = await supabase
          .from("partner_logos")
          .select("id, name, name_ar, logo_url, website_url, category, sort_order, is_active")
          .eq("is_active", true)
          .order("sort_order")
          .limit(itemCount);
        return (allData || []).map((p: any) => ({
          id: p.id,
          name: isAr ? p.name_ar || p.name : p.name,
          logo_url: p.logo_url,
          website_url: p.website_url,
          category: p.category,
        })) as LogoItem[];
      }

      return (data || []).map((p: any) => ({
        id: p.id,
        name: isAr ? p.name_ar || p.name : p.name,
        logo_url: p.logo_url,
        website_url: p.website_url,
        category: p.category,
      })) as LogoItem[];
    },
    staleTime: 1000 * 60 * 10,
  });

  // Also fetch culinary entities as additional partners (only for partners section)
  const { data: entities = [] } = useQuery({
    queryKey: ["section-entity-logos", sectionKey, itemCount],
    enabled: !isSponsors,
    queryFn: async () => {
      const { data } = await supabase
        .from("culinary_entities")
        .select("id, name, name_ar, logo_url, slug, is_verified")
        .eq("status", "active")
        .eq("is_visible", true)
        .not("logo_url", "is", null)
        .order("name")
        .limit(itemCount);
      return (data || []).map((e: any) => ({
        id: e.id,
        name: isAr ? e.name_ar || e.name : e.name,
        logo_url: e.logo_url,
        website_url: null,
        category: "entity",
      })) as LogoItem[];
    },
    staleTime: 1000 * 60 * 10,
  });

  const allLogos = isSponsors
    ? logos
    : [...logos, ...entities].slice(0, itemCount);

  if (allLogos.length === 0) return null;

  return (
    <section dir={isAr ? "rtl" : "ltr"}>
      <div className="container">
        <SectionHeader
          icon={SectionIcon}
          badge={defaultBadge}
          title={showTitle ? (title || defaultTitle) : defaultTitle}
          viewAllHref={showViewAll ? (isSponsors ? "/sponsors" : "/partners") : undefined}
          isAr={isAr}
        />

        <div
          className={cn(
            "grid gap-3",
            allLogos.length <= 4
              ? "grid-cols-2 sm:grid-cols-4"
              : "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
          )}
        >
          {allLogos.map((item) => {
            const Wrapper = item.website_url ? "a" : "div";
            const linkProps = item.website_url
              ? { href: item.website_url, target: "_blank", rel: "noopener noreferrer" }
              : {};

            return (
              <Wrapper
                key={item.id}
                {...linkProps}
                className={cn(
                  "group relative flex flex-col items-center justify-center gap-2 rounded-2xl border border-border/40 bg-card p-4 transition-all duration-300",
                  "hover:border-primary/20 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5",
                  "active:scale-[0.98] touch-manipulation",
                  "aspect-[4/3] sm:aspect-[3/2]"
                )}
              >
                <div className="flex h-10 sm:h-12 items-center justify-center">
                  <img
                    src={item.logo_url}
                    alt={item.name}
                    className="h-full max-w-[100px] sm:max-w-[120px] object-contain opacity-70 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0"
                    loading="lazy"
                  />
                </div>
                <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground text-center line-clamp-1 leading-tight transition-colors group-hover:text-foreground">
                  {item.name}
                </p>
                {item.website_url && (
                  <ExternalLink className="absolute top-2 end-2 h-3 w-3 text-muted-foreground/0 transition-all group-hover:text-muted-foreground/60" />
                )}
              </Wrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
});

export default StatsPartnersSection;

