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
        .from("user_streaks" as any)
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as any;
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
        .from("user_streaks" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existing) {
        // Create new streak record
        await (supabase.from("user_streaks" as any) as any).insert({
          user_id: user.id,
          current_streak: 1,
          longest_streak: 1,
          last_login_date: today,
          total_logins: 1,
          streak_multiplier: 1.0,
        });
        return;
      }

      const lastLogin = existing.last_login_date;
      if (lastLogin === today) return; // Already logged in today

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      let newStreak = 1;
      if (lastLogin === yesterdayStr) {
        newStreak = (existing.current_streak || 0) + 1;
      }

      // Calculate multiplier: 1.0 base, +0.1 per day up to 2.0x
      const multiplier = Math.min(2.0, 1.0 + (newStreak - 1) * 0.1);

      await (supabase.from("user_streaks" as any) as any)
        .update({
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, existing.longest_streak || 0),
          last_login_date: today,
          total_logins: (existing.total_logins || 0) + 1,
          streak_multiplier: Math.round(multiplier * 10) / 10,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-streak"] });
    },
  });

  // Auto-update streak on mount
  useEffect(() => {
    if (user && !isLoading) {
      const today = new Date().toISOString().split("T")[0];
      if (!streak || streak.last_login_date !== today) {
        updateStreak.mutate();
      }
    }
  }, [user?.id, isLoading]);

  return {
    currentStreak: streak?.current_streak || 0,
    longestStreak: streak?.longest_streak || 0,
    totalLogins: streak?.total_logins || 0,
    multiplier: streak?.streak_multiplier || 1.0,
    isLoading,
  };
}
