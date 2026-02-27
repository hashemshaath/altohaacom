import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, UserPlus, Shield, Crown, Globe, TrendingUp, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, subDays } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export function UsersLiveStatsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["usersLiveStats"],
    queryFn: async () => {
      const [profilesRes, rolesRes, membershipsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, account_status, account_type, is_verified, country_code, created_at, membership_tier").order("created_at", { ascending: false }).limit(1000),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("membership_cards").select("id, card_status"),
      ]);

      const profiles = profilesRes.data || [];
      const roles = rolesRes.data || [];
      const memberships = membershipsRes.data || [];

      const total = profiles.length;
      const active = profiles.filter(p => p.account_status === "active").length;
      const verified = profiles.filter(p => p.is_verified).length;
      const pros = profiles.filter(p => p.account_type === "professional").length;
      const fans = profiles.filter(p => p.account_type === "fan").length;

      // 14-day registration trend
      const trend: Record<string, { signups: number; verified: number }> = {};
      for (let i = 13; i >= 0; i--) {
        trend[format(subDays(new Date(), i), "MM/dd")] = { signups: 0, verified: 0 };
      }
      profiles.forEach(p => {
        const d = format(new Date(p.created_at), "MM/dd");
        if (d in trend) {
          trend[d].signups++;
          if (p.is_verified) trend[d].verified++;
        }
      });
      const trendData = Object.entries(trend).map(([date, v]) => ({ date, ...v }));

      // Role distribution
      const roleMap: Record<string, number> = {};
      roles.forEach(r => { roleMap[r.role] = (roleMap[r.role] || 0) + 1; });
      const roleData = Object.entries(roleMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

      // Country distribution (top 5)
      const countryMap: Record<string, number> = {};
      profiles.forEach(p => { if (p.country_code) countryMap[p.country_code] = (countryMap[p.country_code] || 0) + 1; });
      const topCountries = Object.entries(countryMap).sort(([,a], [,b]) => b - a).slice(0, 5);

      // Membership stats
      const activeMemberships = memberships.filter(m => m.card_status === "active").length;

      // Today's signups
      const today = format(new Date(), "MM/dd");
      const todaySignups = trend[today]?.signups || 0;

      return {
        total, active, verified, pros, fans,
        verificationRate: total > 0 ? Math.round((verified / total) * 100) : 0,
        activeMemberships,
        todaySignups,
        trendData,
        roleData,
        topCountries,
        uniqueRoles: Object.keys(roleMap).length,
      };
    },
    refetchInterval: 60000,
  });

  if (!data) return null;

  const stats = [
    { label: isAr ? "إجمالي المستخدمين" : "Total Users", value: data.total, icon: Users, color: "text-primary" },
    { label: isAr ? "نشط" : "Active", value: data.active, icon: Activity, color: "text-chart-2" },
    { label: isAr ? "موثق" : "Verified", value: `${data.verificationRate}%`, icon: Shield, color: "text-chart-3" },
    { label: isAr ? "اليوم" : "Today", value: data.todaySignups, icon: UserPlus, color: "text-chart-4" },
  ];

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          {isAr ? "إحصائيات المستخدمين المباشرة" : "Users Live Stats"}
          <Badge variant="outline" className="ms-auto text-[10px]">
            {data.pros} {isAr ? "محترف" : "Pro"} / {data.fans} {isAr ? "متابع" : "Fan"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-muted/50 rounded-lg p-3 text-center">
              <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.color}`} />
              <div className="text-lg font-bold">{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Signup Trend */}
          <div className="md:col-span-2">
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              {isAr ? "التسجيلات - 14 يوم" : "Signups - 14 Days"}
            </p>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={data.trendData}>
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="signups" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} name={isAr ? "تسجيلات" : "Signups"} />
                <Area type="monotone" dataKey="verified" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.2} name={isAr ? "موثقون" : "Verified"} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Role Distribution */}
          <div>
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              {isAr ? "توزيع الأدوار" : "Role Distribution"}
            </p>
            {data.roleData.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={data.roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} innerRadius={25}>
                    {data.roleData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[140px] flex items-center justify-center text-xs text-muted-foreground">
                {isAr ? "لا توجد بيانات" : "No data"}
              </div>
            )}
          </div>
        </div>

        {/* Bottom: Top Countries + Memberships */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <Crown className="h-3 w-3 mx-auto mb-1 text-chart-4" />
            <div className="text-sm font-bold">{data.activeMemberships}</div>
            <div className="text-[9px] text-muted-foreground">{isAr ? "عضويات نشطة" : "Active Memberships"}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <UserCheck className="h-3 w-3 mx-auto mb-1 text-chart-2" />
            <div className="text-sm font-bold">{data.verified}</div>
            <div className="text-[9px] text-muted-foreground">{isAr ? "مستخدم موثق" : "Verified Users"}</div>
          </div>
          {data.topCountries.slice(0, 2).map(([code, count], i) => (
            <div key={i} className="bg-muted/50 rounded-lg p-2 text-center">
              <Globe className="h-3 w-3 mx-auto mb-1 text-primary" />
              <div className="text-sm font-bold">{count}</div>
              <div className="text-[9px] text-muted-foreground">{code}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
