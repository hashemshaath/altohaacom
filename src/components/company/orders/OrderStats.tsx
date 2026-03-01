import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Clock, CheckCircle2, XCircle } from "lucide-react";

interface OrderStatsProps {
  total: number;
  pending: number;
  completed: number;
  rejected: number;
  isLoading: boolean;
  language: string;
}

export function OrderStats({ total, pending, completed, rejected, isLoading, language }: OrderStatsProps) {
  const isAr = language === "ar";
  const stats = [
    { icon: Package, label: isAr ? "الإجمالي" : "Total", value: total, accent: "border-s-primary" },
    { icon: Clock, label: isAr ? "قيد الانتظار" : "Pending", value: pending, accent: "border-s-amber-500" },
    { icon: CheckCircle2, label: isAr ? "مكتمل" : "Completed", value: completed, accent: "border-s-emerald-500" },
    { icon: XCircle, label: isAr ? "مرفوض" : "Rejected", value: rejected, accent: "border-s-destructive" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.label} className={`border-s-[3px] ${s.accent}`}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-muted p-2">
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              {isLoading ? <Skeleton className="h-6 w-8 mt-0.5" /> : <p className="text-xl font-bold">{s.value}</p>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
