import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ExhibitionSponsor } from "@/components/exhibitions/ExhibitionCard";

/**
 * Batch-fetch sponsors for all visible exhibitions in a single query.
 * Returns a Map keyed by exhibition ID.
 */
export function useExhibitionSponsors(exhibitionIds: string[]) {
  return useQuery({
    queryKey: ["exhibitionSponsors", exhibitionIds.sort().join(",")],
    queryFn: async () => {
      if (exhibitionIds.length === 0) return new Map<string, ExhibitionSponsor[]>();

      const { data } = await supabase
        .from("ad_section_sponsorships")
        .select("id, label, label_ar, logo_url, section_id, companies:company_id(name, name_ar, logo_url)")
        .in("section_id", exhibitionIds)
        .eq("section_type", "exhibition")
        .eq("is_active", true)
        .limit(100);

      const map = new Map<string, ExhibitionSponsor[]>();
      for (const row of data || []) {
        const sectionId = (row as any).section_id as string;
        const existing = map.get(sectionId) || [];
        existing.push(row as unknown as ExhibitionSponsor);
        map.set(sectionId, existing);
      }
      return map;
    },
    enabled: exhibitionIds.length > 0,
    staleTime: 1000 * 60 * 10,
  });
}
