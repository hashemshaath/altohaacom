import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Briefcase, MapPin, TrendingUp, Calendar, Zap } from "lucide-react";

interface ImportStatsProps {
  stats: {
    totals: { entities: number; companies: number; establishments: number };
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
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
    { icon: Zap, label: isAr ? "اليوم" : "Today", value: stats.imports.today, color: "text-amber-600", bg: "bg-amber-500/10" },
    { icon: Calendar, label: isAr ? "هذا الأسبوع" : "This Week", value: stats.imports.week, color: "text-purple-600", bg: "bg-purple-500/10" },
    { icon: TrendingUp, label: isAr ? "إجمالي الاستيراد" : "Total Imports", value: stats.imports.total, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-7 h-7 rounded-xl ${item.bg} flex items-center justify-center`}>
                  <Icon className={`h-3.5 w-3.5 ${item.color}`} />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{item.label}</span>
              </div>
              <p className={`text-xl font-bold ${item.color}`}>{item.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});
ImportStats.displayName = "ImportStats";
