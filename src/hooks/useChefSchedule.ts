import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ─── Types ──────────────────────────────────

export type ScheduleEventType =
  | "competition" | "chefs_table" | "exhibition" | "tv_interview"
  | "conference" | "training" | "consultation" | "visit"
  | "personal" | "travel" | "unavailable" | "other";

export type ScheduleVisibility = "private" | "management" | "public";
export type ScheduleStatus = "tentative" | "confirmed" | "cancelled";

export interface ChefScheduleEvent {
  id: string;
  chef_id: string;
  event_type: ScheduleEventType;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  start_date: string;
  end_date: string;
  all_day: boolean;
  timezone: string;
  location: string | null;
  location_ar: string | null;
  city: string | null;
  country_code: string | null;
  venue: string | null;
  venue_ar: string | null;
  linked_entity_type: string | null;
  linked_entity_id: string | null;
  channel_name: string | null;
  channel_name_ar: string | null;
  program_name: string | null;
  program_name_ar: string | null;
  broadcast_type: string | null;
  media_url: string | null;
  participation_type: string | null;
  participation_type_ar: string | null;
  organizer: string | null;
  organizer_ar: string | null;
  is_contracted: boolean;
  contract_status: string;
  fee_amount: number | null;
  fee_currency: string;
  visibility: ScheduleVisibility;
  show_details_publicly: boolean;
  status: ScheduleStatus;
  priority: string;
  color: string | null;
  is_recurring: boolean;
  recurrence_rule: string | null;
  recurrence_end_date: string | null;
  parent_event_id: string | null;
  notes: string | null;
  notes_ar: string | null;
  internal_notes: string | null;
  tags: string[] | null;
  attachments: string[] | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChefScheduleSettings {
  id: string;
  chef_id: string;
  share_with_management: boolean;
  share_publicly: boolean;
  default_visibility: string;
  show_availability_on_profile: boolean;
  auto_sync_competitions: boolean;
  auto_sync_chefs_table: boolean;
  auto_sync_exhibitions: boolean;
  working_hours_start: string;
  working_hours_end: string;
  working_days: number[];
  unavailable_message: string;
  unavailable_message_ar: string;
  created_at: string;
  updated_at: string;
}

// ─── Event Type Metadata ───────────────────

export const EVENT_TYPE_CONFIG: Record<ScheduleEventType, { en: string; ar: string; color: string; icon: string }> = {
  competition:   { en: "Competition",    ar: "مسابقة",        color: "bg-chart-1/15 text-chart-1 border-chart-1/25", icon: "Trophy" },
  chefs_table:   { en: "Chef's Table",   ar: "طاولة الشيف",   color: "bg-chart-2/15 text-chart-2 border-chart-2/25", icon: "ChefHat" },
  exhibition:    { en: "Exhibition",     ar: "معرض",          color: "bg-chart-3/15 text-chart-3 border-chart-3/25", icon: "Landmark" },
  tv_interview:  { en: "TV Interview",   ar: "مقابلة تلفزيونية", color: "bg-chart-4/15 text-chart-4 border-chart-4/25", icon: "Tv" },
  conference:    { en: "Conference",     ar: "مؤتمر",         color: "bg-chart-5/15 text-chart-5 border-chart-5/25", icon: "Mic" },
  training:      { en: "Training",       ar: "تدريب",         color: "bg-primary/15 text-primary border-primary/25", icon: "GraduationCap" },
  consultation:  { en: "Consultation",   ar: "استشارة",       color: "bg-secondary/50 text-secondary-foreground border-secondary", icon: "MessageSquare" },
  visit:         { en: "Visit",          ar: "زيارة",         color: "bg-chart-1/15 text-chart-1 border-chart-1/25", icon: "MapPin" },
  personal:      { en: "Personal",       ar: "شخصي",          color: "bg-muted text-muted-foreground border-border", icon: "User" },
  travel:        { en: "Travel",         ar: "سفر",           color: "bg-chart-3/15 text-chart-3 border-chart-3/25", icon: "Plane" },
  unavailable:   { en: "Unavailable",    ar: "غير متاح",      color: "bg-destructive/10 text-destructive border-destructive/20", icon: "Ban" },
  other:         { en: "Other",          ar: "أخرى",          color: "bg-muted text-muted-foreground border-border", icon: "MoreHorizontal" },
};

export const PARTICIPATION_TYPES = [
  { value: "speaker", en: "Speaker", ar: "متحدث" },
  { value: "judge", en: "Judge", ar: "حكم" },
  { value: "competitor", en: "Competitor", ar: "متسابق" },
  { value: "guest", en: "Guest", ar: "ضيف" },
  { value: "host", en: "Host", ar: "مقدم" },
  { value: "trainer", en: "Trainer", ar: "مدرب" },
  { value: "consultant", en: "Consultant", ar: "مستشار" },
  { value: "evaluator", en: "Evaluator", ar: "مقيّم" },
];

export const BROADCAST_TYPES = [
  { value: "live", en: "Live", ar: "مباشر" },
  { value: "recorded", en: "Recorded", ar: "مسجل" },
  { value: "rerun", en: "Rerun", ar: "إعادة" },
];

// ─── Queries ────────────────────────────────

export function useChefScheduleEvents(chefId?: string, dateRange?: { start: string; end: string }) {
  return useQuery({
    queryKey: ["chef-schedule", chefId, dateRange],
    queryFn: async () => {
      let query = (supabase as any)
        .from("chef_schedule_events")
        .select("*")
        .order("start_date", { ascending: true });

      if (chefId) query = query.eq("chef_id", chefId);
      if (dateRange) {
        query = query.gte("start_date", dateRange.start).lte("end_date", dateRange.end);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ChefScheduleEvent[];
    },
    enabled: !!chefId || !dateRange,
  });
}

export function useChefScheduleSettings(chefId?: string) {
  return useQuery({
    queryKey: ["chef-schedule-settings", chefId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("chef_schedule_settings")
        .select("*")
        .eq("chef_id", chefId!)
        .maybeSingle();
      if (error) throw error;
      return data as ChefScheduleSettings | null;
    },
    enabled: !!chefId,
  });
}

// Public schedule for profile view
export function usePublicChefSchedule(chefId?: string) {
  return useQuery({
    queryKey: ["chef-public-schedule", chefId],
    queryFn: async () => {
      const now = new Date();
      const threeMonthsLater = new Date(now);
      threeMonthsLater.setMonth(now.getMonth() + 3);

      const { data, error } = await (supabase as any)
        .from("chef_schedule_events")
        .select("id, event_type, title, title_ar, start_date, end_date, all_day, city, country_code, venue, venue_ar, participation_type, participation_type_ar, channel_name, channel_name_ar, program_name, program_name_ar, broadcast_type, status, show_details_publicly, visibility")
        .eq("chef_id", chefId!)
        .eq("visibility", "public")
        .neq("status", "cancelled")
        .gte("end_date", now.toISOString())
        .lte("start_date", threeMonthsLater.toISOString())
        .order("start_date", { ascending: true });
      if (error) throw error;
      return (data || []) as Partial<ChefScheduleEvent>[];
    },
    enabled: !!chefId,
  });
}

// ─── Mutations ──────────────────────────────

export function useCreateScheduleEvent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (event: Partial<ChefScheduleEvent>) => {
      const { data, error } = await (supabase as any)
        .from("chef_schedule_events")
        .insert({ ...event, chef_id: event.chef_id || user?.id, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data as ChefScheduleEvent;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["chef-schedule"] });
      queryClient.invalidateQueries({ queryKey: ["chef-public-schedule", data.chef_id] });
    },
  });
}

