import { useLanguage } from "@/i18n/LanguageContext";
import { Card } from "@/components/ui/card";
import { Building2, CheckCircle, Clock, Eye } from "lucide-react";

interface EntityStats {
  total: number;
  active: number;
  pending: number;
  visible: number;
}

export default function EntityStatsCards({ stats }: { stats: EntityStats }) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const cards = [
    { label: isAr ? "الإجمالي" : "Total", value: stats.total, icon: Building2, color: "text-foreground" },
    { label: isAr ? "نشطة" : "Active", value: stats.active, icon: CheckCircle, color: "text-chart-3" },
    { label: isAr ? "قيد المراجعة" : "Pending", value: stats.pending, icon: Clock, color: "text-chart-4" },
    { label: isAr ? "مرئية" : "Visible", value: stats.visible, icon: Eye, color: "text-primary" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map(c => (
        <Card key={c.label} className="p-4">
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
