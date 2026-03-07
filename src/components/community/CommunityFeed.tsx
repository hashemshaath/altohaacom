import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Loader2 } from "lucide-react";
import { FeedSkeletonLoader } from "./PostSkeleton";
import { useToast } from "@/hooks/use-toast";
import { toEnglishDigits } from "@/lib/formatNumber";
import { SwipeablePostWrapper } from "./SwipeablePostWrapper";
import { PostComposer } from "./PostComposer";
import { PostThread } from "./PostThread";
import { ReportDialog } from "./ReportDialog";
import { StoriesBar } from "./StoriesBar";
import { FeatureGate } from "@/components/membership/FeatureGate";
import { FeedRecommendations } from "./FeedRecommendations";
import { PostEditHistory } from "./PostEditHistory";
import { PostCard } from "./PostCard";
import { FeedTabs, type FeedFilter } from "./FeedTabs";
import { NewPostsBanner } from "./NewPostsBanner";
import { TrendingCarousel } from "./TrendingCarousel";

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
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("for_you");
  const [newPostsCount, setNewPostsCount] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const feedTopRef = useRef<HTMLDivElement>(null);

  // Real-time new posts counter
  useEffect(() => {
    const channel = supabase
      .channel("community-new-posts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
          filter: "reply_to_post_id=is.null",
        },
        (payload) => {
          if (payload.new && (payload.new as any).author_id !== user?.id) {
            setNewPostsCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const enrichPosts = useCallback(async (postsData: any[]) => {
    if (!postsData.length) return [];
    const authorIds = [...new Set(postsData.map((p) => p.author_id))];
    const postIds = postsData.map((p) => p.id);

    // Batch all queries in parallel — user-interaction queries only when logged in
    const [profilesRes, userLikesRes, userBookmarksRes, userRepostsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, full_name_ar, display_name, display_name_ar, username, specialization, avatar_url").in("user_id", authorIds),
      user ? supabase.from("post_likes").select("post_id").eq("user_id", user.id).in("post_id", postIds) : { data: [] },
      user ? supabase.from("post_bookmarks").select("post_id").eq("user_id", user.id).in("post_id", postIds) : { data: [] },
      user ? supabase.from("post_reposts").select("post_id").eq("user_id", user.id).in("post_id", postIds) : { data: [] },
    ]);

    const profilesMap = new Map(profilesRes.data?.map((p) => [p.user_id, p]) || []);
    const userLikedSet = new Set(userLikesRes.data?.map((l) => l.post_id) || []);
    const userBookmarkedSet = new Set(userBookmarksRes.data?.map((b) => b.post_id) || []);
    const userRepostedSet = new Set(userRepostsRes.data?.map((r) => r.post_id) || []);

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
        author_name: profile?.display_name || profile?.full_name || null,
        author_username: profile?.username || null,
        author_specialization: profile?.specialization || null,
        visibility: p.visibility || "public",
        reply_to_post_id: p.reply_to_post_id || null,
        likes_count: p.likes_count || 0,
        comments_count: p.comments_count || 0,
        replies_count: p.replies_count || 0,
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

    try {
      // Bookmarks filter
      if (feedFilter === "bookmarks" && user) {
        const { data: bookmarkData } = await supabase
          .from("post_bookmarks")
          .select("post_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);

        const bookmarkedIds = bookmarkData?.map((b) => b.post_id) || [];
        if (bookmarkedIds.length === 0) {
          setPosts([]);
          setHasMore(false);
          setLoading(false);
          setLoadingMore(false);
          return;
        }

        const { data: postsData } = await supabase
          .from("posts")
          .select("id, author_id, content, created_at, edited_at, group_id, image_url, image_urls, is_pinned, link_preview, link_url, moderation_status, post_number, replies_count, reply_to_post_id, reposts_count, video_url, visibility")
          .in("id", bookmarkedIds)
          .eq("moderation_status", "approved");

        const enriched = await enrichPosts(postsData || []);
        // Sort by bookmark order
        const idOrder = new Map(bookmarkedIds.map((id, i) => [id, i]));
        enriched.sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0));

        if (append) setPosts((prev) => [...prev, ...enriched]);
        else setPosts(enriched);
        setHasMore((bookmarkData?.length || 0) >= PAGE_SIZE);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      // Following filter
      if (feedFilter === "following" && user) {
        const { data: followData } = await supabase
          .from("user_follows")
          .select("following_id")
          .eq("follower_id", user.id);

        const followingIds = followData?.map((f) => f.following_id) || [];
        if (followingIds.length === 0) {
          setPosts([]);
          setHasMore(false);
          setLoading(false);
          setLoadingMore(false);
          return;
        }

        const { data: postsData } = await supabase
          .from("posts")
          .select("id, author_id, content, created_at, edited_at, group_id, image_url, image_urls, is_pinned, link_preview, link_url, moderation_status, post_number, replies_count, reply_to_post_id, reposts_count, video_url, visibility")
          .is("group_id", null)
          .is("reply_to_post_id", null)
          .eq("moderation_status", "approved")
          .in("author_id", followingIds)
          .order("created_at", { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);

        const enriched = await enrichPosts(postsData || []);
        if (append) setPosts((prev) => [...prev, ...enriched]);
        else setPosts(enriched);
        setHasMore((postsData?.length || 0) >= PAGE_SIZE);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      // Default: For You / Latest
      let query = supabase
        .from("posts")
        .select("id, author_id, content, created_at, edited_at, group_id, image_url, image_urls, is_pinned, link_preview, link_url, moderation_status, post_number, replies_count, reply_to_post_id, reposts_count, video_url, visibility")
        .is("group_id", null)
        .is("reply_to_post_id", null)
        .eq("moderation_status", "approved");

      if (tagFilter) {
        query = query.ilike("content", `%#${tagFilter}%`);
      }

      if (feedFilter === "for_you") {
        query = query
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data: postsData, error } = await query.range(offset, offset + PAGE_SIZE - 1);

      if (error) { setLoading(false); setLoadingMore(false); return; }

      const enriched = await enrichPosts(postsData || []);

      if (append) {
        setPosts((prev) => [...prev, ...enriched]);
      } else {
        setPosts(enriched);
      }
      setHasMore((postsData?.length || 0) >= PAGE_SIZE);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user, tagFilter, enrichPosts, feedFilter]);

  useEffect(() => {
    setPosts([]);
    setHasMore(true);
    setNewPostsCount(0);
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

  // Optimistic like
  const handleLike = useCallback(async (postId: string, isLiked: boolean) => {
    if (!user) return;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, is_liked: !isLiked, likes_count: isLiked ? p.likes_count - 1 : p.likes_count + 1 } : p
      )
    );
    const { error } = isLiked
      ? await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id)
      : await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
    if (error) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, is_liked: isLiked, likes_count: isLiked ? p.likes_count + 1 : p.likes_count - 1 } : p
        )
      );
    }
  }, [user]);

  // Optimistic bookmark
  const handleBookmark = useCallback(async (postId: string, isBookmarked: boolean) => {
    if (!user) return;
    setPosts((prev) =>
      prev.map((p) => p.id === postId ? { ...p, is_bookmarked: !isBookmarked } : p)
    );
    const { error } = isBookmarked
      ? await supabase.from("post_bookmarks").delete().eq("post_id", postId).eq("user_id", user.id)
      : await supabase.from("post_bookmarks").insert({ post_id: postId, user_id: user.id });
    if (error) {
      setPosts((prev) =>
        prev.map((p) => p.id === postId ? { ...p, is_bookmarked: isBookmarked } : p)
      );
    }
  }, [user]);

  // Optimistic repost
  const handleRepost = useCallback(async (postId: string, isReposted: boolean) => {
    if (!user) return;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, is_reposted: !isReposted, reposts_count: isReposted ? p.reposts_count - 1 : p.reposts_count + 1 } : p
      )
    );
    const { error } = isReposted
      ? await supabase.from("post_reposts").delete().eq("post_id", postId).eq("user_id", user.id)
      : await supabase.from("post_reposts").insert({ post_id: postId, user_id: user.id });
    if (error) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, is_reposted: isReposted, reposts_count: isReposted ? p.reposts_count + 1 : p.reposts_count - 1 } : p
        )
      );
    }
  }, [user]);

  const handleDelete = async (postId: string) => {
    if (!user) return;
    const deletedPost = posts.find((p) => p.id === postId);
    // Optimistic remove
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    const { error } = await supabase.from("posts").delete().eq("id", postId).eq("author_id", user.id);
    if (error) {
      // Rollback
      if (deletedPost) setPosts((prev) => [...prev, deletedPost].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      return;
    }
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
    toast({ title: isAr ? "تم حذف المنشور" : "Post deleted" });
  };

  const handleEditSaved = (postId: string, newContent: string) => {
    setPosts((prev) =>
      prev.map((p) => p.id === postId ? { ...p, content: newContent, edited_at: new Date().toISOString() } : p)
    );
  };

  const handleLoadNewPosts = () => {
    setNewPostsCount(0);
    fetchPosts(0, false);
    feedTopRef.current?.scrollIntoView({ behavior: "smooth" });
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
      <div className="space-y-0">
        <FeedTabs active={feedFilter} onChange={setFeedFilter} isLoggedIn={!!user} />
        <FeedSkeletonLoader count={5} />
      </div>
    );
  }

  return (
    <>
      <div ref={feedTopRef} />

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

      {/* Feed Tabs */}
      {!tagFilter && <FeedTabs active={feedFilter} onChange={setFeedFilter} isLoggedIn={!!user} />}

      {/* New posts banner */}
      {newPostsCount > 0 && feedFilter !== "bookmarks" && (
        <NewPostsBanner count={newPostsCount} onClick={handleLoadNewPosts} />
      )}

      {/* Stories */}
      {!tagFilter && feedFilter === "for_you" && (
        <FeatureGate feature="feature_stories" showUpgrade upgradeVariant="inline" featureName="Stories" featureNameAr="القصص">
          <StoriesBar />
        </FeatureGate>
      )}

      {/* Composer */}
      {user && !tagFilter && feedFilter !== "bookmarks" && (
        <FeatureGate feature="feature_posts" showUpgrade featureName="Create Posts" featureNameAr="إنشاء المنشورات">
          <PostComposer
            onPosted={() => fetchPosts(0, false)}
            replyToPostId={null}
            placeholder={isAr ? "ماذا يحدث في مجتمع الطهاة؟" : "What's happening in the chef community?"}
          />
        </FeatureGate>
      )}

      {/* Trending Carousel */}
      {!tagFilter && feedFilter === "for_you" && <TrendingCarousel />}

      {/* AI Recommendations */}
      {!tagFilter && feedFilter === "for_you" && <FeedRecommendations />}

      {/* Feed */}
      <div className="divide-y divide-border/50">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center px-6">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/40 ring-1 ring-border/30">
              <MessageCircle className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <h3 className="text-sm font-semibold text-foreground/80 mb-1">
              {feedFilter === "bookmarks"
                ? (isAr ? "لا توجد منشورات محفوظة" : "No saved posts yet")
                : feedFilter === "following"
                  ? (isAr ? "لا توجد منشورات بعد" : "No posts yet")
                  : (isAr ? "لا توجد منشورات" : "No posts yet")}
            </h3>
            <p className="text-xs text-muted-foreground max-w-[240px]">
              {feedFilter === "bookmarks"
                ? (isAr ? "احفظ منشوراتك المفضلة لتجدها هنا" : "Save your favorite posts to find them here")
                : feedFilter === "following"
                  ? (isAr ? "تابع طهاة لرؤية منشوراتهم" : "Follow chefs to see their posts here")
                  : tagFilter
                    ? (isAr ? `لا توجد منشورات بهاشتاق #${tagFilter}` : `No posts with #${tagFilter}`)
                    : (isAr ? "لا توجد منشورات. كن أول من ينشر!" : "No posts yet. Be the first to share!")}
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <SwipeablePostWrapper
              key={post.id}
              isLiked={post.is_liked}
              isBookmarked={post.is_bookmarked}
              onSwipeRight={() => handleLike(post.id, post.is_liked)}
              onSwipeLeft={() => handleBookmark(post.id, post.is_bookmarked)}
            >
              <PostCard
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
            </SwipeablePostWrapper>
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
