import { useState, useMemo } from "react";
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
  ClipboardList, Plus, CheckCircle, XCircle, Clock, Send, AlertTriangle,
  Edit2, Download, RotateCcw, BookTemplate, MessageSquare, ChevronDown, ChevronUp,
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

const emptyForm = {
  item_name: "", item_name_ar: "", category: "food_ingredients",
  quantity: 1, unit: "piece", notes: "", priority: "normal",
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
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const { data: requests, isLoading } = useQuery({
    queryKey: ["item-requests", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_item_requests")
        .select("id, competition_id, item_name, item_name_ar, category, quantity, unit, priority, status, notes, notes_ar, requester_id, requester_role, assigned_vendor, assigned_vendor_ar, delivery_deadline, delivery_status, admin_notes, reviewed_by, reviewed_at, created_at, updated_at")
        .eq("competition_id", competitionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
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
      resetForm();
      toast({ title: isAr ? "تم إرسال الطلب للمراجعة" : "Request submitted for review" });
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

  const updateRequest = useMutation({
    mutationFn: async () => {
      if (!editingId) return;
      const { error } = await supabase.from("order_item_requests").update({
        item_name: form.item_name,
        item_name_ar: form.item_name_ar || null,
        category: form.category,
        quantity: form.quantity,
        unit: form.unit,
        notes: form.notes || null,
        priority: form.priority,
        status: "pending",
        rejection_reason: null,
        reviewed_by: null,
        reviewed_at: null,
      }).eq("id", editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["item-requests", competitionId] });
      resetForm();
      toast({ title: isAr ? "تم إعادة إرسال الطلب" : "Request resubmitted for review" });
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

  const addAdminNote = useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      const { error } = await supabase.from("order_item_requests").update({
        admin_notes: note || null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["item-requests", competitionId] });
      toast({ title: isAr ? "تم حفظ الملاحظة" : "Note saved" });
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

  const resetForm = () => {
    setForm({ ...emptyForm });
    setShowForm(false);
    setShowTemplates(false);
    setEditingId(null);
  };

  const startEdit = (r: any) => {
    setForm({
      item_name: r.item_name || "",
      item_name_ar: r.item_name_ar || "",
      category: r.category || "food_ingredients",
      quantity: r.quantity || 1,
      unit: r.unit || "piece",
      notes: r.notes || "",
      priority: r.priority || "normal",
    });
    setEditingId(r.id);
    setShowForm(true);
    setShowTemplates(false);
  };

  const applyTemplate = (templateId: string) => {
    const t = DISH_TEMPLATES.find(d => d.id === templateId);
    if (!t) return;
    // Submit all items from the template as individual requests
    const promises = t.ingredients.map(ing =>
      supabase.from("order_item_requests").insert({
        competition_id: competitionId,
        requester_id: user!.id,
        requester_role: "chef",
        category: ing.category,
        item_name: ing.name,
        item_name_ar: ing.nameAr,
        quantity: ing.quantity,
        unit: ing.unit,
        notes: `From template: ${t.name}`,
        priority: "normal",
        dish_template_id: t.id,
      })
    );
    Promise.all(promises).then(() => {
      queryClient.invalidateQueries({ queryKey: ["item-requests", competitionId] });
      setShowTemplates(false);
      toast({
        title: isAr ? `تم إضافة ${t.ingredients.length} عنصر من قالب "${t.nameAr}"` : `Added ${t.ingredients.length} items from "${t.name}" template`,
      });
      if (user && competition) {
        notifyItemRequestSubmitted({
          competitionId,
          competitionTitle: competition.title,
          competitionTitleAr: competition.title_ar || undefined,
          requesterName: user.user_metadata?.full_name || user.email || "",
          itemName: `${t.name} (${t.ingredients.length} items)`,
        });
      }
    });
  };

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
        admin_notes: r.admin_notes || "",
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
        { key: "admin_notes", label: isAr ? "ملاحظات الإدارة" : "Admin Notes" },
        { key: "created_at", label: isAr ? "التاريخ" : "Date" },
      ]
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
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
          <Button size="sm" variant="outline" onClick={() => setShowTemplates(!showTemplates)}>
            <BookTemplate className="me-1.5 h-3.5 w-3.5" />
            {isAr ? "من قالب" : "From Template"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => { resetForm(); setShowForm(!showForm); }}>
            <Plus className="me-1.5 h-3.5 w-3.5" />
            {isAr ? "طلب عنصر" : "Request Item"}
          </Button>
        </div>
      </div>

      {/* Dish Template Picker */}
      {showTemplates && (
        <Card className="border-chart-1/30">
          <CardContent className="p-3">
            <p className="text-xs font-medium mb-2">{isAr ? "اختر قالب طبق لإضافة جميع مكوناته تلقائياً" : "Select a dish template to auto-add all its ingredients"}</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {DISH_TEMPLATES.map(t => {
                const Icon = t.icon;
                return (
                  <Button
                    key={t.id}
                    variant="outline"
                    className="h-auto justify-start gap-2 p-2.5 text-start"
                    onClick={() => applyTemplate(t.id)}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-${t.color}/10`}>
                      <Icon className={`h-4 w-4 text-${t.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium">{isAr ? t.nameAr : t.name}</p>
                      <p className="text-[10px] text-muted-foreground">{t.ingredients.length} {isAr ? "عنصر" : "items"}</p>
                    </div>
                  </Button>
                );
              })}
            </div>
            <Button size="sm" variant="ghost" className="mt-2 text-xs" onClick={() => setShowTemplates(false)}>
              {isAr ? "إغلاق" : "Close"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Request Form (new or edit) */}
      {showForm && (
        <Card className="border-primary/20">
          <CardContent className="p-4 space-y-3">
            {editingId && (
              <div className="flex items-center gap-2 text-xs text-chart-4">
                <RotateCcw className="h-3.5 w-3.5" />
                {isAr ? "تعديل وإعادة إرسال الطلب" : "Edit & resubmit request"}
              </div>
            )}
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
              <Button
                size="sm"
                onClick={() => editingId ? updateRequest.mutate() : submitRequest.mutate()}
                disabled={!form.item_name || submitRequest.isPending || updateRequest.isPending}
              >
                {editingId ? <RotateCcw className="me-1.5 h-3.5 w-3.5" /> : <Send className="me-1.5 h-3.5 w-3.5" />}
                {editingId
                  ? (isAr ? "إعادة إرسال" : "Resubmit")
                  : (isAr ? "إرسال الطلب" : "Submit Request")}
              </Button>
              <Button size="sm" variant="ghost" onClick={resetForm}>
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading / Empty */}
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
                    onEdit={() => startEdit(r)}
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
                    onAddNote={(note) => addAdminNote.mutate({ id: r.id, note })}
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
  request, isAr, isOwn, isOrganizer, onDelete, onApprove, onReject, onEdit, onAddNote,
}: {
  request: any;
  isAr: boolean;
  isOwn?: boolean;
  isOrganizer?: boolean;
  onDelete?: () => void;
  onApprove?: () => void;
  onReject?: (reason: string) => void;
  onEdit?: () => void;
  onAddNote?: (note: string) => void;
}) {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState(request.admin_notes || "");
  const [expanded, setExpanded] = useState(false);
  const statusInfo = STATUS_STYLES[request.status] || STATUS_STYLES.pending;
  const priorityInfo = PRIORITY_STYLES[request.priority] || PRIORITY_STYLES.normal;
  const StatusIcon = statusInfo.icon;
  const catInfo = ORDER_CATEGORIES.find(c => c.value === request.category);
  const templateInfo = request.dish_template_id
    ? DISH_TEMPLATES.find(t => t.id === request.dish_template_id)
    : null;

  return (
    <Card className="border-border/60">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <StatusIcon className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium">{isAr && request.item_name_ar ? request.item_name_ar : request.item_name}</p>
                {templateInfo && (
                  <Badge variant="outline" className="text-[9px] h-4 gap-0.5">
                    <BookTemplate className="h-2.5 w-2.5" />
                    {isAr ? templateInfo.nameAr : templateInfo.name}
                  </Badge>
                )}
              </div>
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
              {/* Admin notes visible to both */}
              {request.admin_notes && (
                <p className="text-[10px] text-chart-1 mt-1 flex items-center gap-1">
                  <MessageSquare className="h-2.5 w-2.5" />
                  {isAr ? "ملاحظة الإدارة:" : "Admin note:"} {request.admin_notes}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {/* Expand toggle for details */}
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
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
            {/* Organizer can add notes */}
            {isOrganizer && (
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowNoteInput(!showNoteInput)}>
                <MessageSquare className="h-3.5 w-3.5 text-chart-1" />
              </Button>
            )}
            {/* Chef can edit rejected or pending requests */}
            {isOwn && (request.status === "rejected" || request.status === "pending") && onEdit && (
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}>
                <Edit2 className="h-3.5 w-3.5 text-chart-4" />
              </Button>
            )}
            {isOwn && request.status === "pending" && onDelete && (
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={onDelete}>
                <XCircle className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-2 ps-6.5 space-y-1 text-[10px] text-muted-foreground border-t border-border/40 pt-2">
            {request.item_name_ar && <p>{isAr ? "English" : "عربي"}: {isAr ? request.item_name : request.item_name_ar}</p>}
            {request.notes && <p>{isAr ? "ملاحظات:" : "Notes:"} {request.notes}</p>}
            <p>{isAr ? "تاريخ الإنشاء:" : "Created:"} {new Date(request.created_at).toLocaleDateString()}</p>
            {request.reviewed_at && <p>{isAr ? "تاريخ المراجعة:" : "Reviewed:"} {new Date(request.reviewed_at).toLocaleDateString()}</p>}
            {request.delivery_status && request.delivery_status !== "not_started" && (
              <p>{isAr ? "حالة التسليم:" : "Delivery:"} {request.delivery_status}</p>
            )}
            {request.tracking_number && <p>{isAr ? "رقم التتبع:" : "Tracking:"} {request.tracking_number}</p>}
          </div>
        )}

        {/* Reject reason input */}
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

        {/* Admin notes input */}
        {showNoteInput && (
          <div className="mt-2 flex gap-2">
            <Input
              placeholder={isAr ? "ملاحظة للطاهي..." : "Note for chef..."}
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              className="h-7 text-xs"
            />
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs"
              onClick={() => {
                onAddNote?.(noteText);
                setShowNoteInput(false);
              }}
            >
              {isAr ? "حفظ" : "Save"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
