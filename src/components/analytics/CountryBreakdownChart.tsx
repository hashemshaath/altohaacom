import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCountries } from "@/hooks/useCountries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { countryFlag } from "@/lib/countryFlag";
import { Globe } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { CHART_COLORS, TOOLTIP_STYLE, CHART_HEIGHT, H_BAR_RADIUS, getTooltipStyle } from "@/lib/chartConfig";

interface CountryBreakdownChartProps {
  metric: "users" | "competitions" | "companies";
}

export const CountryBreakdownChart = memo(function CountryBreakdownChart({ metric }: CountryBreakdownChartProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: countries } = useCountries();

  const titles: Record<string, { en: string; ar: string }> = {
    users: { en: "Users by Country", ar: "المستخدمون حسب الدولة" },
    competitions: { en: "Competitions by Country", ar: "المسابقات حسب الدولة" },
    companies: { en: "Companies by Country", ar: "الشركات حسب الدولة" },
  };

  const { data: chartData, isLoading } = useQuery({
    queryKey: ["country-breakdown", metric],
    queryFn: async () => {
      const tableMap: Record<string, string> = { users: "profiles", competitions: "competitions", companies: "companies" };
      const { data } = await supabase.from(tableMap[metric] as any).select("country_code").not("country_code", "is", null);
      if (!data) return [];

      const counts: Record<string, number> = {};
      (data as { country_code: string }[]).forEach((row) => { const code = row.country_code; if (code) counts[code] = (counts[code] || 0) + 1; });

      const countryMap = new Map((countries || []).map((c) => [c.code, c]));
      return Object.entries(counts)
        .map(([code, count]) => {
          const c = countryMap.get(code);
          return { code, name: c ? (isAr ? c.name_ar || c.name : c.name) : code, flag: countryFlag(code), count };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    },
    enabled: !!countries,
    staleTime: 1000 * 60 * 5,
  });

  const title = titles[metric];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Globe className="h-4 w-4 text-primary" />
          {isAr ? title.ar : title.en}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[220px] w-full" />
        ) : !chartData || chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Globe className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">{isAr ? "لا توجد بيانات" : "No data available"}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={CHART_HEIGHT.sm}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={100}
                  tickFormatter={(value, index) => { const item = chartData[index]; return item ? `${item.flag} ${value}` : value; }}
                />
                <Tooltip contentStyle={getTooltipStyle(isAr)} formatter={(value: number) => [value, isAr ? "العدد" : "Count"]} />
                <Bar dataKey="count" radius={H_BAR_RADIUS}>
                  {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {chartData.map((item, i) => (
                <div key={item.code} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-muted-foreground truncate">{item.flag} {item.name}</span>
                  </div>
                  <span className="font-medium tabular-nums">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
