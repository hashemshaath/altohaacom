import { useIsAr } from "@/hooks/useIsAr";
import { memo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useLanguage } from "@/i18n/LanguageContext";
import { ShieldX } from "lucide-react";

/**
 * Strict admin-only route guard.
 * - supervisor: full access to all admin pages
 * - admin: access to ADMIN_PAGES whitelist only
 * - organizer: access to competition/exhibition pages only
 * - content_writer: access only to designated content pages
 * Uses server-side role check — cannot be bypassed client-side.
 */
export const AdminRoute = memo(function AdminRoute({ children }: { children: React.ReactNode }) {
  const isAr = useIsAr();
  const { user, loading: authLoading } = useAuth();
  const { hasAdminAccess, canAccessPage, isSuperAdminOnlyPage, isLoading: adminLoading } = useAdminRole();
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

  // Check page-level access
  if (!canAccessPage(location.pathname)) {
    const isSuperOnly = isSuperAdminOnlyPage(location.pathname);
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-7 w-7 text-destructive" />
          </div>
          <h2 className="mb-2 text-lg font-bold text-foreground">
            {isAr ? "الوصول مقيّد" : "Access Restricted"}
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {isSuperOnly
              ? (isAr ? "هذه الصفحة متاحة فقط للمسؤول الأعلى (Super Admin)." : "This page is restricted to Super Admins only.")
              : (isAr ? "ليس لديك صلاحية للوصول إلى هذه الصفحة." : "You don't have permission to access this page.")}
          </p>
          <a href="/admin" className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            {isAr ? "العودة للوحة التحكم" : "Back to Dashboard"}
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
});
