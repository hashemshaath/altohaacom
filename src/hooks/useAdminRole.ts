import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

/**
 * Pages the content_writer role can access in the admin panel.
 * Supervisor/organizer get "*" (all pages).
 */
const CONTENT_WRITER_PAGES = new Set([
  // Overview (dashboard only)
  "/admin",
  // Content & SEO
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
  // Organizations (view/edit entities)
  "/admin/companies",
  "/admin/establishments",
  // Localization (translation)
  "/admin/localization",
]);

export interface AdminAccess {
  /** The admin-level role, or null if not admin */
  adminRole: AppRole | null;
  /** Whether the user is a full admin (supervisor/organizer) */
  isFullAdmin: boolean;
  /** Whether the user has any admin access */
  hasAdminAccess: boolean;
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
  const isFullAdmin = adminRole === "supervisor" || adminRole === "organizer";
  const hasAdminAccess = adminRole !== null;

  const canAccessPage = (path: string): boolean => {
    if (!hasAdminAccess) return false;
    if (isFullAdmin) return true;
    // content_writer: check allowed pages
    // Match exact or prefix (for nested routes like /admin/users/123)
    if (CONTENT_WRITER_PAGES.has(path)) return true;
    // Check if path starts with any allowed prefix
    for (const allowed of CONTENT_WRITER_PAGES) {
      if (path.startsWith(allowed + "/")) return true;
    }
    return false;
  };

  return { adminRole, isFullAdmin, hasAdminAccess, canAccessPage, isLoading };
}
