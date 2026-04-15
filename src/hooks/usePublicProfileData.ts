import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFollowStats, useIsFollowing, useToggleFollow, useFollowersList, useFollowPrivacy, usePendingFollowRequest } from "@/hooks/useFollow";
import { useUserSpecialties } from "@/hooks/useSpecialties";
import { useRecordProfileView } from "@/hooks/useProfileViews";
import { useEntityQRCode } from "@/hooks/useQRCode";
import type { Database } from "@/integrations/supabase/types";
import { CACHE } from "@/lib/queryConfig";
import { QUERY_LIMIT_LARGE } from "@/lib/constants";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface PublicProfileData {
  user_id: string;
  full_name: string | null;
  full_name_ar: string | null;
  display_name: string | null;
  display_name_ar: string | null;
  username: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  bio: string | null;
  bio_ar: string | null;
  city: string | null;
  country_code: string | null;
  nationality: string | null;
  account_type: string | null;
  specialization: string | null;
  specialization_ar: string | null;
  job_title: string | null;
  job_title_ar: string | null;
  years_of_experience: number | null;
  is_verified: boolean | null;
  membership_tier: string | null;
  view_count: number | null;
  instagram: string | null;
  twitter: string | null;
  facebook: string | null;
  linkedin: string | null;
  youtube: string | null;
  website: string | null;
  snapchat: string | null;
  tiktok: string | null;
  created_at: string | null;
}

export function usePublicProfileData(username: string | undefined, followListOpen: "followers" | "following" | null) {
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["publicProfile", username],
    queryFn: async () => {
      // Try by username first using secure RPC
      const { data, error } = await supabase.rpc("get_public_profile", { p_username: username!.toLowerCase() });
      if (error) throw handleSupabaseError(error);
      if (data) return data as unknown as PublicProfileData;

      // Fallback: try by user_id if it looks like a UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(username || "");
      if (isUuid) {
        const { data: byId, error: err2 } = await supabase.rpc("get_public_profile_by_id", { p_user_id: username! });
        if (err2) throw err2;
        if (byId) return byId as unknown as PublicProfileData;
      }
      throw new Error("Profile not found");
    },
    enabled: !!username,
    ...CACHE.short,
  });

  useRecordProfileView(profile?.user_id as string | undefined);

  const { data: qrCode } = useEntityQRCode("user", (profile?.username as string) || undefined, "account");

  const { data: roles } = useQuery({
    queryKey: ["publicProfileRoles", profile?.user_id],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", profile!.user_id);
      return data?.map(r => r.role) as AppRole[] || [];
    },
    enabled: !!profile?.user_id,
  });

  const { data: careerRecords = [] } = useQuery({
    queryKey: ["public-career-records", profile?.user_id],
    queryFn: async () => {
      const { data } = await supabase.from("user_career_records").select("id, user_id, record_type, title, title_ar, entity_name, entity_name_ar, description, description_ar, start_date, end_date, is_current, location, country_code, sort_order, department, department_ar, employment_type, education_level, field_of_study, field_of_study_ar, grade, entity_id").limit(QUERY_LIMIT_LARGE)
        .eq("user_id", profile!.user_id)
        .order("is_current", { ascending: false })
        .order("end_date", { ascending: false, nullsFirst: true })
        .order("start_date", { ascending: false });
      return data || [];
    },
    enabled: !!profile?.user_id,
  });

  const { data: memberships = [] } = useQuery({
    queryKey: ["public-memberships", profile?.user_id],
    queryFn: async () => {
      const { data } = await supabase.from("entity_memberships")
        .select("*, culinary_entities(name, name_ar, logo_url, type)")
        .eq("user_id", profile!.user_id).eq("status", "active");
      return data || [];
    },
    enabled: !!profile?.user_id,
  });

  const { data: userAwards = [] } = useQuery({
    queryKey: ["public-user-awards", profile?.user_id],
    queryFn: async () => {
      const { data } = await supabase.from("user_global_awards")
        .select("*, global_awards_system(*)").eq("user_id", profile!.user_id).eq("is_public", true);
      return data || [];
    },
    enabled: !!profile?.user_id,
  });

  const { data: mediaFiles = [] } = useQuery({
    queryKey: ["user-media-gallery", profile?.user_id],
    queryFn: async () => {
      const { data } = await supabase.storage.from("user-media").list(`${profile!.user_id}`, { limit: 20 });
      return (data || []).filter(f => f.name !== ".emptyFolderPlaceholder").map(f => {
        const { data: urlData } = supabase.storage.from("user-media").getPublicUrl(`${profile!.user_id}/${f.name}`);
        return { name: f.name, url: urlData.publicUrl };
      });
    },
    enabled: !!profile?.user_id,
  });

  const { data: followStats } = useFollowStats(profile?.user_id);
  const { data: isFollowing } = useIsFollowing(profile?.user_id);
  const toggleFollow = useToggleFollow(profile?.user_id);
  const { data: followersList = [] } = useFollowersList(followListOpen ? profile?.user_id : undefined, followListOpen || "followers");
  const { data: userSpecialties = [] } = useUserSpecialties(profile?.user_id);
  const { data: followPrivacy } = useFollowPrivacy(profile?.user_id);
  const { data: pendingRequest } = usePendingFollowRequest(profile?.user_id);

  return {
    profile, isLoading, error, qrCode, roles, careerRecords, memberships,
    userAwards, mediaFiles, followStats, isFollowing, toggleFollow,
    followersList, userSpecialties, followPrivacy, pendingRequest,
  };
}
