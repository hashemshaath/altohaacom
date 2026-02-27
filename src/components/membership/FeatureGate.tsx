import { useHasFeature, useHasFeatureForUser } from "@/hooks/useMembershipFeatures";
import { UpgradePrompt } from "./UpgradePrompt";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/** Fire-and-forget feature access log (debounced per feature per session) */
const loggedFeatures = new Set<string>();
function logFeatureAccess(featureCode: string, tier: string, blocked: boolean) {
  const key = `${featureCode}-${tier}-${blocked}`;
  if (loggedFeatures.has(key)) return;
  loggedFeatures.add(key);
  void (async () => {
    try {
      await supabase.rpc("log_feature_access", {
        p_feature_code: featureCode,
        p_tier: tier,
        p_was_blocked: blocked,
      });
    } catch {}
  })();
}

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
  featureName?: string;
  featureNameAr?: string;
  upgradeVariant?: "inline" | "card" | "minimal";
}

export function FeatureGate({
  feature,
  children,
  fallback,
  showUpgrade = false,
  featureName,
  featureNameAr,
  upgradeVariant = "inline",
}: FeatureGateProps) {
  const { hasFeature, isLoading } = useHasFeature(feature);
  const { user } = useAuth();
  const logged = useRef(false);

  useEffect(() => {
    if (isLoading || logged.current || !user) return;
    logged.current = true;
    // Get user tier for logging
    supabase
      .from("profiles")
      .select("membership_tier")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        const tier = data?.membership_tier || "basic";
        logFeatureAccess(feature, tier, !hasFeature);
      });
  }, [isLoading, hasFeature, feature, user]);

  if (isLoading) return <>{children}</>;
  if (!hasFeature) {
    if (fallback !== undefined) return <>{fallback}</>;
    if (showUpgrade) return <UpgradePrompt featureName={featureName} featureNameAr={featureNameAr} variant={upgradeVariant} />;
    return null;
  }
  return <>{children}</>;
}

interface FeatureGateForUserProps {
  feature: string;
  userId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGateForUser({ feature, userId, children, fallback = null }: FeatureGateForUserProps) {
  const { hasFeature, isLoading } = useHasFeatureForUser(feature, userId);

  if (isLoading) return <>{children}</>;
  if (!hasFeature) return <>{fallback}</>;
  return <>{children}</>;
}
