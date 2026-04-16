import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CACHE } from "@/lib/queryConfig";

export interface ThreadReply {
  id: string;
  content: string;
  image_urls: string[];
  image_url: string | null;
  created_at: string;
  author_id: string;
  author_name: string | null;
  author_username: string | null;
  author_avatar: string | null;
  likes_count: number;
  is_liked: boolean;
}

export interface ParentPost {
  avatar_url?: string;
  display_name?: string;
  full_name?: string;
  username?: string;
  author_id: string;
  content: string;
  image_url?: string | null;
  image_urls?: string[] | null;
  created_at: string;
  [key: string]: unknown;
}

interface UsePostThreadReturn {
  parentPost: ParentPost | null;
  replies: ThreadReply[];
  isLoading: boolean;
  refetch: () => void;
  toggleReplyLike: (replyId: string, isLiked: boolean) => void;
}

export function usePostThread(postId: string): UsePostThreadReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["post-thread", postId, user?.id];

  const { data, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data: post } = await supabase.from("posts")
        .select("id, content, author_id, image_url, image_urls, video_url, link_url, link_preview, visibility, replies_count, reposts_count, is_pinned, reply_to_post_id, created_at, updated_at")
        .eq("id", postId).maybeSingle();
      if (!post) return { parent: null, replies: [] as ThreadReply[] };

      const { data: profile } = await supabase.from("profiles")
        .select("full_name, display_name, display_name_ar, username, avatar_url, specialization")
        .eq("user_id", post.author_id).maybeSingle();

      const parent: ParentPost = { ...post, ...profile };

      const { data: repliesData } = await supabase.from("posts")
        .select("id, author_id, content, created_at, edited_at, image_url, image_urls, is_pinned, link_preview, link_url, moderation_status, post_number, replies_count, reply_to_post_id, reposts_count, video_url, visibility")
        .eq("reply_to_post_id", postId).eq("moderation_status", "approved")
        .order("created_at", { ascending: true });

      if (!repliesData?.length) return { parent, replies: [] as ThreadReply[] };

      const authorIds = [...new Set(repliesData.map((r) => r.author_id))];
      const replyIds = repliesData.map((r) => r.id);

      const [profilesRes, likesRes, userLikesRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, full_name_ar, display_name, display_name_ar, username, avatar_url").in("user_id", authorIds),
        supabase.from("post_likes").select("post_id").in("post_id", replyIds),
        user ? supabase.from("post_likes").select("post_id").eq("user_id", user.id).in("post_id", replyIds) : { data: [] },
      ]);

      const pMap = new Map(profilesRes.data?.map((p) => [p.user_id, p]) || []);
      const lMap = new Map<string, number>();
      likesRes.data?.forEach((l) => lMap.set(l.post_id, (lMap.get(l.post_id) || 0) + 1));
      const likedSet = new Set(userLikesRes.data?.map((l) => l.post_id) || []);

      const replies: ThreadReply[] = repliesData.map((r) => {
        const p = pMap.get(r.author_id);
        return {
          id: r.id, content: r.content,
          image_urls: (r.image_urls as string[] | null) || [],
          image_url: r.image_url, created_at: r.created_at, author_id: r.author_id,
          author_name: p?.display_name || p?.full_name || null,
          author_username: p?.username || null, author_avatar: p?.avatar_url || null,
          likes_count: lMap.get(r.id) || 0, is_liked: likedSet.has(r.id),
        };
      });

      return { parent, replies };
    },
    ...CACHE.short,
  });

  const likeMutation = useMutation({
    mutationFn: async ({ replyId, isLiked }: { replyId: string; isLiked: boolean }) => {
      if (!user) throw new Error("Not authenticated");
      if (isLiked) {
        await supabase.from("post_likes").delete().eq("post_id", replyId).eq("user_id", user.id);
      } else {
        await supabase.from("post_likes").insert({ post_id: replyId, user_id: user.id });
      }
    },
    onMutate: async ({ replyId, isLiked }) => {
      await queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData(queryKey, (old: typeof data) => {
        if (!old) return old;
        return {
          ...old,
          replies: old.replies.map((r) =>
            r.id === replyId
              ? { ...r, is_liked: !isLiked, likes_count: isLiked ? r.likes_count - 1 : r.likes_count + 1 }
              : r
          ),
        };
      });
    },
    onError: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    parentPost: data?.parent || null,
    replies: data?.replies || [],
    isLoading,
    refetch: () => refetch(),
    toggleReplyLike: (replyId, isLiked) => likeMutation.mutate({ replyId, isLiked }),
  };
}
