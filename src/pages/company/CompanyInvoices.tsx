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
import { FileText, ChevronLeft, DollarSign, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

interface InvoiceItem {
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
}

const statusColors: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
  draft: "secondary",
  pending: "outline",
  sent: "outline",
  paid: "default",
  overdue: "destructive",
  cancelled: "destructive",
};

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
        <div className="grid gap-4 sm:grid-cols-3"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  // Detail view
  if (selectedInvoice) {
    const items = (selectedInvoice.items || []) as unknown as InvoiceItem[];
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{selectedInvoice.invoice_number}</h1>
            <p className="text-muted-foreground">{selectedInvoice.title}</p>
          </div>
          <Badge variant={statusColors[selectedInvoice.status || "draft"]} className="ms-auto">
            {getStatusLabel(selectedInvoice.status || "draft")}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{language === "ar" ? "تفاصيل الفاتورة" : "Invoice Details"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">{language === "ar" ? "تاريخ الإنشاء" : "Created"}</p>
                <p className="font-medium">{format(new Date(selectedInvoice.created_at), "yyyy-MM-dd")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{language === "ar" ? "تاريخ الاستحقاق" : "Due Date"}</p>
                <p className="font-medium">{selectedInvoice.due_date ? format(new Date(selectedInvoice.due_date), "yyyy-MM-dd") : "—"}</p>
              </div>
            </div>

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
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">{Number(item.unit_price).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-medium">{(item.quantity * item.unit_price).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex justify-end">
                  <div className="w-64 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{language === "ar" ? "المجموع الفرعي" : "Subtotal"}</span>
                      <span>{Number(selectedInvoice.subtotal).toLocaleString()}</span>
                    </div>
                    {Number(selectedInvoice.tax_amount) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{language === "ar" ? "الضريبة" : "Tax"} ({selectedInvoice.tax_rate}%)</span>
                        <span>{Number(selectedInvoice.tax_amount).toLocaleString()}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-base">
                      <span>{language === "ar" ? "الإجمالي" : "Total"}</span>
                      <span>{Number(selectedInvoice.amount).toLocaleString()} {selectedInvoice.currency}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {selectedInvoice.paid_at && (
              <>
                <Separator />
                <div className="flex items-center gap-2 text-sm text-primary">
                  <CheckCircle className="h-4 w-4" />
                  {language === "ar" ? "تم الدفع بتاريخ" : "Paid on"} {format(new Date(selectedInvoice.paid_at), "yyyy-MM-dd")}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{language === "ar" ? "الفواتير" : "Invoices"}</h1>
        <p className="mt-2 text-muted-foreground">
          {language === "ar" ? "عرض جميع الفواتير المتعلقة بالشركة" : "View all invoices related to your company"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">{language === "ar" ? "إجمالي الفواتير" : "Total Invoices"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Clock className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-2xl font-bold">{stats.pending}</p>
            <p className="text-sm text-muted-foreground">{language === "ar" ? "قيد الانتظار" : "Pending"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <DollarSign className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-2xl font-bold">{stats.totalDue.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">{language === "ar" ? "المستحق" : "Outstanding"}</p>
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
                    <TableHead className="text-right">{language === "ar" ? "المبلغ" : "Amount"}</TableHead>
                    <TableHead>{language === "ar" ? "الاستحقاق" : "Due"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id} className="cursor-pointer" onClick={() => setSelectedId(inv.id)}>
                      <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                      <TableCell>{inv.title || inv.description || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={statusColors[inv.status || "draft"]}>
                          {getStatusLabel(inv.status || "draft")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {Number(inv.amount).toLocaleString()} {inv.currency}
                      </TableCell>
                      <TableCell>
                        {inv.due_date ? format(new Date(inv.due_date), "MMM dd, yyyy") : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
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
