import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface MembershipFeature {
  id: string;
  code: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  category: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface FeatureTierMapping {
  id: string;
  feature_id: string;
  tier: string;
  is_enabled: boolean;
}

/** Fetch all membership features */
export function useMembershipFeatures() {
  return useQuery({
    queryKey: ["membershipFeatures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_features")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data as MembershipFeature[];
    },
    staleTime: 1000 * 60 * 10,
  });
}

/** Fetch all tier mappings */
export function useFeatureTierMappings() {
  return useQuery({
    queryKey: ["featureTierMappings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_feature_tiers")
        .select("*");
      if (error) throw error;
      return data as FeatureTierMapping[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

/** Fetch all features with their tier mappings (for admin) */
export function useAllMembershipFeatures() {
  return useQuery({
    queryKey: ["allMembershipFeatures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_features")
        .select("*, membership_feature_tiers(*)")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Check if current user has access to a specific feature based on their membership tier.
 * Returns { hasFeature, isLoading }
 */
export function useHasFeature(featureCode: string) {
  const { user } = useAuth();

  const { data: hasFeature = true, isLoading } = useQuery({
    queryKey: ["userFeatureAccess", user?.id, featureCode],
    queryFn: async () => {
      if (!user?.id) return false;

      // Get user's membership tier
      const { data: profile } = await supabase
        .from("profiles")
        .select("membership_tier")
        .eq("user_id", user.id)
        .single();

      const tier = profile?.membership_tier || "basic";

      // Check for user-specific override first
      const { data: override } = await supabase
        .from("membership_feature_overrides")
        .select("granted, membership_features!inner(code)")
        .eq("user_id", user.id)
        .eq("membership_features.code", featureCode)
        .maybeSingle();

      if (override) return override.granted;

      // Check tier mapping
      const { data: mapping } = await supabase
        .from("membership_feature_tiers")
        .select("is_enabled, membership_features!inner(code)")
        .eq("membership_features.code", featureCode)
        .eq("tier", tier)
        .maybeSingle();

      return mapping?.is_enabled ?? false;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  return { hasFeature, isLoading };
}

/**
 * Batch check: returns a Set of enabled feature codes for the current user.
 * More efficient than calling useHasFeature multiple times.
 */
export function useUserFeatures() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["userAllFeatures", user?.id],
    queryFn: async () => {
      if (!user?.id) return new Set<string>();

      // Get user's membership tier
      const { data: profile } = await supabase
        .from("profiles")
        .select("membership_tier")
        .eq("user_id", user.id)
        .single();

      const tier = profile?.membership_tier || "basic";

      // Get all active features
      const { data: features } = await supabase
        .from("membership_features")
        .select("id, code")
        .eq("is_active", true);

      if (!features) return new Set<string>();

      // Get tier mappings
      const { data: tierMappings } = await supabase
        .from("membership_feature_tiers")
        .select("feature_id, is_enabled")
        .eq("tier", tier);

      // Get user overrides
      const { data: overrides } = await supabase
        .from("membership_feature_overrides")
        .select("feature_id, granted")
        .eq("user_id", user.id);

      const enabledSet = new Set<string>();
      const tierMap = new Map(tierMappings?.map(m => [m.feature_id, m.is_enabled]) || []);
      const overrideMap = new Map(overrides?.map(o => [o.feature_id, o.granted]) || []);

      for (const feature of features) {
        const override = overrideMap.get(feature.id);
        if (override !== undefined) {
          if (override) enabledSet.add(feature.code);
          continue;
        }
        if (tierMap.get(feature.id)) {
          enabledSet.add(feature.code);
        }
      }

      return enabledSet;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
}
