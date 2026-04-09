import { useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Tracks user login streaks and provides streak data.
 * Automatically updates streak on mount when user is authenticated.
 */
export function useLoginStreak() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: streak, isLoading } = useQuery({
    queryKey: ["user-streak", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_streaks")
        .select("id, user_id, current_streak, longest_streak, last_activity_date, streak_type, updated_at")
        .eq("user_id", user!.id)
        .eq("streak_type", "login")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const updateStreak = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const today = new Date().toISOString().split("T")[0];

      // Check existing streak
      const { data: existing } = await supabase
        .from("user_streaks")
        .select("id, current_streak, longest_streak, last_activity_date")
        .eq("user_id", user.id)
        .eq("streak_type", "login")
        .maybeSingle();

      if (!existing) {
        // Create new streak record
        await supabase.from("user_streaks").insert({
          user_id: user.id,
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: today,
          streak_type: "login",
        });
        return;
      }

      const lastLogin = existing.last_activity_date;
      if (lastLogin === today) return; // Already logged in today

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      let newStreak = 1;
      if (lastLogin === yesterdayStr) {
        newStreak = (existing.current_streak || 0) + 1;
      }

      await supabase
        .from("user_streaks")
        .update({
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, existing.longest_streak || 0),
          last_activity_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("streak_type", "login");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-streak"] });
    },
  });

  // Auto-update streak on mount (once per session)
  useEffect(() => {
    if (!user || isLoading) return;
    const today = new Date().toISOString().split("T")[0];
    if (!streak || streak.last_activity_date !== today) {
      updateStreak.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isLoading, streak?.last_activity_date]);

  return {
    currentStreak: streak?.current_streak || 0,
    longestStreak: streak?.longest_streak || 0,
    totalLogins: 0,
    multiplier: 1.0,
    isLoading,
  };
}
