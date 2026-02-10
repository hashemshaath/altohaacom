import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

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
      
      if (error) throw error;
      return data?.map(r => r.role) || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useHasRole(role: AppRole) {
  const { data: roles = [] } = useUserRoles();
  return roles.includes(role);
}

export function useIsJudge() {
  return useHasRole("judge");
}

export function useIsOrganizer() {
  const { data: roles = [] } = useUserRoles();
  return roles.includes("organizer") || roles.includes("supervisor");
}

// Re-export permission hooks for convenience
export { useHasPermission, useUserPermissions } from "./usePermissions";
