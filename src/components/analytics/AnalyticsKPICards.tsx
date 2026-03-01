import { useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
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

export function AnalyticsKPICards({ data, isLoading }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const cards = useMemo(() => [
    { label: isAr ? "المسابقات" : "Competitions", value: data?.totalCompetitions, icon: Trophy, color: "text-primary" },
    { label: isAr ? "التسجيلات" : "Registrations", value: data?.totalRegistrations, icon: ClipboardList, color: "text-chart-2" },
    { label: isAr ? "الحكام" : "Judges", value: data?.totalJudges, icon: Users, color: "text-chart-3" },
    { label: isAr ? "التقييمات" : "Scores", value: data?.totalScores, icon: Star, color: "text-chart-4" },
    { label: isAr ? "الدول" : "Countries", value: data?.totalCountries, icon: Globe, color: "text-chart-5" },
  ], [data, isAr]);

  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.label} className="border-border/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 ${card.color}`}>
              <card.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-black leading-none">{isLoading ? "..." : <AnimatedCounter value={card.value || 0} />}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5 truncate">{card.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
