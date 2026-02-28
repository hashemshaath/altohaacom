import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Hook for realtime message notifications with sound.
 * Plays a subtle notification sound when a new message arrives.
 */
export function useMessageNotificationSound() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Create audio element lazily
  const playSound = useCallback(() => {
    try {
      if (!audioRef.current) {
        // Use a data URL for a short notification beep (base64 encoded tiny MP3-like tone)
        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.frequency.value = 800;
        oscillator.type = "sine";
        gain.gain.value = 0.1;
        oscillator.start();
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        oscillator.stop(ctx.currentTime + 0.15);
      }
    } catch {
      // Audio not available (e.g. user hasn't interacted yet)
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("msg-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          playSound();
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          queryClient.invalidateQueries({ queryKey: ["messages"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, playSound, queryClient]);
}
