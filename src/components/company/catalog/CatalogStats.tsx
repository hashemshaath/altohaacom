import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface CatalogStatsProps {
  total: number;
  active: number;
  inStock: number;
  language: string;
}

export const CatalogStats = memo(function CatalogStats({ total, active, inStock, language }: CatalogStatsProps) {
  const stats = [
    { label: language === "ar" ? "الإجمالي" : "Total", value: total, color: "text-primary" },
    { label: language === "ar" ? "نشط" : "Active", value: active, color: "text-chart-5" },
    { label: language === "ar" ? "متوفر" : "In Stock", value: inStock, color: "text-primary" },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Package className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <AnimatedCounter value={s.value} className="text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
