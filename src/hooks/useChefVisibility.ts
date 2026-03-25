import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Check if the current user is a valid, visible chef.
 * A user qualifies as a visible chef when:
 * 1. They have the 'chef' role in user_roles
 * 2. Their account_type is 'professional'
 * 3. Their membership_tier is 'professional' or 'enterprise'
 * 4. Their account_status is 'active'
 *
 * The `is_chef_visible` column on profiles is auto-synced by DB triggers.
 */
export function useIsChefVisible() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["isChefVisible", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase
        .from("profiles")
        .select("is_chef_visible")
        .eq("user_id", user.id)
        .single();
      return data?.is_chef_visible ?? false;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Fetch only profiles that are valid visible chefs.
 * Used for chef directories, listings, and selection dropdowns.
 */
export function useVisibleChefs(options?: { limit?: number; enabled?: boolean }) {
  return useQuery({
    queryKey: ["visibleChefs", options?.limit],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("user_id, full_name, full_name_ar, username, avatar_url, specialization, specialization_ar, job_title, job_title_ar, country_code, city, years_of_experience, experience_level, is_verified, membership_tier")
        .eq("is_chef_visible", true)
        .eq("account_status", "active")
        .order("updated_at", { ascending: false });

      if (options?.limit) query = query.limit(options.limit);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 3,
  });
}
