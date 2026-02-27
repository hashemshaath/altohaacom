import { Navigate } from "react-router-dom";
import { useHasFeature } from "@/hooks/useMembershipFeatures";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { UpgradePrompt } from "./UpgradePrompt";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

interface FeatureRouteGuardProps {
  feature: string;
  children: React.ReactNode;
  redirectTo?: string;
  featureName?: string;
  featureNameAr?: string;
}

/**
 * Route guard that blocks access to pages based on membership feature access.
 * Shows an upgrade prompt if the feature is not available.
 */
export function FeatureRouteGuard({ feature, children, redirectTo, featureName, featureNameAr }: FeatureRouteGuardProps) {
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
  
  if (!hasFeature) {
    if (redirectTo) return <Navigate to={redirectTo} replace />;
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="container flex-1 flex items-center justify-center py-16">
          <div className="w-full max-w-md">
            <UpgradePrompt
              variant="card"
              featureName={featureName}
              featureNameAr={featureNameAr}
            />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return <>{children}</>;
}
