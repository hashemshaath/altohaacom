import { useState, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  FileText, Search, Download, Clock, CheckCircle2, XCircle,
  Receipt, AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { useCSVExport } from "@/hooks/useCSVExport";

const MembershipInvoicesTab = memo(function MembershipInvoicesTab() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: invoiceStats } = useQuery({
    queryKey: ["membership-invoice-stats"],
    queryFn: async () => {
      const { data } = await supabase
        .from("invoices")
        .select("status, amount");

      const total = data?.length || 0;
      const paid = data?.filter(i => i.status === "paid") || [];
      const pending = data?.filter(i => i.status === "pending") || [];
      const overdue = data?.filter(i => i.status === "overdue") || [];

      return {
        total,
        paidAmount: paid.reduce((s, i) => s + (i.amount || 0), 0),
        pendingAmount: pending.reduce((s, i) => s + (i.amount || 0), 0),
        overdueCount: overdue.length,
      };
    },
  });

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["membership-invoices", search, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("invoices")
        .select("id, invoice_number, user_id, amount, currency, status, title, title_ar, due_date, paid_at, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      if (search) query = query.ilike("invoice_number", `%${search}%`);

      const { data } = await query;
      return data || [];
    },
  });

  const { exportCSV } = useCSVExport({
    columns: [
      { header: isAr ? "رقم الفاتورة" : "Invoice #", accessor: (r: any) => r.invoice_number || "" },
      { header: isAr ? "المبلغ" : "Amount", accessor: (r: any) => r.amount || 0 },
      { header: isAr ? "العملة" : "Currency", accessor: (r: any) => r.currency || "SAR" },
      { header: isAr ? "الحالة" : "Status", accessor: (r: any) => r.status || "" },
      { header: isAr ? "التاريخ" : "Date", accessor: (r: any) => r.created_at ? format(new Date(r.created_at), "yyyy-MM-dd") : "" },
    ],
    filename: "membership-invoices",
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "paid": return <Badge variant="default" className="gap-1 text-xs"><CheckCircle2 className="h-3 w-3" />{isAr ? "مدفوعة" : "Paid"}</Badge>;
      case "pending": return <Badge variant="secondary" className="gap-1 text-xs"><Clock className="h-3 w-3" />{isAr ? "معلقة" : "Pending"}</Badge>;
      case "overdue": return <Badge variant="destructive" className="gap-1 text-xs"><AlertTriangle className="h-3 w-3" />{isAr ? "متأخرة" : "Overdue"}</Badge>;
      case "void": return <Badge variant="outline" className="gap-1 text-xs"><XCircle className="h-3 w-3" />{isAr ? "ملغاة" : "Void"}</Badge>;
      default: return <Badge variant="outline" className="text-xs">{status || "N/A"}</Badge>;
    }
  };

  const statCards = [
    { icon: Receipt, label: isAr ? "إجمالي الفواتير" : "Total Invoices", value: invoiceStats?.total || 0, color: "text-primary" },
    { icon: CheckCircle2, label: isAr ? "المبلغ المحصّل" : "Collected", value: invoiceStats?.paidAmount || 0, suffix: " SAR", color: "text-chart-2" },
    { icon: Clock, label: isAr ? "قيد الانتظار" : "Pending", value: invoiceStats?.pendingAmount || 0, suffix: " SAR", color: "text-chart-4" },
    { icon: AlertTriangle, label: isAr ? "فواتير متأخرة" : "Overdue", value: invoiceStats?.overdueCount || 0, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(card => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1">
                <AnimatedCounter value={card.value} className="text-2xl" />
                {card.suffix && <span className="text-sm text-muted-foreground">{card.suffix}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {isAr ? "فواتير العضويات" : "Membership Invoices"}
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-48">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={isAr ? "رقم الفاتورة..." : "Invoice #..."}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="ps-9 h-8 text-xs"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                  <SelectItem value="paid">{isAr ? "مدفوعة" : "Paid"}</SelectItem>
                  <SelectItem value="pending">{isAr ? "معلقة" : "Pending"}</SelectItem>
                  <SelectItem value="overdue">{isAr ? "متأخرة" : "Overdue"}</SelectItem>
                  <SelectItem value="void">{isAr ? "ملغاة" : "Void"}</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => invoices && exportCSV(invoices)}>
                <Download className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs">{isAr ? "رقم الفاتورة" : "Invoice #"}</TableHead>
                    <TableHead className="text-xs">{isAr ? "العنوان" : "Title"}</TableHead>
                    <TableHead className="text-xs text-end">{isAr ? "المبلغ" : "Amount"}</TableHead>
                    <TableHead className="text-xs">{isAr ? "الحالة" : "Status"}</TableHead>
                    <TableHead className="text-xs">{isAr ? "الاستحقاق" : "Due"}</TableHead>
                    <TableHead className="text-xs">{isAr ? "التاريخ" : "Created"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices?.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                      <TableCell className="text-sm truncate max-w-[200px]">
                        {isAr ? (inv.title_ar || inv.title || "—") : (inv.title || "—")}
                      </TableCell>
                      <TableCell className="text-end font-medium tabular-nums">
                        {(inv.amount || 0).toFixed(2)}
                        <span className="text-xs text-muted-foreground ms-1">{inv.currency || "SAR"}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(inv.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {inv.due_date ? format(new Date(inv.due_date), "MMM d, yyyy") : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(inv.created_at), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!invoices?.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {isAr ? "لا توجد فواتير" : "No invoices found"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

export default MembershipInvoicesTab;
