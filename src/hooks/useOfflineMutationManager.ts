/**
 * Offline mutation manager.
 *
 * When the browser goes offline, failed mutations are queued to IndexedDB.
 * When connectivity returns, queued actions are flushed and replayed.
 *
 * Usage: mount `<OfflineMutationManager />` once near the app root.
 */

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { flushOfflineQueue, queueOfflineAction } from "@/lib/offlineCache";
import { useToast } from "@/hooks/use-toast";

/**
 * Queue a mutation for later replay when the user is offline.
 * Call this from your mutation's `onError` when `!navigator.onLine`.
 */
export function enqueueOfflineMutation(
  table: string,
  type: "insert" | "update" | "upsert" | "delete",
  payload: Record<string, unknown>,
) {
  if (navigator.onLine) return; // only queue when actually offline
  queueOfflineAction({ type, table, payload });
}

/**
 * Hook that listens for online events and replays queued mutations.
 * Mount once in the app shell.
 */
export function useOfflineMutationManager() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const flushing = useRef(false);

  useEffect(() => {
    const flush = async () => {
      if (flushing.current) return;
      flushing.current = true;

      try {
        const actions = await flushOfflineQueue();
        if (actions.length === 0) return;

        let succeeded = 0;
        let failed = 0;

        for (const action of actions) {
          try {
            const table = action.table;
            const payload = action.payload;

            // Cast to `any` because table name is dynamic from the queue
            const db = supabase as any;
            switch (action.type) {
              case "insert": {
                const { error } = await db.from(table).insert(payload);
                if (error) throw error;
                break;
              }
              case "update": {
                const id = payload.id as string;
                const { id: _, ...rest } = payload;
                const { error } = await db.from(table).update(rest).eq("id", id);
                if (error) throw error;
                break;
              }
              case "upsert": {
                const { error } = await db.from(table).upsert(payload);
                if (error) throw error;
                break;
              }
              case "delete": {
                const { error } = await db.from(table).delete().eq("id", payload.id as string);
                if (error) throw error;
                break;
              }
            }
            succeeded++;
          } catch (err) {
            failed++;
            if (import.meta.env.DEV) {
              console.error("[OfflineFlush] Failed to replay action", action, err);
            }
          }
        }

        // Invalidate all queries so UI refreshes
        queryClient.invalidateQueries();

        if (succeeded > 0) {
          toast({
            title: `${succeeded} queued change${succeeded > 1 ? "s" : ""} synced`,
            description: failed > 0 ? `${failed} failed — please retry manually` : undefined,
          });
        }
      } finally {
        flushing.current = false;
      }
    };

    window.addEventListener("online", flush);
    // Also flush on mount in case we loaded with connectivity after a prior offline session
    if (navigator.onLine) flush();

    return () => window.removeEventListener("online", flush);
  }, [queryClient, toast]);
}
