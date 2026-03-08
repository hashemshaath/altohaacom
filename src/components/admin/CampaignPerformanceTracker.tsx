import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, Target, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export const CampaignPerformanceTracker = memo(function CampaignPerformanceTracker() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaign-performance-tracker"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_campaigns")
        .select("id, name, name_ar, status, budget, spent, total_impressions, total_clicks, billing_model, start_date, end_date")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 2,
  });

  if (!campaigns.length) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          {isAr ? "أداء الحملات النشطة" : "Active Campaign Performance"}
          <Badge variant="secondary" className="text-[10px]">{campaigns.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {campaigns.map((c) => {
          const budget = c.budget || 1;
          const spent = c.spent || 0;
          const pct = Math.min(Math.round((spent / budget) * 100), 100);
          const ctr = c.total_impressions
            ? ((c.total_clicks || 0) / c.total_impressions * 100).toFixed(2)
            : "0";
          const isOverBudget = pct >= 90;

          return (
            <div key={c.id} className="rounded-xl border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Megaphone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium truncate">
                    {isAr ? c.name_ar || c.name : c.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isOverBudget && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                  <Badge variant="outline" className="text-[10px]">{c.billing_model}</Badge>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Progress value={pct} className="h-1.5 flex-1" />
                <span className="text-[10px] font-mono text-muted-foreground w-10 text-end">{pct}%</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{isAr ? "مصروف" : "Spent"}:</span>
                  <span className="font-mono font-medium"><AnimatedCounter value={spent} className="inline" />/<AnimatedCounter value={budget} className="inline" /></span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">CTR:</span>
                  <span className="font-mono font-medium">{ctr}%</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <AnimatedCounter value={c.total_impressions || 0} className="inline" /> {isAr ? "مشاهدة" : "imp"} / <AnimatedCounter value={c.total_clicks || 0} className="inline" /> {isAr ? "نقرة" : "clicks"}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
});
