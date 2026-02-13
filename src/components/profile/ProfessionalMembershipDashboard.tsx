import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { VerifiedBadge } from "@/components/verification/VerifiedBadge";
import {
  Crown, Shield, Calendar, Clock, Eye, TrendingUp, Award, Trophy,
  Star, Briefcase, GraduationCap, MessageSquare, Bell, Percent,
  Users, Globe, Newspaper, ShoppingBag, ChevronDown, HelpCircle,
  BookOpen, Headphones, Zap, Target, BarChart3, UserCheck,
  ArrowRight, Sparkles, Gift,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Link } from "react-router-dom";

interface ProfessionalMembershipDashboardProps {
  profile: any;
  userId: string;
}

export function ProfessionalMembershipDashboard({ profile, userId }: ProfessionalMembershipDashboardProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const isPro = profile?.membership_tier === "professional" || profile?.membership_tier === "enterprise";
  const isEnterprise = profile?.membership_tier === "enterprise";
  const expiresAt = profile?.membership_expires_at;
  const startedAt = profile?.membership_started_at || profile?.created_at;
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;
  const loyaltyPoints = profile?.loyalty_points || 0;

  const { data: stats } = useQuery({
    queryKey: ["pro-dashboard-stats", userId],
    queryFn: async () => {
      const [
        { count: competitions },
        { count: certificates },
        { count: badges },
        { count: masterclasses },
      ] = await Promise.all([
        supabase.from("competition_registrations").select("*", { count: "exact", head: true }).eq("participant_id", userId),
        supabase.from("certificates").select("*", { count: "exact", head: true }).eq("recipient_id", userId),
        supabase.from("user_badges").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("masterclass_enrollments").select("*", { count: "exact", head: true }).eq("user_id", userId),
      ]);
      return { competitions: competitions || 0, certificates: certificates || 0, badges: badges || 0, masterclasses: masterclasses || 0 };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const { data: careerRecords } = useQuery({
    queryKey: ["pro-career", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_career_records")
        .select("*")
        .eq("user_id", userId)
        .order("start_date", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!userId,
  });

  if (!isPro) return null;

  const tierLabel = isEnterprise ? (isAr ? "مؤسسي" : "Enterprise") : (isAr ? "احترافي" : "Professional");
  const tierColor = isEnterprise ? "text-chart-2" : "text-primary";
  const tierBg = isEnterprise ? "bg-chart-2/10" : "bg-primary/10";
  const TierIcon = isEnterprise ? Shield : Crown;

  const benefits = [
    { icon: Award, label: isAr ? "شارة التوثيق المهني" : "Verified Professional Badge", active: true },
    { icon: Headphones, label: isAr ? "دعم فني ذو أولوية" : "Priority Technical Support", active: true },
    { icon: Bell, label: isAr ? "إشعارات مخصصة ومبكرة" : "Custom & Early Notifications", active: true },
    { icon: Percent, label: isAr ? "خصومات على المسابقات والدورات" : "Discounts on Competitions & Courses", active: true },
    { icon: Zap, label: isAr ? "تسجيل أولوية في المسابقات" : "Priority Competition Registration", active: true },
    { icon: Users, label: isAr ? "شبكة تواصل مع طهاة دوليين" : "Networking with International Chefs", active: true },
    { icon: Globe, label: isAr ? "الطهاة الزائرون للمملكة" : "Chefs Visiting the Kingdom", active: true },
    { icon: Newspaper, label: isAr ? "أخبار حصرية ومواسم خاصة" : "Exclusive News & Special Seasons", active: true },
    { icon: ShoppingBag, label: isAr ? "نقاط مضاعفة عند الشراء" : "Double Points on Store Purchases", active: true },
    { icon: BarChart3, label: isAr ? "إحصائيات شاملة للملف" : "Comprehensive Profile Statistics", active: true },
    { icon: MessageSquare, label: isAr ? "تواصل مباشر مع المحترفين" : "Direct Messaging with Pros", active: true },
    { icon: BookOpen, label: isAr ? "موارد تعليمية حصرية" : "Exclusive Learning Resources", active: isEnterprise },
  ];

  const faqs = [
    {
      q: isAr ? "كيف أستفيد من التسجيل ذو الأولوية؟" : "How does priority registration work?",
      a: isAr ? "يتم فتح التسجيل لك قبل الأعضاء الأساسيين بـ 48 ساعة في جميع المسابقات والفعاليات." : "Registration opens 48 hours early for you across all competitions and events.",
    },
    {
      q: isAr ? "كيف أحصل على نقاط مضاعفة؟" : "How do I earn double points?",
      a: isAr ? "كل عملية شراء من المتجر تمنحك نقاطاً مضاعفة تلقائياً طوال فترة عضويتك الاحترافية." : "Every store purchase automatically earns you double loyalty points during your Professional membership.",
    },
    {
      q: isAr ? "هل يمكنني التواصل مع طهاة دوليين؟" : "Can I connect with international chefs?",
      a: isAr ? "نعم، ستحصل على وصول لشبكة الطهاة الدوليين الزائرين للمملكة وإشعارات بالفعاليات الحصرية." : "Yes, you get access to the international chefs network visiting the Kingdom and exclusive event notifications.",
    },
    {
      q: isAr ? "كيف أتواصل مع الدعم الفني ذو الأولوية؟" : "How do I reach priority support?",
      a: isAr ? "يمكنك التواصل عبر صفحة الدعم وسيتم معالجة طلبك في أولوية قصوى خلال 4 ساعات." : "Contact us through the support page and your request will be handled with top priority within 4 hours.",
    },
  ];

  const resources = [
    { icon: BookOpen, label: isAr ? "دليل المسابقات المهنية" : "Professional Competitions Guide", href: "/knowledge" },
    { icon: GraduationCap, label: isAr ? "دورات حصرية للمحترفين" : "Exclusive Pro Courses", href: "/masterclasses" },
    { icon: Trophy, label: isAr ? "معايير التحكيم الدولية" : "International Judging Standards", href: "/knowledge" },
    { icon: Target, label: isAr ? "خطة التطوير المهني" : "Career Development Plan", href: "/knowledge" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Badge Card */}
      <Card className="overflow-hidden border-primary/20 relative">
        <div className="pointer-events-none absolute -end-20 -top-20 h-56 w-56 rounded-full bg-primary/8 blur-[80px]" />
        <div className="pointer-events-none absolute -start-16 -bottom-16 h-44 w-44 rounded-full bg-accent/10 blur-[60px]" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <CardContent className="relative p-5 sm:p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${tierBg} ring-4 ring-primary/5`}>
              <TierIcon className={`h-7 w-7 ${tierColor}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-serif text-xl font-bold">{isAr ? "عضوية" : ""} {tierLabel} {!isAr ? "Membership" : ""}</h2>
                {profile?.is_verified && <VerifiedBadge level={profile.verification_level} size="lg" />}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isAr ? `مرحباً ${profile?.full_name_ar || profile?.full_name || ""}` : `Welcome, ${profile?.full_name || ""}`}
              </p>
            </div>
          </div>

          {/* Dates & Days Left */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border bg-card/80 p-3 text-center">
              <Calendar className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground">{isAr ? "تاريخ البدء" : "Start Date"}</p>
              <p className="text-xs font-semibold mt-0.5">{startedAt ? format(new Date(startedAt), "d MMM yyyy", { locale: isAr ? ar : undefined }) : "—"}</p>
            </div>
            <div className="rounded-xl border bg-card/80 p-3 text-center">
              <Clock className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground">{isAr ? "تاريخ الانتهاء" : "End Date"}</p>
              <p className="text-xs font-semibold mt-0.5">{expiresAt ? format(new Date(expiresAt), "d MMM yyyy", { locale: isAr ? ar : undefined }) : "∞"}</p>
            </div>
            <div className="rounded-xl border bg-card/80 p-3 text-center">
              <TrendingUp className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground">{isAr ? "أيام متبقية" : "Days Left"}</p>
              <p className={`text-xs font-bold mt-0.5 ${daysLeft !== null && daysLeft < 30 ? "text-destructive" : tierColor}`}>{daysLeft ?? "∞"}</p>
            </div>
            <div className="rounded-xl border bg-card/80 p-3 text-center">
              <Star className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground">{isAr ? "نقاط الولاء" : "Loyalty Points"}</p>
              <p className="text-xs font-bold mt-0.5 text-primary">{loyaltyPoints}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comprehensive Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-primary" />
            {isAr ? "إحصائيات شاملة" : "Comprehensive Statistics"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Trophy, label: isAr ? "مسابقات" : "Competitions", value: stats?.competitions || 0, color: "text-primary", bg: "bg-primary/10" },
              { icon: Award, label: isAr ? "شهادات" : "Certificates", value: stats?.certificates || 0, color: "text-chart-3", bg: "bg-chart-3/10" },
              { icon: Star, label: isAr ? "شارات" : "Badges", value: stats?.badges || 0, color: "text-chart-4", bg: "bg-chart-4/10" },
              { icon: GraduationCap, label: isAr ? "دورات" : "Courses", value: stats?.masterclasses || 0, color: "text-chart-5", bg: "bg-chart-5/10" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border p-3 text-center transition-all hover:shadow-sm">
                <div className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${s.bg}`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border p-3 text-center">
              <Eye className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
              <p className="text-lg font-bold">{loyaltyPoints}</p>
              <p className="text-[10px] text-muted-foreground">{isAr ? "زيارات الملف" : "Profile Views"}</p>
            </div>
            <div className="rounded-xl border p-3 text-center">
              <UserCheck className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
              <p className="text-lg font-bold">—</p>
              <p className="text-[10px] text-muted-foreground">{isAr ? "إجمالي المتابعين" : "Total Followers"}</p>
            </div>
            <div className="rounded-xl border p-3 text-center">
              <Sparkles className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
              <p className="text-lg font-bold">—</p>
              <p className="text-[10px] text-muted-foreground">{isAr ? "التوصيات" : "Recommendations"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Career & Professional Record */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-4 w-4 text-primary" />
              {isAr ? "السجل المهني والوظيفي" : "Career & Professional Record"}
            </CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link to="/profile" onClick={() => {}}>{isAr ? "إدارة" : "Manage"}</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {careerRecords && careerRecords.length > 0 ? (
            <div className="space-y-3">
              {careerRecords.map((record: any) => (
                <div key={record.id} className="flex items-start gap-3 rounded-lg border p-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${record.record_type === "education" ? "bg-chart-3/10" : "bg-primary/10"}`}>
                    {record.record_type === "education" ? (
                      <GraduationCap className="h-4 w-4 text-chart-3" />
                    ) : (
                      <Briefcase className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{isAr ? (record.title_ar || record.title) : record.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{isAr ? (record.organization_ar || record.organization) : record.organization}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {record.start_date ? format(new Date(record.start_date), "MMM yyyy", { locale: isAr ? ar : undefined }) : ""} 
                      {record.end_date ? ` – ${format(new Date(record.end_date), "MMM yyyy", { locale: isAr ? ar : undefined })}` : (record.is_current ? (isAr ? " – حالياً" : " – Present") : "")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">{isAr ? "لا توجد سجلات مهنية بعد" : "No career records yet"}</p>
          )}
        </CardContent>
      </Card>

      {/* Active Benefits */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="h-4 w-4 text-primary" />
            {isAr ? "مزايا عضويتك" : "Your Membership Benefits"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {benefits.map((b) => (
              <div key={b.label} className={`flex items-center gap-2.5 rounded-lg border p-2.5 transition-all ${b.active ? "bg-card" : "opacity-50 bg-muted/30"}`}>
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${b.active ? tierBg : "bg-muted"}`}>
                  <b.icon className={`h-3.5 w-3.5 ${b.active ? tierColor : "text-muted-foreground"}`} />
                </div>
                <span className="text-xs font-medium">{b.label}</span>
                {b.active && <Badge variant="secondary" className="ms-auto text-[9px] px-1.5 py-0">{isAr ? "مفعّل" : "Active"}</Badge>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Helpful Resources */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-primary" />
            {isAr ? "موارد مفيدة" : "Helpful Resources"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {resources.map((r) => (
              <Link key={r.label} to={r.href} className="flex items-center gap-3 rounded-lg border p-3 transition-all hover:shadow-sm hover:border-primary/20 group">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tierBg}`}>
                  <r.icon className={`h-4 w-4 ${tierColor}`} />
                </div>
                <span className="text-sm font-medium flex-1">{r.label}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Button variant="outline" className="h-auto py-3 flex-col gap-1.5" asChild>
          <Link to="/support-tickets">
            <Headphones className="h-5 w-5 text-primary" />
            <span className="text-xs">{isAr ? "دعم فني ذو أولوية" : "Priority Support"}</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-3 flex-col gap-1.5" asChild>
          <Link to="/messages">
            <MessageSquare className="h-5 w-5 text-primary" />
            <span className="text-xs">{isAr ? "تواصل مع المحترفين" : "Message Pros"}</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-3 flex-col gap-1.5" asChild>
          <Link to="/notifications">
            <Bell className="h-5 w-5 text-primary" />
            <span className="text-xs">{isAr ? "إعدادات الإشعارات" : "Notification Settings"}</span>
          </Link>
        </Button>
      </div>

      {/* FAQ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <HelpCircle className="h-4 w-4 text-primary" />
            {isAr ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {faqs.map((faq, i) => (
            <Collapsible key={i}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-3 text-start text-sm font-medium hover:bg-accent/30 transition-colors group">
                {faq.q}
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-3 pb-3 pt-1 text-sm text-muted-foreground">
                {faq.a}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
