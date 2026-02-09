import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

export default function CompanyTransactions() {
  const { language } = useLanguage();
  const { companyId } = useCompanyAccess();

  const { data: transactions, isLoading } = useQuery({
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

  const getTypeColor = (type: string): "default" | "destructive" | "outline" | "secondary" => {
    const colors: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      payment: "default",
      invoice: "secondary",
      credit: "default",
      debit: "destructive",
      refund: "default",
      adjustment: "secondary",
    };
    return colors[type] || "secondary";
  };

  const totalAmount = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {language === "ar" ? "المعاملات" : "Transactions"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {language === "ar" ? "سجل المعاملات المالية" : "Financial transaction records"}
        </p>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {language === "ar" ? "إجمالي المعاملات" : "Total Amount"}
              </p>
              {isLoading ? (
                <Skeleton className="mt-2 h-8 w-32" />
              ) : (
                <p className="mt-2 text-2xl font-bold">${totalAmount.toLocaleString()}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {language === "ar" ? "سجل المعاملات" : "Transaction History"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : transactions && transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "ar" ? "الرقم" : "Number"}</TableHead>
                    <TableHead>{language === "ar" ? "النوع" : "Type"}</TableHead>
                    <TableHead>{language === "ar" ? "الوصف" : "Description"}</TableHead>
                    <TableHead>{language === "ar" ? "المبلغ" : "Amount"}</TableHead>
                    <TableHead>{language === "ar" ? "الرصيد قبل" : "Balance Before"}</TableHead>
                    <TableHead>{language === "ar" ? "الرصيد بعد" : "Balance After"}</TableHead>
                    <TableHead>{language === "ar" ? "التاريخ" : "Date"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.transaction_number}</TableCell>
                      <TableCell>
                        <Badge variant={getTypeColor(transaction.type)}>
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell className="font-medium">
                        {transaction.currency} {transaction.amount?.toLocaleString()}
                      </TableCell>
                      <TableCell>{transaction.currency} {transaction.balance_before?.toLocaleString()}</TableCell>
                      <TableCell>{transaction.currency} {transaction.balance_after?.toLocaleString()}</TableCell>
                      <TableCell>
                        {transaction.transaction_date
                          ? format(new Date(transaction.transaction_date), "MMM dd, yyyy")
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {language === "ar" ? "لا توجد معاملات" : "No transactions found"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
