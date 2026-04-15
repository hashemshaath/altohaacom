import { CACHE } from "@/lib/queryConfig";
import { useIsAr } from "@/hooks/useIsAr";
import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, Star, ArrowRight, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { MS_PER_WEEK } from "@/lib/constants";

export const WalletBalanceWidget = memo(function WalletBalanceWidget() {
  const { user } = useAuth();
  const isAr = useIsAr();

  const { data, isLoading } = useQuery({
    queryKey: ["wallet-balance-widget", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: wallet } = await supabase
        .from("user_wallets")
        .select("balance, currency, points_balance")
        .eq("user_id", user.id)
        .single();

      // Recent points earned (last 7 days)
      const weekAgo = new Date(Date.now() - MS_PER_WEEK).toISOString();
      const { data: recentPoints } = await supabase
        .from("points_ledger")
        .select("points")
        .eq("user_id", user.id)
        .gt("points", 0)
        .gte("created_at", weekAgo);

      const weeklyPoints = recentPoints?.reduce((s, p) => s + p.points, 0) || 0;

      return {
        balance: wallet?.balance || 0,
        currency: wallet?.currency || "SAR",
        points: wallet?.points_balance || 0,
        weeklyPoints,
      };
    },
    enabled: !!user,
    ...CACHE.default,
  });

  if (isLoading) return (
    <Card className="border-border/40 animate-pulse">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-xl" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );

  if (!data) return null;

  return (
    <Card className="border-border/40 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group/wallet">
      <CardContent className="p-4 relative">
        {/* Subtle glow */}
        <div className="pointer-events-none absolute -end-8 -top-8 h-20 w-20 rounded-full bg-primary/5 blur-[30px] transition-opacity group-hover/wallet:opacity-70" />

        <div className="flex items-center justify-between mb-3 relative">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 shadow-sm transition-transform group-hover/wallet:scale-110">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-bold">{isAr ? "المحفظة" : "Wallet"}</span>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" asChild>
            <Link to="/profile?tab=wallet">
              {isAr ? "عرض" : "View"}
              <ArrowRight className="h-3 w-3 rtl:rotate-180 transition-transform group-hover/wallet:translate-x-0.5 rtl:group-hover/wallet:-translate-x-0.5" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Balance */}
          <div className="rounded-xl bg-muted/40 p-3 text-center border border-border/30 hover:bg-muted/50 transition-all hover:border-border/50 group/bal">
            <p className="text-xl font-bold tabular-nums group-hover/bal:text-primary transition-colors">{data.balance.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">{data.currency}</p>
          </div>

          {/* Points */}
          <div className="rounded-xl bg-chart-4/5 p-3 text-center border border-chart-4/15 hover:bg-chart-4/10 transition-all hover:border-chart-4/25 group/pts">
            <p className="text-xl font-bold tabular-nums text-chart-4 group-hover/pts:scale-105 transition-transform inline-block">{data.points.toLocaleString()}</p>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <Star className="h-2.5 w-2.5 text-chart-4" />
              <p className="text-xs text-muted-foreground font-medium">{isAr ? "نقاط" : "Points"}</p>
            </div>
          </div>
        </div>

        {data.weeklyPoints > 0 && (
          <div className="mt-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-chart-2 bg-chart-2/5 rounded-lg py-1.5 border border-chart-2/10">
            <TrendingUp className="h-3 w-3 animate-bounce" />
            +{data.weeklyPoints.toLocaleString()} {isAr ? "نقطة هذا الأسبوع" : "pts this week"}
          </div>
        )}

        {data.weeklyPoints === 0 && data.points > 0 && (
          <p className="mt-2 text-center text-xs text-muted-foreground/60">
            {isAr ? "اكسب نقاط عبر التفاعل والمشاركة" : "Earn points by engaging & participating"}
          </p>
        )}
      </CardContent>
    </Card>
  );
});
