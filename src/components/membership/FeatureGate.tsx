import { useHasFeature, useHasFeatureForUser } from "@/hooks/useMembershipFeatures";

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Conditionally renders children based on whether the current user's membership tier
 * has access to the specified feature code.
 */
export function FeatureGate({ feature, children, fallback = null }: FeatureGateProps) {
  const { hasFeature, isLoading } = useHasFeature(feature);

  if (isLoading) return <>{children}</>; // show while loading to avoid flash
  if (!hasFeature) return <>{fallback}</>;
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
