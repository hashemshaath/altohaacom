import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Crown, Trophy, Gift, TrendingUp } from "lucide-react";

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
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Crown className="h-6 w-6 text-amber-500" />
          {isAr ? "نظام الولاء والمكافآت" : "Loyalty & Rewards"}
        </h1>
        <p className="text-sm text-muted-foreground">{isAr ? "إدارة المستويات والتحديات والمكافآت" : "Manage tiers, challenges, and rewards"}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="tiers">
        <TabsList>
          <TabsTrigger value="tiers">{isAr ? "المستويات" : "Tiers"}</TabsTrigger>
          <TabsTrigger value="challenges">{isAr ? "التحديات" : "Challenges"}</TabsTrigger>
          <TabsTrigger value="rewards">{isAr ? "المكافآت" : "Rewards"}</TabsTrigger>
          <TabsTrigger value="redemptions">{isAr ? "الاستبدالات" : "Redemptions"}</TabsTrigger>
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
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? "الكود" : "Code"}</TableHead>
                    <TableHead className="text-center">{isAr ? "النقاط" : "Points"}</TableHead>
                    <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                    <TableHead>{isAr ? "إجراء" : "Action"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {redemptions.map((r: any) => (
                    <TableRow key={r.id}>
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
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
