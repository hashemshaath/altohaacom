import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CACHE } from "@/lib/queryConfig";

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
        .select("id, code, name, name_ar, description, description_ar, category, icon, sort_order, is_active")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data as MembershipFeature[];
    },
    ...CACHE.long,
  });
}

/** Fetch all tier mappings */
export function useFeatureTierMappings() {
  return useQuery({
    queryKey: ["featureTierMappings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_feature_tiers")
        .select("id, feature_id, tier, is_enabled");
      if (error) throw error;
      return data as FeatureTierMapping[];
    },
    ...CACHE.medium,
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
    ...CACHE.medium,
  });
}

/** Shared hook for user's membership tier — single query cached across all consumers */
export function useUserMembershipTier(userId?: string) {
  return useQuery({
    queryKey: ["userMembershipTier", userId],
    queryFn: async () => {
      if (!userId) return "basic";
      const { data } = await supabase
        .from("profiles")
        .select("membership_tier")
        .eq("user_id", userId)
        .single();
      return data?.membership_tier || "basic";
    },
    enabled: !!userId,
    ...CACHE.long,
  });
}

/**
 * Check if current user has access to a specific feature based on their membership tier.
 * Returns { hasFeature, isLoading }
 */
export function useHasFeature(featureCode: string) {
  const { user } = useAuth();
  return useHasFeatureForUser(featureCode, user?.id);
}

/**
 * Check if a specific user has access to a feature based on their membership tier.
 * Uses shared tier cache to avoid duplicate DB queries.
 */
export function useHasFeatureForUser(featureCode: string, userId?: string) {
  const { data: tier, isLoading: tierLoading } = useUserMembershipTier(userId);

  const { data: hasFeature = true, isLoading: featureLoading } = useQuery({
    queryKey: ["userFeatureAccess", userId, featureCode, tier],
    queryFn: async () => {
      if (!userId || !tier) return false;

      // Check for user-specific override first
      const { data: override } = await supabase
        .from("membership_feature_overrides")
        .select("granted, membership_features!inner(code)")
        .eq("user_id", userId)
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
    enabled: !!userId && !!tier,
    ...CACHE.medium,
  });

  return { hasFeature, isLoading: tierLoading || featureLoading };
}

/**
 * Batch check: returns a Set of enabled feature codes for the current user.
 * More efficient than calling useHasFeature multiple times.
 */
export function useUserFeatures() {
  const { user } = useAuth();
  const { data: tier } = useUserMembershipTier(user?.id);

  return useQuery({
    queryKey: ["userAllFeatures", user?.id, tier],
    queryFn: async () => {
      if (!user?.id || !tier) return new Set<string>();

      // Get all active features
      const { data: features } = await supabase
        .from("membership_features")
        .select("id, code")
        .eq("is_active", true);

      if (!features) return new Set<string>();

      // Get tier mappings & overrides in parallel
      const [{ data: tierMappings }, { data: overrides }] = await Promise.all([
        supabase.from("membership_feature_tiers").select("feature_id, is_enabled").eq("tier", tier).limit(5000),
        supabase.from("membership_feature_overrides").select("feature_id, granted").eq("user_id", user.id).limit(5000),
      ]);

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
    enabled: !!user?.id && !!tier,
    ...CACHE.medium,
  });
}
