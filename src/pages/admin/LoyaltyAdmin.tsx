import { useState, lazy, Suspense, useCallback, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { useTableSort } from "@/hooks/useTableSort";
import { usePagination } from "@/hooks/usePagination";
import { SortableTableHead } from "@/components/admin/SortableTableHead";
import { AdminTablePagination } from "@/components/admin/AdminTablePagination";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { AdminTableCard } from "@/components/admin/AdminTableCard";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Crown, Trophy, Gift, TrendingUp, BarChart3, Flame, Wallet, Activity, Star } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { QUERY_LIMIT_LARGE } from "@/lib/constants";

// Lazy load heavy analytics widgets
const LoyaltyOverviewWidget = lazy(() => import("@/components/admin/LoyaltyOverviewWidget").then(m => ({ default: m.LoyaltyOverviewWidget })));
const LoyaltyLiveStatsWidget = lazy(() => import("@/components/admin/LoyaltyLiveStatsWidget").then(m => ({ default: m.LoyaltyLiveStatsWidget })));
const WalletAdminOverview = lazy(() => import("@/components/admin/WalletAdminOverview").then(m => ({ default: m.WalletAdminOverview })));
const WalletTransactionHeatmap = lazy(() => import("@/components/admin/WalletTransactionHeatmap").then(m => ({ default: m.WalletTransactionHeatmap })));
const WalletPointsAnalyticsWidget = lazy(() => import("@/components/admin/WalletPointsAnalyticsWidget").then(m => ({ default: m.WalletPointsAnalyticsWidget })));

const TAB_GROUPS = [
  {
    labelEn: "Overview",
    labelAr: "نظرة عامة",
    tabs: [
      { id: "dashboard", icon: BarChart3, labelEn: "Dashboard", labelAr: "لوحة القيادة" },
      { id: "wallet", icon: Wallet, labelEn: "Wallet", labelAr: "المحفظة" },
      { id: "heatmap", icon: Flame, labelEn: "Heatmap", labelAr: "خريطة حرارية" },
    ],
  },
  {
    labelEn: "Management",
    labelAr: "الإدارة",
    tabs: [
      { id: "tiers", icon: Crown, labelEn: "Tiers", labelAr: "المستويات" },
      { id: "challenges", icon: Trophy, labelEn: "Challenges", labelAr: "التحديات" },
      { id: "rewards", icon: Gift, labelEn: "Rewards", labelAr: "المكافآت" },
      { id: "redemptions", icon: TrendingUp, labelEn: "Redemptions", labelAr: "الاستبدالات" },
    ],
  },
  {
    labelEn: "Analytics",
    labelAr: "تحليلات",
    tabs: [
      { id: "points", icon: Star, labelEn: "Points", labelAr: "النقاط" },
      { id: "activity", icon: Activity, labelEn: "Activity", labelAr: "النشاط" },
    ],
  },
];

function TabSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-56 w-full rounded-xl" />
    </div>
  );
}

const difficultyColors: Record<string, string> = {
  easy: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  medium: "bg-chart-1/10 text-chart-1 border-chart-1/20",
  hard: "bg-destructive/10 text-destructive border-destructive/20",
  legendary: "bg-primary/10 text-primary border-primary/20",
};

