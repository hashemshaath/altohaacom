import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarClock, TrendingUp, Users, Clock } from "lucide-react";
import { format, subDays, differenceInDays } from "date-fns";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export const RegistrationTimelineWidget = memo(function RegistrationTimelineWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-registration-timeline"],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      
      const [{ data: regs }, { data: upcoming }] = await Promise.all([
        supabase
          .from("competition_registrations")
          .select("registered_at, status")
          .gte("registered_at", thirtyDaysAgo)
          .order("registered_at", { ascending: true })
          .limit(1000),
        supabase
          .from("competitions")
          .select("id, title, title_ar, registration_deadline, competition_start, status")
          .in("status", ["registration_open", "upcoming"])
          .order("registration_deadline", { ascending: true })
          .limit(5),
      ]);

      // Build daily chart data
      const dailyMap: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "MM/dd");
        dailyMap[d] = 0;
      }
      regs?.forEach(r => {
        const day = format(new Date(r.registered_at), "MM/dd");
        if (dailyMap[day] !== undefined) dailyMap[day]++;
      });

      const chartData = Object.entries(dailyMap).map(([day, count]) => ({ day, count }));
      const totalRegs = regs?.length || 0;
      const approvedRegs = regs?.filter(r => r.status === "approved").length || 0;

      return { chartData, totalRegs, approvedRegs, upcoming: upcoming || [] };
    },
    staleTime: 1000 * 60 * 3,
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="h-4 w-4 text-primary" />
          {isAr ? "نشاط التسجيل (30 يوم)" : "Registration Activity (30d)"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 rounded-xl bg-primary/5">
            <AnimatedCounter value={data?.totalRegs || 0} className="text-lg font-bold text-primary" />
            <p className="text-[10px] text-muted-foreground">{isAr ? "إجمالي التسجيلات" : "Total Registrations"}</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-chart-2/5">
            <AnimatedCounter value={data?.approvedRegs || 0} className="text-lg font-bold text-chart-2" />
            <p className="text-[10px] text-muted-foreground">{isAr ? "موافق عليها" : "Approved"}</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-chart-4/5">
            <AnimatedCounter value={data?.totalRegs ? Math.round((data.approvedRegs / data.totalRegs) * 100) : 0} className="text-lg font-bold text-chart-4" suffix="%" />
            <p className="text-[10px] text-muted-foreground">{isAr ? "معدل القبول" : "Approval Rate"}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.chartData || []}>
              <defs>
                <linearGradient id="regGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis hide />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
              <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#regGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Upcoming Deadlines */}
        {data?.upcoming && data.upcoming.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">{isAr ? "مواعيد نهائية قادمة" : "Upcoming Deadlines"}</p>
            {data.upcoming.map((comp: any) => {
              const daysLeft = comp.registration_deadline ? differenceInDays(new Date(comp.registration_deadline), new Date()) : null;
              return (
                <div key={comp.id} className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/30">
                  <span className="truncate flex-1">{isAr && comp.title_ar ? comp.title_ar : comp.title}</span>
                  {daysLeft !== null && (
                    <Badge variant={daysLeft <= 3 ? "destructive" : "secondary"} className="text-[10px] px-1.5 py-0 shrink-0 ms-2">
                      <Clock className="h-2.5 w-2.5 me-0.5" />
                      {daysLeft <= 0 ? (isAr ? "انتهى" : "Ended") : `${daysLeft}d`}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
