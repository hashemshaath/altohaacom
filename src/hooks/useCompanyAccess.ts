import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function useCompanyAccess() {
  const { user } = useAuth();

  const { data: companyId, isLoading } = useQuery({
    queryKey: ["companyAccess", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("company_contacts")
        .select("company_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !data) return null;
      return data.company_id;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  return { companyId: companyId || null, isLoading };
}

export function useCompanyProfile(companyId: string | null) {
  return useQuery({
    queryKey: ["companyProfile", companyId],
    queryFn: async () => {
      if (!companyId) return null;

      const { data, error } = await supabase
        .from("companies")
        .select("id, name, name_ar, type, status, description, description_ar, logo_url, cover_image_url, email, phone, phone_secondary, fax, website, address, address_ar, street, street_ar, district, district_ar, neighborhood, neighborhood_ar, city, country, country_code, postal_code, national_address, national_address_ar, google_maps_url, latitude, longitude, registration_number, tax_number, company_number, founded_year, specializations, classifications, operating_countries, supplier_category, is_verified, verification_level, verified_at, is_pro_supplier, rating, supplier_score, total_reviews, total_orders, on_time_delivery_rate, response_time_hours, payment_terms, credit_limit, currency, tagline, tagline_ar, social_links, working_hours, featured_order, import_source, created_by, created_at, updated_at")
        .eq("id", companyId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5,
  });
}
