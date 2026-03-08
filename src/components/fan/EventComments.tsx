import { useState, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Heart, Send, Loader2, Trash2, Flag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

interface EventCommentsProps {
  eventType: "competition" | "exhibition";
  eventId: string;
}

export function EventComments({ eventType, eventId }: EventCommentsProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["event-comments", eventType, eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_comments")
        .select("id, content, user_id, event_type, event_id, parent_id, likes_count, is_flagged, is_hidden, created_at")
        .eq("event_type", eventType)
        .eq("event_id", eventId)
        .is("parent_id", null)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch replies
      const commentIds = data.map(c => c.id);
      const { data: replies } = await supabase
        .from("event_comments")
        .select("id, content, user_id, event_type, event_id, parent_id, likes_count, is_flagged, is_hidden, created_at")
        .in("parent_id", commentIds)
        .order("created_at", { ascending: true });

      // Fetch profiles
      const allComments = [...data, ...(replies || [])];
      const userIds = [...new Set(allComments.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, username")
        .in("user_id", userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Fetch user's likes
      let likedIds: Set<string> = new Set();
      if (user) {
        const { data: likes } = await supabase
          .from("event_comment_likes")
          .select("comment_id")
          .eq("user_id", user.id)
          .in("comment_id", allComments.map(c => c.id));
        likedIds = new Set(likes?.map(l => l.comment_id) || []);
      }

      const replyMap = new Map<string, any[]>();
      (replies || []).forEach(r => {
        const arr = replyMap.get(r.parent_id!) || [];
        arr.push({ ...r, author: profileMap.get(r.user_id), isLiked: likedIds.has(r.id) });
        replyMap.set(r.parent_id!, arr);
      });

      return data.map(c => ({
        ...c,
        author: profileMap.get(c.user_id),
        isLiked: likedIds.has(c.id),
        replies: replyMap.get(c.id) || [],
      }));
    },
  });

  const postMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("event_comments").insert({
        user_id: user!.id,
        event_type: eventType,
        event_id: eventId,
        parent_id: replyTo,
        content: content.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setContent("");
      setReplyTo(null);
      queryClient.invalidateQueries({ queryKey: ["event-comments", eventType, eventId] });
    },
    onError: () => toast({ title: isAr ? "حدث خطأ" : "Error posting comment", variant: "destructive" }),
  });

  const likeMutation = useMutation({
    mutationFn: async ({ commentId, isLiked }: { commentId: string; isLiked: boolean }) => {
      if (isLiked) {
        await supabase.from("event_comment_likes").delete().eq("comment_id", commentId).eq("user_id", user!.id);
      } else {
        await supabase.from("event_comment_likes").insert({ comment_id: commentId, user_id: user!.id });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event-comments", eventType, eventId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await supabase.from("event_comments").delete().eq("id", commentId).eq("user_id", user!.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-comments", eventType, eventId] });
      toast({ title: isAr ? "تم حذف التعليق" : "Comment deleted" });
    },
  });

  const renderComment = (comment: any, isReply = false) => (
    <div key={comment.id} className={`flex gap-2.5 ${isReply ? "ms-10 mt-2" : "py-3"}`}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={comment.author?.avatar_url} />
        <AvatarFallback className="text-[10px]">{(comment.author?.full_name || "?")[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">{comment.author?.full_name || comment.author?.username || (isAr ? "مجهول" : "Anonymous")}</span>
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: isAr ? ar : enUS })}
          </span>
        </div>
        <p className="text-xs text-foreground/80 mt-0.5 whitespace-pre-wrap">{comment.content}</p>
        <div className="flex items-center gap-3 mt-1.5">
          {user && (
            <>
              <button
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
                onClick={() => likeMutation.mutate({ commentId: comment.id, isLiked: comment.isLiked })}
              >
                <Heart className={`h-3 w-3 ${comment.isLiked ? "fill-primary text-primary" : ""}`} />
                {comment.likes_count > 0 && comment.likes_count}
              </button>
              {!isReply && (
                <button
                  className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                >
                  {isAr ? "رد" : "Reply"}
                </button>
              )}
              {comment.user_id === user.id ? (
                <button
                  className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                  onClick={() => deleteMutation.mutate(comment.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              ) : (
                <button
                  className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const { error } = await supabase.from("event_comments").update({ is_flagged: true, flagged_by: user.id, flagged_at: new Date().toISOString() }).eq("id", comment.id);
                    if (!error) {
                      toast({ title: isAr ? "تم الإبلاغ" : "Comment flagged for review" });
                    }
                  }}
                  title={isAr ? "إبلاغ" : "Report"}
                >
                  <Flag className="h-3 w-3" />
                </button>
              )}
            </>
          )}
        </div>
        {/* Replies */}
        {comment.replies?.map((r: any) => renderComment(r, true))}
        {/* Reply input */}
        {replyTo === comment.id && user && (
          <div className="flex gap-2 mt-2 ms-10">
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={isAr ? "اكتب ردك..." : "Write a reply..."}
              className="text-xs min-h-[60px] resize-none"
            />
            <Button size="sm" className="shrink-0 h-8" onClick={() => postMutation.mutate()} disabled={!content.trim() || postMutation.isPending}>
              {postMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{isAr ? "التعليقات" : "Comments"}</h3>
        {comments.length > 0 && (
          <span className="text-xs text-muted-foreground">({comments.length})</span>
        )}
      </div>

      {/* Post new comment */}
      {user ? (
        <div className="flex gap-2">
          <Textarea
            value={replyTo ? "" : content}
            onChange={e => { if (!replyTo) setContent(e.target.value); }}
            placeholder={isAr ? "شارك رأيك..." : "Share your thoughts..."}
            className="text-xs min-h-[70px] resize-none"
            disabled={!!replyTo}
          />
          <Button
            size="sm"
            className="shrink-0 h-8 self-end"
            onClick={() => postMutation.mutate()}
            disabled={!content.trim() || postMutation.isPending || !!replyTo}
          >
            {postMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{isAr ? "سجل دخولك للتعليق" : "Sign in to comment"}</p>
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-muted/50 animate-pulse" />)}</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-xs text-muted-foreground">{isAr ? "كن أول من يعلق!" : "Be the first to comment!"}</p>
        </div>
      ) : (
        <div className="divide-y divide-border/30">
          {comments.map((c: any) => renderComment(c))}
        </div>
      )}
    </div>
  );
}
