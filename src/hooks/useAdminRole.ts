import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

type AppRole = Database["public"]["Enums"]["app_role"];

/**
 * ── SUPER ADMIN ONLY PAGES ──
 * These pages are strictly restricted to the supervisor role.
 * No other role (admin, organizer, content_writer) can access them.
 */
const SUPER_ADMIN_ONLY_PAGES = new Set([
  // Users & Identity
  "/admin/users",
  "/admin/roles",
  "/admin/verification",
  "/admin/memberships",
  "/admin/loyalty",
  "/admin/organizers",
  "/admin/mentorship",
  // Finance
  "/admin/orders",
  "/admin/invoices",
  "/admin/cost-center",
  // System
  "/admin/settings",
  "/admin/security",
  "/admin/localization",
  "/admin/countries",
  "/admin/integrations",
  // Tools
  "/admin/smart-import",
  "/admin/deduplication",
  "/admin/ai",
  "/admin/audit",
  "/admin/database",
  "/admin/data-import-export",
]);

/**
 * Pages the admin (non-super) role can access.
 * Super Admin (supervisor) gets "*" (all pages).
 */
const ADMIN_PAGES = new Set([
  "/admin",
  "/admin/analytics",
  // Organizations
  "/admin/companies",
  "/admin/establishments",
  // CRM & Marketing
  "/admin/crm",
  "/admin/leads",
  "/admin/audience-segments",
  "/admin/advertising",
  "/admin/marketing-automation",
  // Events & Competitions
  "/admin/exhibitions",
  "/admin/exhibition-stats",
  "/admin/competitions",
  "/admin/evaluation",
  "/admin/certificates",
  "/admin/chefs-table",
  "/admin/chef-schedule",
  "/admin/global-events",
  // Content & SEO
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
  // Communications
  "/admin/support-tickets",
  "/admin/live-chat",
  "/admin/communications",
  "/admin/templates",
  "/admin/notifications",
  // Design & Branding
  "/admin/design",
  "/admin/design/theme",
  "/admin/design/brand-identity",
  "/admin/design/header-footer",
  "/admin/design/layout",
  "/admin/design/custom-css",
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
  /** Check if a page is super-admin-only */
  isSuperAdminOnlyPage: (path: string) => boolean;
  /** Loading state */
  isLoading: boolean;
}

/** Check if path matches any page in set (exact or sub-path) */
function matchesSet(path: string, pages: Set<string>): boolean {
  if (pages.has(path)) return true;
  for (const allowed of pages) {
    if (path.startsWith(allowed + "/")) return true;
  }
  return false;
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
      if (error) throw handleSupabaseError(error);
      const roleList = (roles?.map((r) => r.role) || []) as string[];
      // Priority: supervisor > admin > organizer > content_writer
      if (roleList.includes("supervisor")) return "supervisor" as AppRole;
      if (roleList.includes("admin")) return "admin" as unknown as AppRole;
      if (roleList.includes("organizer")) return "organizer" as AppRole;
      if (roleList.includes("content_writer")) return "content_writer" as AppRole;
      return null;
    },
    enabled: !!user?.id,
    ...CACHE.medium,
  });

  const adminRole = data ?? null;
  const adminRoleStr = adminRole as unknown as string | null;
  const isSuperAdmin = adminRoleStr === "supervisor";
  const isFullAdmin = isSuperAdmin; // backward compat alias
  const isOrganizer = adminRoleStr === "organizer";
  const isContentManager = isSuperAdmin || adminRoleStr === "admin" || adminRoleStr === "content_writer";
  const hasAdminAccess = adminRole !== null;

  const isSuperAdminOnlyPage = (path: string): boolean => matchesSet(path, SUPER_ADMIN_ONLY_PAGES);

  const canAccessPage = (path: string): boolean => {
    if (!hasAdminAccess) return false;
    if (isSuperAdmin) return true;

    // Block super-admin-only pages for ALL non-supervisor roles
    if (isSuperAdminOnlyPage(path)) return false;

    // Admin role: whitelist check
    if (adminRoleStr === "admin") return matchesSet(path, ADMIN_PAGES);

    // Organizer: scoped pages only
    if (isOrganizer) return matchesSet(path, ORGANIZER_PAGES);

    // content_writer: scoped pages only
    return matchesSet(path, CONTENT_WRITER_PAGES);
  };

  return { adminRole, isSuperAdmin, isFullAdmin, isOrganizer, isContentManager, hasAdminAccess, canAccessPage, isSuperAdminOnlyPage, isLoading };
}
