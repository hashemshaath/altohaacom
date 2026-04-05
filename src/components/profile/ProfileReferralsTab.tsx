import { memo, useState, useCallback } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReferralCode, useReferralStats, useReferralMilestones, useUserMilestones, useSendInvitation, useReferralInvitations } from "@/hooks/useReferral";
import { usePointsBalance } from "@/hooks/usePoints";
import { useToast } from "@/hooks/use-toast";
import { Copy, Gift, Star, Users, Send, TrendingUp, Trophy, CheckCircle2, Share2, MessageCircle, Twitter, Mail, QrCode, ExternalLink, Clock, Sparkles } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Link } from "react-router-dom";
import { StaggeredList } from "@/components/ui/staggered-list";

export const ProfileReferralsTab = memo(function ProfileReferralsTab({ userId }: { userId: string }) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const { data: referralCode } = useReferralCode();
  const { data: stats } = useReferralStats();
  const { data: milestones } = useReferralMilestones();
  const { data: userMilestones } = useUserMilestones();
  const { data: pointsBalance } = usePointsBalance();
  const { data: invitations } = useReferralInvitations();
  const sendInvitation = useSendInvitation();
  const [inviteEmail, setInviteEmail] = useState("");

  const referralLink = referralCode?.code
    ? `${window.location.origin}/auth?ref=${referralCode.code}`
    : "";

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: isAr ? "تم نسخ الرابط!" : "Link copied!" });
  }, [referralLink, isAr, toast]);

  const copyCode = useCallback(() => {
    if (referralCode?.code) {
      navigator.clipboard.writeText(referralCode.code);
      toast({ title: isAr ? "تم نسخ الكود!" : "Code copied!" });
    }
  }, [referralCode?.code, isAr, toast]);

  const shareViaWhatsApp = useCallback(() => {
    const text = isAr
      ? `انضم إلى Altoha عبر الرابط الخاص بي: ${referralLink}`
      : `Join Altoha using my referral link: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }, [referralLink, isAr]);

  const shareViaTwitter = useCallback(() => {
    const text = isAr
      ? `انضم إلى @Altoha — منصة الطهاة المحترفين! ${referralLink}`
      : `Join @Altoha — the professional culinary platform! ${referralLink}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  }, [referralLink, isAr]);

  const shareViaTelegram = useCallback(() => {
    const text = isAr
      ? `انضم إلى Altoha عبر الرابط الخاص بي`
      : `Join Altoha using my referral link`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`, "_blank");
  }, [referralLink, isAr]);

  const handleSendEmailInvite = useCallback(async () => {
    if (!inviteEmail || !referralCode?.id) return;
    sendInvitation.mutate(
      { email: inviteEmail, channel: "email", referralCodeId: referralCode.id },
      { onSuccess: () => setInviteEmail("") }
    );
  }, [inviteEmail, referralCode?.id, sendInvitation]);

  const totalConversions = stats?.conversionsCount || 0;
  const achievedIds = new Set(userMilestones?.map((m) => m.milestone_id) || []);
  const nextMilestone = milestones?.find((m) => m.required_referrals > totalConversions);
  const progress = nextMilestone ? (totalConversions / nextMilestone.required_referrals) * 100 : 100;

  // Conversion rate
  const totalInvites = stats?.invitationsCount || 0;
  const conversionRate = totalInvites > 0 ? ((totalConversions / totalInvites) * 100).toFixed(1) : "0";

  const statItems = [
    { icon: Send, label: isAr ? "دعوات" : "Invites", value: totalInvites, color: "text-chart-4", bg: "bg-chart-4/10" },
    { icon: Users, label: isAr ? "تحويلات" : "Converts", value: totalConversions, color: "text-chart-2", bg: "bg-chart-2/10" },
    { icon: TrendingUp, label: isAr ? "النسبة" : "Rate", value: `${conversionRate}%`, color: "text-chart-3", bg: "bg-chart-3/10", isText: true },
    { icon: Star, label: isAr ? "النقاط" : "Points", value: pointsBalance || 0, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <StaggeredList className="space-y-6" stagger={80}>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statItems.map((s) => (
          <Card key={s.label} className="border-border/50 group hover:border-primary/20 transition-all duration-200 hover:shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${s.bg} transition-transform duration-200 group-hover:scale-110`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div>
                {(s as any).isText ? (
                  <p className="text-xl font-bold tabular-nums">{s.value}</p>
                ) : (
                  <AnimatedCounter value={typeof s.value === "number" ? s.value : parseInt(String(s.value)) || 0} className="text-xl" />
                )}
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Referral Code & Share */}
      <Card className="border-border/50 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-transparent to-chart-4/5">
          <CardTitle className="text-base flex items-center gap-2">
            <Gift className="h-4 w-4 text-primary" />
            {isAr ? "رمز وكود الإحالة" : "Referral Code & Link"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-4">
          {/* Prominent Referral Code */}
          {referralCode && (
            <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-background to-chart-4/5 p-6 text-center">
              <div className="pointer-events-none absolute -end-12 -top-12 h-28 w-28 rounded-full bg-primary/8 blur-[50px]" />
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                {isAr ? "كود الإحالة الخاص بك" : "Your Referral Code"}
              </p>
              <div className="relative inline-flex items-center gap-3 rounded-xl bg-background/80 border border-primary/20 px-6 py-3 shadow-sm">
                <span className="font-mono text-2xl font-bold tracking-[0.15em] text-primary select-all" dir="ltr">
                  {referralCode.code}
                </span>
                <Button onClick={copyCode} variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-primary hover:bg-primary/10">
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

          {/* ── Social Share Buttons ── */}
          <div>
            <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
              <Share2 className="h-3.5 w-3.5 text-primary" />
              {isAr ? "شارك عبر" : "Share via"}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button variant="outline" size="sm" onClick={shareViaWhatsApp} className="gap-1.5 text-xs border-chart-2/20 hover:bg-chart-2/5 hover:border-chart-2/40 transition-all">
                <MessageCircle className="h-3.5 w-3.5 text-chart-2" />
                WhatsApp
              </Button>
              <Button variant="outline" size="sm" onClick={shareViaTwitter} className="gap-1.5 text-xs border-chart-1/20 hover:bg-chart-1/5 hover:border-chart-1/40 transition-all">
                <Twitter className="h-3.5 w-3.5 text-chart-1" />
                X / Twitter
              </Button>
              <Button variant="outline" size="sm" onClick={shareViaTelegram} className="gap-1.5 text-xs border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all">
                <Send className="h-3.5 w-3.5 text-primary" />
                Telegram
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={async () => {
                  if (navigator.share) {
                    await navigator.share({ title: "Altoha", text: isAr ? "انضم إلى Altoha" : "Join Altoha", url: referralLink });
                  } else {
                    copyLink();
                  }
                }}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {isAr ? "المزيد" : "More"}
              </Button>
            </div>
          </div>

          {/* ── Send Email Invite ── */}
          <div className="rounded-xl border border-border/40 bg-muted/20 p-4">
            <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-primary" />
              {isAr ? "إرسال دعوة بالإيميل" : "Send Email Invitation"}
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder={isAr ? "أدخل الإيميل" : "Enter email address"}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                dir="ltr"
                className="h-9 text-sm rounded-xl"
                onKeyDown={(e) => { if (e.key === "Enter") handleSendEmailInvite(); }}
              />
              <Button
                size="sm"
                onClick={handleSendEmailInvite}
                disabled={!inviteEmail || sendInvitation.isPending}
                className="gap-1.5 shrink-0 rounded-xl"
              >
                <Send className="h-3.5 w-3.5" />
                {isAr ? "إرسال" : "Send"}
              </Button>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
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
          <Card className="border-primary/15 bg-gradient-to-br from-primary/5 via-background to-chart-4/5 overflow-hidden">
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
                {nextMilestone && (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Sparkles className="h-2.5 w-2.5" />
                    {nextMilestone.required_referrals - totalConversions} {isAr ? "متبقية" : "to go"}
                  </Badge>
                )}
              </div>
              {nextMilestone && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span>{isAr ? "التالي:" : "Next:"} {isAr ? nextMilestone.name_ar : nextMilestone.name} {nextMilestone.badge_icon}</span>
                    <span className="text-muted-foreground tabular-nums">{totalConversions}/{nextMilestone.required_referrals}</span>
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

      {/* Recent Invitations */}
      {invitations && invitations.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {isAr ? "آخر الدعوات" : "Recent Invitations"}
              <Badge variant="secondary" className="text-[10px] ms-auto">{invitations.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-none">
              {invitations.slice(0, 8).map((inv) => (
                <div key={inv.id} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                    inv.status === "converted" ? "bg-chart-2/15 text-chart-2" :
                    inv.status === "clicked" ? "bg-chart-3/15 text-chart-3" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {inv.status === "converted" ? <CheckCircle2 className="h-3.5 w-3.5" /> :
                     inv.status === "clicked" ? <TrendingUp className="h-3.5 w-3.5" /> :
                     <Send className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{inv.invitee_email || inv.invitee_phone || (isAr ? "رابط" : "Link share")}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {inv.channel} · {new Date(inv.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <Badge variant={inv.status === "converted" ? "default" : "secondary"} className="text-[9px] shrink-0">
                    {inv.status === "converted" ? (isAr ? "تم" : "Done") :
                     inv.status === "clicked" ? (isAr ? "نقر" : "Clicked") :
                     (isAr ? "مرسل" : "Sent")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chef Level Badges */}
      {milestones && milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isAr ? "مستويات الشيف" : "Chef Levels"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {milestones.map((m) => {
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
});
