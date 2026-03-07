import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

// ── Permissions ──────────────────────────────────────────

export function usePermissions() {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permissions")
        .select("id, code, name, name_ar, description, description_ar, category, created_at")
        .order("category")
        .order("code");
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useRolePermissions(role?: AppRole) {
  return useQuery({
    queryKey: ["rolePermissions", role],
    queryFn: async () => {
      let query = supabase
        .from("role_permissions")
        .select("*, permissions(*)");
      if (role) query = query.eq("role", role);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useUserPermissions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["userPermissions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get roles
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const userRoles = roles?.map((r) => r.role) || [];

      // Get permissions from roles
      const { data: rolePerms } = await supabase
        .from("role_permissions")
        .select("permissions(code)")
        .in("role", userRoles);

      const permCodes = new Set(
        rolePerms?.map((rp: any) => rp.permissions?.code).filter(Boolean) || []
      );

      // Get overrides
      const { data: overrides } = await supabase
        .from("user_permission_overrides")
        .select("granted, permissions(code)")
        .eq("user_id", user.id);

      overrides?.forEach((o: any) => {
        if (o.permissions?.code) {
          if (o.granted) {
            permCodes.add(o.permissions.code);
          } else {
            permCodes.delete(o.permissions.code);
          }
        }
      });

      return Array.from(permCodes);
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useHasPermission(permissionCode: string) {
  const { data: permissions = [] } = useUserPermissions();
  return permissions.includes(permissionCode);
}

// ── Competition Roles ────────────────────────────────────

export function useCompetitionRoles(competitionId?: string) {
  return useQuery({
    queryKey: ["competitionRoles", competitionId],
    queryFn: async () => {
      if (!competitionId) return [];
      const { data, error } = await supabase
        .from("competition_roles")
        .select("*, profiles:user_id(full_name, username, avatar_url, account_number)")
        .eq("competition_id", competitionId)
        .eq("status", "active");
      if (error) throw error;
      return data;
    },
    enabled: !!competitionId,
  });
}

export function useUserCompetitionRoles(competitionId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["userCompetitionRoles", competitionId, user?.id],
    queryFn: async () => {
      if (!user?.id || !competitionId) return [];
      const { data, error } = await supabase
        .from("competition_roles")
        .select("role")
        .eq("competition_id", competitionId)
        .eq("user_id", user.id)
        .eq("status", "active");
      if (error) throw error;
      return data?.map((r) => r.role) || [];
    },
    enabled: !!user?.id && !!competitionId,
  });
}

// ── User Titles ──────────────────────────────────────────

export function useUserTitles(userId?: string) {
  return useQuery({
    queryKey: ["userTitles", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_titles")
        .select("id, user_id, title, title_ar, title_type, issuing_body, issuing_body_ar, issued_date, expiry_date, is_verified, verified_by, verified_at, establishment_id, sort_order, created_at, updated_at")
        .eq("user_id", userId)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

// ── User Affiliations ────────────────────────────────────

export function useUserAffiliations(userId?: string) {
  return useQuery({
    queryKey: ["userAffiliations", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_affiliations")
        .select("*, establishments(*), companies(name, name_ar, logo_url)")
        .eq("user_id", userId)
        .order("is_current", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}
