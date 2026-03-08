import { useState, useEffect, memo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Heart, MessageCircle, Repeat2, Bookmark, Share2, User, X } from "lucide-react";
import { toEnglishDigits } from "@/lib/formatNumber";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { PostComposer } from "./PostComposer";
import { MentionText } from "./MentionText";
import { cn } from "@/lib/utils";

interface ThreadReply {
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

interface PostThreadProps {
  postId: string;
  onClose: () => void;
  onPostUpdated: () => void;
}

export function PostThread({ postId, onClose, onPostUpdated }: PostThreadProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [parentPost, setParentPost] = useState<any>(null);
  const [replies, setReplies] = useState<ThreadReply[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchThread = async () => {
    // Fetch parent post
    const { data: post } = await supabase.from("posts").select("id, content, author_id, image_url, image_urls, video_url, link_url, link_preview, visibility, replies_count, reposts_count, is_pinned, reply_to_post_id, created_at, updated_at").eq("id", postId).single();
    if (!post) return;

    // Fetch profile
    const { data: profile } = await supabase.from("profiles")
      .select("full_name, display_name, display_name_ar, username, avatar_url, specialization")
      .eq("user_id", post.author_id).single();

    setParentPost({ ...post, ...profile });

    // Fetch replies
    const { data: repliesData } = await supabase
      .from("posts")
      .select("id, author_id, content, created_at, edited_at, image_url, image_urls, is_pinned, link_preview, link_url, moderation_status, post_number, replies_count, reply_to_post_id, reposts_count, video_url, visibility")
      .eq("reply_to_post_id", postId)
      .eq("moderation_status", "approved")
      .order("created_at", { ascending: true });

    if (repliesData && repliesData.length > 0) {
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

      setReplies(
        repliesData.map((r) => {
          const p = pMap.get(r.author_id);
          return {
            id: r.id,
            content: r.content,
            image_urls: (r as any).image_urls || [],
            image_url: r.image_url,
            created_at: r.created_at,
            author_id: r.author_id,
            author_name: p?.display_name || p?.full_name || null,
            author_username: p?.username || null,
            author_avatar: p?.avatar_url || null,
            likes_count: lMap.get(r.id) || 0,
            is_liked: likedSet.has(r.id),
          };
        })
      );
    }
    setLoading(false);
  };

  useEffect(() => { fetchThread(); }, [postId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLikeReply = async (replyId: string, isLiked: boolean) => {
    if (!user) return;
    if (isLiked) {
      await supabase.from("post_likes").delete().eq("post_id", replyId).eq("user_id", user.id);
    } else {
      await supabase.from("post_likes").insert({ post_id: replyId, user_id: user.id });
    }
    setReplies((prev) =>
      prev.map((r) =>
        r.id === replyId ? { ...r, is_liked: !isLiked, likes_count: isLiked ? r.likes_count - 1 : r.likes_count + 1 } : r
      )
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return toEnglishDigits(date.toLocaleDateString(isAr ? "ar-SA" : "en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    }));
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-xl p-0 gap-0 max-h-[85vh] flex flex-col">
        <DialogHeader className="px-4 py-3 border-b border-border flex-row items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full shrink-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
          <DialogTitle className="text-base font-bold">
            {isAr ? "المنشور" : "Post"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : parentPost && (
            <div>
              {/* Parent post */}
              <div className="px-4 py-4 border-b border-border">
                <div className="flex gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={parentPost.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {(parentPost.display_name || parentPost.full_name || "C")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Link to={`/${parentPost.username || parentPost.author_id}`} className="text-sm font-bold hover:underline">
                      {parentPost.display_name || parentPost.full_name || "Chef"}
                    </Link>
                    {parentPost.username && (
                      <p className="text-xs text-muted-foreground">@{parentPost.username}</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 text-base leading-relaxed whitespace-pre-wrap break-words">
                  <MentionText content={parentPost.content} />
                </div>

                {/* Images */}
                {((parentPost as any).image_urls?.length > 0 || parentPost.image_url) && (
                  <div className={cn(
                    "mt-3 overflow-hidden rounded-2xl border border-border",
                    ((parentPost as any).image_urls?.length || 0) >= 2 && "grid grid-cols-2 gap-0.5"
                  )}>
                    {(((parentPost as any).image_urls?.length > 0 ? (parentPost as any).image_urls : [parentPost.image_url]) as string[])
                      .slice(0, 4)
                      .map((url: string, idx: number) => (
                        <img key={idx} src={url} alt="" className="w-full max-h-[400px] object-cover" loading="lazy" />
                      ))}
                  </div>
                )}

                <p className="mt-3 text-xs text-muted-foreground">{formatDate(parentPost.created_at)}</p>
              </div>

              {/* Reply composer */}
              {user && (
                <PostComposer
                  onPosted={() => { fetchThread(); onPostUpdated(); }}
                  replyToPostId={postId}
                  placeholder={isAr ? "اكتب ردك..." : "Post your reply..."}
                  compact
                  autoFocus
                />
              )}

              {/* Replies */}
              <div className="divide-y divide-border">
                {replies.map((reply) => (
                  <div key={reply.id} className="px-4 py-3 hover:bg-muted/30">
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={reply.author_avatar || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                          {(reply.author_name || "C")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold truncate">{reply.author_name || "Chef"}</span>
                          {reply.author_username && (
                            <span className="text-xs text-muted-foreground">@{reply.author_username}</span>
                          )}
                          <span className="text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground shrink-0">{formatDate(reply.created_at)}</span>
                        </div>
                        <div className="mt-1 text-sm whitespace-pre-wrap break-words">
                          <MentionText content={reply.content} />
                        </div>

                        {(reply.image_urls.length > 0 || reply.image_url) && (
                          <div className="mt-2 overflow-hidden rounded-xl border border-border">
                            {(reply.image_urls.length > 0 ? reply.image_urls : [reply.image_url!]).slice(0, 4).map((url, idx) => (
                              <img key={idx} src={url} alt="" className="w-full max-h-[300px] object-cover" loading="lazy" />
                            ))}
                          </div>
                        )}

                        <div className="mt-1 -ms-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-7 gap-1 rounded-full px-2 text-xs hover:text-destructive hover:bg-destructive/10",
                              reply.is_liked ? "text-destructive" : "text-muted-foreground"
                            )}
                            onClick={() => handleLikeReply(reply.id, reply.is_liked)}
                          >
                            <Heart className={cn("h-3.5 w-3.5", reply.is_liked && "fill-current")} />
                            {reply.likes_count > 0 && <AnimatedCounter value={reply.likes_count} className="inline" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
