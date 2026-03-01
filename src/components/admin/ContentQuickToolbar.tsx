import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText, Eye, Star, Clock, TrendingUp, Search,
  BarChart3, Calendar, Filter,
} from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export function ContentQuickToolbar() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: contentStats } = useQuery({
    queryKey: ["content-quick-stats"],
    queryFn: async () => {
      const now = new Date();
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [totalRes, publishedRes, weeklyRes, viewsRes] = await Promise.all([
        supabase.from("articles").select("id", { count: "exact", head: true }),
        supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("articles").select("id", { count: "exact", head: true }).gte("created_at", last7d),
        supabase.from("articles").select("view_count").eq("status", "published"),
      ]);

      const totalViews = (viewsRes.data || []).reduce((sum, a) => sum + (a.view_count || 0), 0);
      const avgViews = viewsRes.data?.length ? Math.round(totalViews / viewsRes.data.length) : 0;

      return {
        total: totalRes.count || 0,
        published: publishedRes.count || 0,
        thisWeek: weeklyRes.count || 0,
        totalViews,
        avgViews,
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  const metrics = [
    { icon: FileText, label: isAr ? "إجمالي المقالات" : "Total Articles", value: contentStats?.total || 0, color: "text-primary" },
    { icon: Eye, label: isAr ? "إجمالي المشاهدات" : "Total Views", value: contentStats?.totalViews || 0, color: "text-chart-1" },
    { icon: TrendingUp, label: isAr ? "هذا الأسبوع" : "This Week", value: contentStats?.thisWeek || 0, color: "text-chart-2" },
    { icon: BarChart3, label: isAr ? "متوسط المشاهدات" : "Avg Views", value: contentStats?.avgViews || 0, color: "text-chart-3" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {metrics.map((m) => (
        <Card key={m.label} className="overflow-hidden">
          <CardContent className="p-3 flex items-center gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted ${m.color}`}>
              <m.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground truncate">{m.label}</p>
              <AnimatedCounter value={typeof m.value === "number" ? m.value : parseInt(String(m.value).replace(/,/g, "")) || 0} className="text-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
