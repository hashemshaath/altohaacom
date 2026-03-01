import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Globe, MapPin, Users, TrendingUp } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-1))",
];

export function GeographicDistribution() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["geographic-distribution"],
    queryFn: async () => {
      const [
        { data: profiles },
        { data: competitions },
        { data: companies },
      ] = await Promise.all([
        supabase.from("profiles").select("country_code").not("country_code", "is", null).limit(1000),
        supabase.from("competitions").select("country_code").not("country_code", "is", null),
        supabase.from("companies").select("country_code").not("country_code", "is", null),
      ]);

      // Count users by country
      const usersByCountry: Record<string, number> = {};
      (profiles || []).forEach((p: any) => {
        if (p.country_code) usersByCountry[p.country_code] = (usersByCountry[p.country_code] || 0) + 1;
      });

      const compsByCountry: Record<string, number> = {};
      (competitions || []).forEach((c: any) => {
        if (c.country_code) compsByCountry[c.country_code] = (compsByCountry[c.country_code] || 0) + 1;
      });

      const companiesByCountry: Record<string, number> = {};
      (companies || []).forEach((c: any) => {
        if (c.country_code) companiesByCountry[c.country_code] = (companiesByCountry[c.country_code] || 0) + 1;
      });

      const totalUsers = (profiles || []).length;
      const totalComps = (competitions || []).length;
      const totalCompanies = (companies || []).length;
      const uniqueCountries = new Set([
        ...Object.keys(usersByCountry),
        ...Object.keys(compsByCountry),
        ...Object.keys(companiesByCountry),
      ]).size;

      // Top countries sorted
      const topCountries = Object.entries(usersByCountry)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([code, count]) => ({
          code,
          users: count,
          competitions: compsByCountry[code] || 0,
          companies: companiesByCountry[code] || 0,
          percentage: totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0,
        }));

      // Pie chart data (top 5 + other)
      const top5 = topCountries.slice(0, 5);
      const otherCount = totalUsers - top5.reduce((s, c) => s + c.users, 0);
      const pieData = [
        ...top5.map(c => ({ name: c.code, value: c.users })),
        ...(otherCount > 0 ? [{ name: isAr ? "أخرى" : "Other", value: otherCount }] : []),
      ];

      return { topCountries, pieData, totalUsers, totalComps, totalCompanies, uniqueCountries };
    },
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="space-y-6 mt-4">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { icon: Globe, label: isAr ? "دول فريدة" : "Countries", value: data?.uniqueCountries || 0, color: "text-primary" },
          { icon: Users, label: isAr ? "إجمالي المستخدمين" : "Total Users", value: data?.totalUsers || 0, color: "text-chart-2" },
          { icon: TrendingUp, label: isAr ? "المسابقات" : "Competitions", value: data?.totalComps || 0, color: "text-chart-3" },
          { icon: MapPin, label: isAr ? "الشركات" : "Companies", value: data?.totalCompanies || 0, color: "text-chart-4" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-4 pb-3">
              {isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                  </div>
                  <AnimatedCounter value={kpi.value} className="mt-1 text-2xl" />
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bar Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4 text-primary" />
              {isAr ? "المستخدمون حسب الدولة" : "Users by Country"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[350px] w-full" />
            ) : !data || data.topCountries.length === 0 ? (
              <p className="py-16 text-center text-muted-foreground">{isAr ? "لا توجد بيانات" : "No data"}</p>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data.topCountries.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis dataKey="code" type="category" width={40} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                    formatter={(value: number, name: string) => [
                      value,
                      name === "users" ? (isAr ? "مستخدمون" : "Users") :
                      name === "competitions" ? (isAr ? "مسابقات" : "Competitions") :
                      (isAr ? "شركات" : "Companies"),
                    ]}
                  />
                  <Bar dataKey="users" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="competitions" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="companies" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-primary" />
              {isAr ? "التوزيع الجغرافي" : "Geographic Split"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[350px] w-full" />
            ) : !data || data.pieData.length === 0 ? (
              <p className="py-16 text-center text-muted-foreground">{isAr ? "لا توجد بيانات" : "No data"}</p>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie data={data.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={120} paddingAngle={2}>
                    {data.pieData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                  />
                  <Legend formatter={(value) => <span className="text-xs">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Country Details Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{isAr ? "تفاصيل الدول" : "Country Details"}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-start p-2 text-xs text-muted-foreground">{isAr ? "الدولة" : "Country"}</th>
                    <th className="text-center p-2 text-xs text-muted-foreground">{isAr ? "مستخدمون" : "Users"}</th>
                    <th className="text-center p-2 text-xs text-muted-foreground">{isAr ? "مسابقات" : "Competitions"}</th>
                    <th className="text-center p-2 text-xs text-muted-foreground">{isAr ? "شركات" : "Companies"}</th>
                    <th className="p-2 text-xs text-muted-foreground min-w-[120px]">%</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.topCountries || []).map((c) => (
                    <tr key={c.code} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                      <td className="p-2 font-medium">{c.code}</td>
                      <td className="p-2 text-center">{c.users}</td>
                      <td className="p-2 text-center">{c.competitions}</td>
                      <td className="p-2 text-center">{c.companies}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <Progress value={c.percentage} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground w-8">{c.percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
