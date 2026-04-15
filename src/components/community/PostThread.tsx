import { useIsAr } from "@/hooks/useIsAr";
import { memo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Heart, X } from "lucide-react";
import { toEnglishDigits } from "@/lib/formatNumber";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { PostComposer } from "./PostComposer";
import { MentionText } from "./MentionText";
import { cn } from "@/lib/utils";
import { usePostThread } from "@/hooks/community/usePostThread";

interface PostThreadProps {
  postId: string;
  onClose: () => void;
  onPostUpdated: () => void;
}

export const PostThread = memo(function PostThread({ postId, onClose, onPostUpdated }: PostThreadProps) {
  const { user } = useAuth();
  const isAr = useIsAr();
  const { parentPost, replies, isLoading, refetch, toggleReplyLike } = usePostThread(postId);

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
          {isLoading ? (
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

                {(parentPost.image_urls?.length ? true : parentPost.image_url) && (
                  <div className={cn(
                    "mt-3 overflow-hidden rounded-2xl border border-border",
                    (parentPost.image_urls?.length || 0) >= 2 && "grid grid-cols-2 gap-0.5"
                  )}>
                    {((parentPost.image_urls?.length ? parentPost.image_urls : [parentPost.image_url].filter(Boolean)) as string[])
                      .slice(0, 4)
                      .map((url: string, idx: number) => (
                        <img key={idx} src={url} alt={`Post image ${idx + 1}`} className="w-full max-h-[400px] object-cover" loading="lazy" />
                      ))}
                  </div>
                )}

                <p className="mt-3 text-xs text-muted-foreground">{formatDate(parentPost.created_at as string)}</p>
              </div>

              {/* Reply composer */}
              {user && (
                <PostComposer
                  onPosted={() => { refetch(); onPostUpdated(); }}
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
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
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
                              <img key={idx} src={url} alt={`Reply image ${idx + 1}`} className="w-full max-h-[300px] object-cover" loading="lazy" />
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
                            onClick={() => toggleReplyLike(reply.id, reply.is_liked)}
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
});
