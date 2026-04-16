import { useIsAr } from "@/hooks/useIsAr";
import { useState, useMemo } from "react";
import { useAllVerificationRequests, useReviewVerification, useRunAIVerification } from "@/hooks/useVerification";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { VerifiedBadge } from "@/components/verification/VerifiedBadge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { AdminTableCard } from "@/components/admin/AdminTableCard";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { cn } from "@/lib/utils";
import {
  ShieldCheck, Bot, CheckCircle, XCircle, Clock, AlertTriangle,
  Search, Eye, Loader2, Shield, Users, Building, Building2,
  Download, BarChart3, TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip } from "recharts";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline", under_review: "secondary", ai_review: "secondary",
  approved: "default", rejected: "destructive", revoked: "destructive",
};

const statusLabels: Record<string, { en: string; ar: string }> = {
  pending: { en: "Pending", ar: "قيد الانتظار" },
  under_review: { en: "Under Review", ar: "قيد المراجعة" },
  ai_review: { en: "AI Reviewed", ar: "مراجعة AI" },
  approved: { en: "Approved", ar: "معتمد" },
  rejected: { en: "Rejected", ar: "مرفوض" },
  revoked: { en: "Revoked", ar: "ملغى" },
  expired: { en: "Expired", ar: "منتهي" },
};

const entityIcons: Record<string, typeof Users> = {
  user: Users, company: Building, culinary_entity: Building2,
};

