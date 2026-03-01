import { useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { Brain, Target, Users, Activity, Clock, Sparkles } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

const COLORS = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))",
];

export function AdBehaviorInsights() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: behaviors = [] } = useQuery({
    queryKey: ["ad-behavior-insights"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ad_user_behaviors")
        .select("event_type, page_category, device_type, duration_seconds, created_at")
        .order("created_at", { ascending: false })
        .limit(1000);
      return data || [];
    },
  });

  const { data: interests = [] } = useQuery({
    queryKey: ["ad-interest-profiles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ad_user_interests")
        .select("interest_category, score, interaction_count")
        .order("score", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  // Category engagement
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    behaviors.forEach((b: any) => {
      if (b.page_category) counts[b.page_category] = (counts[b.page_category] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [behaviors]);

  // Hourly activity
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, views: 0 }));
    behaviors.forEach((b: any) => {
      if (b.created_at) {
        const h = new Date(b.created_at).getHours();
        hours[h].views++;
      }
    });
    return hours;
  }, [behaviors]);

  // Average session duration
  const avgDuration = useMemo(() => {
    const durations = behaviors.filter((b: any) => b.duration_seconds && b.duration_seconds > 0).map((b: any) => b.duration_seconds);
    return durations.length > 0 ? Math.round(durations.reduce((s: number, d: number) => s + d, 0) / durations.length) : 0;
  }, [behaviors]);

  const totalEvents = behaviors.length;
  const uniqueSessions = new Set(behaviors.map((b: any) => b.created_at?.slice(0, 10))).size;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Quick Stats */}
      <Card className="md:col-span-2">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Activity, label: isAr ? "إجمالي الأحداث" : "Total Events", value: totalEvents },
              { icon: Users, label: isAr ? "الأيام النشطة" : "Active Days", value: uniqueSessions },
              { icon: Clock, label: isAr ? "متوسط المدة" : "Avg Duration", value: `${avgDuration}s` },
              { icon: Target, label: isAr ? "الاهتمامات" : "Interest Profiles", value: interests.length },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <s.icon className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold">{typeof s.value === "number" ? <AnimatedCounter value={s.value} /> : s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Engagement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4" />
            {isAr ? "تفاعل حسب القسم" : "Engagement by Section"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length === 0 ? (
            <p className="text-center py-8 text-sm text-muted-foreground">{isAr ? "لا توجد بيانات" : "No data yet"}</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Peak Activity Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            {isAr ? "أوقات الذروة" : "Peak Activity Hours"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={3} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="views" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* User Interests */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" />
            {isAr ? "ملف اهتمامات المستخدمين" : "User Interest Profiles"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {interests.length === 0 ? (
            <p className="text-center py-8 text-sm text-muted-foreground">{isAr ? "لا توجد بيانات" : "No interest data yet"}</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {interests.map((interest: any, i: number) => {
                const maxScore = Math.max(...interests.map((x: any) => x.score || 1));
                const pct = ((interest.score || 0) / maxScore) * 100;
                return (
                  <div key={i} className="p-3 rounded-xl bg-muted/50">
                    <div className="flex items-center justify-between mb-1.5">
                      <Badge variant="outline" className="text-[10px]">{interest.interest_category}</Badge>
                      <span className="text-[10px] text-muted-foreground">{interest.interaction_count} {isAr ? "تفاعل" : "actions"}</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
