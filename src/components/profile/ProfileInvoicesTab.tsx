import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PrintableInvoice from "@/components/invoices/PrintableInvoice";
import { EmptyState } from "@/components/ui/empty-state";
import { StaggeredList } from "@/components/ui/staggered-list";
import {
  FileText, Search, Eye, Download, DollarSign, Clock,
  CheckCircle, XCircle, AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";

interface ProfileInvoicesTabProps {
  userId: string;
}

interface InvoiceItem {
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
}

const statusConfig: Record<string, { color: "default" | "destructive" | "outline" | "secondary"; icon: typeof CheckCircle }> = {
  draft: { color: "secondary", icon: FileText },
  pending: { color: "outline", icon: Clock },
  sent: { color: "outline", icon: Clock },
  paid: { color: "default", icon: CheckCircle },
  overdue: { color: "destructive", icon: AlertTriangle },
  cancelled: { color: "destructive", icon: XCircle },
};

export function ProfileInvoicesTab({ userId }: ProfileInvoicesTabProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["user-invoices", userId, searchQuery, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("invoices")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.or(`invoice_number.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`);
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
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
      if (error) throw error;
      return data;
    },
    enabled: !!selectedInvoiceId,
  });

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
    return isAr ? l.ar : l.en;
  };

  // Stats
  const totalAmount = invoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const paidAmount = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const pendingCount = invoices.filter((i) => ["pending", "sent"].includes(i.status || "")).length;

  const statCards = [
    {
      label: isAr ? "إجمالي الفواتير" : "Total Invoices",
      value: invoices.length,
      icon: FileText,
      color: "text-primary",
    },
    {
      label: isAr ? "قيد الانتظار" : "Pending",
      value: pendingCount,
      icon: Clock,
      color: "text-chart-4",
    },
    {
      label: isAr ? "المبلغ المدفوع" : "Paid Amount",
      value: `${paidAmount.toLocaleString()} SAR`,
      icon: CheckCircle,
      color: "text-chart-2",
    },
    {
      label: isAr ? "المبلغ الإجمالي" : "Total Amount",
      value: `${totalAmount.toLocaleString()} SAR`,
      icon: DollarSign,
      color: "text-chart-1",
    },
  ];

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
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-muted ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-bold">{stat.value}</p>
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
                <SelectItem value="draft">{isAr ? "مسودة" : "Draft"}</SelectItem>
                <SelectItem value="pending">{isAr ? "قيد الانتظار" : "Pending"}</SelectItem>
                <SelectItem value="sent">{isAr ? "مرسلة" : "Sent"}</SelectItem>
                <SelectItem value="paid">{isAr ? "مدفوعة" : "Paid"}</SelectItem>
                <SelectItem value="overdue">{isAr ? "متأخرة" : "Overdue"}</SelectItem>
                <SelectItem value="cancelled">{isAr ? "ملغاة" : "Cancelled"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {invoices.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={isAr ? "لا توجد فواتير" : "No Invoices"}
              description={isAr ? "ستظهر فواتيرك هنا عند إصدارها من قبل الإدارة" : "Your invoices will appear here when issued by the administration"}
            />
          ) : (
            <div className="rounded-lg border overflow-hidden">
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
                    return (
                      <TableRow key={inv.id} className="cursor-pointer hover:bg-accent/30" onClick={() => setSelectedInvoiceId(inv.id)}>
                        <TableCell className="font-mono text-sm font-medium">
                          {inv.invoice_number}
                        </TableCell>
                        <TableCell className="max-w-48 truncate">
                          {isAr ? (inv.title_ar || inv.title || "—") : (inv.title || "—")}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={cfg.color} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {getStatusLabel(inv.status || "draft")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-end font-medium">
                          {Number(inv.amount).toLocaleString()} {inv.currency}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
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
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {selectedInvoice?.invoice_number}
            </DialogTitle>
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
}
