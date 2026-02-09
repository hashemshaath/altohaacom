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
        .single();

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
        .select("*")
        .eq("id", companyId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5,
  });
}
