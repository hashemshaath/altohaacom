import { useState, useCallback } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Gift, Copy, Share2, Users, TrendingUp, CheckCircle, Link2, QrCode, Award } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function ReferralCenter() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();

  const { data: referralCode } = useQuery({
    queryKey: ["my-referral-code", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("referral_codes")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ["my-referrals", user?.id],
    queryFn: async () => {
      const { data } = await (supabase
        .from("referral_uses" as any)
        .select("*, profiles:referred_user_id(full_name, full_name_ar, avatar_url, username)")
        .eq("referrer_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20) as any);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const referralLink = referralCode?.code
    ? `${window.location.origin}/register?ref=${referralCode.code}`
    : "";

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: isAr ? "تم نسخ الرابط" : "Link copied!" });
  }, [referralLink, isAr]);

  const shareLink = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: isAr ? "انضم إلى الطهاة" : "Join Altoha",
          text: isAr ? "انضم إلى منصة الطهاة واحصل على مكافآت!" : "Join Altoha culinary platform and earn rewards!",
          url: referralLink,
        });
      } catch {}
    } else {
      copyLink();
    }
  }, [referralLink, copyLink, isAr]);

  const totalReferrals = referrals.length;
  const successfulReferrals = referrals.filter((r: any) => r.status === "completed").length;
  const pendingReferrals = referrals.filter((r: any) => r.status === "pending").length;
  const totalRewards = (referralCode as any)?.total_rewards || referralCode?.total_points_earned || 0;

  const TIERS = [
    { min: 0, label: isAr ? "مبتدئ" : "Starter", labelColor: "text-slate-500", reward: 10 },
    { min: 5, label: isAr ? "سفير" : "Ambassador", labelColor: "text-blue-500", reward: 15 },
    { min: 15, label: isAr ? "نجم" : "Star", labelColor: "text-amber-500", reward: 20 },
    { min: 30, label: isAr ? "أسطوري" : "Legend", labelColor: "text-purple-500", reward: 30 },
  ];

  const currentTier = [...TIERS].reverse().find(t => successfulReferrals >= t.min) || TIERS[0];
  const nextTier = TIERS.find(t => t.min > successfulReferrals);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          {isAr ? "مركز الإحالات" : "Referral Center"}
        </h3>
        <Badge className={currentTier.labelColor}>{currentTier.label}</Badge>
      </div>

      {/* Referral Link */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-medium">{isAr ? "رابط الإحالة الخاص بك" : "Your Referral Link"}</p>
          <div className="flex gap-2">
            <Input value={referralLink} readOnly className="text-xs bg-background" dir="ltr" />
            <Button variant="outline" size="icon" onClick={copyLink} title="Copy">
              <Copy className="h-4 w-4" />
            </Button>
            <Button size="icon" onClick={shareLink} title="Share">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          {referralCode?.code && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs gap-1">
                <Link2 className="h-3 w-3" /> {referralCode.code}
              </Badge>
              <p className="text-xs text-muted-foreground">{isAr ? "كود الإحالة" : "Referral code"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="p-3 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <p className="text-lg font-bold">{totalReferrals}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "إجمالي الإحالات" : "Total Referrals"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <p className="text-lg font-bold">{successfulReferrals}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "ناجحة" : "Successful"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Award className="h-5 w-5 mx-auto mb-1 text-amber-500" />
            <p className="text-lg font-bold">{totalRewards}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "نقاط مكتسبة" : "Points Earned"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tier Progress */}
      {nextTier && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{isAr ? "المستوى التالي" : "Next Tier"}: <span className={nextTier.labelColor}>{nextTier.label}</span></span>
              <span className="text-xs text-muted-foreground">{successfulReferrals}/{nextTier.min}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (successfulReferrals / nextTier.min) * 100)}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr ? `أحِل ${nextTier.min - successfulReferrals} أشخاص آخرين للترقية` : `Refer ${nextTier.min - successfulReferrals} more to level up`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recent Referrals */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {isAr ? "الإحالات الأخيرة" : "Recent Referrals"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="h-10 w-10 mx-auto text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">{isAr ? "لا توجد إحالات بعد" : "No referrals yet"}</p>
              <p className="text-xs text-muted-foreground mt-1">{isAr ? "شارك رابطك لبدء الكسب!" : "Share your link to start earning!"}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {referrals.map((r: any) => (
                <div key={r.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={r.profiles?.avatar_url || ""} />
                    <AvatarFallback>{(r.profiles?.full_name || "?")[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {isAr ? r.profiles?.full_name_ar || r.profiles?.full_name : r.profiles?.full_name || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString(isAr ? "ar" : "en")}
                    </p>
                  </div>
                  <Badge variant={r.status === "completed" ? "default" : "outline"} className="text-[10px]">
                    {r.status === "completed" ? (isAr ? "مكتمل" : "Completed") : (isAr ? "معلّق" : "Pending")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How it works */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{isAr ? "كيف تعمل الإحالات؟" : "How Referrals Work"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { step: "1", text: isAr ? "شارك رابط الإحالة مع أصدقائك" : "Share your referral link with friends" },
              { step: "2", text: isAr ? "يسجلون حسابات جديدة عبر رابطك" : "They sign up using your link" },
              { step: "3", text: isAr ? "تكسب نقاط مكافأة لكل إحالة ناجحة!" : "Earn bonus points for each successful referral!" },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">{s.step}</span>
                </div>
                <p className="text-sm text-muted-foreground pt-0.5">{s.text}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
