import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCountries } from "@/hooks/useCountries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { countryFlag } from "@/lib/countryFlag";
import { Globe } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

interface CountryBreakdownChartProps {
  /** Which data to break down */
  metric: "users" | "competitions" | "companies";
}

export function CountryBreakdownChart({ metric }: CountryBreakdownChartProps) {
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
      const tableMap: Record<string, string> = {
        users: "profiles",
        competitions: "competitions",
        companies: "companies",
      };
      const table = tableMap[metric];

      const { data } = await supabase
        .from(table as any)
        .select("country_code")
        .not("country_code", "is", null);

      if (!data) return [];

      const counts: Record<string, number> = {};
      (data as any[]).forEach((row) => {
        const code = row.country_code;
        if (code) counts[code] = (counts[code] || 0) + 1;
      });

      const countryMap = new Map(
        (countries || []).map((c) => [c.code, c])
      );

      return Object.entries(counts)
        .map(([code, count]) => {
          const c = countryMap.get(code);
          return {
            code,
            name: c ? (isAr ? c.name_ar || c.name : c.name) : code,
            flag: countryFlag(code),
            count,
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    },
    enabled: !!countries,
    staleTime: 1000 * 60 * 5,
  });

  const title = titles[metric];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <Globe className="h-3.5 w-3.5 text-primary" />
          </div>
          {isAr ? title.ar : title.en}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[240px] w-full" />
        ) : !chartData || chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Globe className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">
              {isAr ? "لا توجد بيانات" : "No data available"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
              >
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                  tickFormatter={(value, index) => {
                    const item = chartData[index];
                    return item ? `${item.flag} ${value}` : value;
                  }}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [value, isAr ? "العدد" : "Count"]}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Legend list */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {chartData.map((item, i) => (
                <div key={item.code} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-muted-foreground truncate text-xs">
                      {item.flag} {item.name}
                    </span>
                  </div>
                  <span className="font-medium text-xs">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
