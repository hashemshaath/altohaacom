import { Card, CardContent } from "@/components/ui/card";
import { Building2, Briefcase, MapPin, TrendingUp, Calendar, Zap, Landmark, Trophy, Users } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface ImportStatsProps {
  stats: {
    totals: { entities: number; companies: number; establishments: number; exhibitions?: number; competitions?: number; organizers?: number };
    imports: {
      today: number;
      week: number;
      total: number;
      by_table: Record<string, number>;
      by_action: { create: number; update: number };
    };
  } | null;
  loading: boolean;
  isAr: boolean;
}

export const ImportStats = React.memo(({ stats, loading, isAr }: ImportStatsProps) => {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-3">
              <div className="h-4 w-12 rounded bg-muted mb-2" />
              <div className="h-6 w-8 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const items = [
    { icon: Building2, label: isAr ? "كيانات" : "Entities", value: stats.totals.entities, color: "text-blue-600", bg: "bg-blue-500/10" },
    { icon: Briefcase, label: isAr ? "شركات" : "Companies", value: stats.totals.companies, color: "text-emerald-600", bg: "bg-emerald-500/10" },
    { icon: MapPin, label: isAr ? "منشآت" : "Establishments", value: stats.totals.establishments, color: "text-red-600", bg: "bg-red-500/10" },
    { icon: Landmark, label: isAr ? "معارض" : "Exhibitions", value: stats.totals.exhibitions || 0, color: "text-orange-600", bg: "bg-orange-500/10" },
    { icon: Trophy, label: isAr ? "مسابقات" : "Competitions", value: stats.totals.competitions || 0, color: "text-indigo-600", bg: "bg-indigo-500/10" },
    { icon: Users, label: isAr ? "منظمون" : "Organizers", value: stats.totals.organizers || 0, color: "text-cyan-600", bg: "bg-cyan-500/10" },
    { icon: Zap, label: isAr ? "اليوم" : "Today", value: stats.imports.today, color: "text-amber-600", bg: "bg-amber-500/10" },
    { icon: Calendar, label: isAr ? "هذا الأسبوع" : "This Week", value: stats.imports.week, color: "text-purple-600", bg: "bg-purple-500/10" },
    { icon: TrendingUp, label: isAr ? "إجمالي" : "Total", value: stats.imports.total, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-9 gap-2">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`w-6 h-6 rounded-lg ${item.bg} flex items-center justify-center`}>
                  <Icon className={`h-3 w-3 ${item.color}`} />
                </div>
                <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider truncate">{item.label}</span>
              </div>
              <AnimatedCounter value={item.value} className={`text-lg font-bold ${item.color}`} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});
ImportStats.displayName = "ImportStats";
