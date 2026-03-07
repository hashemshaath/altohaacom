import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type EvalMethod = "numeric" | "stars" | "pass_fail";
export type SessionStatus = "draft" | "open" | "in_progress" | "completed" | "cancelled";

export interface TastingSession {
  id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  competition_id: string | null;
  organizer_id: string;
  eval_method: EvalMethod;
  status: SessionStatus;
  max_score: number | null;
  session_date: string | null;
  session_end: string | null;
  venue: string | null;
  venue_ar: string | null;
  city: string | null;
  country: string | null;
  country_code: string | null;
  cover_image_url: string | null;
  notes: string | null;
  is_blind_tasting: boolean | null;
  allow_notes: boolean | null;
  evaluation_category: string | null;
  evaluation_type: string | null;
  round: string | null;
  created_at: string;
  updated_at: string;
}

export interface TastingCriterion {
  id: string;
  session_id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  category: string | null;
  weight: number;
  max_score: number;
  sort_order: number;
  is_required: boolean | null;
  stage: string | null;
  guidelines: string | null;
  guidelines_ar: string | null;
  reference_images: string[] | null;
  eval_scale: string | null;
  created_at: string;
}

export interface TastingEntry {
  id: string;
  session_id: string;
  entry_number: number | null;
  dish_name: string;
  dish_name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  chef_name: string | null;
  chef_name_ar: string | null;
  chef_id: string | null;
  photo_url: string | null;
  category: string | null;
  is_active: boolean | null;
  sort_order: number | null;
  images: string[] | null;
  stage: string | null;
  created_at: string;
}

export interface TastingScore {
  id: string;
  session_id: string;
  entry_id: string;
  criterion_id: string;
  judge_id: string;
  score: number | null;
  stars: number | null;
  passed: boolean | null;
  note: string | null;
  note_ar: string | null;
  created_at: string;
  updated_at: string;
}

export interface CriteriaPreset {
  id: string;
  preset_name: string;
  preset_name_ar: string | null;
  category: string;
  criteria: Array<{
    name: string;
    name_ar: string;
    description?: string;
    max_score: number;
    weight: number;
  }>;
  is_system: boolean | null;
}

export interface TastingJudge {
  id: string;
  session_id: string;
  judge_id: string;
  assigned_at: string;
  has_completed: boolean | null;
  completed_at: string | null;
}

// ─── Queries ────────────────────────────────────

export function useTastingSessions() {
  return useQuery({
    queryKey: ["tasting-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasting_sessions" as any)
        .select("id, title, title_ar, description, description_ar, competition_id, organizer_id, eval_method, status, max_score, session_date, session_end, venue, venue_ar, city, country, country_code, cover_image_url, notes, is_blind_tasting, allow_notes, evaluation_category, evaluation_type, round, created_at, updated_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as TastingSession[];
    },
  });
}

export function useTastingSession(id: string | undefined) {
  return useQuery({
    queryKey: ["tasting-session", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasting_sessions" as any)
        .select("id, title, title_ar, description, description_ar, competition_id, organizer_id, eval_method, status, max_score, session_date, session_end, venue, venue_ar, city, country, country_code, cover_image_url, notes, is_blind_tasting, allow_notes, evaluation_category, evaluation_type, round, created_at, updated_at")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as unknown as TastingSession;
    },
    enabled: !!id,
  });
}

export function useTastingCriteria(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["tasting-criteria", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasting_criteria" as any)
        .select("id, session_id, name, name_ar, description, description_ar, category, weight, max_score, sort_order, is_required, stage, guidelines, guidelines_ar, reference_images, eval_scale, created_at")
        .eq("session_id", sessionId!)
        .order("sort_order");
      if (error) throw error;
      return (data || []) as unknown as TastingCriterion[];
    },
    enabled: !!sessionId,
  });
}

export function useTastingEntries(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["tasting-entries", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasting_entries" as any)
        .select("id, session_id, entry_number, dish_name, dish_name_ar, description, description_ar, chef_name, chef_name_ar, chef_id, photo_url, category, is_active, sort_order, images, stage, created_at")
        .eq("session_id", sessionId!)
        .order("sort_order");
      if (error) throw error;
      return (data || []) as unknown as TastingEntry[];
    },
    enabled: !!sessionId,
  });
}

export function useTastingScores(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["tasting-scores", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasting_scores" as any)
        .select("*")
        .eq("session_id", sessionId!);
      if (error) throw error;
      return (data || []) as unknown as TastingScore[];
    },
    enabled: !!sessionId,
  });
}

export function useCriteriaPresets() {
  return useQuery({
    queryKey: ["tasting-criteria-presets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasting_criteria_presets" as any)
        .select("*");
      if (error) throw error;
      return (data || []) as unknown as CriteriaPreset[];
    },
  });
}

export function useTastingJudges(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["tasting-judges", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasting_judges" as any)
        .select("*")
        .eq("session_id", sessionId!);
      if (error) throw error;
      return (data || []) as unknown as TastingJudge[];
    },
    enabled: !!sessionId,
  });
}

// ─── Mutations ──────────────────────────────────

export function useCreateTastingSession() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (session: Partial<TastingSession>) => {
      const { data, error } = await supabase
        .from("tasting_sessions" as any)
        .insert({ ...session, organizer_id: user?.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as TastingSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasting-sessions"] });
    },
  });
}

export function useUpdateTastingSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TastingSession> & { id: string }) => {
      const { data, error } = await supabase
        .from("tasting_sessions" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as TastingSession;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasting-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["tasting-session", data.id] });
    },
  });
}

export function useDeleteTastingSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tasting_sessions" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasting-sessions"] });
    },
  });
}

export function useSubmitScore() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (score: {
      session_id: string;
      entry_id: string;
      criterion_id: string;
      score?: number;
      stars?: number;
      passed?: boolean;
      note?: string;
    }) => {
      const { data, error } = await supabase
        .from("tasting_scores" as any)
        .upsert(
          { ...score, judge_id: user?.id } as any,
          { onConflict: "entry_id,criterion_id,judge_id" }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["tasting-scores", vars.session_id] });
    },
  });
}

export function useAddTastingEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: Partial<TastingEntry>) => {
      const { data, error } = await supabase
        .from("tasting_entries" as any)
        .insert(entry as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["tasting-entries", vars.session_id] });
    },
  });
}

export function useUpdateTastingEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TastingEntry> & { id: string }) => {
      const { data, error } = await supabase
        .from("tasting_entries" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as TastingEntry;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasting-entries", (data as any).session_id] });
    },
  });
}

export function useDeleteTastingEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, sessionId }: { id: string; sessionId: string }) => {
      const { error } = await supabase
        .from("tasting_entries" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
      return sessionId;
    },
    onSuccess: (sessionId) => {
      queryClient.invalidateQueries({ queryKey: ["tasting-entries", sessionId] });
    },
  });
}

export function useAddTastingCriteria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (criteria: Array<Partial<TastingCriterion>>) => {
      const { data, error } = await supabase
        .from("tasting_criteria" as any)
        .insert(criteria as any)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      const sessionId = vars[0]?.session_id;
      if (sessionId) queryClient.invalidateQueries({ queryKey: ["tasting-criteria", sessionId] });
    },
  });
}

export function useDeleteTastingCriterion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, sessionId }: { id: string; sessionId: string }) => {
      const { error } = await supabase
        .from("tasting_criteria" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
      return sessionId;
    },
    onSuccess: (sessionId) => {
      queryClient.invalidateQueries({ queryKey: ["tasting-criteria", sessionId] });
    },
  });
}
