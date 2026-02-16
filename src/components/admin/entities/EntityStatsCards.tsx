import { useLanguage } from "@/i18n/LanguageContext";
import { Card } from "@/components/ui/card";
import { Building2, CheckCircle, Clock, Eye, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface EntityStats {
  total: number;
  active: number;
  pending: number;
  visible: number;
}

interface Props {
  stats: EntityStats;
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
}

export default function EntityStatsCards({ stats, activeFilter, onFilterChange }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const activeRate = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;

  const cards = [
    { label: isAr ? "الإجمالي" : "Total Entities", value: stats.total, icon: Building2, color: "text-foreground", bgColor: "bg-primary/10", filter: "all", subtitle: isAr ? "جميع الجهات" : "All registered" },
    { label: isAr ? "نشطة" : "Active", value: stats.active, icon: CheckCircle, color: "text-chart-3", bgColor: "bg-chart-3/10", filter: "active", subtitle: `${activeRate}% ${isAr ? "معدل التفعيل" : "activation rate"}` },
    { label: isAr ? "قيد المراجعة" : "Pending Review", value: stats.pending, icon: Clock, color: "text-chart-4", bgColor: "bg-chart-4/10", filter: "pending", subtitle: isAr ? "بانتظار الموافقة" : "Awaiting approval" },
    { label: isAr ? "مرئية للعامة" : "Public Visible", value: stats.visible, icon: Eye, color: "text-primary", bgColor: "bg-primary/10", filter: "visible", subtitle: isAr ? "ظاهرة في الدليل" : "Shown in directory" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map(c => (
        <Card
          key={c.filter}
          className={cn(
            "p-4 transition-all cursor-pointer hover:shadow-md group",
            activeFilter === c.filter && "ring-2 ring-primary shadow-md"
          )}
          onClick={() => onFilterChange?.(activeFilter === c.filter ? "all" : c.filter)}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className={`text-2xl font-bold ${c.color} transition-transform group-hover:scale-105`}>{c.value}</p>
              <p className="text-xs font-medium">{c.label}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{c.subtitle}</p>
            </div>
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.bgColor} transition-transform group-hover:scale-110`}>
              <c.icon className={`h-4.5 w-4.5 ${c.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}