import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Subscribe to realtime updates for order center items and vendor assignments.
 * Automatically invalidates relevant queries and shows toast notifications.
 */
export function useRealtimeOrderUpdates(competitionId: string, enabled = true) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!enabled || !competitionId) return;

    const channel = supabase
      .channel(`order-realtime-${competitionId}`)
      // Listen for requirement list item changes (status, vendor assignment)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "requirement_list_items",
        },
        (payload) => {
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;

          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: ["vendor-items", competitionId] });
          queryClient.invalidateQueries({ queryKey: ["budget-items", competitionId] });
          queryClient.invalidateQueries({ queryKey: ["order-overview", competitionId] });

          // Toast for status changes
          if (oldRecord.status !== newRecord.status && newRecord.status === "delivered") {
            toast({
              title: "Item Delivered ✅",
              description: "An item has been marked as delivered.",
            });
          }

          // Toast for vendor assignment
          if (oldRecord.assigned_vendor_id !== newRecord.assigned_vendor_id && newRecord.assigned_vendor_id) {
            toast({
              title: "Vendor Assigned",
              description: "A vendor has been assigned to an item.",
            });
          }
        }
      )
      // Listen for new activity log entries
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_activity_log",
          filter: `competition_id=eq.${competitionId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["order-activity-log", competitionId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [competitionId, enabled, queryClient, toast]);
}
