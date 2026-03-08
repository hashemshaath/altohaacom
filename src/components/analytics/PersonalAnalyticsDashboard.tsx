import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import {
  FileText, Heart, Users, UserPlus, Trophy, ChefHat, Sparkles, TrendingUp,
  TrendingDown, Minus, Eye, Star, Hash, Lightbulb, Zap, BookOpen,
  MessageSquare, Film,
} from "lucide-react";

interface AnalyticsData {
  summary: {
    totalPosts30d: number;
    postGrowth: number;
    totalReactionsReceived: number;
    totalReactionsGiven: number;
    engagementRate: number;
    totalFollowers: number;
    newFollowers30d: number;
    totalFollowing: number;
    totalComps: number;
    totalRecipes: number;
    totalRecipeSaves: number;
    totalPointsEarned: number;
    totalStories: number;
    totalStoryViews: number;
    profileViews: number;
    loyaltyPoints: number;
    memberSince: string;
  };
  activityChart: { date: string; posts: number; reactions: number; points: number }[];
  reactionBreakdown: Record<string, number>;
  pointsByAction: Record<string, number>;
  topPosts: { id: string; preview: string; likes: number; comments: number }[];
  topHashtags: { tag: string; count: number }[];
  aiInsight: { summary: string; summary_ar: string; tips: string[]; tips_ar: string[] };
}

const CHART_COLORS = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--primary))",
];

const REACTION_EMOJIS: Record<string, string> = {
  fire: "🔥", chef_kiss: "👨‍🍳", star: "⭐", love: "❤️", bravo: "👏", like: "👍",
};

const tooltipStyle = {
  borderRadius: "0.75rem",
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
  fontSize: "12px",
};

