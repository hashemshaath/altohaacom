import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import {
  Receipt, CreditCard, Wallet, Users, ArrowRight,
  TrendingUp, ArrowUpRight, Crown, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const FinanceMembershipWidget = memo(function FinanceMembershipWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-finance-membership-summary"],
    queryFn: async () => {
      const [
        { data: invoiceData },
        { count: pendingInvoices },
        { count: totalMemberships },
        { count: trialMemberships },
        { count: activeMemberships },
        { data: walletData },
      ] = await Promise.all([
        supabase.from("invoices").select("amount, status, currency").limit(1000),
        supabase.from("invoices").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("membership_cards").select("id", { count: "exact", head: true }),
        supabase.from("membership_cards").select("id", { count: "exact", head: true }).eq("is_trial", true),
        supabase.from("membership_cards").select("id", { count: "exact", head: true }).eq("is_trial", false),
        supabase.from("user_wallets").select("balance, points_balance").limit(1000),
      ]);

      const totalRevenue = (invoiceData || [])
        .filter((inv) => inv.status === "paid")
        .reduce((sum, inv) => sum + (inv.amount || 0), 0);

      const pendingRevenue = (invoiceData || [])
        .filter((inv) => inv.status === "pending" || inv.status === "sent")
        .reduce((sum, inv) => sum + (inv.amount || 0), 0);

      const totalWalletBalance = (walletData || [])
        .reduce((sum, w) => sum + (w.balance || 0), 0);

      const totalPoints = (walletData || [])
        .reduce((sum, w) => sum + (w.points_balance || 0), 0);

      return {
        totalRevenue: Math.round(totalRevenue),
        pendingRevenue: Math.round(pendingRevenue),
        pendingInvoices: pendingInvoices || 0,
        totalMemberships: totalMemberships || 0,
        trialMemberships: trialMemberships || 0,
        activeMemberships: activeMemberships || 0,
        totalWalletBalance: Math.round(totalWalletBalance),
        totalPoints,
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  const financeCards = [
    {
      label: isAr ? "الإيرادات المحصلة" : "Collected Revenue",
      value: data?.totalRevenue || 0,
      suffix: " SAR",
      icon: TrendingUp,
      color: "text-chart-2",
      bg: "bg-chart-2/10",
      link: "/admin/invoices",
    },
    {
      label: isAr ? "إيرادات معلقة" : "Pending Revenue",
      value: data?.pendingRevenue || 0,
      suffix: " SAR",
      icon: Receipt,
      color: "text-chart-4",
      bg: "bg-chart-4/10",
      link: "/admin/invoices",
      badge: data?.pendingInvoices,
    },
    {
      label: isAr ? "رصيد المحافظ" : "Total Wallets",
      value: data?.totalWalletBalance || 0,
      suffix: " SAR",
      icon: Wallet,
      color: "text-primary",
      bg: "bg-primary/10",
      link: "/admin/users",
    },
    {
      label: isAr ? "إجمالي النقاط" : "Total Points",
      value: data?.totalPoints || 0,
      icon: Star,
      color: "text-chart-5",
      bg: "bg-chart-5/10",
      link: "/admin/loyalty",
    },
  ];

  const membershipCards = [
    {
      label: isAr ? "إجمالي العضويات" : "Total Memberships",
      value: data?.totalMemberships || 0,
      icon: CreditCard,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: isAr ? "عضويات فعالة" : "Active Memberships",
      value: data?.activeMemberships || 0,
      icon: Crown,
      color: "text-chart-2",
      bg: "bg-chart-2/10",
    },
    {
      label: isAr ? "فترة تجريبية" : "Trial Period",
      value: data?.trialMemberships || 0,
      icon: Users,
      color: "text-chart-4",
      bg: "bg-chart-4/10",
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Finance Summary */}
      <Card className="rounded-2xl border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-chart-2/10">
              <Receipt className="h-3.5 w-3.5 text-chart-2" />
            </div>
            {isAr ? "الملخص المالي" : "Financial Summary"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {financeCards.map((card) => (
            <Link key={card.label} to={card.link}>
              <div className="group flex items-center justify-between rounded-2xl border border-border/30 p-3 transition-all duration-300 hover:bg-accent/30 hover:shadow-sm hover:-translate-y-0.5">
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110", card.bg)}>
                    <card.icon className={cn("h-4 w-4", card.color)} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium">{card.label}</p>
                    {isLoading ? (
                      <Skeleton className="h-5 w-20 rounded-xl" />
                    ) : (
                      <p className={cn("text-sm font-black", card.color)}>
                        <AnimatedCounter value={card.value} className="inline" />
                        {card.suffix && <span className="text-[10px] font-medium text-muted-foreground">{card.suffix}</span>}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {card.badge && card.badge > 0 && (
                    <Badge variant="secondary" className="text-[9px] h-5 px-1.5">
                      {card.badge}
                    </Badge>
                  )}
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Membership Summary */}
      <Card className="rounded-2xl border-border/40">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
              <CreditCard className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "العضويات" : "Memberships"}
          </CardTitle>
          <Link to="/admin/memberships">
            <Badge variant="outline" className="text-[9px] gap-1 cursor-pointer hover:bg-accent">
              {isAr ? "عرض الكل" : "View All"}
              <ArrowRight className="h-2.5 w-2.5" />
            </Badge>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {membershipCards.map((card) => (
              <div key={card.label} className="flex items-center gap-3">
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", card.bg)}>
                  <card.icon className={cn("h-4 w-4", card.color)} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    {isLoading ? (
                      <Skeleton className="h-4 w-10 rounded-xl" />
                    ) : (
                      <p className={cn("text-sm font-black", card.color)}>
                        <AnimatedCounter value={card.value} />
                      </p>
                    )}
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", card.bg.replace("/10", ""))}
                      style={{
                        width: `${data?.totalMemberships ? Math.max(5, (card.value / data.totalMemberships) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Conversion rate */}
          {data && data.totalMemberships > 0 && (
            <div className="mt-4 rounded-xl bg-gradient-to-r from-primary/5 to-chart-2/5 p-3 border border-border/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="h-3.5 w-3.5 text-chart-2" />
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {isAr ? "معدل التحويل" : "Conversion Rate"}
                  </span>
                </div>
                <span className="text-sm font-black text-chart-2">
                  <AnimatedCounter
                    value={Math.round((data.activeMemberships / data.totalMemberships) * 100)}
                    className="inline"
                  />%
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});
