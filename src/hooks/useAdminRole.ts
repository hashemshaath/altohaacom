import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

/**
 * Pages the admin (non-super) role can access.
 * Super Admin (supervisor) gets "*" (all pages).
 */
const ADMIN_PAGES = new Set([
  "/admin",
  "/admin/analytics",
  "/admin/companies",
  "/admin/establishments",
  "/admin/crm",
  "/admin/leads",
  "/admin/audience-segments",
  "/admin/advertising",
  "/admin/marketing-automation",
  "/admin/exhibitions",
  "/admin/exhibition-stats",
  "/admin/competitions",
  "/admin/evaluation",
  "/admin/certificates",
  "/admin/chefs-table",
  "/admin/chef-schedule",
  "/admin/global-events",
  "/admin/articles",
  "/admin/design/homepage",
  "/admin/hero-slides",
  "/admin/auth-slides",
  "/admin/design/covers",
  "/admin/seo",
  "/admin/knowledge",
  "/admin/masterclasses",
  "/admin/media",
  "/admin/moderation",
  "/admin/qr-codes",
  "/admin/support-tickets",
  "/admin/live-chat",
  "/admin/communications",
  "/admin/templates",
  "/admin/notifications",
  "/admin/design",
  "/admin/design/theme",
  "/admin/design/brand-identity",
  "/admin/design/header-footer",
  "/admin/design/layout",
  "/admin/design/custom-css",
  "/admin/localization",
]);

/**
 * Pages the content_writer role can access in the admin panel.
 */
const CONTENT_WRITER_PAGES = new Set([
  "/admin",
  "/admin/articles",
  "/admin/knowledge",
  "/admin/masterclasses",
  "/admin/media",
  "/admin/moderation",
  "/admin/seo",
  "/admin/design/homepage",
  "/admin/hero-slides",
  "/admin/design/covers",
  "/admin/qr-codes",
  "/admin/companies",
  "/admin/establishments",
  "/admin/localization",
]);

const ORGANIZER_PAGES = new Set([
  "/admin",
  "/admin/competitions",
  "/admin/exhibitions",
  "/admin/chefs-table",
  "/admin/event-series",
]);

export interface AdminAccess {
  /** The admin-level role, or null if not admin */
  adminRole: AppRole | null;
  /** Whether the user is a Super Admin (supervisor) */
  isSuperAdmin: boolean;
  /** Whether the user is a full admin (supervisor ONLY) — alias for isSuperAdmin */
  isFullAdmin: boolean;
  /** Whether the user has any admin access */
  hasAdminAccess: boolean;
  /** Whether the user is an organizer (scoped access) */
  isOrganizer: boolean;
  /** Whether the user is a content manager */
  isContentManager: boolean;
  /** Check if a given admin path is accessible */
  canAccessPage: (path: string) => boolean;
  /** Loading state */
  isLoading: boolean;
}

export function useAdminRole(): AdminAccess {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["adminRole", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["supervisor", "admin" as unknown as AppRole, "organizer", "content_writer"]);
      if (error) throw error;
      const roleList = (roles?.map((r) => r.role) || []) as string[];
      // Priority: supervisor > admin > organizer > content_writer
      if (roleList.includes("supervisor")) return "supervisor" as AppRole;
      if (roleList.includes("admin")) return "admin" as unknown as AppRole;
      if (roleList.includes("organizer")) return "organizer" as AppRole;
      if (roleList.includes("content_writer")) return "content_writer" as AppRole;
      return null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const adminRole = data ?? null;
  const adminRoleStr = adminRole as unknown as string | null;
  const isSuperAdmin = adminRoleStr === "supervisor";
  const isFullAdmin = isSuperAdmin; // backward compat alias
  const isOrganizer = adminRoleStr === "organizer";
  const isContentManager = isSuperAdmin || adminRoleStr === "admin" || adminRoleStr === "content_writer";
  const hasAdminAccess = adminRole !== null;

  const canAccessPage = (path: string): boolean => {
    if (!hasAdminAccess) return false;
    if (isSuperAdmin) return true;

    // Admin role: access ADMIN_PAGES but not super-admin-only pages
    if (adminRoleStr === "admin") {
      if (ADMIN_PAGES.has(path)) return true;
      for (const allowed of ADMIN_PAGES) {
        if (path.startsWith(allowed + "/")) return true;
      }
      return false;
    }

    // Organizer: competition/exhibition pages only
    if (isOrganizer) {
      if (ORGANIZER_PAGES.has(path)) return true;
      for (const allowed of ORGANIZER_PAGES) {
        if (path.startsWith(allowed + "/")) return true;
      }
      return false;
    }

    // content_writer: check allowed pages
    if (CONTENT_WRITER_PAGES.has(path)) return true;
    for (const allowed of CONTENT_WRITER_PAGES) {
      if (path.startsWith(allowed + "/")) return true;
    }
    return false;
  };

  return { adminRole, isSuperAdmin, isFullAdmin, isOrganizer, isContentManager, hasAdminAccess, canAccessPage, isLoading };
}
