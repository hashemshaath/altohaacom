import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Bell, Send, CheckCircle2, Eye, TrendingUp, Zap } from "lucide-react";
import { subDays, format } from "date-fns";
import { AnimatedCounter } from "@/components/ui/animated-counter";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--destructive))"];

export function NotificationDeliveryWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-notification-delivery"],
    queryFn: async () => {
      const now = new Date();
      const sevenDaysAgo = subDays(now, 7).toISOString();
      const thirtyDaysAgo = subDays(now, 30).toISOString();

      const [recent, all30d] = await Promise.all([
        supabase.from("notifications").select("id, type, is_read, created_at").gte("created_at", sevenDaysAgo),
        supabase.from("notifications").select("id, type, is_read, created_at").gte("created_at", thirtyDaysAgo),
      ]);

      const recentData = recent.data || [];
      const all30Data = all30d.data || [];

      const totalSent = all30Data.length;
      const totalRead = all30Data.filter(n => n.is_read).length;
      const readRate = totalSent > 0 ? Math.round((totalRead / totalSent) * 100) : 0;

      // Type distribution
      const typeMap: Record<string, number> = {};
      all30Data.forEach(n => { typeMap[n.type || "general"] = (typeMap[n.type || "general"] || 0) + 1; });
      const typeDist = Object.entries(typeMap).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }));

      // Daily trend (7 days)
      const dailyMap: Record<string, { sent: number; read: number }> = {};
      for (let i = 6; i >= 0; i--) {
        dailyMap[format(subDays(now, i), "EEE")] = { sent: 0, read: 0 };
      }
      recentData.forEach(n => {
        const d = format(new Date(n.created_at), "EEE");
        if (dailyMap[d]) {
          dailyMap[d].sent++;
          if (n.is_read) dailyMap[d].read++;
        }
      });
      const dailyTrend = Object.entries(dailyMap).map(([day, v]) => ({ day, ...v }));

      // Unread count
      const unreadCount = all30Data.filter(n => !n.is_read).length;

      // Top performing type by read rate
      const typeReadRates = Object.entries(typeMap).map(([type]) => {
        const typeNotifs = all30Data.filter(n => (n.type || "general") === type);
        const typeRead = typeNotifs.filter(n => n.is_read).length;
        return { type, rate: typeNotifs.length > 0 ? Math.round((typeRead / typeNotifs.length) * 100) : 0, total: typeNotifs.length };
      }).sort((a, b) => b.rate - a.rate);

      return {
        totalSent,
        totalRead,
        readRate,
        unreadCount,
        recentCount: recentData.length,
        typeDist,
        dailyTrend,
        topTypes: typeReadRates.slice(0, 5),
      };
    },
    refetchInterval: 60000,
  });

  if (isLoading) return <Skeleton className="h-52 w-full rounded-xl" />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { icon: Send, label: isAr ? "مرسلة (30 يوم)" : "Sent (30d)", value: data.totalSent, color: "text-primary", bg: "bg-primary/10" },
          { icon: Eye, label: isAr ? "مقروءة" : "Read", value: data.totalRead, color: "text-chart-3", bg: "bg-chart-3/10" },
          { icon: CheckCircle2, label: isAr ? "نسبة القراءة" : "Read Rate", value: `${data.readRate}%`, color: data.readRate >= 50 ? "text-chart-5" : "text-chart-4", bg: data.readRate >= 50 ? "bg-chart-5/10" : "bg-chart-4/10" },
          { icon: Bell, label: isAr ? "غير مقروءة" : "Unread", value: data.unreadCount, color: "text-destructive", bg: "bg-destructive/10" },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="flex items-center gap-3 p-3">
              <div className={`rounded-full p-2 ${kpi.bg}`}><kpi.icon className={`h-4 w-4 ${kpi.color}`} /></div>
              <div>
                <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                <p className="text-lg font-bold">{typeof kpi.value === "number" ? <AnimatedCounter value={kpi.value} /> : kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Daily Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {isAr ? "اتجاه الإشعارات (7 أيام)" : "Notification Trend (7 Days)"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={data.dailyTrend}>
                <defs>
                  <linearGradient id="ndSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} width={28} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Area type="monotone" dataKey="sent" stroke="hsl(var(--primary))" fill="url(#ndSent)" strokeWidth={2} name={isAr ? "مرسلة" : "Sent"} />
                <Area type="monotone" dataKey="read" stroke="hsl(var(--chart-5))" fill="none" strokeWidth={2} strokeDasharray="4 2" name={isAr ? "مقروءة" : "Read"} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Right side */}
        <div className="space-y-4">
          {/* Type Distribution */}
          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] font-semibold text-muted-foreground mb-2">{isAr ? "حسب النوع" : "By Type"}</p>
              <div className="flex items-center gap-3">
                <PieChart width={60} height={60}>
                  <Pie data={data.typeDist} dataKey="value" cx={28} cy={28} innerRadius={16} outerRadius={28} strokeWidth={0}>
                    {data.typeDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
                <div className="text-[10px] space-y-1">
                  {data.typeDist.slice(0, 4).map((t, i) => (
                    <div key={t.name} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="capitalize truncate max-w-[80px]">{t.name}</span>: <strong>{t.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Types by Read Rate */}
          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <Zap className="h-3 w-3" /> {isAr ? "أعلى تفاعل" : "Top Engagement"}
              </p>
              <div className="space-y-1.5">
                {data.topTypes.map(t => (
                  <div key={t.type} className="space-y-0.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="capitalize truncate max-w-[100px]">{t.type}</span>
                      <span className="text-muted-foreground">{t.rate}%</span>
                    </div>
                    <Progress value={t.rate} className="h-1" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
