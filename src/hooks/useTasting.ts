import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CACHE } from "@/lib/queryConfig";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const untypedFrom = (table: string) => supabase.from(table as any) as any;

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
  sort_order: number;
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

const SESSION_COLS = "id, title, title_ar, description, description_ar, competition_id, organizer_id, eval_method, status, max_score, session_date, session_end, venue, venue_ar, city, country, country_code, cover_image_url, notes, is_blind_tasting, allow_notes, evaluation_category, evaluation_type, round, created_at, updated_at" as const;
const CRITERIA_COLS = "id, session_id, name, name_ar, description, description_ar, category, weight, max_score, sort_order, is_required, stage, guidelines, guidelines_ar, reference_images, eval_scale, created_at" as const;
const ENTRY_COLS = "id, session_id, entry_number, dish_name, dish_name_ar, description, description_ar, chef_name, chef_name_ar, chef_id, photo_url, category, is_active, sort_order, images, stage, created_at" as const;
const SCORE_COLS = "id, session_id, entry_id, criterion_id, judge_id, score, stars, passed, note, note_ar, created_at, updated_at" as const;

// ─── Queries ────────────────────────────────────

export function useTastingSessions() {
  return useQuery({
    queryKey: ["tasting-sessions"],
    queryFn: async () => {
      const { data, error } = await untypedFrom("tasting_sessions")
        .select(SESSION_COLS)
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
      const { data, error } = await untypedFrom("tasting_sessions")
        .select(SESSION_COLS)
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as unknown as TastingSession;
    },
    enabled: !!id,
    ...CACHE.short,
  });
}

export function useTastingCriteria(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["tasting-criteria", sessionId],
    queryFn: async () => {
      const { data, error } = await untypedFrom("tasting_criteria")
        .select(CRITERIA_COLS)
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
      const { data, error } = await untypedFrom("tasting_entries")
        .select(ENTRY_COLS)
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
      const { data, error } = await untypedFrom("tasting_scores")
        .select(SCORE_COLS)
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
      const { data, error } = await untypedFrom("tasting_criteria_presets")
        .select("id, preset_name, preset_name_ar, category, criteria, is_system");
      if (error) throw error;
      return (data || []) as unknown as CriteriaPreset[];
    },
  });
}

export function useTastingJudges(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["tasting-judges", sessionId],
    queryFn: async () => {
      const { data, error } = await untypedFrom("tasting_judges")
        .select("id, session_id, judge_id, assigned_at, has_completed, completed_at")
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
      const { data, error } = await untypedFrom("tasting_sessions")
        .insert({ ...session, organizer_id: user?.id } as Record<string, unknown>)
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
      const { data, error } = await untypedFrom("tasting_sessions")
        .update(updates as Record<string, unknown>)
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
      const { error } = await untypedFrom("tasting_sessions")
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
      const { data, error } = await untypedFrom("tasting_scores")
        .upsert(
          { ...score, judge_id: user?.id } as Record<string, unknown>,
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
      const { data, error } = await untypedFrom("tasting_entries")
        .insert(entry as Record<string, unknown>)
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
      const { data, error } = await untypedFrom("tasting_entries")
        .update(updates as Record<string, unknown>)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as TastingEntry;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasting-entries", data.session_id] });
    },
  });
}

export function useDeleteTastingEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, sessionId }: { id: string; sessionId: string }) => {
      const { error } = await untypedFrom("tasting_entries")
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
      const { data, error } = await untypedFrom("tasting_criteria")
        .insert(criteria as Record<string, unknown>[])
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
      const { error } = await untypedFrom("tasting_criteria")
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
