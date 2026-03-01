import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Gift, Star, Crown, Check, Loader2, Heart, AlertCircle, Clock, User,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TIER_NAMES: Record<string, { en: string; ar: string }> = {
  professional: { en: "Professional", ar: "الاحترافي" },
  enterprise: { en: "Enterprise", ar: "المؤسسي" },
};

const TIER_ICONS: Record<string, typeof Star> = {
  professional: Star,
  enterprise: Crown,
};

export default function MembershipRedeem() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get("code") || "");
  const [redeemed, setRedeemed] = useState(false);

  const { data: gift, isLoading, error, refetch } = useQuery({
    queryKey: ["gift-redeem", code],
    queryFn: async () => {
      if (!code || code.length < 5) return null;
      const { data, error } = await supabase
        .from("membership_gifts")
        .select("*")
        .eq("gift_code", code.toUpperCase())
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: code.length >= 5,
  });

  const redeemGift = useMutation({
    mutationFn: async () => {
      if (!user?.id || !gift) throw new Error("Missing data");

      // Update gift as redeemed
      const { error: giftErr } = await supabase
        .from("membership_gifts")
        .update({
          status: "redeemed",
          redeemed_at: new Date().toISOString(),
          redeemed_by: user.id,
          recipient_id: user.id,
        } as any)
        .eq("id", (gift as any).id)
        .eq("status", "pending");

      if (giftErr) throw giftErr;

      // Upgrade user's membership
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + ((gift as any).duration_months || 1));

      const { error: profileErr } = await supabase
        .from("profiles")
        .update({
          membership_tier: (gift as any).tier,
          membership_status: "active",
          membership_expires_at: expiresAt.toISOString(),
          membership_started_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (profileErr) throw profileErr;

      // Add chef role if professional
      if ((gift as any).tier === "professional" || (gift as any).tier === "enterprise") {
        await supabase.from("user_roles").upsert(
          { user_id: user.id, role: "chef" as any },
          { onConflict: "user_id,role" }
        );
      }
    },
    onSuccess: () => {
      setRedeemed(true);
      queryClient.invalidateQueries({ queryKey: ["accountType"] });
      queryClient.invalidateQueries({ queryKey: ["checkout-profile"] });
      toast.success(isAr ? "تم تفعيل العضوية بنجاح! 🎉" : "Membership activated! 🎉");
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const giftData = gift as any;
  const isExpired = giftData && new Date(giftData.expires_at) < new Date();
  const isAlreadyRedeemed = giftData?.status === "redeemed";
  const isSelf = giftData?.sender_id === user?.id;
  const canRedeem = giftData && !isExpired && !isAlreadyRedeemed && user && !isSelf && giftData.status === "pending";

  const Icon = TIER_ICONS[giftData?.tier] || Star;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4">
            <Gift className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold font-serif">
            {isAr ? "استرداد هدية العضوية" : "Redeem Membership Gift"}
          </h1>
        </div>

        {/* Code input */}
        {!giftData && !redeemed && (
          <Card>
            <CardContent className="p-5 space-y-4">
              <div>
                <Label className="text-sm">{isAr ? "كود الهدية" : "Gift Code"}</Label>
                <Input
                  className="mt-1 font-mono text-center text-lg tracking-widest uppercase"
                  placeholder="XXXXXXXXXX"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={12}
                />
              </div>
              <Button className="w-full" onClick={() => refetch()} disabled={isLoading || code.length < 5}>
                {isLoading ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
                {isAr ? "بحث" : "Look Up"}
              </Button>
              {error && (
                <p className="text-xs text-destructive text-center">{isAr ? "كود غير صالح" : "Invalid code"}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Gift card display */}
        {giftData && !redeemed && (
          <Card className="overflow-hidden border-2 border-primary/20 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-chart-3/10 p-6 text-center">
              <Gift className="h-10 w-10 text-primary mx-auto mb-2" />
              <h2 className="text-lg font-bold font-serif">{isAr ? "هدية عضوية" : "Membership Gift"}</h2>
            </div>
            <CardContent className="p-5 space-y-3">
              {giftData.message && (
                <div className="bg-muted/50 rounded-xl p-3 text-sm italic text-muted-foreground border border-border/50">
                  <Heart className="h-3 w-3 inline me-1 text-primary" />
                  "{giftData.message}"
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">
                    {isAr ? TIER_NAMES[giftData.tier]?.ar : TIER_NAMES[giftData.tier]?.en}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {giftData.duration_months} {isAr ? "شهر" : giftData.duration_months === 1 ? "month" : "months"}
                </Badge>
              </div>

              <Separator />

              {isExpired && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {isAr ? "هذه الهدية منتهية الصلاحية" : "This gift has expired"}
                </div>
              )}

              {isAlreadyRedeemed && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Check className="h-4 w-4" />
                  {isAr ? "تم استرداد هذه الهدية بالفعل" : "This gift has already been redeemed"}
                </div>
              )}

              {isSelf && !isAlreadyRedeemed && !isExpired && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <User className="h-4 w-4" />
                  {isAr ? "لا يمكنك استرداد هديتك الخاصة" : "You cannot redeem your own gift"}
                </div>
              )}

              {!user && (
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {isAr ? "سجل الدخول لاسترداد الهدية" : "Sign in to redeem this gift"}
                  </p>
                  <Button onClick={() => navigate(`/auth?redirect=/membership/redeem?code=${code}`)}>
                    {isAr ? "تسجيل الدخول" : "Sign In"}
                  </Button>
                </div>
              )}

              {canRedeem && (
                <Button className="w-full" size="lg" onClick={() => redeemGift.mutate()} disabled={redeemGift.isPending}>
                  {redeemGift.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Gift className="me-2 h-4 w-4" />}
                  {isAr ? "تفعيل العضوية" : "Activate Membership"}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Success */}
        {redeemed && (
          <Card className="border-primary/20 animate-in fade-in slide-in-from-bottom-2">
            <CardContent className="p-8 text-center space-y-4">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mx-auto">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold font-serif">{isAr ? "مبروك! 🎉" : "Congratulations! 🎉"}</h2>
              <p className="text-sm text-muted-foreground">
                {isAr
                  ? `تم تفعيل عضوية ${TIER_NAMES[giftData?.tier]?.ar || ""} لمدة ${giftData?.duration_months || 1} شهر`
                  : `Your ${TIER_NAMES[giftData?.tier]?.en || ""} membership is now active for ${giftData?.duration_months || 1} month(s)`}
              </p>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => navigate("/profile?tab=membership")}>
                  {isAr ? "عضويتي" : "My Membership"}
                </Button>
                <Button className="flex-1" onClick={() => navigate("/dashboard")}>
                  {isAr ? "لوحة التحكم" : "Dashboard"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
