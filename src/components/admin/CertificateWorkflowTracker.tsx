import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Award, FileText, PenTool, Send, CheckCircle, XCircle } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export function CertificateWorkflowTracker() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: workflow } = useQuery({
    queryKey: ["cert-workflow-tracker"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificates")
        .select("status, type");
      if (error) throw error;

      const statuses = { draft: 0, pending_signature: 0, signed: 0, issued: 0, revoked: 0 };
      const types: Record<string, number> = {};

      (data || []).forEach((c: any) => {
        if (c.status in statuses) statuses[c.status as keyof typeof statuses]++;
        types[c.type] = (types[c.type] || 0) + 1;
      });

      const total = data?.length || 0;
      return { statuses, types, total };
    },
    staleTime: 1000 * 60 * 3,
  });

  const steps = [
    { key: "draft", icon: FileText, label: isAr ? "مسودة" : "Draft", color: "text-muted-foreground" },
    { key: "pending_signature", icon: PenTool, label: isAr ? "بانتظار التوقيع" : "Pending", color: "text-chart-4" },
    { key: "signed", icon: CheckCircle, label: isAr ? "معتمدة" : "Signed", color: "text-primary" },
    { key: "issued", icon: Send, label: isAr ? "صادرة" : "Issued", color: "text-chart-2" },
    { key: "revoked", icon: XCircle, label: isAr ? "ملغاة" : "Revoked", color: "text-destructive" },
  ];

  const total = workflow?.total || 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          {isAr ? "مسار الشهادات" : "Certificate Pipeline"}
          <Badge variant="secondary" className="text-[10px]">{total}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-2">
          {steps.map((step) => {
            const count = workflow?.statuses?.[step.key as keyof typeof workflow.statuses] || 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;

            return (
              <div key={step.key} className="text-center space-y-1">
                <step.icon className={`h-5 w-5 mx-auto ${step.color}`} />
                <AnimatedCounter value={count} className="text-lg" />
                <p className="text-[10px] text-muted-foreground">{step.label}</p>
                <Progress value={pct} className="h-1" />
                <p className="text-[9px] text-muted-foreground">{pct}%</p>
              </div>
            );
          })}
        </div>

        {workflow?.types && Object.keys(workflow.types).length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <p className="text-[10px] text-muted-foreground mb-2">{isAr ? "حسب النوع" : "By Type"}</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(workflow.types)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([type, count]) => (
                  <Badge key={type} variant="outline" className="text-[10px] gap-1">
                    {type} <span className="font-mono font-bold">{count as number}</span>
                  </Badge>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
