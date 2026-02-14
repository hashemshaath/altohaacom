import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useReferralCode, useReferralStats, useReferralInvitations, useSendInvitation, useReferralMilestones, useUserMilestones } from "@/hooks/useReferral";
import { usePointsBalance } from "@/hooks/usePoints";
import { Copy, Mail, Share2, Gift, Trophy, Users, TrendingUp, Send, Star, Crown, Loader2, Link2, MessageCircle, QrCode, BarChart3, Target, Zap, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function Referrals() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState("");

  const { data: referralCode, isLoading: codeLoading } = useReferralCode();
  const { data: stats } = useReferralStats();
  const { data: invitations } = useReferralInvitations();
  const { data: milestones } = useReferralMilestones();
  const { data: userMilestones } = useUserMilestones();
  const { data: pointsBalance } = usePointsBalance();
  const sendInvitation = useSendInvitation();

  const referralLink = referralCode?.code
    ? `${window.location.origin}/auth?ref=${referralCode.code}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: isAr ? "تم نسخ الرابط!" : "Link copied!" });
  };

  const shareNative = async () => {
    if (navigator.share) {
      await navigator.share({
        title: isAr ? "انضم إلى ألطهاة" : "Join Altohaa",
        text: isAr ? "انضم إلى منصة ألطهاة للطهاة المحترفين!" : "Join Altohaa - The professional culinary platform!",
        url: referralLink,
      });
    } else {
      copyLink();
    }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      isAr
        ? `انضم إلى منصة ألطهاة! سجل الآن واحصل على نقاط إضافية: ${referralLink}`
        : `Join Altohaa! Sign up now and earn bonus points: ${referralLink}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
    if (referralCode) {
      sendInvitation.mutate({ channel: "whatsapp", referralCodeId: referralCode.id });
    }
  };

  const shareTwitter = () => {
    const text = encodeURIComponent(
      isAr ? `انضم إلى ألطهاة - المنصة الأولى للطهاة المحترفين` : `Join Altohaa - The #1 platform for professional chefs`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(referralLink)}`, "_blank");
    if (referralCode) {
      sendInvitation.mutate({ channel: "twitter", referralCodeId: referralCode.id });
    }
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, "_blank");
    if (referralCode) {
      sendInvitation.mutate({ channel: "facebook", referralCodeId: referralCode.id });
    }
  };

  const shareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`, "_blank");
    if (referralCode) {
      sendInvitation.mutate({ channel: "linkedin", referralCodeId: referralCode.id });
    }
  };

  const sendEmailInvite = () => {
    if (!inviteEmail || !referralCode) return;
    sendInvitation.mutate(
      { email: inviteEmail, channel: "email", referralCodeId: referralCode.id },
      { onSuccess: () => setInviteEmail("") }
    );
  };

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
            {/* Referral Link */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Link2 className="h-4 w-4 text-primary" />
                  {isAr ? "رابط الإحالة الخاص بك" : "Your Referral Link"}
                </CardTitle>
                <CardDescription>
                  {isAr ? "شارك هذا الرابط مع أصدقائك لكسب النقاط" : "Share this link with friends to earn points"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input value={referralLink} readOnly className="font-mono text-sm" dir="ltr" />
                  <Button onClick={copyLink} variant="outline" className="shrink-0 gap-1.5">
                    <Copy className="h-4 w-4" />
                    {isAr ? "نسخ" : "Copy"}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {isAr ? "الكود:" : "Code:"} {referralCode?.code || "..."}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Share Channels */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Share2 className="h-4 w-4 text-primary" />
                  {isAr ? "شارك عبر" : "Share via"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  <Button onClick={shareWhatsApp} variant="outline" className="gap-2 h-12">
                    <MessageCircle className="h-5 w-5 text-chart-2" />
                    WhatsApp
                  </Button>
                  <Button onClick={shareTwitter} variant="outline" className="gap-2 h-12">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                    X / Twitter
                  </Button>
                  <Button onClick={shareFacebook} variant="outline" className="gap-2 h-12">
                    <svg className="h-5 w-5 text-chart-1" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                    Facebook
                  </Button>
                  <Button onClick={shareLinkedIn} variant="outline" className="gap-2 h-12">
                    <svg className="h-5 w-5 text-chart-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                    LinkedIn
                  </Button>
                  <Button onClick={shareNative} variant="outline" className="gap-2 h-12">
                    <Share2 className="h-5 w-5 text-primary" />
                    {isAr ? "المزيد" : "More"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Email Invite */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="h-4 w-4 text-primary" />
                  {isAr ? "دعوة عبر البريد الإلكتروني" : "Invite via Email"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder={isAr ? "أدخل البريد الإلكتروني" : "Enter email address"}
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <Button
                    onClick={sendEmailInvite}
                    disabled={!inviteEmail || sendInvitation.isPending}
                    className="gap-1.5 shrink-0"
                  >
                    {sendInvitation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {isAr ? "إرسال" : "Send"}
                  </Button>
                </div>
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
