import { useIsAr } from "@/hooks/useIsAr";
import { useMemo, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Users, Star, ClipboardList, Globe } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface Props {
  data: {
    totalCompetitions: number;
    totalRegistrations: number;
    totalJudges: number;
    totalScores: number;
    totalCountries: number;
  } | null;
  isLoading: boolean;
}

export const AnalyticsKPICards = memo(function AnalyticsKPICards({ data, isLoading }: Props) {
  const isAr = useIsAr();

  const cards = useMemo(() => [
    { label: isAr ? "المسابقات" : "Competitions", value: data?.totalCompetitions, icon: Trophy, color: "text-primary", bg: "bg-primary/10" },
    { label: isAr ? "التسجيلات" : "Registrations", value: data?.totalRegistrations, icon: ClipboardList, color: "text-chart-2", bg: "bg-chart-2/10" },
    { label: isAr ? "الحكام" : "Judges", value: data?.totalJudges, icon: Users, color: "text-chart-3", bg: "bg-chart-3/10" },
    { label: isAr ? "التقييمات" : "Scores", value: data?.totalScores, icon: Star, color: "text-chart-4", bg: "bg-chart-4/10" },
    { label: isAr ? "الدول" : "Countries", value: data?.totalCountries, icon: Globe, color: "text-chart-5", bg: "bg-chart-5/10" },
  ], [data, isAr]);

  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.label} className="transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 group border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.bg} ${card.color} transition-transform duration-200 group-hover:scale-110`}>
              <card.icon className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold leading-none tabular-nums">
                {isLoading ? "..." : <AnimatedCounter value={card.value || 0} />}
              </p>
              <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mt-1.5 truncate">{card.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
