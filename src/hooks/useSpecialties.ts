import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useApprovedSpecialties() {
  return useQuery({
    queryKey: ["specialties", "approved"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("specialties")
        .select("id, name, name_ar, slug, category")
        .eq("is_approved", true)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 30,
  });
}

export function useAllSpecialties() {
  return useQuery({
    queryKey: ["specialties", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("specialties")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useUserSpecialties(userId: string | undefined) {
  return useQuery({
    queryKey: ["userSpecialties", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_specialties")
        .select("id, specialty_id, specialties(id, name, name_ar, slug)")
        .eq("user_id", userId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
}

export function useApproveSpecialty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approvedBy }: { id: string; approvedBy: string }) => {
      const { error } = await supabase
        .from("specialties")
        .update({ is_approved: true, approved_by: approvedBy, approved_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["specialties"] }),
  });
}

export function useCreateSpecialty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (specialty: { name: string; name_ar?: string; slug: string; category?: string; created_by?: string; is_approved?: boolean }) => {
      const { data, error } = await supabase.from("specialties").insert(specialty).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["specialties"] }),
  });
}
