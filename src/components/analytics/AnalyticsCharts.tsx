import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
};

const AXIS_PROPS = { tick: { fontSize: 11 }, stroke: "hsl(var(--muted-foreground))" };

function NoData({ isAr }: { isAr: boolean }) {
  return <p className="py-12 text-center text-muted-foreground text-sm">{isAr ? "لا توجد بيانات" : "No data available"}</p>;
}

/* ─── Registration Trend ─── */
export function RegistrationTrendChart({ data }: { data?: { month: string; count: number }[] }) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <Card className="border-border/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold">{isAr ? "اتجاه التسجيلات" : "Registration Trend"}</CardTitle>
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" {...AXIS_PROPS} />
              <YAxis allowDecimals={false} {...AXIS_PROPS} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <NoData isAr={isAr} />}
      </CardContent>
    </Card>
  );
}

/* ─── Competitions by Month ─── */
export function MonthlyCompetitionsChart({ data }: { data?: { month: string; count: number }[] }) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <Card className="border-border/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold">{isAr ? "المسابقات حسب الشهر" : "Competitions by Month"}</CardTitle>
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" {...AXIS_PROPS} />
              <YAxis allowDecimals={false} {...AXIS_PROPS} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--chart-3))" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--chart-3))" }} />
            </LineChart>
          </ResponsiveContainer>
        ) : <NoData isAr={isAr} />}
      </CardContent>
    </Card>
  );
}

/* ─── Score Distribution ─── */
export function ScoreDistributionChart({ data }: { data?: { range: string; count: number }[] }) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <Card className="border-border/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold">{isAr ? "توزيع الدرجات" : "Score Distribution"}</CardTitle>
      </CardHeader>
      <CardContent>
        {data && data.some(s => s.count > 0) ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="range" {...AXIS_PROPS} />
              <YAxis allowDecimals={false} {...AXIS_PROPS} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <NoData isAr={isAr} />}
      </CardContent>
    </Card>
  );
}

/* ─── Status Breakdown ─── */
export function StatusBreakdownChart({ data }: { data?: { name: string; value: number }[] }) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <Card className="border-border/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold">{isAr ? "حالات المسابقات" : "Competition Status"}</CardTitle>
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3} strokeWidth={0}>
                {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        ) : <NoData isAr={isAr} />}
      </CardContent>
    </Card>
  );
}

/* ─── Top Countries ─── */
export function TopCountriesChart({ data }: { data?: { country: string; count: number }[] }) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  if (!data || data.length === 0) return null;

  return (
    <Card className="border-border/30 lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold">{isAr ? "أكثر الدول مسابقات" : "Top Countries"}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" allowDecimals={false} {...AXIS_PROPS} />
            <YAxis type="category" dataKey="country" {...AXIS_PROPS} width={50} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="count" fill="hsl(var(--chart-4))" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
