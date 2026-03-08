import { useMemo, memo } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Bell, TrendingUp } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, Cell } from "recharts";

export const NotificationActivityWidget = memo(function NotificationActivityWidget() {
  const { notifications, unreadCount } = useNotifications();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const chartData = useMemo(() => {
    const now = new Date();
    const days: { day: string; count: number; isToday: boolean }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      const dayLabel = d.toLocaleDateString(isAr ? "ar-SA" : "en-US", { weekday: "short" });
      const count = notifications.filter(n => n.created_at.startsWith(key)).length;
      days.push({ day: dayLabel, count, isToday: i === 0 });
    }

    return days;
  }, [notifications, isAr]);

  const totalThisWeek = chartData.reduce((s, d) => s + d.count, 0);
  const todayCount = chartData[chartData.length - 1]?.count || 0;

  if (notifications.length === 0) return null;

  return (
    <Card className="relative overflow-hidden transition-shadow hover:shadow-md border-border/50">
      <div className="pointer-events-none absolute -top-8 -start-8 h-24 w-24 rounded-full bg-chart-3/5 blur-[40px]" />
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-chart-3/10">
              <Activity className="h-3.5 w-3.5 text-chart-3" />
            </div>
            {isAr ? "نشاط الإشعارات" : "Notification Activity"}
          </span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 animate-pulse">
              {unreadCount} {isAr ? "جديد" : "new"}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Mini bar chart */}
        <div className="h-16">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={12}>
              <XAxis dataKey="day" hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} name={isAr ? "إشعارات" : "Notifications"}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.isToday ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.2)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Bell className="h-3 w-3" />
            {isAr ? `${todayCount} اليوم` : `${todayCount} today`}
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {isAr ? `${totalThisWeek} هذا الأسبوع` : `${totalThisWeek} this week`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
});
