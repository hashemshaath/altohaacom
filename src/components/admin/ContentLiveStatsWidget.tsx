import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVisibleRefetchInterval } from "@/hooks/useVisibleRefetchInterval";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, BookOpen, MessageSquare, Image, TrendingUp, Eye, Star, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { format, subDays } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export const ContentLiveStatsWidget = memo(function ContentLiveStatsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["contentLiveStats"],
    queryFn: async () => {
      const [articlesRes, postsRes, recipesRes] = await Promise.all([
        supabase.from("articles").select("id, type, status, view_count, created_at, published_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("posts").select("id, created_at, replies_count, reposts_count").order("created_at", { ascending: false }).limit(500),
        supabase.from("recipes").select("id, created_at, save_count, is_published").order("created_at", { ascending: false }).limit(500),
      ]);

      const articles = articlesRes.data || [];
      const posts = postsRes.data || [];
      const recipes = recipesRes.data || [];

      const totalArticles = articles.length;
      const publishedArticles = articles.filter(a => a.status === "published").length;
      const totalViews = articles.reduce((s, a) => s + (a.view_count || 0), 0);
      const totalPosts = posts.length;
      const totalRecipes = recipes.length;
      const publishedRecipes = recipes.filter(r => r.is_published).length;

      // 14-day content trend
      const trend: Record<string, { articles: number; posts: number; recipes: number }> = {};
      for (let i = 13; i >= 0; i--) {
        trend[format(subDays(new Date(), i), "MM/dd")] = { articles: 0, posts: 0, recipes: 0 };
      }
      articles.forEach(a => { const d = format(new Date(a.created_at), "MM/dd"); if (d in trend) trend[d].articles++; });
      posts.forEach(p => { const d = format(new Date(p.created_at), "MM/dd"); if (d in trend) trend[d].posts++; });
      recipes.forEach(r => { const d = format(new Date(r.created_at), "MM/dd"); if (d in trend) trend[d].recipes++; });
      const trendData = Object.entries(trend).map(([date, v]) => ({ date, ...v }));

      // Article type distribution
      const typeMap: Record<string, number> = {};
      articles.forEach(a => { typeMap[a.type || "article"] = (typeMap[a.type || "article"] || 0) + 1; });
      const typeData = Object.entries(typeMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

      // Engagement
      const totalSaves = recipes.reduce((s, r) => s + (r.save_count || 0), 0);
      const totalReplies = posts.reduce((s, p) => s + (p.replies_count || 0), 0);

      return { totalArticles, publishedArticles, totalViews, totalPosts, totalRecipes, publishedRecipes, totalSaves, totalReplies, trendData, typeData };
    },
    refetchInterval: useVisibleRefetchInterval(60000),
  });

  if (!data) return null;

  const stats = [
    { icon: FileText, label: isAr ? "المقالات" : "Articles", value: `${data.publishedArticles}/${data.totalArticles}`, color: "text-primary" },
    { icon: BookOpen, label: isAr ? "الوصفات" : "Recipes", value: data.totalRecipes, color: "text-chart-2" },
    { icon: MessageSquare, label: isAr ? "المنشورات" : "Posts", value: data.totalPosts, color: "text-chart-3" },
    { icon: Eye, label: isAr ? "المشاهدات" : "Views", value: new Intl.NumberFormat().format(data.totalViews), color: "text-chart-4" },
  ];

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          {isAr ? "إحصائيات المحتوى المباشرة" : "Content Live Stats"}
          <Badge variant="secondary" className="ms-auto text-[10px]">
          <Star className="h-2.5 w-2.5 me-1" />
            {data.publishedRecipes} {isAr ? "وصفة منشورة" : "published recipes"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-muted/50 rounded-xl p-3 text-center">
              <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.color}`} />
              <div className="text-lg font-bold">{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              {isAr ? "نشاط المحتوى - 14 يوم" : "Content Activity - 14 Days"}
            </p>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={data.trendData}>
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="articles" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} name={isAr ? "مقالات" : "Articles"} />
                <Area type="monotone" dataKey="posts" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" fillOpacity={0.15} name={isAr ? "منشورات" : "Posts"} />
                <Area type="monotone" dataKey="recipes" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.15} name={isAr ? "وصفات" : "Recipes"} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div>
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              {isAr ? "أنواع المحتوى" : "Content Types"}
            </p>
            {data.typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={data.typeData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 9 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 8 }} width={55} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                    {data.typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[140px] flex items-center justify-center text-xs text-muted-foreground">
                {isAr ? "لا توجد بيانات" : "No data"}
              </div>
            )}
          </div>
        </div>

        {/* Engagement Summary */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-muted/50 rounded-xl p-2.5 text-center">
            <TrendingUp className="h-3 w-3 mx-auto mb-1 text-chart-5" />
            <div className="text-sm font-bold">{new Intl.NumberFormat().format(data.totalSaves)}</div>
            <div className="text-[9px] text-muted-foreground">{isAr ? "حفظ" : "Saves"}</div>
          </div>
          <div className="bg-muted/50 rounded-xl p-2.5 text-center">
            <MessageSquare className="h-3 w-3 mx-auto mb-1 text-chart-3" />
            <div className="text-sm font-bold">{new Intl.NumberFormat().format(data.totalReplies)}</div>
            <div className="text-[9px] text-muted-foreground">{isAr ? "ردود" : "Replies"}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