export function useUpdateScheduleEvent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ChefScheduleEvent> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from("chef_schedule_events")
        .update({ ...updates, updated_by: user?.id })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as ChefScheduleEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chef-schedule"] });
      queryClient.invalidateQueries({ queryKey: ["chef-public-schedule"] });
    },
  });
}

export function useDeleteScheduleEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("chef_schedule_events")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chef-schedule"] });
      queryClient.invalidateQueries({ queryKey: ["chef-public-schedule"] });
    },
  });
}

export function useSaveScheduleSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (settings: Partial<ChefScheduleSettings>) => {
      const chefId = settings.chef_id || user?.id;
      const { data: existing } = await (supabase as any)
        .from("chef_schedule_settings")
        .select("id")
        .eq("chef_id", chefId)
        .maybeSingle();

      if (existing) {
        const { error } = await (supabase as any)
          .from("chef_schedule_settings")
          .update(settings)
          .eq("chef_id", chefId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("chef_schedule_settings")
          .insert({ ...settings, chef_id: chefId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chef-schedule-settings"] });
    },
  });
}

// ─── Helpers ────────────────────────────────

export function getEventColor(eventType: ScheduleEventType): string {
  return EVENT_TYPE_CONFIG[eventType]?.color || EVENT_TYPE_CONFIG.other.color;
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Start from previous month's days to fill the first week
  const startDayOfWeek = firstDay.getDay();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push(d);
  }
  
  // Current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  
  // Fill remaining to complete 6 weeks
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push(new Date(year, month + 1, i));
  }
  
  return days;
}
