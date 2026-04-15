import { CACHE } from "@/lib/queryConfig";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  created_at: string;
  user_name: string | null;
  user_avatar: string | null;
}

export interface GroupedStories {
  user_id: string;
  user_name: string | null;
  user_avatar: string | null;
  stories: Story[];
  hasViewed: boolean;
}

interface UseStoriesReturn {
  grouped: GroupedStories[];
  isLoading: boolean;
  uploadStory: (file: File, caption: string) => Promise<void>;
  isUploading: boolean;
  deleteStory: (storyId: string) => Promise<void>;
  recordView: (storyId: string) => Promise<void>;
  fetchViewCount: (storyId: string) => Promise<number>;
}

export function useStoriesData(): UseStoriesReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["community-stories", user?.id];

  const { data: grouped = [], isLoading } = useQuery({
    queryKey,
    queryFn: async (): Promise<GroupedStories[]> => {
      const { data: stories } = await supabase
        .from("community_stories")
        .select("id, user_id, media_url, media_type, caption, expires_at, created_at")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (!stories?.length) return [];

      const userIds = [...new Set(stories.map((s) => s.user_id))];
      const [profilesRes, viewsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", userIds),
        user
          ? supabase.from("story_views").select("story_id").eq("viewer_id", user.id).in("story_id", stories.map((s) => s.id))
          : { data: [] },
      ]);

      const viewedIds = new Set(viewsRes.data?.map((v) => v.story_id) || []);
      const profileMap = new Map(profilesRes.data?.map((p) => [p.user_id, p]) || []);
      const groups = new Map<string, GroupedStories>();

      stories.forEach((s) => {
        const profile = profileMap.get(s.user_id);
        if (!groups.has(s.user_id)) {
          groups.set(s.user_id, {
            user_id: s.user_id,
            user_name: profile?.full_name || null,
            user_avatar: profile?.avatar_url || null,
            stories: [],
            hasViewed: true,
          });
        }
        const group = groups.get(s.user_id)!;
        group.stories.push({
          ...s, user_name: profile?.full_name || null, user_avatar: profile?.avatar_url || null,
        });
        if (!viewedIds.has(s.id)) group.hasViewed = false;
      });

      return [...groups.values()].sort((a, b) => {
        if (user && a.user_id === user.id) return -1;
        if (user && b.user_id === user.id) return 1;
        if (a.hasViewed !== b.hasViewed) return a.hasViewed ? 1 : -1;
        return 0;
      });
    },
    ...CACHE.short,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, caption }: { file: File; caption: string }) => {
      if (!user) throw new Error("Not authenticated");
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/stories/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("user-media").upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("user-media").getPublicUrl(path);
      const mediaType = file.type.startsWith("video/") ? "video" : "image";
      const { error } = await supabase.from("community_stories").insert({
        user_id: user.id, media_url: urlData.publicUrl, media_type: mediaType, caption: caption.trim() || null,
      });
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (storyId: string) => {
      if (!user) throw new Error("Not authenticated");
      await supabase.from("community_stories").delete().eq("id", storyId).eq("user_id", user.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const recordView = async (storyId: string) => {
    if (!user) return;
    await supabase.from("story_views").upsert(
      { story_id: storyId, viewer_id: user.id },
      { onConflict: "story_id,viewer_id" }
    );
  };

  const fetchViewCount = async (storyId: string): Promise<number> => {
    const { count } = await supabase.from("story_views").select("id", { count: "exact", head: true }).eq("story_id", storyId);
    return count || 0;
  };

  return {
    grouped,
    isLoading,
    uploadStory: (file, caption) => uploadMutation.mutateAsync({ file, caption }),
    isUploading: uploadMutation.isPending,
    deleteStory: deleteMutation.mutateAsync,
    recordView,
    fetchViewCount,
  };
}
