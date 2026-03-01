import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users, CreditCard, Star, TrendingUp, AlertTriangle, Clock,
  ArrowUpCircle, UserCheck, UserX, RefreshCw
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { ActivityPulse } from "@/components/ui/activity-pulse";

export default function MembershipOverview() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: stats } = useQuery({
    queryKey: ["membership-overview-stats"],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("membership_tier, membership_status, membership_expires_at, created_at");

      const { data: cards } = await supabase
        .from("membership_cards")
        .select("is_trial, trial_ends_at, card_status, expires_at");

      const { data: history } = await supabase
        .from("membership_history")
        .select("new_tier, previous_tier, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      const { data: cancellations } = await supabase
        .from("membership_cancellation_requests")
        .select("status, created_at")
        .eq("status", "pending");

      const now = new Date();
      const total = profiles?.length || 0;
      const basic = profiles?.filter(p => !p.membership_tier || p.membership_tier === "basic").length || 0;
      const professional = profiles?.filter(p => p.membership_tier === "professional").length || 0;
      const enterprise = profiles?.filter(p => p.membership_tier === "enterprise").length || 0;
      const active = profiles?.filter(p => p.membership_status === "active").length || 0;
      const expired = profiles?.filter(p => p.membership_status === "expired").length || 0;
      const suspended = profiles?.filter(p => p.membership_status === "suspended").length || 0;

      // Expiring soon (within 14 days)
      const expiringSoon = profiles?.filter(p => {
        if (!p.membership_expires_at) return false;
        const days = differenceInDays(new Date(p.membership_expires_at), now);
        return days >= 0 && days <= 14;
      }).length || 0;

      // Trial members
      const trialMembers = cards?.filter(c => c.is_trial && c.card_status === "active").length || 0;
      const trialExpired = cards?.filter(c => {
        if (!c.trial_ends_at) return false;
        return new Date(c.trial_ends_at) < now;
      }).length || 0;

      // Recent upgrades (last 30 days)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const recentUpgrades = history?.filter(h => {
        const tierOrder = { basic: 0, professional: 1, enterprise: 2 };
        return new Date(h.created_at) >= thirtyDaysAgo &&
          (tierOrder[h.new_tier as keyof typeof tierOrder] || 0) > (tierOrder[h.previous_tier as keyof typeof tierOrder] || 0);
      }).length || 0;

      const recentDowngrades = history?.filter(h => {
        const tierOrder = { basic: 0, professional: 1, enterprise: 2 };
        return new Date(h.created_at) >= thirtyDaysAgo &&
          (tierOrder[h.new_tier as keyof typeof tierOrder] || 0) < (tierOrder[h.previous_tier as keyof typeof tierOrder] || 0);
      }).length || 0;

      const pendingCancellations = cancellations?.length || 0;

      // Revenue estimate
      const monthlyRevenue = (professional * 19) + (enterprise * 99);

      return {
        total, basic, professional, enterprise, active, expired, suspended,
        expiringSoon, trialMembers, trialExpired, recentUpgrades, recentDowngrades,
        pendingCancellations, monthlyRevenue
      };
    },
  });

  const statCards = [
    { icon: Users, label: isAr ? "إجمالي الأعضاء" : "Total Members", value: stats?.total || 0, color: "text-primary" },
    { icon: CreditCard, label: isAr ? "الأساسي" : "Basic", value: stats?.basic || 0, color: "text-muted-foreground" },
    { icon: Star, label: isAr ? "الاحترافي" : "Professional", value: stats?.professional || 0, color: "text-primary" },
    { icon: TrendingUp, label: isAr ? "المؤسسي" : "Enterprise", value: stats?.enterprise || 0, color: "text-chart-2" },
  ];

  const alertCards = [
    { icon: AlertTriangle, label: isAr ? "تنتهي قريباً" : "Expiring Soon", value: stats?.expiringSoon || 0, variant: "destructive" as const },
    { icon: Clock, label: isAr ? "فترة تجريبية" : "On Trial", value: stats?.trialMembers || 0, variant: "secondary" as const },
    { icon: UserX, label: isAr ? "طلبات إلغاء معلقة" : "Pending Cancellations", value: stats?.pendingCancellations || 0, variant: "destructive" as const },
    { icon: ArrowUpCircle, label: isAr ? "ترقيات (30 يوم)" : "Upgrades (30d)", value: stats?.recentUpgrades || 0, variant: "default" as const },
  ];

  const paidPercentage = stats?.total ? Math.round(((stats.professional + stats.enterprise) / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                {card.label}
                {i === 0 && <ActivityPulse status="live" size="sm" />}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <AnimatedCounter value={card.value} className="text-2xl" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts & Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {alertCards.map((card) => (
          <Card key={card.label} className={card.value > 0 && card.variant === "destructive" ? "border-destructive/50" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.value > 0 && card.variant === "destructive" ? "text-destructive" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AnimatedCounter value={card.value} className="text-2xl" />
                {card.value > 0 && card.variant === "destructive" && (
                  <Badge variant="destructive" className="text-xs">
                    {isAr ? "يحتاج إجراء" : "Action needed"}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue & Conversion */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isAr ? "الإيرادات الشهرية المقدرة" : "Estimated Monthly Revenue"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-3xl font-bold"><AnimatedCounter value={stats?.monthlyRevenue || 0} /> SAR</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>{isAr ? "الاحترافي" : "Professional"} ({stats?.professional || 0} × 19 SAR)</span>
                <span>{(stats?.professional || 0) * 19} SAR</span>
              </div>
              <div className="flex justify-between">
                <span>{isAr ? "المؤسسي" : "Enterprise"} ({stats?.enterprise || 0} × 99 SAR)</span>
                <span>{(stats?.enterprise || 0) * 99} SAR</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isAr ? "معدل التحويل المدفوع" : "Paid Conversion Rate"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-3xl font-bold"><AnimatedCounter value={paidPercentage} />%</p>
            <Progress value={paidPercentage} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{isAr ? "مجاني" : "Free"}: {stats?.basic || 0}</span>
              <span>{isAr ? "مدفوع" : "Paid"}: {(stats?.professional || 0) + (stats?.enterprise || 0)}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="rounded-xl border p-3 text-center">
                <AnimatedCounter value={stats?.recentUpgrades || 0} className="text-lg text-primary" />
                <p className="text-xs text-muted-foreground">{isAr ? "ترقيات" : "Upgrades"}</p>
              </div>
              <div className="rounded-xl border p-3 text-center">
                <AnimatedCounter value={stats?.recentDowngrades || 0} className="text-lg text-destructive" />
                <p className="text-xs text-muted-foreground">{isAr ? "تخفيضات" : "Downgrades"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
