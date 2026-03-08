import { useState, useMemo, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Star, User, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toEnglishDigits } from "@/lib/formatNumber";

interface Props {
  masterclassId: string;
  hasCompleted: boolean;
}

export function MasterclassReviews({ masterclassId, hasCompleted }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  const { data: reviews = [] } = useQuery({
    queryKey: ["masterclass-reviews", masterclassId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("masterclass_reviews")
        .select("*, profiles:user_id(full_name, avatar_url)")
        .eq("masterclass_id", masterclassId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const myReview = useMemo(() => reviews.find((r: any) => r.user_id === user?.id), [reviews, user?.id]);
  const avgRating = useMemo(() => reviews.length > 0
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null, [reviews]);

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("masterclass_reviews").upsert({
        masterclass_id: masterclassId,
        user_id: user.id,
        rating,
        review: reviewText || null,
      }, { onConflict: "masterclass_id,user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["masterclass-reviews", masterclassId] });
      setReviewText("");
      toast({ title: language === "ar" ? "تم حفظ تقييمك" : "Review saved" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const deleteReview = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from("masterclass_reviews")
        .delete()
        .eq("masterclass_id", masterclassId)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["masterclass-reviews", masterclassId] });
      toast({ title: language === "ar" ? "تم حذف التقييم" : "Review deleted" });
    },
  });

  const StarRating = ({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-5 w-5 cursor-pointer transition-colors ${
            star <= (readonly ? value : (hoverRating || value))
              ? "fill-chart-4 text-chart-4"
              : "text-muted-foreground/30"
          } ${readonly ? "cursor-default" : ""}`}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{language === "ar" ? "التقييمات والمراجعات" : "Ratings & Reviews"}</h2>
        {avgRating && (
          <div className="flex items-center gap-2">
            <StarRating value={Math.round(Number(avgRating))} readonly />
            <span className="text-sm font-medium">{avgRating}</span>
            <span className="text-xs text-muted-foreground">({reviews.length})</span>
          </div>
        )}
      </div>

      {/* Submit Review - only if completed and no existing review */}
      {hasCompleted && !myReview && user && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{language === "ar" ? "أضف تقييمك" : "Write a Review"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">{language === "ar" ? "التقييم" : "Rating"}</Label>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <div>
              <Label>{language === "ar" ? "المراجعة (اختياري)" : "Review (optional)"}</Label>
              <Textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder={language === "ar" ? "شاركنا رأيك..." : "Share your experience..."}
                rows={3}
                className="mt-1"
              />
            </div>
            <Button onClick={() => submitReview.mutate()} disabled={submitReview.isPending}>
              {language === "ar" ? "إرسال التقييم" : "Submit Review"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* My Review */}
      {myReview && (
        <Card className="border-primary/30">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{language === "ar" ? "تقييمك" : "Your Review"}</p>
                <StarRating value={myReview.rating} readonly />
                {myReview.review && <p className="text-sm mt-2">{myReview.review}</p>}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteReview.mutate()}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Reviews */}
      {otherReviews.length > 0 && (
        <div className="space-y-3">
          {otherReviews.map((review: any) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {review.profiles?.full_name || (language === "ar" ? "مستخدم" : "User")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(review.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                    <StarRating value={review.rating} readonly />
                    {review.review && <p className="text-sm mt-2 text-muted-foreground">{review.review}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {reviews.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Star className="mx-auto mb-2 h-10 w-10 text-muted-foreground/30" />
            <p className="text-muted-foreground">
              {language === "ar" ? "لا توجد تقييمات بعد" : "No reviews yet"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
