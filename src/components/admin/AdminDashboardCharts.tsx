import { useIsAr } from "@/hooks/useIsAr";
import { memo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, Tooltip, XAxis, YAxis, CartesianGrid,
  Legend,
} from "recharts";

interface TooltipPayloadItem {
  color?: string;
  fill?: string;
  name: string;
  value: number;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

/* ─── Shared tooltip ─── */
function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  const isAr = useIsAr();
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
      {label && <p className="text-[11px] font-medium text-muted-foreground mb-1">{label}</p>}
      {payload.map((p, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-xs text-muted-foreground">{p.name}</span>
          <span className="text-xs font-semibold tabular-nums ms-auto">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ═══ 1. Growth Area Chart ═══ */
export const GrowthAreaChart = memo(function GrowthAreaChart({
  data, lines, title, className,
}: {
  data: Record<string, unknown>[]; lines: { key: string; name: string; color: string }[];
  title: string; className?: string;
}) {
  const isAr = useIsAr();
  return (
    <Card className={cn("rounded-lg", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} />
            {lines.map((line) => (
              <Area
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.name}
                stroke={line.color}
                strokeWidth={2}
                fill={line.color}
                fillOpacity={0.08}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--background))" }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});

/* ═══ 2. Donut Chart ═══ */
export const DonutChart = memo(function DonutChart({
  data, title, className,
}: {
  data: { name: string; value: number; color: string }[];
  title: string; className?: string;
}) {
  const isAr = useIsAr();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card className={cn("rounded-lg", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex items-center gap-4">
          <div className="relative w-[140px] h-[140px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={65}
                  dataKey="value"
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                  onMouseEnter={(_, i) => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(null)}
                  animationDuration={800}
                >
                  {data.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.color}
                      opacity={activeIndex === null || activeIndex === i ? 1 : 0.4}
                      style={{ transition: "opacity 200ms", cursor: "pointer" }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-bold tabular-nums">{activeIndex !== null ? data[activeIndex].value : total}</span>
              <span className="text-[10px] text-muted-foreground">{activeIndex !== null ? data[activeIndex].name : "Total"}</span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            {data.map((d, i) => {
              const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
              return (
                <div
                  key={i}
                  className={cn("flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors cursor-default",
                    activeIndex === i && "bg-accent/10"
                  )}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="text-xs flex-1 truncate">{d.name}</span>
                  <span className="text-xs font-semibold tabular-nums">{d.value}</span>
                  <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-end">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

/* ═══ 3. Comparison Bar Chart ═══ */
export const ComparisonBarChart = memo(function ComparisonBarChart({
  data, bars, title, className,
}: {
  data: Record<string, unknown>[]; bars: { key: string; name: string; color: string }[];
  title: string; className?: string;
}) {
  const isAr = useIsAr();
  return (
    <Card className={cn("rounded-lg", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} />
            {bars.map((bar) => (
              <Bar
                key={bar.key}
                dataKey={bar.key}
                name={bar.name}
                fill={bar.color}
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
                animationDuration={600}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});

/* ═══ 4. Activity Heatmap ═══ */
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAYS_AR = ["اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت", "أحد"];

export const ActivityHeatmap = memo(function ActivityHeatmap({
  data, title, className,
}: {
  data: { day: number; hour: number; value: number }[];
  title: string; className?: string;
}) {
  const isAr = useIsAr();
  const days = isAr ? DAYS_AR : DAYS_EN;
  const [hovered, setHovered] = useState<{ day: number; hour: number } | null>(null);

  const maxVal = Math.max(...data.map(d => d.value), 1);

  const getIntensity = (val: number) => {
    if (val === 0) return "bg-muted/30";
    const ratio = val / maxVal;
    if (ratio < 0.25) return "bg-primary/15";
    if (ratio < 0.5) return "bg-primary/30";
    if (ratio < 0.75) return "bg-primary/50";
    return "bg-primary/80";
  };

  const getVal = (day: number, hour: number) => data.find(d => d.day === day && d.hour === hour)?.value || 0;

  return (
    <Card className={cn("rounded-lg", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-3 overflow-x-auto">
        <div className="min-w-[500px]">
          {/* Hour labels */}
          <div className="flex items-center gap-0.5 mb-1 ps-14">
            {HOURS.filter(h => h % 3 === 0).map(h => (
              <span key={h} className="text-[10px] text-muted-foreground tabular-nums" style={{ width: `${(3 / 24) * 100}%` }}>
                {String(h).padStart(2, "0")}
              </span>
            ))}
          </div>
          {/* Grid */}
          {days.map((dayLabel, dayIdx) => (
            <div key={dayIdx} className="flex items-center gap-0.5 mb-0.5">
              <span className="text-[10px] text-muted-foreground w-12 text-end shrink-0 pe-2">{dayLabel}</span>
              <div className="flex-1 flex gap-0.5">
                {HOURS.map(hour => {
                  const val = getVal(dayIdx, hour);
                  const isHov = hovered?.day === dayIdx && hovered?.hour === hour;
                  return (
                    <div
                      key={hour}
                      className={cn(
                        "flex-1 aspect-square rounded-sm transition-all duration-150 cursor-default",
                        getIntensity(val),
                        isHov && "ring-1 ring-primary scale-125 z-10"
                      )}
                      onMouseEnter={() => setHovered({ day: dayIdx, hour })}
                      onMouseLeave={() => setHovered(null)}
                      title={`${dayLabel} ${String(hour).padStart(2, "0")}:00 — ${val} ${isAr ? "نشاط" : "activity"}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
          {/* Legend */}
          <div className="flex items-center justify-end gap-1.5 mt-2">
            <span className="text-[10px] text-muted-foreground">{isAr ? "أقل" : "Less"}</span>
            {["bg-muted/30", "bg-primary/15", "bg-primary/30", "bg-primary/50", "bg-primary/80"].map((c, i) => (
              <div key={i} className={cn("h-2.5 w-2.5 rounded-sm", c)} />
            ))}
            <span className="text-[10px] text-muted-foreground">{isAr ? "أكثر" : "More"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
