import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, TrendingUp, UserCheck, UserX, Globe, Shield } from "lucide-react";
import { format, subDays } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--destructive))"];

export function UserGrowthTrendWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-user-growth-widget"],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30).toISOString();
      const sevenDaysAgo = subDays(now, 7).toISOString();

      const [allProfiles, recentProfiles, roles, countries] = await Promise.all([
        supabase.from("profiles").select("created_at, account_status, account_type", { count: "exact", head: false })
          .gte("created_at", thirtyDaysAgo),
        supabase.from("profiles").select("id", { count: "exact", head: true })
          .gte("created_at", sevenDaysAgo),
        supabase.from("user_roles").select("role"),
        supabase.from("profiles").select("country_code").not("country_code", "is", null),
      ]);

      // Build daily trend
      const dailyMap: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = format(subDays(now, i), "MMM dd");
        dailyMap[d] = 0;
      }
      allProfiles.data?.forEach((p: any) => {
        const d = format(new Date(p.created_at), "MMM dd");
        if (dailyMap[d] !== undefined) dailyMap[d]++;
      });
      const trend = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));

      // Account type distribution
      const proCount = allProfiles.data?.filter((p: any) => p.account_type === "professional").length || 0;
      const fanCount = allProfiles.data?.filter((p: any) => p.account_type === "fan").length || 0;

      // Role distribution
      const roleMap: Record<string, number> = {};
      roles.data?.forEach((r: any) => { roleMap[r.role] = (roleMap[r.role] || 0) + 1; });
      const roleDistribution = Object.entries(roleMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));

      // Top countries
      const countryMap: Record<string, number> = {};
      countries.data?.forEach((c: any) => { countryMap[c.country_code] = (countryMap[c.country_code] || 0) + 1; });
      const topCountries = Object.entries(countryMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

      const activeCount = allProfiles.data?.filter((p: any) => p.account_status === "active").length || 0;
      const suspendedCount = allProfiles.data?.filter((p: any) => p.account_status === "suspended" || p.account_status === "banned").length || 0;

      return {
        trend,
        totalNew30d: allProfiles.data?.length || 0,
        totalNew7d: recentProfiles.count || 0,
        proCount,
        fanCount,
        roleDistribution,
        topCountries,
        activeCount,
        suspendedCount,
      };
    },
    refetchInterval: 60000,
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (!data) return null;

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
      {/* Growth Trend */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {isAr ? "نمو المستخدمين (30 يوم)" : "User Growth (30 Days)"}
            <Badge variant="secondary" className="ms-auto text-[10px]">
              +{data.totalNew30d} {isAr ? "جديد" : "new"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data.trend}>
              <defs>
                <linearGradient id="ugFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9 }} width={28} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#ugFill)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {isAr ? "آخر 7 أيام:" : "Last 7d:"} <strong>{data.totalNew7d}</strong></span>
            <span className="flex items-center gap-1"><UserCheck className="h-3 w-3 text-chart-5" /> {isAr ? "نشط:" : "Active:"} <strong>{data.activeCount}</strong></span>
            <span className="flex items-center gap-1"><UserX className="h-3 w-3 text-destructive" /> {isAr ? "موقوف:" : "Suspended:"} <strong>{data.suspendedCount}</strong></span>
          </div>
        </CardContent>
      </Card>

      {/* Right side */}
      <div className="space-y-4">
        {/* Account Type */}
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] font-semibold text-muted-foreground mb-2">{isAr ? "نوع الحساب" : "Account Type"}</p>
            <div className="flex items-center gap-3">
              <PieChart width={60} height={60}>
                <Pie data={[{ v: data.proCount }, { v: data.fanCount }]} dataKey="v" cx={28} cy={28} innerRadius={16} outerRadius={28} strokeWidth={0}>
                  <Cell fill="hsl(var(--primary))" />
                  <Cell fill="hsl(var(--chart-4))" />
                </Pie>
              </PieChart>
              <div className="text-[10px] space-y-1">
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> {isAr ? "محترف" : "Pro"}: <strong>{data.proCount}</strong></div>
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-chart-4" /> {isAr ? "معجب" : "Fan"}: <strong>{data.fanCount}</strong></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role Distribution */}
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Shield className="h-3 w-3" /> {isAr ? "الأدوار" : "Roles"}</p>
            <div className="space-y-1">
              {data.roleDistribution.map((r, i) => (
                <div key={r.name} className="flex items-center justify-between text-[10px]">
                  <span className="capitalize">{r.name}</span>
                  <Badge variant="outline" className="text-[9px] h-4">{r.value}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Countries */}
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Globe className="h-3 w-3" /> {isAr ? "أعلى الدول" : "Top Countries"}</p>
            <div className="space-y-1">
              {data.topCountries.map(([code, count]) => (
                <div key={code} className="flex items-center justify-between text-[10px]">
                  <span>{code}</span>
                  <Badge variant="outline" className="text-[9px] h-4">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
