import { useState, useMemo, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Eye, Heart, Users, Trophy, Download, Calendar, Activity, PieChart } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell, Legend } from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { AnimatedCounter } from "@/components/ui/animated-counter";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export const AnalyticsDashboard = memo(function AnalyticsDashboard() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const [period, setPeriod] = useState("30");

  const startDate = useMemo(() => subDays(new Date(), parseInt(period)).toISOString(), [period]);

  const { data: postStats } = useQuery({
    queryKey: ["analytics-posts", user?.id, period],
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("created_at")
        .eq("author_id", user!.id)
        .gte("created_at", startDate)
        .order("created_at", { ascending: true });
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Get reactions & comments counts separately
  const { data: engagementStats } = useQuery({
    queryKey: ["analytics-engagement", user?.id, period],
    queryFn: async () => {
      const [reactions, comments] = await Promise.all([
        supabase.from("post_reactions").select("*", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("post_comments").select("*", { count: "exact", head: true }).eq("author_id", user!.id),
      ]);
      return { likes: reactions.count || 0, comments: comments.count || 0 };
    },
    enabled: !!user?.id,
  });

  const { data: followerStats } = useQuery({
    queryKey: ["analytics-followers", user?.id, period],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_follows")
        .select("created_at")
        .eq("following_id", user!.id)
        .gte("created_at", startDate)
        .order("created_at", { ascending: true });
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: profileViews } = useQuery({
    queryKey: ["analytics-views", user?.id, period],
    queryFn: async () => {
      const { data } = await supabase
        .from("profile_views")
        .select("created_at")
        .eq("profile_user_id", user!.id)
        .gte("created_at", startDate);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Aggregate daily data
  const dailyData = useMemo(() => {
    const days = parseInt(period);
    const map: Record<string, { date: string; posts: number; followers: number; views: number }> = {};
    for (let i = 0; i < days; i++) {
      const d = format(subDays(new Date(), days - 1 - i), "yyyy-MM-dd");
      map[d] = { date: d, posts: 0, followers: 0, views: 0 };
    }
    postStats?.forEach(p => {
      const d = format(new Date(p.created_at), "yyyy-MM-dd");
      if (map[d]) map[d].posts++;
    });
    followerStats?.forEach(f => {
      const d = format(new Date(f.created_at), "yyyy-MM-dd");
      if (map[d]) map[d].followers++;
    });
    profileViews?.forEach(v => {
      const d = format(new Date(v.created_at), "yyyy-MM-dd");
      if (map[d]) map[d].views++;
    });
    return Object.values(map);
  }, [postStats, followerStats, profileViews, period]);

  const totals = useMemo(() => ({
    posts: postStats?.length || 0,
    likes: engagementStats?.likes || 0,
    comments: engagementStats?.comments || 0,
    followers: followerStats?.length || 0,
    views: profileViews?.length || 0,
  }), [postStats, engagementStats, followerStats, profileViews]);

  const engagementPie = useMemo(() => [
    { name: isAr ? "إعجابات" : "Likes", value: totals.likes },
    { name: isAr ? "تعليقات" : "Comments", value: totals.comments },
    { name: isAr ? "متابعات" : "Follows", value: totals.followers },
    { name: isAr ? "مشاهدات" : "Views", value: totals.views },
  ].filter(d => d.value > 0), [totals, isAr]);

  const exportCSV = () => {
    const header = "Date,Posts,Followers,Views\n";
    const rows = dailyData.map(d => `${d.date},${d.posts},${d.followers},${d.views}`).join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "analytics.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const KPI_CARDS = [
    { icon: BarChart3, label: isAr ? "المنشورات" : "Posts", value: totals.posts, color: "text-blue-500" },
    { icon: Heart, label: isAr ? "الإعجابات" : "Likes", value: totals.likes, color: "text-pink-500" },
    { icon: Users, label: isAr ? "المتابعون الجدد" : "New Followers", value: totals.followers, color: "text-green-500" },
    { icon: Eye, label: isAr ? "مشاهدات الملف" : "Profile Views", value: totals.views, color: "text-purple-500" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          {isAr ? "لوحة التحليلات" : "Analytics Dashboard"}
        </h3>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">{isAr ? "7 أيام" : "7 days"}</SelectItem>
              <SelectItem value="30">{isAr ? "30 يوم" : "30 days"}</SelectItem>
              <SelectItem value="90">{isAr ? "90 يوم" : "90 days"}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={exportCSV}>
            <Download className="h-3 w-3" /> CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {KPI_CARDS.map((k, i) => {
          const Icon = k.icon;
          return (
            <Card key={i}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${k.color}`} />
                  <span className="text-xs text-muted-foreground">{k.label}</span>
                </div>
                <AnimatedCounter value={k.value} className="text-xl font-bold mt-1" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="growth">
        <TabsList className="h-8">
          <TabsTrigger value="growth" className="text-xs h-7">{isAr ? "النمو" : "Growth"}</TabsTrigger>
          <TabsTrigger value="engagement" className="text-xs h-7">{isAr ? "التفاعل" : "Engagement"}</TabsTrigger>
          <TabsTrigger value="distribution" className="text-xs h-7">{isAr ? "التوزيع" : "Distribution"}</TabsTrigger>
        </TabsList>

        <TabsContent value="growth">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{isAr ? "نمو المتابعين والمشاهدات" : "Followers & Views Growth"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tickFormatter={d => format(new Date(d), "d/M")} className="text-[10px]" />
                  <YAxis className="text-[10px]" />
                  <Tooltip labelFormatter={d => format(new Date(d as string), "MMM d, yyyy")} />
                  <Area type="monotone" dataKey="followers" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" name={isAr ? "متابعون" : "Followers"} />
                  <Area type="monotone" dataKey="views" stroke="hsl(var(--chart-4))" fill="hsl(var(--chart-4) / 0.2)" name={isAr ? "مشاهدات" : "Views"} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{isAr ? "الإعجابات والتعليقات" : "Likes & Comments"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tickFormatter={d => format(new Date(d), "d/M")} className="text-[10px]" />
                  <YAxis className="text-[10px]" />
                  <Tooltip labelFormatter={d => format(new Date(d as string), "MMM d, yyyy")} />
                  <Bar dataKey="likes" fill="hsl(var(--chart-2))" name={isAr ? "إعجابات" : "Likes"} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="comments" fill="hsl(var(--chart-3))" name={isAr ? "تعليقات" : "Comments"} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{isAr ? "توزيع التفاعل" : "Engagement Distribution"}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              {engagementPie.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <RPieChart>
                    <Pie data={engagementPie} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {engagementPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </RPieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground py-8">{isAr ? "لا توجد بيانات كافية" : "Not enough data"}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
});
