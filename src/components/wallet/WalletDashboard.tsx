import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Coins, Receipt, TrendingUp,
  CreditCard, Search, Download, Shield, Clock, Hash, Banknote,
  ChevronRight, Sparkles, Eye, EyeOff, Copy, CheckCircle2,
} from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { EmptyState } from "@/components/ui/empty-state";
import { StaggeredList } from "@/components/ui/staggered-list";
import { formatCurrency } from "@/lib/currencyFormatter";
import { format, isToday, isYesterday, isThisMonth } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { toEnglishDigits } from "@/lib/formatNumber";
import { useToast } from "@/hooks/use-toast";

interface WalletDashboardProps {
  userId: string;
}

const typeLabels: Record<string, { en: string; ar: string; icon: typeof ArrowUpRight; color: string }> = {
  credit: { en: "Credit", ar: "إيداع", icon: ArrowUpRight, color: "text-chart-2" },
  debit: { en: "Debit", ar: "خصم", icon: ArrowDownLeft, color: "text-destructive" },
  transfer: { en: "Transfer", ar: "تحويل", icon: TrendingUp, color: "text-primary" },
  refund: { en: "Refund", ar: "استرداد", icon: ArrowUpRight, color: "text-chart-2" },
  points_earned: { en: "Points Earned", ar: "نقاط مكتسبة", icon: Coins, color: "text-chart-5" },
  points_redeemed: { en: "Points Redeemed", ar: "نقاط مستبدلة", icon: Coins, color: "text-chart-4" },
  fee: { en: "Fee", ar: "رسوم", icon: Receipt, color: "text-destructive" },
  settlement: { en: "Settlement", ar: "تسوية", icon: CreditCard, color: "text-muted-foreground" },
};

function formatTxDate(date: string, isAr: boolean) {
  const d = new Date(date);
  const locale = isAr ? ar : enUS;
  if (isToday(d)) return `${isAr ? "اليوم" : "Today"}, ${format(d, "h:mm a", { locale })}`;
  if (isYesterday(d)) return `${isAr ? "أمس" : "Yesterday"}, ${format(d, "h:mm a", { locale })}`;
  return format(d, "dd MMM yyyy, h:mm a", { locale });
}

