import { memo, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import { useSectionConfig } from "@/components/home/SectionKeyContext";
import { SectionReveal } from "@/components/ui/section-reveal";
import { Handshake, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LogoItem {
  id: string;
  name: string;
  logo_url: string;
  website_url: string | null;
  category: string;
}

/**
 * Infinite marquee row — CSS-only, no JS timers.
 * direction: "normal" scrolls left, "reverse" scrolls right.
 */
function MarqueeRow({ items, direction, isAr }: { items: LogoItem[]; direction: "normal" | "reverse"; isAr: boolean }) {
  if (items.length === 0) return null;

  // Duplicate items enough times for seamless loop
  const repeated = [...items, ...items, ...items, ...items];

  return (
    <div className="relative overflow-hidden py-3 group">
      {/* Gradient edge masks */}
      <div className="pointer-events-none absolute inset-y-0 start-0 z-10 w-16 sm:w-24 bg-gradient-to-r from-[inherit] to-transparent" style={{ background: "linear-gradient(to right, var(--marquee-bg, #F6F8FA), transparent)" }} aria-hidden="true" />
      <div className="pointer-events-none absolute inset-y-0 end-0 z-10 w-16 sm:w-24 bg-gradient-to-l from-[inherit] to-transparent" style={{ background: "linear-gradient(to left, var(--marquee-bg, #F6F8FA), transparent)" }} aria-hidden="true" />

      <div
        className={cn(
          "flex items-center gap-8 sm:gap-12 w-max",
          direction === "normal" ? "animate-marquee" : "animate-marquee-reverse"
        )}
        style={{ animationDuration: `${items.length * 4}s` }}
      >
        {repeated.map((item, i) => {
          const Wrapper = item.website_url ? "a" : "div";
          const linkProps = item.website_url
            ? { href: item.website_url, target: "_blank" as const, rel: "noopener noreferrer" }
            : {};

          return (
            <Wrapper
              key={`${item.id}-${i}`}
              {...linkProps}
              className="flex items-center gap-3 shrink-0 group/logo cursor-pointer px-2"
              title={item.name}
            >
              <div className="flex h-10 sm:h-12 w-24 sm:w-32 items-center justify-center">
                <img
                  src={item.logo_url}
                  alt={item.name}
                  className="h-full max-w-full object-contain grayscale opacity-50 transition-all duration-500 group-hover/logo:grayscale-0 group-hover/logo:opacity-100"
                  loading="lazy"
                />
              </div>
            </Wrapper>
          );
        })}
      </div>
    </div>
  );
}

const StatsPartnersSection = memo(function StatsPartnersSection() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const config = useSectionConfig();

  const sectionKey = config?.section_key || "sponsors";
  const isSponsors = sectionKey === "sponsors";
  const itemCount = config?.item_count || 24;

  const SectionIcon = isSponsors ? Award : Handshake;
  const heading = isSponsors
    ? (isAr ? "يثق بنا الرواد" : "Trusted by Leaders")
    : (isAr ? "شركاؤنا" : "Our Partners");
  const badgeText = isSponsors
    ? (isAr ? "الرعاة" : "Sponsors")
    : (isAr ? "شركاء النجاح" : "Partners");

  const { data: logos = [] } = useQuery({
    queryKey: ["section-logos", sectionKey, itemCount],
    queryFn: async () => {
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

      if (!data?.length) {
        const { data: allData } = await supabase
          .from("partner_logos")
          .select("id, name, name_ar, logo_url, website_url, category, sort_order, is_active")
          .eq("is_active", true)
          .order("sort_order")
          .limit(itemCount);
        return (allData || []).map((p) => ({
          id: p.id,
          name: isAr ? p.name_ar || p.name : p.name,
          logo_url: p.logo_url,
          website_url: p.website_url,
          category: p.category,
        })) as LogoItem[];
      }

      return (data || []).map((p) => ({
        id: p.id,
        name: isAr ? p.name_ar || p.name : p.name,
        logo_url: p.logo_url,
        website_url: p.website_url,
        category: p.category,
      })) as LogoItem[];
    },
    staleTime: 1000 * 60 * 10,
  });

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
      return (data || []).map((e) => ({
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

  // Split into two rows for dual-direction marquee
  const { row1, row2 } = useMemo(() => {
    const mid = Math.ceil(allLogos.length / 2);
    return { row1: allLogos.slice(0, mid), row2: allLogos.slice(mid) };
  }, [allLogos]);

  if (allLogos.length === 0) return null;

  return (
    <section
      dir={isAr ? "rtl" : "ltr"}
      className="relative"
      style={{ "--marquee-bg": "#F6F8FA" } as React.CSSProperties}
    >
      <div className="container px-5 sm:px-6">
        <SectionReveal>
          <div className="text-center mb-6 sm:mb-8">
            <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider mb-3">
              <SectionIcon className="h-3 w-3" />
              {badgeText}
            </Badge>
            <h2 className={cn(
              "text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tracking-tight",
              !isAr && "font-serif"
            )}>
              {heading}
            </h2>
          </div>
        </SectionReveal>
      </div>

      {/* Full-width marquee rows */}
      <div className="w-full">
        <MarqueeRow items={row1} direction="normal" isAr={isAr} />
        {row2.length > 0 && (
          <MarqueeRow items={row2} direction="reverse" isAr={isAr} />
        )}
      </div>
    </section>
  );
});

export default StatsPartnersSection;
