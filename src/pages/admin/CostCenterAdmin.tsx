import { useState, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  useCostEstimates, useCostEstimateItems, useCostApprovalLog,
  useCostTemplates, useCreateCostEstimate, useUpdateCostEstimate,
  useSaveCostEstimateItem, useDeleteCostEstimateItem,
  useSubmitForApproval, useApproveCostEstimate, useRejectCostEstimate,
  useConvertToInvoice, useSaveCostTemplate, useDuplicateCostEstimate,
  recalcEstimateTotals,
  COST_ITEM_CATEGORIES, MODULE_TYPES, ESTIMATE_STATUS_CONFIG,
  type CostEstimate, type CostEstimateItem, type CostModuleType,
  type CostEstimateStatus, type CostItemCategory, type CostTemplate,
} from "@/hooks/useCostCenter";
import { ChefCostCenter } from "@/components/admin/chefs-table/ChefCostCenter";
import { CostCenterOverview } from "@/components/admin/cost-center/CostCenterOverview";
import { CostCenterBudgetTracking } from "@/components/admin/cost-center/CostCenterBudgetTracking";
import { CostCenterReports } from "@/components/admin/cost-center/CostCenterReports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Calculator, Plus, Search, FileText, Eye, Edit2, Trash2,
  Save, Send, CheckCircle2, XCircle, Receipt, ChevronDown,
  DollarSign, BarChart3, Clock, ArrowRight, Copy,
  Printer, LayoutTemplate, History, AlertCircle, Users,
  Trophy, ChefHat, Landmark, Calendar, TrendingUp,
} from "lucide-react";

