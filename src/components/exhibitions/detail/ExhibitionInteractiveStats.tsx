import { memo } from "react";
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
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4">
      {stats.map((s, i) => (
        <div
          key={i}
          className="group flex flex-col items-center gap-1.5 rounded-xl border border-border/30 bg-card/80 px-3 py-4 text-center transition-all duration-200 hover:border-primary/20 hover:shadow-sm hover:-translate-y-0.5 cursor-default"
        >
          <s.icon className={`h-5 w-5 ${s.color} transition-transform duration-200 group-hover:scale-110`} />
          <p className={`text-base font-bold tabular-nums ${s.color} sm:text-lg`}>
            {typeof s.value === "number" ? <AnimatedCounter value={s.value} /> : s.value}
          </p>
          <p className="text-[11px] font-medium text-muted-foreground sm:text-xs">{s.label}</p>
        </div>
      ))}
    </div>
  );
});
