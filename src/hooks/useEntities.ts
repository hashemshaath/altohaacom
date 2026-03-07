import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

// === Programs ===
export function useEntityPrograms(entityId?: string) {
  return useQuery({
    queryKey: ["entity-programs", entityId],
    queryFn: async () => {
      const query = supabase
        .from("entity_programs")
        .select("*, culinary_entities(name, name_ar)")
        .order("start_date", { ascending: false });
      
      if (entityId) query.eq("entity_id", entityId);
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: entityId !== undefined,
  });
}

export function useEntityProgramEnrollments(programId?: string) {
  return useQuery({
    queryKey: ["program-enrollments", programId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entity_program_enrollments")
        .select("*, entity_programs(name, name_ar, entity_id)")
        .eq("program_id", programId!)
        .order("enrolled_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!programId,
  });
}

export function useMyEnrollments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-enrollments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entity_program_enrollments")
        .select("*, entity_programs(*, culinary_entities(name, name_ar, logo_url))")
        .eq("user_id", user!.id)
        .order("enrolled_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useEnrollInProgram() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (programId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("entity_program_enrollments")
        .insert({ program_id: programId, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["program-enrollments"] });
      toast({ title: "Enrolled successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

// === Memberships ===
export function useEntityMemberships(entityId?: string) {
  return useQuery({
    queryKey: ["entity-memberships", entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entity_memberships")
        .select("id, entity_id, user_id, membership_type, status, start_date, end_date, created_at")
        .eq("entity_id", entityId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!entityId,
  });
}

export function useMyMemberships() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-memberships", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entity_memberships")
        .select("*, culinary_entities(name, name_ar, logo_url, type)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

// === Degrees ===
export function useEntityDegrees(entityId?: string) {
  return useQuery({
    queryKey: ["entity-degrees", entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entity_degrees")
        .select("id, entity_id, user_id, degree_name, degree_name_ar, graduation_date, status, created_at")
        .eq("entity_id", entityId!)
        .order("graduation_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!entityId,
  });
}

export function useMyDegrees() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-degrees", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entity_degrees")
        .select("*, culinary_entities(name, name_ar, logo_url)")
        .eq("user_id", user!.id)
        .order("graduation_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

// === Entity Events ===
export function useEntityEvents(entityId?: string) {
  return useQuery({
    queryKey: ["entity-events", entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entity_events")
        .select("*")
        .eq("entity_id", entityId!)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!entityId,
  });
}

// === Competition Participations ===
export function useEntityCompetitions(entityId?: string) {
  return useQuery({
    queryKey: ["entity-competitions", entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entity_competition_participations")
        .select("*, competitions(title, title_ar, competition_start, status, country_code, cover_image_url)")
        .eq("entity_id", entityId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!entityId,
  });
}
