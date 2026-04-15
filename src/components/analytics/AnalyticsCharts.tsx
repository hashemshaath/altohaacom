import { useIsAr } from "@/hooks/useIsAr";
import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  CHART_COLORS, TOOLTIP_STYLE, X_AXIS_PROPS, Y_AXIS_PROPS,
  GRID_PROPS, LEGEND_STYLE, BAR_RADIUS, H_BAR_RADIUS, CHART_HEIGHT, getNoDataText,
  translateStatus, getTooltipStyle,
} from "@/lib/chartConfig";

function NoData() {
  const isAr = useIsAr();
  return <p className="py-12 text-center text-muted-foreground text-sm">{getNoDataText(isAr)}</p>;
}

/* ─── Registration Trend ─── */
export const RegistrationTrendChart = memo(function RegistrationTrendChart({ data }: { data?: { month: string; count: number }[] }) {
  const isAr = useIsAr();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{isAr ? "اتجاه التسجيلات" : "Registration Trend"}</CardTitle>
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT.md}>
            <BarChart data={data}>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis dataKey="month" {...X_AXIS_PROPS} />
              <YAxis {...Y_AXIS_PROPS} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" fill={CHART_COLORS[0]} radius={BAR_RADIUS} name={isAr ? "التسجيلات" : "Registrations"} />
            </BarChart>
          </ResponsiveContainer>
        ) : <NoData />}
      </CardContent>
    </Card>
  );
});

/* ─── Competitions by Month ─── */
export const MonthlyCompetitionsChart = memo(function MonthlyCompetitionsChart({ data }: { data?: { month: string; count: number }[] }) {
  const isAr = useIsAr();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{isAr ? "المسابقات حسب الشهر" : "Competitions by Month"}</CardTitle>
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT.md}>
            <LineChart data={data}>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis dataKey="month" {...X_AXIS_PROPS} />
              <YAxis {...Y_AXIS_PROPS} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="count" stroke={CHART_COLORS[2]} strokeWidth={2} dot={{ r: 3, fill: CHART_COLORS[2] }} name={isAr ? "المسابقات" : "Competitions"} />
            </LineChart>
          </ResponsiveContainer>
        ) : <NoData />}
      </CardContent>
    </Card>
  );
});

/* ─── Score Distribution ─── */
export const ScoreDistributionChart = memo(function ScoreDistributionChart({ data }: { data?: { range: string; count: number }[] }) {
  const isAr = useIsAr();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{isAr ? "توزيع الدرجات" : "Score Distribution"}</CardTitle>
      </CardHeader>
      <CardContent>
        {data && data.some(s => s.count > 0) ? (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT.md}>
            <BarChart data={data}>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis dataKey="range" {...X_AXIS_PROPS} />
              <YAxis {...Y_AXIS_PROPS} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" fill={CHART_COLORS[1]} radius={BAR_RADIUS} name={isAr ? "العدد" : "Count"} />
            </BarChart>
          </ResponsiveContainer>
        ) : <NoData />}
      </CardContent>
    </Card>
  );
});

/* ─── Status Breakdown ─── */
export const StatusBreakdownChart = memo(function StatusBreakdownChart({ data }: { data?: { name: string; value: number }[] }) {
  const isAr = useIsAr();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{isAr ? "حالات المسابقات" : "Competition Status"}</CardTitle>
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT.md}>
            <PieChart>
              <Pie data={data.map(d => ({ ...d, label: translateStatus(d.name, isAr) }))} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={85} innerRadius={45} paddingAngle={3} strokeWidth={0}>
                {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={getTooltipStyle(isAr)} />
              <Legend wrapperStyle={LEGEND_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        ) : <NoData />}
      </CardContent>
    </Card>
  );
});

/* ─── Top Countries ─── */
export const TopCountriesChart = memo(function TopCountriesChart({ data }: { data?: { country: string; count: number }[] }) {
  const isAr = useIsAr();

  if (!data || data.length === 0) return null;

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{isAr ? "أكثر الدول مسابقات" : "Top Countries"}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT.sm}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid {...GRID_PROPS} />
            <XAxis type="number" allowDecimals={false} tick={X_AXIS_PROPS.tick} axisLine={X_AXIS_PROPS.axisLine} tickLine={false} />
            <YAxis type="category" dataKey="country" tick={Y_AXIS_PROPS.tick} axisLine={false} tickLine={false} width={60} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="count" fill={CHART_COLORS[3]} radius={H_BAR_RADIUS} name={isAr ? "العدد" : "Count"} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});
