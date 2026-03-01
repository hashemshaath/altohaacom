import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Users, Gift, Copy, Share2, TrendingUp, CheckCircle, Clock, ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/currencyFormatter";
import { Link } from "react-router-dom";

const TIER_REWARDS: Record<string, { referrerPoints: number; referredDiscount: number }> = {
  basic: { referrerPoints: 200, referredDiscount: 10 },
  professional: { referrerPoints: 500, referredDiscount: 15 },
  enterprise: { referrerPoints: 1000, referredDiscount: 20 },
};

export default function MembershipReferral() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const { data: referralCode } = useQuery({
    queryKey: ["my-referral-code", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("referral_codes")
        .select("code")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data?.code || null;
    },
  });

  const { data: referrals } = useQuery({
    queryKey: ["membership-referrals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("membership_referrals")
        .select("*")
        .eq("referrer_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: receivedReferral } = useQuery({
    queryKey: ["membership-referral-received", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("membership_referrals")
        .select("*")
        .eq("referred_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const referralLink = referralCode
    ? `${window.location.origin}/membership?ref=${referralCode}`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success(isAr ? "تم نسخ الرابط!" : "Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: isAr ? "انضم لعضوية ألطُوها" : "Join Altoha Membership",
        text: isAr
          ? "استخدم رابط الإحالة الخاص بي للحصول على خصم على العضوية!"
          : "Use my referral link to get a discount on membership!",
        url: referralLink,
      });
    } else {
      handleCopy();
    }
  };

  const totalConverted = referrals?.filter((r: any) => r.status === "converted").length || 0;
  const totalPending = referrals?.filter((r: any) => r.status === "pending").length || 0;
  const totalPoints = referrals?.reduce((s: number, r: any) => s + (r.referrer_bonus_points || 0), 0) || 0;

  const stats = [
    {
      label: isAr ? "إجمالي الإحالات" : "Total Referrals",
      value: referrals?.length || 0,
      icon: Users,
    },
    {
      label: isAr ? "تم التحويل" : "Converted",
      value: totalConverted,
      icon: CheckCircle,
    },
    {
      label: isAr ? "في الانتظار" : "Pending",
      value: totalPending,
      icon: Clock,
    },
    {
      label: isAr ? "النقاط المكتسبة" : "Points Earned",
      value: totalPoints,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="container max-w-4xl py-6 sm:py-10 space-y-6" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center gap-3">
        <Link to="/membership">
          <Button variant="ghost" size="icon">
            <ArrowLeft className={`h-5 w-5 ${isAr ? "rotate-180" : ""}`} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{isAr ? "إحالة العضوية" : "Membership Referral"}</h1>
          <p className="text-sm text-muted-foreground">
            {isAr
              ? "شارك رابطك واكسب مكافآت عند انضمام أصدقائك"
              : "Share your link and earn rewards when friends join"}
          </p>
        </div>
      </div>

      {/* Referral Link Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            {isAr ? "رابط الإحالة الخاص بك" : "Your Referral Link"}
          </CardTitle>
          <CardDescription>
            {isAr
              ? "شارك هذا الرابط مع أصدقائك ليحصلوا على خصم فوري"
              : "Share this link so friends get an instant discount"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={referralLink} readOnly className="bg-background font-mono text-sm" />
            <Button variant="outline" size="icon" onClick={handleCopy}>
              {copied ? <CheckCircle className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button onClick={handleShare}>
              <Share2 className="h-4 w-4 me-2" />
              {isAr ? "مشاركة" : "Share"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-3 text-center">
              <stat.icon className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reward Tiers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            {isAr ? "مكافآت الإحالة حسب المستوى" : "Referral Rewards by Tier"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {Object.entries(TIER_REWARDS).map(([tier, rewards]) => (
              <div key={tier} className="rounded-xl border p-4 space-y-2">
                <Badge variant="outline" className="capitalize">{tier}</Badge>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">{isAr ? "أنت تكسب:" : "You earn:"}</span>{" "}
                    <span className="font-semibold text-primary">{rewards.referrerPoints} {isAr ? "نقطة" : "pts"}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">{isAr ? "صديقك يحصل:" : "Friend gets:"}</span>{" "}
                    <span className="font-semibold text-primary">{rewards.referredDiscount}% {isAr ? "خصم" : "off"}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Referral History */}
      {referrals && referrals.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{isAr ? "سجل الإحالات" : "Referral History"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {referrals.map((ref: any) => (
                <div key={ref.id} className="flex items-center justify-between rounded-xl border p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <Badge variant={ref.status === "converted" ? "default" : "secondary"} className="text-[10px]">
                        {ref.status === "converted" ? (isAr ? "مُحوّل" : "Converted") : (isAr ? "في الانتظار" : "Pending")}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(ref.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US")}
                      </p>
                    </div>
                  </div>
                  <div className="text-end">
                    <Badge variant="outline" className="capitalize text-[10px]">{ref.tier}</Badge>
                    {ref.referrer_bonus_points > 0 && (
                      <p className="text-xs text-primary font-medium mt-0.5">
                        +{ref.referrer_bonus_points} {isAr ? "نقطة" : "pts"}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Received Referral */}
      {receivedReferral && (
        <Card className="border-chart-2/30 bg-chart-2/5">
          <CardContent className="pt-4 pb-3">
            <p className="text-sm text-muted-foreground">
              {isAr ? "تمت إحالتك وحصلت على:" : "You were referred and received:"}
            </p>
            <p className="text-lg font-bold text-primary">
              {receivedReferral.referred_discount_percent}% {isAr ? "خصم" : "discount"}{" "}
              {receivedReferral.referred_bonus_points > 0 && `+ ${receivedReferral.referred_bonus_points} ${isAr ? "نقطة" : "pts"}`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
