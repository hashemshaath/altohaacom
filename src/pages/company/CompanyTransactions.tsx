import { useState } from "react";
import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowUpDown, Search, Receipt, CheckCircle, Clock, Download, CalendarIcon, Filter,
} from "lucide-react";
import { format, startOfMonth, subMonths } from "date-fns";
import { cn } from "@/lib/utils";

export default function CompanyTransactions() {
  const { language } = useLanguage();
  const { companyId } = useCompanyAccess();
  const { toast } = useToast();
  const isAr = language === "ar";

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(startOfMonth(subMonths(new Date(), 3)));
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["companyTransactions", companyId, dateFrom?.toISOString(), dateTo?.toISOString()],
    queryFn: async () => {
      if (!companyId) return [];
      let query = supabase
        .from("company_transactions")
        .select("id, company_id, type, amount, currency, description, description_ar, transaction_number, transaction_date, invoice_id, balance_after, is_reconciled, created_at")
        .eq("company_id", companyId)
        .order("transaction_date", { ascending: false });

      if (dateFrom) query = query.gte("transaction_date", dateFrom.toISOString());
      if (dateTo) query = query.lte("transaction_date", dateTo.toISOString());

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const filtered = transactions.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch = !search ||
      (t.description || "").toLowerCase().includes(q) ||
      t.transaction_number.toLowerCase().includes(q);
    const matchesType = typeFilter === "all" || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalCredits = filtered
    .filter((t) => ["payment", "credit", "refund"].includes(t.type))
    .reduce((s, t) => s + (t.amount || 0), 0);
  const totalDebits = filtered
    .filter((t) => ["invoice", "debit"].includes(t.type))
    .reduce((s, t) => s + (t.amount || 0), 0);
  const reconciledCount = filtered.filter((t) => t.is_reconciled).length;
  const pendingCount = filtered.length - reconciledCount;
  const currency = transactions[0]?.currency || "SAR";
  const typeOptions = [...new Set(transactions.map((t) => t.type))];

  const exportCSV = () => {
    if (filtered.length === 0) return;
    const BOM = "\uFEFF";
    const headers = ["Date", "Ref #", "Type", "Description", "Amount", "Balance After", "Status"];
    const rows = filtered.map((t) => {
      const isCredit = ["payment", "credit", "refund"].includes(t.type);
      return [
        t.transaction_date ? format(new Date(t.transaction_date), "yyyy-MM-dd") : "",
        t.transaction_number || "",
        t.type,
        `"${(isAr ? t.description_ar || t.description : t.description) || ""}"`,
        `${isCredit ? "" : "-"}${Math.abs(t.amount)}`,
        t.balance_after ?? "",
        t.is_reconciled ? "Reconciled" : "Pending",
      ].join(",");
    });
    const csv = BOM + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${format(new Date(), "yyyyMMdd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: isAr ? "تم تصدير المعاملات" : "Transactions exported" });
  };

  const DatePicker = ({ date, onSelect, label }: { date?: Date; onSelect: (d: Date | undefined) => void; label: string }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn("w-[140px] justify-start text-start font-normal", !date && "text-muted-foreground")}>
          <CalendarIcon className="me-2 h-3.5 w-3.5" />
          {date ? format(date, "MMM dd, yyyy") : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={onSelect} initialFocus className={cn("p-3 pointer-events-auto")} />
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ArrowUpDown className="h-6 w-6 text-primary" />
            {isAr ? "المعاملات" : "Transactions"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {isAr ? "سجل المعاملات المالية" : "Financial transaction records"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV} disabled={filtered.length === 0}>
          <Download className="me-2 h-4 w-4" />
          {isAr ? "تصدير CSV" : "Export CSV"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-s-[3px] border-s-primary">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "عدد المعاملات" : "Transactions"}</p>
              <AnimatedCounter value={filtered.length} className="text-2xl font-bold" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-s-[3px] border-s-chart-5">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-chart-5/10 p-2.5">
              <CheckCircle className="h-5 w-5 text-chart-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "إجمالي الإيرادات" : "Total Credits"}</p>
              <p className="text-2xl font-bold text-chart-5">{currency} <AnimatedCounter value={Math.round(totalCredits)} className="inline" /></p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-s-[3px] border-s-destructive">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-destructive/10 p-2.5">
              <ArrowUpDown className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "إجمالي المصروفات" : "Total Debits"}</p>
              <p className="text-2xl font-bold text-destructive">{currency} <AnimatedCounter value={Math.round(totalDebits)} className="inline" /></p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-s-[3px] border-s-chart-4">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-chart-4/10 p-2.5">
              <Clock className="h-5 w-5 text-chart-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "تمت التسوية / قيد المراجعة" : "Reconciled / Pending"}</p>
              <p className="text-2xl font-bold">{reconciledCount} / {pendingCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isAr ? "بحث بالوصف أو الرقم..." : "Search by description or number..."}
                className="ps-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="me-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "كل الأنواع" : "All Types"}</SelectItem>
                {typeOptions.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DatePicker date={dateFrom} onSelect={setDateFrom} label={isAr ? "من تاريخ" : "From"} />
            <DatePicker date={dateTo} onSelect={setDateTo} label={isAr ? "إلى تاريخ" : "To"} />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6"><Skeleton className="h-64" /></div>
          ) : filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                    <TableHead>{isAr ? "الرقم" : "Ref #"}</TableHead>
                    <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                    <TableHead>{isAr ? "الوصف" : "Description"}</TableHead>
                    <TableHead className="text-end">{isAr ? "المبلغ" : "Amount"}</TableHead>
                    <TableHead className="text-end">{isAr ? "الرصيد بعد" : "Balance"}</TableHead>
                    <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t) => {
                    const isCredit = ["payment", "credit", "refund"].includes(t.type);
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {t.transaction_date ? format(new Date(t.transaction_date), "MMM dd, yyyy") : "—"}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{t.transaction_number}</TableCell>
                        <TableCell>
                          <Badge variant={isCredit ? "default" : "destructive"} className="capitalize">
                            {t.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{isAr ? t.description_ar || t.description : t.description || "—"}</TableCell>
                        <TableCell className={`text-end font-medium ${isCredit ? "text-chart-5" : "text-destructive"}`}>
                          {isCredit ? "+" : "-"}{t.currency} {Math.abs(t.amount).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-end">
                          {t.balance_after !== null ? `${t.currency} ${t.balance_after?.toLocaleString()}` : "—"}
                        </TableCell>
                        <TableCell>
                          {t.is_reconciled ? (
                            <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20">
                              {isAr ? "تمت التسوية" : "Reconciled"}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              {isAr ? "قيد المراجعة" : "Pending"}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-3">
                <ArrowUpDown className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                {isAr ? "لا توجد معاملات" : "No transactions found"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
