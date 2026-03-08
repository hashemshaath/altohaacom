import { memo } from "react";
import { Navigate } from "react-router-dom";
import { useAccountType } from "@/hooks/useAccountType";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

/**
 * Route guard that blocks fan accounts from accessing professional-only routes.
 * Redirects fans to the dashboard with a message.
 */
export const FanRouteGuard = memo(function FanRouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isFan, isLoading } = useAccountType();

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (isFan) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
