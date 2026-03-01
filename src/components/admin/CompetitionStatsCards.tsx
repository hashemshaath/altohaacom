import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Users, Gavel, CheckCircle, Clock } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface Props {
  stats: {
    total: number;
    pending: number;
    active: number;
    completed: number;
    draft: number;
  };
  isAr: boolean;
}

export function CompetitionStatsCards({ stats, isAr }: Props) {
  const cards = [
    { label: isAr ? "إجمالي المسابقات" : "Total", value: stats.total, icon: Trophy, color: "text-primary" },
    { label: isAr ? "بانتظار الموافقة" : "Pending", value: stats.pending, icon: Clock, color: "text-chart-4" },
    { label: isAr ? "نشطة" : "Active", value: stats.active, icon: Users, color: "text-chart-3" },
    { label: isAr ? "مكتملة" : "Completed", value: stats.completed, icon: CheckCircle, color: "text-chart-5" },
    { label: isAr ? "مسودة" : "Draft", value: stats.draft, icon: Gavel, color: "text-muted-foreground" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <c.icon className={`h-4 w-4 ${c.color}`} />
              <span className="text-xs text-muted-foreground">{c.label}</span>
            </div>
            <AnimatedCounter value={c.value} className="text-xl font-bold" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
