import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, FileCheck, Send, Clock, ShieldCheck, Download, PenTool } from "lucide-react";

export const CertificateIssuanceWidget = memo(function CertificateIssuanceWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["certificate-issuance-widget"],
    queryFn: async () => {
      const [{ data: certs }, { count: templateCount }, { count: verificationCount }] = await Promise.all([
        supabase.from("certificates").select("status, type, downloaded_count, sent_at").limit(500),
        supabase.from("certificate_templates").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("certificate_verifications").select("*", { count: "exact", head: true }),
      ]);

      const total = certs?.length || 0;
      const draft = certs?.filter(c => c.status === "draft").length || 0;
      const signed = certs?.filter(c => c.status === "signed").length || 0;
      const issued = certs?.filter(c => c.status === "issued").length || 0;
      const sent = certs?.filter(c => c.sent_at).length || 0;
      const totalDownloads = certs?.reduce((s, c) => s + (c.downloaded_count || 0), 0) || 0;

      // Type distribution
      const typeCounts: Record<string, number> = {};
      certs?.forEach(c => { typeCounts[c.type] = (typeCounts[c.type] || 0) + 1; });

      const issuanceRate = total > 0 ? Math.round((issued / total) * 100) : 0;

      return {
        total, draft, signed, issued, sent, totalDownloads,
        templateCount: templateCount || 0,
        verificationCount: verificationCount || 0,
        typeCounts, issuanceRate,
      };
    },
    staleTime: 60000,
  });

  if (!data) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="h-4 w-4 text-chart-4" />
            {isAr ? "إصدار الشهادات" : "Certificate Issuance"}
          </CardTitle>
          <Badge variant="outline" className="text-[9px]">{data.templateCount} {isAr ? "قالب" : "templates"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { icon: FileCheck, label: isAr ? "الإجمالي" : "Total", value: data.total, color: "text-chart-1" },
            { icon: PenTool, label: isAr ? "موقّعة" : "Signed", value: data.signed, color: "text-chart-2" },
            { icon: Send, label: isAr ? "مُرسلة" : "Sent", value: data.sent, color: "text-chart-3" },
            { icon: Download, label: isAr ? "التحميلات" : "Downloads", value: data.totalDownloads, color: "text-primary" },
          ].map((m, i) => (
            <div key={i} className="p-2 rounded-xl bg-muted/30 border border-border/40">
              <div className="flex items-center gap-1.5 mb-1">
                <m.icon className={`h-3 w-3 ${m.color}`} />
                <span className="text-[9px] text-muted-foreground">{m.label}</span>
              </div>
              <p className="text-base font-bold">{m.value}</p>
            </div>
          ))}
        </div>

        {/* Issuance rate */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">{isAr ? "معدل الإصدار" : "Issuance Rate"}</span>
            <span className="text-[10px] font-medium">{data.issuanceRate}%</span>
          </div>
          <Progress value={data.issuanceRate} className="h-1.5" />
        </div>

        {/* Status pipeline */}
        <div className="flex flex-wrap gap-2 text-[10px]">
          <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> {data.draft} {isAr ? "مسودة" : "draft"}</span>
          <span className="flex items-center gap-1 text-chart-2"><PenTool className="h-3 w-3" /> {data.signed} {isAr ? "موقّعة" : "signed"}</span>
          <span className="flex items-center gap-1 text-chart-3"><FileCheck className="h-3 w-3" /> {data.issued} {isAr ? "مُصدرة" : "issued"}</span>
          <span className="flex items-center gap-1 text-primary"><ShieldCheck className="h-3 w-3" /> {data.verificationCount} {isAr ? "تحقق" : "verifications"}</span>
        </div>

        {/* Type badges */}
        <div className="flex flex-wrap gap-1">
          {Object.entries(data.typeCounts).map(([type, count]) => (
            <Badge key={type} variant="outline" className="text-[8px] gap-0.5">
              {type}: {count}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