export default memo(function LoyaltyAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");
  const handleTabChange = useCallback((id: string) => setActiveTab(id), []);

  // ─── Queries ─────────────────────────────────────────
  const { data: tiers = [] } = useQuery({
    queryKey: ["adminLoyaltyTiers"],
    queryFn: async () => {
      const { data } = await supabase.from("loyalty_tiers").select("id, name, name_ar, slug, min_points, multiplier, icon_emoji, color, benefits, is_active, sort_order").order("sort_order").limit(QUERY_LIMIT_LARGE);
      return data || [];
    },
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ["adminChallenges"],
    queryFn: async () => {
      const { data } = await supabase.from("challenges").select("id, title, title_ar, description, description_ar, category, challenge_type, target_action, target_count, reward_points, reward_badge, difficulty, icon_emoji, is_active, is_hidden, starts_at, ends_at, sort_order").order("sort_order").limit(QUERY_LIMIT_LARGE);
      return data || [];
    },
  });

  const { data: rewards = [] } = useQuery({
    queryKey: ["adminRewards"],
    queryFn: async () => {
      const { data } = await supabase.from("rewards_catalog").select("id, name, name_ar, description, description_ar, points_cost, category, image_url, is_active, is_featured, min_tier, stock, sort_order").order("sort_order").limit(QUERY_LIMIT_LARGE);
      return data || [];
    },
  });

  const { data: redemptions = [] } = useQuery({
    queryKey: ["adminRedemptions"],
    queryFn: async () => {
      const { data } = await supabase.from("reward_redemptions").select("id, user_id, reward_id, points_spent, redemption_code, status, created_at").order("created_at", { ascending: false }).limit(50);
      return data || [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["loyaltyStats"],
    queryFn: async () => {
      const { count: totalChallenges } = await supabase.from("challenges").select("id", { count: "exact", head: true }).eq("is_active", true);
      const { count: totalRewards } = await supabase.from("rewards_catalog").select("id", { count: "exact", head: true }).eq("is_active", true);
      const { count: totalRedemptions } = await supabase.from("reward_redemptions").select("id", { count: "exact", head: true });
      const { count: pendingRedemptions } = await supabase.from("reward_redemptions").select("id", { count: "exact", head: true }).eq("status", "pending");
      return { totalChallenges: totalChallenges || 0, totalRewards: totalRewards || 0, totalRedemptions: totalRedemptions || 0, pendingRedemptions: pendingRedemptions || 0 };
    },
  });

  // ─── Mutations ───────────────────────────────────────
  const updateChallenge = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("challenges").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["adminChallenges"] }); toast({ title: isAr ? "تم التحديث" : "Updated" }); },
  });

  const updateReward = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("rewards_catalog").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["adminRewards"] }); toast({ title: isAr ? "تم التحديث" : "Updated" }); },
  });

  const updateRedemption = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: Record<string, any> = { status };
      if (status === "fulfilled") updates.fulfilled_at = new Date().toISOString();
      const { error } = await supabase.from("reward_redemptions").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["adminRedemptions"] }); toast({ title: isAr ? "تم التحديث" : "Updated" }); },
  });

  // ─── Table hooks ─────────────────────────────────────
  const { sorted: sortedChallenges, sortColumn: chSortCol, sortDirection: chSortDir, toggleSort: chToggleSort } = useTableSort(challenges);
  const chPagination = usePagination(sortedChallenges);

  const { sorted: sortedRewards, sortColumn: rwSortCol, sortDirection: rwSortDir, toggleSort: rwToggleSort } = useTableSort(rewards);
  const rwPagination = usePagination(sortedRewards);

  const { sorted: sortedRedemptions, sortColumn: rdSortCol, sortDirection: rdSortDir, toggleSort: rdToggleSort } = useTableSort(redemptions);
  const rdPagination = usePagination(sortedRedemptions);

  const bulkRedemptions = useAdminBulkActions(rdPagination.paginated);

  const { exportCSV: exportRedemptions } = useCSVExport({
    columns: [
      { header: isAr ? "الكود" : "Code", accessor: (r) => r.redemption_code || "" },
      { header: isAr ? "النقاط" : "Points", accessor: (r) => r.points_spent },
      { header: isAr ? "الحالة" : "Status", accessor: (r) => r.status },
      { header: isAr ? "التاريخ" : "Date", accessor: (r) => new Date(r.created_at).toLocaleDateString() },
    ],
    filename: "redemptions",
  });

  const bulkFulfill = async () => {
    const ids = [...bulkRedemptions.selected];
    const { error } = await supabase.from("reward_redemptions")
      .update({ status: "fulfilled", fulfilled_at: new Date().toISOString() })
      .in("id", ids).eq("status", "pending");
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    qc.invalidateQueries({ queryKey: ["adminRedemptions"] });
    bulkRedemptions.clearSelection();
    toast({ title: isAr ? `تم تنفيذ ${ids.length} طلب` : `${ids.length} fulfilled` });
  };

  // ─── KPI Data ────────────────────────────────────────
  const statCards = [
    { icon: Crown, label: isAr ? "المستويات" : "Tiers", value: tiers.length, color: "text-chart-1", bg: "bg-chart-1/10" },
    { icon: Trophy, label: isAr ? "التحديات النشطة" : "Active Challenges", value: stats?.totalChallenges || 0, color: "text-primary", bg: "bg-primary/10" },
    { icon: Gift, label: isAr ? "المكافآت النشطة" : "Active Rewards", value: stats?.totalRewards || 0, color: "text-chart-3", bg: "bg-chart-3/10" },
    { icon: TrendingUp, label: isAr ? "إجمالي الاستبدالات" : "Total Redemptions", value: stats?.totalRedemptions || 0, color: "text-chart-5", bg: "bg-chart-5/10" },
    { icon: Activity, label: isAr ? "طلبات معلقة" : "Pending", value: stats?.pendingRedemptions || 0, color: "text-destructive", bg: "bg-destructive/10" },
  ];

  // ─── Tab Content Map ─────────────────────────────────
  const TAB_CONTENT: Record<string, React.ReactNode> = {
    dashboard: (
      <div className="space-y-4">
        <LoyaltyLiveStatsWidget />
        <LoyaltyOverviewWidget />
      </div>
    ),
    wallet: <WalletAdminOverview />,
    heatmap: <WalletTransactionHeatmap />,
    points: <WalletPointsAnalyticsWidget />,
    activity: <LoyaltyLiveStatsWidget />,
    tiers: (
      <AdminTableCard>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>{isAr ? "المستوى" : "Tier"}</TableHead>
              <TableHead className="text-center">{isAr ? "الحد الأدنى" : "Min Points"}</TableHead>
              <TableHead className="text-center">{isAr ? "المضاعف" : "Multiplier"}</TableHead>
              <TableHead>{isAr ? "المزايا" : "Benefits"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiers.map((t) => (
              <TableRow key={t.id} className="transition-colors duration-200 hover:bg-muted/40">
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/60 border border-border/30 text-lg">
                      {t.icon_emoji}
                    </div>
                    <div>
                      <p className="font-medium">{isAr ? t.name_ar : t.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{t.slug}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center font-mono tabular-nums">{t.min_points.toLocaleString()}</TableCell>
                <TableCell className="text-center font-mono tabular-nums">×{t.multiplier}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(t.benefits as string[] || []).map((b: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-[10px] rounded-lg">{b}</Badge>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminTableCard>
    ),
    challenges: (
      <AdminTableCard>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <SortableTableHead column="title" label={isAr ? "التحدي" : "Challenge"} sortColumn={chSortCol} sortDirection={chSortDir} onSort={chToggleSort} />
              <SortableTableHead column="category" label={isAr ? "الفئة" : "Category"} sortColumn={chSortCol} sortDirection={chSortDir} onSort={chToggleSort} />
              <SortableTableHead column="target_count" label={isAr ? "الهدف" : "Target"} sortColumn={chSortCol} sortDirection={chSortDir} onSort={chToggleSort} className="text-center" />
              <SortableTableHead column="reward_points" label={isAr ? "النقاط" : "Points"} sortColumn={chSortCol} sortDirection={chSortDir} onSort={chToggleSort} className="text-center" />
              <SortableTableHead column="difficulty" label={isAr ? "الصعوبة" : "Difficulty"} sortColumn={chSortCol} sortDirection={chSortDir} onSort={chToggleSort} />
              <TableHead className="text-center">{isAr ? "مفعّل" : "Active"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chPagination.paginated.map((c) => (
              <TableRow key={c.id} className="transition-colors duration-200 hover:bg-muted/40 group">
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/60 border border-border/30 text-lg transition-transform duration-300 group-hover:scale-110">
                      {c.icon_emoji}
                    </div>
                    <span className="font-medium text-sm">{isAr ? c.title_ar : c.title}</span>
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline" className="text-[10px] uppercase rounded-lg">{c.category}</Badge></TableCell>
                <TableCell className="text-center font-mono tabular-nums">{c.target_count}</TableCell>
                <TableCell className="text-center font-mono tabular-nums text-primary font-bold">{c.reward_points}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`rounded-lg ${difficultyColors[c.difficulty] || ""}`}>{c.difficulty}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Switch checked={c.is_active} onCheckedChange={v => updateChallenge.mutate({ id: c.id, updates: { is_active: v } })} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <AdminTablePagination page={chPagination.page} totalPages={chPagination.totalPages} totalItems={chPagination.totalItems} startItem={chPagination.startItem} endItem={chPagination.endItem} pageSize={chPagination.pageSize} pageSizeOptions={chPagination.pageSizeOptions} hasNext={chPagination.hasNext} hasPrev={chPagination.hasPrev} onPageChange={chPagination.goTo} onPageSizeChange={chPagination.changePageSize} />
      </AdminTableCard>
    ),
    rewards: (
      <AdminTableCard>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <SortableTableHead column="name" label={isAr ? "المكافأة" : "Reward"} sortColumn={rwSortCol} sortDirection={rwSortDir} onSort={rwToggleSort} />
              <SortableTableHead column="category" label={isAr ? "الفئة" : "Category"} sortColumn={rwSortCol} sortDirection={rwSortDir} onSort={rwToggleSort} />
              <SortableTableHead column="points_cost" label={isAr ? "التكلفة" : "Cost"} sortColumn={rwSortCol} sortDirection={rwSortDir} onSort={rwToggleSort} className="text-center" />
              <TableHead className="text-center">{isAr ? "الحد الأدنى" : "Min Tier"}</TableHead>
              <TableHead className="text-center">{isAr ? "مميز" : "Featured"}</TableHead>
              <TableHead className="text-center">{isAr ? "مفعّل" : "Active"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rwPagination.paginated.map((r) => (
              <TableRow key={r.id} className="transition-colors duration-200 hover:bg-muted/40">
                <TableCell className="font-medium text-sm">{isAr ? r.name_ar : r.name}</TableCell>
                <TableCell><Badge variant="outline" className="text-[10px] uppercase rounded-lg">{r.category}</Badge></TableCell>
                <TableCell className="text-center font-mono tabular-nums text-primary font-bold">{r.points_cost}</TableCell>
                <TableCell className="text-center"><Badge variant="secondary" className="text-[10px] rounded-lg">{r.min_tier}</Badge></TableCell>
                <TableCell className="text-center">
                  <Switch checked={r.is_featured} onCheckedChange={v => updateReward.mutate({ id: r.id, updates: { is_featured: v } })} />
                </TableCell>
                <TableCell className="text-center">
                  <Switch checked={r.is_active} onCheckedChange={v => updateReward.mutate({ id: r.id, updates: { is_active: v } })} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <AdminTablePagination page={rwPagination.page} totalPages={rwPagination.totalPages} totalItems={rwPagination.totalItems} startItem={rwPagination.startItem} endItem={rwPagination.endItem} pageSize={rwPagination.pageSize} pageSizeOptions={rwPagination.pageSizeOptions} hasNext={rwPagination.hasNext} hasPrev={rwPagination.hasPrev} onPageChange={rwPagination.goTo} onPageSizeChange={rwPagination.changePageSize} />
      </AdminTableCard>
    ),
    redemptions: (
      <div className="space-y-3">
        <BulkActionBar
          count={bulkRedemptions.count}
          onClear={bulkRedemptions.clearSelection}
          onExport={() => exportRedemptions(bulkRedemptions.selectedItems)}
          onStatusChange={bulkFulfill}
        />
        <AdminTableCard>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-10">
                  <Checkbox checked={bulkRedemptions.isAllSelected} onCheckedChange={bulkRedemptions.toggleAll} />
                </TableHead>
                <TableHead>{isAr ? "الكود" : "Code"}</TableHead>
                <SortableTableHead column="points_spent" label={isAr ? "النقاط" : "Points"} sortColumn={rdSortCol} sortDirection={rdSortDir} onSort={rdToggleSort} className="text-center" />
                <SortableTableHead column="status" label={isAr ? "الحالة" : "Status"} sortColumn={rdSortCol} sortDirection={rdSortDir} onSort={rdToggleSort} />
                <SortableTableHead column="created_at" label={isAr ? "التاريخ" : "Date"} sortColumn={rdSortCol} sortDirection={rdSortDir} onSort={rdToggleSort} />
                <TableHead>{isAr ? "إجراء" : "Action"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rdPagination.paginated.map((r) => (
                <TableRow key={r.id} className={`transition-colors duration-200 hover:bg-muted/40 ${bulkRedemptions.isSelected(r.id) ? "bg-primary/5" : ""}`}>
                  <TableCell>
                    <Checkbox checked={bulkRedemptions.isSelected(r.id)} onCheckedChange={() => bulkRedemptions.toggleOne(r.id)} />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.redemption_code || "—"}</TableCell>
                  <TableCell className="text-center font-mono tabular-nums">{r.points_spent}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === "fulfilled" ? "default" : r.status === "pending" ? "secondary" : "outline"} className="rounded-lg">
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {r.status === "pending" && (
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="default" className="h-7 text-xs rounded-lg" onClick={() => updateRedemption.mutate({ id: r.id, status: "fulfilled" })}>
                          {isAr ? "تنفيذ" : "Fulfill"}
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg" onClick={() => updateRedemption.mutate({ id: r.id, status: "cancelled" })}>
                          {isAr ? "إلغاء" : "Cancel"}
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {rdPagination.paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <AdminEmptyState icon={Gift} title="No redemptions yet" titleAr="لا توجد طلبات استبدال" description="Reward redemptions will appear here" descriptionAr="ستظهر طلبات استبدال المكافآت هنا" />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <AdminTablePagination page={rdPagination.page} totalPages={rdPagination.totalPages} totalItems={rdPagination.totalItems} startItem={rdPagination.startItem} endItem={rdPagination.endItem} pageSize={rdPagination.pageSize} pageSizeOptions={rdPagination.pageSizeOptions} hasNext={rdPagination.hasNext} hasPrev={rdPagination.hasPrev} onPageChange={rdPagination.goTo} onPageSizeChange={rdPagination.changePageSize} />
        </AdminTableCard>
      </div>
    ),
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <AdminPageHeader
        icon={Crown}
        title={isAr ? "نظام الولاء والمكافآت" : "Loyalty & Rewards"}
        description={isAr ? "إدارة المستويات والتحديات والمكافآت والمحافظ" : "Manage tiers, challenges, rewards & wallets"}
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map((s, i) => (
          <Card key={i} className="rounded-2xl border-border/40 group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${s.bg} border border-border/30 transition-transform duration-300 group-hover:scale-110`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div>
                <AnimatedCounter value={s.value} className="text-xl font-bold tabular-nums" />
                <p className="text-[10px] text-muted-foreground font-medium">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Grouped Tab Navigation */}
      <div className="sticky top-0 z-20 rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm print:hidden">
        <ScrollArea className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-stretch sm:divide-x sm:divide-border/40 sm:rtl:divide-x-reverse min-w-max">
            {TAB_GROUPS.map((group) => (
              <div key={group.labelEn} className="flex flex-col">
                <div className="px-3 py-1 bg-muted/40 border-b border-border/40">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {isAr ? group.labelAr : group.labelEn}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 px-1 py-1 flex-wrap sm:flex-nowrap">
                  {group.tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`
                          flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-all active:scale-95
                          ${isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }
                        `}
                      >
                        <Icon className="h-3 w-3 shrink-0" />
                        <span className="whitespace-nowrap">{isAr ? tab.labelAr : tab.labelEn}</span>
                        {tab.id === "redemptions" && (stats?.pendingRedemptions ?? 0) > 0 && (
                          <Badge variant="destructive" className="ms-0.5 h-4 min-w-4 px-1 text-[10px]">{stats?.pendingRedemptions}</Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="h-1.5" />
        </ScrollArea>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        <Suspense fallback={<TabSkeleton />}>
          {TAB_CONTENT[activeTab] || null}
        </Suspense>
      </div>
    </div>
  );
});
