import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";

interface SparklineCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  trend?: number;
  sparkData?: { v: number }[];
  color?: string;
  borderColor?: string;
}

export function SparklineCard({ icon: Icon, label, value, trend, sparkData, color = "primary", borderColor }: SparklineCardProps) {
  const TrendIcon = !trend ? Minus : trend > 0 ? TrendingUp : TrendingDown;
  const trendColor = !trend ? "text-muted-foreground" : trend > 0 ? "text-chart-2" : "text-destructive";

  return (
    <Card className={`relative overflow-hidden ${borderColor ? `border-s-[3px] ${borderColor}` : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {trend !== undefined && (
              <span className={`flex items-center gap-0.5 text-[11px] ${trendColor}`}>
                <TrendIcon className="h-3 w-3" />
                {trend > 0 ? "+" : ""}{trend}%
              </span>
            )}
          </div>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        {sparkData && sparkData.length > 1 && (
          <div className="mt-2 h-8 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={`hsl(var(--${color}))`}
                  fill={`hsl(var(--${color}))`}
                  fillOpacity={0.1}
                  strokeWidth={1.5}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
