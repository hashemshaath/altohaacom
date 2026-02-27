import { useHasFeature } from "@/hooks/useMembershipFeatures";

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
