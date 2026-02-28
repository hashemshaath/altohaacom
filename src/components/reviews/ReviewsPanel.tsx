import { useState, useCallback } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Star, ThumbsUp, MessageSquare, Flag, CheckCircle, BarChart3 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Props {
  entityType: "exhibition" | "recipe" | "company";
  entityId: string;
  entityTitle?: string;
}

export function ReviewsPanel({ entityType, entityId, entityTitle }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [showForm, setShowForm] = useState(false);

  const tableName = entityType === "exhibition" ? "exhibition_reviews" : entityType === "company" ? "supplier_reviews" : "exhibition_reviews";
  const idField = entityType === "exhibition" ? "exhibition_id" : "company_id";

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews", entityType, entityId],
    queryFn: async () => {
      const { data } = await (supabase.from(tableName as any).select("*, profiles:user_id(full_name, full_name_ar, avatar_url, username)").eq(idField, entityId).order("created_at", { ascending: false }) as any);
      return data || [];
    },
  });

  const avgRating = reviews.length > 0 ? (reviews.reduce((a: number, r: any) => a + (r.rating || 0), 0) / reviews.length).toFixed(1) : "0";
  const ratingDist = [5, 4, 3, 2, 1].map(r => ({ stars: r, count: reviews.filter((rv: any) => rv.rating === r).length }));

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!rating || !user?.id) return;
      const payload: any = { [idField]: entityId, user_id: user.id, rating, comment: comment.trim() || null };
      await (supabase.from(tableName as any).insert(payload) as any);
    },
    onSuccess: () => {
      toast({ title: isAr ? "تم إرسال التقييم" : "Review submitted" });
      setRating(0); setComment(""); setShowForm(false);
      qc.invalidateQueries({ queryKey: ["reviews", entityType, entityId] });
    },
    onError: (e: any) => toast({ title: isAr ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  const helpfulMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      if (entityType === "exhibition") {
        await (supabase.from("establishment_review_helpful" as any).insert({ review_id: reviewId, user_id: user!.id }) as any);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews", entityType, entityId] }),
  });

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-black text-primary">{avgRating}</p>
              <div className="flex gap-0.5 my-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={cn("h-4 w-4", s <= Math.round(Number(avgRating)) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{reviews.length} {isAr ? "تقييم" : "reviews"}</p>
            </div>
            <Separator orientation="vertical" className="h-16" />
            <div className="flex-1 space-y-1">
              {ratingDist.map(r => (
                <div key={r.stars} className="flex items-center gap-2">
                  <span className="text-xs w-3">{r.stars}</span>
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <div className="flex-1 bg-muted rounded-full h-1.5">
                    <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${reviews.length > 0 ? (r.count / reviews.length) * 100 : 0}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-5">{r.count}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Write Review */}
      {user && (
        <Card>
          <CardContent className="p-4">
            {!showForm ? (
              <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
                <Star className="h-4 w-4 me-2" /> {isAr ? "اكتب تقييماً" : "Write a Review"}
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium">{isAr ? "تقييمك" : "Your Rating"}</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(s)}>
                      <Star className={cn("h-7 w-7 transition-colors", s <= (hoverRating || rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                    </button>
                  ))}
                </div>
                <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder={isAr ? "شاركنا رأيك..." : "Share your experience..."} rows={3} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => submitMutation.mutate()} disabled={!rating || submitMutation.isPending}>
                    {isAr ? "إرسال" : "Submit"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-3">
        {reviews.map((r: any) => (
          <Card key={r.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={r.profiles?.avatar_url || ""} />
                  <AvatarFallback>{(r.profiles?.full_name || "?")[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{isAr ? r.profiles?.full_name_ar || r.profiles?.full_name : r.profiles?.full_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={cn("h-3 w-3", s <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                          ))}
                        </div>
                        <span className="text-[10px] text-muted-foreground">{format(new Date(r.created_at), "MMM d, yyyy")}</span>
                        {r.is_verified_attendee && (
                          <Badge variant="outline" className="text-[9px] gap-0.5"><CheckCircle className="h-2.5 w-2.5 text-green-500" />{isAr ? "حضور مؤكد" : "Verified"}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {r.comment && <p className="text-sm mt-2 text-muted-foreground">{r.comment}</p>}
                  {entityType === "exhibition" && (
                    <div className="flex items-center gap-3 mt-2">
                      <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => helpfulMutation.mutate(r.id)} disabled={!user}>
                        <ThumbsUp className="h-3 w-3" /> {r.helpful_count || 0}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {reviews.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <Star className="h-10 w-10 mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground">{isAr ? "لا توجد تقييمات بعد" : "No reviews yet"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
