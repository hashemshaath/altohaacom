import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

/**
 * Pages the content_writer role can access in the admin panel.
 * Supervisor gets "*" (all pages).
 * Organizer gets competition/exhibition pages only.
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
  /** Whether the user is a full admin (supervisor ONLY) */
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
        .in("role", ["supervisor", "organizer", "content_writer"]);
      if (error) throw error;
      const roleList = roles?.map((r) => r.role) || [];
      // Priority: supervisor > organizer > content_writer
      if (roleList.includes("supervisor")) return "supervisor" as AppRole;
      if (roleList.includes("organizer")) return "organizer" as AppRole;
      if (roleList.includes("content_writer")) return "content_writer" as AppRole;
      return null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const adminRole = data ?? null;
  const isFullAdmin = adminRole === "supervisor";
  const isOrganizer = adminRole === "organizer";
  const isContentManager = adminRole === "supervisor" || adminRole === "content_writer";
  const hasAdminAccess = adminRole !== null;

  const canAccessPage = (path: string): boolean => {
    if (!hasAdminAccess) return false;
    if (isFullAdmin) return true;

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

  return { adminRole, isFullAdmin, isOrganizer, isContentManager, hasAdminAccess, canAccessPage, isLoading };
}
