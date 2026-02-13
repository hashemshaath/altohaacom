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
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export default function CompanyStatements() {
  const { language } = useLanguage();
  const { companyId, isLoading: accessLoading } = useCompanyAccess();
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
  const currency = transactions[0]?.currency || "SAR";

  const loading = accessLoading || isLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            {language === "ar" ? "كشوفات الحساب" : "Account Statements"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {language === "ar" ? "كشوف الحساب والأرصدة" : "Account statements and balances"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">{language === "ar" ? "شهر واحد" : "1 Month"}</SelectItem>
              <SelectItem value="3">{language === "ar" ? "3 أشهر" : "3 Months"}</SelectItem>
              <SelectItem value="6">{language === "ar" ? "6 أشهر" : "6 Months"}</SelectItem>
              <SelectItem value="12">{language === "ar" ? "سنة" : "1 Year"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-s-[3px] border-s-chart-5">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-xl bg-chart-5/10 p-2.5">
                <TrendingUp className="h-5 w-5 text-chart-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{language === "ar" ? "إجمالي الإيرادات" : "Total Credits"}</p>
                <p className="text-2xl font-bold">{currency} {totalCredits.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-s-[3px] border-s-destructive">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-xl bg-destructive/10 p-2.5">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{language === "ar" ? "إجمالي المصروفات" : "Total Debits"}</p>
                <p className="text-2xl font-bold">{currency} {totalDebits.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-s-[3px] border-s-primary">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-xl bg-primary/10 p-2.5">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{language === "ar" ? "الرصيد الحالي" : "Current Balance"}</p>
                <p className="text-2xl font-bold">{latestBalance !== null ? `${currency} ${latestBalance.toLocaleString()}` : "—"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Statement Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">
            {language === "ar" ? "تفاصيل الكشف" : "Statement Details"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {format(startDate, "MMM dd, yyyy")} – {format(endDate, "MMM dd, yyyy")}
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
                    <TableHead>{language === "ar" ? "التاريخ" : "Date"}</TableHead>
                    <TableHead>{language === "ar" ? "الرقم" : "Ref #"}</TableHead>
                    <TableHead>{language === "ar" ? "الوصف" : "Description"}</TableHead>
                    <TableHead>{language === "ar" ? "النوع" : "Type"}</TableHead>
                    <TableHead className="text-right">{language === "ar" ? "المبلغ" : "Amount"}</TableHead>
                    <TableHead className="text-right">{language === "ar" ? "الرصيد" : "Balance"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t) => {
                    const isCredit = ["payment", "credit", "refund"].includes(t.type);
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {t.transaction_date ? format(new Date(t.transaction_date), "MMM dd, yyyy") : "—"}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{t.transaction_number}</TableCell>
                        <TableCell>{language === "ar" ? t.description_ar || t.description : t.description || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={isCredit ? "default" : "destructive"} className="capitalize">
                            {t.type}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right font-medium ${isCredit ? "text-chart-5" : "text-destructive"}`}>
                          {isCredit ? "+" : "-"}{t.currency} {Math.abs(t.amount).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {t.balance_after !== null ? `${t.currency} ${t.balance_after?.toLocaleString()}` : "—"}
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
                {language === "ar" ? "لا توجد معاملات في هذه الفترة" : "No transactions in this period"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
