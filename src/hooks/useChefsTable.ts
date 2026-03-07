import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────

export type RequestStatus = "pending" | "approved" | "rejected" | "cancelled";
export type SessionStatus = "scheduled" | "in_progress" | "completed" | "cancelled";
export type InvitationStatus = "pending" | "accepted" | "declined" | "completed";
export type EvaluationStatus = "draft" | "submitted";
export type ExperienceType = "venue" | "chef_kitchen" | "sample_delivery";
export type RecommendationLevel = "highly_recommended" | "recommended" | "neutral" | "not_recommended";

export interface ChefsTableRequest {
  id: string;
  company_id: string;
  requested_by: string;
  request_number: string | null;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  product_name: string;
  product_name_ar: string | null;
  product_category: string;
  product_description: string | null;
  product_description_ar: string | null;
  product_images: string[];
  experience_type: ExperienceType;
  preferred_venue: string | null;
  preferred_venue_ar: string | null;
  preferred_city: string | null;
  preferred_country_code: string | null;
  preferred_date_start: string | null;
  preferred_date_end: string | null;
  budget: number;
  currency: string;
  chef_count: number;
  special_requirements: string | null;
  special_requirements_ar: string | null;
  status: RequestStatus;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChefsTableSession {
  id: string;
  request_id: string;
  company_id: string;
  session_number: string | null;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  product_name: string;
  product_name_ar: string | null;
  product_category: string;
  experience_type: ExperienceType;
  venue: string | null;
  venue_ar: string | null;
  city: string | null;
  country_code: string | null;
  session_date: string | null;
  session_end: string | null;
  cover_image_url: string | null;
  status: SessionStatus;
  organizer_id: string;
  chef_selection_method: string;
  max_chefs: number;
  sample_delivery_address: string | null;
  sample_delivery_notes: string | null;
  notes: string | null;
  notes_ar: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChefsTableInvitation {
  id: string;
  session_id: string;
  chef_id: string;
  invited_by: string;
  status: InvitationStatus;
  invitation_message: string | null;
  invitation_message_ar: string | null;
  response_message: string | null;
  responded_at: string | null;
  confirmed_at: string | null;
  declined_reason: string | null;
  sample_shipped_at: string | null;
  sample_tracking_number: string | null;
  cooking_date: string | null;
  cooking_location: string | null;
  cooking_location_ar: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChefsTableEvaluation {
  id: string;
  session_id: string;
  invitation_id: string;
  chef_id: string;
  taste_score: number | null;
  texture_score: number | null;
  aroma_score: number | null;
  versatility_score: number | null;
  value_score: number | null;
  presentation_score: number | null;
  overall_score: number | null;
  is_recommended: boolean | null;
  recommendation_level: RecommendationLevel;
  review_title: string | null;
  review_title_ar: string | null;
  review_text: string | null;
  review_text_ar: string | null;
  cooking_experience: string | null;
  cooking_experience_ar: string | null;
  dishes_prepared: string | null;
  dishes_prepared_ar: string | null;
  pros: string | null;
  pros_ar: string | null;
  cons: string | null;
  cons_ar: string | null;
  usage_suggestions: string | null;
  usage_suggestions_ar: string | null;
  endorsement_text: string | null;
  endorsement_text_ar: string | null;
  allow_publish: boolean;
  status: EvaluationStatus;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChefsTableMedia {
  id: string;
  session_id: string;
  evaluation_id: string | null;
  uploaded_by: string;
  media_type: string;
  media_url: string;
  thumbnail_url: string | null;
  title: string | null;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  sort_order: number;
  is_featured: boolean;
  created_at: string;
}

export interface ChefsTableCriteriaPreset {
  id: string;
  preset_name: string;
  preset_name_ar: string | null;
  product_category: string;
  criteria: Array<{
    name: string;
    name_ar: string;
    max_score: number;
    weight: number;
  }>;
  is_system: boolean;
  created_at: string;
}

// ─── Queries ────────────────────────────────────

export function useChefsTableSessions(statusFilter?: string) {
  return useQuery({
    queryKey: ["chefs-table-sessions", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("chefs_table_sessions" as any)
        .select("id, request_id, company_id, session_number, title, title_ar, product_name, product_name_ar, product_category, experience_type, venue, venue_ar, city, country_code, session_date, session_end, cover_image_url, status, organizer_id, max_chefs, is_published, created_at, updated_at")
        .order("created_at", { ascending: false });
      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as ChefsTableSession[];
    },
  });
}

export function useChefsTableSession(id: string | undefined) {
  return useQuery({
    queryKey: ["chefs-table-session", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chefs_table_sessions" as any)
        .select("id, request_id, company_id, session_number, title, title_ar, description, description_ar, product_name, product_name_ar, product_category, experience_type, venue, venue_ar, city, country_code, session_date, session_end, cover_image_url, status, organizer_id, chef_selection_method, max_chefs, sample_delivery_address, sample_delivery_notes, notes, notes_ar, is_published, published_at, created_at, updated_at")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as unknown as ChefsTableSession;
    },
    enabled: !!id,
  });
}

export function useChefsTableRequests() {
  return useQuery({
    queryKey: ["chefs-table-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chefs_table_requests" as any)
        .select("id, company_id, requested_by, request_number, title, title_ar, product_name, product_name_ar, product_category, experience_type, preferred_city, preferred_country_code, preferred_date_start, preferred_date_end, budget, currency, chef_count, status, admin_notes, reviewed_at, rejection_reason, created_at, updated_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ChefsTableRequest[];
    },
  });
}

export function useChefsTableInvitations(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["chefs-table-invitations", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chefs_table_invitations" as any)
        .select("id, session_id, chef_id, invited_by, status, invitation_message, response_message, responded_at, confirmed_at, declined_reason, sample_shipped_at, sample_tracking_number, cooking_date, cooking_location, cooking_location_ar, created_at, updated_at")
        .eq("session_id", sessionId!);
      if (error) throw error;
      return (data || []) as unknown as ChefsTableInvitation[];
    },
    enabled: !!sessionId,
  });
}

export function useChefsTableEvaluations(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["chefs-table-evaluations", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chefs_table_evaluations" as any)
        .select("id, session_id, invitation_id, chef_id, taste_score, texture_score, aroma_score, versatility_score, value_score, presentation_score, overall_score, is_recommended, recommendation_level, review_title, review_title_ar, review_text, review_text_ar, pros, pros_ar, cons, cons_ar, usage_suggestions, usage_suggestions_ar, endorsement_text, endorsement_text_ar, allow_publish, status, submitted_at, created_at, updated_at")
        .eq("session_id", sessionId!);
      if (error) throw error;
      return (data || []) as unknown as ChefsTableEvaluation[];
    },
    enabled: !!sessionId,
  });
}

