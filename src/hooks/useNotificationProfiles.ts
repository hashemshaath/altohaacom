import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface NotificationProfile {
  user_id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

type NotificationMeta = Record<string, unknown> | null | undefined;

const SENDER_KEYS = ["follower_id", "reactor_id", "viewer_id", "attendee_id", "requester_id", "sender_id"] as const;

/**
 * Fetches profiles for notification senders based on metadata.
 * Extracts user IDs from notification metadata fields like follower_id, reactor_id, etc.
 */
export function useNotificationProfiles(notifications: Array<{ metadata?: unknown }>) {
  const [profiles, setProfiles] = useState<Map<string, NotificationProfile>>(new Map());
  const fetchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    const userIds = new Set<string>();
    for (const n of notifications) {
      const meta = n.metadata as NotificationMeta;
      if (!meta) continue;
      for (const key of SENDER_KEYS) {
        const val = meta[key];
        if (typeof val === "string" && val) userIds.add(val);
      }
    }

    if (userIds.size === 0) return;

    // Only fetch ones we haven't fetched before
    const missing = Array.from(userIds).filter((id) => !fetchedRef.current.has(id));
    if (missing.length === 0) return;

    // Mark as fetched immediately to avoid duplicate requests
    missing.forEach((id) => fetchedRef.current.add(id));

    supabase
      .from("profiles")
      .select("user_id, full_name, username, avatar_url")
      .in("user_id", missing)
      .then(({ data }) => {
        if (cancelled) return;
        if (data?.length) {
          setProfiles((prev) => {
            const next = new Map(prev);
            for (const p of data) next.set(p.user_id, p);
            return next;
          });
        }
      }, () => {
        // Remove from fetched so retry is possible
        missing.forEach((id) => fetchedRef.current.delete(id));
      });

    return () => { cancelled = true; };
  }, [notifications]);

  const getProfile = useCallback((metadata: NotificationMeta): NotificationProfile | null => {
    if (!metadata) return null;
    for (const key of SENDER_KEYS) {
      const val = metadata[key];
      if (typeof val === "string" && profiles.has(val)) return profiles.get(val)!;
    }
    return null;
  }, [profiles]);

  return { profiles, getProfile };
}
