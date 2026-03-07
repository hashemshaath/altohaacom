import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOnlineStatus } from "@/hooks/usePWA";
import { cacheItems, flushOfflineQueue, getCacheStats } from "@/lib/offlineCache";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const SYNC_INTERVAL = 10 * 60 * 1000; // 10 minutes
const LAST_SYNC_KEY = "altoha_last_offline_sync";

/**
 * Automatically syncs key content to IndexedDB for offline access.
 * Also processes queued offline actions when connectivity returns.
 */
export function useOfflineSync() {
  const isOnline = useOnlineStatus();
  const { user } = useAuth();
  const syncingRef = useRef(false);

  const syncContent = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return;
    syncingRef.current = true;

    try {
      // Fetch key content in parallel
      const [compRes, artRes, recRes] = await Promise.allSettled([
        supabase
          .from("competitions")
          .select("id,title,title_ar,status,competition_start,competition_end,country_code,venue,venue_ar,cover_image_url,edition_year")
          .in("status", ["registration_open", "upcoming", "in_progress"])
          .order("competition_start", { ascending: false })
          .limit(50),
        supabase
          .from("articles")
          .select("id,title,title_ar,slug,excerpt,excerpt_ar,featured_image_url,type,published_at,status")
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(50),
        supabase
          .from("recipes")
          .select("id,title,title_ar,slug,description,description_ar,image_url,cuisine,difficulty,prep_time_minutes,cook_time_minutes,is_published")
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      const tasks: Promise<void>[] = [];

      if (compRes.status === "fulfilled" && compRes.value.data) {
        tasks.push(cacheItems("competitions", compRes.value.data as any));
      }
      if (artRes.status === "fulfilled" && artRes.value.data) {
        tasks.push(cacheItems("articles", artRes.value.data as any));
      }
      if (recRes.status === "fulfilled" && recRes.value.data) {
        tasks.push(cacheItems("recipes", recRes.value.data as any));
      }

      await Promise.all(tasks);
      localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    } catch {
      // Sync failed silently
    } finally {
      syncingRef.current = false;
    }
  }, []);

  const processQueue = useCallback(async () => {
    const actions = await flushOfflineQueue();
    if (actions.length === 0) return;

    let succeeded = 0;
    for (const action of actions) {
      try {
        if (action.type === "insert") {
          await (supabase.from(action.table as any) as any).insert(action.payload);
          succeeded++;
        } else if (action.type === "update" && action.payload.id) {
          const { id, ...rest } = action.payload;
          await (supabase.from(action.table as any) as any).update(rest).eq("id", id);
          succeeded++;
        }
      } catch {
        // Individual action failed
      }
    }

    if (succeeded > 0) {
      toast({
        title: `✅ ${succeeded} offline action${succeeded > 1 ? "s" : ""} synced`,
      });
    }
  }, []);

  // Sync on mount and periodically
  useEffect(() => {
    if (!isOnline) return;

    const lastSync = parseInt(localStorage.getItem(LAST_SYNC_KEY) || "0");
    const shouldSync = Date.now() - lastSync > SYNC_INTERVAL;

    if (shouldSync) {
      syncContent();
    }

    const interval = setInterval(syncContent, SYNC_INTERVAL);
    return () => clearInterval(interval);
  }, [isOnline, syncContent]);

  // Process offline queue when back online
  useEffect(() => {
    if (isOnline && user) {
      processQueue();
    }
  }, [isOnline, user, processQueue]);

  return { syncNow: syncContent, getCacheStats };
}
