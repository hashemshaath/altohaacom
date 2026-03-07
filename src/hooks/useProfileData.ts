import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type AppRole = Database["public"]["Enums"]["app_role"];

/**
 * Centralized hook for the authenticated user's profile page.
 * Uses React Query for caching & deduplication instead of manual state.
 */
export function useProfileData() {
  const { user } = useAuth();

  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, full_name_ar, display_name, display_name_ar, username, email, email_verified, phone, phone_verified, avatar_url, cover_image_url, bio, bio_ar, account_type, account_status, account_number, country_code, city, location, nationality, second_nationality, gender, date_of_birth, job_title, job_title_ar, specialization, specialization_ar, experience_level, years_of_experience, education_level, education_institution, education_entity_id, interests, favorite_cuisines, preferred_language, profile_visibility, follow_privacy, section_visibility, show_nationality, is_verified, verification_level, verification_badge, verified_at, membership_tier, membership_status, membership_started_at, membership_expires_at, trial_tier, trial_started_at, trial_ends_at, trial_expired, loyalty_points, loyalty_tier, wallet_balance, offers_services, services_description, services_description_ar, company_id, company_role, login_method, last_login_at, password_last_changed, suspended_at, suspended_reason, profile_completed, view_count, global_awards, instagram, twitter, tiktok, snapchat, youtube, linkedin, facebook, website, whatsapp, secondary_email, created_at, updated_at")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["my-roles", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      return (data || []).map((r) => r.role) as AppRole[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  return {
    user,
    profile,
    roles,
    isLoading: profileLoading,
    refetchProfile,
  };
}