export const PersonalAnalyticsDashboard = memo(function PersonalAnalyticsDashboard() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading, error } = useQuery({
    queryKey: ["personal-analytics", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("personal-analytics");
      if (error) throw error;
      return data as AnalyticsData;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 15,
    retry: 1,
  });

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !data) return null;

  const s = data.summary;
  const TrendIcon = s.postGrowth === 0 ? Minus : s.postGrowth > 0 ? TrendingUp : TrendingDown;
  const trendColor = s.postGrowth === 0 ? "text-muted-foreground" : s.postGrowth > 0 ? "text-chart-2" : "text-destructive";

  const kpiCards = [
    { icon: FileText, label: isAr ? "المنشورات" : "Posts", value: s.totalPosts30d, sub: isAr ? "آخر 30 يوم" : "Last 30 days", color: "text-chart-1", bg: "bg-chart-1/10", trend: s.postGrowth },
    { icon: Heart, label: isAr ? "التفاعلات المستلمة" : "Reactions Received", value: s.totalReactionsReceived, sub: `${s.engagementRate}/` + (isAr ? "منشور" : "post"), color: "text-chart-2", bg: "bg-chart-2/10" },
    { icon: Users, label: isAr ? "المتابعون" : "Followers", value: s.totalFollowers, sub: `+${s.newFollowers30d} ` + (isAr ? "جديد" : "new"), color: "text-chart-3", bg: "bg-chart-3/10" },
    { icon: Eye, label: isAr ? "زيارات الملف" : "Profile Views", value: s.profileViews, color: "text-chart-4", bg: "bg-chart-4/10" },
    { icon: Trophy, label: isAr ? "المسابقات" : "Competitions", value: s.totalComps, color: "text-chart-5", bg: "bg-chart-5/10" },
    { icon: ChefHat, label: isAr ? "الوصفات" : "Recipes", value: s.totalRecipes, sub: `${s.totalRecipeSaves} ` + (isAr ? "حفظ" : "saves"), color: "text-primary", bg: "bg-primary/10" },
    { icon: Star, label: isAr ? "النقاط المكتسبة" : "Points Earned", value: s.totalPointsEarned, sub: isAr ? "آخر 30 يوم" : "Last 30 days", color: "text-chart-1", bg: "bg-chart-1/10" },
    { icon: Film, label: isAr ? "القصص" : "Stories", value: s.totalStories, sub: `${s.totalStoryViews} ` + (isAr ? "مشاهدة" : "views"), color: "text-chart-2", bg: "bg-chart-2/10" },
  ];

  const reactionPieData = Object.entries(data.reactionBreakdown).map(([type, count]) => ({
    name: (REACTION_EMOJIS[type] || "👍") + " " + type,
    value: count,
  }));

  const pointsBarData = Object.entries(data.pointsByAction)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([action, points]) => ({ action: action.replace(/_/g, " "), points }));

  return (
    <div className="space-y-6">
      {/* AI Insight Banner */}
      {data.aiInsight?.summary && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">{isAr ? data.aiInsight.summary_ar : data.aiInsight.summary}</p>
                {(isAr ? data.aiInsight.tips_ar : data.aiInsight.tips)?.length > 0 && (
                  <div className="space-y-1.5">
                    {(isAr ? data.aiInsight.tips_ar : data.aiInsight.tips).map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Lightbulb className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpiCards.map((card) => (
          <Card key={card.label} className="transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", card.bg)}>
                  <card.icon className={cn("h-5 w-5", card.color)} />
                </div>
                <div className="min-w-0">
                  <AnimatedCounter value={card.value} className="text-xl font-bold tabular-nums" />
                  <p className="text-[10px] text-muted-foreground truncate">{card.label}</p>
                  <div className="flex items-center gap-1">
                    {card.sub && <span className="text-[10px] text-muted-foreground">{card.sub}</span>}
                    {"trend" in card && card.trend !== undefined && card.trend !== 0 && (
                      <span className={cn("text-[10px] font-medium", card.trend > 0 ? "text-chart-2" : "text-destructive")}>
                        {card.trend > 0 ? "+" : ""}{card.trend}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {isAr ? "النشاط خلال 30 يوم" : "Activity (30 Days)"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.activityChart}>
                <defs>
                  <linearGradient id="postsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="reactionsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="posts" stroke="hsl(var(--chart-1))" fill="url(#postsGrad)" strokeWidth={2} name={isAr ? "المنشورات" : "Posts"} />
                <Area type="monotone" dataKey="reactions" stroke="hsl(var(--chart-2))" fill="url(#reactionsGrad)" strokeWidth={2} name={isAr ? "التفاعلات" : "Reactions"} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Reaction Breakdown */}
        {reactionPieData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Heart className="h-4 w-4 text-chart-2" />
                {isAr ? "أنواع التفاعلات" : "Reaction Types"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={reactionPieData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={3} dataKey="value">
                      {reactionPieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {reactionPieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-1 text-[10px]">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    {entry.name} ({entry.value})
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Points by Action */}
        {pointsBarData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-chart-4" />
                {isAr ? "مصادر النقاط" : "Points Sources"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pointsBarData} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="action" tick={{ fontSize: 9 }} width={80} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="points" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Hashtags */}
        {data.topHashtags.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Hash className="h-4 w-4 text-chart-3" />
                {isAr ? "أكثر الهاشتاقات" : "Top Hashtags"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {data.topHashtags.map((h, i) => (
                  <Badge key={h.tag} variant="secondary" className="text-xs">
                    #{h.tag}
                    <span className="ms-1 text-muted-foreground">({h.count})</span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Posts */}
      {data.topPosts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {isAr ? "أفضل المنشورات أداءً" : "Top Performing Posts"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.topPosts.map((post, i) => (
              <div key={post.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-border/40 hover:border-border/60 transition-colors">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                  {i + 1}
                </div>
                <p className="flex-1 text-xs truncate text-muted-foreground">{post.preview || (isAr ? "منشور" : "Post")}</p>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Heart className="h-3 w-3" /> {post.likes}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageSquare className="h-3 w-3" /> {post.comments}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
});
