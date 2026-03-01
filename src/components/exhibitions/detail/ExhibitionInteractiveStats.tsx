import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Users, Star, Ticket, Building, Heart, Calendar, TrendingUp } from "lucide-react";
import { toEnglishDigits } from "@/lib/formatNumber";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface Props {
  viewCount: number;
  followerCount: number;
  reviewCount: number;
  avgRating: number;
  boothCount: number;
  ticketCount: number;
  isAr: boolean;
}

export const ExhibitionInteractiveStats = memo(function ExhibitionInteractiveStats({
  viewCount, followerCount, reviewCount, avgRating, boothCount, ticketCount, isAr,
}: Props) {
  const stats = [
    { icon: Eye, value: viewCount, label: isAr ? "مشاهدة" : "Views", color: "text-primary" },
    { icon: Heart, value: followerCount, label: isAr ? "متابع" : "Followers", color: "text-destructive" },
    { icon: Star, value: avgRating > 0 ? avgRating.toFixed(1) : "—", label: isAr ? "تقييم" : "Rating", color: "text-chart-4" },
    { icon: Ticket, value: ticketCount, label: isAr ? "تذكرة" : "Tickets", color: "text-chart-2" },
    { icon: Building, value: boothCount, label: isAr ? "جناح" : "Booths", color: "text-chart-3" },
    { icon: Users, value: reviewCount, label: isAr ? "تقييم" : "Reviews", color: "text-chart-1" },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {stats.map((s, i) => (
        <Card key={i} className="border-border/30 hover:border-primary/20 transition-all hover:shadow-sm group cursor-default">
          <CardContent className="p-3 text-center">
            <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.color} group-hover:scale-110 transition-transform`} />
            <p className={`text-sm font-bold ${s.color}`}>{typeof s.value === "number" ? <AnimatedCounter value={s.value} /> : s.value}</p>
            <p className="text-[9px] text-muted-foreground">{s.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
