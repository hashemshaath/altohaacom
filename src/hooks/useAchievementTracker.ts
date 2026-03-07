import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export type TrackableAction =
  | "post_created"
  | "recipe_shared"
  | "competition_entered"
  | "review_written"
  | "follow_user"
  | "profile_completed"
  | "daily_login"
  | "masterclass_completed"
  | "recipe_bookmarked"
  | "exhibition_attended"
  | "comment_posted"
  | "badge_earned";

export function useAchievementTracker() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const trackAction = useCallback(
    async (action: TrackableAction, count: number = 1) => {
      if (!user?.id) return;

      try {
        // Get all active challenges matching this action
        const { data: challenges } = await supabase
          .from("challenges")
          .select("id, target_action, target_count, reward_points, reward_badge")
          .eq("is_active", true)
          .eq("target_action", action);

        if (!challenges?.length) return;

        for (const challenge of challenges) {
          // Upsert user_challenge progress
          const { data: existing } = await supabase
            .from("user_challenges")
            .select("id, progress, completed_at")
            .eq("user_id", user.id)
            .eq("challenge_id", challenge.id)
            .maybeSingle();

          if (existing?.completed_at) continue; // Already completed

          const newProgress = (existing?.progress || 0) + count;
          const isCompleted = newProgress >= (challenge.target_count || 1);

          if (existing) {
            await supabase
              .from("user_challenges")
              .update({
                progress: newProgress,
                completed_at: isCompleted ? new Date().toISOString() : null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existing.id);
          } else {
            await supabase.from("user_challenges").insert({
              user_id: user.id,
              challenge_id: challenge.id,
              progress: newProgress,
              completed_at: isCompleted ? new Date().toISOString() : null,
            });
          }

          // Award points on completion
          if (isCompleted && challenge.reward_points) {
            await supabase.rpc("award_points", {
              p_user_id: user.id,
              p_action_type: "challenge_completed",
              p_points: challenge.reward_points,
              p_description: `Challenge completed: ${challenge.target_action}`,
              p_description_ar: `تحدي مكتمل: ${challenge.target_action}`,
              p_reference_type: "challenge",
              p_reference_id: challenge.id,
            });

            // Dispatch custom event for celebration UI
            window.dispatchEvent(
              new CustomEvent("achievement-unlocked", {
                detail: {
                  type: "challenge",
                  challengeId: challenge.id,
                  points: challenge.reward_points,
                  badge: challenge.reward_badge,
                  action: challenge.target_action,
                },
              })
            );
          }
        }

        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ["userChallenges"] });
        queryClient.invalidateQueries({ queryKey: ["user-challenge-progress"] });
        queryClient.invalidateQueries({ queryKey: ["userTier"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-achievements"] });
      } catch (err) {
        console.error("Achievement tracking error:", err);
      }
    },
    [user?.id, queryClient]
  );

  return { trackAction };
}
