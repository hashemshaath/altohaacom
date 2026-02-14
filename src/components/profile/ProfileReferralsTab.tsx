import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useReferralCode, useReferralStats, useReferralMilestones, useUserMilestones } from "@/hooks/useReferral";
import { usePointsBalance } from "@/hooks/usePoints";
import { useToast } from "@/hooks/use-toast";
import { Copy, Gift, Star, Users, Send, TrendingUp, Trophy, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

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
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statItems.map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Referral Link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Gift className="h-4 w-4 text-primary" />
            {isAr ? "رابط الإحالة" : "Referral Link"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <code className="flex-1 rounded-lg border bg-muted/50 px-3 py-2 text-sm font-mono truncate" dir="ltr">
              {referralLink || "..."}
            </code>
            <Button onClick={copyLink} variant="outline" size="sm" className="gap-1.5 shrink-0">
              <Copy className="h-3.5 w-3.5" />
              {isAr ? "نسخ" : "Copy"}
            </Button>
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

      {/* Milestone Progress */}
      {nextMilestone && (
        <Card className="border-primary/15">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {isAr ? "التقدم نحو:" : "Next:"} {isAr ? nextMilestone.name_ar : nextMilestone.name}
              </span>
              <span className="text-sm text-muted-foreground">
                {totalConversions}/{nextMilestone.required_referrals}
              </span>
            </div>
            <Progress value={progress} className="h-2.5" />
          </CardContent>
        </Card>
      )}

      {/* Achieved Milestones */}
      {milestones && milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isAr ? "الإنجازات" : "Milestones"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {milestones.map((m) => {
                const achieved = achievedIds.has(m.id);
                return (
                  <div key={m.id} className={`text-center rounded-xl p-3 border ${achieved ? "border-chart-2/30 bg-chart-2/5" : "opacity-40"}`}>
                    <span className="text-2xl block mb-1">{m.badge_icon}</span>
                    <p className="text-[10px] font-medium">{isAr ? m.name_ar : m.name}</p>
                    {achieved && <CheckCircle2 className="h-3 w-3 text-chart-2 mx-auto mt-1" />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
