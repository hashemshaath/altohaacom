import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Define which portal pages each role can access
const ROLE_PAGE_ACCESS: Record<string, string[]> = {
  owner: ["*"], // All pages
  admin: ["*"], // All pages
  manager: [
    "dashboard", "profile", "team", "catalog", "orders", "invoices",
    "invitations", "sponsorships", "communications", "statements",
    "transactions", "evaluations", "media", "branches", "drivers",
    "working-hours", "advertising",
  ],
  editor: [
    "dashboard", "profile", "catalog", "orders", "communications",
    "media", "advertising",
  ],
  viewer: [
    "dashboard", "profile", "orders", "communications",
  ],
};

export function useCompanyContactRole() {
  const { user } = useAuth();
  const { companyId } = useCompanyAccess();

  return useQuery({
    queryKey: ["companyContactRole", companyId, user?.id],
    queryFn: async () => {
      if (!companyId || !user?.id) return null;
      const { data, error } = await supabase
        .from("company_contacts")
        .select("role, is_primary")
        .eq("company_id", companyId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error || !data) return null;
      return {
        role: (data as any).role || "viewer",
        isPrimary: data.is_primary || false,
      };
    },
    enabled: !!companyId && !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCanAccessPage(page: string): boolean {
  const { data: contactRole } = useCompanyContactRole();
  if (!contactRole) return true; // Loading state - allow access
  const role = contactRole.role;
  const allowedPages = ROLE_PAGE_ACCESS[role] || ROLE_PAGE_ACCESS.viewer;
  if (allowedPages.includes("*")) return true;
  return allowedPages.includes(page);
}

export function useCompanyPagePermissions() {
  const { data: contactRole } = useCompanyContactRole();
  const role = contactRole?.role || "viewer";
  const allowedPages = ROLE_PAGE_ACCESS[role] || ROLE_PAGE_ACCESS.viewer;
  
  return {
    role,
    isPrimary: contactRole?.isPrimary || false,
    canAccess: (page: string) => {
      if (allowedPages.includes("*")) return true;
      return allowedPages.includes(page);
    },
    canManageTeam: ["owner", "admin", "manager"].includes(role),
    canEditProfile: ["owner", "admin", "manager", "editor"].includes(role),
    canManageSettings: ["owner", "admin"].includes(role),
    isAdmin: ["owner", "admin"].includes(role),
  };
}
