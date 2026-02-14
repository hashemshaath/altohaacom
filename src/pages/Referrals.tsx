import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useReferralCode, useReferralStats, useReferralInvitations, useReferralMilestones, useUserMilestones } from "@/hooks/useReferral";
import { usePointsBalance } from "@/hooks/usePoints";
import { Share2, Gift, Trophy, Users, TrendingUp, Send, Star, Mail, MessageCircle, BarChart3, Target, Zap, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { ReferralShareSheet } from "@/components/referrals/ReferralShareSheet";

export default function Referrals() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();

  const { data: referralCode } = useReferralCode();
  const { data: stats } = useReferralStats();
  const { data: invitations } = useReferralInvitations();
  const { data: milestones } = useReferralMilestones();
  const { data: userMilestones } = useUserMilestones();
  const { data: pointsBalance } = usePointsBalance();

  const referralLink = referralCode?.code
    ? `${window.location.origin}/auth?ref=${referralCode.code}`
    : "";

  // Share functions moved to ReferralShareSheet component

  const totalConversions = stats?.conversionsCount || 0;
  const achievedMilestoneIds = new Set(userMilestones?.map((m) => m.milestone_id) || []);
  const nextMilestone = milestones?.find((m) => m.required_referrals > totalConversions);
  const progressToNext = nextMilestone ? (totalConversions / nextMilestone.required_referrals) * 100 : 100;

  const statCards = [
    { icon: Send, label: isAr ? "دعوات مرسلة" : "Invites Sent", value: stats?.invitationsCount || 0, color: "text-chart-4", bg: "bg-chart-4/10" },
    { icon: Users, label: isAr ? "تحويلات" : "Conversions", value: totalConversions, color: "text-chart-2", bg: "bg-chart-2/10" },
    { icon: TrendingUp, label: isAr ? "نقرات" : "Clicks", value: stats?.codeStats?.total_clicks || 0, color: "text-chart-3", bg: "bg-chart-3/10" },
    { icon: Star, label: isAr ? "نقاط مكتسبة" : "Points Earned", value: stats?.codeStats?.total_points_earned || 0, color: "text-primary", bg: "bg-primary/10" },
  ];

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead title={isAr ? "نظام الإحالة" : "Referral Program"} description="Invite friends and earn rewards" />
      <Header />
      <main className="container flex-1 py-6 md:py-10">
        {/* Hero */}
        <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-chart-2/10 p-6 sm:p-8">
          <div className="pointer-events-none absolute -end-20 -top-20 h-56 w-56 rounded-full bg-primary/8 blur-[100px]" />
          <div className="pointer-events-none absolute -start-16 -bottom-16 h-40 w-40 rounded-full bg-chart-2/10 blur-[80px]" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-4 ring-primary/5">
                  <Gift className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="font-serif text-2xl font-bold sm:text-3xl">
                    {isAr ? "برنامج الإحالة والنمو" : "Referral & Growth Program"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {isAr ? "ادعُ أصدقاءك واكسب نقاطاً ومكافآت حصرية" : "Invite friends & earn exclusive points and rewards"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/rewards">
                <Button variant="outline" className="gap-2">
                  <Trophy className="h-4 w-4" />
                  {isAr ? "المكافآت" : "Rewards"}
                </Button>
              </Link>
              <Badge variant="secondary" className="text-base px-4 py-2">
                <Star className="h-4 w-4 me-1.5 text-chart-4" />
                {pointsBalance || 0} {isAr ? "نقطة" : "pts"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
          {statCards.map((s) => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.bg}`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="share" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="share" className="gap-1.5">
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">{isAr ? "مشاركة" : "Share"}</span>
            </TabsTrigger>
            <TabsTrigger value="milestones" className="gap-1.5">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">{isAr ? "الإنجازات" : "Milestones"}</span>
            </TabsTrigger>
            <TabsTrigger value="invitations" className="gap-1.5">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">{isAr ? "الدعوات" : "Invitations"}</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">{isAr ? "التحليلات" : "Analytics"}</span>
            </TabsTrigger>
          </TabsList>

          {/* Share Tab */}
          <TabsContent value="share" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Share2 className="h-4 w-4 text-primary" />
                  {isAr ? "شارك واكسب النقاط" : "Share & Earn Points"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {referralCode && (
                  <ReferralShareSheet
                    referralLink={referralLink}
                    referralCode={referralCode.code}
                    referralCodeId={referralCode.id}
                  />
                )}
              </CardContent>
            </Card>

            {/* How it works */}
            <Card className="border-primary/15 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="h-4 w-4 text-primary" />
                  {isAr ? "كيف يعمل" : "How it works"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { step: "1", title: isAr ? "شارك رابطك" : "Share your link", desc: isAr ? "انسخ رابط الإحالة وشاركه عبر أي منصة" : "Copy your referral link and share it anywhere" },
                    { step: "2", title: isAr ? "صديقك يسجل" : "Friend signs up", desc: isAr ? "عندما يسجل صديقك تحصل على نقاط" : "When your friend registers, you earn points" },
                    { step: "3", title: isAr ? "اكسب مكافآت" : "Earn rewards", desc: isAr ? "استبدل نقاطك بخصومات وترقيات وهدايا" : "Redeem points for discounts, upgrades & gifts" },
                  ].map((item) => (
                    <div key={item.step} className="text-center">
                      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                        {item.step}
                      </div>
                      <h4 className="font-medium text-sm">{item.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones" className="space-y-6">
            {/* Progress to next */}
            {nextMilestone && (
              <Card className="border-primary/15">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      {isAr ? "التقدم نحو:" : "Progress to:"} {isAr ? nextMilestone.name_ar : nextMilestone.name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {totalConversions}/{nextMilestone.required_referrals}
                    </span>
                  </div>
                  <Progress value={progressToNext} className="h-3" />
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {milestones?.map((milestone) => {
                const achieved = achievedMilestoneIds.has(milestone.id);
                const reachable = totalConversions >= milestone.required_referrals;
                return (
                  <Card
                    key={milestone.id}
                    className={`transition-all ${achieved ? "border-chart-2/40 bg-chart-2/5" : reachable ? "border-primary/30 bg-primary/5" : "opacity-70"}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-3xl">{milestone.badge_icon}</span>
                        {achieved ? (
                          <Badge className="bg-chart-2/20 text-chart-2">
                            <CheckCircle2 className="h-3 w-3 me-1" />
                            {isAr ? "مُنجز" : "Achieved"}
                          </Badge>
                        ) : reachable ? (
                          <Badge className="bg-primary/20 text-primary">{isAr ? "متاح" : "Available"}</Badge>
                        ) : (
                          <Badge variant="outline">{milestone.required_referrals} {isAr ? "إحالة" : "referrals"}</Badge>
                        )}
                      </div>
                      <h3 className="font-semibold">{isAr ? milestone.name_ar : milestone.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isAr ? milestone.description_ar : milestone.description}
                      </p>
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-primary">
                        <Gift className="h-3.5 w-3.5" />
                        {isAr ? milestone.reward_description_ar : milestone.reward_description}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Invitations Tab */}
          <TabsContent value="invitations">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {isAr ? "سجل الدعوات" : "Invitation History"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!invitations?.length ? (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    {isAr ? "لا توجد دعوات بعد. ابدأ بمشاركة رابطك!" : "No invitations yet. Start sharing your link!"}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {invitations.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                            {inv.channel === "email" ? <Mail className="h-4 w-4" /> :
                             inv.channel === "whatsapp" ? <MessageCircle className="h-4 w-4" /> :
                             <Share2 className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{inv.invitee_email || inv.invitee_phone || inv.channel}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(inv.sent_at).toLocaleDateString(isAr ? "ar" : "en")}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={inv.status === "converted" ? "bg-chart-2/20 text-chart-2" : inv.status === "clicked" ? "bg-chart-4/20 text-chart-4" : ""}
                        >
                          {inv.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    {isAr ? "ملخص الأداء" : "Performance Summary"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {[
                      { label: isAr ? "معدل التحويل" : "Conversion Rate", value: stats?.invitationsCount ? `${Math.round(((stats?.conversionsCount || 0) / stats.invitationsCount) * 100)}%` : "0%" },
                      { label: isAr ? "معدل النقر" : "Click Rate", value: stats?.invitationsCount ? `${Math.round(((stats?.codeStats?.total_clicks || 0) / Math.max(stats.invitationsCount, 1)) * 100)}%` : "0%" },
                      { label: isAr ? "متوسط النقاط لكل إحالة" : "Avg Points/Referral", value: stats?.conversionsCount ? Math.round((stats?.codeStats?.total_points_earned || 0) / stats.conversionsCount) : 0 },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-lg border p-3">
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <span className="font-bold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-primary" />
                    {isAr ? "القنوات" : "Channel Breakdown"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const channelCounts: Record<string, number> = {};
                    invitations?.forEach((inv) => {
                      channelCounts[inv.channel] = (channelCounts[inv.channel] || 0) + 1;
                    });
                    const channels = Object.entries(channelCounts).sort((a, b) => b[1] - a[1]);
                    if (!channels.length) return <p className="text-center text-sm text-muted-foreground py-6">{isAr ? "لا توجد بيانات" : "No data yet"}</p>;
                    const max = channels[0][1];
                    return (
                      <div className="space-y-3">
                        {channels.map(([ch, count]) => (
                          <div key={ch}>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="capitalize">{ch}</span>
                              <span className="font-medium">{count}</span>
                            </div>
                            <Progress value={(count / max) * 100} className="h-2" />
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
