import { useState } from "react";
import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toEnglishDigits } from "@/lib/formatNumber";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Wallet,
  Download,
  Calendar,
  ArrowUpDown,
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function CompanyStatements() {
  const { language } = useLanguage();
  const { companyId, isLoading: accessLoading } = useCompanyAccess();
  const { toast } = useToast();
  const isAr = language === "ar";
  const [period, setPeriod] = useState("3");

  const startDate = startOfMonth(subMonths(new Date(), parseInt(period)));
  const endDate = endOfMonth(new Date());

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["companyStatement", companyId, period],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("company_transactions")
        .select("*")
        .eq("company_id", companyId)
        .gte("transaction_date", startDate.toISOString())
        .lte("transaction_date", endDate.toISOString())
        .order("transaction_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const totalCredits = transactions
    .filter((t) => ["payment", "credit", "refund"].includes(t.type))
    .reduce((s, t) => s + (t.amount || 0), 0);

  const totalDebits = transactions
    .filter((t) => ["invoice", "debit"].includes(t.type))
    .reduce((s, t) => s + (t.amount || 0), 0);

  const latestBalance = transactions.length > 0 ? transactions[transactions.length - 1].balance_after : null;
  const netBalance = totalCredits - totalDebits;
  const currency = transactions[0]?.currency || "SAR";

  const loading = accessLoading || isLoading;

  const exportCSV = () => {
    if (transactions.length === 0) return;
    const BOM = "\uFEFF";
    const headers = ["Date", "Ref #", "Description", "Type", "Amount", "Balance"];
    const rows = transactions.map((t) => {
      const isCredit = ["payment", "credit", "refund"].includes(t.type);
      return [
        t.transaction_date ? format(new Date(t.transaction_date), "yyyy-MM-dd") : "",
        t.transaction_number || "",
        `"${(isAr ? t.description_ar || t.description : t.description) || ""}"`,
        t.type,
        `${isCredit ? "" : "-"}${Math.abs(t.amount)}`,
        t.balance_after ?? "",
      ].join(",");
    });
    const csv = BOM + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `statement_${format(startDate, "yyyyMMdd")}_${format(endDate, "yyyyMMdd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: isAr ? "تم تصدير الكشف" : "Statement exported" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            {isAr ? "كشوفات الحساب" : "Account Statements"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {isAr ? "كشوف الحساب والأرصدة" : "Account statements and balances"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={transactions.length === 0}>
            <Download className="me-2 h-4 w-4" />
            {isAr ? "تصدير CSV" : "Export CSV"}
          </Button>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">{isAr ? "شهر واحد" : "1 Month"}</SelectItem>
              <SelectItem value="3">{isAr ? "3 أشهر" : "3 Months"}</SelectItem>
              <SelectItem value="6">{isAr ? "6 أشهر" : "6 Months"}</SelectItem>
              <SelectItem value="12">{isAr ? "سنة" : "1 Year"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-s-[3px] border-s-chart-5">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-xl bg-chart-5/10 p-2.5">
                <TrendingUp className="h-5 w-5 text-chart-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{isAr ? "إجمالي الإيرادات" : "Total Credits"}</p>
                <p className="text-2xl font-bold">{currency} {toEnglishDigits(totalCredits.toLocaleString())}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-s-[3px] border-s-destructive">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-xl bg-destructive/10 p-2.5">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{isAr ? "إجمالي المصروفات" : "Total Debits"}</p>
                <p className="text-2xl font-bold">{currency} {toEnglishDigits(totalDebits.toLocaleString())}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-s-[3px] border-s-chart-3">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-xl bg-chart-3/10 p-2.5">
                <ArrowUpDown className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{isAr ? "صافي الرصيد" : "Net Balance"}</p>
                <p className={`text-2xl font-bold ${netBalance >= 0 ? "text-chart-5" : "text-destructive"}`}>
                  {currency} {toEnglishDigits(netBalance.toLocaleString())}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-s-[3px] border-s-primary">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-xl bg-primary/10 p-2.5">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{isAr ? "الرصيد الحالي" : "Current Balance"}</p>
                <p className="text-2xl font-bold">{latestBalance !== null ? `${currency} ${toEnglishDigits(latestBalance.toLocaleString())}` : "—"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Statement Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">
            {isAr ? "تفاصيل الكشف" : "Statement Details"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {toEnglishDigits(format(startDate, "MMM dd, yyyy"))} – {toEnglishDigits(format(endDate, "MMM dd, yyyy"))}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6"><Skeleton className="h-64" /></div>
          ) : transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                    <TableHead>{isAr ? "الرقم" : "Ref #"}</TableHead>
                    <TableHead>{isAr ? "الوصف" : "Description"}</TableHead>
                    <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                    <TableHead className="text-end">{isAr ? "المبلغ" : "Amount"}</TableHead>
                    <TableHead className="text-end">{isAr ? "الرصيد" : "Balance"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t) => {
                    const isCredit = ["payment", "credit", "refund"].includes(t.type);
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {t.transaction_date ? toEnglishDigits(format(new Date(t.transaction_date), "MMM dd, yyyy")) : "—"}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{t.transaction_number}</TableCell>
                        <TableCell>{isAr ? t.description_ar || t.description : t.description || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={isCredit ? "default" : "destructive"} className="capitalize">
                            {t.type}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-end font-medium ${isCredit ? "text-chart-5" : "text-destructive"}`}>
                          {isCredit ? "+" : "-"}{t.currency} {toEnglishDigits(Math.abs(t.amount).toLocaleString())}
                        </TableCell>
                        <TableCell className="text-end font-medium">
                          {t.balance_after !== null ? `${t.currency} ${toEnglishDigits(t.balance_after?.toLocaleString())}` : "—"}
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
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                {isAr ? "لا توجد معاملات في هذه الفترة" : "No transactions in this period"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
