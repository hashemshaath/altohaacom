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
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Star, MessageSquare, Send, PenLine, Shield, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface Props {
  exhibitionId: string;
  hasEnded: boolean;
  isAr: boolean;
}

function StarRating({ rating, onRate, size = "md" }: { rating: number; onRate?: (r: number) => void; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-6 w-6" : "h-4.5 w-4.5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!onRate}
          onClick={() => onRate?.(i)}
          className={`transition-all ${onRate ? "hover:scale-125 cursor-pointer active:scale-95" : "cursor-default"}`}
        >
          <Star className={`${sz} transition-colors ${i <= rating ? "fill-chart-4 text-chart-4" : "text-border"}`} />
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
      queryClient.invalidateQueries({ queryKey: ["exhibition-review-count"] });
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

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const ratingDistribution = [5, 4, 3, 2, 1].map((r) => ({
    stars: r,
    count: reviews.filter((rev) => rev.rating === r).length,
    pct: reviews.length > 0 ? (reviews.filter((rev) => rev.rating === r).length / reviews.length) * 100 : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Summary card - elevated design */}
      <Card className="overflow-hidden border-border/60">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            {/* Left: big score */}
            <div className="flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-transparent p-6 sm:w-44 sm:border-e border-b sm:border-b-0 border-border/40">
              <p className="text-5xl font-bold tracking-tight text-foreground">{avgRating.toFixed(1)}</p>
              <StarRating rating={Math.round(avgRating)} size="md" />
              <p className="mt-2 text-xs text-muted-foreground font-medium">
                {reviews.length} {isAr ? "تقييم" : reviews.length === 1 ? "review" : "reviews"}
              </p>
            </div>

            {/* Right: distribution */}
            <div className="flex-1 p-5 space-y-2">
              {ratingDistribution.map((d) => (
                <div key={d.stars} className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1 w-9 justify-end shrink-0">
                    <span className="text-xs font-semibold tabular-nums">{d.stars}</span>
                    <Star className="h-3 w-3 text-chart-4 fill-chart-4" />
                  </div>
                  <div className="h-2.5 flex-1 rounded-full bg-muted/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-chart-4/80 to-chart-4 transition-all duration-500"
                      style={{ width: `${d.pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-[10px] text-muted-foreground text-end tabular-nums font-medium">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Review CTA */}
      {user && !myReview && (
        <div>
          {!showForm ? (
            <Card className="group cursor-pointer border-dashed border-2 border-primary/20 transition-all hover:border-primary/40 hover:shadow-sm" onClick={() => setShowForm(true)}>
              <CardContent className="py-5 flex items-center justify-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 transition-transform group-hover:scale-110">
                  <PenLine className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-semibold text-primary">{isAr ? "اكتب تقييمك" : "Write a Review"}</span>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-primary/20 shadow-lg shadow-primary/5">
              <CardContent className="p-5 space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{isAr ? "تقييمك" : "Your Rating"} *</Label>
                  <StarRating rating={newRating} onRate={setNewRating} size="lg" />
                </div>
                <Separator className="border-border/40" />
                <div className="space-y-2">
                  <Label className="text-xs font-medium">{isAr ? "عنوان (اختياري)" : "Title (optional)"}</Label>
                  <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={isAr ? "ملخص تقييمك" : "Summary of your review"} className="h-10 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">{isAr ? "التفاصيل (اختياري)" : "Details (optional)"}</Label>
                  <Textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder={isAr ? "شاركنا تجربتك..." : "Share your experience..."} rows={3} className="rounded-xl resize-none" />
                </div>
                <div className="flex gap-2">
                  <Button className="shadow-md shadow-primary/10" onClick={() => submitReview.mutate()} disabled={newRating === 0 || submitReview.isPending}>
                    <Send className="me-2 h-3.5 w-3.5" />
                    {submitReview.isPending ? (isAr ? "جاري الإرسال..." : "Submitting...") : (isAr ? "إرسال التقييم" : "Submit Review")}
                  </Button>
                  <Button variant="ghost" onClick={() => { setShowForm(false); setNewRating(0); }}>
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
          <Card key={review.id} className="border-border/50 transition-all hover:shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 shrink-0 ring-2 ring-border/30">
                  <AvatarImage src={review.profile?.avatar_url} />
                  <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                    {(review.profile?.full_name || review.profile?.username || "U")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">
                      {review.profile?.full_name || review.profile?.username || (isAr ? "مستخدم" : "User")}
                    </span>
                    {review.is_verified_attendee && (
                      <Badge variant="outline" className="text-[8px] h-4 px-1.5 text-chart-3 border-chart-3/30 gap-0.5">
                        <Shield className="h-2 w-2" />
                        {isAr ? "حاضر" : "Verified"}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-0.5">
                    <StarRating rating={review.rating} size="sm" />
                  </div>
                  {review.title && <p className="mt-2 text-sm font-medium text-foreground">{review.title}</p>}
                  {review.content && (
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap break-words">{review.content}</p>
                  )}
                  <p className="mt-2.5 text-[10px] text-muted-foreground/60 font-medium">{format(new Date(review.created_at), "MMM d, yyyy")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {reviews.length === 0 && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60">
              <MessageSquare className="h-7 w-7 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">{isAr ? "لا توجد تقييمات بعد" : "No reviews yet"}</p>
            <p className="mt-1 text-xs text-muted-foreground/60">{isAr ? "كن أول من يقيّم!" : "Be the first to review!"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