export function useChefsTableMedia(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["chefs-table-media", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chefs_table_media" as any)
        .select("id, session_id, evaluation_id, uploaded_by, media_type, media_url, thumbnail_url, title, title_ar, description, description_ar, sort_order, is_featured, created_at")
        .eq("session_id", sessionId!)
        .order("sort_order");
      if (error) throw error;
      return (data || []) as unknown as ChefsTableMedia[];
    },
    enabled: !!sessionId,
  });
}

export function useChefsTableCriteriaPresets() {
  return useQuery({
    queryKey: ["chefs-table-criteria-presets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chefs_table_criteria_presets" as any)
        .select("*");
      if (error) throw error;
      return (data || []) as unknown as ChefsTableCriteriaPreset[];
    },
  });
}

export function useMyChefInvitations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-chef-invitations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chefs_table_invitations" as any)
        .select("*")
        .eq("chef_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ChefsTableInvitation[];
    },
    enabled: !!user?.id,
  });
}

// ─── Mutations ──────────────────────────────────

export function useCreateChefsTableRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (request: Partial<ChefsTableRequest>) => {
      const { data, error } = await supabase
        .from("chefs_table_requests" as any)
        .insert({ ...request, requested_by: user?.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ChefsTableRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chefs-table-requests"] });
    },
  });
}

export function useUpdateChefsTableSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ChefsTableSession> & { id: string }) => {
      const { data, error } = await supabase
        .from("chefs_table_sessions" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ChefsTableSession;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["chefs-table-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["chefs-table-session", data.id] });
    },
  });
}

export function useRespondToInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, response_message, declined_reason }: {
      id: string;
      status: "accepted" | "declined";
      response_message?: string;
      declined_reason?: string;
    }) => {
      const updates: any = {
        status,
        responded_at: new Date().toISOString(),
        ...(response_message && { response_message }),
        ...(declined_reason && { declined_reason }),
        ...(status === "accepted" && { confirmed_at: new Date().toISOString() }),
      };
      const { data, error } = await supabase
        .from("chefs_table_invitations" as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ChefsTableInvitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chefs-table-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["my-chef-invitations"] });
    },
  });
}

export function useSubmitEvaluation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (evaluation: Partial<ChefsTableEvaluation> & { session_id: string; invitation_id: string }) => {
      const { data, error } = await supabase
        .from("chefs_table_evaluations" as any)
        .upsert(
          { ...evaluation, chef_id: user?.id, status: "submitted", submitted_at: new Date().toISOString() } as any,
          { onConflict: "session_id,chef_id" }
        )
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ChefsTableEvaluation;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["chefs-table-evaluations", vars.session_id] });
    },
  });
}

export function useAddChefsTableMedia() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (media: Partial<ChefsTableMedia>) => {
      const { data, error } = await supabase
        .from("chefs_table_media" as any)
        .insert({ ...media, uploaded_by: user?.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ChefsTableMedia;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["chefs-table-media", vars.session_id] });
    },
  });
}

// ─── Admin Mutations ────────────────────────────

export function useApproveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, admin_notes }: { id: string; admin_notes?: string }) => {
      const { data, error } = await supabase.rpc("approve_chefs_table_request", {
        p_request_id: id,
        p_admin_notes: admin_notes || null,
      });
      if (error) throw error;
      return data as string; // session_id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chefs-table-requests"] });
      queryClient.invalidateQueries({ queryKey: ["chefs-table-sessions"] });
    },
  });
}

export function useRejectRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, rejection_reason }: { id: string; rejection_reason: string }) => {
      const { error } = await supabase.rpc("reject_chefs_table_request", {
        p_request_id: id,
        p_rejection_reason: rejection_reason,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chefs-table-requests"] });
    },
  });
}
