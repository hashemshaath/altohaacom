import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author_id: string;
  author_name: string | null;
  author_specialization: string | null;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

export function FeedTab() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const fetchPosts = async () => {
    const { data: postsData, error } = await supabase
      .from("posts")
      .select("*")
      .is("group_id", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching posts:", error);
      setLoading(false);
      return;
    }

    // Fetch author profiles and engagement data
    const authorIds = [...new Set(postsData?.map((p) => p.author_id) || [])];
    const postIds = postsData?.map((p) => p.id) || [];

    const [profilesRes, likesRes, commentsRes, userLikesRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, specialization").in("user_id", authorIds),
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
        author_name: profile?.full_name || null,
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
  }, [user]);

  const handlePost = async () => {
    if (!user || !newPost.trim()) return;
    setPosting(true);

    const { error } = await supabase.from("posts").insert({
      author_id: user.id,
      content: newPost.trim(),
    });

    setPosting(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
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
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">{t("loading")}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Create post */}
      {user && (
        <Card>
          <CardContent className="p-4">
            <Textarea
              placeholder={t("writePost")}
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="mb-3 resize-none"
              rows={3}
            />
            <div className="flex justify-end">
              <Button onClick={handlePost} disabled={posting || !newPost.trim()}>
                {posting ? t("loading") : t("post")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts feed */}
      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t("noPostsYet")}
          </CardContent>
        </Card>
      ) : (
        posts.map((post) => (
          <Card key={post.id}>
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{post.author_name || "Chef"}</span>
                    {post.author_specialization && (
                      <span className="text-sm text-muted-foreground">• {post.author_specialization}</span>
                    )}
                    <span className="text-sm text-muted-foreground ms-auto">{formatDate(post.created_at)}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap">{post.content}</p>
                  {post.image_url && (
                    <img src={post.image_url} alt="" className="mt-3 rounded-lg max-h-96 object-cover" />
                  )}
                  <div className="mt-3 flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={post.is_liked ? "text-destructive" : ""}
                      onClick={() => handleLike(post.id, post.is_liked)}
                    >
                      <Heart className={`h-4 w-4 me-1 ${post.is_liked ? "fill-current" : ""}`} />
                      {post.likes_count}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="h-4 w-4 me-1" />
                      {post.comments_count}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