export default function CostCenterAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("overview");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Form state
  const [formData, setFormData] = useState<Partial<CostEstimate>>({
    module_type: "competition",
    title: "",
    currency: "SAR",
    tax_rate: 15,
    discount_amount: 0,
    status: "draft",
  });

  // Item form
  const [editingItem, setEditingItem] = useState<Partial<CostEstimateItem> | null>(null);

  const { data: estimates = [], isLoading } = useCostEstimates({ moduleType: moduleFilter, status: statusFilter });
  const { data: selectedItems = [] } = useCostEstimateItems(selectedEstimateId || undefined);
  const { data: approvalLog = [] } = useCostApprovalLog(selectedEstimateId || undefined);
  const { data: templates = [] } = useCostTemplates();

  const createEstimate = useCreateCostEstimate();
  const updateEstimate = useUpdateCostEstimate();
  const saveItem = useSaveCostEstimateItem();
  const deleteItem = useDeleteCostEstimateItem();
  const submitForApproval = useSubmitForApproval();
  const approveEstimate = useApproveCostEstimate();
  const rejectEstimate = useRejectCostEstimate();
  const convertToInvoice = useConvertToInvoice();
  const saveTemplate = useSaveCostTemplate();
  const duplicateEstimate = useDuplicateCostEstimate();

  const selectedEstimate = estimates.find(e => e.id === selectedEstimateId);

  const filteredEstimates = useMemo(() => {
    if (!search) return estimates;
    const q = search.toLowerCase();
    return estimates.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.estimate_number.toLowerCase().includes(q) ||
      (e.module_title || "").toLowerCase().includes(q)
    );
  }, [estimates, search]);

  // Stats
  const stats = useMemo(() => {
    const all = estimates;
    return {
      total: all.length,
      drafts: all.filter(e => e.status === "draft").length,
      pending: all.filter(e => e.status === "pending_approval").length,
      approved: all.filter(e => e.status === "approved").length,
      totalValue: all.reduce((s, e) => s + e.total_amount, 0),
      approvedValue: all.filter(e => e.status === "approved" || e.status === "invoiced").reduce((s, e) => s + e.total_amount, 0),
      byModule: Object.keys(MODULE_TYPES).reduce((acc, key) => {
        acc[key] = all.filter(e => e.module_type === key).length;
        return acc;
      }, {} as Record<string, number>),
    };
  }, [estimates]);

  // ─── Handlers ─────────────────────────────

  const handleCreateEstimate = async () => {
    try {
      const result = await createEstimate.mutateAsync(formData as any);
      toast.success(isAr ? "تم إنشاء التقدير" : "Estimate created");
      setShowForm(false);
      setSelectedEstimateId(result.id);
      setActiveTab("estimates");
      setFormData({ module_type: "competition", title: "", currency: "SAR", tax_rate: 15, discount_amount: 0, status: "draft" });
    } catch {
      toast.error(isAr ? "حدث خطأ" : "Error creating estimate");
    }
  };

  const handleSaveItem = async () => {
    if (!editingItem || !selectedEstimateId) return;
    try {
      await saveItem.mutateAsync({ ...editingItem, estimate_id: selectedEstimateId } as any);
      toast.success(isAr ? "تم الحفظ" : "Item saved");
      setEditingItem(null);
      setTimeout(async () => {
        const { data: items } = await (supabase as any).from("cost_estimate_items").select("*").eq("estimate_id", selectedEstimateId);
        if (items) {
          const totals = recalcEstimateTotals(items, selectedEstimate?.tax_rate || 15, selectedEstimate?.discount_amount || 0);
          await updateEstimate.mutateAsync({ id: selectedEstimateId, ...totals } as any);
        }
      }, 200);
    } catch {
      toast.error(isAr ? "حدث خطأ" : "Error saving item");
    }
  };

  const handleSubmit = async () => {
    if (!selectedEstimateId) return;
    try {
      await submitForApproval.mutateAsync({ estimateId: selectedEstimateId });
      toast.success(isAr ? "تم التقديم للموافقة" : "Submitted for approval");
    } catch {
      toast.error(isAr ? "حدث خطأ" : "Error");
    }
  };

  const handleApprove = async () => {
    if (!selectedEstimateId) return;
    try {
      await approveEstimate.mutateAsync({ estimateId: selectedEstimateId });
      toast.success(isAr ? "تمت الموافقة" : "Approved");
    } catch {
      toast.error(isAr ? "حدث خطأ" : "Error");
    }
  };

  const handleReject = async () => {
    if (!rejectingId || !rejectionReason.trim()) return;
    try {
      await rejectEstimate.mutateAsync({ estimateId: rejectingId, reason: rejectionReason });
      toast.success(isAr ? "تم الرفض" : "Rejected");
      setRejectingId(null);
      setRejectionReason("");
    } catch {
      toast.error(isAr ? "حدث خطأ" : "Error");
    }
  };

  const handleConvertToInvoice = async () => {
    if (!selectedEstimateId) return;
    try {
      await convertToInvoice.mutateAsync(selectedEstimateId);
      toast.success(isAr ? "تم إنشاء الفاتورة" : "Invoice created");
    } catch {
      toast.error(isAr ? "حدث خطأ" : "Error creating invoice");
    }
  };

  const handleApplyTemplate = async (template: CostTemplate) => {
    if (!selectedEstimateId) return;
    for (const item of template.items) {
      await saveItem.mutateAsync({
        estimate_id: selectedEstimateId,
        category: item.category,
        title: item.title,
        title_ar: item.title_ar || null,
        unit: item.unit || null,
        unit_price: item.unit_price,
        quantity: item.default_quantity,
      } as any);
    }
    toast.success(isAr ? "تم تطبيق القالب" : "Template applied");
  };

  const handleDuplicate = async (id: string) => {
    try {
      const result = await duplicateEstimate.mutateAsync(id);
      toast.success(isAr ? "تم نسخ التقدير" : "Estimate duplicated");
      setSelectedEstimateId(result.id);
    } catch {
      toast.error(isAr ? "حدث خطأ" : "Error duplicating estimate");
    }
  };

  // ─── Detail View ──────────────────────────

  if (selectedEstimateId && selectedEstimate) {
    const sc = ESTIMATE_STATUS_CONFIG[selectedEstimate.status];
    const mt = MODULE_TYPES[selectedEstimate.module_type];
    const itemsByCategory = selectedItems.reduce((acc, item) => {
      const cat = item.category || "miscellaneous";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {} as Record<string, CostEstimateItem[]>);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedEstimateId(null)}>
            ← {isAr ? "العودة" : "Back"}
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold">{selectedEstimate.title}</h2>
              <Badge className={`text-[10px] ${sc.color}`}>{isAr ? sc.ar : sc.en}</Badge>
              <Badge variant="outline" className="text-[10px]">{isAr ? mt.ar : mt.en}</Badge>
              <span className="text-xs text-muted-foreground font-mono">{selectedEstimate.estimate_number}</span>
              {selectedEstimate.version > 1 && (
                <Badge variant="secondary" className="text-[10px]">v{selectedEstimate.version}</Badge>
              )}
            </div>
            {selectedEstimate.module_title && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAr && selectedEstimate.module_title_ar ? selectedEstimate.module_title_ar : selectedEstimate.module_title}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 print:hidden">
            {selectedEstimate.status === "draft" && (
              <Button size="sm" className="gap-1" onClick={handleSubmit}>
                <Send className="h-3.5 w-3.5" />{isAr ? "تقديم للموافقة" : "Submit"}
              </Button>
            )}
            {selectedEstimate.status === "pending_approval" && (
              <>
                <Button size="sm" className="gap-1" onClick={handleApprove}>
                  <CheckCircle2 className="h-3.5 w-3.5" />{isAr ? "موافقة" : "Approve"}
                </Button>
                <Button size="sm" variant="outline" className="gap-1 text-destructive" onClick={() => setRejectingId(selectedEstimateId)}>
                  <XCircle className="h-3.5 w-3.5" />{isAr ? "رفض" : "Reject"}
                </Button>
              </>
            )}
            {selectedEstimate.status === "approved" && !selectedEstimate.invoice_id && (
              <Button size="sm" className="gap-1" onClick={handleConvertToInvoice}>
                <Receipt className="h-3.5 w-3.5" />{isAr ? "إنشاء فاتورة" : "Create Invoice"}
              </Button>
            )}
            <Button size="sm" variant="outline" className="gap-1" onClick={() => handleDuplicate(selectedEstimateId!)}>
              <Copy className="h-3.5 w-3.5" />{isAr ? "نسخ" : "Duplicate"}
            </Button>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Rejection form */}
        {rejectingId === selectedEstimateId && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="font-bold text-sm text-destructive">{isAr ? "سبب الرفض" : "Rejection Reason"}</p>
              </div>
              <Textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                placeholder={isAr ? "اكتب سبب الرفض..." : "Enter rejection reason..."} rows={2} />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => { setRejectingId(null); setRejectionReason(""); }}>{isAr ? "إلغاء" : "Cancel"}</Button>
                <Button size="sm" variant="destructive" disabled={!rejectionReason.trim()} onClick={handleReject}>{isAr ? "تأكيد الرفض" : "Confirm"}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Financial Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: isAr ? "المجموع الفرعي" : "Subtotal", value: selectedEstimate.subtotal },
            { label: isAr ? "الضريبة" : `Tax (${selectedEstimate.tax_rate}%)`, value: selectedEstimate.tax_amount },
            { label: isAr ? "الخصم" : "Discount", value: selectedEstimate.discount_amount },
            { label: isAr ? "الإجمالي" : "Total", value: selectedEstimate.total_amount, highlight: true },
          ].map((s, i) => (
            <Card key={i} className={`border-border/40 ${s.highlight ? "border-primary/30 bg-primary/5" : ""}`}>
              <CardContent className="p-4 text-center">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
                <p className={`text-xl font-black tabular-nums mt-1 ${s.highlight ? "text-primary" : ""}`}>
                  {s.value.toLocaleString()} <span className="text-xs">{selectedEstimate.currency}</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Line Items by Category */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />{isAr ? "بنود التكلفة" : "Cost Items"}
                <Badge variant="outline" className="text-[10px]">{selectedItems.length}</Badge>
              </CardTitle>
              <div className="flex items-center gap-1.5 print:hidden">
                {templates.length > 0 && selectedEstimate.status === "draft" && (
                  <Select onValueChange={v => {
                    const t = templates.find(t => t.id === v);
                    if (t) handleApplyTemplate(t);
                  }}>
                    <SelectTrigger className="h-8 w-40 text-xs">
                      <SelectValue placeholder={isAr ? "قالب" : "Template"} />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(t => (
                        <SelectItem key={t.id} value={t.id}>{isAr && t.name_ar ? t.name_ar : t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {selectedEstimate.status === "draft" && (
                  <Button size="sm" className="gap-1 h-8 text-xs" onClick={() => setEditingItem({
                    category: "miscellaneous", title: "", quantity: 1, unit_price: 0, sort_order: selectedItems.length,
                  })}>
                    <Plus className="h-3 w-3" />{isAr ? "بند جديد" : "Add Item"}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Item Form */}
            {editingItem && (
              <div className="p-4 border-b border-border/40 bg-muted/20 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <Label className="text-[10px]">{isAr ? "الفئة" : "Category"}</Label>
                    <Select value={editingItem.category || "miscellaneous"} onValueChange={v => setEditingItem(p => ({ ...p!, category: v as CostItemCategory }))}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(COST_ITEM_CATEGORIES).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{isAr ? v.ar : v.en}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-[10px]">{isAr ? "الوصف" : "Description"}</Label>
                    <Input className="h-8 text-xs" value={editingItem.title || ""} onChange={e => setEditingItem(p => ({ ...p!, title: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-[10px]">{isAr ? "الكمية" : "Qty"}</Label>
                    <Input className="h-8 text-xs" type="number" min={0.1} step={0.5} value={editingItem.quantity || 1}
                      onChange={e => setEditingItem(p => ({ ...p!, quantity: +e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-[10px]">{isAr ? "سعر الوحدة" : "Unit Price"}</Label>
                    <Input className="h-8 text-xs" type="number" value={editingItem.unit_price || 0}
                      onChange={e => setEditingItem(p => ({ ...p!, unit_price: +e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-[10px]">{isAr ? "الوحدة" : "Unit"}</Label>
                    <Input className="h-8 text-xs" value={editingItem.unit || ""} placeholder={isAr ? "يوم/قطعة/ساعة" : "day/piece/hour"}
                      onChange={e => setEditingItem(p => ({ ...p!, unit: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-[10px]">{isAr ? "الدور" : "Role"}</Label>
                    <Input className="h-8 text-xs" value={editingItem.person_role || ""} onChange={e => setEditingItem(p => ({ ...p!, person_role: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2 flex items-end gap-2">
                    <div className="rounded-xl bg-primary/10 px-3 py-1 text-center flex-1">
                      <span className="text-[9px] text-primary font-bold">{isAr ? "الإجمالي" : "Total"}: </span>
                      <span className="font-black text-primary tabular-nums">
                        {((editingItem.quantity || 1) * (editingItem.unit_price || 0)).toLocaleString()} SAR
                      </span>
                    </div>
                    <Button size="sm" className="gap-1 h-8" onClick={handleSaveItem} disabled={!editingItem.title}>
                      <Save className="h-3 w-3" />{isAr ? "حفظ" : "Save"}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingItem(null)}>{isAr ? "إلغاء" : "Cancel"}</Button>
                  </div>
                </div>
              </div>
            )}

            {/* Items Table */}
            {selectedItems.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm font-medium">{isAr ? "لا توجد بنود" : "No items yet"}</p>
              </div>
            ) : (
              <div className="space-y-0">
                {Object.entries(itemsByCategory).map(([cat, items]) => {
                  const catMeta = COST_ITEM_CATEGORIES[cat as CostItemCategory] || COST_ITEM_CATEGORIES.miscellaneous;
                  const catTotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
                  return (
                    <div key={cat}>
                      <div className="px-4 py-2 bg-muted/30 border-y border-border/20 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {isAr ? catMeta.ar : catMeta.en}
                        </span>
                        <span className="text-xs font-bold tabular-nums">{catTotal.toLocaleString()} SAR</span>
                      </div>
                      <Table>
                        <TableBody>
                          {items.map(item => (
                            <TableRow key={item.id} className="text-xs">
                              <TableCell className="py-2 font-medium">{item.title}</TableCell>
                              <TableCell className="py-2 text-muted-foreground">{item.person_role || "—"}</TableCell>
                              <TableCell className="py-2 tabular-nums text-end">{item.quantity} {item.unit || ""}</TableCell>
                              <TableCell className="py-2 tabular-nums text-end">{item.unit_price.toLocaleString()}</TableCell>
                              <TableCell className="py-2 tabular-nums text-end font-bold">{(item.quantity * item.unit_price).toLocaleString()}</TableCell>
                              {selectedEstimate.status === "draft" && (
                                <TableCell className="py-2 text-end print:hidden">
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditingItem(item)}>
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => deleteItem.mutate({ id: item.id, estimateId: selectedEstimateId! })}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approval History */}
        {approvalLog.length > 0 && (
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="h-4 w-4" />{isAr ? "سجل الموافقات" : "Approval History"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="text-[10px]">
                    <TableHead>{isAr ? "الإجراء" : "Action"}</TableHead>
                    <TableHead>{isAr ? "التعليقات" : "Comments"}</TableHead>
                    <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvalLog.map(log => (
                    <TableRow key={log.id} className="text-xs">
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] capitalize">{log.action}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{log.comments || "—"}</TableCell>
                      <TableCell className="tabular-nums">{format(new Date(log.created_at), "MMM d, yyyy HH:mm")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ─── Main View ───────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <AdminPageHeader
          icon={Calculator}
          title={isAr ? "مركز التكلفة والتسعير" : "Cost & Pricing Center"}
          description={isAr ? "إدارة التكاليف والتقديرات والموافقات والفواتير لجميع الأقسام" : "Manage costs, estimates, approvals & invoicing across all modules"}
        />
        <Button size="sm" variant="outline" className="gap-1.5 print:hidden" onClick={() => window.print()}>
          <Printer className="h-3.5 w-3.5" />{isAr ? "طباعة" : "Print"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: isAr ? "إجمالي التقديرات" : "Total Estimates", value: stats.total, icon: FileText, color: "text-primary" },
          { label: isAr ? "مسودات" : "Drafts", value: stats.drafts, icon: Edit2, color: "text-muted-foreground" },
          { label: isAr ? "بانتظار الموافقة" : "Pending", value: stats.pending, icon: Clock, color: "text-chart-4", pulse: stats.pending > 0 },
          { label: isAr ? "معتمدة" : "Approved", value: stats.approved, icon: CheckCircle2, color: "text-chart-5" },
          { label: isAr ? "القيمة الإجمالية" : "Total Value", value: `${stats.totalValue.toLocaleString()}`, icon: DollarSign, color: "text-primary" },
          { label: isAr ? "القيمة المعتمدة" : "Approved Value", value: `${stats.approvedValue.toLocaleString()}`, icon: TrendingUp, color: "text-chart-5" },
        ].map((s, i) => (
          <Card key={i} className="border-border/40">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`h-4 w-4 ${s.color} ${(s as any).pulse ? "animate-pulse" : ""}`} />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</span>
              </div>
              <p className="text-lg font-black tabular-nums">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Module Breakdown */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {Object.entries(MODULE_TYPES).map(([key, val]) => {
          const moduleIcons: Record<string, any> = {
            competition: Trophy, chefs_table: ChefHat, exhibition: Landmark,
            event: Calendar, project: FileText, other: BarChart3,
          };
          const Icon = moduleIcons[key] || FileText;
          const count = stats.byModule[key] || 0;
          return (
            <button
              key={key}
              onClick={() => { setModuleFilter(key); setActiveTab("estimates"); }}
              className={`rounded-xl border p-3 text-center transition-all duration-300 hover:border-primary/30 hover:bg-primary/5 hover:-translate-y-0.5 ${moduleFilter === key ? "border-primary/40 bg-primary/10" : "border-border/40"}`}
            >
              <Icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground transition-transform duration-300 group-hover:scale-110" />
              <p className="text-lg font-black tabular-nums">{count}</p>
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">{isAr ? val.ar : val.en}</p>
            </button>
          );
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="print:hidden flex-wrap">
          <TabsTrigger value="overview" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />{isAr ? "نظرة عامة" : "Overview"}
          </TabsTrigger>
          <TabsTrigger value="estimates" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />{isAr ? "التقديرات" : "Estimates"}
            {stats.pending > 0 && <Badge variant="destructive" className="ms-1 h-5 min-w-5 px-1.5 text-[10px]">{stats.pending}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="budget" className="gap-1.5">
            <DollarSign className="h-3.5 w-3.5" />{isAr ? "تتبع الميزانية" : "Budget Tracking"}
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />{isAr ? "التقارير" : "Reports"}
          </TabsTrigger>
          <TabsTrigger value="chef-costs" className="gap-1.5">
            <ChefHat className="h-3.5 w-3.5" />{isAr ? "تكاليف الطهاة" : "Chef Costs"}
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5">
            <LayoutTemplate className="h-3.5 w-3.5" />{isAr ? "القوالب" : "Templates"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <CostCenterOverview
            isAr={isAr}
            estimates={estimates}
            stats={stats}
            onSelect={setSelectedEstimateId}
            onCreateNew={() => { setShowForm(true); setActiveTab("estimates"); }}
          />
        </TabsContent>

        {/* ─── Budget Tracking Tab ──────────── */}
        <TabsContent value="budget" className="space-y-4">
          <CostCenterBudgetTracking isAr={isAr} estimates={estimates} />
        </TabsContent>

        {/* ─── Reports Tab ──────────── */}
        <TabsContent value="reports" className="space-y-4">
          <CostCenterReports isAr={isAr} estimates={estimates} />
        </TabsContent>

        {/* ─── Estimates Tab ──────────── */}
        <TabsContent value="estimates" className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap print:hidden">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder={isAr ? "بحث..." : "Search..."} value={search} onChange={e => setSearch(e.target.value)} className="ps-9" />
            </div>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "جميع الأقسام" : "All Modules"}</SelectItem>
                {Object.entries(MODULE_TYPES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{isAr ? v.ar : v.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "جميع الحالات" : "All Status"}</SelectItem>
                {Object.entries(ESTIMATE_STATUS_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{isAr ? v.ar : v.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" className="gap-1.5 ms-auto" onClick={() => setShowForm(true)}>
              <Plus className="h-3.5 w-3.5" />{isAr ? "تقدير جديد" : "New Estimate"}
            </Button>
          </div>

          {/* Create Form */}
          {showForm && (
            <Card className="border-primary/20">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-bold text-sm">{isAr ? "إنشاء تقدير تكلفة جديد" : "Create New Cost Estimate"}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>{isAr ? "القسم" : "Module"}</Label>
                    <Select value={formData.module_type} onValueChange={v => setFormData(p => ({ ...p, module_type: v as CostModuleType }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(MODULE_TYPES).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{isAr ? v.ar : v.en}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>{isAr ? "العنوان" : "Title"}</Label>
                    <Input value={formData.title || ""} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} />
                  </div>
                  <div>
                    <Label>{isAr ? "العنوان (AR)" : "Title (AR)"}</Label>
                    <Input value={formData.title_ar || ""} onChange={e => setFormData(p => ({ ...p, title_ar: e.target.value }))} dir="rtl" />
                  </div>
                  <div>
                    <Label>{isAr ? "المرجع" : "Module Reference"}</Label>
                    <Input value={formData.module_title || ""} onChange={e => setFormData(p => ({ ...p, module_title: e.target.value }))}
                      placeholder={isAr ? "اسم المسابقة/الجلسة" : "Competition/Session name"} />
                  </div>
                  <div>
                    <Label>{isAr ? "صالح حتى" : "Valid Until"}</Label>
                    <Input type="date" value={formData.valid_until || ""} onChange={e => setFormData(p => ({ ...p, valid_until: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>{isAr ? "الوصف" : "Description"}</Label>
                  <Textarea value={formData.description || ""} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={2} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowForm(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
                  <Button onClick={handleCreateEstimate} disabled={!formData.title} className="gap-1.5">
                    <Plus className="h-4 w-4" />{isAr ? "إنشاء" : "Create"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estimates List */}
          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          ) : filteredEstimates.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <Calculator className="mx-auto h-12 w-12 text-muted-foreground/20" />
                <p className="mt-4 font-semibold">{isAr ? "لا توجد تقديرات" : "No estimates found"}</p>
                <p className="text-xs text-muted-foreground mt-1">{isAr ? "أنشئ تقدير تكلفة جديد" : "Create a new cost estimate to get started"}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredEstimates.map(est => {
                const sc = ESTIMATE_STATUS_CONFIG[est.status];
                const mt = MODULE_TYPES[est.module_type];
                const moduleIcons: Record<string, any> = {
                  competition: Trophy, chefs_table: ChefHat, exhibition: Landmark,
                  event: Calendar, project: FileText, other: BarChart3,
                };
                const ModIcon = moduleIcons[est.module_type] || Calculator;
                return (
                  <Card key={est.id} className="rounded-2xl border-border/40 hover:border-border/60 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer group"
                    onClick={() => setSelectedEstimateId(est.id)}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-transform duration-300 group-hover:scale-110">
                          <ModIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-sm truncate">{est.title}</h3>
                            <Badge className={`text-[10px] ${sc.color}`}>{isAr ? sc.ar : sc.en}</Badge>
                            <Badge variant="outline" className="text-[10px]">{isAr ? mt.ar : mt.en}</Badge>
                            {est.version > 1 && <Badge variant="secondary" className="text-[10px]">v{est.version}</Badge>}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                            <span className="font-mono">{est.estimate_number}</span>
                            {est.module_title && <span>• {est.module_title}</span>}
                            <span>{format(new Date(est.created_at), "MMM d, yyyy")}</span>
                          </div>
                        </div>
                        <div className="text-end shrink-0">
                          <p className="text-lg font-black tabular-nums text-primary">{est.total_amount.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">{est.currency}</p>
                        </div>
                        <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ─── Chef Costs Tab ─────────── */}
        <TabsContent value="chef-costs">
          <ChefCostCenter />
        </TabsContent>

        {/* ─── Templates Tab ─────────── */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold">{isAr ? "قوالب التكلفة" : "Cost Templates"}</h3>
              <p className="text-xs text-muted-foreground">{isAr ? "قوالب جاهزة لتسريع إعداد التقديرات" : "Pre-built templates for fast estimate creation"}</p>
            </div>
          </div>
          {templates.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <LayoutTemplate className="mx-auto h-10 w-10 text-muted-foreground/20" />
                <p className="mt-3 font-semibold text-sm">{isAr ? "لا توجد قوالب" : "No templates yet"}</p>
                <p className="text-xs text-muted-foreground">{isAr ? "سيتم إضافة القوالب قريباً" : "Templates will be added soon"}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {templates.map(t => {
                const mt = MODULE_TYPES[t.module_type];
                const moduleIcons: Record<string, any> = {
                  competition: Trophy, chefs_table: ChefHat, exhibition: Landmark,
                  event: Calendar, project: FileText, other: BarChart3,
                };
                const ModIcon = moduleIcons[t.module_type] || LayoutTemplate;
                const totalValue = t.items.reduce((s, item) => s + item.unit_price * item.default_quantity, 0);
                return (
                  <Card key={t.id} className="border-border/40 hover:border-border/60 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-bold text-sm">{isAr && t.name_ar ? t.name_ar : t.name}</h4>
                          <Badge variant="outline" className="text-[8px] mt-1 gap-1">
                            <ModIcon className="h-2.5 w-2.5" />{isAr ? mt.ar : mt.en}
                          </Badge>
                        </div>
                        <div className="text-end">
                          <p className="text-sm font-black tabular-nums text-primary">{totalValue.toLocaleString()}</p>
                          <p className="text-[9px] text-muted-foreground">SAR</p>
                        </div>
                      </div>
                      {t.description && <p className="text-xs text-muted-foreground mt-2">{isAr && t.description_ar ? t.description_ar : t.description}</p>}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/20">
                        <p className="text-[10px] text-muted-foreground">{t.items.length} {isAr ? "بنود" : "items"}</p>
                        <div className="flex gap-1 flex-wrap">
                          {[...new Set(t.items.map(i => i.category))].slice(0, 3).map(cat => (
                            <Badge key={cat} variant="secondary" className="text-[8px]">
                              {isAr ? COST_ITEM_CATEGORIES[cat as CostItemCategory]?.ar : COST_ITEM_CATEGORIES[cat as CostItemCategory]?.en}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