export function WalletDashboard({ userId }: WalletDashboardProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const { toast } = useToast();

  const [balanceVisible, setBalanceVisible] = useState(true);
  const [txSearch, setTxSearch] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState("all");
  const [copied, setCopied] = useState(false);

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
    staleTime: 1000 * 60 * 2,
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
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!wallet?.id,
  });

  const filteredTx = useMemo(() => {
    return transactions.filter((tx: any) => {
      if (txTypeFilter !== "all" && tx.type !== txTypeFilter) return false;
      if (txSearch) {
        const q = txSearch.toLowerCase();
        const desc = (tx.description || tx.description_ar || "").toLowerCase();
        const num = (tx.transaction_number || "").toLowerCase();
        if (!desc.includes(q) && !num.includes(q)) return false;
      }
      return true;
    });
  }, [transactions, txTypeFilter, txSearch]);

  const stats = useMemo(() => {
    const thisMonth = transactions.filter((tx: any) => isThisMonth(new Date(tx.created_at)));
    const totalCredits = transactions.filter((t: any) => ["credit", "refund", "points_earned"].includes(t.type)).reduce((s: number, t: any) => s + Number(t.amount), 0);
    const totalDebits = transactions.filter((t: any) => ["debit", "fee", "points_redeemed", "settlement"].includes(t.type)).reduce((s: number, t: any) => s + Number(t.amount), 0);
    const monthlyCredits = thisMonth.filter((t: any) => ["credit", "refund"].includes(t.type)).reduce((s: number, t: any) => s + Number(t.amount), 0);
    const monthlyDebits = thisMonth.filter((t: any) => ["debit", "fee", "settlement"].includes(t.type)).reduce((s: number, t: any) => s + Number(t.amount), 0);
    return { totalCredits, totalDebits, monthlyCredits, monthlyDebits, txCount: transactions.length, monthlyTxCount: thisMonth.length };
  }, [transactions]);

  const copyWalletNumber = () => {
    if (wallet?.wallet_number) {
      navigator.clipboard.writeText(wallet.wallet_number);
      setCopied(true);
      toast({ title: t("Copied!", "تم النسخ!") });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (walletLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!wallet) {
    return (
      <EmptyState
        icon={Wallet}
        title={t("Financial Wallet", "المحفظة المالية")}
        description={t("Your wallet will be created automatically with your first financial transaction", "سيتم إنشاء محفظتك تلقائياً عند أول معاملة مالية")}
      />
    );
  }

  return (
    <StaggeredList className="space-y-6" stagger={80}>
      {/* Hero Wallet Card */}
      <Card className="overflow-hidden border-border/40 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-xl shadow-primary/5">
        <CardContent className="p-0">
          <div className="p-5 md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shadow-inner">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{t("My Wallet", "محفظتي")}</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-xs text-muted-foreground" dir="ltr">{wallet.wallet_number}</p>
                      <button onClick={copyWalletNumber} className="text-muted-foreground hover:text-primary transition-colors">
                        {copied ? <CheckCircle2 className="h-3 w-3 text-chart-2" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Balance */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t("Available Balance", "الرصيد المتاح")}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl md:text-4xl font-black tracking-tight">
                      {balanceVisible ? formatCurrency(Number(wallet.balance), language as "en" | "ar") : "••••••"}
                    </p>
                    <button onClick={() => setBalanceVisible(!balanceVisible)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                      {balanceVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right side info */}
              <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
                <Badge variant={wallet.status === "active" ? "default" : "destructive"} className="gap-1">
                  <Shield className="h-3 w-3" />
                  {wallet.status === "active" ? t("Active", "نشطة") : wallet.status}
                </Badge>
                <Badge variant="outline" className="gap-1 bg-background/50">
                  <Banknote className="h-3 w-3" />
                  {wallet.currency}
                </Badge>
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-border/40 bg-background/60 backdrop-blur-sm p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Coins className="h-3.5 w-3.5 text-chart-5" />
                  <span className="text-[10px] text-muted-foreground font-medium">{t("Points", "النقاط")}</span>
                </div>
                <AnimatedCounter value={wallet.points_balance || 0} className="text-xl" />
              </div>
              <div className="rounded-xl border border-border/40 bg-background/60 backdrop-blur-sm p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <ArrowUpRight className="h-3.5 w-3.5 text-chart-2" />
                  <span className="text-[10px] text-muted-foreground font-medium">{t("Credits", "إيداعات")}</span>
                </div>
                <p className="text-xl font-bold">{formatCurrency(stats.totalCredits, language as "en" | "ar")}</p>
              </div>
              <div className="rounded-xl border border-border/40 bg-background/60 backdrop-blur-sm p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <ArrowDownLeft className="h-3.5 w-3.5 text-destructive" />
                  <span className="text-[10px] text-muted-foreground font-medium">{t("Debits", "خصومات")}</span>
                </div>
                <p className="text-xl font-bold">{formatCurrency(stats.totalDebits, language as "en" | "ar")}</p>
              </div>
              <div className="rounded-xl border border-border/40 bg-background/60 backdrop-blur-sm p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Hash className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] text-muted-foreground font-medium">{t("Transactions", "المعاملات")}</span>
                </div>
                <AnimatedCounter value={stats.txCount} className="text-xl" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Summary */}
      {stats.monthlyTxCount > 0 && (
        <Card className="border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-chart-4" />
              <h3 className="text-sm font-bold">{t("This Month", "هذا الشهر")}</h3>
              <Badge variant="secondary" className="text-[10px]">{stats.monthlyTxCount} {t("transactions", "معاملة")}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 rounded-xl border border-chart-2/20 bg-chart-2/5 p-3 transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5">
                <ArrowUpRight className="h-5 w-5 text-chart-2" />
                <div>
                  <p className="text-[10px] text-muted-foreground">{t("Income", "الدخل")}</p>
                  <p className="text-lg font-bold text-chart-2">{formatCurrency(stats.monthlyCredits, language as "en" | "ar")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3 transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5">
                <ArrowDownLeft className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-[10px] text-muted-foreground">{t("Expenses", "المصروفات")}</p>
                  <p className="text-lg font-bold text-destructive">{formatCurrency(stats.monthlyDebits, language as "en" | "ar")}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">{t("Transaction History", "سجل المعاملات")}</CardTitle>
              {transactions.length > 0 && (
                <Badge variant="secondary" className="text-[10px]">{filteredTx.length}</Badge>
              )}
            </div>
          </div>
          {/* Filters */}
          {transactions.length > 0 && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center mt-2">
              <div className="relative flex-1">
                <Search className="absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("Search transactions...", "بحث في المعاملات...")}
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  className="ps-9 h-9 text-xs rounded-xl border-border/40"
                />
              </div>
              <Select value={txTypeFilter} onValueChange={setTxTypeFilter}>
                <SelectTrigger className="h-9 w-full sm:w-40 text-xs rounded-xl border-border/40">
                  <SelectValue placeholder={t("All Types", "كل الأنواع")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All Types", "كل الأنواع")}</SelectItem>
                  <SelectItem value="credit">{t("Credit", "إيداع")}</SelectItem>
                  <SelectItem value="debit">{t("Debit", "خصم")}</SelectItem>
                  <SelectItem value="refund">{t("Refund", "استرداد")}</SelectItem>
                  <SelectItem value="fee">{t("Fee", "رسوم")}</SelectItem>
                  <SelectItem value="points_earned">{t("Points Earned", "نقاط مكتسبة")}</SelectItem>
                  <SelectItem value="points_redeemed">{t("Points Redeemed", "نقاط مستبدلة")}</SelectItem>
                  <SelectItem value="transfer">{t("Transfer", "تحويل")}</SelectItem>
                  <SelectItem value="settlement">{t("Settlement", "تسوية")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border/20">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-xl" />
                    <div><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-20 mt-1" /></div>
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          ) : filteredTx.length > 0 ? (
            <div className="space-y-1.5">
              {filteredTx.map((tx: any) => {
                const info = typeLabels[tx.type] || { en: tx.type, ar: tx.type, icon: Receipt, color: "text-muted-foreground" };
                const Icon = info.icon;
                const isCredit = ["credit", "refund", "points_earned"].includes(tx.type);

                return (
                  <div key={tx.id} className="group flex items-center gap-3 rounded-xl border border-border/20 bg-muted/5 p-3 hover:bg-muted/20 transition-all">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isCredit ? "bg-chart-2/10" : "bg-destructive/10"}`}>
                      <Icon className={`h-4 w-4 ${info.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {isAr ? (tx.description_ar || tx.description || info.ar) : (tx.description || info.en)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5 gap-0.5">
                          {isAr ? info.ar : info.en}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{formatTxDate(tx.created_at, isAr)}</span>
                      </div>
                    </div>
                    <div className="text-end shrink-0">
                      <p className={`text-sm font-bold ${isCredit ? "text-chart-2" : "text-destructive"}`}>
                        {isCredit ? "+" : "−"}{formatCurrency(Number(tx.amount), language as "en" | "ar")}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {t("Bal:", "رصيد:")} {formatCurrency(Number(tx.balance_after), language as "en" | "ar")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : txSearch || txTypeFilter !== "all" ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Search className="h-10 w-10 text-muted-foreground/20 mb-3" />
              <p className="text-sm font-medium">{t("No matching transactions", "لا توجد معاملات مطابقة")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("Try adjusting your search or filter", "حاول تعديل البحث أو الفلتر")}</p>
              <Button variant="ghost" size="sm" className="mt-3" onClick={() => { setTxSearch(""); setTxTypeFilter("all"); }}>
                {t("Clear Filters", "مسح الفلاتر")}
              </Button>
            </div>
          ) : (
            <EmptyState
              icon={Receipt}
              title={t("No transactions yet", "لا توجد معاملات بعد")}
              description={t("Your transactions will appear here", "ستظهر معاملاتك هنا")}
            />
          )}
        </CardContent>
      </Card>
    </StaggeredList>
  );
}
