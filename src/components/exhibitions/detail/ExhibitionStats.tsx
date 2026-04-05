import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket, Users, Eye, TrendingUp, BarChart3 } from "lucide-react";

interface Props {
  exhibitionId: string;
  isAr: boolean;
}

export const ExhibitionStats = memo(function ExhibitionStats({ exhibitionId, isAr }: Props) {
  const { data: stats } = useQuery({
    queryKey: ["exhibition-stats", exhibitionId],
    queryFn: async () => {
      const [ticketsRes, followersRes, boothsRes, reviewsRes] = await Promise.all([
        supabase.from("exhibition_tickets").select("id", { count: "exact", head: true }).eq("exhibition_id", exhibitionId).eq("status", "confirmed"),
        supabase.from("exhibition_followers").select("id", { count: "exact", head: true }).eq("exhibition_id", exhibitionId),
        supabase.from("exhibition_booths").select("id", { count: "exact", head: true }).eq("exhibition_id", exhibitionId),
        supabase.from("exhibition_reviews").select("id, rating").eq("exhibition_id", exhibitionId),
      ]);

      const reviews = reviewsRes.data || [];
      const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
        : null;

      return {
        tickets: ticketsRes.count || 0,
        followers: followersRes.count || 0,
        booths: boothsRes.count || 0,
        reviews: reviews.length,
        avgRating,
      };
    },
    staleTime: 1000 * 60 * 3,
  });

  if (!stats || (stats.tickets === 0 && stats.followers === 0 && stats.booths === 0)) return null;

  const items = [
    { icon: Ticket, value: stats.tickets, label: isAr ? "تذكرة" : "Tickets", color: "chart-1" },
    { icon: Users, value: stats.followers, label: isAr ? "متابع" : "Followers", color: "chart-2" },
    { icon: BarChart3, value: stats.booths, label: isAr ? "جناح" : "Booths", color: "chart-3" },
    { icon: Eye, value: stats.reviews, label: isAr ? "تقييم" : "Reviews", color: "chart-4", extra: stats.avgRating ? `⭐ ${stats.avgRating}` : undefined },
  ].filter(i => i.value > 0);

  if (items.length === 0) return null;

  return (
    <Card className="overflow-hidden border-border/60">
      <div className="flex items-center gap-2.5 border-b border-border/40 bg-gradient-to-r from-chart-2/8 via-transparent to-transparent px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-chart-2/10">
          <TrendingUp className="h-3.5 w-3.5 text-chart-2" />
        </div>
        <h3 className="text-sm font-semibold">{isAr ? "إحصائيات المعرض" : "Exhibition Stats"}</h3>
      </div>
      <CardContent className="p-3">
        <div className={`grid gap-2 ${items.length >= 4 ? "grid-cols-2" : items.length === 3 ? "grid-cols-3" : items.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`rounded-xl border border-${item.color}/15 bg-gradient-to-br from-${item.color}/8 to-transparent p-3 text-center`}
              >
                <Icon className={`mx-auto mb-1 h-4 w-4 text-${item.color}`} />
                <p className="text-lg font-bold text-foreground">{item.value}</p>
                <p className="text-[10px] font-medium text-muted-foreground">{item.label}</p>
                {item.extra && (
                  <Badge variant="secondary" className="mt-1 text-[9px] h-4 px-1.5">{item.extra}</Badge>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});
