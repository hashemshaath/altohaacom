import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { CACHE } from "@/lib/queryConfig";

type AppRole = Database["public"]["Enums"]["app_role"];

export function useUserRoles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["userRoles", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      if (error) throw handleSupabaseError(error);
      return data?.map(r => r.role) || [];
    },
    enabled: !!user?.id,
    ...CACHE.medium,
  });
}

function useHasRole(role: AppRole) {
  const { data: roles = [] } = useUserRoles();
  return roles.includes(role);
}

function useIsJudge() {
  return useHasRole("judge");
}

function useIsOrganizer() {
  const { data: roles = [] } = useUserRoles();
  return roles.includes("organizer") || roles.includes("supervisor");
}

// Re-export permission hooks for convenience
;
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";
