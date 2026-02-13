import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ClipboardList, Plus, CheckCircle, XCircle, Clock, Send, AlertTriangle, Edit2, Download,
} from "lucide-react";
import { ORDER_CATEGORIES, ITEM_UNITS } from "./OrderCenterCategories";
import { DISH_TEMPLATES } from "@/data/dishTemplates";
import { downloadCSV } from "@/lib/exportUtils";
import { notifyItemRequestSubmitted, notifyItemRequestReviewed } from "@/lib/notificationTriggers";

const STATUS_STYLES: Record<string, { icon: typeof Clock; color: string; labelEn: string; labelAr: string }> = {
  pending: { icon: Clock, color: "bg-chart-4/15 text-chart-4", labelEn: "Pending", labelAr: "قيد الانتظار" },
  approved: { icon: CheckCircle, color: "bg-chart-5/15 text-chart-5", labelEn: "Approved", labelAr: "مقبول" },
  rejected: { icon: XCircle, color: "bg-destructive/15 text-destructive", labelEn: "Rejected", labelAr: "مرفوض" },
  fulfilled: { icon: CheckCircle, color: "bg-primary/15 text-primary", labelEn: "Fulfilled", labelAr: "تم التنفيذ" },
};

const PRIORITY_STYLES: Record<string, { color: string; labelEn: string; labelAr: string }> = {
  low: { color: "bg-muted text-muted-foreground", labelEn: "Low", labelAr: "منخفضة" },
  normal: { color: "bg-chart-3/15 text-chart-3", labelEn: "Normal", labelAr: "عادية" },
  high: { color: "bg-chart-4/15 text-chart-4", labelEn: "High", labelAr: "عالية" },
  urgent: { color: "bg-destructive/15 text-destructive", labelEn: "Urgent", labelAr: "عاجلة" },
};

interface Props {
  competitionId: string;
  isOrganizer?: boolean;
}

