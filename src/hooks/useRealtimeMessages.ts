import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

interface TypingState {
  userId: string;
  isTyping: boolean;
}

export function useRealtimeMessages(partnerId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [partnerTyping, setPartnerTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!user || !partnerId) return;

    const channel = supabase
      .channel(`chat:${[user.id, partnerId].sort().join("-")}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${partnerId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", user.id, partnerId] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload?.userId === partnerId) {
          setPartnerTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setPartnerTyping(false), 3000);
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [user, partnerId, queryClient]);

  const sendTypingIndicator = useCallback(() => {
    if (!user || !channelRef.current) return;
    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: user.id },
    });
  }, [user?.id]);

  return { partnerTyping, sendTypingIndicator };
}
