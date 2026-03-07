import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Reply, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author_name: string | null;
  author_avatar: string | null;
  parent_comment_id: string | null;
  replies: Comment[];
}

interface PostCommentsProps {
  postId: string;
  onCommentCountChange?: (count: number) => void;
}

export function PostComments({ postId, onCommentCountChange }: PostCommentsProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("post_comments")
      .select("id, post_id, author_id, content, parent_comment_id, created_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      setLoading(false);
      return;
    }

    const userIds = [...new Set(data?.map((c) => c.author_id) || [])];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

    const allComments: Comment[] = (data || []).map((c) => {
      const profile = profileMap.get(c.author_id);
      return {
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        user_id: c.author_id,
        author_name: (profile as any)?.full_name || null,
        author_avatar: (profile as any)?.avatar_url || null,
        parent_comment_id: c.parent_comment_id || null,
        replies: [],
      };
    });

    // Build tree
    const rootComments: Comment[] = [];
    const commentMap = new Map<string, Comment>();
    allComments.forEach((c) => commentMap.set(c.id, c));
    allComments.forEach((c) => {
      if (c.parent_comment_id && commentMap.has(c.parent_comment_id)) {
        commentMap.get(c.parent_comment_id)!.replies.push(c);
      } else {
        rootComments.push(c);
      }
    });

    setComments(rootComments);
    onCommentCountChange?.(allComments.length);
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleSubmit = async (parentId: string | null = null) => {
    if (!user) return;
    const content = parentId ? replyContent : newComment;
    if (!content.trim()) return;

    setSubmitting(true);
    const { error } = await supabase.from("post_comments").insert({
      post_id: postId,
      author_id: user.id,
      content: content.trim(),
      parent_comment_id: parentId,
    });

    setSubmitting(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      if (parentId) {
        setReplyContent("");
        setReplyingTo(null);
      } else {
        setNewComment("");
      }
      fetchComments();
    }
  };

  const renderComment = (comment: Comment, depth = 0) => (
    <div key={comment.id} className={depth > 0 ? "ms-8 border-s-2 border-border ps-4" : ""}>
      <div className="flex gap-2 py-2">
        <Avatar className="h-7 w-7">
          <AvatarImage src={comment.author_avatar || undefined} alt={comment.author_name || ""} />
          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
            {(comment.author_name || "U")[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{comment.author_name || "User"}</span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(comment.created_at), "MMM d, HH:mm")}
            </span>
          </div>
          <p className="text-sm mt-0.5">{comment.content}</p>
          {user && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground"
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            >
              <Reply className="h-3 w-3 me-1" />
              {language === "ar" ? "رد" : "Reply"}
            </Button>
          )}
          {replyingTo === comment.id && (
            <div className="mt-2 flex gap-2">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={language === "ar" ? "اكتب ردك..." : "Write a reply..."}
                className="text-sm resize-none"
                rows={2}
              />
              <Button size="sm" onClick={() => handleSubmit(comment.id)} disabled={submitting || !replyContent.trim()}>
                {language === "ar" ? "رد" : "Reply"}
              </Button>
            </div>
          )}
        </div>
      </div>
      {comment.replies.map((r) => renderComment(r, depth + 1))}
    </div>
  );

  if (loading) return null;

  return (
    <div className="mt-3 border-t pt-3">
      {comments.map((c) => renderComment(c))}
      {user && (
        <div className="mt-2 flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={language === "ar" ? "اكتب تعليقاً..." : "Write a comment..."}
            className="text-sm resize-none"
            rows={2}
          />
          <Button size="sm" onClick={() => handleSubmit()} disabled={submitting || !newComment.trim()}>
            {language === "ar" ? "تعليق" : "Post"}
          </Button>
        </div>
      )}
    </div>
  );
}
