import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type GlobalEventType =
  | "competition" | "exhibition" | "chefs_table" | "tv_interview"
  | "conference" | "training" | "masterclass" | "tasting"
  | "visit" | "travel" | "vacation" | "meeting" | "other";

export interface GlobalEvent {
  id: string;
  type: GlobalEventType;
  title: string;
  title_ar: string | null;
  start_date: string;
  end_date: string | null;
  all_day: boolean;
  city: string | null;
  country_code: string | null;
  venue: string | null;
  venue_ar: string | null;
  status: string;
  is_international: boolean;
  is_recurring: boolean;
  link: string | null;
  color: string;
  icon: string;
  source: "competition" | "exhibition" | "chef_schedule";
  participation_type?: string | null;
  channel_name?: string | null;
  program_name?: string | null;
  broadcast_type?: string | null;
}

export const GLOBAL_EVENT_COLORS: Record<GlobalEventType, { bg: string; text: string; border: string; dot: string }> = {
  competition:   { bg: "bg-chart-1/10", text: "text-chart-1", border: "border-chart-1/25", dot: "bg-chart-1" },
  exhibition:    { bg: "bg-chart-3/10", text: "text-chart-3", border: "border-chart-3/25", dot: "bg-chart-3" },
  chefs_table:   { bg: "bg-chart-2/10", text: "text-chart-2", border: "border-chart-2/25", dot: "bg-chart-2" },
  tv_interview:  { bg: "bg-chart-4/10", text: "text-chart-4", border: "border-chart-4/25", dot: "bg-chart-4" },
  conference:    { bg: "bg-chart-5/10", text: "text-chart-5", border: "border-chart-5/25", dot: "bg-chart-5" },
  training:      { bg: "bg-primary/10", text: "text-primary", border: "border-primary/25", dot: "bg-primary" },
  masterclass:   { bg: "bg-chart-2/10", text: "text-chart-2", border: "border-chart-2/25", dot: "bg-chart-2" },
  tasting:       { bg: "bg-chart-5/10", text: "text-chart-5", border: "border-chart-5/25", dot: "bg-chart-5" },
  visit:         { bg: "bg-chart-1/10", text: "text-chart-1", border: "border-chart-1/25", dot: "bg-chart-1" },
  travel:        { bg: "bg-chart-3/10", text: "text-chart-3", border: "border-chart-3/25", dot: "bg-chart-3" },
  vacation:      { bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/20", dot: "bg-destructive" },
  meeting:       { bg: "bg-secondary/50", text: "text-secondary-foreground", border: "border-secondary", dot: "bg-secondary-foreground" },
  other:         { bg: "bg-muted", text: "text-muted-foreground", border: "border-border", dot: "bg-muted-foreground" },
};

export const GLOBAL_EVENT_LABELS: Record<GlobalEventType, { en: string; ar: string; icon: string }> = {
  competition:   { en: "Competition", ar: "مسابقة", icon: "Trophy" },
  exhibition:    { en: "Exhibition", ar: "معرض", icon: "Landmark" },
  chefs_table:   { en: "Chef's Table", ar: "طاولة الشيف", icon: "ChefHat" },
  tv_interview:  { en: "TV Interview", ar: "مقابلة تلفزيونية", icon: "Tv" },
  conference:    { en: "Conference", ar: "مؤتمر", icon: "Mic" },
  training:      { en: "Training", ar: "تدريب", icon: "GraduationCap" },
  masterclass:   { en: "Masterclass", ar: "ماستر كلاس", icon: "BookOpen" },
  tasting:       { en: "Tasting", ar: "تذوق", icon: "UtensilsCrossed" },
  visit:         { en: "Visit", ar: "زيارة", icon: "MapPin" },
  travel:        { en: "Travel", ar: "سفر", icon: "Plane" },
  vacation:      { en: "Vacation", ar: "إجازة", icon: "Palmtree" },
  meeting:       { en: "Meeting", ar: "اجتماع", icon: "Users" },
  other:         { en: "Other", ar: "أخرى", icon: "MoreHorizontal" },
};

export function useGlobalEventsCalendar(filters?: {
  types?: GlobalEventType[];
  country?: string;
  year?: number;
  month?: number;
}) {
  return useQuery({
    queryKey: ["global-events-calendar", filters],
    queryFn: async () => {
      const events: GlobalEvent[] = [];

      // 1. Fetch competitions
      let compQuery = supabase
        .from("competitions")
        .select("id, title, title_ar, competition_start, competition_end, country_code, city, venue, venue_ar, status")
        .neq("status", "draft");

      if (filters?.country) compQuery = compQuery.eq("country_code", filters.country);

      const { data: competitions } = await compQuery;
      if (competitions) {
        for (const c of competitions) {
          if (!c.competition_start) continue;
          events.push({
            id: c.id,
            type: "competition",
            title: c.title,
            title_ar: c.title_ar,
            start_date: c.competition_start,
            end_date: c.competition_end,
            all_day: true,
            city: c.city,
            country_code: c.country_code,
            venue: c.venue,
            venue_ar: c.venue_ar,
            status: c.status || "upcoming",
            is_international: false,
            is_recurring: false,
            link: `/competitions/${c.id}`,
            color: "chart-1",
            icon: "Trophy",
            source: "competition",
          });
        }
      }

      // 2. Fetch exhibitions
      let exhQuery = supabase
        .from("exhibitions")
        .select("id, title, title_ar, start_date, end_date, country, city, venue, venue_ar, status, slug");

      if (filters?.country) exhQuery = exhQuery.eq("country", filters.country);

      const { data: exhibitions } = await exhQuery;
      if (exhibitions) {
        for (const e of exhibitions) {
          if (!e.start_date) continue;
          events.push({
            id: e.id,
            type: "exhibition",
            title: e.title,
            title_ar: e.title_ar,
            start_date: e.start_date,
            end_date: e.end_date,
            all_day: true,
            city: e.city,
            country_code: e.country as string | null,
            venue: e.venue,
            venue_ar: e.venue_ar,
            status: e.status || "upcoming",
            is_international: false,
            is_recurring: false,
            link: `/exhibitions/${e.slug}`,
            color: "chart-3",
            icon: "Landmark",
            source: "exhibition",
          });
        }
      }

      // 3. Fetch public chef schedule events
      const { data: chefEvents } = await (supabase as any)
        .from("chef_schedule_events")
        .select("id, event_type, title, title_ar, start_date, end_date, all_day, city, country_code, venue, venue_ar, status, participation_type, channel_name, program_name, broadcast_type, is_recurring")
        .eq("visibility", "public")
        .neq("status", "cancelled");

      if (chefEvents) {
        for (const ce of chefEvents) {
          events.push({
            id: ce.id,
            type: ce.event_type as GlobalEventType,
            title: ce.title,
            title_ar: ce.title_ar,
            start_date: ce.start_date,
            end_date: ce.end_date,
            all_day: ce.all_day ?? true,
            city: ce.city,
            country_code: ce.country_code,
            venue: ce.venue,
            venue_ar: ce.venue_ar,
            status: ce.status || "confirmed",
            is_international: false,
            is_recurring: ce.is_recurring ?? false,
            link: null,
            color: "chart-4",
            icon: GLOBAL_EVENT_LABELS[ce.event_type as GlobalEventType]?.icon || "MoreHorizontal",
            source: "chef_schedule",
            participation_type: ce.participation_type,
            channel_name: ce.channel_name,
            program_name: ce.program_name,
            broadcast_type: ce.broadcast_type,
          });
        }
      }

      // Apply type filter
      let filtered = events;
      if (filters?.types && filters.types.length > 0) {
        filtered = filtered.filter(e => filters.types!.includes(e.type));
      }

      // Sort by start_date
      filtered.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

      return filtered;
    },
  });
}
