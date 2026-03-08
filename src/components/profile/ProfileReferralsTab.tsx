import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useReferralCode, useReferralStats, useReferralMilestones, useUserMilestones } from "@/hooks/useReferral";
import { usePointsBalance } from "@/hooks/usePoints";
import { useToast } from "@/hooks/use-toast";
import { Copy, Gift, Star, Users, Send, TrendingUp, Trophy, CheckCircle2 } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Link } from "react-router-dom";
import { StaggeredList } from "@/components/ui/staggered-list";

export function ProfileReferralsTab({ userId }: { userId: string }) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const { data: referralCode } = useReferralCode();
  const { data: stats } = useReferralStats();
  const { data: milestones } = useReferralMilestones();
  const { data: userMilestones } = useUserMilestones();
  const { data: pointsBalance } = usePointsBalance();

  const referralLink = referralCode?.code
    ? `${window.location.origin}/auth?ref=${referralCode.code}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: isAr ? "تم نسخ الرابط!" : "Link copied!" });
  };

  const totalConversions = stats?.conversionsCount || 0;
  const achievedIds = new Set(userMilestones?.map((m) => m.milestone_id) || []);
  const nextMilestone = milestones?.find((m) => m.required_referrals > totalConversions);
  const progress = nextMilestone ? (totalConversions / nextMilestone.required_referrals) * 100 : 100;

  const statItems = [
    { icon: Send, label: isAr ? "دعوات" : "Invites", value: stats?.invitationsCount || 0, color: "text-chart-4", bg: "bg-chart-4/10" },
    { icon: Users, label: isAr ? "تحويلات" : "Converts", value: totalConversions, color: "text-chart-2", bg: "bg-chart-2/10" },
    { icon: TrendingUp, label: isAr ? "نقرات" : "Clicks", value: stats?.codeStats?.total_clicks || 0, color: "text-chart-3", bg: "bg-chart-3/10" },
    { icon: Star, label: isAr ? "النقاط" : "Points", value: pointsBalance || 0, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <StaggeredList className="space-y-6" stagger={80}>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statItems.map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div>
                <AnimatedCounter value={typeof s.value === "number" ? s.value : parseInt(String(s.value)) || 0} className="text-xl" />
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Referral Code & Link */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Gift className="h-4 w-4 text-primary" />
            {isAr ? "رمز وكود الإحالة" : "Referral Code & Link"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Prominent Referral Code */}
          {referralCode && (
            <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-background to-chart-4/5 p-5 text-center">
              <div className="pointer-events-none absolute -end-12 -top-12 h-28 w-28 rounded-full bg-primary/8 blur-[50px]" />
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                {isAr ? "كود الإحالة الخاص بك" : "Your Referral Code"}
              </p>
              <div className="relative inline-flex items-center gap-3 rounded-xl bg-background/80 border border-primary/20 px-6 py-3 shadow-sm">
                <span className="font-mono text-2xl font-bold tracking-[0.15em] text-primary select-all" dir="ltr">
                  {referralCode.code}
                </span>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(referralCode.code);
                    toast({ title: isAr ? "تم نسخ الكود!" : "Code copied!" });
                  }}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-primary hover:bg-primary/10"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2.5 leading-relaxed">
                {isAr
                  ? "شارك هذا الكود مع أصدقائك ليستخدموه أثناء التسجيل"
                  : "Share this code with friends to use during registration"}
              </p>
            </div>
          )}

          {/* Referral Link */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">
              {isAr ? "أو شارك الرابط المباشر:" : "Or share the direct link:"}
            </p>
            <div className="flex gap-2">
              <code className="flex-1 rounded-xl border bg-muted/50 px-3 py-2 text-sm font-mono truncate" dir="ltr">
                {referralLink || "..."}
              </code>
              <Button onClick={copyLink} variant="outline" size="sm" className="gap-1.5 shrink-0">
                <Copy className="h-3.5 w-3.5" />
                {isAr ? "نسخ" : "Copy"}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Link to="/referrals">
              <Button size="sm" className="gap-1.5">
                <Gift className="h-3.5 w-3.5" />
                {isAr ? "لوحة الإحالات الكاملة" : "Full Referral Dashboard"}
              </Button>
            </Link>
            <Link to="/rewards">
              <Button size="sm" variant="outline" className="gap-1.5">
                <Trophy className="h-3.5 w-3.5" />
                {isAr ? "المكافآت" : "Rewards"}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Current Level & Progress */}
      {(() => {
        const currentLevel = milestones?.filter((m) => totalConversions >= m.required_referrals).sort((a, b) => b.required_referrals - a.required_referrals)[0];
        const currentLevelName = currentLevel ? (isAr ? currentLevel.name_ar : currentLevel.name) : (isAr ? "مبتدئ" : "Beginner");
        const currentIcon = currentLevel?.badge_icon || "🌟";
        
        return (
          <Card className="border-primary/15 bg-gradient-to-br from-primary/5 via-background to-chart-4/5">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-2xl">
                  {currentIcon}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {isAr ? "مستواك" : "Your Level"}
                  </p>
                  <p className="font-semibold">{currentLevelName}</p>
                </div>
              </div>
              {nextMilestone && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span>{isAr ? "التالي:" : "Next:"} {isAr ? nextMilestone.name_ar : nextMilestone.name} {nextMilestone.badge_icon}</span>
                    <span className="text-muted-foreground">{totalConversions}/{nextMilestone.required_referrals}</span>
                  </div>
                  <div className="relative">
                    <Progress value={progress} className="h-3" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-primary-foreground drop-shadow-sm">{Math.round(progress)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Chef Level Badges */}
      {milestones && milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isAr ? "مستويات الشيف" : "Chef Levels"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {milestones.map((m, idx) => {
                const achieved = achievedIds.has(m.id);
                return (
                  <div key={m.id} className={`text-center rounded-xl p-2.5 border transition-all duration-200 ${achieved ? "border-chart-2/30 bg-chart-2/5 shadow-sm" : totalConversions >= m.required_referrals ? "border-primary/20 bg-primary/5" : "opacity-40"}`}>
                    <span className="text-xl block mb-0.5">{m.badge_icon}</span>
                    <p className="text-[8px] font-medium leading-tight">{isAr ? m.name_ar : m.name}</p>
                    {achieved && <CheckCircle2 className="h-2.5 w-2.5 text-chart-2 mx-auto mt-0.5" />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </StaggeredList>
  );
}
