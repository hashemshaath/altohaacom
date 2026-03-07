import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, ThumbsUp, MessageSquare, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Props {
  establishmentId: string;
}

export default function EstablishmentReviews({ establishmentId }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const { data: reviews = [] } = useQuery({
    queryKey: ["establishment-reviews", establishmentId, sortBy],
    queryFn: async () => {
      let query = supabase
        .from("establishment_reviews")
        .select("id, establishment_id, user_id, rating, title, content, status, helpful_count, is_verified_visit, reply_text, reply_text_ar, created_at")
        .eq("establishment_id", establishmentId)
        .eq("status", "published");

      if (sortBy === "newest") query = query.order("created_at", { ascending: false });
      else if (sortBy === "highest") query = query.order("rating", { ascending: false });
      else if (sortBy === "helpful") query = query.order("helpful_count", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const { data: userReview } = useQuery({
    queryKey: ["my-establishment-review", establishmentId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("establishment_reviews")
        .select("id, rating, title, content, status, created_at")
        .eq("establishment_id", establishmentId)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (rating === 0) throw new Error("Please select a rating");
      const { error } = await supabase.from("establishment_reviews").insert({
        establishment_id: establishmentId,
        user_id: user.id,
        rating,
        title: title || null,
        content: content || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["establishment-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["my-establishment-review"] });
      setRating(0); setTitle(""); setContent("");
      toast({ title: isAr ? "تم إضافة التقييم" : "Review submitted" });
    },
    onError: (err: any) => {
      toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    },
  });

  const voteHelpful = useMutation({
    mutationFn: async (reviewId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("establishment_review_helpful").insert({
        review_id: reviewId,
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["establishment-reviews"] }),
  });

  // Stats
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "0";
  const distribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length ? Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100) : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold">{avgRating}</p>
              <div className="flex justify-center gap-0.5 mt-1">
                {[1,2,3,4,5].map(s => <Star key={s} className={cn("h-4 w-4", s <= Math.round(Number(avgRating)) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{reviews.length} {isAr ? "تقييم" : "reviews"}</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {distribution.map(d => (
                <div key={d.star} className="flex items-center gap-2 text-sm">
                  <span className="w-3 text-end">{d.star}</span>
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${d.pct}%` }} />
                  </div>
                  <span className="w-8 text-xs text-muted-foreground">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Write Review */}
      {user && !userReview && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{isAr ? "أضف تقييمك" : "Write a Review"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-1">
              {[1,2,3,4,5].map(s => (
                <button key={s} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(s)}>
                  <Star className={cn("h-7 w-7 transition-colors", s <= (hoverRating || rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                </button>
              ))}
            </div>
            <Input placeholder={isAr ? "عنوان التقييم" : "Review title"} value={title} onChange={e => setTitle(e.target.value)} />
            <Textarea placeholder={isAr ? "اكتب تقييمك..." : "Write your review..."} value={content} onChange={e => setContent(e.target.value)} rows={3} />
            <Button onClick={() => submitReview.mutate()} disabled={submitReview.isPending || rating === 0} className="gap-1.5">
              <Send className="h-4 w-4" />
              {isAr ? "إرسال" : "Submit"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sort & List */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{isAr ? "التقييمات" : "Reviews"}</p>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{isAr ? "الأحدث" : "Newest"}</SelectItem>
            <SelectItem value="highest">{isAr ? "الأعلى" : "Highest"}</SelectItem>
            <SelectItem value="helpful">{isAr ? "الأكثر فائدة" : "Most Helpful"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {reviews.map(r => (
          <Card key={r.id} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-9 w-9"><AvatarFallback>U</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => <Star key={s} className={cn("h-3.5 w-3.5", s <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />)}
                    </div>
                    {r.is_verified_visit && <Badge variant="outline" className="text-[10px]">{isAr ? "زيارة موثقة" : "Verified"}</Badge>}
                  </div>
                  {r.title && <p className="font-medium text-sm mt-1">{r.title}</p>}
                  {r.content && <p className="text-sm text-muted-foreground mt-1">{r.content}</p>}
                  <div className="flex items-center gap-3 mt-2">
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => voteHelpful.mutate(r.id)}>
                      <ThumbsUp className="h-3 w-3" /> {r.helpful_count || 0}
                    </Button>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: isAr ? ar : undefined })}
                    </span>
                  </div>
                  {r.reply_text && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-xl">
                      <p className="text-xs font-medium mb-1 flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {isAr ? "رد الإدارة" : "Management Reply"}</p>
                      <p className="text-sm">{isAr && r.reply_text_ar ? r.reply_text_ar : r.reply_text}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
