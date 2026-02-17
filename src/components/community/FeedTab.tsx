import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, MessageCircle, User, Send, Globe, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PostComments } from "@/components/community/PostComments";
import { toEnglishDigits } from "@/lib/formatNumber";

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author_id: string;
  author_avatar: string | null;
  author_name: string | null;
  author_username: string | null;
  author_specialization: string | null;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  showComments?: boolean;
}

type FeedFilter = "all" | "following";

export function FeedTab() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("all");

  const fetchPosts = async () => {
    setLoading(true);

    // If filtering by following, first get followed user IDs
    let followingIds: string[] = [];
    if (feedFilter === "following" && user) {
      const { data: followsData } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", user.id);
      followingIds = followsData?.map((f) => f.following_id) || [];
      // Include own posts
      followingIds.push(user.id);
    }

    let query = supabase
      .from("posts")
      .select("*")
      .is("group_id", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (feedFilter === "following" && user) {
      if (followingIds.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }
      query = query.in("author_id", followingIds);
    }

    const { data: postsData, error } = await query;

    if (error) {
      console.error("Error fetching posts:", error);
      setLoading(false);
      return;
    }

    const authorIds = [...new Set(postsData?.map((p) => p.author_id) || [])];
    const postIds = postsData?.map((p) => p.id) || [];

    const [profilesRes, likesRes, commentsRes, userLikesRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, username, specialization, avatar_url").in("user_id", authorIds),
      supabase.from("post_likes").select("post_id").in("post_id", postIds),
      supabase.from("post_comments").select("post_id").in("post_id", postIds),
      user ? supabase.from("post_likes").select("post_id").eq("user_id", user.id).in("post_id", postIds) : { data: [] },
    ]);

    const profilesMap = new Map(profilesRes.data?.map((p) => [p.user_id, p]) || []);
    const likesMap = new Map<string, number>();
    const commentsMap = new Map<string, number>();
    const userLikedSet = new Set(userLikesRes.data?.map((l) => l.post_id) || []);

    likesRes.data?.forEach((l) => likesMap.set(l.post_id, (likesMap.get(l.post_id) || 0) + 1));
    commentsRes.data?.forEach((c) => commentsMap.set(c.post_id, (commentsMap.get(c.post_id) || 0) + 1));

    const enrichedPosts: Post[] = (postsData || []).map((p) => {
      const profile = profilesMap.get(p.author_id);
      return {
        id: p.id,
        content: p.content,
        image_url: p.image_url,
        created_at: p.created_at,
        author_id: p.author_id,
        author_avatar: profile?.avatar_url || null,
        author_name: profile?.full_name || null,
        author_username: profile?.username || null,
        author_specialization: profile?.specialization || null,
        likes_count: likesMap.get(p.id) || 0,
        comments_count: commentsMap.get(p.id) || 0,
        is_liked: userLikedSet.has(p.id),
      };
    });

    setPosts(enrichedPosts);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [user, feedFilter]);

  const handlePost = async () => {
    if (!user || !newPost.trim()) return;
    setPosting(true);
    const { data: insertedPost, error } = await supabase.from("posts").insert({
      author_id: user.id,
      content: newPost.trim(),
    }).select("id").single();
    setPosting(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      // Trigger AI moderation
      try {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/moderate-content`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
            body: JSON.stringify({ post_id: insertedPost.id, content: newPost.trim(), user_id: user.id }),
          }
        );
      } catch {}
      setNewPost("");
      fetchPosts();
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!user) return;
    if (isLiked) {
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
    } else {
      await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
    }
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, is_liked: !isLiked, likes_count: isLiked ? p.likes_count - 1 : p.likes_count + 1 }
          : p
      )
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return language === "ar" ? "الآن" : "now";
    if (diffMins < 60) return language === "ar" ? `${diffMins}د` : `${diffMins}m`;
    if (diffHours < 24) return language === "ar" ? `${diffHours}س` : `${diffHours}h`;
    if (diffDays < 7) return language === "ar" ? `${diffDays}ي` : `${diffDays}d`;
    return toEnglishDigits(date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", { month: "short", day: "numeric" }));
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-14 w-full rounded-lg" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Feed filter */}
      {user && (
        <div className="flex items-center gap-2">
          <Button
            variant={feedFilter === "all" ? "default" : "outline"}
            size="sm"
            className="gap-1.5 rounded-full"
            onClick={() => setFeedFilter("all")}
          >
            <Globe className="h-3.5 w-3.5" />
            {language === "ar" ? "الكل" : "All"}
          </Button>
          <Button
            variant={feedFilter === "following" ? "default" : "outline"}
            size="sm"
            className="gap-1.5 rounded-full"
            onClick={() => setFeedFilter("following")}
          >
            <Users className="h-3.5 w-3.5" />
            {language === "ar" ? "المتابَعين" : "Following"}
          </Button>
        </div>
      )}

      {/* Create post */}
      {user && (
        <Card className="relative overflow-hidden border-primary/15">
          <div className="absolute -top-12 -end-12 h-32 w-32 rounded-full bg-primary/5 blur-[40px]" />
          <CardContent className="relative p-4">
            <div className="flex gap-3">
              <Avatar className="h-10 w-10 shrink-0 ring-2 ring-primary/10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder={t("writePost")}
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="resize-none rounded-xl border-border/50 bg-muted/30 px-4 py-3 text-sm shadow-none focus-visible:ring-1"
                  rows={2}
                />
                <div className="flex justify-end">
                  <Button size="sm" onClick={handlePost} disabled={posting || !newPost.trim()} className="gap-1.5">
                    <Send className="h-3.5 w-3.5" />
                    {posting ? t("loading") : t("post")}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts feed */}
      {posts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted/60">
              <MessageCircle className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">{t("noPostsYet")}</p>
          </CardContent>
        </Card>
      ) : (
        posts.map((post) => (
          <Card key={post.id} className="border-border/50 transition-all duration-300 hover:shadow-lg hover:border-primary/15 hover:-translate-y-0.5">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Link to={`/${post.author_username || post.author_id}`} className="shrink-0">
                  <Avatar className="h-10 w-10 transition-opacity hover:opacity-80">
                    <AvatarImage src={post.author_avatar || undefined} alt={post.author_name || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {(post.author_name || "C")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/${post.author_username || post.author_id}`}
                      className="truncate text-sm font-semibold hover:text-primary transition-colors"
                    >
                      {post.author_name || "Chef"}
                    </Link>
                    {post.author_specialization && (
                      <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                        · {post.author_specialization}
                      </span>
                    )}
                    <span className="ms-auto shrink-0 text-[10px] text-muted-foreground">
                      {formatDate(post.created_at)}
                    </span>
                  </div>
                  <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt=""
                      className="mt-3 max-h-80 w-full rounded-xl object-cover"
                      loading="lazy"
                    />
                  )}

                  <div className="mt-3 flex items-center gap-1 border-t border-border/40 pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 gap-1.5 rounded-full px-3 text-xs ${post.is_liked ? "text-destructive" : "text-muted-foreground"}`}
                      onClick={() => handleLike(post.id, post.is_liked)}
                    >
                      <Heart className={`h-3.5 w-3.5 ${post.is_liked ? "fill-current" : ""}`} />
                      {post.likes_count > 0 && post.likes_count}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 rounded-full px-3 text-xs text-muted-foreground"
                      onClick={() =>
                        setPosts((prev) =>
                          prev.map((pp) =>
                            pp.id === post.id ? { ...pp, showComments: !pp.showComments } : pp
                          )
                        )
                      }
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      {post.comments_count > 0 && post.comments_count}
                    </Button>
                  </div>
                  {post.showComments && (
                    <PostComments
                      postId={post.id}
                      onCommentCountChange={(count) =>
                        setPosts((prev) =>
                          prev.map((pp) =>
                            pp.id === post.id ? { ...pp, comments_count: count } : pp
                          )
                        )
                      }
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