export function ItemRequestPanel({ competitionId, isOrganizer }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    item_name: "", item_name_ar: "", category: "food_ingredients",
    quantity: 1, unit: "piece", notes: "", priority: "normal",
  });

  const { data: requests, isLoading } = useQuery({
    queryKey: ["item-requests", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_item_requests")
        .select("*")
        .eq("competition_id", competitionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Fetch requester profiles separately
      if (!data?.length) return [];
      const userIds = [...new Set(data.map(r => r.requester_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url")
        .in("user_id", userIds as string[]);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      return data.map(r => ({ ...r, profiles: profileMap.get(r.requester_id!) || null }));
    },
  });

  // Fetch competition title for notifications
  const { data: competition } = useQuery({
    queryKey: ["competition-title", competitionId],
    queryFn: async () => {
      const { data } = await supabase.from("competitions").select("title, title_ar").eq("id", competitionId).single();
      return data;
    },
  });

  const submitRequest = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("order_item_requests").insert({
        competition_id: competitionId,
        requester_id: user!.id,
        requester_role: "chef",
        category: form.category,
        item_name: form.item_name,
        item_name_ar: form.item_name_ar || null,
        quantity: form.quantity,
        unit: form.unit,
        notes: form.notes || null,
        priority: form.priority,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["item-requests", competitionId] });
      setShowForm(false);
      setForm({ item_name: "", item_name_ar: "", category: "food_ingredients", quantity: 1, unit: "piece", notes: "", priority: "normal" });
      toast({ title: isAr ? "تم إرسال الطلب للمراجعة" : "Request submitted for review" });
      // Notify admins
      if (user && competition) {
        notifyItemRequestSubmitted({
          competitionId,
          competitionTitle: competition.title,
          competitionTitleAr: competition.title_ar || undefined,
          requesterName: user.user_metadata?.full_name || user.email || "",
          itemName: form.item_name,
        });
      }
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const reviewRequest = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const { error } = await supabase.from("order_item_requests").update({
        status,
        reviewed_by: user!.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason || null,
      }).eq("id", id);
      if (error) throw error;
      return { id, status, reason };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["item-requests", competitionId] });
      toast({ title: isAr ? "تم تحديث الطلب" : "Request updated" });
      // Notify requester
      const req = requests?.find(r => r.id === variables.id);
      if (req && competition) {
        notifyItemRequestReviewed({
          userId: req.requester_id,
          itemName: req.item_name,
          status: variables.status as "approved" | "rejected",
          reason: variables.reason,
          competitionTitle: competition.title,
          competitionTitleAr: competition.title_ar || undefined,
        });
      }
    },
  });

  const deleteRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("order_item_requests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["item-requests", competitionId] });
      toast({ title: isAr ? "تم حذف الطلب" : "Request deleted" });
    },
  });

  const myRequests = requests?.filter(r => r.requester_id === user?.id) || [];
  const otherRequests = requests?.filter(r => r.requester_id !== user?.id) || [];
  const pendingCount = requests?.filter(r => r.status === "pending").length || 0;

  const handleExportCSV = () => {
    if (!requests?.length) return;
    downloadCSV(
      requests.map(r => ({
        item_name: r.item_name,
        item_name_ar: r.item_name_ar || "",
        category: r.category,
        quantity: r.quantity,
        unit: r.unit,
        priority: r.priority,
        status: r.status,
        requester: r.profiles?.full_name || r.profiles?.username || "",
        notes: r.notes || "",
        created_at: r.created_at,
      })),
      `item-requests-${competitionId}`,
      [
        { key: "item_name", label: isAr ? "العنصر" : "Item" },
        { key: "item_name_ar", label: isAr ? "العنصر (عربي)" : "Item (Arabic)" },
        { key: "category", label: isAr ? "الفئة" : "Category" },
        { key: "quantity", label: isAr ? "الكمية" : "Quantity" },
        { key: "unit", label: isAr ? "الوحدة" : "Unit" },
        { key: "priority", label: isAr ? "الأولوية" : "Priority" },
        { key: "status", label: isAr ? "الحالة" : "Status" },
        { key: "requester", label: isAr ? "مقدم الطلب" : "Requester" },
        { key: "notes", label: isAr ? "ملاحظات" : "Notes" },
        { key: "created_at", label: isAr ? "التاريخ" : "Date" },
      ]
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h4 className="font-semibold">{isAr ? "طلبات العناصر" : "Item Requests"}</h4>
          {pendingCount > 0 && (
            <Badge variant="secondary">{pendingCount} {isAr ? "معلق" : "pending"}</Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {requests && requests.length > 0 && (
            <Button size="sm" variant="ghost" onClick={handleExportCSV}>
              <Download className="me-1.5 h-3.5 w-3.5" />
              {isAr ? "تصدير" : "Export"}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
            <Plus className="me-1.5 h-3.5 w-3.5" />
            {isAr ? "طلب عنصر" : "Request Item"}
          </Button>
        </div>
      </div>

      {/* Request Form */}
      {showForm && (
        <Card className="border-primary/20">
          <CardContent className="p-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs">{isAr ? "اسم العنصر (إنجليزي)" : "Item Name (English)"}</Label>
                <Input value={form.item_name} onChange={e => setForm({ ...form, item_name: e.target.value })} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">{isAr ? "اسم العنصر (عربي)" : "Item Name (Arabic)"}</Label>
                <Input value={form.item_name_ar} onChange={e => setForm({ ...form, item_name_ar: e.target.value })} className="h-8 text-sm" dir="rtl" />
              </div>
              <div>
                <Label className="text-xs">{isAr ? "الفئة" : "Category"}</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ORDER_CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value} className="text-xs">
                        {isAr ? c.labelAr : c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{isAr ? "الأولوية" : "Priority"}</Label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_STYLES).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-xs">{isAr ? v.labelAr : v.labelEn}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{isAr ? "الكمية" : "Quantity"}</Label>
                <Input type="number" min={1} value={form.quantity} onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">{isAr ? "الوحدة" : "Unit"}</Label>
                <Select value={form.unit} onValueChange={v => setForm({ ...form, unit: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ITEM_UNITS.map(u => (
                      <SelectItem key={u.value} value={u.value} className="text-xs">{isAr ? u.labelAr : u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">{isAr ? "ملاحظات (اختياري)" : "Notes (optional)"}</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="text-sm" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => submitRequest.mutate()} disabled={!form.item_name || submitRequest.isPending}>
                <Send className="me-1.5 h-3.5 w-3.5" />
                {isAr ? "إرسال الطلب" : "Submit Request"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : !requests?.length ? (
        <Card>
          <CardContent className="py-8 text-center">
            <ClipboardList className="mx-auto mb-2 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">{isAr ? "لا توجد طلبات بعد" : "No requests yet"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr ? "يمكنك طلب المكونات والمعدات التي تحتاجها للمسابقة" : "Request ingredients and equipment you need for the competition"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* My Requests */}
          {myRequests.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">{isAr ? "طلباتي" : "My Requests"}</p>
              <div className="space-y-2">
                {myRequests.map(r => (
                  <RequestCard
                    key={r.id}
                    request={r}
                    isAr={isAr}
                    isOwn
                    isOrganizer={isOrganizer}
                    onDelete={() => { if (confirm(isAr ? "حذف الطلب؟" : "Delete request?")) deleteRequest.mutate(r.id); }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other Requests (visible to organizers) */}
          {isOrganizer && otherRequests.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">{isAr ? "طلبات أخرى" : "Other Requests"}</p>
              <div className="space-y-2">
                {otherRequests.map(r => (
                  <RequestCard
                    key={r.id}
                    request={r}
                    isAr={isAr}
                    isOrganizer
                    onApprove={() => reviewRequest.mutate({ id: r.id, status: "approved" })}
                    onReject={(reason) => reviewRequest.mutate({ id: r.id, status: "rejected", reason })}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RequestCard({
  request, isAr, isOwn, isOrganizer, onDelete, onApprove, onReject,
}: {
  request: any;
  isAr: boolean;
  isOwn?: boolean;
  isOrganizer?: boolean;
  onDelete?: () => void;
  onApprove?: () => void;
  onReject?: (reason: string) => void;
}) {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const statusInfo = STATUS_STYLES[request.status] || STATUS_STYLES.pending;
  const priorityInfo = PRIORITY_STYLES[request.priority] || PRIORITY_STYLES.normal;
  const StatusIcon = statusInfo.icon;
  const catInfo = ORDER_CATEGORIES.find(c => c.value === request.category);

  return (
    <Card className="border-border/60">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 min-w-0">
            <StatusIcon className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium">{isAr && request.item_name_ar ? request.item_name_ar : request.item_name}</p>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <Badge variant="outline" className="text-[9px] h-4">
                  {catInfo ? (isAr ? catInfo.labelAr : catInfo.label) : request.category}
                </Badge>
                <span className="text-[10px] text-muted-foreground">{request.quantity} {request.unit}</span>
                <Badge className={`${priorityInfo.color} text-[9px] h-4`} variant="outline">
                  {isAr ? priorityInfo.labelAr : priorityInfo.labelEn}
                </Badge>
                <Badge className={`${statusInfo.color} text-[9px] h-4`} variant="outline">
                  {isAr ? statusInfo.labelAr : statusInfo.labelEn}
                </Badge>
              </div>
              {!isOwn && request.profiles && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  {isAr ? "بواسطة" : "By"}: {request.profiles.full_name || request.profiles.username}
                </p>
              )}
              {request.notes && (
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{request.notes}</p>
              )}
              {request.rejection_reason && (
                <p className="text-[10px] text-destructive mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-2.5 w-2.5" /> {request.rejection_reason}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isOrganizer && request.status === "pending" && (
              <>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onApprove}>
                  <CheckCircle className="h-4 w-4 text-chart-5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowRejectInput(!showRejectInput)}>
                  <XCircle className="h-4 w-4 text-destructive" />
                </Button>
              </>
            )}
            {isOwn && request.status === "pending" && onDelete && (
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={onDelete}>
                <XCircle className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
        {showRejectInput && (
          <div className="mt-2 flex gap-2">
            <Input
              placeholder={isAr ? "سبب الرفض..." : "Rejection reason..."}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="h-7 text-xs"
            />
            <Button
              size="sm"
              variant="destructive"
              className="h-7 text-xs"
              onClick={() => {
                onReject?.(rejectReason);
                setShowRejectInput(false);
                setRejectReason("");
              }}
            >
              {isAr ? "رفض" : "Reject"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
