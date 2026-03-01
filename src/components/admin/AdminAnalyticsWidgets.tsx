import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Users, Trophy, FileText, DollarSign, Landmark, GraduationCap } from "lucide-react";
import { CountryBreakdownChart } from "@/components/analytics/CountryBreakdownChart";

import { AnimatedCounter } from "@/components/ui/animated-counter";

export function AdminAnalyticsWidgets() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  // Registration trends (last 6 months)
  const { data: registrationTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ["admin-registration-trends"],
    queryFn: async () => {
      const months: { label: string; count: number }[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthLabel = date.toLocaleDateString("en", { month: "short" });

        const { count } = await supabase
          .from("competition_registrations")
          .select("*", { count: "exact", head: true })
          .gte("registered_at", date.toISOString())
          .lte("registered_at", endDate.toISOString());

        months.push({ label: monthLabel, count: count || 0 });
      }
      return months;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Competition status distribution
  const { data: statusDist, isLoading: statusLoading } = useQuery({
    queryKey: ["admin-competition-status-dist"],
    queryFn: async () => {
      const statuses = ["upcoming", "registration_open", "in_progress", "completed", "cancelled"] as const;
      const results: { name: string; value: number; color: string }[] = [];
      const colors: Record<string, string> = {
        upcoming: "hsl(var(--chart-1))",
        registration_open: "hsl(var(--chart-2))",
        in_progress: "hsl(var(--chart-3))",
        completed: "hsl(var(--chart-4))",
        cancelled: "hsl(var(--chart-5))",
      };

      for (const status of statuses) {
        const { count } = await supabase
          .from("competitions")
          .select("*", { count: "exact", head: true })
          .eq("status", status);
        if ((count || 0) > 0) {
          results.push({
            name: status.replace("_", " "),
            value: count || 0,
            color: colors[status],
          });
        }
      }
      return results;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Revenue summary
  const { data: revenue, isLoading: revenueLoading } = useQuery({
    queryKey: ["admin-revenue-summary"],
    queryFn: async () => {
      const { data: orders } = await supabase
        .from("company_orders")
        .select("total_amount, status")
        .in("status", ["completed", "approved"]);

      const totalRevenue = (orders || []).reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const completedCount = (orders || []).length;

      const { count: pendingOrders } = await supabase
        .from("company_orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      return { totalRevenue, completedCount, pendingOrders: pendingOrders || 0 };
    },
    staleTime: 1000 * 60 * 5,
  });

  // New users this month
  const { data: newUsersMonth } = useQuery({
    queryKey: ["admin-new-users-month"],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfMonth.toISOString());

      return count || 0;
    },
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="space-y-4">
      {/* Registration Trends */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "اتجاهات التسجيل" : "Registration Trends"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trendsLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={registrationTrends}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={30} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Competition Status Distribution */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
              <Trophy className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "حالة المسابقات" : "Competition Status"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statusLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : statusDist && statusDist.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie
                    data={statusDist}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={3}
                  >
                    {statusDist.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {statusDist.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="capitalize text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {isAr ? "لا توجد بيانات" : "No data available"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Revenue Summary */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
              <DollarSign className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "ملخص الإيرادات" : "Revenue Summary"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {revenueLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-border/50 p-3 text-center">
                <p className="text-lg font-bold">SAR <AnimatedCounter value={Math.round(revenue?.totalRevenue || 0)} className="inline" /></p>
                <p className="text-[10px] text-muted-foreground">{isAr ? "إجمالي الإيرادات" : "Total Revenue"}</p>
              </div>
              <div className="rounded-xl border border-border/50 p-3 text-center">
                <AnimatedCounter value={revenue?.completedCount || 0} className="text-lg font-bold" />
                <p className="text-[10px] text-muted-foreground">{isAr ? "طلبات مكتملة" : "Completed Orders"}</p>
              </div>
              <div className="rounded-xl border border-border/50 p-3 text-center">
                <AnimatedCounter value={revenue?.pendingOrders || 0} className="text-lg font-bold" />
                <p className="text-[10px] text-muted-foreground">{isAr ? "طلبات معلقة" : "Pending Orders"}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform Activity */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
              <Users className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "نشاط المنصة" : "Platform Activity"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/50 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">{isAr ? "مستخدمون جدد هذا الشهر" : "New Users This Month"}</span>
              </div>
              <AnimatedCounter value={newUsersMonth ?? 0} className="text-2xl" />
            </div>
            <div className="rounded-xl border border-border/50 p-3">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">{isAr ? "شهادات صادرة" : "Certificates Issued"}</span>
              </div>
              <CertificateCount />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Counts */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <QuickCountCard
          icon={Landmark}
          label={isAr ? "المعارض" : "Exhibitions"}
          table="exhibitions"
        />
        <QuickCountCard
          icon={GraduationCap}
          label={isAr ? "الدورات" : "Masterclasses"}
          table="masterclasses"
        />
        <QuickCountCard
          icon={FileText}
          label={isAr ? "المقالات" : "Articles"}
          table="articles"
        />
        <QuickCountCard
          icon={Users}
          label={isAr ? "المجموعات" : "Groups"}
          table="groups"
        />
      </div>

      {/* Country Breakdowns */}
      <div className="grid gap-4 lg:grid-cols-2">
        <CountryBreakdownChart metric="users" />
        <CountryBreakdownChart metric="competitions" />
      </div>
    </div>
  );
}

function CertificateCount() {
  const { data: count } = useQuery({
    queryKey: ["admin-certificates-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("certificates")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
    staleTime: 1000 * 60 * 5,
  });

  return <AnimatedCounter value={count ?? 0} className="text-2xl" />;
}

function QuickCountCard({ icon: Icon, label, table }: { icon: React.ElementType; label: string; table: string }) {
  const { data: count } = useQuery({
    queryKey: ["admin-quick-count", table],
    queryFn: async () => {
      const { count } = await supabase
        .from(table as any)
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
    staleTime: 1000 * 60 * 5,
  });

  return (
    <Card className="border-border/50 transition-all hover:shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <AnimatedCounter value={count ?? 0} className="text-xl" />
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
