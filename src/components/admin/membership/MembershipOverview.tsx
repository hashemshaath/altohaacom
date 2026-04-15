import { CACHE } from "@/lib/queryConfig";
import { useIsAr } from "@/hooks/useIsAr";
import { memo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  Users, CreditCard, Star, TrendingUp, AlertTriangle, Clock,
  ArrowUpCircle, UserCheck, UserX, RefreshCw, Play, Loader2, CheckCircle2,
  DollarSign, Wallet, Receipt, ShieldCheck, Activity,
} from "lucide-react";
import { format, differenceInDays, subMonths, startOfMonth } from "date-fns";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { ActivityPulse } from "@/components/ui/activity-pulse";
import { useToast } from "@/hooks/use-toast";
import { MS_PER_DAY, QUERY_LIMIT_LARGE, QUERY_LIMIT_MEDIUM } from "@/lib/constants";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

const MembershipOverview = memo(function MembershipOverview() {
  const isAr = useIsAr();
  const { toast } = useToast();
  const [lastRunResult, setLastRunResult] = useState<{ auto_downgraded?: number; notifications_created?: number; expired?: number; warning?: number } | null>(null);

  const runExpiryCheck = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("check-membership-expiry", {
        body: { time: new Date().toISOString() },
      });
      if (error) throw handleSupabaseError(error);
      return data;
    },
    onSuccess: (data) => {
      setLastRunResult(data);
      toast({
        title: isAr ? "تم تنفيذ فحص العضويات" : "Membership check completed",
        description: isAr
          ? `${data.auto_downgraded || 0} تخفيض تلقائي، ${data.notifications_created || 0} إشعار`
          : `${data.auto_downgraded || 0} auto-downgraded, ${data.notifications_created || 0} notifications sent`,
      });
    },
    onError: (error) => toast({ variant: "destructive", title: "Error", description: error.message }),
  });

  const { data: stats } = useQuery({
    queryKey: ["membership-overview-stats"],
    queryFn: async () => {
      const [profilesRes, cardsRes, historyRes, cancellationsRes, invoicesRes, walletsRes] = await Promise.all([
        supabase.from("profiles").select("membership_tier, membership_status, membership_expires_at, created_at").limit(QUERY_LIMIT_LARGE),
        supabase.from("membership_cards").select("is_trial, trial_ends_at, card_status, expires_at").limit(QUERY_LIMIT_LARGE),
        supabase.from("membership_history").select("new_tier, previous_tier, created_at").order("created_at", { ascending: false }).limit(200),
        supabase.from("membership_cancellation_requests").select("status, created_at").eq("status", "pending").limit(QUERY_LIMIT_LARGE),
        supabase.from("invoices").select("amount, status, created_at, paid_at").order("created_at", { ascending: false }).limit(QUERY_LIMIT_MEDIUM),
        supabase.from("user_wallets").select("balance, points_balance").limit(QUERY_LIMIT_LARGE),
      ]);

      const profiles = profilesRes.data || [];
      const cards = cardsRes.data || [];
      const history = historyRes.data || [];
      const invoices = invoicesRes.data || [];
      const wallets = walletsRes.data || [];
      const now = new Date();

      const total = profiles.length;
      const basic = profiles.filter(p => !p.membership_tier || p.membership_tier === "basic").length;
      const professional = profiles.filter(p => p.membership_tier === "professional").length;
      const enterprise = profiles.filter(p => p.membership_tier === "enterprise").length;
      const active = profiles.filter(p => p.membership_status === "active").length;
      const expired = profiles.filter(p => p.membership_status === "expired").length;
      const suspended = profiles.filter(p => p.membership_status === "suspended").length;

      const expiringSoon = profiles.filter(p => {
        if (!p.membership_expires_at) return false;
        const days = differenceInDays(new Date(p.membership_expires_at), now);
        return days >= 0 && days <= 14;
      }).length;

      const trialMembers = cards.filter(c => c.is_trial && c.card_status === "active").length;
      const thirtyDaysAgo = new Date(now.getTime() - 30 * MS_PER_DAY);

      const tierOrder: Record<string, number> = { basic: 0, professional: 1, enterprise: 2 };
      const recentUpgrades = history.filter(h =>
        new Date(h.created_at) >= thirtyDaysAgo &&
        (tierOrder[h.new_tier] || 0) > (tierOrder[h.previous_tier || "basic"] || 0)
      ).length;
      const recentDowngrades = history.filter(h =>
        new Date(h.created_at) >= thirtyDaysAgo &&
        (tierOrder[h.new_tier] || 0) < (tierOrder[h.previous_tier || "basic"] || 0)
      ).length;

      const pendingCancellations = (cancellationsRes.data || []).length;
      const monthlyRevenue = (professional * 19) + (enterprise * 99);

      // Invoice stats
      const totalCollected = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.amount || 0), 0);
      const totalPending = invoices.filter(i => i.status === "pending").reduce((s, i) => s + (i.amount || 0), 0);
      const invoiceCount = invoices.length;

      // Wallet stats
      const totalWalletBalance = wallets.reduce((s, w) => s + (w.balance || 0), 0);
      const totalPoints = wallets.reduce((s, w) => s + (w.points_balance || 0), 0);

      // Monthly trend (last 6 months)
      const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
        const monthStart = startOfMonth(subMonths(now, 5 - i));
        const monthEnd = startOfMonth(subMonths(now, 4 - i));
        const upgrades = history.filter(h => {
          const d = new Date(h.created_at);
          return d >= monthStart && d < monthEnd && (tierOrder[h.new_tier] || 0) > (tierOrder[h.previous_tier || "basic"] || 0);
        }).length;
        const downgrades = history.filter(h => {
          const d = new Date(h.created_at);
          return d >= monthStart && d < monthEnd && (tierOrder[h.new_tier] || 0) < (tierOrder[h.previous_tier || "basic"] || 0);
        }).length;
        return { month: format(monthStart, "MMM"), upgrades, downgrades };
      });

      return {
        total, basic, professional, enterprise, active, expired, suspended,
        expiringSoon, trialMembers, recentUpgrades, recentDowngrades,
        pendingCancellations, monthlyRevenue, totalCollected, totalPending,
        invoiceCount, totalWalletBalance, totalPoints, monthlyTrend,
      };
    },
  });

  const paidPercentage = stats?.total ? Math.round(((stats.professional + stats.enterprise) / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Primary KPIs */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        {[
          { icon: Users, label: isAr ? "إجمالي الأعضاء" : "Total Members", value: stats?.total || 0, color: "text-primary", live: true },
          { icon: Star, label: isAr ? "احترافي" : "Professional", value: stats?.professional || 0, color: "text-primary" },
          { icon: TrendingUp, label: isAr ? "مؤسسي" : "Enterprise", value: stats?.enterprise || 0, color: "text-chart-2" },
          { icon: DollarSign, label: isAr ? "الإيراد الشهري" : "MRR (SAR)", value: stats?.monthlyRevenue || 0, color: "text-chart-2" },
          { icon: ShieldCheck, label: isAr ? "نشط" : "Active", value: stats?.active || 0, color: "text-chart-2" },
        ].map(c => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                {c.label}
                {c.live && <ActivityPulse status="live" size="sm" />}
              </CardTitle>
              <c.icon className={`h-3.5 w-3.5 ${c.color}`} />
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <AnimatedCounter value={c.value} className="text-xl font-bold" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts Row */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[
          { icon: AlertTriangle, label: isAr ? "تنتهي قريباً" : "Expiring Soon", value: stats?.expiringSoon || 0, warn: true },
          { icon: Clock, label: isAr ? "فترة تجريبية" : "On Trial", value: stats?.trialMembers || 0 },
          { icon: UserX, label: isAr ? "إلغاء معلق" : "Pending Cancel", value: stats?.pendingCancellations || 0, warn: true },
          { icon: ArrowUpCircle, label: isAr ? "ترقيات (30ي)" : "Upgrades (30d)", value: stats?.recentUpgrades || 0 },
        ].map(c => (
          <Card key={c.label} className={c.warn && c.value > 0 ? "border-destructive/40" : ""}>
            <CardContent className="flex items-center gap-3 py-3 px-4">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${c.warn && c.value > 0 ? "bg-destructive/10" : "bg-muted"}`}>
                <c.icon className={`h-4 w-4 ${c.warn && c.value > 0 ? "text-destructive" : "text-muted-foreground"}`} />
              </div>
              <div>
                <AnimatedCounter value={c.value} className="text-lg font-bold" />
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
              {c.warn && c.value > 0 && (
                <Badge variant="destructive" className="ms-auto text-xs">{isAr ? "إجراء" : "Action"}</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Financial Summary + Expiry Check */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              {isAr ? "ملخص مالي" : "Financial Summary"}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {[
              { label: isAr ? "محصّل" : "Collected", value: stats?.totalCollected || 0, color: "text-chart-2" },
              { label: isAr ? "معلّق" : "Pending", value: stats?.totalPending || 0, color: "text-chart-4" },
              { label: isAr ? "رصيد المحافظ" : "Wallet Balance", value: stats?.totalWalletBalance || 0, color: "text-primary" },
              { label: isAr ? "النقاط" : "Total Points", value: stats?.totalPoints || 0, color: "text-chart-3" },
            ].map(f => (
              <div key={f.label} className="rounded-xl border p-3 text-center">
                <AnimatedCounter value={f.value} className={`text-lg font-bold ${f.color}`} />
                <p className="text-xs text-muted-foreground mt-0.5">{f.label}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col justify-center gap-3 py-5">
            <div>
              <p className="text-sm font-semibold">{isAr ? "فحص انتهاء العضويات" : "Membership Expiry Check"}</p>
              <p className="text-xs text-muted-foreground">
                {isAr ? "تشغيل يدوي لفحص وتخفيض العضويات المنتهية وإرسال التنبيهات" : "Manually run expiry check, auto-downgrade & send alerts"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {lastRunResult && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-chart-2" />
                  {isAr
                    ? `${lastRunResult.auto_downgraded || 0} تخفيض · ${lastRunResult.notifications_created || 0} إشعار`
                    : `${lastRunResult.auto_downgraded || 0} downgraded · ${lastRunResult.notifications_created || 0} alerts`}
                </div>
              )}
              <Button
                size="sm"
                onClick={() => runExpiryCheck.mutate()}
                disabled={runExpiryCheck.isPending}
                className="gap-1.5 ms-auto"
              >
                {runExpiryCheck.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                {isAr ? "تشغيل الآن" : "Run Now"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Tier Distribution Pie */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">{isAr ? "توزيع المستويات" : "Tier Distribution"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: isAr ? "أساسي" : "Basic", value: stats?.basic || 0 },
                      { name: isAr ? "احترافي" : "Pro", value: stats?.professional || 0 },
                      { name: isAr ? "مؤسسي" : "Enterprise", value: stats?.enterprise || 0 },
                    ]}
                    cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={3} dataKey="value"
                  >
                    <Cell fill="hsl(var(--muted-foreground))" />
                    <Cell fill="hsl(var(--primary))" />
                    <Cell fill="hsl(var(--chart-2))" />
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-muted-foreground" />{isAr ? "أساسي" : "Basic"}</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-primary" />{isAr ? "احترافي" : "Pro"}</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-chart-2" />{isAr ? "مؤسسي" : "Ent"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">{isAr ? "معدل التحويل المدفوع" : "Paid Conversion"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-bold"><AnimatedCounter value={paidPercentage} />%</p>
            <Progress value={paidPercentage} className="h-2.5" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{isAr ? "مجاني" : "Free"}: {stats?.basic || 0}</span>
              <span>{isAr ? "مدفوع" : "Paid"}: {(stats?.professional || 0) + (stats?.enterprise || 0)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="rounded-xl border p-2 text-center">
                <AnimatedCounter value={stats?.recentUpgrades || 0} className="text-base text-primary font-bold" />
                <p className="text-xs text-muted-foreground">{isAr ? "ترقيات" : "Upgrades"}</p>
              </div>
              <div className="rounded-xl border p-2 text-center">
                <AnimatedCounter value={stats?.recentDowngrades || 0} className="text-base text-destructive font-bold" />
                <p className="text-xs text-muted-foreground">{isAr ? "تخفيضات" : "Downgrades"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
              {isAr ? "اتجاه 6 أشهر" : "6-Month Trend"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.monthlyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <RechartsTooltip />
                  <Bar dataKey="upgrades" name={isAr ? "ترقيات" : "Upgrades"} fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="downgrades" name={isAr ? "تخفيضات" : "Downgrades"} fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <RecentActivityFeed isAr={isAr} />
    </div>
  );
});

const RecentActivityFeed = memo(function RecentActivityFeed({ isAr }: { isAr: boolean }) {
  const { data: recentActivity } = useQuery({
    queryKey: ["membership-recent-activity"],
    queryFn: async () => {
      const { data } = await supabase
        .from("membership_history")
        .select("id, user_id, previous_tier, new_tier, reason, created_at")
        .order("created_at", { ascending: false })
        .limit(8);
      if (!data?.length) return [];

      const userIds = [...new Set(data.map(d => d.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url, account_number")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      return data.map(e => ({ ...e, profile: profileMap.get(e.user_id) || null }));
    },
    ...CACHE.realtime,
  });

  const tierLabels: Record<string, { en: string; ar: string }> = {
    basic: { en: "Basic", ar: "أساسي" },
    professional: { en: "Professional", ar: "احترافي" },
    enterprise: { en: "Enterprise", ar: "مؤسسي" },
  };

  if (!recentActivity?.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {isAr ? "آخر النشاطات" : "Recent Activity"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recentActivity.map((entry) => {
            const tierOrder: Record<string, number> = { basic: 0, professional: 1, enterprise: 2 };
            const isUpgrade = (tierOrder[entry.new_tier] || 0) > (tierOrder[entry.previous_tier || "basic"] || 0);
            const prev = tierLabels[entry.previous_tier || "basic"] || tierLabels.basic;
            const next = tierLabels[entry.new_tier] || tierLabels.basic;
            const profile = entry.profile as unknown as Record<string, string> | null;

            return (
              <div key={entry.id} className="flex items-center gap-3 rounded-lg border p-2.5 text-sm">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className={`text-xs ${isUpgrade ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {(profile?.full_name || "?")[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium truncate text-sm">
                      {profile?.full_name || profile?.username || entry.user_id.slice(0, 8)}
                    </p>
                    {isUpgrade
                      ? <ArrowUpCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                      : <UserX className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {isAr ? prev.ar : prev.en} → {isAr ? next.ar : next.en}
                    {entry.reason ? ` · ${entry.reason}` : ""}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">
                  {format(new Date(entry.created_at), "MMM d")}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

export default MembershipOverview;
