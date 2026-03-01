import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface AdminStatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number; // percentage change
  trendLabel?: string;
  className?: string;
}

export function AdminStatsCard({ title, value, icon: Icon, trend, trendLabel, className }: AdminStatsCardProps) {
  const trendDir = trend === undefined ? null : trend > 0 ? "up" : trend < 0 ? "down" : "flat";

  return (
    <Card className={cn("border-border/40 rounded-2xl group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground truncate">{title}</span>
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {trendDir !== null && (
          <div className="flex items-center gap-1 mt-1">
            {trendDir === "up" && <TrendingUp className="h-3 w-3 text-chart-2" />}
            {trendDir === "down" && <TrendingDown className="h-3 w-3 text-destructive" />}
            {trendDir === "flat" && <Minus className="h-3 w-3 text-muted-foreground" />}
            <span className={cn(
              "text-[10px] font-medium",
              trendDir === "up" && "text-chart-2",
              trendDir === "down" && "text-destructive",
              trendDir === "flat" && "text-muted-foreground"
            )}>
              {trend! > 0 ? "+" : ""}{trend}%
              {trendLabel && <span className="text-muted-foreground ms-1">{trendLabel}</span>}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
