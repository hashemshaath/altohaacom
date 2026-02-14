import { useLanguage } from "@/i18n/LanguageContext";
import { Card } from "@/components/ui/card";
import { Building2, CheckCircle, Clock, Eye } from "lucide-react";
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

  const cards = [
    { label: isAr ? "الإجمالي" : "Total", value: stats.total, icon: Building2, color: "text-foreground", filter: "all" },
    { label: isAr ? "نشطة" : "Active", value: stats.active, icon: CheckCircle, color: "text-chart-3", filter: "active" },
    { label: isAr ? "قيد المراجعة" : "Pending", value: stats.pending, icon: Clock, color: "text-chart-4", filter: "pending" },
    { label: isAr ? "مرئية" : "Visible", value: stats.visible, icon: Eye, color: "text-primary", filter: "visible" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map(c => (
        <Card
          key={c.label}
          className={cn(
            "p-4 transition-all cursor-pointer hover:shadow-md",
            activeFilter === c.filter && "ring-2 ring-primary"
          )}
          onClick={() => onFilterChange?.(activeFilter === c.filter ? "all" : c.filter)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </div>
            <c.icon className={`h-5 w-5 ${c.color} opacity-50`} />
          </div>
        </Card>
      ))}
    </div>
  );
}
