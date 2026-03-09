import { useLanguage } from "@/i18n/LanguageContext";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Crown, Trophy, Gift, TrendingUp } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { LoyaltyOverviewWidget } from "@/components/admin/LoyaltyOverviewWidget";
import { LoyaltyLiveStatsWidget } from "@/components/admin/LoyaltyLiveStatsWidget";
import { WalletAdminOverview } from "@/components/admin/WalletAdminOverview";
import { WalletTransactionHeatmap } from "@/components/admin/WalletTransactionHeatmap";
import { WalletPointsAnalyticsWidget } from "@/components/admin/WalletPointsAnalyticsWidget";

export default function LoyaltyAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const qc = useQueryClient();

  // Tiers
  const { data: tiers = [] } = useQuery({
    queryKey: ["adminLoyaltyTiers"],
    queryFn: async () => {
      const { data } = await supabase.from("loyalty_tiers").select("id, name, name_ar, slug, min_points, max_points, multiplier, badge_emoji, color, benefits, is_active, sort_order").order("sort_order");
      return data || [];
    },
  });

  // Challenges
  const { data: challenges = [] } = useQuery({
    queryKey: ["adminChallenges"],
    queryFn: async () => {
      const { data } = await supabase.from("challenges").select("id, title, title_ar, description, description_ar, category, challenge_type, target_action, target_count, reward_points, reward_badge, difficulty, icon_emoji, is_active, is_hidden, starts_at, ends_at, sort_order").order("sort_order");
      return data || [];
    },
  });

  // Rewards
  const { data: rewards = [] } = useQuery({
    queryKey: ["adminRewards"],
    queryFn: async () => {
      const { data } = await supabase.from("rewards_catalog").select("id, name, name_ar, description, description_ar, points_cost, category, image_url, is_active, stock_count, sort_order").order("sort_order");
      return data || [];
    },
  });

  // Redemptions
  const { data: redemptions = [] } = useQuery({
    queryKey: ["adminRedemptions"],
    queryFn: async () => {
      const { data } = await supabase.from("reward_redemptions").select("id, user_id, reward_id, points_spent, status, created_at").order("created_at", { ascending: false }).limit(50);
      return data || [];
    },
  });

  // Stats
  const { data: stats } = useQuery({
    queryKey: ["loyaltyStats"],
    queryFn: async () => {
      const { count: totalChallenges } = await supabase.from("challenges").select("*", { count: "exact", head: true }).eq("is_active", true);
      const { count: totalRewards } = await supabase.from("rewards_catalog").select("*", { count: "exact", head: true }).eq("is_active", true);
      const { count: totalRedemptions } = await supabase.from("reward_redemptions").select("*", { count: "exact", head: true });
      const { count: pendingRedemptions } = await supabase.from("reward_redemptions").select("*", { count: "exact", head: true }).eq("status", "pending");
      return { totalChallenges: totalChallenges || 0, totalRewards: totalRewards || 0, totalRedemptions: totalRedemptions || 0, pendingRedemptions: pendingRedemptions || 0 };
    },
  });

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

  // Sorting & pagination for challenges
  const { sorted: sortedChallenges, sortColumn: chSortCol, sortDirection: chSortDir, toggleSort: chToggleSort } = useTableSort(challenges);
  const chPagination = usePagination(sortedChallenges);

  // Sorting & pagination for rewards
  const { sorted: sortedRewards, sortColumn: rwSortCol, sortDirection: rwSortDir, toggleSort: rwToggleSort } = useTableSort(rewards);
  const rwPagination = usePagination(sortedRewards);

  // Sorting & pagination for redemptions
  const { sorted: sortedRedemptions, sortColumn: rdSortCol, sortDirection: rdSortDir, toggleSort: rdToggleSort } = useTableSort(redemptions);
  const rdPagination = usePagination(sortedRedemptions);

  const bulkRedemptions = useAdminBulkActions(rdPagination.paginated);

  const { exportCSV: exportRedemptions } = useCSVExport({
    columns: [
      { header: isAr ? "الكود" : "Code", accessor: (r: any) => r.redemption_code || "" },
      { header: isAr ? "النقاط" : "Points", accessor: (r: any) => r.points_spent },
      { header: isAr ? "الحالة" : "Status", accessor: (r: any) => r.status },
      { header: isAr ? "التاريخ" : "Date", accessor: (r: any) => new Date(r.created_at).toLocaleDateString() },
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

  const statCards = [
    { icon: Crown, label: isAr ? "المستويات" : "Tiers", value: tiers.length, color: "text-chart-1" },
    { icon: Trophy, label: isAr ? "التحديات" : "Challenges", value: stats?.totalChallenges || 0, color: "text-primary" },
    { icon: Gift, label: isAr ? "المكافآت" : "Rewards", value: stats?.totalRewards || 0, color: "text-chart-3" },
    { icon: TrendingUp, label: isAr ? "طلبات معلقة" : "Pending", value: stats?.pendingRedemptions || 0, color: "text-destructive" },
  ];

  const difficultyColors: Record<string, string> = {
    easy: "bg-chart-3/10 text-chart-3 border-chart-3/20",
    medium: "bg-chart-1/10 text-chart-1 border-chart-1/20",
    hard: "bg-destructive/10 text-destructive border-destructive/20",
    legendary: "bg-primary/10 text-primary border-primary/20",
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Crown}
        title={isAr ? "نظام الولاء والمكافآت" : "Loyalty & Rewards"}
        description={isAr ? "إدارة المستويات والتحديات والمكافآت" : "Manage tiers, challenges, and rewards"}
      />

      <LoyaltyLiveStatsWidget />
      <WalletPointsAnalyticsWidget />
      <WalletAdminOverview />
      <WalletTransactionHeatmap />
      <LoyaltyOverviewWidget />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <Card key={i} className="rounded-2xl border-border/40 bg-card/80 backdrop-blur group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/60 border border-border/30 transition-all duration-300 group-hover:scale-110 group-hover:shadow-sm`}>
                <s.icon className={`h-5 w-5 ${s.color} transition-transform duration-300`} />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="tiers">
        <TabsList className="rounded-2xl border border-border/40 bg-muted/30 backdrop-blur p-1.5 h-auto gap-1">
          <TabsTrigger value="tiers" className="rounded-xl data-[state=active]:shadow-sm gap-1.5 transition-all duration-300"><Crown className="h-3.5 w-3.5" />{isAr ? "المستويات" : "Tiers"}</TabsTrigger>
          <TabsTrigger value="challenges" className="rounded-xl data-[state=active]:shadow-sm gap-1.5 transition-all duration-300"><Trophy className="h-3.5 w-3.5" />{isAr ? "التحديات" : "Challenges"}</TabsTrigger>
          <TabsTrigger value="rewards" className="rounded-xl data-[state=active]:shadow-sm gap-1.5 transition-all duration-300"><Gift className="h-3.5 w-3.5" />{isAr ? "المكافآت" : "Rewards"}</TabsTrigger>
          <TabsTrigger value="redemptions" className="rounded-xl data-[state=active]:shadow-sm gap-1.5 transition-all duration-300"><TrendingUp className="h-3.5 w-3.5" />{isAr ? "الاستبدالات" : "Redemptions"}</TabsTrigger>
        </TabsList>

        <TabsContent value="tiers">
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
                  {tiers.map((t: any) => (
                    <TableRow key={t.id} className="transition-colors duration-200 hover:bg-muted/40">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/60 border border-border/30 text-lg transition-transform duration-300 group-hover:scale-110">
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
        </TabsContent>

        <TabsContent value="challenges">
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
                  {challenges.map((c: any) => (
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
          </AdminTableCard>
        </TabsContent>

        <TabsContent value="rewards">
          <AdminTableCard>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>{isAr ? "المكافأة" : "Reward"}</TableHead>
                    <TableHead>{isAr ? "الفئة" : "Category"}</TableHead>
                    <TableHead className="text-center">{isAr ? "التكلفة" : "Cost"}</TableHead>
                    <TableHead className="text-center">{isAr ? "الحد الأدنى" : "Min Tier"}</TableHead>
                    <TableHead className="text-center">{isAr ? "مميز" : "Featured"}</TableHead>
                    <TableHead className="text-center">{isAr ? "مفعّل" : "Active"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rewards.map((r: any) => (
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
          </AdminTableCard>
        </TabsContent>

        <TabsContent value="redemptions">
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
                    <TableHead className="text-center">{isAr ? "النقاط" : "Points"}</TableHead>
                    <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                    <TableHead>{isAr ? "إجراء" : "Action"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {redemptions.map((r: any) => (
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
                  {redemptions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {isAr ? "لا توجد طلبات استبدال" : "No redemptions yet"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
          </AdminTableCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
