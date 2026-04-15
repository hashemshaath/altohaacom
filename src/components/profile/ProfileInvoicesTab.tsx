import { useIsAr } from "@/hooks/useIsAr";
import { useState, memo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PrintableInvoice from "@/components/invoices/PrintableInvoice";
import { EmptyState } from "@/components/ui/empty-state";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { StaggeredList } from "@/components/ui/staggered-list";
import {
  FileText, Search, Eye, DollarSign, Clock,
  CheckCircle, XCircle, AlertTriangle, RotateCcw, Ban, Printer,
} from "lucide-react";
import { format } from "date-fns";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

interface ProfileInvoicesTabProps {
  userId: string;
}

const statusConfig: Record<string, { color: "default" | "destructive" | "outline" | "secondary"; icon: typeof CheckCircle; bg: string }> = {
  draft: { color: "secondary", icon: FileText, bg: "bg-muted" },
  pending: { color: "outline", icon: Clock, bg: "bg-chart-4/10" },
  sent: { color: "outline", icon: Clock, bg: "bg-chart-4/10" },
  paid: { color: "default", icon: CheckCircle, bg: "bg-chart-2/10" },
  overdue: { color: "destructive", icon: AlertTriangle, bg: "bg-destructive/10" },
  cancelled: { color: "destructive", icon: XCircle, bg: "bg-destructive/10" },
  void: { color: "secondary", icon: Ban, bg: "bg-muted" },
  refunded: { color: "outline", icon: RotateCcw, bg: "bg-chart-3/10" },
  partially_refunded: { color: "outline", icon: RotateCcw, bg: "bg-chart-3/10" },
};

const statusLabels: Record<string, { en: string; ar: string }> = {
  draft: { en: "Draft", ar: "مسودة" },
  pending: { en: "Pending", ar: "قيد الانتظار" },
  sent: { en: "Sent", ar: "مرسلة" },
  paid: { en: "Paid", ar: "مدفوعة" },
  overdue: { en: "Overdue", ar: "متأخرة" },
  cancelled: { en: "Cancelled", ar: "ملغاة" },
  void: { en: "Void", ar: "ملغاة" },
  refunded: { en: "Refunded", ar: "مستردة" },
  partially_refunded: { en: "Partial Refund", ar: "استرداد جزئي" },
};

export const ProfileInvoicesTab = memo(function ProfileInvoicesTab({ userId }: ProfileInvoicesTabProps) {
  const isAr = useIsAr();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["user-invoices", userId, searchQuery, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("invoices")
        .select("id, invoice_number, title, title_ar, amount, currency, status, due_date, paid_at, created_at, company_id, items, subtotal, tax_amount, discount_amount")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.or(`invoice_number.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`);
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query.limit(50);
      if (error) throw handleSupabaseError(error);
      return data;
    },
  });

  const { data: selectedInvoice } = useQuery({
    queryKey: ["user-invoice-detail", selectedInvoiceId],
    queryFn: async () => {
      if (!selectedInvoiceId) return null;
      const { data, error } = await supabase
        .from("invoices")
        .select("*, companies:company_id (id, name, name_ar, email, phone, address)")
        .eq("id", selectedInvoiceId)
        .single();
      if (error) throw handleSupabaseError(error);
      return data;
    },
    enabled: !!selectedInvoiceId,
  });

  const getStatusLabel = useCallback((status: string) => {
    const l = statusLabels[status] || statusLabels.draft;
    return isAr ? l.ar : l.en;
  }, [isAr]);

  // Stats
  const totalAmount = invoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const paidAmount = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const pendingAmount = invoices.filter((i) => ["pending", "sent"].includes(i.status || "")).reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const refundedAmount = invoices.filter((i) => ["refunded", "partially_refunded"].includes(i.status || "")).reduce((sum, i) => sum + Number(i.amount || 0), 0);

  const statCards = [
    { label: isAr ? "إجمالي الفواتير" : "Total Invoices", value: invoices.length, icon: FileText, color: "text-primary", bg: "bg-primary/10", isCurrency: false },
    { label: isAr ? "المدفوعة" : "Paid", value: paidAmount, icon: CheckCircle, color: "text-chart-2", bg: "bg-chart-2/10", isCurrency: true },
    { label: isAr ? "قيد الانتظار" : "Pending", value: pendingAmount, icon: Clock, color: "text-chart-4", bg: "bg-chart-4/10", isCurrency: true },
    { label: isAr ? "المستردة" : "Refunded", value: refundedAmount, icon: RotateCcw, color: "text-chart-3", bg: "bg-chart-3/10", isCurrency: true },
  ];

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <StaggeredList className="space-y-6" stagger={80}>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-bold">
                    <AnimatedCounter value={typeof stat.value === "number" ? Math.round(stat.value) : 0} className="inline" />
                    {stat.isCurrency ? " SAR" : ""}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" />
            {isAr ? "فواتيري" : "My Invoices"}
          </CardTitle>
          <CardDescription>
            {isAr ? "عرض وتحميل فواتيرك" : "View and download your invoices"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isAr ? "بحث بالرقم أو العنوان..." : "Search by number or title..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder={isAr ? "الحالة" : "Status"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{isAr ? label.ar : label.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {invoices.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={isAr ? "لا توجد فواتير" : "No Invoices"}
              description={isAr ? "ستظهر فواتيرك هنا عند إصدارها" : "Your invoices will appear here when issued"}
            />
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? "رقم الفاتورة" : "Invoice #"}</TableHead>
                    <TableHead>{isAr ? "العنوان" : "Title"}</TableHead>
                    <TableHead className="text-center">{isAr ? "الحالة" : "Status"}</TableHead>
                    <TableHead className="text-end">{isAr ? "المبلغ" : "Amount"}</TableHead>
                    <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                    <TableHead className="text-center">{isAr ? "إجراءات" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => {
                    const cfg = statusConfig[inv.status || "draft"] || statusConfig.draft;
                    const StatusIcon = cfg.icon;
                    const hasDiscount = Number(inv.discount_amount || 0) > 0;
                    return (
                      <TableRow key={inv.id} className="cursor-pointer hover:bg-accent/30" onClick={() => setSelectedInvoiceId(inv.id)}>
                        <TableCell className="font-mono text-sm font-medium" dir="ltr">
                          {inv.invoice_number}
                        </TableCell>
                        <TableCell className="max-w-48 truncate">
                          <div>
                            {isAr ? (inv.title_ar || inv.title || "—") : (inv.title || "—")}
                            {hasDiscount && (
                              <Badge variant="secondary" className="ms-1.5 text-xs px-1.5 py-0">
                                {isAr ? "خصم" : "Discount"}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={cfg.color} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {getStatusLabel(inv.status || "draft")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-end font-medium" dir="ltr">
                          <div className="flex flex-col items-end">
                            <span>
                              <AnimatedCounter value={Math.round(Number(inv.amount))} className="inline" /> {inv.currency}
                            </span>
                            {Number(inv.tax_amount || 0) > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {isAr ? "شامل الضريبة" : "incl. tax"} {Number(inv.tax_amount).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground" dir="ltr">
                          {format(new Date(inv.created_at), "yyyy-MM-dd")}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInvoiceId(inv.id);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Detail Dialog */}
      <Dialog open={!!selectedInvoiceId && !!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoiceId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {selectedInvoice?.invoice_number}
              </DialogTitle>
              <Button variant="outline" size="sm" className="gap-1.5 print:hidden" onClick={handlePrint}>
                <Printer className="h-3.5 w-3.5" />
                {isAr ? "طباعة" : "Print"}
              </Button>
            </div>
          </DialogHeader>
          {selectedInvoice && (
            <PrintableInvoice
              invoice={{
                invoice_number: selectedInvoice.invoice_number,
                title: selectedInvoice.title,
                title_ar: selectedInvoice.title_ar,
                description: selectedInvoice.description,
                description_ar: selectedInvoice.description_ar,
                currency: selectedInvoice.currency || "SAR",
                subtotal: selectedInvoice.subtotal,
                tax_rate: selectedInvoice.tax_rate,
                tax_amount: selectedInvoice.tax_amount,
                amount: selectedInvoice.amount,
                status: selectedInvoice.status,
                created_at: selectedInvoice.created_at,
                due_date: selectedInvoice.due_date,
                paid_at: selectedInvoice.paid_at,
                payment_method: selectedInvoice.payment_method,
                payment_reference: selectedInvoice.payment_reference,
                notes: selectedInvoice.notes,
                notes_ar: selectedInvoice.notes_ar,
                items: selectedInvoice.items,
              }}
              company={selectedInvoice.companies ? {
                name: selectedInvoice.companies.name,
                name_ar: selectedInvoice.companies.name_ar,
                email: selectedInvoice.companies.email,
                phone: selectedInvoice.companies.phone,
                address: selectedInvoice.companies.address,
              } : null}
              showPrintButton={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </StaggeredList>
  );
});
