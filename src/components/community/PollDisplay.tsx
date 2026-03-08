import { useState, useEffect, memo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BarChart3, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface PollOption {
  id: string;
  option_text: string;
  sort_order: number;
  vote_count: number;
}

interface PollDisplayProps {
  postId: string;
}

export function PollDisplay({ postId }: PollDisplayProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [poll, setPoll] = useState<{ id: string; question: string | null; ends_at: string | null } | null>(null);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [userVoteOptionId, setUserVoteOptionId] = useState<string | null>(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    fetchPoll();
  }, [postId]);

  const fetchPoll = async () => {
    const { data: pollData } = await supabase
      .from("post_polls")
      .select("id, question, ends_at")
      .eq("post_id", postId)
      .maybeSingle();

    if (!pollData) return;
    setPoll(pollData);

    const { data: optionsData } = await supabase
      .from("post_poll_options")
      .select("id, option_text, sort_order")
      .eq("poll_id", pollData.id)
      .order("sort_order");

    const { data: votesData } = await supabase
      .from("post_poll_votes")
      .select("option_id, user_id")
      .eq("poll_id", pollData.id);

    const votesByOption = new Map<string, number>();
    let myVote: string | null = null;
    (votesData || []).forEach((v) => {
      votesByOption.set(v.option_id, (votesByOption.get(v.option_id) || 0) + 1);
      if (user && v.user_id === user.id) myVote = v.option_id;
    });

    const enriched = (optionsData || []).map((o) => ({
      ...o,
      vote_count: votesByOption.get(o.id) || 0,
    }));

    setOptions(enriched);
    setUserVoteOptionId(myVote);
    setTotalVotes(votesData?.length || 0);
  };

  const handleVote = async (optionId: string) => {
    if (!user || voting) return;
    setVoting(true);

    try {
      if (userVoteOptionId) {
        // Remove old vote
        await supabase
          .from("post_poll_votes")
          .delete()
          .eq("poll_id", poll!.id)
          .eq("user_id", user.id);
      }

      if (optionId !== userVoteOptionId) {
        await supabase.from("post_poll_votes").insert({
          poll_id: poll!.id,
          option_id: optionId,
          user_id: user.id,
        });
      }

      await fetchPoll();
    } finally {
      setVoting(false);
    }
  };

  if (!poll) return null;

  const hasVoted = !!userVoteOptionId;
  const isExpired = poll.ends_at && new Date(poll.ends_at) < new Date();
  const showResults = hasVoted || isExpired;

  return (
    <div className="mt-2 rounded-xl border border-border bg-muted/30 p-3 space-y-2" onClick={(e) => e.stopPropagation()}>
      {poll.question && (
        <p className="text-sm font-semibold flex items-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5 text-primary" />
          {poll.question}
        </p>
      )}
      <div className="space-y-1.5">
        {options.map((opt) => {
          const pct = totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0;
          const isMyVote = opt.id === userVoteOptionId;

          return (
            <button
              key={opt.id}
              onClick={() => !isExpired && handleVote(opt.id)}
              disabled={voting || !!isExpired}
              className={cn(
                "relative w-full rounded-xl border px-3 py-2 text-start text-sm transition-all overflow-hidden",
                isMyVote
                  ? "border-primary/40 bg-primary/5"
                  : "border-border hover:border-primary/20 hover:bg-muted/50",
                (voting || isExpired) && "cursor-default"
              )}
            >
              {showResults && (
                <div
                  className={cn(
                    "absolute inset-y-0 start-0 rounded-xl transition-all",
                    isMyVote ? "bg-primary/15" : "bg-muted/60"
                  )}
                  style={{ width: `${pct}%` }}
                />
              )}
              <div className="relative flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  {isMyVote && <Check className="h-3.5 w-3.5 text-primary" />}
                  {opt.option_text}
                </span>
                {showResults && (
                  <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                    <AnimatedCounter value={pct} className="inline" />%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground">
        <AnimatedCounter value={totalVotes} className="inline" /> {isAr ? "صوت" : totalVotes === 1 ? "vote" : "votes"}
        {isExpired && (isAr ? " · انتهى" : " · Ended")}
      </p>
    </div>
  );
}
