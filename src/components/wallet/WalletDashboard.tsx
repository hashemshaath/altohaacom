import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wallet, ArrowUpRight, ArrowDownLeft, Coins, Receipt, TrendingUp, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/currencyFormatter";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface WalletDashboardProps {
  userId: string;
}

export function WalletDashboard({ userId }: WalletDashboardProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ["user-wallet", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_wallets")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["wallet-transactions", wallet?.id],
    queryFn: async () => {
      if (!wallet?.id) return [];
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("wallet_id", wallet.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!wallet?.id,
  });

  if (walletLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  if (!wallet) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/20">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Wallet className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-bold mb-1">{isAr ? "المحفظة المالية" : "Financial Wallet"}</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {isAr ? "سيتم إنشاء محفظتك تلقائياً عند أول معاملة مالية" : "Your wallet will be created automatically with your first financial transaction"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalCredits = transactions.filter(t => ["credit", "refund", "points_earned"].includes(t.type)).reduce((s, t) => s + Number(t.amount), 0);
  const totalDebits = transactions.filter(t => ["debit", "fee", "points_redeemed", "settlement"].includes(t.type)).reduce((s, t) => s + Number(t.amount), 0);

  const typeLabels: Record<string, { en: string; ar: string; icon: typeof ArrowUpRight }> = {
    credit: { en: "Credit", ar: "إيداع", icon: ArrowUpRight },
    debit: { en: "Debit", ar: "خصم", icon: ArrowDownLeft },
    transfer: { en: "Transfer", ar: "تحويل", icon: TrendingUp },
    refund: { en: "Refund", ar: "استرداد", icon: ArrowUpRight },
    points_earned: { en: "Points Earned", ar: "نقاط مكتسبة", icon: Coins },
    points_redeemed: { en: "Points Redeemed", ar: "نقاط مستبدلة", icon: Coins },
    fee: { en: "Fee", ar: "رسوم", icon: Receipt },
    settlement: { en: "Settlement", ar: "تسوية", icon: CreditCard },
  };

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      {/* Wallet Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-s-[3px] border-s-primary">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "الرصيد" : "Balance"}</p>
              <p className="text-2xl font-bold">{formatCurrency(Number(wallet.balance), language as "en" | "ar")}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-s-[3px] border-s-chart-5">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-chart-5/10 p-2.5">
              <Coins className="h-5 w-5 text-chart-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "النقاط" : "Points"}</p>
              <p className="text-2xl font-bold">{wallet.points_balance?.toLocaleString() || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-s-[3px] border-s-chart-2">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-chart-2/10 p-2.5">
              <ArrowUpRight className="h-5 w-5 text-chart-2" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "إجمالي الإيداع" : "Total Credits"}</p>
              <p className="text-2xl font-bold">{formatCurrency(totalCredits, language as "en" | "ar")}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-s-[3px] border-s-destructive">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-destructive/10 p-2.5">
              <ArrowDownLeft className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "إجمالي الخصم" : "Total Debits"}</p>
              <p className="text-2xl font-bold">{formatCurrency(totalDebits, language as "en" | "ar")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wallet Info */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{isAr ? "معلومات المحفظة" : "Wallet Info"}</CardTitle>
            <Badge variant={wallet.status === "active" ? "default" : "destructive"}>
              {wallet.status === "active" ? (isAr ? "نشطة" : "Active") : wallet.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">{isAr ? "رقم المحفظة" : "Wallet Number"}</p>
              <p className="font-mono font-bold text-sm mt-1">{wallet.wallet_number}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">{isAr ? "العملة" : "Currency"}</p>
              <p className="font-bold text-sm mt-1">{wallet.currency}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{isAr ? "سجل المعاملات" : "Transaction History"}</CardTitle>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? "الرقم" : "Txn #"}</TableHead>
                    <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                    <TableHead>{isAr ? "الوصف" : "Description"}</TableHead>
                    <TableHead className="text-right">{isAr ? "المبلغ" : "Amount"}</TableHead>
                    <TableHead className="text-right">{isAr ? "الرصيد" : "Balance"}</TableHead>
                    <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx: any) => {
                    const typeInfo = typeLabels[tx.type] || { en: tx.type, ar: tx.type, icon: Receipt };
                    const isCredit = ["credit", "refund", "points_earned"].includes(tx.type);
                    return (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-xs">{tx.transaction_number}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs gap-1">
                            <typeInfo.icon className="h-3 w-3" />
                            {isAr ? typeInfo.ar : typeInfo.en}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{isAr ? tx.description_ar || tx.description : tx.description || "—"}</TableCell>
                        <TableCell className={`text-right font-medium ${isCredit ? "text-chart-5" : "text-destructive"}`}>
                          {isCredit ? "+" : "-"}{formatCurrency(Number(tx.amount), language as "en" | "ar")}
                        </TableCell>
                        <TableCell className="text-right text-sm">{formatCurrency(Number(tx.balance_after), language as "en" | "ar")}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(tx.created_at), "dd/MM/yyyy", { locale: isAr ? ar : undefined })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Receipt className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">{isAr ? "لا توجد معاملات بعد" : "No transactions yet"}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
