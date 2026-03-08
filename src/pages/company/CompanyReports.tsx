import { useState, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currencyFormatter";
import {
  Download, FileText, ShoppingCart, BarChart3, Calendar, Filter,
  TrendingUp, TrendingDown, DollarSign, FileSpreadsheet,
} from "lucide-react";

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const bom = "\uFEFF";
  const csv = bom + [headers.join(","), ...rows.map(r => r.map(c => `"${(c || "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CompanyReports() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { companyId } = useCompanyAccess();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [orderStatus, setOrderStatus] = useState("all");
  const [invoiceStatus, setInvoiceStatus] = useState("all");
  const [txnType, setTxnType] = useState("all");

  // Fetch orders
  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["company-report-orders", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("company_orders")
        .select("order_number, title, direction, category, status, total_amount, currency, order_date, delivery_date, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch invoices
  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ["company-report-invoices", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("invoices")
        .select("invoice_number, title, status, amount, subtotal, tax_amount, discount_amount, currency, due_date, paid_at, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch transactions
  const { data: transactions = [], isLoading: loadingTxns } = useQuery({
    queryKey: ["company-report-transactions", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("company_transactions")
        .select("transaction_number, type, amount, currency, description, payment_method, transaction_date, created_at, is_reconciled")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  // Filter helpers
  const filterByDate = <T extends { created_at?: string | null }>(items: T[]) => {
    return items.filter(item => {
      const d = item.created_at?.split("T")[0] || "";
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      return true;
    });
  };

  const filteredOrders = filterByDate(orders).filter(o => orderStatus === "all" || (o as any).status === orderStatus);
  const filteredInvoices = filterByDate(invoices).filter(i => invoiceStatus === "all" || (i as any).status === invoiceStatus);
  const filteredTxns = filterByDate(transactions).filter(t => txnType === "all" || (t as any).type === txnType);

  // Summary KPIs
  const totalOrders = filteredOrders.length;
  const totalOrderValue = filteredOrders.reduce((s, o: any) => s + (o.total_amount || 0), 0);
  const totalInvoiced = filteredInvoices.reduce((s, i: any) => s + (i.amount || 0), 0);
  const totalPaid = filteredInvoices.filter((i: any) => i.status === "paid").reduce((s, i: any) => s + (i.amount || 0), 0);
  const totalPending = totalInvoiced - totalPaid;
  const totalCredits = filteredTxns.filter((t: any) => ["payment", "credit", "refund"].includes(t.type)).reduce((s, t: any) => s + (t.amount || 0), 0);
  const totalDebits = filteredTxns.filter((t: any) => ["invoice", "debit"].includes(t.type)).reduce((s, t: any) => s + (t.amount || 0), 0);

  // Export functions
  const exportOrders = () => {
    const headers = ["Order #", "Title", "Direction", "Category", "Status", "Total", "Currency", "Order Date", "Delivery Date", "Created"];
    const rows = filteredOrders.map((o: any) => [
      o.order_number, o.title, o.direction, o.category, o.status,
      String(o.total_amount || 0), o.currency, o.order_date || "", o.delivery_date || "",
      o.created_at?.split("T")[0] || "",
    ]);
    downloadCSV(`orders_${new Date().toISOString().split("T")[0]}.csv`, headers, rows);
    toast({ title: isAr ? "تم تصدير الطلبات" : "Orders exported" });
  };

  const exportInvoices = () => {
    const headers = ["Invoice #", "Title", "Status", "Subtotal", "Tax", "Discount", "Total", "Currency", "Due Date", "Paid At", "Created"];
    const rows = filteredInvoices.map((i: any) => [
      i.invoice_number, i.title, i.status,
      String(i.subtotal || 0), String(i.tax_amount || 0), String(i.discount_amount || 0),
      String(i.amount || 0), i.currency, i.due_date || "", i.paid_at?.split("T")[0] || "",
      i.created_at?.split("T")[0] || "",
    ]);
    downloadCSV(`invoices_${new Date().toISOString().split("T")[0]}.csv`, headers, rows);
    toast({ title: isAr ? "تم تصدير الفواتير" : "Invoices exported" });
  };

  const exportTransactions = () => {
    const headers = ["Txn #", "Type", "Amount", "Currency", "Description", "Payment Method", "Reconciled", "Date", "Created"];
    const rows = filteredTxns.map((t: any) => [
      t.transaction_number, t.type, String(t.amount || 0), t.currency, t.description,
      t.payment_method || "", t.is_reconciled ? "Yes" : "No",
      t.transaction_date?.split("T")[0] || "", t.created_at?.split("T")[0] || "",
    ]);
    downloadCSV(`transactions_${new Date().toISOString().split("T")[0]}.csv`, headers, rows);
    toast({ title: isAr ? "تم تصدير المعاملات" : "Transactions exported" });
  };

  const isLoading = loadingOrders || loadingInvoices || loadingTxns;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          {isAr ? "التقارير والتصدير" : "Reports & Exports"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {isAr ? "عرض وتصدير بيانات الطلبات والفواتير والمعاملات" : "View and export orders, invoices, and transactions data"}
        </p>
      </div>

      {/* Date Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{isAr ? "الفترة:" : "Period:"}</span>
          </div>
          <div>
            <Label className="text-xs">{isAr ? "من" : "From"}</Label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" />
          </div>
          <div>
            <Label className="text-xs">{isAr ? "إلى" : "To"}</Label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" />
          </div>
          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); }}>
              {isAr ? "مسح" : "Clear"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Summary KPIs */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: ShoppingCart, label: isAr ? "الطلبات" : "Orders", value: `${totalOrders}`, sub: formatCurrency(totalOrderValue, language as "en" | "ar"), color: "text-primary" },
            { icon: FileText, label: isAr ? "الفواتير" : "Invoiced", value: formatCurrency(totalInvoiced, language as "en" | "ar"), sub: `${filteredInvoices.length} ${isAr ? "فاتورة" : "invoices"}`, color: "text-chart-1" },
            { icon: TrendingUp, label: isAr ? "المدفوع" : "Paid", value: formatCurrency(totalPaid, language as "en" | "ar"), sub: isAr ? "مسدد" : "Settled", color: "text-chart-2" },
            { icon: TrendingDown, label: isAr ? "المعلق" : "Pending", value: formatCurrency(totalPending, language as "en" | "ar"), sub: isAr ? "غير مسدد" : "Outstanding", color: "text-warning" },
          ].map(k => (
            <Card key={k.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted ${k.color}`}>
                  <k.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">{k.label}</p>
                  <p className="text-lg font-bold">{k.value}</p>
                  <p className="text-[10px] text-muted-foreground">{k.sub}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders" className="gap-1"><ShoppingCart className="h-3.5 w-3.5" />{isAr ? "الطلبات" : "Orders"}</TabsTrigger>
          <TabsTrigger value="invoices" className="gap-1"><FileText className="h-3.5 w-3.5" />{isAr ? "الفواتير" : "Invoices"}</TabsTrigger>
          <TabsTrigger value="transactions" className="gap-1"><DollarSign className="h-3.5 w-3.5" />{isAr ? "المعاملات" : "Transactions"}</TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={orderStatus} onValueChange={setOrderStatus}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                  <SelectItem value="pending">{isAr ? "معلق" : "Pending"}</SelectItem>
                  <SelectItem value="approved">{isAr ? "موافق" : "Approved"}</SelectItem>
                  <SelectItem value="processing">{isAr ? "قيد التنفيذ" : "Processing"}</SelectItem>
                  <SelectItem value="completed">{isAr ? "مكتمل" : "Completed"}</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="secondary">{filteredOrders.length}</Badge>
            </div>
            <Button variant="outline" className="gap-2" onClick={exportOrders} disabled={filteredOrders.length === 0}>
              <Download className="h-4 w-4" />
              {isAr ? "تصدير CSV" : "Export CSV"}
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-start font-medium">#</th>
                      <th className="p-3 text-start font-medium">{isAr ? "العنوان" : "Title"}</th>
                      <th className="p-3 text-start font-medium">{isAr ? "الحالة" : "Status"}</th>
                      <th className="p-3 text-end font-medium">{isAr ? "المبلغ" : "Amount"}</th>
                      <th className="p-3 text-start font-medium">{isAr ? "التاريخ" : "Date"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">{isAr ? "لا توجد طلبات" : "No orders"}</td></tr>
                    ) : filteredOrders.slice(0, 50).map((o: any) => (
                      <tr key={o.order_number} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-3 font-mono text-xs">{o.order_number}</td>
                        <td className="p-3">{o.title}</td>
                        <td className="p-3"><Badge variant="outline" className="text-[10px]">{o.status}</Badge></td>
                        <td className="p-3 text-end font-medium">{formatCurrency(o.total_amount || 0, language as "en" | "ar")}</td>
                        <td className="p-3 text-xs text-muted-foreground">{o.order_date || o.created_at?.split("T")[0]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={invoiceStatus} onValueChange={setInvoiceStatus}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                  <SelectItem value="draft">{isAr ? "مسودة" : "Draft"}</SelectItem>
                  <SelectItem value="sent">{isAr ? "مرسلة" : "Sent"}</SelectItem>
                  <SelectItem value="paid">{isAr ? "مدفوعة" : "Paid"}</SelectItem>
                  <SelectItem value="overdue">{isAr ? "متأخرة" : "Overdue"}</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="secondary">{filteredInvoices.length}</Badge>
            </div>
            <Button variant="outline" className="gap-2" onClick={exportInvoices} disabled={filteredInvoices.length === 0}>
              <Download className="h-4 w-4" />
              {isAr ? "تصدير CSV" : "Export CSV"}
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-start font-medium">#</th>
                      <th className="p-3 text-start font-medium">{isAr ? "العنوان" : "Title"}</th>
                      <th className="p-3 text-start font-medium">{isAr ? "الحالة" : "Status"}</th>
                      <th className="p-3 text-end font-medium">{isAr ? "المبلغ" : "Amount"}</th>
                      <th className="p-3 text-start font-medium">{isAr ? "الاستحقاق" : "Due"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">{isAr ? "لا توجد فواتير" : "No invoices"}</td></tr>
                    ) : filteredInvoices.slice(0, 50).map((i: any) => (
                      <tr key={i.invoice_number} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-3 font-mono text-xs">{i.invoice_number}</td>
                        <td className="p-3">{i.title}</td>
                        <td className="p-3"><Badge variant="outline" className={`text-[10px] ${i.status === "paid" ? "text-chart-2" : i.status === "overdue" ? "text-destructive" : ""}`}>{i.status}</Badge></td>
                        <td className="p-3 text-end font-medium">{formatCurrency(i.amount || 0, language as "en" | "ar")}</td>
                        <td className="p-3 text-xs text-muted-foreground">{i.due_date || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={txnType} onValueChange={setTxnType}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                  <SelectItem value="payment">{isAr ? "دفع" : "Payment"}</SelectItem>
                  <SelectItem value="invoice">{isAr ? "فاتورة" : "Invoice"}</SelectItem>
                  <SelectItem value="credit">{isAr ? "إيداع" : "Credit"}</SelectItem>
                  <SelectItem value="debit">{isAr ? "خصم" : "Debit"}</SelectItem>
                  <SelectItem value="refund">{isAr ? "استرجاع" : "Refund"}</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="secondary">{filteredTxns.length}</Badge>
            </div>
            <Button variant="outline" className="gap-2" onClick={exportTransactions} disabled={filteredTxns.length === 0}>
              <Download className="h-4 w-4" />
              {isAr ? "تصدير CSV" : "Export CSV"}
            </Button>
          </div>

          {/* Credits/Debits summary */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-s-[3px] border-s-chart-2">
              <CardContent className="p-4 flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-chart-2" />
                <div>
                  <p className="text-xs text-muted-foreground">{isAr ? "إجمالي الإيداعات" : "Total Credits"}</p>
                  <p className="text-lg font-bold">{formatCurrency(totalCredits, language as "en" | "ar")}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-s-[3px] border-s-destructive">
              <CardContent className="p-4 flex items-center gap-3">
                <TrendingDown className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-xs text-muted-foreground">{isAr ? "إجمالي الخصومات" : "Total Debits"}</p>
                  <p className="text-lg font-bold">{formatCurrency(totalDebits, language as "en" | "ar")}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-start font-medium">#</th>
                      <th className="p-3 text-start font-medium">{isAr ? "النوع" : "Type"}</th>
                      <th className="p-3 text-start font-medium">{isAr ? "الوصف" : "Description"}</th>
                      <th className="p-3 text-end font-medium">{isAr ? "المبلغ" : "Amount"}</th>
                      <th className="p-3 text-start font-medium">{isAr ? "التاريخ" : "Date"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTxns.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">{isAr ? "لا توجد معاملات" : "No transactions"}</td></tr>
                    ) : filteredTxns.slice(0, 50).map((t: any) => {
                      const isCredit = ["payment", "credit", "refund"].includes(t.type);
                      return (
                        <tr key={t.transaction_number} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-3 font-mono text-xs">{t.transaction_number}</td>
                          <td className="p-3"><Badge variant="outline" className={`text-[10px] ${isCredit ? "text-chart-2" : "text-destructive"}`}>{t.type}</Badge></td>
                          <td className="p-3 text-muted-foreground truncate max-w-[200px]">{isAr ? t.description_ar || t.description : t.description}</td>
                          <td className={`p-3 text-end font-medium ${isCredit ? "text-chart-2" : "text-destructive"}`}>
                            {isCredit ? "+" : "−"}{formatCurrency(t.amount || 0, language as "en" | "ar")}
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">{t.transaction_date?.split("T")[0] || t.created_at?.split("T")[0]}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
