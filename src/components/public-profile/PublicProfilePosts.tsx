import { ROUTES } from "@/config/routes";
import { useIsAr } from "@/hooks/useIsAr";
import { memo, type KeyboardEvent, type MouseEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { MessageCircle, Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toEnglishDigits } from "@/lib/formatNumber";
import { MentionText } from "@/components/community/MentionText";
import { MS_PER_DAY } from "@/lib/constants";
import { CACHE } from "@/lib/queryConfig";

interface Props {
  userId: string;
  isOwnProfile: boolean;
}

export const PublicProfilePosts = memo(function PublicProfilePosts({ userId, isOwnProfile }: Props) {
  const isAr = useIsAr();
  const navigate = useNavigate();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["profile-posts", userId],
    queryFn: async () => {
      const { data: postsData } = await supabase
        .from("posts")
        .select("id, content, created_at, image_urls, image_url")
        .eq("author_id", userId)
        .is("reply_to_post_id", null)
        .eq("moderation_status", "approved")
        .order("created_at", { ascending: false })
        .limit(5);

      if (!postsData?.length) return [];

      const postIds = postsData.map((p) => p.id);
      const [likesRes, commentsRes, repostsRes] = await Promise.all([
        supabase.from("post_likes").select("post_id").in("post_id", postIds),
        supabase.from("post_comments").select("post_id").in("post_id", postIds),
        supabase.from("posts").select("reply_to_post_id").in("reply_to_post_id", postIds),
      ]);

      const likesMap = new Map<string, number>();
      const commentsMap = new Map<string, number>();
      const repliesMap = new Map<string, number>();

      likesRes.data?.forEach((l) => likesMap.set(l.post_id, (likesMap.get(l.post_id) || 0) + 1));
      commentsRes.data?.forEach((c) => commentsMap.set(c.post_id, (commentsMap.get(c.post_id) || 0) + 1));
      repostsRes.data?.forEach((r) => {
        if (r.reply_to_post_id) repliesMap.set(r.reply_to_post_id, (repliesMap.get(r.reply_to_post_id) || 0) + 1);
      });

      return postsData.map((p) => ({
        ...p,
        likes_count: likesMap.get(p.id) || 0,
        comments_count: (commentsMap.get(p.id) || 0) + (repliesMap.get(p.id) || 0),
      }));
    },
    staleTime: CACHE.medium.staleTime,
  });

  if (isLoading || posts.length === 0) return null;

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / MS_PER_DAY);
    if (days === 0) return isAr ? "اليوم" : "Today";
    if (days === 1) return isAr ? "أمس" : "Yesterday";
    if (days < 7) return `${days}${isAr ? "ي" : "d"}`;
    if (days < 30) return `${Math.floor(days / 7)}${isAr ? "أ" : "w"}`;
    return toEnglishDigits(
      new Date(dateStr).toLocaleDateString(isAr ? "ar-SA" : "en-US", {
        month: "short",
        day: "numeric",
      })
    );
  };

  const openPost = (postId: string) => {
    navigate(`/community?post=${postId}`);
  };

  const isInteractiveTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(target.closest("a,button,input,textarea,select,[role='button']"));
  };

  const handlePostClick = (event: MouseEvent<HTMLElement>, postId: string) => {
    if (isInteractiveTarget(event.target)) return;
    openPost(postId);
  };

  const handlePostKeyDown = (event: KeyboardEvent<HTMLElement>, postId: string) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openPost(postId);
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          {isAr ? "آخر المنشورات" : "Recent Posts"}
        </h3>
        <Button variant="ghost" size="sm" className="text-xs text-primary h-7 px-2" asChild>
          <Link to={ROUTES.community}>
            {isAr ? "الكل" : "View all"}
            <ArrowRight className="ms-1 h-3 w-3 rtl:rotate-180" />
          </Link>
        </Button>
      </div>

      <div className="divide-y divide-border">
        {posts.map((post) => (
          <article
            key={post.id}
            role="link"
            tabIndex={0}
            aria-label={isAr ? "عرض تفاصيل المنشور" : "View post details"}
            className="px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={(event) => handlePostClick(event, post.id)}
            onKeyDown={(event) => handlePostKeyDown(event, post.id)}
          >
            <p className="text-sm leading-relaxed line-clamp-3 whitespace-pre-wrap break-words">
              <MentionText content={post.content} />
            </p>

            {(post.image_urls?.length > 0 || post.image_url) && (
              <div className="mt-2 flex gap-1 overflow-hidden rounded-xl">
                {(post.image_urls?.length > 0 ? post.image_urls : [post.image_url!]).slice(0, 3).map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={isAr ? "صورة من المنشور" : "Post image"}
                    className="h-16 w-16 rounded object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ))}
              </div>
            )}

            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {post.likes_count}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {post.comments_count}
              </span>
              <span className="ms-auto">{formatTime(post.created_at)}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
});
