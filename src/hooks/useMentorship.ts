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
  // Joined profile data
  mentor_profile?: { full_name: string | null; avatar_url: string | null; specialization: string | null } | null;
  mentee_profile?: { full_name: string | null; avatar_url: string | null; specialization: string | null } | null;
  program?: { title: string; title_ar: string | null } | null;
}

export interface MentorshipSession {
  id: string;
  match_id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
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
  // Joined profile
  profile?: { full_name: string | null; avatar_url: string | null } | null;
}

export interface MenteeEnrollment {
  id: string;
  program_id: string;
  user_id: string;
  status: string;
  goals_description: string | null;
  experience_level: string | null;
  preferred_language: string | null;
  created_at: string;
  profile?: { full_name: string | null; avatar_url: string | null } | null;
}

// ─── Programs ──────────────────────────────────
export function useMentorshipPrograms(statusFilter?: string) {
  return useQuery({
    queryKey: ["mentorshipPrograms", statusFilter],
    queryFn: async () => {
      let q = supabase
        .from("mentorship_programs")
        .select("id, title, title_ar, description, description_ar, category, duration_weeks, max_matches, status, requirements, requirements_ar, cover_image_url, country_code, created_by, created_at, updated_at")
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
        .select("id, title, title_ar, description, description_ar, category, duration_weeks, max_matches, status, requirements, requirements_ar, cover_image_url, country_code, created_by, created_at, updated_at")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as MentorshipProgram | null;
    },
    enabled: !!id,
  });
}

// ─── Matches (with profile joins) ──────────────
export function useMyMentorshipMatches() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["myMentorshipMatches", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("mentorship_matches")
        .select("id, program_id, mentor_id, mentee_id, status, mentor_notes, mentee_notes, matched_at, started_at, completed_at, created_at")
        .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) return [] as MentorshipMatch[];

      // Fetch profiles
      const allIds = [...new Set(data.flatMap(m => [m.mentor_id, m.mentee_id]))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, specialization")
        .in("user_id", allIds);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      return data.map(m => ({
        ...m,
        mentor_profile: profileMap.get(m.mentor_id) || null,
        mentee_profile: profileMap.get(m.mentee_id) || null,
      })) as MentorshipMatch[];
    },
    enabled: !!user?.id,
  });
}

export function useMentorshipMatchDetails(matchId: string | undefined) {
  return useQuery({
    queryKey: ["mentorshipMatch", matchId],
    queryFn: async () => {
      if (!matchId) return null;
      // Try with profile joins
      const { data, error } = await supabase
        .from("mentorship_matches")
        .select("id, program_id, mentor_id, mentee_id, status, mentor_notes, mentee_notes, matched_at, started_at, completed_at, created_at")
        .eq("id", matchId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      // Fetch profiles separately for reliability
      const [mentorRes, menteeRes] = await Promise.all([
        supabase.from("profiles").select("full_name, avatar_url, specialization").eq("user_id", data.mentor_id).maybeSingle(),
        supabase.from("profiles").select("full_name, avatar_url, specialization").eq("user_id", data.mentee_id).maybeSingle(),
      ]);

      return {
        ...data,
        mentor_profile: mentorRes.data,
        mentee_profile: menteeRes.data,
      } as MentorshipMatch;
    },
    enabled: !!matchId,
  });
}

// ─── Sessions ──────────────────────────────────
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

// ─── Goals ─────────────────────────────────────
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

// ─── Mentor Application ───────────────────────
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

// ─── Mentee Enrollment ────────────────────────
export function useMyEnrollment(programId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["myEnrollment", programId, user?.id],
    queryFn: async () => {
      if (!user?.id || !programId) return null;
      const { data, error } = await supabase
        .from("mentee_enrollments")
        .select("*")
        .eq("program_id", programId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as MenteeEnrollment | null;
    },
    enabled: !!user?.id && !!programId,
  });
}

export function useEnrollAsMentee() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (data: { program_id: string; goals_description?: string; experience_level?: string }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase.from("mentee_enrollments").insert({
        user_id: user.id,
        ...data,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["myEnrollment", vars.program_id] });
      queryClient.invalidateQueries({ queryKey: ["allMenteeEnrollments"] });
    },
  });
}

