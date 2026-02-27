import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, Eye, TrendingUp, Star, BookOpen, Heart, MessageCircle,
  ArrowUp, ArrowDown, Minus, ChefHat,
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";

interface ChefAnalyticsDashboardProps {
  userId?: string;
}

export function ChefAnalyticsDashboard({ userId }: ChefAnalyticsDashboardProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const targetUserId = userId || user?.id;

  const { data: stats, isLoading } = useQuery({
    queryKey: ["chef-analytics", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;

      const followersRes = await supabase.from("user_follows").select("id, created_at").eq("following_id", targetUserId);
      const recipesRes = await (supabase.from("recipes").select("id, title, save_count, share_count, average_rating, ratings_count, created_at, view_count") as any).eq("chef_id", targetUserId);
      const profileRes = await supabase.from("profiles").select("view_count, full_name").eq("user_id", targetUserId).single();

      const recipeIds = (recipesRes.data || []).map((r: any) => r.id);
      const savesRes = recipeIds.length > 0
        ? await supabase.from("recipe_saves").select("id, created_at, recipe_id").in("recipe_id", recipeIds)
        : { data: [] };
      const commentsRes = await supabase.from("post_comments").select("id, created_at").eq("author_id", targetUserId);

      const followers = followersRes.data || [];
      const recipes = recipesRes.data || [];
      const profile = profileRes.data;
      const saves = savesRes.data || [];

      // Follower growth (last 30 days)
      const thirtyDaysAgo = subDays(new Date(), 30);
      const followerGrowth: Record<string, number> = {};
      for (let i = 0; i < 30; i++) {
        const day = format(subDays(new Date(), 29 - i), "MMM dd");
        followerGrowth[day] = 0;
      }
      followers.forEach((f: any) => {
        const d = new Date(f.created_at);
        if (d >= thirtyDaysAgo) {
          const key = format(d, "MMM dd");
          if (followerGrowth[key] !== undefined) followerGrowth[key]++;
        }
      });
      const followerChartData = Object.entries(followerGrowth).map(([date, count]) => ({ date, followers: count }));

      // Recipe performance
      const totalSaves = recipes.reduce((s: number, r: any) => s + (r.save_count || 0), 0);
      const totalShares = recipes.reduce((s: number, r: any) => s + (r.share_count || 0), 0);
      const avgRating = recipes.length > 0
        ? recipes.reduce((s: number, r: any) => s + (r.average_rating || 0), 0) / recipes.filter((r: any) => r.average_rating).length || 0
        : 0;

      // Top recipes
      const topRecipes = [...recipes]
        .sort((a: any, b: any) => ((b.save_count || 0) + (b.share_count || 0)) - ((a.save_count || 0) + (a.share_count || 0)))
        .slice(0, 5);

      // Weekly new followers
      const sevenDaysAgo = subDays(new Date(), 7);
      const fourteenDaysAgo = subDays(new Date(), 14);
      const newFollowersThisWeek = followers.filter((f: any) => new Date(f.created_at) >= sevenDaysAgo).length;
      const newFollowersLastWeek = followers.filter((f: any) => {
        const d = new Date(f.created_at);
        return d >= fourteenDaysAgo && d < sevenDaysAgo;
      }).length;

      return {
        totalFollowers: followers.length,
        newFollowersThisWeek,
        newFollowersLastWeek,
        totalRecipes: recipes.length,
        totalSaves,
        totalShares,
        avgRating: Math.round(avgRating * 10) / 10,
        profileViews: profile?.view_count || 0,
        followerChartData,
        topRecipes,
        totalComments: (commentsRes.data || []).length,
      };
    },
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!stats) return null;

  const followerDelta = stats.newFollowersThisWeek - stats.newFollowersLastWeek;
  const DeltaIcon = followerDelta > 0 ? ArrowUp : followerDelta < 0 ? ArrowDown : Minus;
  const deltaColor = followerDelta > 0 ? "text-chart-2" : followerDelta < 0 ? "text-destructive" : "text-muted-foreground";

  const kpis = [
    { icon: Users, label: isAr ? "المتابعون" : "Followers", value: stats.totalFollowers, sub: `+${stats.newFollowersThisWeek} ${isAr ? "هذا الأسبوع" : "this week"}` },
    { icon: BookOpen, label: isAr ? "الوصفات" : "Recipes", value: stats.totalRecipes, sub: `${stats.totalSaves} ${isAr ? "حفظ" : "saves"}` },
    { icon: Eye, label: isAr ? "مشاهدات الملف" : "Profile Views", value: stats.profileViews, sub: isAr ? "إجمالي" : "total" },
    { icon: Star, label: isAr ? "متوسط التقييم" : "Avg Rating", value: stats.avgRating || "–", sub: `${stats.totalShares} ${isAr ? "مشاركة" : "shares"}` },
  ];

  const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 shrink-0">
                <kpi.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{kpi.label}</p>
                <p className="text-xl font-bold tabular-nums">{kpi.value}</p>
                <p className="text-[10px] text-muted-foreground">{kpi.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Follower Growth Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {isAr ? "نمو المتابعين" : "Follower Growth"}
              <Badge variant="outline" className={`text-[10px] ms-auto ${deltaColor}`}>
                <DeltaIcon className="h-3 w-3 me-0.5" />
                {Math.abs(followerDelta)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={stats.followerChartData}>
                <defs>
                  <linearGradient id="followerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Area type="monotone" dataKey="followers" stroke="hsl(var(--primary))" fill="url(#followerGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Recipes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ChefHat className="h-4 w-4 text-chart-4" />
              {isAr ? "أفضل الوصفات" : "Top Recipes"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topRecipes.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">{isAr ? "لا توجد وصفات بعد" : "No recipes yet"}</p>
            ) : (
              <div className="space-y-2.5">
                {stats.topRecipes.map((recipe: any, idx: number) => (
                  <div key={recipe.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors">
                    <span className="text-xs font-bold text-muted-foreground w-5 text-center">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{recipe.title}</p>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-0.5"><Heart className="h-2.5 w-2.5" /> {recipe.save_count || 0}</span>
                        <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5" /> {recipe.average_rating || "–"}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[9px] shrink-0">
                      {(recipe.save_count || 0) + (recipe.share_count || 0)} {isAr ? "تفاعل" : "eng."}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Engagement Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-chart-3" />
            {isAr ? "ملخص التفاعل" : "Engagement Summary"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: isAr ? "الحفظ" : "Saves", value: stats.totalSaves, icon: Heart, color: "text-destructive" },
              { label: isAr ? "المشاركات" : "Shares", value: stats.totalShares, icon: TrendingUp, color: "text-chart-2" },
              { label: isAr ? "التعليقات" : "Comments", value: stats.totalComments, icon: MessageCircle, color: "text-chart-3" },
              { label: isAr ? "المتابعون الجدد" : "New Followers", value: stats.newFollowersThisWeek, icon: Users, color: "text-primary" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/30 bg-muted/10">
                <item.icon className={`h-5 w-5 ${item.color}`} />
                <p className="text-lg font-bold tabular-nums">{item.value}</p>
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
