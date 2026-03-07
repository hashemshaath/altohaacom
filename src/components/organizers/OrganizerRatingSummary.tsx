import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar as arLocale } from "date-fns/locale";

interface Props {
  exhibitionIds: string[];
  isAr: boolean;
}

export function OrganizerRatingSummary({ exhibitionIds, isAr }: Props) {
  const { data } = useQuery({
    queryKey: ["org-reviews-summary", exhibitionIds.join(",")],
    queryFn: async () => {
      if (exhibitionIds.length === 0) return null;
      const { data: reviews } = await supabase
        .from("exhibition_reviews")
        .select("id, rating, title, title_ar, content, content_ar, created_at, user_id, is_verified_attendee")
        .in("exhibition_id", exhibitionIds)
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!reviews || reviews.length === 0) return null;

      const ratings = reviews.map(r => r.rating);
      const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      const distribution = [5, 4, 3, 2, 1].map(star => ({
        star,
        count: ratings.filter(r => r === star).length,
        pct: Math.round((ratings.filter(r => r === star).length / ratings.length) * 100),
      }));

      return {
        average: Math.round(avg * 10) / 10,
        total: reviews.length,
        distribution,
        recent: reviews.slice(0, 3),
      };
    },
    enabled: exhibitionIds.length > 0,
    staleTime: 300000,
  });

  if (!data) return null;

  return (
    <Card className="rounded-2xl border-border/40 overflow-hidden">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <Star className="h-4 w-4 text-primary fill-primary" />
          {isAr ? "التقييمات والمراجعات" : "Ratings & Reviews"}
        </h3>

        <div className="flex items-start gap-5">
          {/* Average Score */}
          <div className="text-center shrink-0">
            <p className="text-4xl font-black text-primary">{data.average}</p>
            <div className="flex gap-0.5 justify-center my-1">
              {[1, 2, 3, 4, 5].map(s => (
                <Star
                  key={s}
                  className={`h-3 w-3 ${s <= Math.round(data.average) ? "text-primary fill-primary" : "text-muted-foreground/30"}`}
                />
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">{data.total} {isAr ? "تقييم" : "reviews"}</p>
          </div>

          {/* Distribution Bars */}
          <div className="flex-1 space-y-1">
            {data.distribution.map(d => (
              <div key={d.star} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-3 text-end">{d.star}</span>
                <Star className="h-2.5 w-2.5 text-primary/40 shrink-0" />
                <Progress value={d.pct} className="h-1.5 flex-1" />
                <span className="text-[9px] text-muted-foreground font-mono w-5 text-end">{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reviews */}
        {data.recent.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/40 space-y-2.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="h-3 w-3" />
              {isAr ? "أحدث المراجعات" : "Recent Reviews"}
            </p>
            {data.recent.map(review => {
              const title = isAr && review.title_ar ? review.title_ar : review.title;
              const content = isAr && review.content_ar ? review.content_ar : review.content;
              return (
                <div key={review.id} className="rounded-xl bg-muted/30 p-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`h-2.5 w-2.5 ${s <= review.rating ? "text-primary fill-primary" : "text-muted-foreground/20"}`} />
                      ))}
                    </div>
                    {review.is_verified_attendee && (
                      <Badge variant="secondary" className="text-[8px] h-3.5 px-1">{isAr ? "حاضر موثق" : "Verified"}</Badge>
                    )}
                    <span className="text-[9px] text-muted-foreground ms-auto">
                      {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: isAr ? arLocale : undefined })}
                    </span>
                  </div>
                  {title && <p className="text-xs font-medium line-clamp-1">{title}</p>}
                  {content && <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{content}</p>}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
