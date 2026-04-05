import { memo, useState, useCallback } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Star, User, Loader2, Trash2 } from "lucide-react";
import {
  useContentReviews,
  useContentReviewStats,
  useSubmitReview,
  useDeleteReview,
} from "@/hooks/useContentReviews";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

/* ─── Star Rating Input ─── */
function StarInput({ value, onChange, size = "md" }: { value: number; onChange: (v: number) => void; size?: "sm" | "md" }) {
  const [hover, setHover] = useState(0);
  const s = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={cn(s, "transition-colors", (hover || value) >= star ? "fill-primary text-primary" : "text-muted-foreground/30")}
          />
        </button>
      ))}
    </div>
  );
}

/* ─── Star Display ─── */
function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const s = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(s, rating >= star ? "fill-primary text-primary" : rating >= star - 0.5 ? "fill-primary/50 text-primary" : "text-muted-foreground/20")}
        />
      ))}
    </div>
  );
}

/* ─── Summary Badge ─── */
export function ReviewSummaryBadge({ entityType, entityId }: { entityType: string; entityId: string }) {
  const { count, avg } = useContentReviewStats(entityType, entityId);
  const { language } = useLanguage();
  const isAr = language === "ar";

  if (count === 0) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <StarDisplay rating={Math.round(avg)} />
      <span className="font-medium text-foreground">{avg}</span>
      <span>({count} {isAr ? "تقييم" : count === 1 ? "review" : "reviews"})</span>
    </div>
  );
}

/* ─── Main Reviews Section ─── */
const ContentReviewsSection = memo(function ContentReviewsSection({
  entityType,
  entityId,
}: {
  entityType: string;
  entityId: string;
}) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const { data: reviews = [], isLoading } = useContentReviews(entityType, entityId);
  const { count, avg } = useContentReviewStats(entityType, entityId);
  const submitReview = useSubmitReview();
  const deleteReview = useDeleteReview();

  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ["current-user-id"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user?.id || null;
    },
    staleTime: 1000 * 60 * 10,
  });

  // Get profile names for reviewers
  const reviewerIds = reviews.map((r) => r.user_id);
  const { data: profiles = [] } = useQuery({
    queryKey: ["reviewer-profiles", reviewerIds.join(",")],
    queryFn: async () => {
      if (reviewerIds.length === 0) return [];
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, full_name_ar, avatar_url")
        .in("user_id", reviewerIds);
      return data || [];
    },
    enabled: reviewerIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const getProfile = (userId: string) => profiles.find((p) => p.user_id === userId);

  const userReview = currentUser ? reviews.find((r) => r.user_id === currentUser) : null;

  const handleSubmit = useCallback(async () => {
    if (rating === 0) {
      toast({ title: isAr ? "اختر تقييماً" : "Select a rating", variant: "destructive" });
      return;
    }
    try {
      await submitReview.mutateAsync({ entity_type: entityType, entity_id: entityId, rating, content });
      setRating(0);
      setContent("");
      toast({ title: isAr ? "تم إرسال التقييم" : "Review submitted!" });
    } catch {
      toast({ title: isAr ? "يجب تسجيل الدخول" : "Please sign in first", variant: "destructive" });
    }
  }, [rating, content, entityType, entityId, isAr, submitReview, toast]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteReview.mutateAsync({ id, entityType, entityId });
      toast({ title: isAr ? "تم حذف التقييم" : "Review deleted" });
    } catch {
      toast({ title: isAr ? "خطأ" : "Error", variant: "destructive" });
    }
  }, [entityType, entityId, isAr, deleteReview, toast]);

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">
            {isAr ? "التقييمات والمراجعات" : "Ratings & Reviews"}
          </h3>
          {count > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold text-foreground">{avg}</span>
              <div>
                <StarDisplay rating={Math.round(avg)} size="md" />
                <p className="text-xs text-muted-foreground mt-0.5">
                  {count} {isAr ? "تقييم" : count === 1 ? "review" : "reviews"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Write Review Form */}
      {!userReview && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">
            {isAr ? "اكتب تقييمك" : "Write a Review"}
          </p>
          <StarInput value={rating} onChange={setRating} />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={isAr ? "شاركنا رأيك... (اختياري)" : "Share your thoughts... (optional)"}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            rows={3}
            dir={isAr ? "rtl" : "ltr"}
          />
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || submitReview.isPending}
            className="rounded-xl text-sm"
            size="sm"
          >
            {submitReview.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin me-1" />
            ) : null}
            {isAr ? "إرسال التقييم" : "Submit Review"}
          </Button>
        </div>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="h-9 w-9 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          {isAr ? "لا توجد تقييمات بعد. كن أول من يقيّم!" : "No reviews yet. Be the first to review!"}
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => {
            const profile = getProfile(review.user_id);
            const isOwn = currentUser === review.user_id;
            return (
              <div key={review.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted overflow-hidden">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {isAr
                          ? profile?.full_name_ar || profile?.full_name || (isAr ? "مستخدم" : "User")
                          : profile?.full_name || (isAr ? "مستخدم" : "User")}
                      </p>
                      {isOwn && (
                        <button
                          onClick={() => handleDelete(review.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          aria-label={isAr ? "حذف" : "Delete"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StarDisplay rating={review.rating} />
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString(isAr ? "ar" : "en", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    {review.content && (
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{review.content}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
});

export { ContentReviewsSection, StarDisplay, StarInput };
export default ContentReviewsSection;
