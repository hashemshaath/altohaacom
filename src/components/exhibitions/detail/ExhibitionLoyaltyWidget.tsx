import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Trophy, Star, CheckCircle2, MessageSquare, Share2, MapPin, Gift } from "lucide-react";

interface Props {
  exhibitionId: string;
  isAr: boolean;
}

const LOYALTY_ACTIONS = [
  { type: "checkin", icon: CheckCircle2, points: 50, en: "Check In", ar: "تسجيل الحضور" },
  { type: "review", icon: Star, points: 30, en: "Write a Review", ar: "كتابة تقييم" },
  { type: "survey", icon: MessageSquare, points: 20, en: "Complete Survey", ar: "إكمال استبيان" },
  { type: "share", icon: Share2, points: 10, en: "Share Event", ar: "مشاركة الفعالية" },
  { type: "booth_visit", icon: MapPin, points: 15, en: "Visit 5 Booths", ar: "زيارة 5 أجنحة" },
] as const;

export function ExhibitionLoyaltyWidget({ exhibitionId, isAr }: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: myActions = [] } = useQuery({
    queryKey: ["exhibition-loyalty", exhibitionId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("exhibition_loyalty_actions")
        .select("id, action_type, points_earned, created_at")
        .eq("exhibition_id", exhibitionId)
        .eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user,
  });

  const earnPoints = useMutation({
    mutationFn: async (actionType: string) => {
      if (!user) throw new Error("Not authenticated");
      const action = LOYALTY_ACTIONS.find(a => a.type === actionType);
      if (!action) throw new Error("Invalid action");

      const { error } = await supabase.from("exhibition_loyalty_actions").insert({
        user_id: user.id,
        exhibition_id: exhibitionId,
        action_type: actionType,
        points_earned: action.points,
      });
      if (error) {
        if (error.code === "23505") throw new Error("already_earned");
        throw error;
      }

      // Award points to wallet
      await supabase.rpc("award_points", {
        p_user_id: user.id,
        p_action_type: `exhibition_${actionType}`,
        p_points: action.points,
        p_description: `Exhibition loyalty: ${actionType}`,
        p_description_ar: `ولاء المعرض: ${action.ar}`,
        p_reference_type: "exhibition",
        p_reference_id: exhibitionId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibition-loyalty", exhibitionId] });
      toast({ title: t("Points earned! 🎉", "تم كسب النقاط! 🎉") });
    },
    onError: (e: any) => {
      if (e.message === "already_earned") {
        toast({ title: t("Already earned", "تم كسبها مسبقاً"), variant: "destructive" });
      }
    },
  });

  const { completedTypes, totalEarned, totalPossible } = useMemo(() => ({
    completedTypes: new Set(myActions.map((a: any) => a.action_type)),
    totalEarned: myActions.reduce((s: number, a: any) => s + (a.points_earned || 0), 0),
    totalPossible: LOYALTY_ACTIONS.reduce((s, a) => s + a.points, 0),
  }), [myActions]);

  if (!user) return null;

  return (
    <Card className="border-chart-4/20 bg-gradient-to-br from-chart-4/5 via-transparent to-transparent">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Trophy className="h-4 w-4 text-chart-4" />
          {t("Exhibition Rewards", "مكافآت المعرض")}
          <Badge variant="secondary" className="ms-auto text-[10px]">
            {totalEarned}/{totalPossible} {t("pts", "نقطة")}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {/* Progress bar */}
        <div className="h-2 rounded-full bg-muted/60 overflow-hidden mb-3">
          <div
            className="h-full rounded-full bg-gradient-to-r from-chart-4/80 to-chart-4 transition-all duration-700"
            style={{ width: `${totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0}%` }}
          />
        </div>

        <div className="space-y-2">
          {LOYALTY_ACTIONS.map((action) => {
            const completed = completedTypes.has(action.type);
            return (
              <div
                key={action.type}
                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                  completed ? "bg-chart-3/5 border-chart-3/20" : "bg-muted/30 border-border/40 hover:border-primary/30"
                }`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 ${
                  completed ? "bg-chart-3/15" : "bg-muted/60"
                }`}>
                  <action.icon className={`h-4 w-4 ${completed ? "text-chart-3" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium ${completed ? "text-chart-3" : "text-foreground"}`}>
                    {isAr ? action.ar : action.en}
                  </p>
                  <p className="text-[10px] text-muted-foreground">+{action.points} {t("points", "نقطة")}</p>
                </div>
                {completed ? (
                  <CheckCircle2 className="h-4 w-4 text-chart-3 shrink-0" />
                ) : action.type === "share" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px]"
                    onClick={async () => {
                      if (navigator.share) {
                        try { await navigator.share({ url: window.location.href }); } catch { return; }
                      } else {
                        await navigator.clipboard.writeText(window.location.href);
                      }
                      earnPoints.mutate("share");
                    }}
                  >
                    <Share2 className="h-3 w-3 me-1" /> {t("Share", "شارك")}
                  </Button>
                ) : (
                  <Badge variant="outline" className="text-[9px] text-muted-foreground">
                    {t("Pending", "قيد الانتظار")}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        {totalEarned === totalPossible && totalPossible > 0 && (
          <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-chart-4/10 to-chart-3/10 border border-chart-4/20 text-center">
            <Gift className="h-5 w-5 mx-auto text-chart-4 mb-1" />
            <p className="text-xs font-semibold text-foreground">{t("All rewards collected! 🏆", "تم جمع كل المكافآت! 🏆")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
