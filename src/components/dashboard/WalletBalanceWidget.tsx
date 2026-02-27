import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Star, ArrowRight, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

export function WalletBalanceWidget() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["wallet-balance-widget", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: wallet } = await supabase
        .from("user_wallets")
        .select("balance, currency, points_balance")
        .eq("user_id", user.id)
        .single();

      // Recent points earned (last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
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
    staleTime: 3 * 60 * 1000,
  });

  if (!data) return null;

  return (
    <Card className="border-border/40 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-bold">{isAr ? "المحفظة" : "Wallet"}</span>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-muted-foreground" asChild>
            <Link to="/wallet">
              {isAr ? "عرض" : "View"}
              <ArrowRight className="h-3 w-3 rtl:rotate-180" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Balance */}
          <div className="rounded-xl bg-muted/40 p-3 text-center">
            <p className="text-lg font-bold tabular-nums">{data.balance.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground font-medium">{data.currency}</p>
          </div>

          {/* Points */}
          <div className="rounded-xl bg-chart-4/5 p-3 text-center">
            <p className="text-lg font-bold tabular-nums text-chart-4">{data.points}</p>
            <div className="flex items-center justify-center gap-1">
              <Star className="h-2.5 w-2.5 text-chart-4" />
              <p className="text-[10px] text-muted-foreground font-medium">{isAr ? "نقاط" : "Points"}</p>
            </div>
          </div>
        </div>

        {data.weeklyPoints > 0 && (
          <div className="mt-2 flex items-center justify-center gap-1 text-[10px] font-semibold text-chart-2">
            <TrendingUp className="h-3 w-3" />
            +{data.weeklyPoints} {isAr ? "نقطة هذا الأسبوع" : "pts this week"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
