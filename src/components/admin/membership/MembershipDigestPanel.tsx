import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Users, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle,
  CreditCard, UserPlus, UserX, RefreshCw, Clock, AlertTriangle,
  CalendarDays, Zap
} from "lucide-react";
import { differenceInDays, subDays, format } from "date-fns";

type Period = "7d" | "14d" | "30d";

export default function MembershipDigestPanel() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [period, setPeriod] = useState<Period>("7d");

  const days = period === "7d" ? 7 : period === "14d" ? 14 : 30;

  const { data, isLoading } = useQuery({
    queryKey: ["membership-digest", period],
    queryFn: async () => {
      const now = new Date();
      const periodStart = subDays(now, days).toISOString();
      const prevPeriodStart = subDays(now, days * 2).toISOString();

      const [
        { data: allProfiles },
        { data: currentHistory },
        { data: prevHistory },
        { data: currentCancellations },
        { data: prevCancellations },
        { data: giftsPurchased },
        { data: prevGifts },
        { data: featureUsage },
      ] = await Promise.all([
        supabase.from("profiles").select("membership_tier, membership_status, membership_expires_at, created_at"),
        supabase.from("membership_history").select("new_tier, previous_tier, created_at, reason").gte("created_at", periodStart),
        supabase.from("membership_history").select("new_tier, previous_tier, created_at, reason").gte("created_at", prevPeriodStart).lt("created_at", periodStart),
        supabase.from("membership_cancellation_requests").select("id, created_at").gte("created_at", periodStart),
        supabase.from("membership_cancellation_requests").select("id, created_at").gte("created_at", prevPeriodStart).lt("created_at", periodStart),
        supabase.from("membership_gifts").select("id, created_at").gte("created_at", periodStart),
        supabase.from("membership_gifts").select("id, created_at").gte("created_at", prevPeriodStart).lt("created_at", periodStart),
        supabase.from("membership_feature_usage").select("feature_code, created_at").gte("created_at", periodStart),
      ]);

      const tierOrder: Record<string, number> = { basic: 0, professional: 1, enterprise: 2 };

      const upgrades = currentHistory?.filter(h =>
        (tierOrder[h.new_tier] ?? 0) > (tierOrder[h.previous_tier] ?? 0)
      ).length || 0;
      const prevUpgrades = prevHistory?.filter(h =>
        (tierOrder[h.new_tier] ?? 0) > (tierOrder[h.previous_tier] ?? 0)
      ).length || 0;

      const downgrades = currentHistory?.filter(h =>
        (tierOrder[h.new_tier] ?? 0) < (tierOrder[h.previous_tier] ?? 0)
      ).length || 0;
      const prevDowngrades = prevHistory?.filter(h =>
        (tierOrder[h.new_tier] ?? 0) < (tierOrder[h.previous_tier] ?? 0)
      ).length || 0;

      const renewals = currentHistory?.filter(h => h.reason?.toLowerCase().includes("renewal")).length || 0;
      const prevRenewals = prevHistory?.filter(h => h.reason?.toLowerCase().includes("renewal")).length || 0;

      const newSignups = allProfiles?.filter(p =>
        new Date(p.created_at) >= new Date(periodStart) &&
        p.membership_tier && p.membership_tier !== "basic"
      ).length || 0;
      const prevNewSignups = allProfiles?.filter(p => {
        const d = new Date(p.created_at);
        return d >= new Date(prevPeriodStart) && d < new Date(periodStart) &&
          p.membership_tier && p.membership_tier !== "basic";
      }).length || 0;

      const cancellations = currentCancellations?.length || 0;
      const prevCancCount = prevCancellations?.length || 0;

      const gifts = giftsPurchased?.length || 0;
      const prevGiftCount = prevGifts?.length || 0;

      const totalFeatureUses = featureUsage?.length || 0;

      // Current snapshot
      const totalPaid = allProfiles?.filter(p =>
        p.membership_tier === "professional" || p.membership_tier === "enterprise"
      ).length || 0;
      const professional = allProfiles?.filter(p => p.membership_tier === "professional").length || 0;
      const enterprise = allProfiles?.filter(p => p.membership_tier === "enterprise").length || 0;
      const mrr = (professional * 19) + (enterprise * 99);

      const expiringSoon = allProfiles?.filter(p => {
        if (!p.membership_expires_at) return false;
        const d = differenceInDays(new Date(p.membership_expires_at), now);
        return d >= 0 && d <= 7;
      }).length || 0;

      const delta = (curr: number, prev: number) =>
        prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);

      return {
        upgrades, downgrades, renewals, newSignups, cancellations, gifts, totalFeatureUses,
        totalPaid, mrr, expiringSoon, professional, enterprise,
        trends: {
          upgrades: delta(upgrades, prevUpgrades),
          downgrades: delta(downgrades, prevDowngrades),
          renewals: delta(renewals, prevRenewals),
          newSignups: delta(newSignups, prevNewSignups),
          cancellations: delta(cancellations, prevCancCount),
          gifts: delta(gifts, prevGiftCount),
        },
      };
    },
  });

  const periodLabel = period === "7d"
    ? (isAr ? "آخر 7 أيام" : "Last 7 days")
    : period === "14d"
    ? (isAr ? "آخر 14 يوم" : "Last 14 days")
    : (isAr ? "آخر 30 يوم" : "Last 30 days");

  const highlights = useMemo(() => {
    if (!data) return [];
    const items: { icon: typeof TrendingUp; text: string; type: "positive" | "negative" | "neutral" }[] = [];

    if (data.upgrades > 0)
      items.push({ icon: ArrowUpCircle, text: isAr ? `${data.upgrades} ترقية خلال الفترة` : `${data.upgrades} upgrades this period`, type: "positive" });
    if (data.expiringSoon > 0)
      items.push({ icon: AlertTriangle, text: isAr ? `${data.expiringSoon} عضوية تنتهي خلال 7 أيام` : `${data.expiringSoon} memberships expiring within 7 days`, type: "negative" });
    if (data.cancellations > 0)
      items.push({ icon: UserX, text: isAr ? `${data.cancellations} طلب إلغاء` : `${data.cancellations} cancellation requests`, type: "negative" });
    if (data.gifts > 0)
      items.push({ icon: Zap, text: isAr ? `${data.gifts} هدية عضوية جديدة` : `${data.gifts} gift memberships purchased`, type: "positive" });
    if (data.renewals > 0)
      items.push({ icon: RefreshCw, text: isAr ? `${data.renewals} تجديد` : `${data.renewals} renewals`, type: "positive" });

    return items;
  }, [data, isAr]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">
            {isAr ? "ملخص العضويات" : "Membership Digest"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {periodLabel} — {isAr ? "مقارنة بالفترة السابقة" : "compared to previous period"}
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border p-1">
          {(["7d", "14d", "30d"] as Period[]).map(p => (
            <Button
              key={p}
              variant={period === p ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs px-3"
              onClick={() => setPeriod(p)}
            >
              {p === "7d" ? (isAr ? "7 أيام" : "7d") : p === "14d" ? (isAr ? "14 يوم" : "14d") : (isAr ? "30 يوم" : "30d")}
            </Button>
          ))}
        </div>
      </div>

      {/* Snapshot KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          icon={<CreditCard className="h-4 w-4" />}
          label={isAr ? "الإيرادات الشهرية" : "Monthly Revenue"}
          value={`${data?.mrr || 0} SAR`}
        />
        <StatsCard
          icon={<Users className="h-4 w-4" />}
          label={isAr ? "الأعضاء المدفوعين" : "Paid Members"}
          value={data?.totalPaid || 0}
        />
        <StatsCard
          icon={<UserPlus className="h-4 w-4" />}
          label={isAr ? "اشتراكات جديدة" : "New Signups"}
          value={data?.newSignups || 0}
          trend={data ? { value: data.trends.newSignups, label: isAr ? "عن الفترة السابقة" : "vs prev" } : undefined}
        />
        <StatsCard
          icon={<Clock className="h-4 w-4" />}
          label={isAr ? "تنتهي قريباً" : "Expiring Soon"}
          value={data?.expiringSoon || 0}
        />
      </div>

      {/* Period Activity */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          icon={<ArrowUpCircle className="h-4 w-4" />}
          label={isAr ? "ترقيات" : "Upgrades"}
          value={data?.upgrades || 0}
          trend={data ? { value: data.trends.upgrades, label: isAr ? "عن الفترة السابقة" : "vs prev" } : undefined}
        />
        <StatsCard
          icon={<ArrowDownCircle className="h-4 w-4" />}
          label={isAr ? "تخفيضات" : "Downgrades"}
          value={data?.downgrades || 0}
          trend={data ? { value: -data.trends.downgrades, label: isAr ? "عن الفترة السابقة" : "vs prev" } : undefined}
        />
        <StatsCard
          icon={<RefreshCw className="h-4 w-4" />}
          label={isAr ? "تجديدات" : "Renewals"}
          value={data?.renewals || 0}
          trend={data ? { value: data.trends.renewals, label: isAr ? "عن الفترة السابقة" : "vs prev" } : undefined}
        />
        <StatsCard
          icon={<UserX className="h-4 w-4" />}
          label={isAr ? "إلغاءات" : "Cancellations"}
          value={data?.cancellations || 0}
          trend={data ? { value: -data.trends.cancellations, label: isAr ? "عن الفترة السابقة" : "vs prev" } : undefined}
        />
        <StatsCard
          icon={<Zap className="h-4 w-4" />}
          label={isAr ? "هدايا عضوية" : "Gift Memberships"}
          value={data?.gifts || 0}
          trend={data ? { value: data.trends.gifts, label: isAr ? "عن الفترة السابقة" : "vs prev" } : undefined}
        />
        <StatsCard
          icon={<CalendarDays className="h-4 w-4" />}
          label={isAr ? "استخدام الميزات" : "Feature Uses"}
          value={data?.totalFeatureUses || 0}
        />
      </div>

      {/* Highlights */}
      {highlights.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{isAr ? "أبرز النقاط" : "Key Highlights"}</CardTitle>
            <CardDescription>{periodLabel}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <h.icon className={`h-4 w-4 shrink-0 ${
                  h.type === "positive" ? "text-chart-2" :
                  h.type === "negative" ? "text-destructive" : "text-muted-foreground"
                }`} />
                <span>{h.text}</span>
                <Badge variant={h.type === "negative" ? "destructive" : "secondary"} className="text-xs ml-auto">
                  {h.type === "positive" ? (isAr ? "إيجابي" : "Positive") :
                   h.type === "negative" ? (isAr ? "تنبيه" : "Alert") : ""}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tier Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{isAr ? "توزيع المستويات المدفوعة" : "Paid Tier Breakdown"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border p-4 text-center space-y-1">
              <p className="text-2xl font-bold text-primary">{data?.professional || 0}</p>
              <p className="text-xs text-muted-foreground">{isAr ? "احترافي" : "Professional"}</p>
              <p className="text-xs text-muted-foreground">{(data?.professional || 0) * 19} SAR/{isAr ? "شهر" : "mo"}</p>
            </div>
            <div className="rounded-xl border p-4 text-center space-y-1">
              <p className="text-2xl font-bold text-chart-2">{data?.enterprise || 0}</p>
              <p className="text-xs text-muted-foreground">{isAr ? "مؤسسي" : "Enterprise"}</p>
              <p className="text-xs text-muted-foreground">{(data?.enterprise || 0) * 99} SAR/{isAr ? "شهر" : "mo"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
