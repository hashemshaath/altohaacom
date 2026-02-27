import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Gauge, Database, Zap, Clock, Activity, Server, HardDrive, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { toEnglishDigits } from "@/lib/formatNumber";

export function PerformanceMonitorWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: perfData } = useQuery({
    queryKey: ["admin-performance-monitor"],
    queryFn: async () => {
      const start = performance.now();

      // Measure DB response time with a lightweight query
      const dbStart = performance.now();
      await supabase.from("profiles").select("id", { count: "exact", head: true });
      const dbLatency = Math.round(performance.now() - dbStart);

      // Measure tables size indicators
      const [profiles, articles, posts, competitions, orders, notifications] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("articles").select("*", { count: "exact", head: true }),
        supabase.from("posts").select("*", { count: "exact", head: true }),
        supabase.from("competitions").select("*", { count: "exact", head: true }),
        supabase.from("company_orders").select("*", { count: "exact", head: true }),
        supabase.from("notifications").select("*", { count: "exact", head: true }),
      ]);

      const totalRecords = (profiles.count || 0) + (articles.count || 0) + (posts.count || 0) +
        (competitions.count || 0) + (orders.count || 0) + (notifications.count || 0);

      const tables = [
        { name: isAr ? "المستخدمين" : "Profiles", count: profiles.count || 0 },
        { name: isAr ? "الإشعارات" : "Notifications", count: notifications.count || 0 },
        { name: isAr ? "المنشورات" : "Posts", count: posts.count || 0 },
        { name: isAr ? "المقالات" : "Articles", count: articles.count || 0 },
        { name: isAr ? "المسابقات" : "Competitions", count: competitions.count || 0 },
        { name: isAr ? "الطلبات" : "Orders", count: orders.count || 0 },
      ].sort((a, b) => b.count - a.count);

      const totalQueryTime = Math.round(performance.now() - start);

      return {
        dbLatency,
        totalQueryTime,
        totalRecords,
        tables,
        healthScore: dbLatency < 200 ? 95 : dbLatency < 500 ? 80 : dbLatency < 1000 ? 60 : 40,
      };
    },
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
  });

  if (!perfData) return null;

  const healthColor = perfData.healthScore >= 80 ? "text-chart-2" : perfData.healthScore >= 60 ? "text-chart-4" : "text-destructive";
  const healthBg = perfData.healthScore >= 80 ? "bg-chart-2/10" : perfData.healthScore >= 60 ? "bg-chart-4/10" : "bg-destructive/10";
  const latencyColor = perfData.dbLatency < 200 ? "text-chart-2" : perfData.dbLatency < 500 ? "text-chart-4" : "text-destructive";
  const maxTableCount = Math.max(...perfData.tables.map(t => t.count), 1);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Health Score */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            {isAr ? "صحة النظام" : "System Health"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className={cn("inline-flex h-20 w-20 items-center justify-center rounded-full", healthBg)}>
              <span className={cn("text-3xl font-black", healthColor)}>{perfData.healthScore}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              {perfData.healthScore >= 80 ? (isAr ? "ممتاز" : "Excellent") :
               perfData.healthScore >= 60 ? (isAr ? "جيد" : "Good") :
               (isAr ? "يحتاج تحسين" : "Needs Improvement")}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <Zap className="h-3 w-3 text-chart-4" />
                {isAr ? "زمن استجابة قاعدة البيانات" : "DB Latency"}
              </div>
              <span className={cn("font-bold", latencyColor)}>{perfData.dbLatency}ms</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-primary" />
                {isAr ? "وقت التحميل الكلي" : "Total Query Time"}
              </div>
              <span className="font-bold">{perfData.totalQueryTime}ms</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <Database className="h-3 w-3 text-chart-3" />
                {isAr ? "إجمالي السجلات" : "Total Records"}
              </div>
              <span className="font-bold">{toEnglishDigits(perfData.totalRecords.toLocaleString())}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Sizes */}
      <Card className="border-border/50 lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-chart-3" />
            {isAr ? "توزيع البيانات" : "Data Distribution"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            {perfData.tables.map((table) => {
              const pct = Math.round((table.count / maxTableCount) * 100);
              return (
                <div key={table.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{table.name}</span>
                    <span className="font-medium">{toEnglishDigits(table.count.toLocaleString())}</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
