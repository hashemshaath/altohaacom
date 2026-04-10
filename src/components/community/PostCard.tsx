import { memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Heart, MessageCircle, Repeat2, Bookmark, Share2, MoreHorizontal,
  Flag, Trash2, Pin, Mail, Pencil, History,
} from "lucide-react";
import { BookmarkCollections } from "./BookmarkCollections";
import { LikeAnimation } from "./LikeAnimation";
import { OnlineDot } from "./PresenceIndicator";
import { PostEngagementBar } from "./PostEngagementBar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { PostReactions } from "./PostReactions";
import { ChefBadge } from "./ChefBadge";
import { MentionText } from "./MentionText";
import { PollDisplay } from "./PollDisplay";
import { PostEditDialog } from "./PostEditDialog";
import { PostReadTime } from "./PostReadTime";
import { PostEngagementSummary } from "./PostEngagementSummary";
import { QuickReactions } from "./QuickReactions";
import { cn } from "@/lib/utils";
import type { CommunityPost } from "./CommunityFeed";

interface PostCardProps {
  post: CommunityPost;
  isEditing: boolean;
  onEdit: (post: CommunityPost) => void;
  onEditClose: () => void;
  onEditSaved: (postId: string, newContent: string) => void;
  onDelete: (postId: string) => void;
  onLike: (postId: string, isLiked: boolean) => void;
  onBookmark: (postId: string, isBookmarked: boolean) => void;
  onRepost: (postId: string, isReposted: boolean) => void;
  onOpenThread: (postId: string) => void;
  onReport: (postId: string) => void;
  onViewHistory: (postId: string) => void;
  formatDate: (dateStr: string) => string;
}

