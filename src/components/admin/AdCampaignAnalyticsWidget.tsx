import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Megaphone, Eye, MousePointer, DollarSign, TrendingUp, Target } from "lucide-react";
import { subDays, format } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--destructive))"];

export function AdCampaignAnalyticsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-ad-campaign-analytics"],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30).toISOString();

      const [campaigns, impressions, clicks] = await Promise.all([
        supabase.from("ad_campaigns").select("id, status, budget, spent, total_impressions, total_clicks, total_views, billing_model, created_at"),
        supabase.from("ad_impressions").select("id, created_at").gte("created_at", thirtyDaysAgo),
        supabase.from("ad_clicks").select("id, created_at").gte("created_at", thirtyDaysAgo),
      ]);

      const allCampaigns = campaigns.data || [];
      const totalBudget = allCampaigns.reduce((s, c) => s + (c.budget || 0), 0);
      const totalSpent = allCampaigns.reduce((s, c) => s + (c.spent || 0), 0);
      const totalImpressions = allCampaigns.reduce((s, c) => s + (c.total_impressions || 0), 0);
      const totalClicks = allCampaigns.reduce((s, c) => s + (c.total_clicks || 0), 0);
      const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0";
      const roi = totalSpent > 0 ? (((totalBudget - totalSpent) / totalSpent) * 100).toFixed(0) : "0";

      // Status distribution
      const statusMap: Record<string, number> = {};
      allCampaigns.forEach(c => { statusMap[c.status] = (statusMap[c.status] || 0) + 1; });
      const statusDist = Object.entries(statusMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

      // Daily performance (last 7 days)
      const dailyMap: Record<string, { impressions: number; clicks: number }> = {};
      for (let i = 6; i >= 0; i--) {
        dailyMap[format(subDays(now, i), "EEE")] = { impressions: 0, clicks: 0 };
      }
      (impressions.data || []).forEach((imp: any) => {
        const d = format(new Date(imp.created_at), "EEE");
        if (dailyMap[d]) dailyMap[d].impressions++;
      });
      (clicks.data || []).forEach((cl: any) => {
        const d = format(new Date(cl.created_at), "EEE");
        if (dailyMap[d]) dailyMap[d].clicks++;
      });
      const dailyPerf = Object.entries(dailyMap).map(([day, v]) => ({ day, ...v }));

      // Billing model breakdown
      const billingMap: Record<string, number> = {};
      allCampaigns.forEach(c => { billingMap[c.billing_model] = (billingMap[c.billing_model] || 0) + 1; });
      const billingDist = Object.entries(billingMap).map(([name, value]) => ({ name: name.toUpperCase(), value }));

      return {
        totalCampaigns: allCampaigns.length,
        activeCampaigns: allCampaigns.filter(c => c.status === "active").length,
        totalBudget,
        totalSpent,
        totalImpressions,
        totalClicks,
        ctr,
        roi,
        statusDist,
        dailyPerf,
        billingDist,
      };
    },
    refetchInterval: 60000,
  });

  if (isLoading) return <Skeleton className="h-52 w-full rounded-xl" />;
  if (!data) return null;

  const budgetUsage = data.totalBudget > 0 ? Math.round((data.totalSpent / data.totalBudget) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          { icon: Megaphone, label: isAr ? "حملات نشطة" : "Active", value: data.activeCampaigns, color: "text-primary", bg: "bg-primary/10" },
          { icon: Eye, label: isAr ? "مشاهدات" : "Impressions", value: data.totalImpressions > 1000 ? `${(data.totalImpressions / 1000).toFixed(1)}K` : data.totalImpressions, color: "text-chart-3", bg: "bg-chart-3/10" },
          { icon: MousePointer, label: isAr ? "نقرات" : "Clicks", value: data.totalClicks, color: "text-chart-4", bg: "bg-chart-4/10" },
          { icon: Target, label: "CTR", value: `${data.ctr}%`, color: "text-chart-5", bg: "bg-chart-5/10" },
          { icon: DollarSign, label: isAr ? "إنفاق" : "Spent", value: `${(data.totalSpent / 1000).toFixed(1)}K`, color: "text-destructive", bg: "bg-destructive/10" },
          { icon: TrendingUp, label: "ROI", value: `${data.roi}%`, color: "text-primary", bg: "bg-primary/10" },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-3 flex items-center gap-2">
              <div className={`rounded-full p-1.5 ${kpi.bg}`}><kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} /></div>
              <div className="min-w-0">
                <p className="text-[9px] text-muted-foreground truncate">{kpi.label}</p>
                <p className="text-base font-bold">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Daily Performance */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isAr ? "الأداء اليومي (7 أيام)" : "Daily Performance (7 Days)"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data.dailyPerf}>
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} width={28} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="impressions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name={isAr ? "مشاهدات" : "Impressions"} />
                <Bar dataKey="clicks" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} name={isAr ? "نقرات" : "Clicks"} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Right side */}
        <div className="space-y-4">
          {/* Budget Usage */}
          <Card>
            <CardContent className="p-3 space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground">{isAr ? "استهلاك الميزانية" : "Budget Usage"}</p>
              <Progress value={budgetUsage} className="h-2" />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{isAr ? "مصروف" : "Spent"}: {data.totalSpent.toLocaleString()}</span>
                <span>{isAr ? "ميزانية" : "Budget"}: {data.totalBudget.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] font-semibold text-muted-foreground mb-2">{isAr ? "حالات الحملات" : "Campaign Status"}</p>
              <div className="flex items-center gap-3">
                <PieChart width={60} height={60}>
                  <Pie data={data.statusDist} dataKey="value" cx={28} cy={28} innerRadius={16} outerRadius={28} strokeWidth={0}>
                    {data.statusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
                <div className="text-[10px] space-y-1">
                  {data.statusDist.slice(0, 4).map((s, i) => (
                    <div key={s.name} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="capitalize">{s.name}</span>: <strong>{s.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing Model */}
          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] font-semibold text-muted-foreground mb-2">{isAr ? "نموذج الفوترة" : "Billing Model"}</p>
              <div className="space-y-1">
                {data.billingDist.map(b => (
                  <div key={b.name} className="flex items-center justify-between text-[10px]">
                    <span>{b.name}</span>
                    <Badge variant="outline" className="text-[9px] h-4">{b.value}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
