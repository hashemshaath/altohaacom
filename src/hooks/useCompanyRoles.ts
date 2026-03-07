import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const COMPANY_ROLES = [
  { value: "sponsor", label: "Sponsor", labelAr: "راعي", color: "bg-chart-4/10 text-chart-4 border-chart-4/20" },
  { value: "supplier", label: "Supplier", labelAr: "مورد", color: "bg-primary/10 text-primary border-primary/20" },
  { value: "partner", label: "Partner", labelAr: "شريك", color: "bg-chart-3/10 text-chart-3 border-chart-3/20" },
  { value: "vendor", label: "Vendor", labelAr: "بائع", color: "bg-chart-5/10 text-chart-5 border-chart-5/20" },
  { value: "media", label: "Media", labelAr: "إعلام", color: "bg-chart-1/10 text-chart-1 border-chart-1/20" },
  { value: "logistics", label: "Logistics", labelAr: "لوجستيات", color: "bg-chart-2/10 text-chart-2 border-chart-2/20" },
] as const;

export interface CompanyRoleAssignment {
  id: string;
  company_id: string;
  role: string;
  is_active: boolean | null;
  assigned_at: string | null;
}

export function useCompanyRoles(companyId: string | null) {
  return useQuery({
    queryKey: ["companyRoles", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("company_role_assignments")
        .select("id, company_id, role, is_active, assigned_at")
        .eq("company_id", companyId)
        .order("assigned_at", { ascending: false });
      if (error) throw error;
      return (data || []) as CompanyRoleAssignment[];
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useActiveCompanyRoles(companyId: string | null) {
  const { data: roles = [] } = useCompanyRoles(companyId);
  return roles.filter(r => r.is_active).map(r => r.role);
}

export function useCompanyHasRole(companyId: string | null, role: string) {
  const activeRoles = useActiveCompanyRoles(companyId);
  return activeRoles.includes(role);
}

export function useAssignCompanyRole(companyId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (role: string) => {
      if (!companyId) throw new Error("No company");
      const { error } = await supabase.from("company_role_assignments").insert({
        company_id: companyId,
        role,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyRoles", companyId] });
    },
  });
}

export function useToggleCompanyRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active, companyId }: { id: string; is_active: boolean; companyId: string }) => {
      const { error } = await supabase
        .from("company_role_assignments")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
      return companyId;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["companyRoles", variables.companyId] });
    },
  });
}

export function useRemoveCompanyRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, companyId }: { id: string; companyId: string }) => {
      const { error } = await supabase
        .from("company_role_assignments")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return companyId;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["companyRoles", variables.companyId] });
    },
  });
}
