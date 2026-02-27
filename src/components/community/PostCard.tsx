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
import { toEnglishDigits } from "@/lib/formatNumber";
import { PostReactions } from "./PostReactions";
import { ChefBadge } from "./ChefBadge";
import { MentionText } from "./MentionText";
import { PollDisplay } from "./PollDisplay";
import { PostEditDialog } from "./PostEditDialog";
import { PostReadTime } from "./PostReadTime";
import { PostEngagementSummary } from "./PostEngagementSummary";
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

export function PostCard({
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

  return (
    <article
      className={cn(
        "transition-colors duration-200 animate-in fade-in-50",
        !isEditing && "px-4 py-3 hover:bg-muted/30 cursor-pointer",
        post.is_pinned && "bg-primary/5"
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
        <div className="flex items-center gap-1 ps-12 mb-1 text-[10px] font-bold text-muted-foreground">
          <Pin className="h-3 w-3" />
          {isAr ? "منشور مثبت" : "Pinned"}
        </div>
      )}

      {!isEditing && (
        <div className="flex gap-3">
          <Link to={`/${post.author_username || post.author_id}`} className="shrink-0 relative">
            <Avatar className="h-10 w-10 transition-opacity hover:opacity-80">
              <AvatarImage src={post.author_avatar || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {(post.author_name || "C")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <OnlineDot userId={post.author_id} />
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
              <PostReadTime content={post.content} />
              {post.edited_at && (
                <button
                  className="shrink-0 text-[10px] text-muted-foreground hover:text-primary transition-colors"
                  onClick={(e) => { e.stopPropagation(); onViewHistory(post.id); }}
                  title={isAr ? "تم التعديل" : "Edited"}
                >
                  ({isAr ? "معدّل" : "edited"})
                </button>
              )}
              <div className="ms-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {user?.id === post.author_id ? (
                      <>
                        <DropdownMenuItem onClick={() => onEdit(post)}>
                          <Pencil className="h-4 w-4 me-2" />
                          {isAr ? "تعديل" : "Edit"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(post.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4 me-2" />
                          {isAr ? "حذف" : "Delete"}
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem onClick={() => navigate(`/messages?user=${post.author_id}`)}>
                          <Mail className="h-4 w-4 me-2" />
                          {isAr ? "إرسال رسالة" : "Message"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onReport(post.id)}>
                          <Flag className="h-4 w-4 me-2" />
                          {isAr ? "إبلاغ" : "Report"}
                        </DropdownMenuItem>
                      </>
                    )}
                    {post.edited_at && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onViewHistory(post.id)}>
                          <History className="h-4 w-4 me-2" />
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
              className="mt-1 text-sm leading-relaxed whitespace-pre-wrap break-words"
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

            {/* Video */}
            {post.video_url && (
              <div className="mt-2 overflow-hidden rounded-2xl border border-border" onClick={(e) => e.stopPropagation()}>
                <video src={post.video_url} controls preload="metadata" className="w-full max-h-[512px]" />
              </div>
            )}

            {/* Engagement Summary */}
            <PostEngagementSummary
              likesCount={post.likes_count}
              commentsCount={post.comments_count}
              repostsCount={post.reposts_count}
            />

            {/* Poll */}
            <PollDisplay postId={post.id} />

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
            <div className="mt-2 flex items-center justify-between -ms-2" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 rounded-full px-3 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10"
                  onClick={() => onOpenThread(post.id)}
                >
                  <MessageCircle className="h-4 w-4" />
                  {(post.replies_count + post.comments_count) > 0 && toEnglishDigits(`${post.replies_count + post.comments_count}`)}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 gap-1 rounded-full px-3 text-xs hover:text-chart-3 hover:bg-chart-3/10 transition-transform active:scale-90",
                    post.is_reposted ? "text-chart-3" : "text-muted-foreground"
                  )}
                  onClick={() => onRepost(post.id, post.is_reposted)}
                >
                  <Repeat2 className={cn("h-4 w-4 transition-transform duration-300", post.is_reposted && "rotate-180")} />
                  {post.reposts_count > 0 && toEnglishDigits(`${post.reposts_count}`)}
                </Button>
                <LikeAnimation
                  isLiked={post.is_liked}
                  count={post.likes_count}
                  displayCount={toEnglishDigits(`${post.likes_count}`)}
                  onClick={() => onLike(post.id, post.is_liked)}
                />
                <PostReactions postId={post.id} />
              </div>
              <div className="flex items-center">
                <BookmarkCollections postId={post.id} />
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 rounded-full px-2 text-xs hover:text-primary hover:bg-primary/10 transition-transform active:scale-90",
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
                  className="h-8 rounded-full px-2 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 transition-transform active:scale-90"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin + `/community/post/${post.id}`);
                    toast({ title: isAr ? "تم نسخ الرابط" : "Link copied" });
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
}
