import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Star, MessageSquare, Send, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface RecipeReviewsProps {
  recipeId: string;
}

export function RecipeReviews({ recipeId }: RecipeReviewsProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const { data: reviews = [] } = useQuery({
    queryKey: ["recipe-reviews", recipeId],
    queryFn: async () => {
      const { data } = await supabase
        .from("recipe_reviews")
        .select("id, rating, comment, created_at, user_id")
        .eq("recipe_id", recipeId)
        .order("created_at", { ascending: false });

      if (!data || data.length === 0) return [];

      const userIds = [...new Set(data.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, username")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
      return data.map((r) => ({ ...r, profile: profileMap.get(r.user_id) }));
    },
  });

  const myReview = reviews.find((r) => r.user_id === user?.id);
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!user || rating === 0) throw new Error("Missing data");
      if (myReview) {
        await supabase
          .from("recipe_reviews")
          .update({ rating, comment: comment || null, updated_at: new Date().toISOString() })
          .eq("id", myReview.id);
      } else {
        await supabase
          .from("recipe_reviews")
          .insert({ recipe_id: recipeId, user_id: user.id, rating, comment: comment || null });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipe-reviews", recipeId] });
      toast({ title: isAr ? "تم حفظ تقييمك" : "Review saved!" });
      setIsEditing(false);
      setRating(0);
      setComment("");
    },
    onError: () => {
      toast({ title: isAr ? "حدث خطأ" : "Failed to save", variant: "destructive" });
    },
  });

  const showForm = user && (!myReview || isEditing);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-chart-4" />
            {isAr ? "التقييمات" : "Reviews"} ({reviews.length})
          </CardTitle>
          {avgRating && (
            <div className="flex items-center gap-1 text-sm font-semibold">
              <Star className="h-4 w-4 fill-chart-4 text-chart-4" />
              {avgRating}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Review Form */}
        {showForm && (
          <div className="space-y-3 p-3 rounded-xl border border-border/40 bg-muted/20">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium me-2">{isAr ? "تقييمك:" : "Your rating:"}</span>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                  className="p-0.5 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-5 w-5 transition-colors ${
                      s <= (hoverRating || rating)
                        ? "fill-chart-4 text-chart-4"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              placeholder={isAr ? "شاركنا رأيك (اختياري)..." : "Share your thoughts (optional)..."}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[60px] text-sm resize-none"
            />
            <div className="flex gap-2 justify-end">
              {isEditing && (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
              )}
              <Button
                size="sm"
                className="gap-1"
                onClick={() => submitReview.mutate()}
                disabled={rating === 0 || submitReview.isPending}
              >
                {submitReview.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                {isAr ? "إرسال" : "Submit"}
              </Button>
            </div>
          </div>
        )}

        {/* My Review */}
        {myReview && !isEditing && (
          <div className="p-3 rounded-xl border border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`h-3.5 w-3.5 ${s <= myReview.rating ? "fill-chart-4 text-chart-4" : "text-muted-foreground/20"}`} />
                ))}
              </div>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => {
                setRating(myReview.rating);
                setComment(myReview.comment || "");
                setIsEditing(true);
              }}>
                {isAr ? "تعديل" : "Edit"}
              </Button>
            </div>
            {myReview.comment && <p className="text-xs text-muted-foreground">{myReview.comment}</p>}
          </div>
        )}

        {/* Other Reviews */}
        {reviews.filter((r) => r.user_id !== user?.id).slice(0, 10).map((review: any) => (
          <div key={review.id} className="flex gap-3 py-2">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={review.profile?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">{(review.profile?.full_name || "U")[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold truncate">{review.profile?.full_name || review.profile?.username}</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`h-2.5 w-2.5 ${s <= review.rating ? "fill-chart-4 text-chart-4" : "text-muted-foreground/20"}`} />
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground ms-auto">
                  {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: isAr ? ar : enUS })}
                </span>
              </div>
              {review.comment && <p className="text-xs text-muted-foreground mt-0.5">{review.comment}</p>}
            </div>
          </div>
        ))}

        {reviews.length === 0 && !showForm && (
          <p className="text-xs text-muted-foreground text-center py-4">
            {isAr ? "لا توجد تقييمات بعد" : "No reviews yet"}
          </p>
        )}

        {!user && (
          <p className="text-xs text-muted-foreground text-center py-4">
            {isAr ? "سجل دخولك لإضافة تقييم" : "Sign in to leave a review"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
