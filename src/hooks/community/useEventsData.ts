import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CACHE } from "@/lib/queryConfig";
import { QUERY_LIMIT_LARGE, QUERY_LIMIT_MEDIUM } from "@/lib/constants";

export interface CommunityEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  event_date: string | null;
  location: string | null;
  is_virtual: boolean;
  max_attendees: number | null;
  status: string;
  organizer_id: string;
  organizer_name: string | null;
  attendees_count: number;
  is_attending: boolean;
}

export interface Poll {
  id: string;
  question: string;
  options: { text: string }[];
  expires_at: string | null;
  is_active: boolean;
  author_id: string;
  author_name: string | null;
  votes: Record<number, number>;
  total_votes: number;
  user_vote: number | null;
}

interface CreateEventInput {
  title: string;
  description: string;
  event_date: string;
  location: string;
  is_virtual: boolean;
  max_attendees: string;
}

interface CreatePollInput {
  question: string;
  options: string[];
}

interface UseEventsDataReturn {
  events: CommunityEvent[];
  polls: Poll[];
  isLoading: boolean;
  createEvent: (input: CreateEventInput) => Promise<void>;
  createPoll: (input: CreatePollInput) => Promise<void>;
  isCreating: boolean;
  toggleAttendance: (eventId: string, isAttending: boolean) => void;
  votePoll: (pollId: string, optionIndex: number) => void;
  optimisticToggleAttendance: (eventId: string, isAttending: boolean) => void;
}

export function useEventsData(): UseEventsDataReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["community-events-polls", user?.id];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const [eventsRes, pollsRes] = await Promise.all([
        supabase.from("community_events").select("id, title, title_ar, description, description_ar, event_date, event_end_date, event_type, location, location_ar, is_virtual, max_attendees, organizer_id, status, image_url, created_at").order("event_date", { ascending: true }).limit(QUERY_LIMIT_LARGE),
        supabase.from("community_polls").select("id, question, question_ar, options, author_id, is_active, expires_at, created_at").eq("is_active", true).order("created_at", { ascending: false }).limit(QUERY_LIMIT_MEDIUM),
      ]);

      const eventIds = eventsRes.data?.map((e) => e.id) || [];
      const organizerIds = [...new Set(eventsRes.data?.map((e) => e.organizer_id) || [])];
      const pollAuthorIds = pollsRes.data?.map((p) => p.author_id) || [];

      const [profilesRes, attendeesRes, userAttendeesRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name").in("user_id", [...organizerIds, ...pollAuthorIds]),
        supabase.from("event_attendees").select("event_id").in("event_id", eventIds),
        user ? supabase.from("event_attendees").select("event_id").eq("user_id", user.id).in("event_id", eventIds) : { data: [] },
      ]);

      const profileMap = new Map(profilesRes.data?.map((p) => [p.user_id, p.full_name]) || []);
      const attendeesMap = new Map<string, number>();
      attendeesRes.data?.forEach((a) => attendeesMap.set(a.event_id, (attendeesMap.get(a.event_id) || 0) + 1));
      const userAttendingSet = new Set(userAttendeesRes.data?.map((a) => a.event_id) || []);

      const events: CommunityEvent[] = (eventsRes.data || []).map((e) => ({
        id: e.id, title: e.title, description: e.description, event_type: e.event_type,
        event_date: e.event_date, location: e.location, is_virtual: e.is_virtual || false,
        max_attendees: e.max_attendees, status: e.status || "upcoming",
        organizer_id: e.organizer_id, organizer_name: profileMap.get(e.organizer_id) || null,
        attendees_count: attendeesMap.get(e.id) || 0, is_attending: userAttendingSet.has(e.id),
      }));

      const pollIds = pollsRes.data?.map((p) => p.id) || [];
      const [votesRes, userVotesRes] = await Promise.all([
        supabase.from("poll_votes").select("poll_id, option_index").in("poll_id", pollIds),
        user ? supabase.from("poll_votes").select("poll_id, option_index").eq("user_id", user.id).in("poll_id", pollIds) : { data: [] },
      ]);

      const votesMap = new Map<string, Record<number, number>>();
      votesRes.data?.forEach((v) => {
        const existing = votesMap.get(v.poll_id) || {};
        existing[v.option_index] = (existing[v.option_index] || 0) + 1;
        votesMap.set(v.poll_id, existing);
      });
      const userVoteMap = new Map<string, number>();
      userVotesRes.data?.forEach((v) => userVoteMap.set(v.poll_id, v.option_index));

      const polls: Poll[] = (pollsRes.data || []).map((p) => {
        const votes = votesMap.get(p.id) || {};
        const totalVotes = Object.values(votes).reduce((s, n) => s + n, 0);
        return {
          id: p.id, question: p.question, options: (p.options as { text: string }[]) || [],
          expires_at: p.expires_at, is_active: p.is_active ?? true,
          author_id: p.author_id, author_name: profileMap.get(p.author_id) || null,
          votes, total_votes: totalVotes, user_vote: userVoteMap.get(p.id) ?? null,
        };
      });

      return { events, polls };
    },
    ...CACHE.short,
  });

  const createEventMutation = useMutation({
    mutationFn: async (input: CreateEventInput) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("community_events").insert({
        organizer_id: user.id, title: input.title.trim(),
        description: input.description.trim() || null, event_date: input.event_date || null,
        location: input.location.trim() || null, is_virtual: input.is_virtual,
        max_attendees: input.max_attendees ? parseInt(input.max_attendees) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const createPollMutation = useMutation({
    mutationFn: async (input: CreatePollInput) => {
      if (!user) throw new Error("Not authenticated");
      const options = input.options.filter(Boolean).map((text) => ({ text: text.trim() }));
      const { error } = await supabase.from("community_polls").insert({
        author_id: user.id, question: input.question.trim(), options,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const attendMutation = useMutation({
    mutationFn: async ({ eventId, isAttending }: { eventId: string; isAttending: boolean }) => {
      if (!user) throw new Error("Not authenticated");
      if (isAttending) {
        await supabase.from("event_attendees").delete().eq("event_id", eventId).eq("user_id", user.id);
      } else {
        await supabase.from("event_attendees").insert({ event_id: eventId, user_id: user.id });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const voteMutation = useMutation({
    mutationFn: async ({ pollId, optionIndex }: { pollId: string; optionIndex: number }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("poll_votes").insert({ poll_id: pollId, user_id: user.id, option_index: optionIndex });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const optimisticToggleAttendance = (eventId: string, isAttending: boolean) => {
    queryClient.setQueryData(queryKey, (old: typeof data) => {
      if (!old) return old;
      return {
        ...old,
        events: old.events.map((e) =>
          e.id === eventId
            ? { ...e, is_attending: !isAttending, attendees_count: isAttending ? e.attendees_count - 1 : e.attendees_count + 1 }
            : e
        ),
      };
    });
  };

  return {
    events: data?.events || [],
    polls: data?.polls || [],
    isLoading,
    createEvent: createEventMutation.mutateAsync,
    createPoll: createPollMutation.mutateAsync,
    isCreating: createEventMutation.isPending || createPollMutation.isPending,
    toggleAttendance: (eventId, isAttending) => attendMutation.mutate({ eventId, isAttending }),
    votePoll: (pollId, optionIndex) => voteMutation.mutate({ pollId, optionIndex }),
    optimisticToggleAttendance,
  };
}
