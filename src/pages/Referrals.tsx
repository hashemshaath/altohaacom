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
import { useReferralAnalytics } from "@/hooks/useReferralAnalytics";
import { usePointsBalance } from "@/hooks/usePoints";
import { Share2, Gift, Trophy, Users, TrendingUp, Send, Star, Mail, MessageCircle, BarChart3, Target, Zap, CheckCircle2, MousePointerClick, ArrowDownRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ReferralShareSheet } from "@/components/referrals/ReferralShareSheet";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from "recharts";

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
  const { data: analytics } = useReferralAnalytics();

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
        <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-background to-chart-2/15 p-6 sm:p-10 border border-primary/10">
          <div className="pointer-events-none absolute -end-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-[120px] animate-pulse" />
          <div className="pointer-events-none absolute -start-20 -bottom-20 h-56 w-56 rounded-full bg-chart-2/12 blur-[100px] animate-pulse [animation-delay:1.5s]" />
          <div className="pointer-events-none absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-40 rounded-full bg-chart-4/8 blur-[80px] animate-pulse [animation-delay:3s]" />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-chart-2/20 to-transparent" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge variant="outline" className="mb-3 border-primary/20 bg-primary/5 text-primary text-[10px] uppercase tracking-widest px-3 py-1">
                <Zap className="h-3 w-3 me-1" />
                {isAr ? "برنامج النمو" : "Growth Program"}
              </Badge>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-4 ring-primary/5 shadow-lg shadow-primary/10 transition-transform duration-300 hover:scale-110">
                  <Gift className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h1 className="font-serif text-2xl font-bold sm:text-3xl lg:text-4xl">
                    {isAr ? "برنامج الإحالة والنمو" : "Referral & Growth Program"}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isAr ? "ادعُ أصدقاءك واكسب نقاطاً ومكافآت حصرية" : "Invite friends & earn exclusive points and rewards"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/rewards">
                <Button variant="outline" className="gap-2 transition-all duration-300 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5">
                  <Trophy className="h-4 w-4" />
                  {isAr ? "المكافآت" : "Rewards"}
                </Button>
              </Link>
              <Badge variant="secondary" className="text-base px-5 py-2.5 shadow-md">
                <Star className="h-4 w-4 me-1.5 text-chart-4" />
                {pointsBalance || 0} {isAr ? "نقطة" : "pts"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-8">
          {statCards.map((s) => (
            <Card key={s.label} className="border-border/50 group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20">
              <CardContent className="flex items-center gap-3 p-4 sm:p-5">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.bg} transition-all duration-300 group-hover:scale-110 group-hover:shadow-md`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold tabular-nums">{s.value}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="share" className="space-y-6">
          <div className="sticky top-[64px] z-30 -mx-4 px-4 py-3 border-b border-border/40 bg-background/80 backdrop-blur-md">
            <TabsList className="grid w-full grid-cols-4 bg-muted/60">
              <TabsTrigger value="share" className="gap-1.5 data-[state=active]:shadow-md">
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">{isAr ? "مشاركة" : "Share"}</span>
              </TabsTrigger>
              <TabsTrigger value="milestones" className="gap-1.5 data-[state=active]:shadow-md">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">{isAr ? "الإنجازات" : "Milestones"}</span>
              </TabsTrigger>
              <TabsTrigger value="invitations" className="gap-1.5 data-[state=active]:shadow-md">
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">{isAr ? "الدعوات" : "Invitations"}</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1.5 data-[state=active]:shadow-md">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">{isAr ? "التحليلات" : "Analytics"}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Share Tab */}
          <TabsContent value="share" className="space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                    <Share2 className="h-4 w-4 text-primary" />
                  </div>
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
            <Card className="border-primary/15 bg-gradient-to-br from-primary/5 via-background to-chart-4/5 overflow-hidden relative">
              <div className="pointer-events-none absolute -end-16 -top-16 h-32 w-32 rounded-full bg-primary/8 blur-[60px]" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  {isAr ? "كيف يعمل" : "How it works"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-3">
                  {[
                    { step: "1", title: isAr ? "شارك رابطك" : "Share your link", desc: isAr ? "انسخ رابط الإحالة وشاركه عبر أي منصة" : "Copy your referral link and share it anywhere" },
                    { step: "2", title: isAr ? "صديقك يسجل" : "Friend signs up", desc: isAr ? "عندما يسجل صديقك تحصل على نقاط" : "When your friend registers, you earn points" },
                    { step: "3", title: isAr ? "اكسب مكافآت" : "Earn rewards", desc: isAr ? "استبدل نقاطك بخصومات وترقيات وهدايا" : "Redeem points for discounts, upgrades & gifts" },
                  ].map((item) => (
                    <div key={item.step} className="text-center group">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-lg shadow-primary/20 transition-transform duration-300 group-hover:scale-110">
                        {item.step}
                      </div>
                      <h4 className="font-semibold text-sm">{item.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{item.desc}</p>
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
                    className={`group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${achieved ? "border-chart-2/40 bg-gradient-to-br from-chart-2/5 to-background shadow-sm shadow-chart-2/10" : reachable ? "border-primary/30 bg-gradient-to-br from-primary/5 to-background" : "opacity-60 hover:opacity-90"}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-3xl transition-transform duration-300 group-hover:scale-125">{milestone.badge_icon}</span>
                        {achieved ? (
                          <Badge className="bg-chart-2/20 text-chart-2 shadow-sm">
                            <CheckCircle2 className="h-3 w-3 me-1" />
                            {isAr ? "مُنجز" : "Achieved"}
                          </Badge>
                        ) : reachable ? (
                          <Badge className="bg-primary/20 text-primary animate-pulse">{isAr ? "متاح" : "Available"}</Badge>
                        ) : (
                          <Badge variant="outline">{milestone.required_referrals} {isAr ? "إحالة" : "referrals"}</Badge>
                        )}
                      </div>
                      <h3 className="font-semibold">{isAr ? milestone.name_ar : milestone.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {isAr ? milestone.description_ar : milestone.description}
                      </p>
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-primary font-medium">
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
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-chart-4/10">
                    <Mail className="h-4 w-4 text-chart-4" />
                  </div>
                  {isAr ? "سجل الدعوات" : "Invitation History"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!invitations?.length ? (
                  <div className="text-center py-12">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                      <Send className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isAr ? "لا توجد دعوات بعد. ابدأ بمشاركة رابطك!" : "No invitations yet. Start sharing your link!"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {invitations.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between rounded-xl border border-border/50 p-3.5 transition-all duration-200 hover:bg-muted/30 hover:shadow-sm hover:border-primary/10">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/80">
                            {inv.channel === "email" ? <Mail className="h-4 w-4 text-chart-1" /> :
                             inv.channel === "whatsapp" ? <MessageCircle className="h-4 w-4 text-chart-2" /> :
                             <Share2 className="h-4 w-4 text-chart-4" />}
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
                          className={inv.status === "converted" ? "bg-chart-2/20 text-chart-2 border-chart-2/30 shadow-sm" : inv.status === "clicked" ? "bg-chart-4/20 text-chart-4 border-chart-4/30" : ""}
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
          <TabsContent value="analytics" className="space-y-6">
            {/* Conversion Funnel */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-chart-3/10">
                    <ArrowDownRight className="h-4 w-4 text-chart-3" />
                  </div>
                  {isAr ? "قمع التحويل" : "Conversion Funnel"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.funnel ? (
                  <div className="flex items-end justify-center gap-6 py-4">
                    {analytics.funnel.map((step, i) => {
                      const maxVal = Math.max(...analytics.funnel.map((f) => f.value), 1);
                      const height = Math.max((step.value / maxVal) * 140, 24);
                      const colors = ["bg-chart-3", "bg-chart-4", "bg-chart-2"];
                      return (
                        <div key={step.stage} className="flex flex-col items-center gap-2">
                          <span className="text-xl font-bold">{step.value}</span>
                          <div className={`w-20 rounded-t-lg ${colors[i]} transition-all`} style={{ height }} />
                          <span className="text-xs text-muted-foreground text-center">
                            {isAr ? step.stageAr : step.stage}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-8">{isAr ? "لا توجد بيانات" : "No data yet"}</p>
                )}
              </CardContent>
            </Card>

            {/* Daily Trend Chart */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-chart-4/10">
                    <TrendingUp className="h-4 w-4 text-chart-4" />
                  </div>
                  {isAr ? "النشاط اليومي (14 يوم)" : "Daily Activity (14 days)"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.dailyTrend?.length ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={analytics.dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(v) => new Date(v).toLocaleDateString(isAr ? "ar" : "en", { day: "numeric", month: "short" })}
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                      />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                        labelFormatter={(v) => new Date(v).toLocaleDateString(isAr ? "ar" : "en")}
                      />
                      <Line type="monotone" dataKey="clicks" stroke="hsl(var(--chart-3))" strokeWidth={2} name={isAr ? "نقرات" : "Clicks"} dot={false} />
                      <Line type="monotone" dataKey="conversions" stroke="hsl(var(--chart-2))" strokeWidth={2} name={isAr ? "تحويلات" : "Conversions"} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-8">{isAr ? "لا توجد بيانات" : "No data yet"}</p>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Performance Summary */}
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                      <BarChart3 className="h-4 w-4 text-primary" />
                    </div>
                    {isAr ? "ملخص الأداء" : "Performance Summary"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
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
                </CardContent>
              </Card>

              {/* Channel Performance with Conversion Rate */}
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-chart-2/10">
                      <Share2 className="h-4 w-4 text-chart-2" />
                    </div>
                    {isAr ? "أداء القنوات" : "Channel Performance"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics?.channelStats && Object.keys(analytics.channelStats).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(analytics.channelStats)
                        .sort((a, b) => b[1].sent - a[1].sent)
                        .map(([ch, data]) => {
                          const rate = data.sent > 0 ? Math.round((data.converted / data.sent) * 100) : 0;
                          return (
                            <div key={ch} className="rounded-lg border p-3">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm font-medium capitalize">{ch}</span>
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-muted-foreground">{data.sent} {isAr ? "مرسلة" : "sent"}</span>
                                  <Badge variant="outline" className={rate > 0 ? "bg-chart-2/10 text-chart-2" : ""}>
                                    {rate}% {isAr ? "تحويل" : "conv."}
                                  </Badge>
                                </div>
                              </div>
                              <Progress value={rate} className="h-1.5" />
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <p className="text-center text-sm text-muted-foreground py-6">{isAr ? "لا توجد بيانات" : "No data yet"}</p>
                  )}
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
