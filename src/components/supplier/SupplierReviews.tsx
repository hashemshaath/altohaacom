import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Star, MessageSquare, ThumbsUp } from "lucide-react";

interface Props {
  companyId: string;
}

function StarRating({ rating, onRate, interactive = false }: { rating: number; onRate?: (r: number) => void; interactive?: boolean }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(s)}
          className={interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}
        >
          <Star className={`h-4 w-4 ${s <= rating ? "fill-chart-4 text-chart-4" : "text-muted-foreground/30"}`} />
        </button>
      ))}
    </div>
  );
}

export function SupplierReviews({ companyId }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["supplierReviews", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("supplier_reviews")
        .select("*")
        .eq("company_id", companyId)
        .eq("status", "published")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: reviewerProfiles = {} } = useQuery({
    queryKey: ["reviewerProfiles", companyId, reviews.map((r: any) => r.user_id)],
    queryFn: async () => {
      const userIds = reviews.map((r: any) => r.user_id);
      if (userIds.length === 0) return {};
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, username")
        .in("user_id", userIds);
      const map: Record<string, any> = {};
      (data || []).forEach((p: any) => { map[p.user_id] = p; });
      return map;
    },
    enabled: reviews.length > 0,
  });

  const existingReview = reviews.find((r: any) => r.user_id === user?.id);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user || rating === 0) throw new Error("Invalid");
      const { error } = await supabase.from("supplier_reviews").insert({
        company_id: companyId,
        user_id: user.id,
        rating,
        title: title || null,
        comment: comment || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplierReviews", companyId] });
      toast({ title: isAr ? "تم إرسال تقييمك" : "Review submitted" });
      setShowForm(false);
      setRating(0);
      setTitle("");
      setComment("");
    },
    onError: () => toast({ title: isAr ? "فشل الإرسال" : "Failed to submit", variant: "destructive" }),
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r: any) => r.rating === star).length,
  }));

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <Card className="rounded-2xl flex-1">
          <CardContent className="p-6 flex items-center gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold">{avgRating}</p>
              <StarRating rating={Math.round(Number(avgRating))} />
              <p className="text-xs text-muted-foreground mt-1">
                {reviews.length} {isAr ? "تقييم" : "reviews"}
              </p>
            </div>
            <div className="flex-1 space-y-1">
              {ratingDistribution.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-3">{star}</span>
                  <Star className="h-3 w-3 fill-chart-4 text-chart-4" />
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-chart-4 rounded-full transition-all"
                      style={{ width: reviews.length > 0 ? `${(count / reviews.length) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="w-6 text-muted-foreground text-end">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {user && !existingReview && !showForm && (
          <Button onClick={() => setShowForm(true)} className="shrink-0">
            <MessageSquare className="me-2 h-4 w-4" />
            {isAr ? "أضف تقييمك" : "Write a Review"}
          </Button>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <Card className="rounded-2xl border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{isAr ? "أضف تقييمك" : "Write Your Review"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm mb-1">{isAr ? "التقييم" : "Rating"}</p>
              <StarRating rating={rating} onRate={setRating} interactive />
            </div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isAr ? "عنوان التقييم (اختياري)" : "Review title (optional)"}
            />
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={isAr ? "اكتب تجربتك..." : "Share your experience..."}
              rows={3}
            />
            <div className="flex gap-2">
              <Button onClick={() => submitMutation.mutate()} disabled={rating === 0 || submitMutation.isPending}>
                {isAr ? "إرسال" : "Submit"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-3">
        {reviews.map((r: any) => {
          const profile = reviewerProfiles[r.user_id];
          const displayName = profile?.full_name || profile?.username || (isAr ? "مستخدم" : "User");
          return (
            <Card key={r.id} className="rounded-xl">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{displayName}</span>
                    {r.is_verified_purchase && (
                      <Badge variant="secondary" className="text-[9px]">
                        <ThumbsUp className="me-0.5 h-2.5 w-2.5" />
                        {isAr ? "مشتري موثق" : "Verified"}
                      </Badge>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                <StarRating rating={r.rating} />
                {r.title && <p className="text-sm font-medium">{r.title}</p>}
                {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
              </CardContent>
            </Card>
          );
        })}
        {reviews.length === 0 && !isLoading && (
          <div className="py-12 text-center">
            <Star className="mx-auto mb-3 h-10 w-10 text-muted-foreground/20" />
            <p className="text-muted-foreground text-sm">{isAr ? "لا توجد تقييمات بعد" : "No reviews yet"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
