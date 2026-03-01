import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Users, Trophy, FileText, TrendingUp, Download, Calendar, DollarSign, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/ui/animated-counter";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function AdvancedReportsDashboard() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [period, setPeriod] = useState("30");

  // Users growth over time
  const { data: userGrowth = [] } = useQuery({
    queryKey: ["report-user-growth", period],
    queryFn: async () => {
      const days = parseInt(period);
      const result = [];
      for (let i = days - 1; i >= 0; i -= Math.max(1, Math.floor(days / 15))) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true }).lte("created_at", dateStr + "T23:59:59Z");
        result.push({ date: d.toLocaleDateString(isAr ? "ar" : "en", { month: "short", day: "numeric" }), users: count || 0 });
      }
      return result;
    },
    staleTime: 600000,
  });

  // Competition stats
  const { data: compStats } = useQuery({
    queryKey: ["report-competition-stats"],
    queryFn: async () => {
      const { data: comps } = await supabase.from("competitions").select("status, country_code");
      const { count: regCount } = await supabase.from("competition_registrations").select("*", { count: "exact", head: true });

      const statusDist = (comps || []).reduce((acc: any, c: any) => {
        acc[c.status || "draft"] = (acc[c.status || "draft"] || 0) + 1;
        return acc;
      }, {});

      const countryDist = (comps || []).reduce((acc: any, c: any) => {
        if (c.country_code) acc[c.country_code] = (acc[c.country_code] || 0) + 1;
        return acc;
      }, {});

      return {
        total: comps?.length || 0,
        registrations: regCount || 0,
        statusDist: Object.entries(statusDist).map(([name, value]) => ({ name, value })),
        countryDist: Object.entries(countryDist).slice(0, 10).map(([name, value]) => ({ name, value })),
      };
    },
    staleTime: 600000,
  });

  // Content stats
  const { data: contentStats } = useQuery({
    queryKey: ["report-content-stats"],
    queryFn: async () => {
      const { data: articles } = await supabase.from("articles").select("type, status, view_count");
      const typeDist = (articles || []).reduce((acc: any, a: any) => {
        acc[a.type || "article"] = (acc[a.type || "article"] || 0) + 1;
        return acc;
      }, {});
      const totalViews = (articles || []).reduce((s, a: any) => s + (a.view_count || 0), 0);
      return {
        total: articles?.length || 0,
        totalViews,
        published: (articles || []).filter((a: any) => a.status === "published").length,
        typeDist: Object.entries(typeDist).map(([name, value]) => ({ name, value })),
      };
    },
    staleTime: 600000,
  });

  const exportCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const bom = "\uFEFF";
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(r => Object.values(r).join(",")).join("\n");
    const blob = new Blob([bom + headers + "\n" + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{isAr ? "التقارير والتحليلات المتقدمة" : "Advanced Reports & Analytics"}</h2>
          <p className="text-sm text-muted-foreground">{isAr ? "نظرة شاملة على أداء المنصة" : "Comprehensive platform performance overview"}</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">{isAr ? "7 أيام" : "7 Days"}</SelectItem>
            <SelectItem value="30">{isAr ? "30 يوم" : "30 Days"}</SelectItem>
            <SelectItem value="90">{isAr ? "90 يوم" : "90 Days"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users" className="gap-1.5"><Users className="h-4 w-4" />{isAr ? "المستخدمون" : "Users"}</TabsTrigger>
          <TabsTrigger value="competitions" className="gap-1.5"><Trophy className="h-4 w-4" />{isAr ? "المسابقات" : "Competitions"}</TabsTrigger>
          <TabsTrigger value="content" className="gap-1.5"><FileText className="h-4 w-4" />{isAr ? "المحتوى" : "Content"}</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportCSV(userGrowth, "user-growth.csv")}>
              <Download className="h-3.5 w-3.5" />{isAr ? "تصدير" : "Export CSV"}
            </Button>
          </div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{isAr ? "نمو المستخدمين" : "User Growth"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={userGrowth}>
                  <defs>
                    <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fill="url(#growthGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitions" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPICard icon={Trophy} label={isAr ? "إجمالي" : "Total"} value={compStats?.total || 0} />
            <KPICard icon={Users} label={isAr ? "التسجيلات" : "Registrations"} value={compStats?.registrations || 0} />
            <KPICard icon={Activity} label={isAr ? "النشطة" : "Active"} value={Number(compStats?.statusDist?.find((d: any) => d.name === "active")?.value) || 0} />
            <KPICard icon={TrendingUp} label={isAr ? "المتوسط" : "Avg/Comp"} value={compStats?.total ? Math.round((compStats?.registrations || 0) / compStats.total) : 0} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{isAr ? "توزيع الحالات" : "Status Distribution"}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={compStats?.statusDist || []} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                      {(compStats?.statusDist || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{isAr ? "حسب الدولة" : "By Country"}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={compStats?.countryDist || []}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPICard icon={FileText} label={isAr ? "إجمالي المقالات" : "Total Articles"} value={contentStats?.total || 0} />
            <KPICard icon={TrendingUp} label={isAr ? "منشورة" : "Published"} value={contentStats?.published || 0} />
            <KPICard icon={Activity} label={isAr ? "المشاهدات" : "Total Views"} value={contentStats?.totalViews || 0} />
            <KPICard icon={Calendar} label={isAr ? "متوسط المشاهدات" : "Avg Views"} value={contentStats?.total ? Math.round((contentStats?.totalViews || 0) / contentStats.total) : 0} />
          </div>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{isAr ? "حسب النوع" : "By Type"}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={contentStats?.typeDist || []} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KPICard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <Icon className="h-4 w-4 text-muted-foreground mb-2" />
        <AnimatedCounter value={value} className="text-2xl" />
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
