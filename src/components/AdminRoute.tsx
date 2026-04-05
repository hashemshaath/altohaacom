import React from "react";
import { memo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";

/**
 * Strict admin-only route guard.
 * - supervisor/organizer: full access to all admin pages
 * - content_writer: access only to designated content pages
 * Uses server-side role check — cannot be bypassed client-side.
 */
export const AdminRoute = memo(function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { hasAdminAccess, canAccessPage, isLoading: adminLoading } = useAdminRole();
  const location = useLocation();

  if (authLoading || adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!hasAdminAccess) return <Navigate to="/dashboard" replace />;

  // Check page-level access for content_writer
  if (!canAccessPage(location.pathname)) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
});
