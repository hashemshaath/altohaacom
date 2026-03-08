import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";

interface SectionSponsorProps {
  sectionType: string;
  sectionId?: string;
}

export const SectionSponsor = memo(function SectionSponsor({ sectionType, sectionId }: SectionSponsorProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: sponsorship } = useQuery({
    queryKey: ["section-sponsor", sectionType, sectionId],
    queryFn: async () => {
      let query = supabase
        .from("ad_section_sponsorships")
        .select("*, companies(name, name_ar, logo_url)")
        .eq("section_type", sectionType)
        .eq("is_active", true)
        .lte("start_date", new Date().toISOString())
        .gte("end_date", new Date().toISOString());

      if (sectionId) {
        query = query.eq("section_id", sectionId);
      } else {
        query = query.is("section_id", null);
      }

      const { data } = await query.limit(1).maybeSingle();
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  if (!sponsorship) return null;

  const company = sponsorship.companies as any;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>{isAr ? sponsorship.label_ar : sponsorship.label}</span>
      {company?.logo_url && (
        <img src={company.logo_url} alt={isAr ? company.name_ar : company.name} className="h-5 w-auto" loading="lazy" />
      )}
      <span className="font-medium">{isAr ? company?.name_ar : company?.name}</span>
    </div>
  );
});
