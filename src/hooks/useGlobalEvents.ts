import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GlobalEventRecord {
  id: string;
  type: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  start_date: string;
  end_date: string | null;
  all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  timezone: string;
  city: string | null;
  country_code: string | null;
  venue: string | null;
  venue_ar: string | null;
  organizer: string | null;
  organizer_ar: string | null;
  link: string | null;
  image_url: string | null;
  is_international: boolean;
  is_recurring: boolean;
  recurrence_rule: string | null;
  target_audience: string[];
  tags: string[];
  color: string | null;
  status: string;
  priority: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useGlobalEvents(filters?: { status?: string }) {
  return useQuery({
    queryKey: ["admin-global-events", filters],
    queryFn: async () => {
      let query = (supabase as any)
        .from("global_events")
        .select("*")
        .order("start_date", { ascending: true });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as GlobalEventRecord[];
    },
    staleTime: 1000 * 60 * 3,
  });
}

export function useCreateGlobalEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (event: Partial<GlobalEventRecord>) => {
      const { data, error } = await (supabase as any)
        .from("global_events")
        .insert(event)
        .select()
        .single();
      if (error) throw error;
      return data as GlobalEventRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-global-events"] });
      queryClient.invalidateQueries({ queryKey: ["global-events-calendar"] });
    },
  });
}

export function useUpdateGlobalEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<GlobalEventRecord> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from("global_events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as GlobalEventRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-global-events"] });
      queryClient.invalidateQueries({ queryKey: ["global-events-calendar"] });
    },
  });
}

export function useDeleteGlobalEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("global_events")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-global-events"] });
      queryClient.invalidateQueries({ queryKey: ["global-events-calendar"] });
    },
  });
}
