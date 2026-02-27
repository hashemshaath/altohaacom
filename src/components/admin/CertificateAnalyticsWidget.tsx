import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell } from "recharts";
import { Award, FileText, CheckCircle, PenTool, Send, ShieldCheck } from "lucide-react";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--destructive))"];

export function CertificateAnalyticsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-certificate-analytics-widget"],
    queryFn: async () => {
      const [certificates, templates, verifications] = await Promise.all([
        supabase.from("certificates").select("id, status, type, issued_at, sent_at, downloaded_count, created_at"),
        supabase.from("certificate_templates").select("id, name, type, is_active"),
        supabase.from("certificate_verifications").select("id, verified_at"),
      ]);

      const allCerts = certificates.data || [];
      const allTemplates = templates.data || [];
      const allVerifications = verifications.data || [];

      // Status breakdown
      const statusMap: Record<string, number> = {};
      allCerts.forEach(c => { statusMap[c.status || "draft"] = (statusMap[c.status || "draft"] || 0) + 1; });
      const statusDist = Object.entries(statusMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

      // Type breakdown
      const typeMap: Record<string, number> = {};
      allCerts.forEach(c => { typeMap[c.type] = (typeMap[c.type] || 0) + 1; });
      const typeDist = Object.entries(typeMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

      // Stats
      const issued = allCerts.filter(c => c.status === "issued").length;
      const sent = allCerts.filter(c => c.sent_at).length;
      const totalDownloads = allCerts.reduce((s, c) => s + (c.downloaded_count || 0), 0);
      const activeTemplates = allTemplates.filter(t => t.is_active).length;

      return {
        total: allCerts.length,
        issued,
        sent,
        totalDownloads,
        totalVerifications: allVerifications.length,
        activeTemplates,
        totalTemplates: allTemplates.length,
        statusDist,
        typeDist,
      };
    },
    refetchInterval: 60000,
  });

  if (isLoading) return <Skeleton className="h-44 w-full rounded-xl" />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          { icon: Award, label: isAr ? "إجمالي" : "Total", value: data.total, color: "text-primary", bg: "bg-primary/10" },
          { icon: CheckCircle, label: isAr ? "صادرة" : "Issued", value: data.issued, color: "text-chart-5", bg: "bg-chart-5/10" },
          { icon: Send, label: isAr ? "مُرسلة" : "Sent", value: data.sent, color: "text-chart-3", bg: "bg-chart-3/10" },
          { icon: FileText, label: isAr ? "تنزيلات" : "Downloads", value: data.totalDownloads, color: "text-chart-4", bg: "bg-chart-4/10" },
          { icon: ShieldCheck, label: isAr ? "تحققات" : "Verifications", value: data.totalVerifications, color: "text-primary", bg: "bg-primary/10" },
          { icon: PenTool, label: isAr ? "قوالب" : "Templates", value: `${data.activeTemplates}/${data.totalTemplates}`, color: "text-chart-3", bg: "bg-chart-3/10" },
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

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Status Distribution */}
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] font-semibold text-muted-foreground mb-2">{isAr ? "حسب الحالة" : "By Status"}</p>
            <div className="flex items-center gap-4">
              <PieChart width={80} height={80}>
                <Pie data={data.statusDist} dataKey="value" cx={38} cy={38} innerRadius={22} outerRadius={36} strokeWidth={0}>
                  {data.statusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
              </PieChart>
              <div className="text-[10px] space-y-1">
                {data.statusDist.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="capitalize">{s.name}</span>: <strong>{s.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Type Distribution */}
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] font-semibold text-muted-foreground mb-2">{isAr ? "حسب النوع" : "By Type"}</p>
            <div className="space-y-1.5">
              {data.typeDist.map(t => (
                <div key={t.name} className="space-y-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="capitalize">{t.name}</span>
                    <span className="text-muted-foreground">{t.value}</span>
                  </div>
                  <Progress value={(t.value / data.total) * 100} className="h-1" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
