import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVisibleRefetchInterval } from "@/hooks/useVisibleRefetchInterval";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, FileText, Send, CheckCircle, Clock, Users, LayoutTemplate, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, subDays } from "date-fns";
import { AnimatedCounter } from "@/components/ui/animated-counter";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export const CertificatesLiveWidget = memo(function CertificatesLiveWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["certificatesLiveStats"],
    queryFn: async () => {
      const [certsRes, templatesRes, verificationsRes] = await Promise.all([
        supabase.from("certificates").select("id, type, status, created_at, issued_at, sent_at, downloaded_count, template_id"),
        supabase.from("certificate_templates").select("id, name, name_ar, type, is_active"),
        supabase.from("certificate_verifications").select("id, verified_at").order("verified_at", { ascending: false }).limit(200),
      ]);

      const certs = certsRes.data || [];
      const templates = templatesRes.data || [];
      const verifications = verificationsRes.data || [];

      // Status distribution
      const statusMap: Record<string, number> = {};
      certs.forEach(c => { statusMap[c.status || "draft"] = (statusMap[c.status || "draft"] || 0) + 1; });
      const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

      // Type distribution
      const typeMap: Record<string, number> = {};
      certs.forEach(c => { typeMap[c.type || "participation"] = (typeMap[c.type || "participation"] || 0) + 1; });
      const typeData = Object.entries(typeMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

      // 14-day issuance trend
      const trend: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) {
        trend[format(subDays(new Date(), i), "MM/dd")] = 0;
      }
      certs.forEach(c => {
        const d = format(new Date(c.created_at || ""), "MM/dd");
        if (d in trend) trend[d]++;
      });
      const trendData = Object.entries(trend).map(([date, count]) => ({ date, count }));

      const totalCerts = certs.length;
      const issued = certs.filter(c => c.status === "issued").length;
      const sent = certs.filter(c => c.sent_at).length;
      const downloaded = certs.reduce((s, c) => s + (c.downloaded_count || 0), 0);
      const activeTemplates = templates.filter(t => t.is_active).length;

      return {
        totalCerts,
        issued,
        sent,
        downloaded,
        activeTemplates,
        totalTemplates: templates.length,
        totalVerifications: verifications.length,
        statusData,
        typeData,
        trendData,
        issuanceRate: totalCerts > 0 ? Math.round((issued / totalCerts) * 100) : 0,
      };
    },
    refetchInterval: useVisibleRefetchInterval(60000),
  });

  if (!data) return null;

  const stats = [
    { label: isAr ? "الشهادات" : "Certificates", value: data.totalCerts, icon: Award, color: "text-primary" },
    { label: isAr ? "صادرة" : "Issued", value: data.issued, icon: CheckCircle, color: "text-chart-2" },
    { label: isAr ? "مُرسلة" : "Sent", value: data.sent, icon: Send, color: "text-chart-3" },
    { label: isAr ? "التحققات" : "Verifications", value: data.totalVerifications, icon: FileText, color: "text-chart-4" },
  ];

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          {isAr ? "إحصائيات الشهادات المباشرة" : "Certificates Live Stats"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-muted/50 rounded-xl p-3 text-center">
              <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.color}`} />
              <div className="text-lg font-bold"><AnimatedCounter value={typeof s.value === "number" ? s.value : 0} /></div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Issuance Trend */}
          <div className="md:col-span-2">
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              {isAr ? "إصدار الشهادات - 14 يوم" : "Certificate Issuance - 14 Days"}
            </p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={data.trendData}>
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} name={isAr ? "شهادات" : "Certificates"} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Type Distribution */}
          <div>
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              {isAr ? "توزيع الأنواع" : "Type Distribution"}
            </p>
            {data.typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={data.typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} innerRadius={25}>
                    {data.typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[140px] flex items-center justify-center text-xs text-muted-foreground">
                {isAr ? "لا توجد بيانات" : "No data"}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-muted/50 rounded-xl p-2 text-center">
            <LayoutTemplate className="h-3 w-3 mx-auto mb-1 text-chart-2" />
            <div className="text-sm font-bold">{data.activeTemplates}/{data.totalTemplates}</div>
            <div className="text-[9px] text-muted-foreground">{isAr ? "قوالب نشطة" : "Active Templates"}</div>
          </div>
          <div className="bg-muted/50 rounded-xl p-2 text-center">
            <TrendingUp className="h-3 w-3 mx-auto mb-1 text-chart-3" />
            <div className="text-sm font-bold">{data.issuanceRate}%</div>
            <div className="text-[9px] text-muted-foreground">{isAr ? "معدل الإصدار" : "Issuance Rate"}</div>
          </div>
          <div className="bg-muted/50 rounded-xl p-2 text-center">
            <Users className="h-3 w-3 mx-auto mb-1 text-chart-4" />
            <div className="text-sm font-bold">{data.downloaded}</div>
            <div className="text-[9px] text-muted-foreground">{isAr ? "التحميلات" : "Downloads"}</div>
          </div>
        </div>

        {/* Status Pipeline */}
        {data.statusData.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              {isAr ? "خط سير الشهادات" : "Certificate Pipeline"}
            </p>
            <div className="flex gap-2 flex-wrap">
              {data.statusData.map((s, i) => (
                <Badge key={i} variant="outline" className="gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {s.name}: {s.value}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
