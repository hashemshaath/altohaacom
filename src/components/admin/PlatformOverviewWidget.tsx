import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, TrendingDown, Users, Trophy, FileText, ShoppingBag, Eye } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, subDays, subMonths } from "date-fns";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export const PlatformOverviewWidget = memo(function PlatformOverviewWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["platform-overview-widget"],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30).toISOString();
      const sixtyDaysAgo = subDays(now, 60).toISOString();

      // Current period counts
      const [usersRes, compsRes, articlesRes, ordersRes] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
        supabase.from("competitions").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
        supabase.from("articles").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
        supabase.from("shop_orders").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
      ]);

      // Previous period for delta
      const [prevUsersRes, prevCompsRes] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", sixtyDaysAgo).lt("created_at", thirtyDaysAgo),
        supabase.from("competitions").select("*", { count: "exact", head: true }).gte("created_at", sixtyDaysAgo).lt("created_at", thirtyDaysAgo),
      ]);

      const currentUsers = usersRes.count || 0;
      const prevUsers = prevUsersRes.count || 0;
      const usersDelta = prevUsers > 0 ? Math.round(((currentUsers - prevUsers) / prevUsers) * 100) : 0;

      // Monthly signup trend (6 months)
      const monthlyData: { month: string; users: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = subMonths(now, i);
        const monthLabel = format(monthStart, "MMM");
        const startStr = format(new Date(monthStart.getFullYear(), monthStart.getMonth(), 1), "yyyy-MM-dd");
        const endStr = format(new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1), "yyyy-MM-dd");
        
        const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true })
          .gte("created_at", startStr).lt("created_at", endStr);
        monthlyData.push({ month: monthLabel, users: count || 0 });
      }

      return {
        metrics: [
          { label: isAr ? "مستخدمون جدد" : "New Users", value: currentUsers, delta: usersDelta, icon: Users, color: "text-primary" },
          { label: isAr ? "مسابقات" : "Competitions", value: compsRes.count || 0, icon: Trophy, color: "text-chart-3" },
          { label: isAr ? "مقالات" : "Articles", value: articlesRes.count || 0, icon: FileText, color: "text-chart-4" },
          { label: isAr ? "طلبات" : "Orders", value: ordersRes.count || 0, icon: ShoppingBag, color: "text-chart-2" },
        ],
        monthlyData,
      };
    },
    staleTime: 10 * 60 * 1000,
  });

  if (!data) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          {isAr ? "نظرة عامة - 30 يوم" : "30-Day Overview"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {data.metrics.map((m, i) => {
            const Icon = m.icon;
            return (
              <div key={i} className="bg-muted/50 rounded-xl p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={`h-3 w-3 ${m.color}`} />
                  <span className="text-[9px] text-muted-foreground font-semibold uppercase">{m.label}</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold"><AnimatedCounter value={typeof m.value === "number" ? m.value : 0} /></span>
                  {m.delta !== undefined && m.delta !== 0 && (
                    <Badge variant="secondary" className={`text-[8px] px-1 py-0 gap-0.5 ${m.delta > 0 ? "text-chart-3" : "text-destructive"}`}>
                      {m.delta > 0 ? <TrendingUp className="h-2 w-2" /> : <TrendingDown className="h-2 w-2" />}
                      {m.delta > 0 ? "+" : ""}{m.delta}%
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Monthly Chart */}
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
            {isAr ? "نمو المستخدمين - 6 أشهر" : "User Growth - 6 Months"}
          </p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={data.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name={isAr ? "مستخدمون" : "Users"} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});
