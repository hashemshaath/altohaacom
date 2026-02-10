import { useState } from "react";
import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  ArrowUpDown,
  Search,
  Receipt,
  TrendingUp,
  CheckCircle,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

export default function CompanyTransactions() {
  const { language } = useLanguage();
  const { companyId } = useCompanyAccess();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["companyTransactions", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("company_transactions")
        .select("*")
        .eq("company_id", companyId)
        .order("transaction_date", { ascending: false });
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

  const totalAmount = transactions.reduce((s, t) => s + (t.amount || 0), 0);
  const reconciledCount = transactions.filter((t) => t.is_reconciled).length;
  const pendingCount = transactions.length - reconciledCount;
  const currency = transactions[0]?.currency || "USD";

  const typeOptions = [...new Set(transactions.map((t) => t.type))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ArrowUpDown className="h-6 w-6 text-primary" />
          {language === "ar" ? "المعاملات" : "Transactions"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {language === "ar" ? "سجل المعاملات المالية" : "Financial transaction records"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-s-[3px] border-s-primary">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{language === "ar" ? "إجمالي المعاملات" : "Total Volume"}</p>
              <p className="text-2xl font-bold">{currency} {totalAmount.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-s-[3px] border-s-chart-5">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-chart-5/10 p-2.5">
              <CheckCircle className="h-5 w-5 text-chart-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{language === "ar" ? "تمت التسوية" : "Reconciled"}</p>
              <p className="text-2xl font-bold">{reconciledCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-s-[3px] border-s-chart-4">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-chart-4/10 p-2.5">
              <Clock className="h-5 w-5 text-chart-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{language === "ar" ? "قيد المراجعة" : "Pending"}</p>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === "ar" ? "بحث..." : "Search..."}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === "ar" ? "كل الأنواع" : "All Types"}</SelectItem>
            {typeOptions.map((t) => (
              <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
                    <TableHead>{language === "ar" ? "الرقم" : "Number"}</TableHead>
                    <TableHead>{language === "ar" ? "النوع" : "Type"}</TableHead>
                    <TableHead>{language === "ar" ? "الوصف" : "Description"}</TableHead>
                    <TableHead className="text-right">{language === "ar" ? "المبلغ" : "Amount"}</TableHead>
                    <TableHead className="text-right">{language === "ar" ? "الرصيد بعد" : "Balance After"}</TableHead>
                    <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{language === "ar" ? "التاريخ" : "Date"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t) => {
                    const isCredit = ["payment", "credit", "refund"].includes(t.type);
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-sm">{t.transaction_number}</TableCell>
                        <TableCell>
                          <Badge variant={isCredit ? "default" : "destructive"} className="capitalize">
                            {t.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{language === "ar" ? t.description_ar || t.description : t.description || "—"}</TableCell>
                        <TableCell className={`text-right font-medium ${isCredit ? "text-chart-5" : "text-destructive"}`}>
                          {t.currency} {t.amount?.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {t.balance_after !== null ? `${t.currency} ${t.balance_after?.toLocaleString()}` : "—"}
                        </TableCell>
                        <TableCell>
                          {t.is_reconciled ? (
                            <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20">
                              {language === "ar" ? "تمت التسوية" : "Reconciled"}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              {language === "ar" ? "قيد المراجعة" : "Pending"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {t.transaction_date ? format(new Date(t.transaction_date), "MMM dd, yyyy") : "—"}
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
                {language === "ar" ? "لا توجد معاملات" : "No transactions found"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
