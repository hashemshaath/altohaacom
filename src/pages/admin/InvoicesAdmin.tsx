import { useState, useMemo } from "react";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { notifyInvoiceSent, notifyInvoicePaid } from "@/lib/notificationTriggers";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { useCSVExport } from "@/hooks/useCSVExport";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useToast } from "@/hooks/use-toast";
import PrintableInvoice from "@/components/invoices/PrintableInvoice";
import { FinancialOverviewCards } from "@/components/admin/FinancialOverviewCards";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import {
  FileText, Search, Plus, Eye, ChevronLeft, Save, Trash2,
  DollarSign, Clock, CheckCircle, XCircle, Send, Copy,
} from "lucide-react";
import { format } from "date-fns";
import { toEnglishDigits } from "@/lib/formatNumber";

interface InvoiceItem {
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total: number;
}

const statusColors: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
  draft: "secondary",
  pending: "outline",
  sent: "outline",
  paid: "default",
  overdue: "destructive",
  cancelled: "destructive",
};

export default function InvoicesAdmin() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "", title_ar: "", description: "", description_ar: "",
    company_id: "", user_id: "", currency: "SAR",
    due_date: "", notes: "", notes_ar: "", tax_rate: 15,
    items: [{ name: "", description: "", quantity: 1, unit_price: 0, total: 0 }] as InvoiceItem[],
  });

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["admin-invoices", searchQuery, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("invoices")
        .select(`*, companies:company_id (id, name, name_ar)`)
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.or(`invoice_number.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`);
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data;
    },
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies-for-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, name_ar")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: invoiceDetails } = useQuery({
    queryKey: ["invoice-detail", selectedInvoice],
    queryFn: async () => {
      if (!selectedInvoice) return null;
      const { data, error } = await supabase
        .from("invoices")
        .select(`*, companies:company_id (id, name, name_ar, email, phone, address)`)
        .eq("id", selectedInvoice)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedInvoice,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const items = formData.items.filter((i) => i.name.trim());
      const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
      const taxAmount = subtotal * (formData.tax_rate / 100);
      const total = subtotal + taxAmount;

      const { error } = await supabase.from("invoices").insert({
        title: formData.title || null,
        title_ar: formData.title_ar || null,
        description: formData.description || null,
        description_ar: formData.description_ar || null,
        company_id: formData.company_id || null,
        user_id: user.id,
        currency: formData.currency,
        due_date: formData.due_date || null,
        notes: formData.notes || null,
        notes_ar: formData.notes_ar || null,
        items: items as unknown as Record<string, unknown>,
        subtotal,
        tax_rate: formData.tax_rate,
        tax_amount: taxAmount,
        amount: total,
        status: "draft",
        issued_by: user.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-invoices"] });
      setShowForm(false);
      resetForm();
      toast({ title: language === "ar" ? "تم إنشاء الفاتورة" : "Invoice created" });
    },
    onError: (err) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: Record<string, unknown> = { status };
      if (status === "paid") updates.paid_at = new Date().toISOString();
      const { error } = await supabase.from("invoices").update(updates).eq("id", id);
      if (error) throw error;
      return { id, status };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-detail", selectedInvoice] });
      toast({ title: language === "ar" ? "تم تحديث الحالة" : "Status updated" });

      // Send notifications for status changes
      if (invoiceDetails?.user_id && (result.status === "sent" || result.status === "paid")) {
        const inv = invoiceDetails;
        if (result.status === "sent") {
          notifyInvoiceSent({
            userId: inv.user_id,
            invoiceNumber: inv.invoice_number,
            amount: Number(inv.amount),
            currency: inv.currency,
          });
        } else if (result.status === "paid") {
          notifyInvoicePaid({
            userId: inv.user_id,
            invoiceNumber: inv.invoice_number,
            amount: Number(inv.amount),
            currency: inv.currency,
          });
        }
      }
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (sourceId: string) => {
      if (!user) throw new Error("Not authenticated");
      const source = invoices.find((i) => i.id === sourceId);
      if (!source) throw new Error("Invoice not found");
      const { error } = await supabase.from("invoices").insert({
        title: source.title ? `${source.title} (copy)` : null,
        title_ar: source.title_ar || null,
        description: source.description || null,
        description_ar: source.description_ar || null,
        company_id: source.company_id || null,
        user_id: user.id,
        currency: source.currency,
        due_date: null,
        notes: source.notes || null,
        notes_ar: source.notes_ar || null,
        items: source.items as unknown as Record<string, unknown>,
        subtotal: source.subtotal,
        tax_rate: source.tax_rate,
        tax_amount: source.tax_amount,
        amount: source.amount,
        status: "draft",
        issued_by: user.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-invoices"] });
      toast({ title: language === "ar" ? "تم نسخ الفاتورة" : "Invoice duplicated" });
    },
    onError: (err) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  const resetForm = () => {
    setFormData({
      title: "", title_ar: "", description: "", description_ar: "",
      company_id: "", user_id: "", currency: "SAR",
      due_date: "", notes: "", notes_ar: "", tax_rate: 15,
      items: [{ name: "", description: "", quantity: 1, unit_price: 0, total: 0 }],
    });
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updated = [...formData.items];
    updated[index] = { ...updated[index], [field]: value };
    updated[index].total = updated[index].quantity * updated[index].unit_price;
    setFormData({ ...formData, items: updated });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: "", description: "", quantity: 1, unit_price: 0, total: 0 }],
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
    }
  };

  const subtotal = formData.items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const taxAmount = subtotal * (formData.tax_rate / 100);
  const total = subtotal + taxAmount;

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      draft: { en: "Draft", ar: "مسودة" },
      pending: { en: "Pending", ar: "قيد الانتظار" },
      sent: { en: "Sent", ar: "مرسلة" },
      paid: { en: "Paid", ar: "مدفوعة" },
      overdue: { en: "Overdue", ar: "متأخرة" },
      cancelled: { en: "Cancelled", ar: "ملغاة" },
    };
    const l = labels[status] || labels.draft;
    return language === "ar" ? l.ar : l.en;
  };

  const isAr = language === "ar";

  const bulk = useAdminBulkActions(invoices);

  const { exportCSV: exportInvoicesCSV } = useCSVExport({
    columns: [
      { header: isAr ? "رقم الفاتورة" : "Invoice #", accessor: (i: any) => i.invoice_number },
      { header: isAr ? "العنوان" : "Title", accessor: (i: any) => i.title || "" },
      { header: isAr ? "الشركة" : "Company", accessor: (i: any) => i.companies?.name || "" },
      { header: isAr ? "الحالة" : "Status", accessor: (i: any) => getStatusLabel(i.status || "draft") },
      { header: isAr ? "المبلغ" : "Amount", accessor: (i: any) => Number(i.amount) },
      { header: isAr ? "العملة" : "Currency", accessor: (i: any) => i.currency },
      { header: isAr ? "الاستحقاق" : "Due", accessor: (i: any) => i.due_date || "" },
      { header: isAr ? "التاريخ" : "Created", accessor: (i: any) => i.created_at?.split("T")[0] || "" },
    ],
    filename: "invoices",
  });

  const bulkStatusChange = async (status: string) => {
    const ids = [...bulk.selected];
    const updates: Record<string, unknown> = { status };
    if (status === "paid") updates.paid_at = new Date().toISOString();
    const { error } = await supabase.from("invoices").update(updates).in("id", ids);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["admin-invoices"] });
      bulk.clearSelection();
      toast({ title: isAr ? `تم تحديث ${ids.length} فاتورة` : `Updated ${ids.length} invoices` });
    }
  };

  const bulkDelete = async () => {
    if (!confirm(isAr ? "هل أنت متأكد من حذف الفواتير المحددة؟" : "Delete selected invoices?")) return;
    const ids = [...bulk.selected];
    const { error } = await supabase.from("invoices").delete().in("id", ids);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["admin-invoices"] });
      bulk.clearSelection();
      toast({ title: isAr ? `تم حذف ${ids.length} فاتورة` : `Deleted ${ids.length} invoices` });
    }
  };

  // Stats
  const stats = {
    total: invoices.length,
    pending: invoices.filter((i) => i.status === "pending" || i.status === "sent").length,
    paid: invoices.filter((i) => i.status === "paid").length,
    totalAmount: invoices.reduce((sum, i) => sum + Number(i.amount), 0),
    paidAmount: invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + Number(i.amount), 0),
  };

  // ── Invoice Detail View ──
  if (selectedInvoice && invoiceDetails) {
    const items = (invoiceDetails.items || []) as unknown as InvoiceItem[];
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedInvoice(null)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{invoiceDetails.invoice_number}</h1>
            <p className="text-muted-foreground">{invoiceDetails.title}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => duplicateMutation.mutate(invoiceDetails.id)} disabled={duplicateMutation.isPending}>
              <Copy className="me-2 h-4 w-4" />
              {language === "ar" ? "نسخ" : "Duplicate"}
            </Button>
            {invoiceDetails.status === "draft" && (
              <Button onClick={() => updateStatusMutation.mutate({ id: invoiceDetails.id, status: "sent" })}>
                <Send className="me-2 h-4 w-4" />
                {language === "ar" ? "إرسال" : "Send"}
              </Button>
            )}
            {(invoiceDetails.status === "sent" || invoiceDetails.status === "pending") && (
              <Button onClick={() => updateStatusMutation.mutate({ id: invoiceDetails.id, status: "paid" })}>
                <CheckCircle className="me-2 h-4 w-4" />
                {language === "ar" ? "تأكيد الدفع" : "Mark Paid"}
              </Button>
            )}
            {invoiceDetails.status !== "cancelled" && invoiceDetails.status !== "paid" && (
              <Button variant="destructive" size="sm" onClick={() => updateStatusMutation.mutate({ id: invoiceDetails.id, status: "cancelled" })}>
                <XCircle className="me-2 h-4 w-4" />
                {language === "ar" ? "إلغاء" : "Cancel"}
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{language === "ar" ? "تفاصيل الفاتورة" : "Invoice Details"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{language === "ar" ? "الحالة" : "Status"}</p>
                    <Badge variant={statusColors[invoiceDetails.status || "draft"]}>
                      {getStatusLabel(invoiceDetails.status || "draft")}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{language === "ar" ? "العملة" : "Currency"}</p>
                    <p className="font-medium">{invoiceDetails.currency}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{language === "ar" ? "تاريخ الإنشاء" : "Created"}</p>
                    <p className="font-medium">{format(new Date(invoiceDetails.created_at), "yyyy-MM-dd")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{language === "ar" ? "تاريخ الاستحقاق" : "Due Date"}</p>
                    <p className="font-medium">{invoiceDetails.due_date ? format(new Date(invoiceDetails.due_date), "yyyy-MM-dd") : "—"}</p>
                  </div>
                </div>

                {invoiceDetails.description && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{language === "ar" ? "الوصف" : "Description"}</p>
                      <p>{invoiceDetails.description}</p>
                    </div>
                  </>
                )}

                {items.length > 0 && (
                  <>
                    <Separator />
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{language === "ar" ? "الصنف" : "Item"}</TableHead>
                          <TableHead className="text-center">{language === "ar" ? "الكمية" : "Qty"}</TableHead>
                          <TableHead className="text-right">{language === "ar" ? "السعر" : "Price"}</TableHead>
                          <TableHead className="text-right">{language === "ar" ? "المجموع" : "Total"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <p className="font-medium">{item.name}</p>
                              {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                            </TableCell>
                            <TableCell className="text-center"><AnimatedCounter value={item.quantity} className="inline" format={false} /></TableCell>
                            <TableCell className="text-right"><AnimatedCounter value={Math.round(Number(item.unit_price))} className="inline" format /></TableCell>
                            <TableCell className="text-right font-medium"><AnimatedCounter value={Math.round(item.quantity * item.unit_price)} className="inline" format /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="flex justify-end">
                      <div className="w-64 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{language === "ar" ? "المجموع الفرعي" : "Subtotal"}</span>
                          <span><AnimatedCounter value={Math.round(Number(invoiceDetails.subtotal))} className="inline" format /></span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{language === "ar" ? "الضريبة" : "Tax"} ({invoiceDetails.tax_rate}%)</span>
                          <span><AnimatedCounter value={Math.round(Number(invoiceDetails.tax_amount))} className="inline" format /></span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-base">
                          <span>{language === "ar" ? "الإجمالي" : "Total"}</span>
                          <span><AnimatedCounter value={Math.round(Number(invoiceDetails.amount))} className="inline" format /> {invoiceDetails.currency}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{language === "ar" ? "الشركة" : "Company"}</CardTitle>
              </CardHeader>
              <CardContent>
                {invoiceDetails.companies ? (
                  <div>
                    <p className="font-medium">{language === "ar" ? invoiceDetails.companies.name_ar || invoiceDetails.companies.name : invoiceDetails.companies.name}</p>
                    {invoiceDetails.companies.email && <p className="text-sm text-muted-foreground">{invoiceDetails.companies.email}</p>}
                    {invoiceDetails.companies.phone && <p className="text-sm text-muted-foreground">{invoiceDetails.companies.phone}</p>}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{language === "ar" ? "فاتورة فردية" : "Individual invoice"}</p>
                )}
              </CardContent>
            </Card>

            {invoiceDetails.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{language === "ar" ? "ملاحظات" : "Notes"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{invoiceDetails.notes}</p>
                </CardContent>
              </Card>
            )}

            {invoiceDetails.paid_at && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{language === "ar" ? "معلومات الدفع" : "Payment Info"}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">{language === "ar" ? "تاريخ الدفع" : "Paid at"}:</span> {format(new Date(invoiceDetails.paid_at), "yyyy-MM-dd HH:mm")}</p>
                  {invoiceDetails.payment_method && <p><span className="text-muted-foreground">{language === "ar" ? "طريقة الدفع" : "Method"}:</span> {invoiceDetails.payment_method}</p>}
                  {invoiceDetails.payment_reference && <p><span className="text-muted-foreground">{language === "ar" ? "المرجع" : "Ref"}:</span> {invoiceDetails.payment_reference}</p>}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Printable Invoice */}
        <PrintableInvoice
          invoice={invoiceDetails}
          company={invoiceDetails.companies || null}
        />
      </div>
    );
  }

  // ── Create Form ──
  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); resetForm(); }}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">{language === "ar" ? "إنشاء فاتورة" : "Create Invoice"}</h1>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{language === "ar" ? "العنوان (إنجليزي)" : "Title (English)"}</Label>
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{language === "ar" ? "العنوان (عربي)" : "Title (Arabic)"}</Label>
                <Input value={formData.title_ar} onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })} dir="rtl" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{language === "ar" ? "الشركة" : "Company"}</Label>
                <Select value={formData.company_id} onValueChange={(v) => setFormData({ ...formData, company_id: v })}>
                  <SelectTrigger><SelectValue placeholder={language === "ar" ? "اختر شركة" : "Select company"} /></SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{language === "ar" ? c.name_ar || c.name : c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === "ar" ? "العملة" : "Currency"}</Label>
                  <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["SAR", "USD", "EUR", "AED", "TND", "KWD", "BHD", "QAR", "OMR"].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "نسبة الضريبة %" : "Tax Rate %"}</Label>
                  <Input type="number" value={formData.tax_rate} onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })} min={0} max={100} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{language === "ar" ? "تاريخ الاستحقاق" : "Due Date"}</Label>
              <Input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
            </div>

            <Separator />

            {/* Line Items */}
            <div>
              <Label className="mb-3 block">{language === "ar" ? "البنود" : "Line Items"}</Label>
              <div className="space-y-3">
                {formData.items.map((item, i) => (
                  <div key={i} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_80px_100px_100px_40px]">
                    <Input placeholder={language === "ar" ? "اسم الصنف" : "Item name"} value={item.name} onChange={(e) => updateItem(i, "name", e.target.value)} />
                    <Input type="number" placeholder={language === "ar" ? "كمية" : "Qty"} value={item.quantity} onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 0)} min={1} />
                    <Input type="number" placeholder={language === "ar" ? "السعر" : "Price"} value={item.unit_price} onChange={(e) => updateItem(i, "unit_price", parseFloat(e.target.value) || 0)} min={0} />
                    <div className="flex items-center justify-end font-medium"><AnimatedCounter value={Math.round(item.quantity * item.unit_price)} className="inline" format /></div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)} disabled={formData.items.length <= 1}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="me-2 h-4 w-4" />
                  {language === "ar" ? "إضافة بند" : "Add Item"}
                </Button>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">{language === "ar" ? "المجموع الفرعي" : "Subtotal"}</span><span><AnimatedCounter value={Math.round(subtotal)} className="inline" format /></span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{language === "ar" ? "الضريبة" : "Tax"} ({formData.tax_rate}%)</span><span><AnimatedCounter value={Math.round(taxAmount)} className="inline" format /></span></div>
                <Separator />
                <div className="flex justify-between font-bold text-base"><span>{language === "ar" ? "الإجمالي" : "Total"}</span><span><AnimatedCounter value={Math.round(total)} className="inline" format /> {formData.currency}</span></div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>{language === "ar" ? "ملاحظات" : "Notes"}</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                {language === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !formData.items.some((i) => i.name.trim())}>
                <Save className="me-2 h-4 w-4" />
                {language === "ar" ? "إنشاء الفاتورة" : "Create Invoice"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── List View ──
  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={FileText}
        title={language === "ar" ? "الفواتير" : "Invoices"}
        description={language === "ar" ? "إدارة وتتبع جميع الفواتير" : "Manage and track all invoices"}
        actions={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="me-2 h-4 w-4" />
            {language === "ar" ? "إنشاء فاتورة" : "Create Invoice"}
          </Button>
        }
      />

      {/* Financial Overview */}
      <FinancialOverviewCards />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <AnimatedCounter value={stats.total} className="text-2xl font-bold" />
            <p className="text-sm text-muted-foreground">{language === "ar" ? "إجمالي الفواتير" : "Total Invoices"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Clock className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <AnimatedCounter value={stats.pending} className="text-2xl font-bold" />
            <p className="text-sm text-muted-foreground">{language === "ar" ? "قيد الانتظار" : "Pending"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <DollarSign className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <AnimatedCounter value={Math.round(stats.totalAmount)} className="text-2xl font-bold" format />
            <p className="text-sm text-muted-foreground">{language === "ar" ? "إجمالي المبلغ" : "Total Amount"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <AnimatedCounter value={Math.round(stats.paidAmount)} className="text-2xl font-bold" format />
            <p className="text-sm text-muted-foreground">{language === "ar" ? "المحصّل" : "Collected"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="ps-10"
            placeholder={language === "ar" ? "بحث بالرقم أو العنوان..." : "Search by number or title..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={language === "ar" ? "الحالة" : "Status"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === "ar" ? "الكل" : "All"}</SelectItem>
            <SelectItem value="draft">{language === "ar" ? "مسودة" : "Draft"}</SelectItem>
            <SelectItem value="sent">{language === "ar" ? "مرسلة" : "Sent"}</SelectItem>
            <SelectItem value="pending">{language === "ar" ? "قيد الانتظار" : "Pending"}</SelectItem>
            <SelectItem value="paid">{language === "ar" ? "مدفوعة" : "Paid"}</SelectItem>
            <SelectItem value="overdue">{language === "ar" ? "متأخرة" : "Overdue"}</SelectItem>
            <SelectItem value="cancelled">{language === "ar" ? "ملغاة" : "Cancelled"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <BulkActionBar
        count={bulk.count}
        onClear={bulk.clearSelection}
        onDelete={bulkDelete}
        onStatusChange={bulkStatusChange}
        onExport={() => exportInvoicesCSV(bulk.count > 0 ? bulk.selectedItems : invoices)}
      />

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6"><Skeleton className="h-64" /></div>
          ) : invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={bulk.isAllSelected} onCheckedChange={bulk.toggleAll} />
                    </TableHead>
                    <TableHead>{language === "ar" ? "رقم الفاتورة" : "Invoice #"}</TableHead>
                    <TableHead>{language === "ar" ? "العنوان" : "Title"}</TableHead>
                    <TableHead>{language === "ar" ? "الشركة" : "Company"}</TableHead>
                    <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                    <TableHead className="text-right">{language === "ar" ? "المبلغ" : "Amount"}</TableHead>
                    <TableHead>{language === "ar" ? "الاستحقاق" : "Due"}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id} className={`cursor-pointer ${bulk.isSelected(inv.id) ? "bg-primary/5" : ""}`} onClick={() => setSelectedInvoice(inv.id)}>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={bulk.isSelected(inv.id)} onCheckedChange={() => bulk.toggleOne(inv.id)} />
                      </TableCell>
                      <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                      <TableCell>{inv.title || inv.description || "—"}</TableCell>
                      <TableCell>
                        {inv.companies
                          ? (language === "ar" ? inv.companies.name_ar || inv.companies.name : inv.companies.name)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[inv.status || "draft"]}>
                          {getStatusLabel(inv.status || "draft")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <AnimatedCounter value={Math.round(Number(inv.amount))} className="inline" format /> {inv.currency}
                      </TableCell>
                      <TableCell>
                        {inv.due_date ? format(new Date(inv.due_date), "MMM dd") : "—"}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
              <AdminEmptyState
                icon={FileText}
                title="No invoices found"
                titleAr="لا توجد فواتير"
                description="Try adjusting your filters or create a new invoice"
                descriptionAr="جرب تعديل الفلاتر أو أنشئ فاتورة جديدة"
                actionLabel="New Invoice"
                actionLabelAr="فاتورة جديدة"
                onAction={() => setShowForm(true)}
              />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
