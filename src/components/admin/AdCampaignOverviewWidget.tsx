import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Megaphone, Eye, MousePointerClick, DollarSign, TrendingUp, Pause, Play, AlertCircle } from "lucide-react";

export function AdCampaignOverviewWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["ad-campaign-overview-widget"],
    queryFn: async () => {
      const [{ data: campaigns }, { data: creatives }] = await Promise.all([
        supabase.from("ad_campaigns").select("status, budget, spent, total_impressions, total_clicks, total_views, billing_model").limit(500),
        supabase.from("ad_creatives").select("status, impressions, clicks, views").limit(500),
      ]);

      const total = campaigns?.length || 0;
      const active = campaigns?.filter(c => c.status === "active").length || 0;
      const paused = campaigns?.filter(c => c.status === "paused").length || 0;
      const pending = campaigns?.filter(c => c.status === "pending_approval").length || 0;
      const totalBudget = campaigns?.reduce((s, c) => s + (c.budget || 0), 0) || 0;
      const totalSpent = campaigns?.reduce((s, c) => s + (c.spent || 0), 0) || 0;
      const totalImpressions = campaigns?.reduce((s, c) => s + (c.total_impressions || 0), 0) || 0;
      const totalClicks = campaigns?.reduce((s, c) => s + (c.total_clicks || 0), 0) || 0;
      const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";
      const budgetUtilization = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

      const pendingCreatives = creatives?.filter(c => c.status === "pending_review").length || 0;

      return {
        total, active, paused, pending, totalBudget, totalSpent,
        totalImpressions, totalClicks, ctr, budgetUtilization, pendingCreatives,
      };
    },
    staleTime: 60000,
  });

  if (!data) return null;

  const fmt = (n: number) => n.toLocaleString("en");

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-chart-4" />
            {isAr ? "نظرة عامة على الإعلانات" : "Advertising Overview"}
          </CardTitle>
          {data.pending > 0 && (
            <Badge variant="destructive" className="text-[9px]">{data.pending} {isAr ? "بانتظار الموافقة" : "pending"}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { icon: Eye, label: isAr ? "المشاهدات" : "Impressions", value: fmt(data.totalImpressions), color: "text-chart-1" },
            { icon: MousePointerClick, label: isAr ? "النقرات" : "Clicks", value: fmt(data.totalClicks), sub: `CTR: ${data.ctr}%`, color: "text-chart-2" },
            { icon: DollarSign, label: isAr ? "الإنفاق" : "Spent", value: fmt(data.totalSpent), sub: `/ ${fmt(data.totalBudget)}`, color: "text-chart-3" },
            { icon: TrendingUp, label: isAr ? "الحملات" : "Campaigns", value: String(data.total), sub: `${data.active} ${isAr ? "نشطة" : "active"}`, color: "text-primary" },
          ].map((m, i) => (
            <div key={i} className="p-2 rounded-lg bg-muted/30 border border-border/40">
              <div className="flex items-center gap-1.5 mb-1">
                <m.icon className={`h-3 w-3 ${m.color}`} />
                <span className="text-[9px] text-muted-foreground">{m.label}</span>
              </div>
              <p className="text-sm font-bold">{m.value}</p>
              {m.sub && <p className="text-[8px] text-muted-foreground">{m.sub}</p>}
            </div>
          ))}
        </div>

        {/* Budget utilization */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">{isAr ? "استخدام الميزانية" : "Budget Utilization"}</span>
            <span className="text-[10px] font-medium">{data.budgetUtilization}%</span>
          </div>
          <Progress value={data.budgetUtilization} className="h-1.5" />
        </div>

        {/* Status indicators */}
        <div className="flex flex-wrap gap-2 text-[10px]">
          <span className="flex items-center gap-1 text-chart-2"><Play className="h-3 w-3" /> {data.active} {isAr ? "نشطة" : "active"}</span>
          <span className="flex items-center gap-1 text-chart-4"><Pause className="h-3 w-3" /> {data.paused} {isAr ? "متوقفة" : "paused"}</span>
          {data.pendingCreatives > 0 && (
            <span className="flex items-center gap-1 text-destructive"><AlertCircle className="h-3 w-3" /> {data.pendingCreatives} {isAr ? "إعلان بانتظار المراجعة" : "creatives pending"}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
