import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
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
      const { data } = await supabase.from("loyalty_tiers").select("*").order("sort_order");
      return data || [];
    },
  });

  // Challenges
  const { data: challenges = [] } = useQuery({
    queryKey: ["adminChallenges"],
    queryFn: async () => {
      const { data } = await supabase.from("challenges").select("*").order("sort_order");
      return data || [];
    },
  });

  // Rewards
  const { data: rewards = [] } = useQuery({
    queryKey: ["adminRewards"],
    queryFn: async () => {
      const { data } = await supabase.from("rewards_catalog").select("*").order("sort_order");
      return data || [];
    },
  });

  // Redemptions
  const { data: redemptions = [] } = useQuery({
    queryKey: ["adminRedemptions"],
    queryFn: async () => {
      const { data } = await supabase.from("reward_redemptions").select("*").order("created_at", { ascending: false }).limit(50);
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

  const bulkRedemptions = useAdminBulkActions(redemptions);

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
          <Card key={i} className="rounded-2xl border-border/40 group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 bg-muted`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="tiers">
        <TabsList className="rounded-2xl border border-border/40 bg-muted/30 backdrop-blur p-1.5 h-auto">
          <TabsTrigger value="tiers" className="rounded-xl data-[state=active]:shadow-sm">{isAr ? "المستويات" : "Tiers"}</TabsTrigger>
          <TabsTrigger value="challenges" className="rounded-xl data-[state=active]:shadow-sm">{isAr ? "التحديات" : "Challenges"}</TabsTrigger>
          <TabsTrigger value="rewards" className="rounded-xl data-[state=active]:shadow-sm">{isAr ? "المكافآت" : "Rewards"}</TabsTrigger>
          <TabsTrigger value="redemptions" className="rounded-xl data-[state=active]:shadow-sm">{isAr ? "الاستبدالات" : "Redemptions"}</TabsTrigger>
        </TabsList>

        <TabsContent value="tiers">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? "المستوى" : "Tier"}</TableHead>
                    <TableHead className="text-center">{isAr ? "الحد الأدنى" : "Min Points"}</TableHead>
                    <TableHead className="text-center">{isAr ? "المضاعف" : "Multiplier"}</TableHead>
                    <TableHead>{isAr ? "المزايا" : "Benefits"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiers.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{t.icon_emoji}</span>
                          <div>
                            <p className="font-medium">{isAr ? t.name_ar : t.name}</p>
                            <p className="text-xs text-muted-foreground">{t.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono">{t.min_points.toLocaleString()}</TableCell>
                      <TableCell className="text-center font-mono">×{t.multiplier}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(t.benefits as string[] || []).map((b: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-[10px]">{b}</Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? "التحدي" : "Challenge"}</TableHead>
                    <TableHead>{isAr ? "الفئة" : "Category"}</TableHead>
                    <TableHead className="text-center">{isAr ? "الهدف" : "Target"}</TableHead>
                    <TableHead className="text-center">{isAr ? "النقاط" : "Points"}</TableHead>
                    <TableHead>{isAr ? "الصعوبة" : "Difficulty"}</TableHead>
                    <TableHead className="text-center">{isAr ? "مفعّل" : "Active"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {challenges.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{c.icon_emoji}</span>
                          <span className="font-medium text-sm">{isAr ? c.title_ar : c.title}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] uppercase">{c.category}</Badge></TableCell>
                      <TableCell className="text-center font-mono">{c.target_count}</TableCell>
                      <TableCell className="text-center font-mono text-primary font-bold">{c.reward_points}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={difficultyColors[c.difficulty] || ""}>{c.difficulty}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch checked={c.is_active} onCheckedChange={v => updateChallenge.mutate({ id: c.id, updates: { is_active: v } })} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
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
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-sm">{isAr ? r.name_ar : r.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] uppercase">{r.category}</Badge></TableCell>
                      <TableCell className="text-center font-mono text-primary font-bold">{r.points_cost}</TableCell>
                      <TableCell className="text-center"><Badge variant="secondary" className="text-[10px]">{r.min_tier}</Badge></TableCell>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="redemptions">
          <BulkActionBar
            count={bulkRedemptions.count}
            onClear={bulkRedemptions.clearSelection}
            onExport={() => exportRedemptions(bulkRedemptions.selectedItems)}
            onStatusChange={bulkFulfill}
          />
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
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
                    <TableRow key={r.id} className={bulkRedemptions.isSelected(r.id) ? "bg-primary/5" : ""}>
                      <TableCell>
                        <Checkbox checked={bulkRedemptions.isSelected(r.id)} onCheckedChange={() => bulkRedemptions.toggleOne(r.id)} />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.redemption_code || "—"}</TableCell>
                      <TableCell className="text-center font-mono">{r.points_spent}</TableCell>
                      <TableCell>
                        <Badge variant={r.status === "fulfilled" ? "default" : r.status === "pending" ? "secondary" : "outline"}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {r.status === "pending" && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => updateRedemption.mutate({ id: r.id, status: "fulfilled" })}>
                              {isAr ? "تنفيذ" : "Fulfill"}
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateRedemption.mutate({ id: r.id, status: "cancelled" })}>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
