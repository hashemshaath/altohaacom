import { useIsAr } from "@/hooks/useIsAr";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CheckCircle, XCircle, ChevronDown, ChevronUp, AlertTriangle, Flag, MessageCircle } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminCommentModeration } from "@/components/admin/AdminCommentModeration";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";

interface Report {
  id: string;
  reporter_id: string;
  content_type: string;
  content_id: string;
  reason: string;
  status: string;
  created_at: string;
  resolution_notes: string | null;
}

export default function ContentModeration() {
  const { t, language } = useLanguage();
  const isAr = useIsAr();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("reports");
  const [reportSearch, setReportSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: reports, isLoading } = useQuery({
    queryKey: ["contentReports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_reports")
        .select("id, reporter_id, content_type, content_id, reason, status, resolution_notes, resolved_by, resolved_at, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Report[];
    },
  });

  const resolveReportMutation = useMutation({
    mutationFn: async ({ reportId, status, notes }: { reportId: string; status: string; notes: string }) => {
      const { error } = await supabase
        .from("content_reports")
        .update({
          status,
          resolution_notes: notes,
          resolved_by: user!.id,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      if (error) throw error;

      // Log admin action
      await supabase.from("admin_actions").insert({
        admin_id: user!.id,
        action_type: "resolve_report",
        details: { report_id: reportId, status, notes },
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contentReports"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      toast({ title: language === "ar" ? "تم معالجة البلاغ" : "Report resolved" });

      // Notify the reporter
      const report = reports?.find(r => r.id === variables.reportId);
      if (report?.reporter_id) {
        import("@/lib/notificationTriggers").then(({ notifyReportResolved }) => {
          notifyReportResolved({ userId: report.reporter_id, status: variables.status });
        }).then(null, () => {});
      }

      setExpandedReportId(null);
      setResolutionNotes(prev => {
        const updated = { ...prev };
        delete updated[variables.reportId];
        return updated;
      });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive"; label: string; labelAr: string }> = {
      pending: { variant: "secondary", label: "Pending", labelAr: "معلق" },
      resolved: { variant: "default", label: "Resolved", labelAr: "تم الحل" },
      dismissed: { variant: "destructive", label: "Dismissed", labelAr: "مرفوض" },
    };
    const cfg = config[status] || config.pending;
    return <Badge variant={cfg.variant}>{language === "ar" ? cfg.labelAr : cfg.label}</Badge>;
  };

  const bulk = useAdminBulkActions(reports || []);

  const { exportCSV } = useCSVExport({
    columns: [
      { header: isAr ? "النوع" : "Content Type", accessor: (r: Report) => r.content_type },
      { header: isAr ? "السبب" : "Reason", accessor: (r: Report) => r.reason },
      { header: isAr ? "الحالة" : "Status", accessor: (r: Report) => r.status },
      { header: isAr ? "التاريخ" : "Date", accessor: (r: Report) => r.created_at?.slice(0, 10) || "" },
      { header: isAr ? "ملاحظات" : "Notes", accessor: (r: Report) => r.resolution_notes || "" },
    ],
    filename: "content-reports",
  });

  const bulkDismiss = async () => {
    const ids = [...bulk.selected];
    for (const id of ids) {
      await resolveReportMutation.mutateAsync({ reportId: id, status: "dismissed", notes: "Bulk dismissed" });
    }
    bulk.clearSelection();
  };

  const pendingCount = reports?.filter(r => r.status === "pending").length || 0;

  const filteredReports = useMemo(() => {
    const q = reportSearch.toLowerCase().trim();
    return (reports || []).filter(r => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (q) {
        const text = `${r.content_type} ${r.reason} ${r.resolution_notes || ""}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [reports, reportSearch, statusFilter]);

  const toggleExpand = (reportId: string) => {
    setExpandedReportId(expandedReportId === reportId ? null : reportId);
  };

  const handleResolve = (reportId: string, status: "resolved" | "dismissed") => {
    resolveReportMutation.mutate({
      reportId,
      status,
      notes: resolutionNotes[reportId] || "",
    });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Flag}
        title={t("contentModeration")}
        description={language === "ar" ? "مراجعة البلاغات المقدمة" : "Review submitted reports"}
        actions={
          pendingCount > 0 ? (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {pendingCount} {language === "ar" ? "معلق" : "pending"}
            </Badge>
          ) : undefined
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 rounded-2xl border border-border/40 bg-muted/30 backdrop-blur p-1.5 h-auto">
          <TabsTrigger value="reports" className="gap-1.5 rounded-xl data-[state=active]:shadow-sm"><Flag className="h-3.5 w-3.5" />{isAr ? "البلاغات" : "Reports"}</TabsTrigger>
          <TabsTrigger value="comments" className="gap-1.5 rounded-xl data-[state=active]:shadow-sm"><MessageCircle className="h-3.5 w-3.5" />{isAr ? "التعليقات" : "Comments"}</TabsTrigger>
        </TabsList>

        <TabsContent value="comments">
          <AdminCommentModeration />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
      <AdminFilterBar
        searchValue={reportSearch}
        onSearchChange={setReportSearch}
        searchPlaceholder={isAr ? "بحث في البلاغات..." : "Search reports..."}
      >
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "الكل" : "All Status"}</SelectItem>
            <SelectItem value="pending">{isAr ? "معلق" : "Pending"}</SelectItem>
            <SelectItem value="resolved">{isAr ? "تم الحل" : "Resolved"}</SelectItem>
            <SelectItem value="dismissed">{isAr ? "مرفوض" : "Dismissed"}</SelectItem>
          </SelectContent>
        </Select>
      </AdminFilterBar>

      <BulkActionBar
        count={bulk.count}
        onClear={bulk.clearSelection}
        onExport={() => exportCSV(bulk.selectedItems)}
        onDelete={bulkDismiss}
      />

      <Card className="rounded-2xl border-border/40">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("reports")}</CardTitle>
              <CardDescription>
                {language === "ar" 
                  ? "انقر على أي بلاغ لعرض التفاصيل واتخاذ إجراء" 
                  : "Click on any report to view details and take action"}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">{filteredReports.length}/{reports?.length || 0}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <AdminTableSkeleton rows={4} columns={4} showActions={false} />
          ) : reports?.length === 0 ? (
            <AdminEmptyState
              icon={CheckCircle}
              title="No reports found"
              titleAr="لا توجد بلاغات"
              description="All clear! No content reports to review."
              descriptionAr="كل شيء واضح! لا توجد بلاغات للمراجعة."
            />
          ) : filteredReports.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">{isAr ? "لا توجد نتائج" : "No results found"}</p>
          ) : (
            <div className="space-y-2">
              {filteredReports.map((report) => (
                <div 
                  key={report.id} 
                  className={`rounded-xl border transition-all duration-200 ${
                    report.status === "pending" 
                      ? "border-chart-4/30 bg-chart-4/5" 
                      : "border-border/40"
                  } ${bulk.isSelected(report.id) ? "ring-1 ring-primary/30" : ""}`}
                >
                  {/* Report Row Header */}
                  <div 
                    className="flex cursor-pointer items-center justify-between p-4"
                    onClick={() => toggleExpand(report.id)}
                  >
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={bulk.isSelected(report.id)}
                        onCheckedChange={() => bulk.toggleOne(report.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Badge variant="outline">{report.content_type}</Badge>
                      <span className="text-sm max-w-md truncate">{report.reason}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(report.created_at), "MMM d, yyyy")}
                      </span>
                      {getStatusBadge(report.status)}
                      {expandedReportId === report.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedReportId === report.id && (
                    <div className="border-t p-4 space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label className="text-muted-foreground">{language === "ar" ? "نوع المحتوى" : "Content Type"}</Label>
                          <p className="font-medium">{report.content_type}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">{language === "ar" ? "معرف المحتوى" : "Content ID"}</Label>
                          <p className="font-mono text-sm">{report.content_id}</p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-muted-foreground">{t("reason")}</Label>
                        <p className="mt-1 rounded-xl bg-muted p-3 text-sm">{report.reason}</p>
                      </div>

                      {report.status === "pending" ? (
                        <div className="space-y-4">
                          <div>
                            <Label>{language === "ar" ? "ملاحظات القرار" : "Resolution Notes"}</Label>
                            <Textarea
                              className="mt-2"
                              value={resolutionNotes[report.id] || ""}
                              onChange={(e) => setResolutionNotes(prev => ({
                                ...prev,
                                [report.id]: e.target.value
                              }))}
                              placeholder={language === "ar" ? "أضف ملاحظات حول قرارك..." : "Add notes about your decision..."}
                              rows={3}
                            />
                          </div>

                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              onClick={() => handleResolve(report.id, "dismissed")}
                              disabled={resolveReportMutation.isPending}
                            >
                              <XCircle className="me-2 h-4 w-4" />
                              {language === "ar" ? "رفض" : "Dismiss"}
                            </Button>
                            <Button
                              onClick={() => handleResolve(report.id, "resolved")}
                              disabled={resolveReportMutation.isPending}
                            >
                              <CheckCircle className="me-2 h-4 w-4" />
                              {language === "ar" ? "حل" : "Resolve"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        report.resolution_notes && (
                          <div>
                            <Label className="text-muted-foreground">{language === "ar" ? "ملاحظات القرار" : "Resolution Notes"}</Label>
                            <p className="mt-1 rounded-xl bg-muted p-3 text-sm">{report.resolution_notes}</p>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
