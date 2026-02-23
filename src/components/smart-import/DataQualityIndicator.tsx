import React from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck, ShieldAlert } from "lucide-react";

interface DataQualityIndicatorProps {
  score: number;
  isAr: boolean;
  compact?: boolean;
}

export const DataQualityIndicator = React.memo(({ score, isAr, compact }: DataQualityIndicatorProps) => {
  const getLevel = () => {
    if (score >= 75) return { label: isAr ? "ممتاز" : "Excellent", color: "text-green-600", bg: "bg-green-500", icon: ShieldCheck };
    if (score >= 50) return { label: isAr ? "جيد" : "Good", color: "text-blue-600", bg: "bg-blue-500", icon: Shield };
    if (score >= 30) return { label: isAr ? "متوسط" : "Fair", color: "text-yellow-600", bg: "bg-yellow-500", icon: ShieldAlert };
    return { label: isAr ? "ضعيف" : "Low", color: "text-red-600", bg: "bg-red-500", icon: ShieldAlert };
  };

  const level = getLevel();
  const Icon = level.icon;

  if (compact) {
    return (
      <Badge variant="outline" className={`gap-1 text-xs ${level.color}`}>
        <Icon className="h-3 w-3" />
        {score}%
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-background">
      <div className={`w-10 h-10 rounded-lg ${level.bg}/10 flex items-center justify-center shrink-0`}>
        <Icon className={`h-5 w-5 ${level.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium">{isAr ? "جودة البيانات" : "Data Quality"}</span>
          <span className={`text-sm font-bold ${level.color}`}>{score}% — {level.label}</span>
        </div>
        <Progress value={score} className="h-2" />
      </div>
    </div>
  );
});
DataQualityIndicator.displayName = "DataQualityIndicator";
