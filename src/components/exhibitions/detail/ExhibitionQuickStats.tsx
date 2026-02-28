import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Star, Users, Ticket, Eye, Heart, MessageSquare } from "lucide-react";

interface Props {
  exhibitionId: string;
  viewCount: number;
  isAr: boolean;
}

export function ExhibitionQuickStats({ exhibitionId, viewCount, isAr }: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;

  const { data } = useQuery({
    queryKey: ["exhibition-quick-stats", exhibitionId],
    queryFn: async () => {
      const [followers, tickets, reviews, comments] = await Promise.all([
        supabase.from("exhibition_followers").select("id", { count: "exact", head: true }).eq("exhibition_id", exhibitionId),
        supabase.from("exhibition_tickets").select("id", { count: "exact", head: true }).eq("exhibition_id", exhibitionId).eq("status", "confirmed"),
        supabase.from("exhibition_reviews").select("rating").eq("exhibition_id", exhibitionId),
        supabase.from("event_comments").select("id", { count: "exact", head: true }).eq("event_type", "exhibition").eq("event_id", exhibitionId),
      ]);
      const ratings = reviews.data || [];
      const avg = ratings.length > 0 ? ratings.reduce((s, r) => s + (r as any).rating, 0) / ratings.length : 0;
      return {
        followers: followers.count || 0,
        tickets: tickets.count || 0,
        reviewCount: ratings.length,
        avgRating: avg,
        comments: comments.count || 0,
      };
    },
    staleTime: 1000 * 60 * 3,
  });

  if (!data) return null;

  const items = [
    { icon: Eye, value: viewCount, label: t("Views", "مشاهدة") },
    { icon: Heart, value: data.followers, label: t("Followers", "متابع") },
    { icon: Ticket, value: data.tickets, label: t("Tickets", "تذكرة") },
    ...(data.avgRating > 0 ? [{ icon: Star, value: data.avgRating.toFixed(1), label: `(${data.reviewCount})` }] : []),
    ...(data.comments > 0 ? [{ icon: MessageSquare, value: data.comments, label: t("Comments", "تعليق") }] : []),
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item, i) => (
        <Badge key={i} variant="outline" className="gap-1 py-1 px-2 text-[10px] font-medium border-border/50">
          <item.icon className="h-2.5 w-2.5" />
          <span className="font-bold">{item.value}</span>
          <span className="text-muted-foreground">{item.label}</span>
        </Badge>
      ))}
    </div>
  );
}
