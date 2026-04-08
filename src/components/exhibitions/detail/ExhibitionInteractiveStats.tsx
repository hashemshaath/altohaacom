import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Users, Star, Ticket, Building, Heart } from "lucide-react";
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
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-3">
      {stats.map((s, i) => (
        <Card key={i} className="border-border/30 hover:border-primary/20 transition-all hover:shadow-sm group cursor-default">
          <CardContent className="p-3 sm:p-4 text-center">
            <s.icon className={`h-4.5 w-4.5 sm:h-5 sm:w-5 mx-auto mb-1.5 ${s.color} group-hover:scale-110 transition-transform`} />
            <p className={`text-sm sm:text-base font-bold ${s.color}`}>
              {typeof s.value === "number" ? <AnimatedCounter value={s.value} /> : s.value}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{s.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
