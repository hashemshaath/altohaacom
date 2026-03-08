import { useEffect, useState, useCallback, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const ONLINE_THRESHOLD = 60000; // 60 seconds

/**
 * Hook to track and display user online status using Supabase Presence.
 */
export function usePresence() {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel("community-presence", {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const ids = new Set<string>();
        Object.keys(state).forEach((key) => ids.add(key));
        setOnlineUsers(ids);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
        }
      });

    // Heartbeat
    const interval = setInterval(() => {
      channel.track({ user_id: user.id, online_at: new Date().toISOString() });
    }, HEARTBEAT_INTERVAL);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const isOnline = useCallback((userId: string) => onlineUsers.has(userId), [onlineUsers]);

  return { onlineUsers, isOnline, onlineCount: onlineUsers.size };
}

interface OnlineDotProps {
  userId: string;
  className?: string;
}

/**
 * Green dot indicator showing if a user is currently online.
 */
export const OnlineDot = memo(function OnlineDot({ userId, className }: OnlineDotProps) {
  const { isOnline } = usePresence();

  if (!isOnline(userId)) return null;

  return (
    <span
      className={cn(
        "absolute bottom-0 end-0 h-2.5 w-2.5 rounded-full bg-chart-3 ring-2 ring-background",
        className
      )}
      title="Online"
    />
  );
}

interface OnlineCountBadgeProps {
  className?: string;
}

export function OnlineCountBadge({ className }: OnlineCountBadgeProps) {
  const { onlineCount } = usePresence();

  if (onlineCount <= 1) return null;

  return (
    <div className={cn("flex items-center gap-1.5 text-[10px] text-muted-foreground", className)}>
      <span className="h-2 w-2 rounded-full bg-chart-3 animate-pulse" />
      <span>{onlineCount} online</span>
    </div>
  );
}
