import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MentorshipProgram {
  id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  category: string;
  duration_weeks: number | null;
  max_matches: number | null;
  status: string;
  requirements: string | null;
  requirements_ar: string | null;
  cover_image_url: string | null;
  country_code: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MentorshipMatch {
  id: string;
  program_id: string;
  mentor_id: string;
  mentee_id: string;
  status: string;
  mentor_notes: string | null;
  mentee_notes: string | null;
  matched_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface MentorshipSession {
  id: string;
  match_id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number | null;
  status: string;
  meeting_url: string | null;
  mentor_feedback: string | null;
  mentee_feedback: string | null;
  mentor_rating: number | null;
  mentee_rating: number | null;
  created_at: string;
}

export interface MentorshipGoal {
  id: string;
  match_id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  target_date: string | null;
  status: string;
  progress: number | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface MentorApplication {
  id: string;
  user_id: string;
  program_id: string | null;
  expertise: string[];
  bio: string | null;
  bio_ar: string | null;
  years_experience: number | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export function useMentorshipPrograms(statusFilter?: string) {
  return useQuery({
    queryKey: ["mentorshipPrograms", statusFilter],
    queryFn: async () => {
      let q = supabase
        .from("mentorship_programs")
        .select("*")
        .order("created_at", { ascending: false });
      if (statusFilter) q = q.eq("status", statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as MentorshipProgram[];
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useMentorshipProgram(id: string | undefined) {
  return useQuery({
    queryKey: ["mentorshipProgram", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("mentorship_programs")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as MentorshipProgram | null;
    },
    enabled: !!id,
  });
}

export function useMyMentorshipMatches() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["myMentorshipMatches", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("mentorship_matches")
        .select("*")
        .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as MentorshipMatch[];
    },
    enabled: !!user?.id,
  });
}

export function useMentorshipMatchDetails(matchId: string | undefined) {
  return useQuery({
    queryKey: ["mentorshipMatch", matchId],
    queryFn: async () => {
      if (!matchId) return null;
      const { data, error } = await supabase
        .from("mentorship_matches")
        .select("*")
        .eq("id", matchId)
        .maybeSingle();
      if (error) throw error;
      return data as MentorshipMatch | null;
    },
    enabled: !!matchId,
  });
}

export function useMentorshipSessions(matchId: string | undefined) {
  return useQuery({
    queryKey: ["mentorshipSessions", matchId],
    queryFn: async () => {
      if (!matchId) return [];
      const { data, error } = await supabase
        .from("mentorship_sessions")
        .select("*")
        .eq("match_id", matchId)
        .order("scheduled_at", { ascending: true });
      if (error) throw error;
      return (data || []) as MentorshipSession[];
    },
    enabled: !!matchId,
  });
}

export function useMentorshipGoals(matchId: string | undefined) {
  return useQuery({
    queryKey: ["mentorshipGoals", matchId],
    queryFn: async () => {
      if (!matchId) return [];
      const { data, error } = await supabase
        .from("mentorship_goals")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as MentorshipGoal[];
    },
    enabled: !!matchId,
  });
}

export function useMyMentorApplication() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["myMentorApplication", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("mentor_applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as MentorApplication | null;
    },
    enabled: !!user?.id,
  });
}

export function useApplyAsMentor() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (data: { program_id?: string; expertise: string[]; bio: string; years_experience: number }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase.from("mentor_applications").insert({
        user_id: user.id,
        ...data,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myMentorApplication"] });
    },
  });
}

export function useCreateSession(matchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; scheduled_at: string; duration_minutes?: number; description?: string; meeting_url?: string }) => {
      const { error } = await supabase.from("mentorship_sessions").insert({
        match_id: matchId,
        ...data,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentorshipSessions", matchId] });
    },
  });
}

export function useCreateGoal(matchId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (data: { title: string; description?: string; target_date?: string }) => {
      const { error } = await supabase.from("mentorship_goals").insert({
        match_id: matchId,
        created_by: user?.id,
        ...data,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentorshipGoals", matchId] });
    },
  });
}

export function useUpdateGoalProgress(matchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ goalId, progress, status }: { goalId: string; progress: number; status?: string }) => {
      const update: any = { progress };
      if (status) update.status = status;
      if (progress >= 100) {
        update.status = "completed";
        update.completed_at = new Date().toISOString();
      }
      const { error } = await supabase.from("mentorship_goals").update(update).eq("id", goalId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentorshipGoals", matchId] });
    },
  });
}

// Admin hooks
export function useAllMentorApplications() {
  return useQuery({
    queryKey: ["allMentorApplications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentor_applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as MentorApplication[];
    },
  });
}

export function useAllMentorshipMatches() {
  return useQuery({
    queryKey: ["allMentorshipMatches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentorship_matches")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as MentorshipMatch[];
    },
  });
}

export function useReviewApplication() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const { error } = await supabase
        .from("mentor_applications")
        .update({ status, reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allMentorApplications"] });
    },
  });
}

export function useCreateMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { program_id: string; mentor_id: string; mentee_id: string }) => {
      const { error } = await supabase.from("mentorship_matches").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allMentorshipMatches"] });
    },
  });
}

export function useCreateProgram() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (data: Partial<MentorshipProgram>) => {
      const { error } = await supabase.from("mentorship_programs").insert({
        title: data.title || "New Program",
        created_by: user?.id,
        ...data,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentorshipPrograms"] });
    },
  });
}

export function useUpdateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<MentorshipProgram> & { id: string }) => {
      const { error } = await supabase.from("mentorship_programs").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentorshipPrograms"] });
    },
  });
}
