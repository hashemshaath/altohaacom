import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface NotificationProfile {
  user_id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

/**
 * Fetches profiles for notification senders based on metadata.
 * Extracts user IDs from notification metadata fields like follower_id, reactor_id, etc.
 */
export function useNotificationProfiles(notifications: Array<{ metadata?: any }>) {
  const [profiles, setProfiles] = useState<Map<string, NotificationProfile>>(new Map());

  useEffect(() => {
    const userIds = new Set<string>();
    for (const n of notifications) {
      const meta = n.metadata as Record<string, any> | null;
      if (!meta) continue;
      for (const key of ["follower_id", "reactor_id", "viewer_id", "attendee_id", "requester_id", "sender_id"]) {
        if (meta[key] && typeof meta[key] === "string") userIds.add(meta[key]);
      }
    }

    if (userIds.size === 0) return;

    const ids = Array.from(userIds);
    // Only fetch ones we don't already have
    const missing = ids.filter((id) => !profiles.has(id));
    if (missing.length === 0) return;

    supabase
      .from("profiles")
      .select("user_id, full_name, username, avatar_url")
      .in("user_id", missing)
      .then(({ data }) => {
        if (data) {
          setProfiles((prev) => {
            const next = new Map(prev);
            for (const p of data) next.set(p.user_id, p);
            return next;
          });
        }
      });
  }, [notifications]);

  const getProfile = (metadata: Record<string, any> | null | undefined): NotificationProfile | null => {
    if (!metadata) return null;
    for (const key of ["follower_id", "reactor_id", "viewer_id", "attendee_id", "requester_id", "sender_id"]) {
      if (metadata[key] && profiles.has(metadata[key])) return profiles.get(metadata[key])!;
    }
    return null;
  };

  return { profiles, getProfile };
}
