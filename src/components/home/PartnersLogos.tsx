import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Building2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "./SectionHeader";
import { HorizontalScrollRow } from "./HorizontalScrollRow";

export const PartnersLogos = memo(function PartnersLogos() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: partners = [] } = useQuery({
    queryKey: ["partner-logos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("partner_logos")
        .select("id, name, name_ar, logo_url, website_url, category, sort_order")
        .eq("is_active", true)
        .order("sort_order");
      return data || [];
    },
    staleTime: 1000 * 60 * 15,
  });

  const { data: entities = [] } = useQuery({
    queryKey: ["home-entity-logos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("culinary_entities")
        .select("id, name, name_ar, logo_url, slug, is_verified")
        .eq("is_verified", true)
        .order("name")
        .limit(12);
      return data || [];
    },
  });

  const allItems = [
    ...partners.map((p) => ({
      id: p.id,
      name: isAr && p.name_ar ? p.name_ar : p.name,
      logo: p.logo_url,
      href: p.website_url || "#",
      external: !!p.website_url,
      verified: false,
    })),
    ...entities.filter((e) => e.logo_url).map((e) => ({
      id: e.id,
      name: isAr && e.name_ar ? e.name_ar : e.name,
      logo: e.logo_url,
      href: `/entities/${e.slug}`,
      external: false,
      verified: e.is_verified,
    })),
  ];

  if (allItems.length === 0) return null;

  return (
    <section aria-labelledby="partners-heading" dir={isAr ? "rtl" : "ltr"}>
      <div className="container px-5 sm:px-6">
        <SectionHeader
          icon={Building2}
          badge={isAr ? "الشركاء" : "Partners & Associations"}
          title={isAr ? "شركاؤنا ومؤسساتنا" : "Our Partners & Institutions"}
          subtitle={isAr ? "نعمل مع أفضل المؤسسات لدعم مجتمع الطهي العالمي" : "We work with leading institutions to support the global culinary community"}
          dataSource="partner_logos • culinary_entities"
          itemCount={allItems.length}
          isAr={isAr}
        />

        <HorizontalScrollRow isAr={isAr}>
          {allItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              className="group flex flex-col items-center gap-2 snap-start shrink-0 w-[28vw] sm:w-[20vw] md:w-[14vw] lg:w-[10vw] touch-manipulation"
            >
              <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-muted/50 p-2.5 ring-1 ring-border/30 transition-all duration-300 group-hover:ring-primary/30 group-hover:shadow-md group-hover:scale-105">
                <img loading="lazy" src={item.logo}
                  alt={item.name}
                  className={cn(
                    "h-full w-full object-contain grayscale opacity-60 transition-all duration-300 group-hover:grayscale-0 group-hover:opacity-100"
                  )}
                 
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground font-medium text-center line-clamp-1">{item.name}</span>
                {item.verified && <CheckCircle className="h-2.5 w-2.5 shrink-0 text-chart-5" />}
              </div>
            </a>
          ))}
        </HorizontalScrollRow>
      </div>
    </section>
  );
});
