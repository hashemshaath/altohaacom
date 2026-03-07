import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Package, UserPlus, AlertTriangle, Building2 } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface Props {
  totalItems: number;
  assignedItems: number;
  unassignedItems: number;
  vendorCount: number;
  assignmentRate: number;
  isAr: boolean;
}

export const VendorStatsRow = memo(function VendorStatsRow({ totalItems, assignedItems, unassignedItems, vendorCount, assignmentRate, isAr }: Props) {
  const stats = [
    { icon: Package, value: totalItems, label: isAr ? "إجمالي العناصر" : "Total Items", color: "text-primary" },
    { icon: UserPlus, value: assignedItems, label: isAr ? "تم التعيين" : "Assigned", color: "text-chart-1" },
    { icon: AlertTriangle, value: unassignedItems, label: isAr ? "غير معين" : "Unassigned", color: "text-chart-4" },
    { icon: Building2, value: vendorCount, label: isAr ? "الموردين" : "Vendors", color: "text-chart-5" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-border/60 transition-all hover:shadow-md hover:-translate-y-0.5">
              <CardContent className="p-3 text-center">
                <Icon className={`mx-auto mb-1 h-5 w-5 ${s.color}`} />
                <p className="text-xl font-bold"><AnimatedCounter value={s.value} /></p>
                <p className="text-[10px] text-muted-foreground uppercase">{s.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">{isAr ? "نسبة التعيين" : "Assignment Rate"}</p>
            <p className="text-sm font-bold text-primary">{assignmentRate}%</p>
          </div>
          <Progress value={assignmentRate} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {assignedItems}/{totalItems} {isAr ? "عنصر معين لمورد" : "items assigned to vendors"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
});
