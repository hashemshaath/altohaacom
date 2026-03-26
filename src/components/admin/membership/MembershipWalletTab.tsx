import { useState, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  Wallet, Search, ArrowUpRight, ArrowDownRight, Coins,
  TrendingUp, Users, CreditCard, Download,
} from "lucide-react";
import { format } from "date-fns";
import { useCSVExport } from "@/hooks/useCSVExport";

const MembershipWalletTab = memo(function MembershipWalletTab() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");

  const { data: walletStats } = useQuery({
    queryKey: ["membership-wallet-stats"],
    queryFn: async () => {
      const { data: wallets } = await supabase
        .from("user_wallets")
        .select("balance, total_earned, total_spent, points_balance, user_id");

      const totalBalance = wallets?.reduce((s, w) => s + (w.balance || 0), 0) || 0;
      const totalPoints = wallets?.reduce((s, w) => s + (w.points_balance || 0), 0) || 0;
      const totalEarned = wallets?.reduce((s, w) => s + (w.total_earned || 0), 0) || 0;
      const totalSpent = wallets?.reduce((s, w) => s + (w.total_spent || 0), 0) || 0;
      const activeWallets = wallets?.filter(w => (w.balance || 0) > 0).length || 0;

      return { totalBalance, totalPoints, totalEarned, totalSpent, activeWallets, total: wallets?.length || 0 };
    },
  });

  const { data: walletUsers, isLoading } = useQuery({
    queryKey: ["membership-wallet-users", search, tierFilter],
    queryFn: async () => {
      let query = supabase
        .from("user_wallets")
        .select("id, user_id, balance, total_earned, total_spent, points_balance, currency, created_at")
        .order("balance", { ascending: false })
        .limit(50);

      const { data: wallets } = await query;
      if (!wallets?.length) return [];

      const userIds = wallets.map(w => w.user_id);
      let profileQuery = supabase
        .from("profiles")
        .select("user_id, full_name, full_name_ar, username, avatar_url, membership_tier, account_number")
        .in("user_id", userIds);

      if (search) {
        profileQuery = profileQuery.or(`full_name.ilike.%${search}%,username.ilike.%${search}%,account_number.ilike.%${search}%`);
      }
      if (tierFilter !== "all") {
        profileQuery = profileQuery.eq("membership_tier", tierFilter);
      }

      const { data: profiles } = await profileQuery;
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return wallets
        .filter(w => profileMap.has(w.user_id))
        .map(w => ({ ...w, profile: profileMap.get(w.user_id) }));
    },
  });

  const { exportCSV } = useCSVExport({
    columns: [
      { header: isAr ? "الاسم" : "Name", accessor: (r: any) => r.profile?.full_name || "" },
      { header: isAr ? "المعرف" : "Username", accessor: (r: any) => r.profile?.username || "" },
      { header: isAr ? "المستوى" : "Tier", accessor: (r: any) => r.profile?.membership_tier || "basic" },
      { header: isAr ? "الرصيد" : "Balance", accessor: (r: any) => r.balance || 0 },
      { header: isAr ? "النقاط" : "Points", accessor: (r: any) => r.points_balance || 0 },
      { header: isAr ? "إجمالي المكتسب" : "Total Earned", accessor: (r: any) => r.total_earned || 0 },
      { header: isAr ? "إجمالي المنفق" : "Total Spent", accessor: (r: any) => r.total_spent || 0 },
    ],
    filename: "membership-wallets",
  });

  const statCards = [
    { icon: Wallet, label: isAr ? "إجمالي الأرصدة" : "Total Balance", value: walletStats?.totalBalance || 0, suffix: " SAR", color: "text-primary" },
    { icon: Coins, label: isAr ? "إجمالي النقاط" : "Total Points", value: walletStats?.totalPoints || 0, color: "text-chart-2" },
    { icon: TrendingUp, label: isAr ? "إجمالي المكتسب" : "Total Earned", value: walletStats?.totalEarned || 0, suffix: " SAR", color: "text-chart-3" },
    { icon: Users, label: isAr ? "محافظ نشطة" : "Active Wallets", value: walletStats?.activeWallets || 0, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
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

      {/* Filters & Table */}
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
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
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
                    <TableHead className="text-xs text-end">{isAr ? "مكتسب" : "Earned"}</TableHead>
                    <TableHead className="text-xs text-end">{isAr ? "منفق" : "Spent"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {walletUsers?.map((item: any) => (
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
                      <TableCell className="text-end text-chart-3 tabular-nums">
                        <div className="flex items-center justify-end gap-1">
                          <ArrowUpRight className="h-3 w-3" />
                          {(item.total_earned || 0).toFixed(0)}
                        </div>
                      </TableCell>
                      <TableCell className="text-end text-destructive tabular-nums">
                        <div className="flex items-center justify-end gap-1">
                          <ArrowDownRight className="h-3 w-3" />
                          {(item.total_spent || 0).toFixed(0)}
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
    </div>
  );
});

export default MembershipWalletTab;
