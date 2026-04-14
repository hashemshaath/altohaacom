import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CACHE } from "@/lib/queryConfig";

export interface ProductQA {
  id: string;
  catalog_item_id: string;
  question: string;
  question_ar: string | null;
  answer: string | null;
  answer_ar: string | null;
  answered_by: string | null;
  answered_by_ar: string | null;
  is_visible: boolean;
  helpful_count: number;
  created_at: string;
}

export interface ProductTrustBadge {
  id: string;
  company_id: string | null;
  catalog_item_id: string | null;
  badge_type: string;
  label: string;
  label_ar: string | null;
  icon_name: string | null;
  color_class: string | null;
  is_active: boolean;
  sort_order: number;
}

export function useProductQA(catalogItemId: string | undefined) {
  return useQuery<ProductQA[]>({
    queryKey: ["product-qa", catalogItemId],
    enabled: !!catalogItemId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_qa")
        .select("*")
        .eq("catalog_item_id", catalogItemId!)
        .eq("is_visible", true)
        .order("helpful_count", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ProductQA[];
    },
    ...CACHE.medium,
  });
}

export function useProductTrustBadges(companyId: string | undefined, catalogItemId?: string) {
  return useQuery<ProductTrustBadge[]>({
    queryKey: ["product-trust-badges", companyId, catalogItemId],
    enabled: !!companyId,
    queryFn: async () => {
      let query = supabase
        .from("product_trust_badges")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      // Get company-level badges OR item-specific badges
      if (catalogItemId) {
        query = query.or(`company_id.eq.${companyId},catalog_item_id.eq.${catalogItemId}`);
      } else {
        query = query.eq("company_id", companyId!);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as ProductTrustBadge[];
    },
    ...CACHE.medium,
  });
}
