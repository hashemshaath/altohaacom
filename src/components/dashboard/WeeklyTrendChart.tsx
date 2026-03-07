import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, TrendingUp, TrendingDown } from "lucide-react";
import { format, subDays } from "date-fns";
import { ar, enUS } from "date-fns/locale";

export function WeeklyTrendChart() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["weekly-trend", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const days: { date: string; label: string; posts: number; reactions: number; views: number }[] = [];
      const locale = isAr ? ar : enUS;

      // Generate last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = subDays(new Date(), i);
        const start = new Date(d);
        start.setHours(0, 0, 0, 0);
        const end = new Date(d);
        end.setHours(23, 59, 59, 999);

        days.push({
          date: start.toISOString(),
          label: format(d, "EEE", { locale }),
          posts: 0,
          reactions: 0,
          views: 0,
        });
      }

      const weekAgo = subDays(new Date(), 7).toISOString();

      const [postsRes, reactionsRes, viewsRes] = await Promise.allSettled([
        supabase.from("posts").select("created_at").eq("author_id", user.id).gte("created_at", weekAgo),
        supabase.from("post_reactions").select("created_at").eq("user_id", user.id).gte("created_at", weekAgo),
        supabase.from("profile_views").select("viewed_at").eq("profile_user_id", user.id).gte("viewed_at", weekAgo),
      ]);

      const posts = postsRes.status === "fulfilled" ? (postsRes.value.data || []) : [];
      const reactions = reactionsRes.status === "fulfilled" ? (reactionsRes.value.data || []) : [];
      const views = viewsRes.status === "fulfilled" ? (viewsRes.value.data || []) : [];

      posts.forEach((p: any) => {
        const dayIdx = days.findIndex(d => new Date(p.created_at).toDateString() === new Date(d.date).toDateString());
        if (dayIdx >= 0) days[dayIdx].posts++;
      });

      reactions.forEach((r: any) => {
        const dayIdx = days.findIndex(d => new Date(r.created_at).toDateString() === new Date(d.date).toDateString());
        if (dayIdx >= 0) days[dayIdx].reactions++;
      });

      views.forEach((v: any) => {
        const dayIdx = days.findIndex(d => new Date(v.viewed_at).toDateString() === new Date(d.date).toDateString());
        if (dayIdx >= 0) days[dayIdx].views++;
      });

      const totalActivity = days.reduce((sum, d) => sum + d.posts + d.reactions + d.views, 0);
      const firstHalf = days.slice(0, 3).reduce((s, d) => s + d.posts + d.reactions + d.views, 0);
      const secondHalf = days.slice(4).reduce((s, d) => s + d.posts + d.reactions + d.views, 0);

      return { days, totalActivity, trending: secondHalf >= firstHalf ? "up" : "down" };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  if (!data || data.totalActivity === 0) return null;

  return (
    <Card className="border-border/40 transition-shadow hover:shadow-lg">
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-chart-2/10">
              <Activity className="h-3.5 w-3.5 text-chart-2" />
            </div>
            {isAr ? "نشاط الأسبوع" : "Weekly Activity"}
          </span>
          <span className={`flex items-center gap-1 text-xs font-bold ${data.trending === "up" ? "text-chart-2" : "text-destructive"}`}>
            {data.trending === "up" ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {data.totalActivity}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="h-28">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.days} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
              <defs>
                <linearGradient id="activityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "11px",
                }}
                labelStyle={{ fontWeight: "bold", marginBottom: "4px" }}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = isAr
                    ? { posts: "منشورات", reactions: "تفاعلات", views: "مشاهدات" }
                    : { posts: "Posts", reactions: "Reactions", views: "Views" };
                  return [value, labels[name] || name];
                }}
              />
              <Area type="monotone" dataKey="views" stackId="1" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3) / 0.15)" strokeWidth={1.5} />
              <Area type="monotone" dataKey="reactions" stackId="1" stroke="hsl(var(--chart-4))" fill="hsl(var(--chart-4) / 0.15)" strokeWidth={1.5} />
              <Area type="monotone" dataKey="posts" stackId="1" stroke="hsl(var(--primary))" fill="url(#activityGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
