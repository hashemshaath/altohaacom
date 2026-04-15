import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CACHE } from "@/lib/queryConfig";

export interface SiteAnnouncement {
  id: string;
  title: string;
  title_ar: string | null;
  body: string | null;
  body_ar: string | null;
  type: string;
  link_url: string | null;
  link_text: string | null;
  link_text_ar: string | null;
  bg_color: string | null;
  is_dismissible: boolean;
  priority: number;
}

export function useAnnouncements() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get active announcements
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["site-announcements"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("site_announcements" as never) as any)
        .select("id, title, title_ar, body, body_ar, type, link_url, link_text, link_text_ar, bg_color, is_dismissible, priority")
        .eq("is_active", true)
        .lte("starts_at", new Date().toISOString())
        .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`)
        .order("priority", { ascending: false });
      if (error) throw error;
      return (data || []) as SiteAnnouncement[];
    },
    ...CACHE.medium,
  });

  // Get dismissed announcements for current user
  const { data: dismissedIds = [] } = useQuery({
    queryKey: ["dismissed-announcements", user?.id],
    queryFn: async () => {
      const { data } = await (supabase
        .from("dismissed_announcements" as never) as any)
        .select("announcement_id")
        .eq("user_id", user!.id);
      return (data || []).map((d) => d.announcement_id) as string[];
    },
    enabled: !!user,
    ...CACHE.long,
  });

  const dismiss = useMutation({
    mutationFn: async (announcementId: string) => {
      if (!user) return;
      await (supabase.from("dismissed_announcements" as never) as never).insert({
        user_id: user.id,
        announcement_id: announcementId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dismissed-announcements"] });
    },
  });

  const visibleAnnouncements = announcements.filter(
    (a) => !dismissedIds.includes(a.id)
  );

  return {
    announcements: visibleAnnouncements,
    isLoading,
    dismiss: dismiss.mutate,
  };
}
