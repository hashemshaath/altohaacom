import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toEnglishDigits } from "@/lib/formatNumber";
import { PostComposer } from "./PostComposer";
import { PostThread } from "./PostThread";
import { ReportDialog } from "./ReportDialog";
import { StoriesBar } from "./StoriesBar";
import { FeedRecommendations } from "./FeedRecommendations";
import { PostEditHistory } from "./PostEditHistory";
import { PostCard } from "./PostCard";

export interface CommunityPost {
  id: string;
  content: string;
  image_url: string | null;
  image_urls: string[];
  link_url: string | null;
  video_url: string | null;
  created_at: string;
  edited_at: string | null;
  author_id: string;
  author_avatar: string | null;
  author_name: string | null;
  author_username: string | null;
  author_specialization: string | null;
  visibility: string;
  reply_to_post_id: string | null;
  likes_count: number;
  comments_count: number;
  replies_count: number;
  reposts_count: number;
  is_liked: boolean;
  is_bookmarked: boolean;
  is_reposted: boolean;
  is_pinned: boolean;
  moderation_status: string;
}

const PAGE_SIZE = 20;

export function CommunityFeed() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tagFilter = searchParams.get("tag");

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [threadPostId, setThreadPostId] = useState<string | null>(null);
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);
  const [historyPostId, setHistoryPostId] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const enrichPosts = useCallback(async (postsData: any[]) => {
    if (!postsData.length) return [];
    const authorIds = [...new Set(postsData.map((p) => p.author_id))];
    const postIds = postsData.map((p) => p.id);

    const [profilesRes, likesRes, commentsRes, repliesRes, userLikesRes, userBookmarksRes, userRepostsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, username, specialization, avatar_url").in("user_id", authorIds),
      supabase.from("post_likes").select("post_id").in("post_id", postIds),
      supabase.from("post_comments").select("post_id").in("post_id", postIds),
      supabase.from("posts").select("reply_to_post_id").in("reply_to_post_id", postIds),
      user ? supabase.from("post_likes").select("post_id").eq("user_id", user.id).in("post_id", postIds) : { data: [] },
      user ? supabase.from("post_bookmarks").select("post_id").eq("user_id", user.id).in("post_id", postIds) : { data: [] },
      user ? supabase.from("post_reposts").select("post_id").eq("user_id", user.id).in("post_id", postIds) : { data: [] },
    ]);

    const profilesMap = new Map(profilesRes.data?.map((p) => [p.user_id, p]) || []);
    const likesMap = new Map<string, number>();
    const commentsMap = new Map<string, number>();
    const repliesMap = new Map<string, number>();
    const userLikedSet = new Set(userLikesRes.data?.map((l) => l.post_id) || []);
    const userBookmarkedSet = new Set(userBookmarksRes.data?.map((b) => b.post_id) || []);
    const userRepostedSet = new Set(userRepostsRes.data?.map((r) => r.post_id) || []);

    likesRes.data?.forEach((l) => likesMap.set(l.post_id, (likesMap.get(l.post_id) || 0) + 1));
    commentsRes.data?.forEach((c) => commentsMap.set(c.post_id, (commentsMap.get(c.post_id) || 0) + 1));
    repliesRes.data?.forEach((r) => {
      if (r.reply_to_post_id) repliesMap.set(r.reply_to_post_id, (repliesMap.get(r.reply_to_post_id) || 0) + 1);
    });

    return postsData.map((p): CommunityPost => {
      const profile = profilesMap.get(p.author_id);
      return {
        id: p.id,
        content: p.content,
        image_url: p.image_url,
        image_urls: p.image_urls || [],
        link_url: p.link_url || null,
        video_url: p.video_url || null,
        created_at: p.created_at,
        edited_at: p.edited_at || null,
        author_id: p.author_id,
        author_avatar: profile?.avatar_url || null,
        author_name: profile?.full_name || null,
        author_username: profile?.username || null,
        author_specialization: profile?.specialization || null,
        visibility: p.visibility || "public",
        reply_to_post_id: p.reply_to_post_id || null,
        likes_count: likesMap.get(p.id) || 0,
        comments_count: commentsMap.get(p.id) || 0,
        replies_count: repliesMap.get(p.id) || 0,
        reposts_count: p.reposts_count || 0,
        is_liked: userLikedSet.has(p.id),
        is_bookmarked: userBookmarkedSet.has(p.id),
        is_reposted: userRepostedSet.has(p.id),
        is_pinned: p.is_pinned || false,
        moderation_status: p.moderation_status || "approved",
      };
    });
  }, [user?.id]);

  const fetchPosts = useCallback(async (offset = 0, append = false) => {
    if (offset === 0) setLoading(true);
    else setLoadingMore(true);

    let query = supabase
      .from("posts")
      .select("*")
      .is("group_id", null)
      .is("reply_to_post_id", null)
      .eq("moderation_status", "approved");

    if (tagFilter) {
      query = query.ilike("content", `%#${tagFilter}%`);
    }

    const { data: postsData, error } = await query
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) { setLoading(false); setLoadingMore(false); return; }

    const enriched = await enrichPosts(postsData || []);

    if (append) {
      setPosts((prev) => [...prev, ...enriched]);
    } else {
      setPosts(enriched);
    }
    setHasMore((postsData?.length || 0) >= PAGE_SIZE);
    setLoading(false);
    setLoadingMore(false);
  }, [user, tagFilter, enrichPosts]);

  useEffect(() => {
    setPosts([]);
    setHasMore(true);
    fetchPosts(0, false);
  }, [fetchPosts]);

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchPosts(posts.length, true);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, posts.length, fetchPosts]);

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!user) return;
    if (isLiked) {
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
    } else {
      await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
    }
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, is_liked: !isLiked, likes_count: isLiked ? p.likes_count - 1 : p.likes_count + 1 } : p
      )
    );
  };

  const handleBookmark = async (postId: string, isBookmarked: boolean) => {
    if (!user) return;
    if (isBookmarked) {
      await supabase.from("post_bookmarks").delete().eq("post_id", postId).eq("user_id", user.id);
    } else {
      await supabase.from("post_bookmarks").insert({ post_id: postId, user_id: user.id });
    }
    setPosts((prev) =>
      prev.map((p) => p.id === postId ? { ...p, is_bookmarked: !isBookmarked } : p)
    );
  };

  const handleRepost = async (postId: string, isReposted: boolean) => {
    if (!user) return;
    if (isReposted) {
      await supabase.from("post_reposts").delete().eq("post_id", postId).eq("user_id", user.id);
    } else {
      await supabase.from("post_reposts").insert({ post_id: postId, user_id: user.id });
    }
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, is_reposted: !isReposted, reposts_count: isReposted ? p.reposts_count - 1 : p.reposts_count + 1 } : p
      )
    );
  };

  const handleDelete = async (postId: string) => {
    if (!user) return;
    const deletedPost = posts.find((p) => p.id === postId);
    const { error } = await supabase.from("posts").delete().eq("id", postId).eq("author_id", user.id);
    if (!error) {
      if (deletedPost) {
        supabase.from("content_audit_log").insert({
          action_type: "post_deleted",
          entity_type: "post",
          entity_id: postId,
          user_id: user.id,
          author_id: deletedPost.author_id,
          content_snapshot: deletedPost.content,
          image_urls: deletedPost.image_urls || [],
          reason: "User deleted own post",
          reason_ar: "حذف المستخدم منشوره",
        }).then(() => {});
      }
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast({ title: isAr ? "تم حذف المنشور" : "Post deleted" });
    }
  };

  const handleEditSaved = (postId: string, newContent: string) => {
    setPosts((prev) =>
      prev.map((p) => p.id === postId ? { ...p, content: newContent, edited_at: new Date().toISOString() } : p)
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return isAr ? "الآن" : "now";
    if (diffMins < 60) return toEnglishDigits(`${diffMins}`) + (isAr ? "د" : "m");
    if (diffHours < 24) return toEnglishDigits(`${diffHours}`) + (isAr ? "س" : "h");
    if (diffDays < 7) return toEnglishDigits(`${diffDays}`) + (isAr ? "ي" : "d");
    return toEnglishDigits(date.toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "short", day: "numeric" }));
  };

  if (loading) {
    return (
      <div className="space-y-0 divide-y divide-border">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="px-4 py-3">
            <div className="flex gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-16 w-full" />
                <div className="flex gap-8"><Skeleton className="h-4 w-12" /><Skeleton className="h-4 w-12" /><Skeleton className="h-4 w-12" /></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Tag filter banner */}
      {tagFilter && (
        <div className="flex items-center gap-2 border-b border-border px-4 py-3 bg-primary/5">
          <span className="text-sm font-bold text-primary">#{tagFilter}</span>
          <span className="text-xs text-muted-foreground">{isAr ? "المنشورات المصفاة" : "Filtered posts"}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ms-auto rounded-full"
            onClick={() => navigate("/community")}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Stories */}
      {!tagFilter && <StoriesBar />}

      {/* Composer */}
      {user && !tagFilter && (
        <PostComposer
          onPosted={() => fetchPosts(0, false)}
          replyToPostId={null}
          placeholder={isAr ? "ماذا يحدث في مجتمع الطهاة؟" : "What's happening in the chef community?"}
        />
      )}

      {/* AI Recommendations */}
      {!tagFilter && <FeedRecommendations />}

      {/* Feed */}
      <div className="divide-y divide-border">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted/60">
              <MessageCircle className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">
              {tagFilter
                ? (isAr ? `لا توجد منشورات بهاشتاق #${tagFilter}` : `No posts with #${tagFilter}`)
                : (isAr ? "لا توجد منشورات. كن أول من ينشر!" : "No posts yet. Be the first to share!")}
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isEditing={editingPost?.id === post.id}
              onEdit={setEditingPost}
              onEditClose={() => setEditingPost(null)}
              onEditSaved={handleEditSaved}
              onDelete={handleDelete}
              onLike={handleLike}
              onBookmark={handleBookmark}
              onRepost={handleRepost}
              onOpenThread={setThreadPostId}
              onReport={setReportPostId}
              onViewHistory={setHistoryPostId}
              formatDate={formatDate}
            />
          ))
        )}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="py-4 flex justify-center">
        {loadingMore && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        {!hasMore && posts.length > 0 && (
          <p className="text-xs text-muted-foreground">{isAr ? "لا مزيد من المنشورات" : "No more posts"}</p>
        )}
      </div>

      {/* Thread modal */}
      {threadPostId && (
        <PostThread
          postId={threadPostId}
          onClose={() => setThreadPostId(null)}
          onPostUpdated={() => fetchPosts(0, false)}
        />
      )}

      {/* Report dialog */}
      {reportPostId && (
        <ReportDialog
          postId={reportPostId}
          onClose={() => setReportPostId(null)}
        />
      )}

      {/* Edit history */}
      {historyPostId && (
        <PostEditHistory
          postId={historyPostId}
          onClose={() => setHistoryPostId(null)}
        />
      )}
    </>
  );
}
