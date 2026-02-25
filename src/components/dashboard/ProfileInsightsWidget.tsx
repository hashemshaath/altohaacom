import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, TrendingUp, Users, Smartphone, Monitor } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { cn } from "@/lib/utils";

export function ProfileInsightsWidget() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-profile-insights", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const now = new Date();
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [viewsRes, followersRes] = await Promise.all([
        supabase
          .from("profile_views")
          .select("created_at, device_type")
          .eq("profile_user_id", user.id)
          .gte("created_at", fourteenDaysAgo)
          .order("created_at", { ascending: true }),
        supabase
          .from("user_follows")
          .select("id")
          .eq("following_id", user.id),
      ]);

      const views = viewsRes.data || [];
      const followers = followersRes.data?.length || 0;

      // Split into last 7 days vs previous 7
      const last7 = views.filter(v => v.created_at >= sevenDaysAgo);
      const prev7 = views.filter(v => v.created_at < sevenDaysAgo);
      const changePercent = prev7.length > 0 
        ? Math.round(((last7.length - prev7.length) / prev7.length) * 100)
        : last7.length > 0 ? 100 : 0;

      // Device stats
      const mobile = last7.filter(v => v.device_type === "mobile").length;
      const desktop = last7.length - mobile;

      // Daily chart data (last 7 days)
      const dailyData: { day: string; views: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().split("T")[0];
        const dayLabel = d.toLocaleDateString(isAr ? "ar-SA" : "en-US", { weekday: "short" });
        const count = last7.filter(v => v.created_at.startsWith(key)).length;
        dailyData.push({ day: dayLabel, views: count });
      }

      return {
        totalLast7: last7.length,
        changePercent,
        followers,
        mobile,
        desktop,
        dailyData,
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  if (!user) return null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-14" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="relative overflow-hidden transition-shadow hover:shadow-md border-border/50">
      <div className="pointer-events-none absolute -top-8 -end-8 h-24 w-24 rounded-full bg-primary/5 blur-[40px]" />
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
            <Eye className="h-3.5 w-3.5 text-primary" />
          </div>
          {isAr ? "تحليلات الملف" : "Profile Insights"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Sparkline Chart */}
        <div className="h-20">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.dailyData}>
              <defs>
                <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
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
              <Area
                type="monotone"
                dataKey="views"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#viewsGradient)"
                name={isAr ? "المشاهدات" : "Views"}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-border/40 p-2 text-center transition-colors hover:bg-muted/30">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-0.5">
              <Eye className="h-3 w-3" />
              <span>{isAr ? "المشاهدات" : "Views"}</span>
            </div>
            <p className="text-lg font-bold tabular-nums">{data.totalLast7}</p>
            {data.changePercent !== 0 && (
              <p className={cn("text-[10px] font-medium", data.changePercent > 0 ? "text-chart-5" : "text-destructive")}>
                <TrendingUp className="inline h-2.5 w-2.5 me-0.5" />
                {data.changePercent > 0 ? "+" : ""}{data.changePercent}%
              </p>
            )}
          </div>
          <div className="rounded-xl border border-border/40 p-2 text-center transition-colors hover:bg-muted/30">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-0.5">
              <Users className="h-3 w-3" />
              <span>{isAr ? "المتابعون" : "Followers"}</span>
            </div>
            <p className="text-lg font-bold tabular-nums">{data.followers}</p>
          </div>
          <div className="rounded-xl border border-border/40 p-2 text-center transition-colors hover:bg-muted/30">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-0.5">
              {data.mobile > data.desktop ? <Smartphone className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
              <span>{isAr ? "الأجهزة" : "Devices"}</span>
            </div>
            <p className="text-[10px] font-medium tabular-nums mt-1">
              📱 {data.mobile} / 💻 {data.desktop}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
