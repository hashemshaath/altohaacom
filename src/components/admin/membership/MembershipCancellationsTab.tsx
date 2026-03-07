import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { Checkbox } from "@/components/ui/checkbox";
import { UserX, Gift, Check, X, MessageSquare, Download } from "lucide-react";
import { format } from "date-fns";

interface CancellationRequest {
  id: string;
  user_id: string;
  current_tier: string;
  reason: string | null;
  reason_ar: string | null;
  feedback: string | null;
  status: string;
  admin_notes: string | null;
  retention_offer: string | null;
  retention_offer_ar: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export default function MembershipCancellationsTab() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [statusFilter, setStatusFilter] = useState("pending");
  const [reviewRequest, setReviewRequest] = useState<CancellationRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [retentionOffer, setRetentionOffer] = useState("");
  const [retentionOfferAr, setRetentionOfferAr] = useState("");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["membership-cancellation-requests", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("membership_cancellation_requests")
        .select("id, user_id, current_tier, reason, reason_ar, feedback, status, admin_notes, retention_offer, retention_offer_ar, reviewed_by, reviewed_at, created_at, updated_at")
        .order("created_at", { ascending: false });
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data as CancellationRequest[];
    },
  });

  const bulk = useAdminBulkActions(requests || []);

  const { exportCSV } = useCSVExport({
    columns: [
      { header: isAr ? "المستوى" : "Tier", accessor: (r: CancellationRequest) => r.current_tier },
      { header: isAr ? "السبب" : "Reason", accessor: (r: CancellationRequest) => (isAr ? r.reason_ar || r.reason : r.reason) || "" },
      { header: isAr ? "الحالة" : "Status", accessor: (r: CancellationRequest) => r.status },
      { header: isAr ? "التاريخ" : "Date", accessor: (r: CancellationRequest) => format(new Date(r.created_at), "yyyy-MM-dd") },
      { header: isAr ? "ملاحظات" : "Admin Notes", accessor: (r: CancellationRequest) => r.admin_notes || "" },
    ],
    filename: "membership-cancellations",
  });

  const handleRequestMutation = useMutation({
    mutationFn: async ({ id, userId, action }: { id: string; userId: string; action: "approved" | "rejected" | "retained" }) => {
      const { error } = await supabase
        .from("membership_cancellation_requests")
        .update({
          status: action,
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
          retention_offer: retentionOffer || null,
          retention_offer_ar: retentionOfferAr || null,
        })
        .eq("id", id);
      if (error) throw error;

      if (action === "approved") {
        // Downgrade to basic
        await supabase.from("profiles").update({
          membership_tier: "basic",
          membership_status: "cancelled",
        }).eq("user_id", userId);

        await supabase.from("notifications").insert({
          user_id: userId,
          title: "Your membership cancellation has been processed",
          title_ar: "تمت معالجة طلب إلغاء عضويتك",
          body: "Your membership has been downgraded to Basic. We're sorry to see you go!",
          body_ar: "تم تخفيض عضويتك إلى الأساسية. نأسف لرحيلك!",
          type: "membership",
        });
      } else if (action === "retained") {
        await supabase.from("notifications").insert({
          user_id: userId,
          title: "We have a special offer for you!",
          title_ar: "لدينا عرض خاص لك!",
          body: retentionOffer || "We'd love to keep you! Check out our special retention offer.",
          body_ar: retentionOfferAr || "نود الاحتفاظ بك! تحقق من عرض الاحتفاظ الخاص بنا.",
          type: "membership",
          link: "/profile?tab=membership",
        });
      } else {
        await supabase.from("notifications").insert({
          user_id: userId,
          title: "Your cancellation request update",
          title_ar: "تحديث طلب إلغاء العضوية",
          body: "Your cancellation request has been reviewed. Please contact support for details.",
          body_ar: "تمت مراجعة طلب الإلغاء. يرجى التواصل مع الدعم للتفاصيل.",
          type: "membership",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membership-cancellation-requests"] });
      queryClient.invalidateQueries({ queryKey: ["membership-overview-stats"] });
      toast({ title: isAr ? "تم معالجة الطلب" : "Request processed" });
      setReviewRequest(null);
      setAdminNotes("");
      setRetentionOffer("");
      setRetentionOfferAr("");
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: isAr ? "معلق" : "Pending", variant: "outline" },
      approved: { label: isAr ? "تمت الموافقة" : "Approved", variant: "destructive" },
      rejected: { label: isAr ? "مرفوض" : "Rejected", variant: "secondary" },
      retained: { label: isAr ? "تم الاحتفاظ" : "Retained", variant: "default" },
    };
    const c = config[status] || config.pending;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <BulkActionBar
        count={bulk.count}
        onClear={bulk.clearSelection}
        onExport={() => exportCSV(bulk.count > 0 ? bulk.selectedItems : requests || [])}
      />
      <Card>
        <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UserX className="h-5 w-5" />
                  {isAr ? "طلبات الإلغاء" : "Cancellation Requests"}
                </CardTitle>
                <CardDescription>{isAr ? "مراجعة ومعالجة طلبات إلغاء العضوية وعروض الاحتفاظ" : "Review cancellation requests and offer retention deals"}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                    <SelectItem value="pending">{isAr ? "معلق" : "Pending"}</SelectItem>
                    <SelectItem value="approved">{isAr ? "موافق" : "Approved"}</SelectItem>
                    <SelectItem value="rejected">{isAr ? "مرفوض" : "Rejected"}</SelectItem>
                    <SelectItem value="retained">{isAr ? "محتفظ" : "Retained"}</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => exportCSV(requests || [])} className="gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  {isAr ? "تصدير" : "Export"}
                </Button>
              </div>
            </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : requests?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserX className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{isAr ? "لا توجد طلبات إلغاء" : "No cancellation requests"}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={bulk.isAllSelected} onCheckedChange={bulk.toggleAll} />
                  </TableHead>
                  <TableHead>{isAr ? "المستوى" : "Tier"}</TableHead>
                  <TableHead>{isAr ? "السبب" : "Reason"}</TableHead>
                  <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                  <TableHead>{isAr ? "إجراء" : "Action"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests?.map((req) => (
                  <TableRow key={req.id} className={bulk.isSelected(req.id) ? "bg-primary/5" : ""}>
                    <TableCell>
                      <Checkbox checked={bulk.isSelected(req.id)} onCheckedChange={() => bulk.toggleOne(req.id)} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{req.current_tier}</Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">
                      {isAr ? req.reason_ar || req.reason : req.reason || "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(req.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {req.status === "pending" && (
                        <Button variant="outline" size="sm" onClick={() => setReviewRequest(req)}>
                          <MessageSquare className="h-3.5 w-3.5 me-1" />
                          {isAr ? "مراجعة" : "Review"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!reviewRequest} onOpenChange={() => setReviewRequest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isAr ? "مراجعة طلب الإلغاء" : "Review Cancellation Request"}</DialogTitle>
            <DialogDescription>
              {isAr ? "اتخذ إجراء بشأن طلب إلغاء العضوية هذا" : "Take action on this cancellation request"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-xl border p-3 bg-muted/50">
              <p className="text-sm font-medium mb-1">{isAr ? "سبب الإلغاء" : "Cancellation Reason"}</p>
              <p className="text-sm text-muted-foreground">{isAr ? reviewRequest?.reason_ar || reviewRequest?.reason : reviewRequest?.reason || (isAr ? "غير محدد" : "Not specified")}</p>
              {reviewRequest?.feedback && (
                <>
                  <p className="text-sm font-medium mt-3 mb-1">{isAr ? "ملاحظات إضافية" : "Additional Feedback"}</p>
                  <p className="text-sm text-muted-foreground">{reviewRequest.feedback}</p>
                </>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">{isAr ? "عرض الاحتفاظ (إنجليزي)" : "Retention Offer (English)"}</label>
              <Textarea
                value={retentionOffer}
                onChange={(e) => setRetentionOffer(e.target.value)}
                placeholder={isAr ? "مثال: خصم 50% لمدة 3 أشهر" : "e.g., 50% off for 3 months"}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{isAr ? "عرض الاحتفاظ (عربي)" : "Retention Offer (Arabic)"}</label>
              <Textarea
                value={retentionOfferAr}
                onChange={(e) => setRetentionOfferAr(e.target.value)}
                placeholder="مثال: خصم 50% لمدة 3 أشهر"
                className="mt-1"
                dir="rtl"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{isAr ? "ملاحظات المشرف" : "Admin Notes"}</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={isAr ? "ملاحظات داخلية..." : "Internal notes..."}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="destructive" onClick={() => reviewRequest && handleRequestMutation.mutate({ id: reviewRequest.id, userId: reviewRequest.user_id, action: "approved" })}
              disabled={handleRequestMutation.isPending}>
              <Check className="h-4 w-4 me-1" />{isAr ? "قبول الإلغاء" : "Approve Cancel"}
            </Button>
            <Button variant="default" onClick={() => reviewRequest && handleRequestMutation.mutate({ id: reviewRequest.id, userId: reviewRequest.user_id, action: "retained" })}
              disabled={handleRequestMutation.isPending || !retentionOffer}>
              <Gift className="h-4 w-4 me-1" />{isAr ? "إرسال عرض احتفاظ" : "Send Retention Offer"}
            </Button>
            <Button variant="outline" onClick={() => reviewRequest && handleRequestMutation.mutate({ id: reviewRequest.id, userId: reviewRequest.user_id, action: "rejected" })}
              disabled={handleRequestMutation.isPending}>
              <X className="h-4 w-4 me-1" />{isAr ? "رفض" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