// ─── Session mutations ────────────────────────
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

export function useUpdateSessionFeedback(matchId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ sessionId, feedback, rating, isMentor }: { sessionId: string; feedback: string; rating: number; isMentor: boolean }) => {
      const update: Record<string, any> = {};
      if (isMentor) {
        update.mentor_feedback = feedback;
        update.mentor_rating = rating;
      } else {
        update.mentee_feedback = feedback;
        update.mentee_rating = rating;
      }
      const { error } = await supabase.from("mentorship_sessions").update(update).eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentorshipSessions", matchId] });
    },
  });
}

export function useCompleteSession(matchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase.from("mentorship_sessions").update({ status: "completed" }).eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentorshipSessions", matchId] });
    },
  });
}

// ─── Goal mutations ───────────────────────────
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

// ─── Admin hooks ──────────────────────────────
export function useAllMentorApplications() {
  return useQuery({
    queryKey: ["allMentorApplications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentor_applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Fetch profiles for each application
      const userIds = (data || []).map(a => a.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      return (data || []).map(a => ({
        ...a,
        profile: profileMap.get(a.user_id) || null,
      })) as MentorApplication[];
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
      // Fetch profiles
      const allIds = [...new Set((data || []).flatMap(m => [m.mentor_id, m.mentee_id]))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, specialization")
        .in("user_id", allIds);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      return (data || []).map(m => ({
        ...m,
        mentor_profile: profileMap.get(m.mentor_id) || null,
        mentee_profile: profileMap.get(m.mentee_id) || null,
      })) as MentorshipMatch[];
    },
  });
}

export function useAllMenteeEnrollments() {
  return useQuery({
    queryKey: ["allMenteeEnrollments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentee_enrollments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const userIds = (data || []).map(e => e.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      return (data || []).map(e => ({
        ...e,
        profile: profileMap.get(e.user_id) || null,
      })) as MenteeEnrollment[];
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
      const { error } = await supabase.from("mentorship_matches").insert({
        ...data,
        matched_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allMentorshipMatches"] });
      queryClient.invalidateQueries({ queryKey: ["myMentorshipMatches"] });
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

// ─── Mentorship Analytics ─────────────────────
export function useMentorshipAnalytics() {
  return useQuery({
    queryKey: ["mentorshipAnalytics"],
    queryFn: async () => {
      const [programs, matches, applications, sessions, enrollments] = await Promise.all([
        supabase.from("mentorship_programs").select("id, status, created_at"),
        supabase.from("mentorship_matches").select("id, status, matched_at, completed_at"),
        supabase.from("mentor_applications").select("id, status, created_at"),
        supabase.from("mentorship_sessions").select("id, status, mentor_rating, mentee_rating"),
        supabase.from("mentee_enrollments").select("id, status, created_at"),
      ]);

      const matchesData = matches.data || [];
      const sessionsData = sessions.data || [];
      const completedSessions = sessionsData.filter(s => s.status === "completed");
      const avgMentorRating = completedSessions.filter(s => s.mentor_rating).reduce((s, c) => s + (c.mentor_rating || 0), 0) / (completedSessions.filter(s => s.mentor_rating).length || 1);
      const avgMenteeRating = completedSessions.filter(s => s.mentee_rating).reduce((s, c) => s + (c.mentee_rating || 0), 0) / (completedSessions.filter(s => s.mentee_rating).length || 1);

      return {
        totalPrograms: (programs.data || []).length,
        activePrograms: (programs.data || []).filter(p => p.status === "active").length,
        totalMatches: matchesData.length,
        activeMatches: matchesData.filter(m => m.status === "active" || m.status === "pending").length,
        completedMatches: matchesData.filter(m => m.status === "completed").length,
        totalApplications: (applications.data || []).length,
        pendingApplications: (applications.data || []).filter(a => a.status === "pending").length,
        totalSessions: sessionsData.length,
        completedSessions: completedSessions.length,
        avgMentorRating: Math.round(avgMentorRating * 10) / 10,
        avgMenteeRating: Math.round(avgMenteeRating * 10) / 10,
        totalEnrollments: (enrollments.data || []).length,
        pendingEnrollments: (enrollments.data || []).filter(e => e.status === "pending").length,
      };
    },
  });
}