export default function VerificationAdmin() {
  const isAr = useIsAr();
  const { data: requests, isLoading } = useAllVerificationRequests();
  const reviewMutation = useReviewVerification();
  const aiMutation = useRunAIVerification();

  const [activeTab, setActiveTab] = useState("requests");
  const [statusTab, setStatusTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [reviewDialog, setReviewDialog] = useState(false);

  const stats = useMemo(() => ({
    pending: requests?.filter(r => r.status === "pending").length || 0,
    ai_review: requests?.filter(r => r.status === "ai_review").length || 0,
    approved: requests?.filter(r => r.status === "approved").length || 0,
    rejected: requests?.filter(r => r.status === "rejected").length || 0,
    total: requests?.length || 0,
    byEntity: (() => {
      const map: Record<string, number> = {};
      requests?.forEach(r => { map[r.entity_type] = (map[r.entity_type] || 0) + 1; });
      return map;
    })(),
  }), [requests]);

  const filtered = useMemo(() => {
    return (requests || []).filter(r => {
      if (statusTab !== "all" && r.status !== statusTab) return false;
      if (search && !r.applicant_name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [requests, statusTab, search]);

  const bulk = useAdminBulkActions(filtered);

  const { exportCSV } = useCSVExport({
    columns: [
      { header: isAr ? "الاسم" : "Applicant", accessor: r => r.applicant_name },
      { header: isAr ? "النوع" : "Entity Type", accessor: r => r.entity_type },
      { header: isAr ? "المستوى" : "Level", accessor: r => r.verification_level },
      { header: isAr ? "الحالة" : "Status", accessor: r => r.status },
      { header: isAr ? "المخاطرة" : "Risk Score", accessor: r => r.ai_risk_score != null ? (r.ai_risk_score * 100).toFixed(0) + "%" : "" },
      { header: isAr ? "التاريخ" : "Date", accessor: r => r.created_at?.slice(0, 10) || "" },
    ],
    filename: "verification-requests",
  });

  const handleAIReview = async (req: any) => {
    const docs = req.documents as any[] || [];
    await aiMutation.mutateAsync({
      request_id: req.id,
      document_url: docs[0]?.url,
      document_type: docs[0]?.type || "other",
      applicant_name: req.applicant_name,
      entity_type: req.entity_type,
      verification_level: req.verification_level,
    });
  };

  const handleReview = (action: "approved" | "rejected") => {
    if (!selectedRequest) return;
    reviewMutation.mutate(
      { request_id: selectedRequest.id, action, notes: reviewNotes, rejection_reason: action === "rejected" ? rejectionReason : undefined },
      { onSuccess: () => { setReviewDialog(false); setSelectedRequest(null); setReviewNotes(""); setRejectionReason(""); } }
    );
  };

  // Chart data
  const statusChartData = useMemo(() => [
    { name: isAr ? "قيد الانتظار" : "Pending", value: stats.pending, fill: "hsl(var(--chart-4))" },
    { name: isAr ? "مراجعة AI" : "AI Review", value: stats.ai_review, fill: "hsl(var(--chart-2))" },
    { name: isAr ? "معتمد" : "Approved", value: stats.approved, fill: "hsl(var(--chart-3))" },
    { name: isAr ? "مرفوض" : "Rejected", value: stats.rejected, fill: "hsl(var(--destructive))" },
  ], [stats, isAr]);

  const entityChartData = useMemo(() =>
    Object.entries(stats.byEntity).map(([key, value]) => ({
      name: key === "user" ? (isAr ? "مستخدم" : "User") : key === "company" ? (isAr ? "شركة" : "Company") : (isAr ? "جهة" : "Entity"),
      value,
    }))
  , [stats.byEntity, isAr]);

  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{isAr ? "مركز التوثيق" : "Verification Center"}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAr ? "مراجعة طلبات التوثيق والتحقق بالذكاء الاصطناعي" : "AI-assisted verification & fraud detection"}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => exportCSV(filtered)}>
          <Download className="h-3.5 w-3.5" />
          {isAr ? "تصدير" : "Export"}
        </Button>
      </div>

      {/* Metric Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: isAr ? "الإجمالي" : "Total", value: stats.total, icon: Shield, key: "all" },
          { label: isAr ? "قيد الانتظار" : "Pending", value: stats.pending, icon: Clock, key: "pending" },
          { label: isAr ? "مراجعة AI" : "AI Review", value: stats.ai_review, icon: Bot, key: "ai_review" },
          { label: isAr ? "معتمد" : "Approved", value: stats.approved, icon: CheckCircle, key: "approved" },
          { label: isAr ? "مرفوض" : "Rejected", value: stats.rejected, icon: XCircle, key: "rejected" },
        ].map(m => (
          <button
            key={m.key}
            onClick={() => setStatusTab(m.key)}
            className={cn(
              "flex items-center gap-3 rounded-lg border border-border/50 bg-card p-3 text-start transition-all hover:border-border hover:shadow-sm",
              statusTab === m.key && "border-primary/50 bg-primary/5"
            )}
          >
            <m.icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-lg font-semibold leading-none"><AnimatedCounter value={m.value} /></p>
              <p className="text-[0.6875rem] text-muted-foreground mt-0.5">{m.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-9 bg-muted/50 p-0.5">
          <TabsTrigger value="requests" className="text-xs h-8 gap-1.5 px-3">
            <ShieldCheck className="h-3.5 w-3.5" />
            {isAr ? "الطلبات" : "Requests"}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs h-8 gap-1.5 px-3">
            <BarChart3 className="h-3.5 w-3.5" />
            {isAr ? "التحليلات" : "Analytics"}
          </TabsTrigger>
        </TabsList>

        {/* === REQUESTS TAB === */}
        <TabsContent value="requests" className="mt-4 space-y-4">
          {/* Search + Status Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={isAr ? "بحث بالاسم..." : "Search by name..."} className="ps-8 h-8 text-xs bg-card" />
            </div>
            <div className="flex gap-1">
              {["pending", "ai_review", "approved", "rejected", "all"].map(s => (
                <Button key={s} variant={statusTab === s ? "default" : "ghost"} size="sm" className="h-7 text-[0.6875rem] px-2.5" onClick={() => setStatusTab(s)}>
                  {statusLabels[s]?.[isAr ? "ar" : "en"] || (isAr ? "الكل" : "All")}
                </Button>
              ))}
            </div>
          </div>

          <BulkActionBar count={bulk.count} onClear={bulk.clearSelection} onExport={() => exportCSV(bulk.selectedItems)} />

          {/* Table */}
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
          ) : !filtered.length ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-lg border border-dashed border-border">
              <Shield className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">{isAr ? "لا توجد طلبات" : "No verification requests found"}</p>
            </div>
          ) : (
            <AdminTableCard>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10"><Checkbox checked={bulk.isAllSelected} onCheckedChange={bulk.toggleAll} /></TableHead>
                    <TableHead>{isAr ? "مقدّم الطلب" : "Applicant"}</TableHead>
                    <TableHead className="hidden md:table-cell">{isAr ? "النوع" : "Type"}</TableHead>
                    <TableHead className="hidden lg:table-cell">{isAr ? "المستوى" : "Level"}</TableHead>
                    <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                    <TableHead className="hidden lg:table-cell">{isAr ? "المخاطرة" : "Risk"}</TableHead>
                    <TableHead className="hidden md:table-cell">{isAr ? "التاريخ" : "Date"}</TableHead>
                    <TableHead className="w-28" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(req => {
                    const EntityIcon = entityIcons[req.entity_type] || Users;
                    const sl = statusLabels[req.status] || statusLabels.pending;
                    const aiAnalysis = req.ai_analysis as any;

                    return (
                      <TableRow key={req.id} className="group">
                        <TableCell className="w-10">
                          <Checkbox checked={bulk.isSelected(req.id)} onCheckedChange={() => bulk.toggleOne(req.id)} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                              <EntityIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-medium truncate max-w-[160px]">{req.applicant_name}</p>
                                {req.status === "approved" && <VerifiedBadge level={req.verification_level} size="sm" />}
                              </div>
                              {((req.documents as any[]) || []).length > 0 && (
                                <p className="text-[0.6875rem] text-muted-foreground">
                                  {((req.documents as any[]) || []).length} {isAr ? "مستند" : "doc(s)"}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="secondary" className="text-[0.6875rem] font-normal">
                            {req.entity_type === "user" ? (isAr ? "مستخدم" : "User") : req.entity_type === "company" ? (isAr ? "شركة" : "Company") : (isAr ? "جهة" : "Entity")}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground">{req.verification_level}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[req.status] || "outline"} className="text-[0.6875rem] font-normal">
                            {isAr ? sl.ar : sl.en}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {req.ai_risk_score != null ? (
                            <Badge variant={req.ai_risk_score > 0.6 ? "destructive" : req.ai_risk_score > 0.3 ? "secondary" : "default"} className="text-[0.6875rem] font-normal tabular-nums">
                              {(req.ai_risk_score * 100).toFixed(0)}%
                            </Badge>
                          ) : (
                            <span className="text-[0.6875rem] text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-[0.6875rem] text-muted-foreground tabular-nums">{format(new Date(req.created_at), "MMM d, yyyy")}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {(req.status === "pending" || req.status === "under_review") && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleAIReview(req)} disabled={aiMutation.isPending}>
                                    {aiMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bot className="h-3.5 w-3.5" />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">{isAr ? "مراجعة AI" : "AI Review"}</TooltipContent>
                              </Tooltip>
                            )}
                            {req.status !== "approved" && req.status !== "rejected" && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setSelectedRequest(req); setReviewDialog(true); }}>
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">{isAr ? "مراجعة" : "Review"}</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </AdminTableCard>
          )}
        </TabsContent>

        {/* === ANALYTICS TAB === */}
        <TabsContent value="analytics" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Status Distribution */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-medium mb-4">{isAr ? "التوزيع حسب الحالة" : "Status Distribution"}</h3>
              {stats.total > 0 ? (
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusChartData.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                        {statusChartData.filter(d => d.value > 0).map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <RTooltip formatter={(v: number, name: string) => [v, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">{isAr ? "لا توجد بيانات" : "No data"}</p>
              )}
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {statusChartData.filter(d => d.value > 0).map(d => (
                  <div key={d.name} className="flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.fill }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </div>

            {/* Entity Type Breakdown */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-medium mb-4">{isAr ? "حسب نوع الكيان" : "By Entity Type"}</h3>
              {entityChartData.length > 0 ? (
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={entityChartData} margin={{ left: 0, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <RTooltip />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                        {entityChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">{isAr ? "لا توجد بيانات" : "No data"}</p>
              )}
            </div>

            {/* Quick Stats */}
            <div className="rounded-lg border border-border bg-card p-4 md:col-span-2">
              <h3 className="text-sm font-medium mb-3">{isAr ? "نظرة سريعة" : "Quick Overview"}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: isAr ? "نسبة القبول" : "Approval Rate", value: stats.total ? `${Math.round((stats.approved / stats.total) * 100)}%` : "0%", sub: `${stats.approved}/${stats.total}` },
                  { label: isAr ? "نسبة الرفض" : "Rejection Rate", value: stats.total ? `${Math.round((stats.rejected / stats.total) * 100)}%` : "0%", sub: `${stats.rejected}/${stats.total}` },
                  { label: isAr ? "مراجعة بواسطة AI" : "AI Reviewed", value: stats.total ? `${Math.round((stats.ai_review / stats.total) * 100)}%` : "0%", sub: `${stats.ai_review}/${stats.total}` },
                  { label: isAr ? "بانتظار المراجعة" : "Awaiting Review", value: String(stats.pending), sub: isAr ? "طلب" : "requests" },
                ].map(s => (
                  <div key={s.label} className="text-center p-3 rounded-lg bg-muted/30">
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs font-medium mt-0.5">{s.label}</p>
                    <p className="text-[0.6875rem] text-muted-foreground">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isAr ? "مراجعة الطلب" : "Review Request"}</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="rounded-lg border p-3 text-sm space-y-1">
                <p><span className="text-muted-foreground">{isAr ? "مقدّم الطلب:" : "Applicant:"}</span> <strong>{selectedRequest.applicant_name}</strong></p>
                <p><span className="text-muted-foreground">{isAr ? "النوع:" : "Type:"}</span> {selectedRequest.entity_type}</p>
                <p><span className="text-muted-foreground">{isAr ? "المستوى:" : "Level:"}</span> {selectedRequest.verification_level}</p>
              </div>

              {selectedRequest.ai_analysis && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Bot className="h-3.5 w-3.5" />
                    {isAr ? "توصية AI" : "AI Recommendation"}: {(selectedRequest.ai_analysis as any).recommendation}
                  </div>
                  <p className="text-muted-foreground">{isAr ? (selectedRequest.ai_analysis as any).summary_ar : (selectedRequest.ai_analysis as any).summary}</p>
                  {(selectedRequest.ai_analysis as any).flags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(selectedRequest.ai_analysis as any).flags.map((flag: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-[0.6875rem]">
                          <AlertTriangle className="me-1 h-2.5 w-2.5" />{flag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Textarea placeholder={isAr ? "ملاحظات المراجع..." : "Reviewer notes..."} value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} className="text-sm" />
                <Textarea placeholder={isAr ? "سبب الرفض (إن وُجد)..." : "Rejection reason (if applicable)..."} value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} className="text-sm" />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="destructive" size="sm" onClick={() => handleReview("rejected")} disabled={reviewMutation.isPending} className="gap-1.5">
              <XCircle className="h-3.5 w-3.5" />{isAr ? "رفض" : "Reject"}
            </Button>
            <Button size="sm" onClick={() => handleReview("approved")} disabled={reviewMutation.isPending} className="gap-1.5">
              {reviewMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
              {isAr ? "اعتماد" : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
