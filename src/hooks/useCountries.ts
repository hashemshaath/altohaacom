import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Country {
  code: string;
  name: string;
  name_ar: string | null;
  phone_code: string | null;
  phone_format: string | null;
  currency_code: string | null;
  supported_languages: string[] | null;
  is_active: boolean | null;
}

export function useCountries(activeOnly = true) {
  return useQuery({
    queryKey: ["countries", activeOnly],
    queryFn: async () => {
      let query = supabase
        .from("countries")
        .select("code, name, name_ar, phone_code, phone_format, currency_code, supported_languages, is_active")
        .order("name");

      if (activeOnly) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Country[];
    },
    staleTime: 1000 * 60 * 30,
  });
}

export function useAllCountries() {
  return useCountries(false);
}