export const PostCard = memo(function PostCard({
  post,
  isEditing,
  onEdit,
  onEditClose,
  onEditSaved,
  onDelete,
  onLike,
  onBookmark,
  onRepost,
  onOpenThread,
  onReport,
  onViewHistory,
  formatDate,
}: PostCardProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isAr = language === "ar";

  const totalEngagement = post.likes_count + post.comments_count + post.reposts_count;
  const isHotPost = totalEngagement >= 10;
  const isViral = totalEngagement >= 50;

  return (
    <article
      className={cn(
        "transition-colors duration-200 animate-in fade-in-50",
        !isEditing && "px-4 py-4 sm:px-5 sm:py-5 hover:bg-muted/20 cursor-pointer",
        post.is_pinned && "bg-primary/5",
        isViral && !post.is_pinned && "bg-chart-4/[0.03]"
      )}
    >
      {isEditing && (
        <PostEditDialog
          post={post}
          onClose={onEditClose}
          onSaved={onEditSaved}
        />
      )}

      {!isEditing && post.is_pinned && (
        <div className="flex items-center gap-1.5 ps-12 mb-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
          <Pin className="h-3 w-3" />
          {isAr ? "منشور مثبت" : "Pinned"}
        </div>
      )}

      {!isEditing && isViral && !post.is_pinned && (
        <div className="flex items-center gap-1.5 ps-12 mb-2 text-[11px] font-bold text-chart-4 animate-in fade-in-50">
          🔥 {isAr ? "منشور رائج" : "Trending"}
          <span className="text-muted-foreground/60 font-normal">· {totalEngagement} {isAr ? "تفاعل" : "interactions"}</span>
        </div>
      )}

      {!isEditing && (
        <div className="flex gap-3 sm:gap-3.5">
          <Link to={`/${post.author_username || post.author_id}`} className="shrink-0 relative group/avatar">
            <Avatar className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl ring-2 ring-border/15 transition-all duration-300 group-hover/avatar:ring-primary/30 group-hover/avatar:scale-105 shadow-sm">
              <AvatarImage src={post.author_avatar || undefined} className="object-cover rounded-xl" />
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-sm font-bold">
                {(post.author_name || "C")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <OnlineDot userId={post.author_id} />
          </Link>
          <div className="min-w-0 flex-1">
            {/* Header */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                to={`/${post.author_username || post.author_id}`}
                className="truncate text-[14px] sm:text-sm font-bold hover:underline decoration-primary/30"
              >
                {post.author_name || "Chef"}
              </Link>
              <ChefBadge userId={post.author_id} />
              {post.author_username && (
                <span className="truncate text-[12px] text-muted-foreground/60">
                  @{post.author_username}
                </span>
              )}
              <span className="text-muted-foreground/30">·</span>
              <span className="shrink-0 text-[12px] text-muted-foreground/60 tabular-nums">
                {formatDate(post.created_at)}
              </span>
              <PostReadTime content={post.content} />
              {post.edited_at && (
                <button
                  className="shrink-0 text-[11px] text-muted-foreground/50 hover:text-primary transition-colors"
                  onClick={(e) => { e.stopPropagation(); onViewHistory(post.id); }}
                  title={isAr ? "تم التعديل" : "Edited"}
                >
                  ({isAr ? "معدّل" : "edited"})
                </button>
              )}
              <div className="ms-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl">
                    {user?.id === post.author_id ? (
                      <>
                        <DropdownMenuItem onClick={() => onEdit(post)} className="rounded-xl gap-2 text-xs">
                          <Pencil className="h-3.5 w-3.5" />
                          {isAr ? "تعديل" : "Edit"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(post.id)} className="text-destructive rounded-xl gap-2 text-xs">
                          <Trash2 className="h-3.5 w-3.5" />
                          {isAr ? "حذف" : "Delete"}
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem onClick={() => navigate(`/messages?user=${post.author_id}`)} className="rounded-xl gap-2 text-xs">
                          <Mail className="h-3.5 w-3.5" />
                          {isAr ? "إرسال رسالة" : "Message"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onReport(post.id)} className="rounded-xl gap-2 text-xs">
                          <Flag className="h-3.5 w-3.5" />
                          {isAr ? "إبلاغ" : "Report"}
                        </DropdownMenuItem>
                      </>
                    )}
                    {post.edited_at && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onViewHistory(post.id)} className="rounded-xl gap-2 text-xs">
                          <History className="h-3.5 w-3.5" />
                          {isAr ? "سجل التعديلات" : "Edit History"}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Content */}
            <div
              className="mt-2 sm:mt-2.5 text-[14px] sm:text-[15px] leading-[1.7] whitespace-pre-wrap break-words text-foreground/90"
              onClick={() => onOpenThread(post.id)}
            >
              <MentionText content={post.content} />
            </div>

            {/* Engagement insights */}
            <PostEngagementBar
              content={post.content}
              likesCount={post.likes_count}
              commentsCount={post.comments_count}
              repostsCount={post.reposts_count}
            />

            {/* Images */}
            {(post.image_urls.length > 0 || post.image_url) && (() => {
              const urls = post.image_urls.length > 0 ? post.image_urls : [post.image_url!];
              const count = Math.min(urls.length, 4);
              return (
                <div className={cn(
                  "mt-3 overflow-hidden rounded-2xl border border-border/30 shadow-sm transition-shadow duration-300 hover:shadow-md",
                  count === 1 && "max-h-[512px]",
                  count === 2 && "grid grid-cols-2 gap-0.5",
                  count === 3 && "grid grid-cols-2 gap-0.5",
                  count >= 4 && "grid grid-cols-2 gap-0.5",
                )}>
                  {urls.slice(0, 4).map((url, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "relative overflow-hidden bg-muted",
                        count === 1 && "max-h-[512px]",
                        count === 3 && idx === 0 && "row-span-2",
                        count > 1 && "aspect-square",
                      )}
                    >
                      <img loading="lazy"
                        src={url}
                        alt={`Post image ${idx + 1}`}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                      {idx === 3 && urls.length > 4 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                          <span className="text-lg font-bold text-foreground">+{urls.length - 4}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Video */}
            {post.video_url && (
              <div className="mt-3 overflow-hidden rounded-2xl border border-border/30 shadow-sm transition-shadow duration-300 hover:shadow-md" onClick={(e) => e.stopPropagation()}>
                <video src={post.video_url} controls preload="metadata" className="w-full max-h-[512px]" aria-label={post.content?.slice(0, 100) || "Post video"} />
              </div>
            )}

            {/* Engagement Summary */}
            <PostEngagementSummary
              likesCount={post.likes_count}
              commentsCount={post.comments_count}
              repostsCount={post.reposts_count}
            />

            {/* Hot post indicator */}
            {isHotPost && !isViral && (
              <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-chart-4/70">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-chart-4 animate-pulse" />
                {isAr ? "محتوى نشط" : "Active thread"}
              </div>
            )}

            {/* Quick Reactions */}
            <div className="mt-2.5" onClick={(e) => e.stopPropagation()}>
              <QuickReactions postId={post.id} />
            </div>

            {/* Poll - only render if post has a poll */}
            {post.has_poll && <PollDisplay postId={post.id} />}

            {/* Link preview */}
            {post.link_url && (
              <a
                href={post.link_url}
                target="_blank" rel="noopener noreferrer"
                className="mt-3 block rounded-2xl border border-border/30 overflow-hidden hover:bg-muted/20 hover:border-primary/20 hover:shadow-sm transition-all duration-200 shadow-sm group/link"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-3 text-xs text-muted-foreground truncate group-hover/link:text-primary transition-colors">{post.link_url}</div>
              </a>
            )}

            {/* Actions bar */}
            <div className="mt-3 flex items-center justify-between -ms-2 pt-2.5 border-t border-border/10" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 gap-1 sm:gap-1.5 rounded-xl px-2.5 sm:px-3 text-[12px] sm:text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 touch-manipulation active:scale-95"
                  onClick={() => onOpenThread(post.id)}
                >
                  <MessageCircle className="h-4 w-4" />
                  {(post.replies_count + post.comments_count) > 0 && <AnimatedCounter value={post.replies_count + post.comments_count} className="inline" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-9 gap-1 sm:gap-1.5 rounded-xl px-2.5 sm:px-3 text-[12px] sm:text-xs hover:text-chart-3 hover:bg-chart-3/10 transition-transform active:scale-90 touch-manipulation",
                    post.is_reposted ? "text-chart-3" : "text-muted-foreground"
                  )}
                  onClick={() => onRepost(post.id, post.is_reposted)}
                >
                  <Repeat2 className={cn("h-4 w-4 transition-transform duration-300", post.is_reposted && "rotate-180")} />
                  {post.reposts_count > 0 && <AnimatedCounter value={post.reposts_count} className="inline" />}
                </Button>
                <LikeAnimation
                  isLiked={post.is_liked}
                  count={post.likes_count}
                  displayCount={`${post.likes_count}`}
                  onClick={() => onLike(post.id, post.is_liked)}
                />
                <PostReactions postId={post.id} initialReactions={post.reactions} />
              </div>
              <div className="flex items-center">
                <BookmarkCollections postId={post.id} />
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 rounded-xl px-2 text-xs hover:text-primary hover:bg-primary/10 transition-transform active:scale-90",
                    post.is_bookmarked ? "text-primary" : "text-muted-foreground"
                  )}
                  onClick={() => onBookmark(post.id, post.is_bookmarked)}
                >
                  <Bookmark className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    post.is_bookmarked && "fill-current scale-110"
                  )} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-xl px-2 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 transition-transform active:scale-90"
                  onClick={async () => {
                    const url = window.location.origin + `/community/post/${post.id}`;
                    try {
                      if (navigator.share) {
                        await navigator.share({ title: post.content?.slice(0, 60), url });
                      } else {
                        await navigator.clipboard.writeText(url).then(null, () => {});
                      }
                      toast({ title: isAr ? "تم نسخ الرابط" : "Link copied" });
                    } catch {
                      await navigator.clipboard.writeText(url).then(null, () => {});
                      toast({ title: isAr ? "تم نسخ الرابط" : "Link copied" });
                    }
                  }}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
});
