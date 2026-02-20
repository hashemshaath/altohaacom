import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import PrintableInvoice from "@/components/invoices/PrintableInvoice";
import {
  FileText,
  ChevronLeft,
  DollarSign,
  Clock,
  CheckCircle,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

interface InvoiceItem {
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
}

export default function CompanyInvoices() {
  const { language } = useLanguage();
  const { companyId, isLoading: accessLoading } = useCompanyAccess();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["company-invoices", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const selectedInvoice = invoices.find((i) => i.id === selectedId);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20">{getStatusLabel(status)}</Badge>;
      case "sent":
      case "pending":
        return <Badge className="bg-chart-4/10 text-chart-4 border-chart-4/20">{getStatusLabel(status)}</Badge>;
      case "overdue":
      case "cancelled":
        return <Badge variant="destructive">{getStatusLabel(status)}</Badge>;
      default:
        return <Badge variant="secondary">{getStatusLabel(status)}</Badge>;
    }
  };

  const stats = {
    total: invoices.length,
    pending: invoices.filter((i) => ["pending", "sent"].includes(i.status || "")).length,
    paid: invoices.filter((i) => i.status === "paid").length,
    totalDue: invoices
      .filter((i) => ["pending", "sent"].includes(i.status || ""))
      .reduce((sum, i) => sum + Number(i.amount), 0),
  };

  if (accessLoading || isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  // Detail view
  if (selectedInvoice) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{selectedInvoice.invoice_number}</h1>
            <p className="text-muted-foreground">{selectedInvoice.title}</p>
          </div>
          {getStatusBadge(selectedInvoice.status || "draft")}
        </div>

        <PrintableInvoice
          invoice={selectedInvoice}
          company={null}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          {language === "ar" ? "الفواتير" : "Invoices"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {language === "ar" ? "عرض جميع الفواتير المتعلقة بالشركة" : "View all invoices related to your company"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-s-[3px] border-s-primary">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{language === "ar" ? "إجمالي الفواتير" : "Total Invoices"}</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-s-[3px] border-s-chart-4">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-chart-4/10 p-2.5">
              <Clock className="h-5 w-5 text-chart-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{language === "ar" ? "قيد الانتظار" : "Pending"}</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-s-[3px] border-s-destructive">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-destructive/10 p-2.5">
              <CreditCard className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{language === "ar" ? "المستحق" : "Outstanding"}</p>
              <p className="text-2xl font-bold">{stats.totalDue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>{language === "ar" ? "قائمة الفواتير" : "Invoice List"}</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "ar" ? "رقم الفاتورة" : "Invoice #"}</TableHead>
                    <TableHead>{language === "ar" ? "العنوان" : "Title"}</TableHead>
                    <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                    <TableHead className="text-end">{language === "ar" ? "المبلغ" : "Amount"}</TableHead>
                    <TableHead>{language === "ar" ? "الاستحقاق" : "Due"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedId(inv.id)}>
                      <TableCell className="font-mono text-sm font-medium">{inv.invoice_number}</TableCell>
                      <TableCell className="font-medium">{inv.title || inv.description || "—"}</TableCell>
                      <TableCell>{getStatusBadge(inv.status || "draft")}</TableCell>
                      <TableCell className="text-end font-medium">
                        {Number(inv.amount).toLocaleString()} {inv.currency}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {inv.due_date ? format(new Date(inv.due_date), "MMM dd, yyyy") : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-3">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                {language === "ar" ? "لا توجد فواتير حتى الآن" : "No invoices yet"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
