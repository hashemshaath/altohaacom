import { useIsAr } from "@/hooks/useIsAr";
import { memo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart3, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { usePollDisplay } from "@/hooks/community/usePollDisplay";

interface PollDisplayProps {
  postId: string;
}

export const PollDisplay = memo(function PollDisplay({ postId }: PollDisplayProps) {
  const { user } = useAuth();
  const isAr = useIsAr();
  const { poll, isVoting, vote } = usePollDisplay(postId);

  if (!poll) return null;

  const hasVoted = !!poll.userVoteOptionId;
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
        {poll.options.map((opt) => {
          const pct = poll.totalVotes > 0 ? Math.round((opt.vote_count / poll.totalVotes) * 100) : 0;
          const isMyVote = opt.id === poll.userVoteOptionId;

          return (
            <button
              key={opt.id}
              onClick={() => !isExpired && vote(opt.id)}
              disabled={isVoting || !!isExpired}
              className={cn(
                "relative w-full rounded-xl border px-3 py-2 text-start text-sm transition-all overflow-hidden",
                isMyVote
                  ? "border-primary/40 bg-primary/5"
                  : "border-border hover:border-primary/20 hover:bg-muted/50",
                (isVoting || isExpired) && "cursor-default"
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
      <p className="text-xs text-muted-foreground">
        <AnimatedCounter value={poll.totalVotes} className="inline" /> {isAr ? "صوت" : poll.totalVotes === 1 ? "vote" : "votes"}
        {isExpired && (isAr ? " · انتهى" : " · Ended")}
      </p>
    </div>
  );
});
