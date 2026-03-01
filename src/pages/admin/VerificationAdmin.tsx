import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAllVerificationRequests, useReviewVerification, useRunAIVerification } from "@/hooks/useVerification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { VerifiedBadge } from "@/components/verification/VerifiedBadge";
import { Checkbox } from "@/components/ui/checkbox";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import {
  ShieldCheck, Bot, CheckCircle, XCircle, Clock, AlertTriangle,
  Search, Eye, Loader2, Shield, Users, Building, Building2,
} from "lucide-react";
import { format } from "date-fns";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  under_review: "secondary",
  ai_review: "secondary",
  approved: "default",
  rejected: "destructive",
  revoked: "destructive",
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
  user: Users,
  company: Building,
  culinary_entity: Building2,
};

export default function VerificationAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: requests, isLoading } = useAllVerificationRequests();
  const reviewMutation = useReviewVerification();
  const aiMutation = useRunAIVerification();

  const [tab, setTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [reviewDialog, setReviewDialog] = useState(false);

  const filtered = requests?.filter((r) => {
    if (tab !== "all" && r.status !== tab) return false;
    if (search && !r.applicant_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }) || [];

  const bulk = useAdminBulkActions(filtered);

  const { exportCSV } = useCSVExport({
    columns: [
      { header: isAr ? "الاسم" : "Applicant", accessor: (r: any) => r.applicant_name },
      { header: isAr ? "النوع" : "Entity Type", accessor: (r: any) => r.entity_type },
      { header: isAr ? "المستوى" : "Level", accessor: (r: any) => r.verification_level },
      { header: isAr ? "الحالة" : "Status", accessor: (r: any) => r.status },
      { header: isAr ? "المخاطرة" : "Risk Score", accessor: (r: any) => r.ai_risk_score != null ? (r.ai_risk_score * 100).toFixed(0) + "%" : "" },
      { header: isAr ? "التاريخ" : "Date", accessor: (r: any) => r.created_at?.slice(0, 10) || "" },
    ],
    filename: "verification-requests",
  });

  const stats = {
    pending: requests?.filter((r) => r.status === "pending").length || 0,
    ai_review: requests?.filter((r) => r.status === "ai_review").length || 0,
    approved: requests?.filter((r) => r.status === "approved").length || 0,
    rejected: requests?.filter((r) => r.status === "rejected").length || 0,
  };

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
      {
        request_id: selectedRequest.id,
        action,
        notes: reviewNotes,
        rejection_reason: action === "rejected" ? rejectionReason : undefined,
      },
      {
        onSuccess: () => {
          setReviewDialog(false);
          setSelectedRequest(null);
          setReviewNotes("");
          setRejectionReason("");
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={ShieldCheck}
        title={isAr ? "إدارة التوثيق" : "Verification Center"}
        description={isAr ? "مراجعة طلبات التوثيق والتحقق بالذكاء الاصطناعي" : "Review verification requests with AI-assisted fraud detection"}
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { key: "pending", icon: Clock, color: "text-chart-4", bg: "bg-chart-4/10", label: isAr ? "قيد الانتظار" : "Pending" },
          { key: "ai_review", icon: Bot, color: "text-accent", bg: "bg-accent/10", label: isAr ? "مراجعة AI" : "AI Reviewed" },
          { key: "approved", icon: CheckCircle, color: "text-primary", bg: "bg-primary/10", label: isAr ? "معتمد" : "Approved" },
          { key: "rejected", icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", label: isAr ? "مرفوض" : "Rejected" },
        ].map((s) => (
          <Card key={s.key} className="rounded-2xl border-border/40 cursor-pointer group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md" onClick={() => setTab(s.key)}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats[s.key as keyof typeof stats]}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={isAr ? "بحث بالاسم..." : "Search by name..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="rounded-2xl border border-border/40 bg-muted/30 backdrop-blur p-1.5 h-auto">
            <TabsTrigger value="pending" className="rounded-xl data-[state=active]:shadow-sm">{isAr ? "قيد الانتظار" : "Pending"}</TabsTrigger>
            <TabsTrigger value="ai_review" className="rounded-xl data-[state=active]:shadow-sm">{isAr ? "مراجعة AI" : "AI Reviewed"}</TabsTrigger>
            <TabsTrigger value="approved" className="rounded-xl data-[state=active]:shadow-sm">{isAr ? "معتمد" : "Approved"}</TabsTrigger>
            <TabsTrigger value="rejected" className="rounded-xl data-[state=active]:shadow-sm">{isAr ? "مرفوض" : "Rejected"}</TabsTrigger>
            <TabsTrigger value="all" className="rounded-xl data-[state=active]:shadow-sm">{isAr ? "الكل" : "All"}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <BulkActionBar
        count={bulk.count}
        onClear={bulk.clearSelection}
        onExport={() => exportCSV(bulk.selectedItems)}
      />

      {/* Requests List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-muted-foreground">
                <Shield className="mb-2 h-10 w-10" />
                <p>{isAr ? "لا توجد طلبات" : "No verification requests found"}</p>
              </CardContent>
            </Card>
          )}
          {filtered.map((req) => {
            const EntityIcon = entityIcons[req.entity_type] || Users;
            const statusLabel = statusLabels[req.status] || statusLabels.pending;
            const docs = (req.documents as any[]) || [];
            const aiAnalysis = req.ai_analysis as any;

            return (
              <Card key={req.id} className={`rounded-2xl border-border/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${bulk.isSelected(req.id) ? "ring-1 ring-primary/30" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={bulk.isSelected(req.id)}
                        onCheckedChange={() => bulk.toggleOne(req.id)}
                      />
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                        <EntityIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{req.applicant_name}</p>
                          {req.status === "approved" && <VerifiedBadge level={req.verification_level} size="sm" />}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{req.entity_type}</span>
                          <span>•</span>
                          <span>{req.verification_level}</span>
                          <span>•</span>
                          <span>{format(new Date(req.created_at), "MMM d, yyyy")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* AI Risk Score */}
                      {req.ai_risk_score != null && (
                        <Badge variant={req.ai_risk_score > 0.6 ? "destructive" : req.ai_risk_score > 0.3 ? "secondary" : "default"}>
                          {isAr ? "مخاطرة" : "Risk"}: {(req.ai_risk_score * 100).toFixed(0)}%
                        </Badge>
                      )}
                      <Badge variant={statusVariant[req.status] || "outline"}>
                        {isAr ? statusLabel.ar : statusLabel.en}
                      </Badge>

                      {/* AI Review Button */}
                      {(req.status === "pending" || req.status === "under_review") && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => handleAIReview(req)}
                          disabled={aiMutation.isPending}
                        >
                          {aiMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bot className="h-3.5 w-3.5" />}
                          {isAr ? "مراجعة AI" : "AI Review"}
                        </Button>
                      )}

                      {/* Manual Review */}
                      {req.status !== "approved" && req.status !== "rejected" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => {
                            setSelectedRequest(req);
                            setReviewDialog(true);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {isAr ? "مراجعة" : "Review"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* AI Analysis Summary */}
                  {aiAnalysis && (
                    <div className="mt-3 rounded-lg border bg-muted/30 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="h-4 w-4 text-accent" />
                        <span className="text-xs font-semibold">{isAr ? "تحليل الذكاء الاصطناعي" : "AI Analysis"}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{isAr ? aiAnalysis.summary_ar : aiAnalysis.summary}</p>
                      {aiAnalysis.flags?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {aiAnalysis.flags.map((flag: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-[10px] text-chart-4">
                              <AlertTriangle className="me-1 h-2.5 w-2.5" />
                              {flag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span>{isAr ? "توصية" : "Recommendation"}: <strong>{aiAnalysis.recommendation}</strong></span>
                        <span>{isAr ? "ثقة" : "Confidence"}: {((aiAnalysis.confidence || 0) * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  {docs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {docs.map((doc: any, i: number) => (
                        <Badge key={i} variant="outline" className="text-[10px]">
                          {doc.type} — {doc.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isAr ? "مراجعة الطلب" : "Review Verification Request"}</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="rounded-lg border p-3 text-sm">
                <p><strong>{isAr ? "مقدّم الطلب:" : "Applicant:"}</strong> {selectedRequest.applicant_name}</p>
                <p><strong>{isAr ? "النوع:" : "Type:"}</strong> {selectedRequest.entity_type}</p>
                <p><strong>{isAr ? "المستوى:" : "Level:"}</strong> {selectedRequest.verification_level}</p>
              </div>

              {selectedRequest.ai_analysis && (
                <div className="rounded-lg border border-accent/20 bg-accent/5 p-3 text-xs">
                  <p className="mb-1 font-semibold text-accent">{isAr ? "توصية AI" : "AI Recommendation"}: {(selectedRequest.ai_analysis as any).recommendation}</p>
                  <p className="text-muted-foreground">{isAr ? (selectedRequest.ai_analysis as any).summary_ar : (selectedRequest.ai_analysis as any).summary}</p>
                </div>
              )}

              <div className="space-y-2">
                <Textarea
                  placeholder={isAr ? "ملاحظات المراجع..." : "Reviewer notes..."}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
                <Textarea
                  placeholder={isAr ? "سبب الرفض (إن وُجد)..." : "Rejection reason (if applicable)..."}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={() => handleReview("rejected")}
              disabled={reviewMutation.isPending}
              className="gap-1.5"
            >
              <XCircle className="h-4 w-4" />
              {isAr ? "رفض" : "Reject"}
            </Button>
            <Button
              onClick={() => handleReview("approved")}
              disabled={reviewMutation.isPending}
              className="gap-1.5"
            >
              {reviewMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              {isAr ? "اعتماد" : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
