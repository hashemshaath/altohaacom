import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Heart, MessageSquare, Share2, Hash, Send, Image as ImageIcon, Pin } from "lucide-react";

interface Props {
  exhibitionId: string;
  exhibitionTitle?: string;
  exhibitionHashtag?: string;
}

export function ExhibitionSocialWall({ exhibitionId, exhibitionTitle, exhibitionHashtag }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newPost, setNewPost] = useState("");
  const [filter, setFilter] = useState<string | null>(null);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["exhibition-social", exhibitionId, filter],
    queryFn: async () => {
      let query = supabase
        .from("exhibition_social_posts")
        .select("*")
        .eq("exhibition_id", exhibitionId)
        .eq("is_approved", true)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);

      if (filter) {
        query = query.contains("hashtags", [filter]);
      }

      const { data } = await query;
      return data || [];
    },
  });

  const { data: profiles = {} } = useQuery({
    queryKey: ["social-profiles", posts.map(p => p.user_id).join(",")],
    queryFn: async () => {
      const userIds = [...new Set(posts.map(p => p.user_id))];
      if (!userIds.length) return {};
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url")
        .in("user_id", userIds);
      const map: Record<string, any> = {};
      data?.forEach(p => { map[p.user_id] = p; });
      return map;
    },
    enabled: posts.length > 0,
  });

  const { data: userLikes = [] } = useQuery({
    queryKey: ["social-user-likes", exhibitionId, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("exhibition_social_likes")
        .select("post_id")
        .eq("user_id", user.id);
      return data?.map(l => l.post_id) || [];
    },
    enabled: !!user?.id,
  });

  const createPost = useMutation({
    mutationFn: async () => {
      if (!user?.id || !newPost.trim()) return;
      const hashtags = newPost.match(/#[\w\u0600-\u06FF_]+/g)?.map(h => h.slice(1)) || [];
      if (exhibitionHashtag && !hashtags.includes(exhibitionHashtag)) {
        hashtags.push(exhibitionHashtag);
      }
      const { error } = await supabase.from("exhibition_social_posts").insert({
        exhibition_id: exhibitionId,
        user_id: user.id,
        content: newPost.trim(),
        hashtags,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewPost("");
      queryClient.invalidateQueries({ queryKey: ["exhibition-social", exhibitionId] });
      toast({ title: isAr ? "تم النشر" : "Posted!" });
    },
  });

  const toggleLike = useMutation({
    mutationFn: async (postId: string) => {
      if (!user?.id) return;
      const liked = userLikes.includes(postId);
      if (liked) {
        await supabase.from("exhibition_social_likes").delete().eq("post_id", postId).eq("user_id", user.id);
      } else {
        await supabase.from("exhibition_social_likes").insert({ post_id: postId, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-user-likes"] });
      queryClient.invalidateQueries({ queryKey: ["exhibition-social"] });
    },
  });

  const sharePost = (content: string) => {
    const text = `${content}\n\n${exhibitionHashtag ? `#${exhibitionHashtag}` : ""}\n${window.location.href}`;
    if (navigator.share) {
      navigator.share({ text, title: exhibitionTitle });
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: isAr ? "تم النسخ" : "Copied to clipboard" });
    }
  };

  // Extract trending hashtags
  const trendingTags = posts
    .flatMap(p => p.hashtags || [])
    .reduce((acc: Record<string, number>, tag: string) => { acc[tag] = (acc[tag] || 0) + 1; return acc; }, {} as Record<string, number>);
  const topTags = Object.entries(trendingTags).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const formatTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          {isAr ? "الجدار الاجتماعي" : "Social Wall"}
        </h3>
        {exhibitionHashtag && (
          <Badge variant="secondary" className="gap-1">
            <Hash className="h-3 w-3" />{exhibitionHashtag}
          </Badge>
        )}
      </div>

      {/* Trending Tags */}
      {topTags.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Badge
            variant={filter === null ? "default" : "outline"}
            className="cursor-pointer whitespace-nowrap"
            onClick={() => setFilter(null)}
          >
            {isAr ? "الكل" : "All"}
          </Badge>
          {topTags.map(([tag, count]) => (
            <Badge
              key={tag}
              variant={filter === tag ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap gap-1"
              onClick={() => setFilter(filter === tag ? null : tag)}
            >
              #{tag} <span className="text-xs opacity-70">({count})</span>
            </Badge>
          ))}
        </div>
      )}

      {/* New Post */}
      {user && (
        <Card>
          <CardContent className="p-3">
            <Textarea
              placeholder={isAr ? `شارك تجربتك... ${exhibitionHashtag ? `#${exhibitionHashtag}` : ""}` : `Share your experience... ${exhibitionHashtag ? `#${exhibitionHashtag}` : ""}`}
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              rows={2}
              className="mb-2"
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={() => createPost.mutate()} disabled={!newPost.trim() || createPost.isPending}>
                <Send className="h-4 w-4 me-1" />
                {isAr ? "نشر" : "Post"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts */}
      <div className="space-y-3">
        {posts.map((post) => {
          const profile = profiles[post.user_id];
          const isLiked = userLikes.includes(post.id);

          return (
            <Card key={post.id} className={post.is_pinned ? "border-primary/30 bg-primary/5" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback>{(profile?.full_name || "U")[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{profile?.full_name || profile?.username || (isAr ? "مستخدم" : "User")}</span>
                      <span className="text-xs text-muted-foreground">{formatTime(post.created_at)}</span>
                      {post.is_pinned && <Pin className="h-3 w-3 text-primary" />}
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap break-words">{post.content}</p>
                    {post.hashtags && post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(post.hashtags as string[]).map((tag: string) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs cursor-pointer"
                            onClick={() => setFilter(tag)}
                          >
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-3">
                      <button
                        className={`flex items-center gap-1 text-xs transition-colors ${isLiked ? "text-destructive" : "text-muted-foreground hover:text-destructive"}`}
                        onClick={() => toggleLike.mutate(post.id)}
                        disabled={!user}
                      >
                        <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                        {post.likes_count || 0}
                      </button>
                      <button
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                        onClick={() => sharePost(post.content)}
                      >
                        <Share2 className="h-4 w-4" />
                        {isAr ? "مشاركة" : "Share"}
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {!isLoading && posts.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            {isAr ? "كن أول من يشارك!" : "Be the first to post!"}
          </p>
        )}
      </div>
    </div>
  );
}
