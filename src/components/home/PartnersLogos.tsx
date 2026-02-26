import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import { SectionReveal } from "@/components/ui/section-reveal";
import { cn } from "@/lib/utils";

export function PartnersLogos() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: partners = [] } = useQuery({
    queryKey: ["partner-logos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("partner_logos")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      return data || [];
    },
  });

  const grouped: Record<string, any[]> = {};
  partners.forEach((p: any) => {
    const cat = p.category || "partner";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  });

  const categoryLabels: Record<string, { en: string; ar: string }> = {
    government: { en: "Government Partners", ar: "شركاء حكوميون" },
    private: { en: "Private Sector", ar: "القطاع الخاص" },
    association: { en: "Associations", ar: "الجمعيات" },
    partner: { en: "Partners", ar: "الشركاء" },
  };

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

  const hasContent = partners.length > 0 || entities.length > 0;
  if (!hasContent) return null;

  return (
    <section className="py-8 md:py-12" aria-labelledby="partners-heading">
      <div className="container">
        <SectionReveal>
          <div className="mb-8 text-center">
            <Badge variant="secondary" className="mb-3">
              <Building2 className="me-1 h-3 w-3" />
              {isAr ? "الشركاء" : "Partners & Associations"}
            </Badge>
            <h2 id="partners-heading" className={cn("text-2xl font-bold sm:text-3xl", !isAr && "font-serif")}>
              {isAr ? "شركاؤنا ومؤسساتنا" : "Our Partners & Institutions"}
            </h2>
          </div>
        </SectionReveal>

        {Object.entries(grouped).map(([cat, items], idx) => (
          <SectionReveal key={cat} delay={idx * 100}>
            <div className="mb-8">
              <h3 className="mb-4 text-center text-sm font-medium text-muted-foreground">
                {isAr ? categoryLabels[cat]?.ar || cat : categoryLabels[cat]?.en || cat}
              </h3>
              <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
                {items.map((p: any) => (
                  <a
                    key={p.id}
                    href={p.website_url || "#"}
                    target={p.website_url ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center gap-2 opacity-70 transition-all duration-300 hover:opacity-100 hover:scale-105"
                  >
                    <img
                      src={p.logo_url}
                      alt={isAr && p.name_ar ? p.name_ar : p.name}
                      className="h-12 w-auto max-w-[120px] object-contain grayscale transition-all duration-300 group-hover:grayscale-0 sm:h-14"
                      loading="lazy"
                    />
                    <span className="text-[10px] text-muted-foreground">{isAr && p.name_ar ? p.name_ar : p.name}</span>
                  </a>
                ))}
              </div>
            </div>
          </SectionReveal>
        ))}

        {entities.length > 0 && (
          <SectionReveal delay={200}>
            <div>
              <h3 className="mb-4 text-center text-sm font-medium text-muted-foreground">
                {isAr ? "جهات الطهي المعتمدة" : "Verified Culinary Entities"}
              </h3>
              <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
                {entities.map((e: any) => (
                  <a
                    key={e.id}
                    href={`/entities/${e.slug}`}
                    className="group flex flex-col items-center gap-2 opacity-70 transition-all duration-300 hover:opacity-100 hover:scale-105"
                  >
                    {e.logo_url ? (
                      <img src={e.logo_url} alt={isAr && e.name_ar ? e.name_ar : e.name} className="h-12 w-auto max-w-[120px] object-contain grayscale transition-all duration-300 group-hover:grayscale-0 sm:h-14" loading="lazy" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-transform duration-300 group-hover:scale-110"><Building2 className="h-6 w-6 text-primary" /></div>
                    )}
                    <span className="text-[10px] text-muted-foreground">{isAr && e.name_ar ? e.name_ar : e.name}</span>
                  </a>
                ))}
              </div>
            </div>
          </SectionReveal>
        )}
      </div>
    </section>
  );
}
