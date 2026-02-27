import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Users, Globe, TrendingUp, Shield } from "lucide-react";
import { format, subDays } from "date-fns";

const ROLE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--destructive))",
];

export function UserAnalyticsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-user-analytics-widget"],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();

      const [recentUsers, roles, countries, weekUsers] = await Promise.all([
        supabase.from("profiles").select("created_at").gte("created_at", thirtyDaysAgo).order("created_at"),
        supabase.from("user_roles").select("role"),
        supabase.from("profiles").select("country_code").not("country_code", "is", null),
        supabase.from("profiles").select("created_at").gte("created_at", sevenDaysAgo),
      ]);

      // Daily registrations (last 14 days)
      const dailyMap: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "MM/dd");
        dailyMap[d] = 0;
      }
      (recentUsers.data || []).forEach((u) => {
        const d = format(new Date(u.created_at), "MM/dd");
        if (dailyMap[d] !== undefined) dailyMap[d]++;
      });
      const dailyRegistrations = Object.entries(dailyMap).map(([day, count]) => ({ day, count }));

      // Role distribution
      const roleCount: Record<string, number> = {};
      (roles.data || []).forEach((r) => {
        roleCount[r.role] = (roleCount[r.role] || 0) + 1;
      });
      const roleDistribution = Object.entries(roleCount)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({ name, value }));

      // Top countries
      const countryCount: Record<string, number> = {};
      (countries.data || []).forEach((p) => {
        const cc = p.country_code || "Unknown";
        countryCount[cc] = (countryCount[cc] || 0) + 1;
      });
      const topCountries = Object.entries(countryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([code, count]) => ({ code, count }));

      return {
        dailyRegistrations,
        roleDistribution,
        topCountries,
        thisWeekCount: weekUsers.data?.length || 0,
        thisMonthCount: recentUsers.data?.length || 0,
      };
    },
    staleTime: 1000 * 60 * 3,
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (!data) return null;

  return (
    <div className="grid gap-3 grid-cols-1 lg:grid-cols-3">
      {/* Registration Trend */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {isAr ? "اتجاه التسجيل (14 يوم)" : "Registration Trend (14 days)"}
            <Badge variant="secondary" className="text-[10px] ms-auto">
              {isAr ? "هذا الأسبوع" : "This week"}: {data.thisWeekCount}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data.dailyRegistrations}>
              <XAxis dataKey="day" tick={{ fontSize: 9 }} interval={1} />
              <YAxis tick={{ fontSize: 9 }} width={25} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Role Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-chart-2" />
            {isAr ? "توزيع الأدوار" : "Role Distribution"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          {data.roleDistribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie
                    data={data.roleDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={2}
                  >
                    {data.roleDistribution.map((_, i) => (
                      <Cell key={i} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {data.roleDistribution.slice(0, 5).map((r, i) => (
                  <Badge key={r.name} variant="outline" className="text-[9px] gap-1">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: ROLE_COLORS[i % ROLE_COLORS.length] }} />
                    {r.name} ({r.value})
                  </Badge>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-6">{isAr ? "لا توجد بيانات" : "No data"}</p>
          )}
        </CardContent>
      </Card>

      {/* Geographic Breakdown */}
      <Card className="lg:col-span-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="h-4 w-4 text-chart-3" />
            {isAr ? "التوزيع الجغرافي" : "Geographic Breakdown"}
            <Badge variant="secondary" className="text-[10px] ms-auto">
              {data.topCountries.length} {isAr ? "دول" : "countries"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {data.topCountries.map((c, i) => {
              const maxCount = data.topCountries[0]?.count || 1;
              const pct = Math.round((c.count / maxCount) * 100);
              return (
                <div key={c.code} className="text-center space-y-1">
                  <div className="text-lg font-bold">{c.code}</div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-chart-3 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground">{c.count}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
