import { Navigate } from "react-router-dom";
import { useHasFeature } from "@/hooks/useMembershipFeatures";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface FeatureRouteGuardProps {
  feature: string;
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Route guard that blocks access to pages based on membership feature access.
 * Redirects to dashboard if feature is not available.
 */
export function FeatureRouteGuard({ feature, children, redirectTo = "/dashboard" }: FeatureRouteGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const { hasFeature, isLoading } = useHasFeature(feature);

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!hasFeature) return <Navigate to={redirectTo} replace />;

  return <>{children}</>;
}
