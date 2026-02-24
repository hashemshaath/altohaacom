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
import { Star, MessageSquare, Send, PenLine, Shield, ThumbsUp, Image as ImageIcon, X } from "lucide-react";
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

function HelpfulButton({ reviewId, helpfulCount, isAr }: { reviewId: string; helpfulCount: number; isAr: boolean }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: myVote } = useQuery({
    queryKey: ["review-vote", reviewId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("exhibition_review_votes")
        .select("id")
        .eq("review_id", reviewId)
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const toggleVote = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (myVote) {
        await supabase.from("exhibition_review_votes").delete().eq("id", myVote.id);
      } else {
        await supabase.from("exhibition_review_votes").insert({ review_id: reviewId, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-vote", reviewId] });
      queryClient.invalidateQueries({ queryKey: ["exhibition-reviews"] });
    },
  });

  return (
    <button
      onClick={() => user && toggleVote.mutate()}
      disabled={!user || toggleVote.isPending}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium transition-all ${
        myVote ? "bg-primary/10 text-primary" : "bg-muted/60 text-muted-foreground hover:bg-muted"
      }`}
    >
      <ThumbsUp className={`h-3 w-3 ${myVote ? "fill-primary" : ""}`} />
      {helpfulCount > 0 && <span>{helpfulCount}</span>}
      <span>{isAr ? "مفيد" : "Helpful"}</span>
    </button>
  );
}

export function ExhibitionReviewsTab({ exhibitionId, hasEnded, isAr }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["exhibition-reviews", exhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibition_reviews")
        .select("*")
        .eq("exhibition_id", exhibitionId)
        .order("helpful_count", { ascending: false })
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files).slice(0, 4 - photoUrls.length)) {
        const ext = file.name.split(".").pop();
        const path = `reviews/${exhibitionId}/${user.id}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("exhibition-files").upload(path, file);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("exhibition-files").getPublicUrl(path);
        urls.push(urlData.publicUrl);
      }
      setPhotoUrls(prev => [...prev, ...urls]);
    } catch {
      toast({ title: isAr ? "خطأ في رفع الصور" : "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

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
        photo_urls: photoUrls.length > 0 ? photoUrls : [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibition-reviews", exhibitionId] });
      queryClient.invalidateQueries({ queryKey: ["exhibition-my-review", exhibitionId] });
      queryClient.invalidateQueries({ queryKey: ["exhibition-feature-counts"] });
      setShowForm(false);
      setNewRating(0);
      setNewTitle("");
      setNewContent("");
      setPhotoUrls([]);
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
      {/* Summary card */}
      <Card className="overflow-hidden border-border/60">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            <div className="flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-transparent p-6 sm:w-44 sm:border-e border-b sm:border-b-0 border-border/40">
              <p className="text-5xl font-bold tracking-tight text-foreground">{avgRating.toFixed(1)}</p>
              <StarRating rating={Math.round(avgRating)} size="md" />
              <p className="mt-2 text-xs text-muted-foreground font-medium">
                {reviews.length} {isAr ? "تقييم" : reviews.length === 1 ? "review" : "reviews"}
              </p>
            </div>
            <div className="flex-1 p-5 space-y-2">
              {ratingDistribution.map((d) => (
                <div key={d.stars} className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1 w-9 justify-end shrink-0">
                    <span className="text-xs font-semibold tabular-nums">{d.stars}</span>
                    <Star className="h-3 w-3 text-chart-4 fill-chart-4" />
                  </div>
                  <div className="h-2.5 flex-1 rounded-full bg-muted/60 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-chart-4/80 to-chart-4 transition-all duration-500" style={{ width: `${d.pct}%` }} />
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

                {/* Photo upload */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">{isAr ? "صور (اختياري، حتى 4)" : "Photos (optional, up to 4)"}</Label>
                  {photoUrls.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {photoUrls.map((url, i) => (
                        <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden border border-border/50">
                          <img src={url} alt="" className="h-full w-full object-cover" />
                          <button onClick={() => setPhotoUrls(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-0.5 end-0.5 h-4 w-4 rounded-full bg-destructive/80 flex items-center justify-center">
                            <X className="h-2.5 w-2.5 text-destructive-foreground" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {photoUrls.length < 4 && (
                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-primary hover:underline">
                      <ImageIcon className="h-3.5 w-3.5" />
                      {uploading ? (isAr ? "جاري الرفع..." : "Uploading...") : (isAr ? "إضافة صور" : "Add Photos")}
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                    </label>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button className="shadow-md shadow-primary/10" onClick={() => submitReview.mutate()} disabled={newRating === 0 || submitReview.isPending}>
                    <Send className="me-2 h-3.5 w-3.5" />
                    {submitReview.isPending ? (isAr ? "جاري الإرسال..." : "Submitting...") : (isAr ? "إرسال التقييم" : "Submit Review")}
                  </Button>
                  <Button variant="ghost" onClick={() => { setShowForm(false); setNewRating(0); setPhotoUrls([]); }}>
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

                  {/* Review photos */}
                  {review.photo_urls && review.photo_urls.length > 0 && (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {review.photo_urls.map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="h-20 w-20 rounded-lg overflow-hidden border border-border/40 hover:opacity-80 transition-opacity">
                          <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-3">
                    <HelpfulButton reviewId={review.id} helpfulCount={review.helpful_count || 0} isAr={isAr} />
                    <span className="text-[10px] text-muted-foreground/60 font-medium">{format(new Date(review.created_at), "MMM d, yyyy")}</span>
                  </div>
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
