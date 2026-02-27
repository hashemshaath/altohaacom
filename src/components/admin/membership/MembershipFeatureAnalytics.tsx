import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, Eye, ShieldX, Zap, Star, Crown } from "lucide-react";
import { useState, useMemo } from "react";
import { format, subDays } from "date-fns";

const TIER_COLORS: Record<string, string> = {
  basic: "hsl(var(--muted-foreground))",
  professional: "hsl(var(--primary))",
  enterprise: "hsl(var(--chart-2))",
};

const TIER_LABELS: Record<string, { en: string; ar: string }> = {
  basic: { en: "Basic", ar: "الأساسي" },
  professional: { en: "Professional", ar: "الاحترافي" },
  enterprise: { en: "Enterprise", ar: "المؤسسي" },
};

export default function MembershipFeatureAnalytics() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [days, setDays] = useState("30");

  const startDate = useMemo(() => format(subDays(new Date(), parseInt(days)), "yyyy-MM-dd"), [days]);

  const { data: usageData, isLoading } = useQuery({
    queryKey: ["feature-usage-analytics", startDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_feature_usage" as any)
        .select("*, membership_features!inner(name, name_ar, code, category)")
        .gte("usage_date", startDate)
        .order("access_count", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  // Aggregate by feature
  const featureAgg = useMemo(() => {
    if (!usageData) return [];
    const map = new Map<string, { name: string; nameAr: string; code: string; category: string; total: number; blocked: number; byTier: Record<string, number> }>();
    for (const row of usageData) {
      const feat = row.membership_features;
      if (!map.has(feat.code)) {
        map.set(feat.code, { name: feat.name, nameAr: feat.name_ar || feat.name, code: feat.code, category: feat.category, total: 0, blocked: 0, byTier: {} });
      }
      const agg = map.get(feat.code)!;
      agg.total += row.access_count;
      agg.blocked += row.blocked_count;
      agg.byTier[row.tier] = (agg.byTier[row.tier] || 0) + row.access_count;
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [usageData]);

  // Aggregate by tier
  const tierAgg = useMemo(() => {
    if (!usageData) return [];
    const map = new Map<string, number>();
    for (const row of usageData) {
      map.set(row.tier, (map.get(row.tier) || 0) + row.access_count);
    }
    return Array.from(map.entries()).map(([tier, value]) => ({
      name: TIER_LABELS[tier]?.[isAr ? "ar" : "en"] || tier,
      value,
      tier,
    }));
  }, [usageData, isAr]);

  // Top chart data (top 10 features)
  const barData = useMemo(() => {
    return featureAgg.slice(0, 10).map((f) => ({
      name: isAr ? f.nameAr : f.name,
      basic: f.byTier.basic || 0,
      professional: f.byTier.professional || 0,
      enterprise: f.byTier.enterprise || 0,
    }));
  }, [featureAgg, isAr]);

  const totalAccess = featureAgg.reduce((s, f) => s + f.total, 0);
  const totalBlocked = featureAgg.reduce((s, f) => s + f.blocked, 0);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">{isAr ? "تحليلات استخدام المميزات" : "Feature Usage Analytics"}</h3>
          <p className="text-sm text-muted-foreground">{isAr ? "تتبع استخدام المميزات حسب مستوى العضوية" : "Track feature access patterns by membership tier"}</p>
        </div>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">{isAr ? "٧ أيام" : "7 days"}</SelectItem>
            <SelectItem value="30">{isAr ? "٣٠ يوم" : "30 days"}</SelectItem>
            <SelectItem value="90">{isAr ? "٩٠ يوم" : "90 days"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">{isAr ? "إجمالي الوصول" : "Total Access"}</span>
            </div>
            <p className="text-2xl font-bold">{totalAccess.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldX className="h-4 w-4 text-destructive" />
              <span className="text-xs font-medium text-muted-foreground">{isAr ? "محظور" : "Blocked"}</span>
            </div>
            <p className="text-2xl font-bold">{totalBlocked.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-chart-3" />
              <span className="text-xs font-medium text-muted-foreground">{isAr ? "مميزات نشطة" : "Active Features"}</span>
            </div>
            <p className="text-2xl font-bold">{featureAgg.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-chart-2" />
              <span className="text-xs font-medium text-muted-foreground">{isAr ? "معدل الحظر" : "Block Rate"}</span>
            </div>
            <p className="text-2xl font-bold">
              {totalAccess > 0 ? ((totalBlocked / totalAccess) * 100).toFixed(1) : "0"}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Bar Chart - Top Features */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isAr ? "أكثر المميزات استخداماً" : "Most Used Features"}</CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="basic" stackId="a" fill={TIER_COLORS.basic} name={TIER_LABELS.basic[isAr ? "ar" : "en"]} />
                  <Bar dataKey="professional" stackId="a" fill={TIER_COLORS.professional} name={TIER_LABELS.professional[isAr ? "ar" : "en"]} />
                  <Bar dataKey="enterprise" stackId="a" fill={TIER_COLORS.enterprise} name={TIER_LABELS.enterprise[isAr ? "ar" : "en"]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                {isAr ? "لا توجد بيانات بعد" : "No data yet"}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart - Usage by Tier */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isAr ? "التوزيع حسب الباقة" : "Usage by Tier"}</CardTitle>
          </CardHeader>
          <CardContent>
            {tierAgg.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={tierAgg} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {tierAgg.map((entry) => (
                      <Cell key={entry.tier} fill={TIER_COLORS[entry.tier] || "hsl(var(--muted))"} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                {isAr ? "لا توجد بيانات بعد" : "No data yet"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{isAr ? "تفاصيل المميزات" : "Feature Details"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-start py-2.5 pe-4 font-medium text-muted-foreground">{isAr ? "الميزة" : "Feature"}</th>
                  <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">
                    <div className="flex items-center justify-center gap-1"><Zap className="h-3 w-3" />{isAr ? "أساسي" : "Basic"}</div>
                  </th>
                  <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">
                    <div className="flex items-center justify-center gap-1"><Star className="h-3 w-3" />{isAr ? "احترافي" : "Pro"}</div>
                  </th>
                  <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">
                    <div className="flex items-center justify-center gap-1"><Crown className="h-3 w-3" />{isAr ? "مؤسسي" : "Ent"}</div>
                  </th>
                  <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">{isAr ? "الإجمالي" : "Total"}</th>
                  <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">{isAr ? "محظور" : "Blocked"}</th>
                </tr>
              </thead>
              <tbody>
                {featureAgg.map((f) => (
                  <tr key={f.code} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 pe-4">
                      <div>
                        <p className="font-medium">{isAr ? f.nameAr : f.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">{f.category}</Badge>
                          <span className="text-[10px] text-muted-foreground">{f.code}</span>
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-2.5 px-3 tabular-nums">{(f.byTier.basic || 0).toLocaleString()}</td>
                    <td className="text-center py-2.5 px-3 tabular-nums">{(f.byTier.professional || 0).toLocaleString()}</td>
                    <td className="text-center py-2.5 px-3 tabular-nums">{(f.byTier.enterprise || 0).toLocaleString()}</td>
                    <td className="text-center py-2.5 px-3 tabular-nums font-semibold">{f.total.toLocaleString()}</td>
                    <td className="text-center py-2.5 px-3">
                      {f.blocked > 0 ? (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{f.blocked}</Badge>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {featureAgg.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      {isAr ? "لا توجد بيانات استخدام بعد. سيتم تسجيل البيانات عند وصول المستخدمين للمميزات." : "No usage data yet. Data will be recorded as users access features."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
