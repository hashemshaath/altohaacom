import { useIsAr } from "@/hooks/useIsAr";
import { useState, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useToast } from "@/hooks/use-toast";
import { useCSVExport } from "@/hooks/useCSVExport";
import {
  Wallet, Search, Coins, Users, CreditCard, Download,
  Plus, Minus, ArrowUpRight, ArrowDownRight, History,
  Loader2, RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type MembershipTier = Database["public"]["Enums"]["membership_tier"];

const MembershipWalletTab = memo(function MembershipWalletTab() {
  const { user } = useAuth();
  const isAr = useIsAr();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [activeSubTab, setActiveSubTab] = useState("wallets");

  // Adjust dialog
  const [adjustDialog, setAdjustDialog] = useState<{ userId: string; name: string; type: "credit" | "debit" | "points" } | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const { data: walletStats } = useQuery({
    queryKey: ["membership-wallet-stats"],
    queryFn: async () => {
      const { data: wallets } = await supabase
        .from("user_wallets")
        .select("balance, points_balance, user_id");

      const totalBalance = wallets?.reduce((s, w) => s + (w.balance || 0), 0) || 0;
      const totalPoints = wallets?.reduce((s, w) => s + (w.points_balance || 0), 0) || 0;
      const activeWallets = wallets?.filter(w => (w.balance || 0) > 0).length || 0;

      return { totalBalance, totalPoints, activeWallets, total: wallets?.length || 0 };
    },
  });

  const { data: walletUsers, isLoading } = useQuery({
    queryKey: ["membership-wallet-users", search, tierFilter],
    queryFn: async () => {
      const { data: wallets } = await supabase
        .from("user_wallets")
        .select("id, user_id, balance, points_balance, currency, status, created_at")
        .order("balance", { ascending: false })
        .limit(50);

      if (!wallets?.length) return [];

      const userIds = wallets.map(w => w.user_id).filter(Boolean) as string[];
      if (!userIds.length) return [];

      let profileQuery = supabase
        .from("profiles")
        .select("user_id, full_name, full_name_ar, username, avatar_url, membership_tier, account_number")
        .in("user_id", userIds);

      if (search) {
        profileQuery = profileQuery.or(`full_name.ilike.%${search}%,username.ilike.%${search}%,account_number.ilike.%${search}%`);
      }
      if (tierFilter !== "all") {
        profileQuery = profileQuery.eq("membership_tier", tierFilter as MembershipTier);
      }

      const { data: profiles } = await profileQuery;
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return wallets
        .filter(w => w.user_id && profileMap.has(w.user_id))
        .map(w => ({ ...w, profile: profileMap.get(w.user_id!) }));
    },
  });

  // Recent transactions
  const { data: recentTransactions, isLoading: txLoading } = useQuery({
    queryKey: ["membership-wallet-transactions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("wallet_transactions")
        .select("id, wallet_id, transaction_number, type, amount, currency, description, description_ar, status, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  // Admin adjust mutation
  const adjustMutation = useMutation({
    mutationFn: async () => {
      if (!adjustDialog || !user) return;
      const amount = parseFloat(adjustAmount);
      if (isNaN(amount) || amount <= 0) throw new Error("Invalid amount");

      if (adjustDialog.type === "points") {
        // Adjust points
        const { data: wallet } = await supabase
          .from("user_wallets")
          .select("id, points_balance")
          .eq("user_id", adjustDialog.userId)
          .maybeSingle();

        if (!wallet) throw new Error("Wallet not found");
        const newBalance = (wallet.points_balance || 0) + amount;

        await supabase.from("user_wallets").update({
          points_balance: newBalance,
        }).eq("id", wallet.id);

        await supabase.from("points_ledger").insert({
          user_id: adjustDialog.userId,
          action_type: "admin_adjustment",
          points: Math.round(amount),
          balance_after: Math.round(newBalance),
          description: adjustReason || "Admin points adjustment",
          description_ar: adjustReason || "تعديل نقاط من المسؤول",
          reference_type: "admin",
        });
      } else {
        // Credit or debit
        const { data: wallet } = await supabase
          .from("user_wallets")
          .select("id, balance")
          .eq("user_id", adjustDialog.userId)
          .maybeSingle();

        if (!wallet) throw new Error("Wallet not found");
        const sign = adjustDialog.type === "credit" ? 1 : -1;
        const newBalance = (wallet.balance || 0) + (amount * sign);

        if (newBalance < 0) throw new Error("Insufficient balance");

        await supabase.from("user_wallets").update({
          balance: newBalance,
        }).eq("id", wallet.id);

        await supabase.from("wallet_transactions").insert({
          wallet_id: wallet.id,
          transaction_number: "",
          type: adjustDialog.type,
          amount,
          currency: "SAR",
          description: adjustReason || `Admin ${adjustDialog.type}`,
          description_ar: adjustReason || `${adjustDialog.type === "credit" ? "إيداع" : "خصم"} من المسؤول`,
          status: "completed",
        });
      }

      await supabase.from("admin_actions").insert({
        admin_id: user.id,
        target_user_id: adjustDialog.userId,
        action_type: `wallet_${adjustDialog.type}`,
        details: { amount, reason: adjustReason },
      });

      await supabase.from("notifications").insert({
        user_id: adjustDialog.userId,
        title: adjustDialog.type === "credit" ? "Wallet credited" : adjustDialog.type === "debit" ? "Wallet debited" : "Points adjusted",
        title_ar: adjustDialog.type === "credit" ? "تم إيداع مبلغ" : adjustDialog.type === "debit" ? "تم خصم مبلغ" : "تم تعديل النقاط",
        body: `${adjustDialog.type === "points" ? "Points" : "Amount"}: ${amount}. ${adjustReason || ""}`,
        body_ar: `${adjustDialog.type === "points" ? "النقاط" : "المبلغ"}: ${amount}. ${adjustReason || ""}`,
        type: "membership",
        link: "/profile?tab=wallet",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membership-wallet"] });
      toast({ title: isAr ? "تم التعديل بنجاح" : "Adjustment successful" });
      setAdjustDialog(null);
      setAdjustAmount("");
      setAdjustReason("");
    },
    onError: (error) => toast({ variant: "destructive", title: "Error", description: error.message }),
  });

  const { exportCSV } = useCSVExport({
    columns: [
      { header: isAr ? "الاسم" : "Name", accessor: (r: Record<string, unknown>) => String((r as Record<string, Record<string, string>>).profile?.full_name || "") },
      { header: isAr ? "المعرف" : "Username", accessor: (r: Record<string, unknown>) => String((r as Record<string, Record<string, string>>).profile?.username || "") },
      { header: isAr ? "المستوى" : "Tier", accessor: (r: Record<string, unknown>) => String((r as Record<string, Record<string, string>>).profile?.membership_tier || "basic") },
      { header: isAr ? "الرصيد" : "Balance", accessor: (r: Record<string, unknown>) => String((r as Record<string, number>).balance || 0) },
      { header: isAr ? "النقاط" : "Points", accessor: (r: Record<string, unknown>) => String((r as Record<string, number>).points_balance || 0) },
    ],
    filename: "membership-wallets",
  });

  const statCards = [
    { icon: Wallet, label: isAr ? "إجمالي الأرصدة" : "Total Balance", value: walletStats?.totalBalance || 0, suffix: " SAR", color: "text-primary" },
    { icon: Coins, label: isAr ? "إجمالي النقاط" : "Total Points", value: walletStats?.totalPoints || 0, color: "text-chart-2" },
    { icon: Users, label: isAr ? "محافظ نشطة" : "Active Wallets", value: walletStats?.activeWallets || 0, color: "text-chart-3" },
    { icon: CreditCard, label: isAr ? "إجمالي المحافظ" : "Total Wallets", value: walletStats?.total || 0, color: "text-primary" },
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

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="h-8 rounded-xl">
          <TabsTrigger value="wallets" className="text-xs gap-1 rounded-lg h-7">
            <Wallet className="h-3 w-3" /> {isAr ? "المحافظ" : "Wallets"}
          </TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs gap-1 rounded-lg h-7">
            <History className="h-3 w-3" /> {isAr ? "المعاملات" : "Transactions"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wallets">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  {isAr ? "محافظ الأعضاء" : "Member Wallets"}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative w-56">
                    <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={isAr ? "بحث..." : "Search..."}
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="ps-9 h-8 text-xs"
                    />
                  </div>
                  <Select value={tierFilter} onValueChange={setTierFilter}>
                    <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{isAr ? "الكل" : "All Tiers"}</SelectItem>
                      <SelectItem value="basic">{isAr ? "أساسي" : "Basic"}</SelectItem>
                      <SelectItem value="professional">{isAr ? "احترافي" : "Professional"}</SelectItem>
                      <SelectItem value="enterprise">{isAr ? "مؤسسي" : "Enterprise"}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => walletUsers && exportCSV(walletUsers)}>
                    <Download className="h-3.5 w-3.5" />
                    {isAr ? "تصدير" : "Export"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-2">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-xs">{isAr ? "العضو" : "Member"}</TableHead>
                        <TableHead className="text-xs">{isAr ? "المستوى" : "Tier"}</TableHead>
                        <TableHead className="text-xs text-end">{isAr ? "الرصيد" : "Balance"}</TableHead>
                        <TableHead className="text-xs text-end">{isAr ? "النقاط" : "Points"}</TableHead>
                        <TableHead className="text-xs">{isAr ? "الحالة" : "Status"}</TableHead>
                        <TableHead className="text-xs text-end">{isAr ? "إجراءات" : "Actions"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {walletUsers?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={item.profile?.avatar_url || undefined} />
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {(item.profile?.full_name || "U")[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {isAr ? (item.profile?.full_name_ar || item.profile?.full_name) : item.profile?.full_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {item.profile?.username ? `@${item.profile.username}` : item.profile?.account_number}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs capitalize">
                              {item.profile?.membership_tier || "basic"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-end font-medium tabular-nums">
                            {(item.balance || 0).toFixed(2)}
                            <span className="text-xs text-muted-foreground ms-1">{item.currency || "SAR"}</span>
                          </TableCell>
                          <TableCell className="text-end">
                            <div className="flex items-center justify-end gap-1">
                              <Coins className="h-3 w-3 text-chart-2" />
                              <span className="tabular-nums">{item.points_balance || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.status === "active" ? "default" : "secondary"} className="text-xs capitalize">
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-end">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost" size="icon" className="h-7 w-7"
                                title={isAr ? "إيداع" : "Credit"}
                                onClick={() => setAdjustDialog({ userId: item.user_id, name: item.profile?.full_name || "User", type: "credit" })}
                              >
                                <Plus className="h-3.5 w-3.5 text-chart-2" />
                              </Button>
                              <Button
                                variant="ghost" size="icon" className="h-7 w-7"
                                title={isAr ? "خصم" : "Debit"}
                                onClick={() => setAdjustDialog({ userId: item.user_id, name: item.profile?.full_name || "User", type: "debit" })}
                              >
                                <Minus className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                              <Button
                                variant="ghost" size="icon" className="h-7 w-7"
                                title={isAr ? "تعديل نقاط" : "Adjust Points"}
                                onClick={() => setAdjustDialog({ userId: item.user_id, name: item.profile?.full_name || "User", type: "points" })}
                              >
                                <Coins className="h-3.5 w-3.5 text-chart-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!walletUsers?.length && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            {isAr ? "لا توجد محافظ" : "No wallets found"}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                {isAr ? "آخر المعاملات" : "Recent Transactions"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {txLoading ? (
                <div className="p-4 space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-xs">{isAr ? "النوع" : "Type"}</TableHead>
                        <TableHead className="text-xs">{isAr ? "رقم المعاملة" : "Txn #"}</TableHead>
                        <TableHead className="text-xs text-end">{isAr ? "المبلغ" : "Amount"}</TableHead>
                        <TableHead className="text-xs">{isAr ? "الوصف" : "Description"}</TableHead>
                        <TableHead className="text-xs">{isAr ? "الحالة" : "Status"}</TableHead>
                        <TableHead className="text-xs">{isAr ? "التاريخ" : "Date"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentTransactions?.map(tx => (
                        <TableRow key={tx.id}>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {tx.type === "credit" ? (
                                <ArrowDownRight className="h-3.5 w-3.5 text-chart-2" />
                              ) : (
                                <ArrowUpRight className="h-3.5 w-3.5 text-destructive" />
                              )}
                              <span className="text-xs capitalize">{tx.type}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{tx.transaction_number || "—"}</TableCell>
                          <TableCell className={`text-end font-medium tabular-nums ${tx.type === "credit" ? "text-chart-2" : "text-destructive"}`}>
                            {tx.type === "credit" ? "+" : "-"}{(tx.amount || 0).toFixed(2)}
                            <span className="text-xs text-muted-foreground ms-1">{tx.currency || "SAR"}</span>
                          </TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate">
                            {isAr ? (tx.description_ar || tx.description || "—") : (tx.description || "—")}
                          </TableCell>
                          <TableCell>
                            <Badge variant={tx.status === "completed" ? "default" : "secondary"} className="text-xs capitalize">
                              {tx.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {format(new Date(tx.created_at), "MMM d, HH:mm")}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!recentTransactions?.length && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            {isAr ? "لا توجد معاملات" : "No transactions found"}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Adjust Dialog */}
      <Dialog open={!!adjustDialog} onOpenChange={() => { setAdjustDialog(null); setAdjustAmount(""); setAdjustReason(""); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {adjustDialog?.type === "credit" && (isAr ? "إيداع رصيد" : "Credit Wallet")}
              {adjustDialog?.type === "debit" && (isAr ? "خصم رصيد" : "Debit Wallet")}
              {adjustDialog?.type === "points" && (isAr ? "تعديل النقاط" : "Adjust Points")}
            </DialogTitle>
            <DialogDescription>
              {isAr ? `العضو: ${adjustDialog?.name}` : `Member: ${adjustDialog?.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder={adjustDialog?.type === "points" ? (isAr ? "عدد النقاط" : "Points amount") : (isAr ? "المبلغ (SAR)" : "Amount (SAR)")}
              value={adjustAmount}
              onChange={e => setAdjustAmount(e.target.value)}
            />
            <Textarea
              placeholder={isAr ? "السبب (اختياري)" : "Reason (optional)"}
              value={adjustReason}
              onChange={e => setAdjustReason(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialog(null)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={() => adjustMutation.mutate()} disabled={adjustMutation.isPending || !adjustAmount} className="gap-1.5">
              {adjustMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isAr ? "تأكيد" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default MembershipWalletTab;
