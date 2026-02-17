import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Heart, MessageCircle, Repeat2, Bookmark, Share2, MoreHorizontal,
  Flag, Trash2, Pin, Eye, EyeOff, User, Mail,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { toEnglishDigits } from "@/lib/formatNumber";
import { PostComposer } from "./PostComposer";
import { PostThread } from "./PostThread";
import { ReportDialog } from "./ReportDialog";
import { PostReactions } from "./PostReactions";
import { ChefBadge } from "./ChefBadge";
import { MentionText } from "./MentionText";
import { StoriesBar } from "./StoriesBar";
import { LiveSessionsSection } from "./LiveSessionsSection";
import { cn } from "@/lib/utils";

export interface CommunityPost {
  id: string;
  content: string;
  image_url: string | null;
  image_urls: string[];
  link_url: string | null;
  created_at: string;
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

export function CommunityFeed() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [threadPostId, setThreadPostId] = useState<string | null>(null);
  const [reportPostId, setReportPostId] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    const { data: postsData, error } = await supabase
      .from("posts")
      .select("*")
      .is("group_id", null)
      .is("reply_to_post_id", null)
      .eq("moderation_status", "approved")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) { setLoading(false); return; }

    const authorIds = [...new Set(postsData?.map((p) => p.author_id) || [])];
    const postIds = postsData?.map((p) => p.id) || [];

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

    const enriched: CommunityPost[] = (postsData || []).map((p) => {
      const profile = profilesMap.get(p.author_id);
      return {
        id: p.id,
        content: p.content,
        image_url: p.image_url,
        image_urls: (p as any).image_urls || [],
        link_url: (p as any).link_url || null,
        created_at: p.created_at,
        author_id: p.author_id,
        author_avatar: profile?.avatar_url || null,
        author_name: profile?.full_name || null,
        author_username: profile?.username || null,
        author_specialization: profile?.specialization || null,
        visibility: (p as any).visibility || "public",
        reply_to_post_id: (p as any).reply_to_post_id || null,
        likes_count: likesMap.get(p.id) || 0,
        comments_count: commentsMap.get(p.id) || 0,
        replies_count: repliesMap.get(p.id) || 0,
        reposts_count: (p as any).reposts_count || 0,
        is_liked: userLikedSet.has(p.id),
        is_bookmarked: userBookmarkedSet.has(p.id),
        is_reposted: userRepostedSet.has(p.id),
        is_pinned: (p as any).is_pinned || false,
        moderation_status: (p as any).moderation_status || "approved",
      };
    });

    setPosts(enriched);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

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
    const { error } = await supabase.from("posts").delete().eq("id", postId).eq("author_id", user.id);
    if (!error) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast({ title: isAr ? "تم حذف المنشور" : "Post deleted" });
    }
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
      {/* Stories */}
      <StoriesBar />

      {/* Live Sessions */}
      <LiveSessionsSection />

      {/* Composer */}
      {user && (
        <PostComposer
          onPosted={fetchPosts}
          replyToPostId={null}
          placeholder={isAr ? "ماذا يحدث في مجتمع الطهاة؟" : "What's happening in the chef community?"}
        />
      )}

      {/* Feed */}
      <div className="divide-y divide-border">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted/60">
              <MessageCircle className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">{isAr ? "لا توجد منشورات. كن أول من ينشر!" : "No posts yet. Be the first to share!"}</p>
          </div>
        ) : (
          posts.map((post) => (
            <article
              key={post.id}
              className={cn(
                "px-4 py-3 transition-colors hover:bg-muted/30 cursor-pointer",
                post.is_pinned && "bg-primary/5"
              )}
            >
              {post.is_pinned && (
                <div className="flex items-center gap-1 ps-12 mb-1 text-[10px] font-bold text-muted-foreground">
                  <Pin className="h-3 w-3" />
                  {isAr ? "منشور مثبت" : "Pinned"}
                </div>
              )}
              <div className="flex gap-3">
                <Link to={`/${post.author_username || post.author_id}`} className="shrink-0">
                  <Avatar className="h-10 w-10 transition-opacity hover:opacity-80">
                    <AvatarImage src={post.author_avatar || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {(post.author_name || "C")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="min-w-0 flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-1.5">
                    <Link
                      to={`/${post.author_username || post.author_id}`}
                      className="truncate text-sm font-bold hover:underline"
                    >
                      {post.author_name || "Chef"}
                    </Link>
                    <ChefBadge userId={post.author_id} />
                    {post.author_username && (
                      <span className="truncate text-xs text-muted-foreground">
                        @{post.author_username}
                      </span>
                    )}
                    <span className="text-muted-foreground">·</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(post.created_at)}
                    </span>
                    <div className="ms-auto">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {user?.id === post.author_id ? (
                            <DropdownMenuItem onClick={() => handleDelete(post.id)} className="text-destructive">
                              <Trash2 className="h-4 w-4 me-2" />
                              {isAr ? "حذف" : "Delete"}
                            </DropdownMenuItem>
                          ) : (
                            <>
                              <DropdownMenuItem onClick={() => navigate(`/messages?user=${post.author_id}`)}>
                                <Mail className="h-4 w-4 me-2" />
                                {isAr ? "إرسال رسالة" : "Message"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setReportPostId(post.id)}>
                                <Flag className="h-4 w-4 me-2" />
                                {isAr ? "إبلاغ" : "Report"}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Content */}
                  <div
                    className="mt-1 text-sm leading-relaxed whitespace-pre-wrap break-words"
                    onClick={() => setThreadPostId(post.id)}
                  >
                    <MentionText content={post.content} />
                  </div>

                  {/* Images */}
                  {(post.image_urls.length > 0 || post.image_url) && (
                    <div className={cn(
                      "mt-2 overflow-hidden rounded-2xl border border-border",
                      post.image_urls.length === 1 && "max-h-[512px]",
                      post.image_urls.length >= 2 && "grid grid-cols-2 gap-0.5",
                    )}>
                      {(post.image_urls.length > 0 ? post.image_urls : [post.image_url!]).slice(0, 4).map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt=""
                          className={cn(
                            "w-full object-cover",
                            post.image_urls.length === 1 ? "max-h-[512px]" : "aspect-square",
                          )}
                          loading="lazy"
                        />
                      ))}
                    </div>
                  )}

                  {/* Link preview */}
                  {post.link_url && (
                    <a
                      href={post.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block rounded-2xl border border-border overflow-hidden hover:bg-muted/30 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-3 text-xs text-muted-foreground truncate">{post.link_url}</div>
                    </a>
                  )}

                  {/* Actions bar */}
                  <div className="mt-2 flex items-center -ms-2" onClick={(e) => e.stopPropagation()}>
                    {/* Reply */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 rounded-full px-3 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10"
                      onClick={() => setThreadPostId(post.id)}
                    >
                      <MessageCircle className="h-4 w-4" />
                      {(post.replies_count + post.comments_count) > 0 && toEnglishDigits(`${post.replies_count + post.comments_count}`)}
                    </Button>

                    {/* Repost */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-8 gap-1 rounded-full px-3 text-xs hover:text-chart-3 hover:bg-chart-3/10",
                        post.is_reposted ? "text-chart-3" : "text-muted-foreground"
                      )}
                      onClick={() => handleRepost(post.id, post.is_reposted)}
                    >
                      <Repeat2 className="h-4 w-4" />
                      {post.reposts_count > 0 && toEnglishDigits(`${post.reposts_count}`)}
                    </Button>

                    {/* Like */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-8 gap-1 rounded-full px-3 text-xs hover:text-destructive hover:bg-destructive/10",
                        post.is_liked ? "text-destructive" : "text-muted-foreground"
                      )}
                      onClick={() => handleLike(post.id, post.is_liked)}
                    >
                      <Heart className={cn("h-4 w-4", post.is_liked && "fill-current")} />
                      {post.likes_count > 0 && toEnglishDigits(`${post.likes_count}`)}
                    </Button>

                    {/* Bookmark */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-8 rounded-full px-2 text-xs hover:text-primary hover:bg-primary/10",
                        post.is_bookmarked ? "text-primary" : "text-muted-foreground"
                      )}
                      onClick={() => handleBookmark(post.id, post.is_bookmarked)}
                    >
                      <Bookmark className={cn("h-4 w-4", post.is_bookmarked && "fill-current")} />
                    </Button>

                    {/* Share */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-full px-2 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.origin + `/community/post/${post.id}`);
                        toast({ title: isAr ? "تم نسخ الرابط" : "Link copied" });
                      }}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  {/* Reactions */}
                  <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                    <PostReactions postId={post.id} />
                  </div>
                </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Thread modal */}
      {threadPostId && (
        <PostThread
          postId={threadPostId}
          onClose={() => setThreadPostId(null)}
          onPostUpdated={fetchPosts}
        />
      )}

      {/* Report dialog */}
      {reportPostId && (
        <ReportDialog
          postId={reportPostId}
          onClose={() => setReportPostId(null)}
        />
      )}
    </>
  );
}
