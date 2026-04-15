import { CACHE } from "@/lib/queryConfig";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

export interface LiveSession {
  id: string;
  host_id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  max_attendees: number | null;
  cover_image_url: string | null;
  host_name: string | null;
  host_avatar: string | null;
  attendee_count: number;
  is_registered: boolean;
}

interface CreateSessionInput {
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  scheduledAt: string;
  duration: string;
}

interface UseSessionsReturn {
  sessions: LiveSession[];
  pastSessions: LiveSession[];
  isLoading: boolean;
  createSession: (input: CreateSessionInput) => Promise<void>;
  isCreating: boolean;
  toggleRegistration: (sessionId: string, isRegistered: boolean) => void;
}

export function useLiveSessionsData(): UseSessionsReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["community-live-sessions", user?.id];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const now = new Date().toISOString();
      const sessionFields = "id, host_id, title, title_ar, description, description_ar, scheduled_at, duration_minutes, status, max_attendees, cover_image_url";

      const [upcomingRes, pastRes] = await Promise.all([
        supabase.from("live_sessions").select(sessionFields).in("status", ["scheduled", "live"]).gte("scheduled_at", now).order("scheduled_at", { ascending: true }).limit(20),
        supabase.from("live_sessions").select(sessionFields).eq("status", "ended").order("scheduled_at", { ascending: false }).limit(10),
      ]);

      const allData = [...(upcomingRes.data || []), ...(pastRes.data || [])];
      if (!allData.length) return { upcoming: [] as LiveSession[], past: [] as LiveSession[] };

      const hostIds = [...new Set(allData.map((s) => s.host_id))];
      const sessionIds = allData.map((s) => s.id);

      const [profilesRes, attendeesRes, userAttendeesRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", hostIds),
        supabase.from("live_session_attendees").select("session_id").in("session_id", sessionIds),
        user ? supabase.from("live_session_attendees").select("session_id").eq("user_id", user.id).in("session_id", sessionIds) : { data: [] },
      ]);

      const profileMap = new Map(profilesRes.data?.map((p) => [p.user_id, p]) || []);
      const countMap = new Map<string, number>();
      attendeesRes.data?.forEach((a) => countMap.set(a.session_id, (countMap.get(a.session_id) || 0) + 1));
      const registeredSet = new Set(userAttendeesRes.data?.map((a) => a.session_id) || []);

      type RawSession = NonNullable<typeof upcomingRes.data>[number];
      const enrich = (s: RawSession): LiveSession => {
        const host = profileMap.get(s.host_id);
        return { ...s, host_name: host?.full_name || null, host_avatar: host?.avatar_url || null, attendee_count: countMap.get(s.id) || 0, is_registered: registeredSet.has(s.id) };
      };

      return {
        upcoming: (upcomingRes.data || []).map(enrich),
        past: (pastRes.data || []).map(enrich),
      };
    },
    ...CACHE.short,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateSessionInput) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("live_sessions").insert({
        host_id: user.id, title: input.title.trim(),
        title_ar: input.titleAr.trim() || null, description: input.description.trim() || null,
        description_ar: input.descriptionAr.trim() || null,
        scheduled_at: new Date(input.scheduledAt).toISOString(),
        duration_minutes: parseInt(input.duration) || 60,
      });
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const registrationMutation = useMutation({
    mutationFn: async ({ sessionId, isRegistered }: { sessionId: string; isRegistered: boolean }) => {
      if (!user) throw new Error("Not authenticated");
      if (isRegistered) {
        await supabase.from("live_session_attendees").delete().eq("session_id", sessionId).eq("user_id", user.id);
      } else {
        await supabase.from("live_session_attendees").insert({ session_id: sessionId, user_id: user.id });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    sessions: data?.upcoming || [],
    pastSessions: data?.past || [],
    isLoading,
    createSession: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    toggleRegistration: (sessionId, isRegistered) => registrationMutation.mutate({ sessionId, isRegistered }),
  };
}
