import { useHasFeature, useHasFeatureForUser } from "@/hooks/useMembershipFeatures";
import { UpgradePrompt } from "./UpgradePrompt";

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  /** Custom fallback. If not provided and showUpgrade is true, shows UpgradePrompt */
  fallback?: React.ReactNode;
  /** Show an upgrade prompt instead of hiding. Defaults to false (hidden) */
  showUpgrade?: boolean;
  /** Name of the feature for the upgrade prompt */
  featureName?: string;
  featureNameAr?: string;
  /** UpgradePrompt variant */
  upgradeVariant?: "inline" | "card" | "minimal";
}

/**
 * Conditionally renders children based on whether the current user's membership tier
 * has access to the specified feature code.
 */
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

  if (isLoading) return <>{children}</>; // show while loading to avoid flash
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

/**
 * Conditionally renders children based on whether a specific user's membership tier
 * has access to the specified feature. Useful for public profiles.
 */
export function FeatureGateForUser({ feature, userId, children, fallback = null }: FeatureGateForUserProps) {
  const { hasFeature, isLoading } = useHasFeatureForUser(feature, userId);

  if (isLoading) return <>{children}</>;
  if (!hasFeature) return <>{fallback}</>;
  return <>{children}</>;
}
