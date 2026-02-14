import { Badge } from "@/components/ui/badge";
import { ORDER_STATUSES } from "./orderTypes";

interface OrderStatusBadgeProps {
  status: string | null;
  language: string;
}

export function OrderStatusBadge({ status, language }: OrderStatusBadgeProps) {
  const isAr = language === "ar";
  const statusInfo = ORDER_STATUSES.find(s => s.value === status);
  const label = statusInfo ? (isAr ? statusInfo.ar : statusInfo.en) : (isAr ? "قيد الانتظار" : "Pending");

  switch (status) {
    case "completed":
      return <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20">{label}</Badge>;
    case "approved":
    case "in_progress":
      return <Badge className="bg-chart-1/10 text-chart-1 border-chart-1/20">{label}</Badge>;
    case "rejected":
    case "cancelled":
      return <Badge variant="destructive">{label}</Badge>;
    case "draft":
      return <Badge variant="outline">{label}</Badge>;
    default:
      return <Badge variant="secondary">{label}</Badge>;
  }
}
