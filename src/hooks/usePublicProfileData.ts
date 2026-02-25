import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFollowStats, useIsFollowing, useToggleFollow, useFollowersList, useFollowPrivacy, usePendingFollowRequest } from "@/hooks/useFollow";
import { useUserSpecialties } from "@/hooks/useSpecialties";
import { useRecordProfileView } from "@/hooks/useProfileViews";
import { useEntityQRCode } from "@/hooks/useQRCode";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export function usePublicProfileData(username: string | undefined, followListOpen: "followers" | "following" | null) {
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["publicProfile", username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles_public").select("*").eq("username", username?.toLowerCase()).maybeSingle();
      if (error) throw error;
      if (data) return data;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(username || "");
      if (isUuid) {
        const { data: byId, error: err2 } = await supabase.from("profiles_public").select("*").eq("user_id", username).maybeSingle();
        if (err2) throw err2;
        if (byId) return byId;
      }
      throw new Error("Profile not found");
    },
    enabled: !!username,
  });

  useRecordProfileView(profile?.user_id);

  const { data: qrCode } = useEntityQRCode("user", profile?.username || undefined, "account");

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
      const { data } = await supabase.from("user_career_records").select("*")
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
