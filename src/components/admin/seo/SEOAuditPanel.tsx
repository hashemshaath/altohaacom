import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Shield, Play, Loader2, CheckCircle2, AlertTriangle, Info,
  ChevronDown, ChevronUp, Clock, FileSearch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const SEVERITY_CONFIG = {
  error: { icon: AlertTriangle, class: "text-destructive bg-destructive/10 border-destructive/20", label: "Error", labelAr: "خطأ" },
  warning: { icon: AlertTriangle, class: "text-amber-600 bg-amber-500/10 border-amber-500/20", label: "Warning", labelAr: "تحذير" },
  info: { icon: Info, class: "text-blue-600 bg-blue-500/10 border-blue-500/20", label: "Info", labelAr: "معلومة" },
};

export function SEOAuditPanel() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const qc = useQueryClient();
  const [expandedAudit, setExpandedAudit] = useState<string | null>(null);

  const { data: audits = [], isLoading } = useQuery({
    queryKey: ["seo-audits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seo_audits")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const { data: issues = [] } = useQuery({
    queryKey: ["seo-audit-issues", expandedAudit],
    queryFn: async () => {
      if (!expandedAudit) return [];
      const { data, error } = await supabase
        .from("seo_audit_issues")
        .select("*")
        .eq("audit_id", expandedAudit)
        .order("severity", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!expandedAudit,
  });

  const runAudit = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("seo-audit", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["seo-audits"] });
      toast.success(isAr ? "اكتمل التدقيق" : "Audit completed", {
        description: isAr
          ? `النتيجة: ${data.score}/100 — ${data.total_issues} مشكلة`
          : `Score: ${data.score}/100 — ${data.total_issues} issues found`,
      });
    },
    onError: (e: Error) => {
      toast.error(isAr ? "فشل التدقيق" : "Audit failed", { description: e instanceof Error ? e.message : String(e) });
    },
  });

  const latestAudit = audits[0];
  const score = latestAudit?.score;

  return (
    <div className="space-y-4">
      {/* Run Audit Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <FileSearch className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                {isAr ? "تدقيق SEO تلقائي" : "Automated SEO Audit"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isAr
                  ? "يفحص 30+ صفحة: العناوين، الوصف، الصور، OG، الكانونيكال والمزيد"
                  : "Scans 30+ pages: titles, descriptions, images, OG tags, canonical & more"}
              </p>
            </div>
          </div>
          <Button
            onClick={() => runAudit.mutate()}
            disabled={runAudit.isPending}
            size="sm"
            className="gap-1.5 shrink-0"
          >
            {runAudit.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {runAudit.isPending
              ? (isAr ? "جارٍ الفحص..." : "Auditing...")
              : (isAr ? "بدء التدقيق" : "Run Audit")}
          </Button>
        </CardContent>
      </Card>

      {/* Latest Score */}
      {latestAudit && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold",
                    score != null && score >= 80
                      ? "bg-emerald-500/10 text-emerald-600"
                      : score != null && score >= 50
                      ? "bg-amber-500/10 text-amber-600"
                      : "bg-destructive/10 text-destructive"
                  )}
                >
                  {score ?? "—"}
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {isAr ? "آخر نتيجة تدقيق" : "Latest Audit Score"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {latestAudit.completed_at
                      ? format(new Date(latestAudit.completed_at), "MMM d, yyyy HH:mm")
                      : isAr ? "قيد التشغيل..." : "Running..."}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 text-xs">
                {latestAudit.summary && (
                  <>
                    <Badge variant="destructive" className="text-[12px]">
                      {(latestAudit.summary as any).errors || 0} {isAr ? "أخطاء" : "errors"}
                    </Badge>
                    <Badge className="text-[12px] bg-amber-500/10 text-amber-700 border-amber-500/20">
                      {(latestAudit.summary as any).warnings || 0} {isAr ? "تحذيرات" : "warnings"}
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            {isAr ? "سجل التدقيق" : "Audit History"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 divide-y divide-border/40">
          {isLoading && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              {isAr ? "جارٍ التحميل..." : "Loading..."}
            </p>
          )}
          {!isLoading && audits.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              {isAr ? "لم يتم إجراء أي تدقيق بعد" : "No audits run yet"}
            </p>
          )}
          {audits.map((audit) => {
            const isExpanded = expandedAudit === audit.id;
            const summary = audit.summary as Record<string, unknown> | null;
            return (
              <div key={audit.id}>
                <button
                  className="w-full flex items-center justify-between py-3 px-1 text-start hover:bg-muted/30 transition-colors rounded"
                  onClick={() => setExpandedAudit(isExpanded ? null : audit.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                        audit.score >= 80
                          ? "bg-emerald-500/10 text-emerald-600"
                          : audit.score >= 50
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-destructive/10 text-destructive"
                      )}
                    >
                      {audit.score ?? "—"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium">
                        {audit.completed_at ? format(new Date(audit.completed_at), "MMM d, yyyy HH:mm") : "Running..."}
                      </p>
                      <p className="text-[12px] text-muted-foreground">
                        {summary?.pages_audited || 0} {isAr ? "صفحة" : "pages"} · {audit.issues_found || 0} {isAr ? "مشكلة" : "issues"}
                      </p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>

                {isExpanded && (
                  <div className="pb-3 px-1 space-y-2">
                    {issues.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        {isAr ? "لا توجد مشاكل! 🎉" : "No issues found! 🎉"}
                      </p>
                    )}
                    {issues.map((issue) => {
                      const cfg = SEVERITY_CONFIG[issue.severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.info;
                      const Icon = cfg.icon;
                      return (
                        <div
                          key={issue.id}
                          className={cn("flex items-start gap-2.5 rounded-xl border p-2.5", cfg.class)}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <code className="text-[12px] font-mono bg-background/50 px-1.5 py-0.5 rounded">
                                {issue.page_path}
                              </code>
                              <Badge variant="outline" className="text-[12px] h-4">
                                {issue.issue_type.replace(/_/g, " ")}
                              </Badge>
                            </div>
                            <p className="text-xs mt-0.5">
                              {isAr ? issue.message_ar : issue.message}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
