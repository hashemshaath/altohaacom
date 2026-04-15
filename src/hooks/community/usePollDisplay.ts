import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PollOption {
  id: string;
  option_text: string;
  sort_order: number;
  vote_count: number;
}

interface PollData {
  id: string;
  question: string | null;
  ends_at: string | null;
  options: PollOption[];
  userVoteOptionId: string | null;
  totalVotes: number;
}

interface UsePollDisplayReturn {
  poll: PollData | null;
  isVoting: boolean;
  vote: (optionId: string) => void;
}

export function usePollDisplay(postId: string): UsePollDisplayReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["post-poll", postId, user?.id];

  const { data: poll = null } = useQuery({
    queryKey,
    queryFn: async (): Promise<PollData | null> => {
      const { data: pollData } = await supabase
        .from("post_polls").select("id, question, ends_at")
        .eq("post_id", postId).maybeSingle();
      if (!pollData) return null;

      const [optionsRes, votesRes] = await Promise.all([
        supabase.from("post_poll_options").select("id, option_text, sort_order").eq("poll_id", pollData.id).order("sort_order"),
        supabase.from("post_poll_votes").select("option_id, user_id").eq("poll_id", pollData.id),
      ]);

      const votesByOption = new Map<string, number>();
      let myVote: string | null = null;
      (votesRes.data || []).forEach((v) => {
        votesByOption.set(v.option_id, (votesByOption.get(v.option_id) || 0) + 1);
        if (user && v.user_id === user.id) myVote = v.option_id;
      });

      return {
        id: pollData.id,
        question: pollData.question,
        ends_at: pollData.ends_at,
        options: (optionsRes.data || []).map((o) => ({ ...o, vote_count: votesByOption.get(o.id) || 0 })),
        userVoteOptionId: myVote,
        totalVotes: votesRes.data?.length || 0,
      };
    },
    ...CACHE.short,
  });

  const voteMutation = useMutation({
    mutationFn: async (optionId: string) => {
      if (!user || !poll) throw new Error("Not authenticated");
      if (poll.userVoteOptionId) {
        await supabase.from("post_poll_votes").delete().eq("poll_id", poll.id).eq("user_id", user.id);
      }
      if (optionId !== poll.userVoteOptionId) {
        await supabase.from("post_poll_votes").insert({ poll_id: poll.id, option_id: optionId, user_id: user.id });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    poll,
    isVoting: voteMutation.isPending,
    vote: (optionId) => voteMutation.mutate(optionId),
  };
}
