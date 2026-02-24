import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Star, MessageSquare, ThumbsUp, Send } from "lucide-react";
import { format } from "date-fns";

interface Props {
  exhibitionId: string;
  hasEnded: boolean;
  isAr: boolean;
}

function StarRating({ rating, onRate, size = "md" }: { rating: number; onRate?: (r: number) => void; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!onRate}
          onClick={() => onRate?.(i)}
          className={`transition-transform ${onRate ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}
        >
          <Star className={`${sz} ${i <= rating ? "fill-chart-4 text-chart-4" : "text-muted-foreground/30"}`} />
        </button>
      ))}
    </div>
  );
}

export function ExhibitionReviewsTab({ exhibitionId, hasEnded, isAr }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["exhibition-reviews", exhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibition_reviews")
        .select("*")
        .eq("exhibition_id", exhibitionId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Get reviewer profiles
      const userIds = [...new Set((data || []).map((r) => r.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, username, avatar_url")
          .in("user_id", userIds);
        const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
        return (data || []).map((r) => ({ ...r, profile: profileMap.get(r.user_id) || null }));
      }
      return (data || []).map((r) => ({ ...r, profile: null }));
    },
  });

  const { data: myReview } = useQuery({
    queryKey: ["exhibition-my-review", exhibitionId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("exhibition_reviews")
        .select("*")
        .eq("exhibition_id", exhibitionId)
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (newRating === 0) throw new Error("Rating required");
      const { error } = await supabase.from("exhibition_reviews").insert({
        exhibition_id: exhibitionId,
        user_id: user.id,
        rating: newRating,
        title: newTitle || null,
        content: newContent || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibition-reviews", exhibitionId] });
      queryClient.invalidateQueries({ queryKey: ["exhibition-my-review", exhibitionId] });
      setShowForm(false);
      setNewRating(0);
      setNewTitle("");
      setNewContent("");
      toast({ title: isAr ? "شكراً لتقييمك! ⭐" : "Thanks for your review! ⭐" });
    },
    onError: (e: any) => {
      const isDuplicate = e?.message?.includes("unique") || e?.code === "23505";
      toast({
        title: isAr ? "خطأ" : "Error",
        description: isDuplicate ? (isAr ? "لقد قمت بالتقييم مسبقاً" : "You already reviewed this exhibition") : (isAr ? "فشل في إرسال التقييم" : "Failed to submit review"),
        variant: "destructive",
      });
    },
  });

  // Stats
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const ratingDistribution = [5, 4, 3, 2, 1].map((r) => ({
    stars: r,
    count: reviews.filter((rev) => rev.rating === r).length,
    pct: reviews.length > 0 ? (reviews.filter((rev) => rev.rating === r).length / reviews.length) * 100 : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="text-center">
              <p className="text-4xl font-bold">{avgRating.toFixed(1)}</p>
              <StarRating rating={Math.round(avgRating)} size="md" />
              <p className="mt-1 text-xs text-muted-foreground">{reviews.length} {isAr ? "تقييم" : "reviews"}</p>
            </div>
            <div className="flex-1 space-y-1.5 w-full max-w-xs">
              {ratingDistribution.map((d) => (
                <div key={d.stars} className="flex items-center gap-2">
                  <span className="w-3 text-xs font-medium">{d.stars}</span>
                  <Star className="h-3 w-3 text-chart-4 fill-chart-4" />
                  <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-chart-4 transition-all" style={{ width: `${d.pct}%` }} />
                  </div>
                  <span className="w-6 text-[10px] text-muted-foreground text-end">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Review */}
      {user && !myReview && (
        <div>
          {!showForm ? (
            <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
              <MessageSquare className="me-2 h-4 w-4" />
              {isAr ? "اكتب تقييمك" : "Write a Review"}
            </Button>
          ) : (
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label>{isAr ? "تقييمك" : "Your Rating"} *</Label>
                  <StarRating rating={newRating} onRate={setNewRating} />
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "عنوان (اختياري)" : "Title (optional)"}</Label>
                  <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={isAr ? "ملخص تقييمك" : "Summary of your review"} />
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "التفاصيل (اختياري)" : "Details (optional)"}</Label>
                  <Textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder={isAr ? "شاركنا تجربتك..." : "Share your experience..."} rows={3} />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => submitReview.mutate()} disabled={newRating === 0 || submitReview.isPending}>
                    <Send className="me-2 h-4 w-4" />
                    {submitReview.isPending ? (isAr ? "جاري الإرسال..." : "Submitting...") : (isAr ? "إرسال التقييم" : "Submit Review")}
                  </Button>
                  <Button variant="ghost" onClick={() => setShowForm(false)}>
                    {isAr ? "إلغاء" : "Cancel"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Reviews list */}
      <div className="space-y-3">
        {reviews.map((review: any) => (
          <Card key={review.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={review.profile?.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {(review.profile?.full_name || review.profile?.username || "U")[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">
                      {review.profile?.full_name || review.profile?.username || (isAr ? "مستخدم" : "User")}
                    </span>
                    <StarRating rating={review.rating} size="sm" />
                    {review.is_verified_attendee && (
                      <Badge variant="outline" className="text-[9px] text-chart-3 border-chart-3/30">
                        {isAr ? "حاضر ✓" : "Verified ✓"}
                      </Badge>
                    )}
                  </div>
                  {review.title && <p className="mt-1 text-sm font-medium">{review.title}</p>}
                  {review.content && <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{review.content}</p>}
                  <p className="mt-2 text-[10px] text-muted-foreground">{format(new Date(review.created_at), "MMM d, yyyy")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {reviews.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {isAr ? "لا توجد تقييمات بعد. كن أول من يقيّم!" : "No reviews yet. Be the first to review!"}
          </p>
        )}
      </div>
    </div>
  );
}
