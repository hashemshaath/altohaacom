import { CACHE } from "@/lib/queryConfig";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

/**
 * Checks if the current user is a supervisor (full platform admin).
 * Uses server-side RPC (is_admin) — cannot be bypassed client-side.
 */
export function useIsAdmin() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["isAdmin", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase.rpc("is_admin", { p_user_id: user.id });
      if (error) throw handleSupabaseError(error);
      return data as boolean;
    },
    enabled: !!user?.id,
    ...CACHE.medium,
  });
}

function useAdminStats() {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });

      const { count: activeMembers } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("account_status", "active");

      const { count: pendingReports } = await supabase
        .from("content_reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");

      return {
        totalUsers: totalUsers || 0,
        activeMembers: activeMembers || 0,
        pendingReports: pendingReports || 0,
      };
    },
    enabled: !!isAdmin,
    ...CACHE.realtime,
  });
}
