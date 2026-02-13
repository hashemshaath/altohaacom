import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Crown, Star, Shield, Check, ArrowUpCircle, Calendar, AlertTriangle,
  RefreshCw, Clock, Loader2, Printer, RotateCw, Eye, EyeOff,
  Award, Gift, ChevronDown, HelpCircle, Headphones, Zap, Users,
  Globe, Newspaper, ShoppingBag, BarChart3, MessageSquare, BookOpen, Percent, Bell,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useVerificationStatus } from "@/hooks/useVerification";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";

interface UnifiedMembershipTabProps {
  profile: any;
  userId: string;
  onMembershipChange?: () => void;
}

export function UnifiedMembershipTab({ profile, userId, onMembershipChange }: UnifiedMembershipTabProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: verificationStatus } = useVerificationStatus();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const cardRef = useRef<HTMLDivElement>(null);
  const [showCode, setShowCode] = useState(false);
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">("horizontal");

  // Fetch membership card
  const { data: card, isLoading: cardLoading } = useQuery({
    queryKey: ["membership-card", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_cards")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch membership history
  const { data: history } = useQuery({
    queryKey: ["membership-history", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("membership_history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  // Upgrade mutation
  const upgradeMutation = useMutation({
    mutationFn: async (newTier: "basic" | "professional" | "enterprise") => {
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      const prevTier = (profile?.membership_tier || "basic") as "basic" | "professional" | "enterprise";

      await supabase.from("membership_history").insert([{
        user_id: userId,
        previous_tier: prevTier,
        new_tier: newTier,
      }]);

      const { error } = await supabase
        .from("profiles")
        .update({
          membership_tier: newTier,
          membership_status: "active",
          membership_expires_at: expiresAt.toISOString(),
        })
        .eq("user_id", userId);
      if (error) throw error;
      return newTier;
    },
    onSuccess: (newTier) => {
      queryClient.invalidateQueries({ queryKey: ["membership-history", userId] });
      onMembershipChange?.();
      toast({
        title: isAr ? "تم تحديث العضوية!" : "Membership updated!",
        description: isAr
          ? `تم ترقية عضويتك إلى ${newTier === "professional" ? "احترافي" : newTier === "enterprise" ? "مؤسسي" : "أساسي"}`
          : `Your membership has been changed to ${newTier}`,
      });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const toggleOrientation = async () => {
    const newOr = orientation === "horizontal" ? "vertical" : "horizontal";
    setOrientation(newOr);
    if (card) {
      await supabase.from("membership_cards").update({ card_orientation: newOr }).eq("id", card.id);
    }
  };

  const handlePrint = () => {
    if (!cardRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html dir="${isAr ? "rtl" : "ltr"}"><head><title>${isAr ? "بطاقة العضوية" : "Membership Card"}</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5;font-family:system-ui,sans-serif;}@media print{body{background:white;}}</style></head><body>${cardRef.current.outerHTML}</body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };

  const currentTier = profile?.membership_tier || "basic";
  const expiresAt = profile?.membership_expires_at;
  const isExpired = expiresAt && new Date(expiresAt) < new Date();
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;
  const isPro = currentTier === "professional" || currentTier === "enterprise";
  const isEnterprise = currentTier === "enterprise";
  const TierIcon = isEnterprise ? Shield : currentTier === "professional" ? Crown : Star;
  const tierName = isEnterprise ? (isAr ? "مؤسسي" : "Enterprise") : currentTier === "professional" ? (isAr ? "احترافي" : "Professional") : (isAr ? "أساسي" : "Basic");
  const tierColor = isEnterprise ? "text-chart-2" : "text-primary";
  const tierBg = isEnterprise ? "bg-chart-2/10" : "bg-primary/10";
  const genderLabel = profile?.gender === "male" ? (isAr ? "ذكر" : "Male") : profile?.gender === "female" ? (isAr ? "أنثى" : "Female") : "";
  const isTrial = card?.is_trial && card?.trial_ends_at && new Date(card.trial_ends_at) > new Date();
  const shortCode = profile?.account_number ? profile.account_number.replace(/\D/g, "").slice(-4).padStart(4, "0") : "0000";
  const fullVerificationCode = card?.verification_code || "";
  const isVertical = orientation === "vertical";

  const profileCompletion = [
    profile?.full_name, profile?.bio, profile?.specialization || profile?.job_title,
    profile?.avatar_url, profile?.location || profile?.country_code, profile?.phone,
    profile?.instagram || profile?.twitter || profile?.linkedin,
  ].filter(Boolean).length;
  const completionPercent = Math.round((profileCompletion / 7) * 100);

  const tiers = [
    {
      id: "basic", icon: Star, name: isAr ? "أساسي" : "Basic", price: isAr ? "مجاني" : "Free", color: "border-border",
      features: isAr ? ["إنشاء ملف شخصي", "الانضمام للمجتمع", "متابعة الطهاة", "عرض المسابقات"] : ["Create profile", "Join community", "Follow chefs", "View competitions"],
    },
    {
      id: "professional", icon: Crown, name: isAr ? "احترافي" : "Professional", price: "SAR 19/" + (isAr ? "شهر" : "month"), color: "border-primary", featured: true,
      features: isAr
        ? ["جميع مميزات الأساسية", "شارة التوثيق", "دعم ذو أولوية", "إنشاء مجموعات خاصة", "تحليلات متقدمة", "وصول مبكر للمسابقات", "إضافة فعاليات"]
        : ["All Basic features", "Verified badge", "Priority support", "Create private groups", "Advanced analytics", "Early competition access", "Add events"],
    },
    {
      id: "enterprise", icon: Shield, name: isAr ? "مؤسسي" : "Enterprise", price: "SAR 99/" + (isAr ? "شهر" : "month"), color: "border-chart-2",
      features: isAr
        ? ["جميع مميزات الاحترافية", "علامة تجارية مخصصة", "وصول API", "مدير حساب مخصص", "أعضاء فريق غير محدودين", "تقارير مخصصة"]
        : ["All Professional features", "Custom branding", "API access", "Dedicated account manager", "Unlimited team members", "Custom reports"],
    },
  ];

  const benefits = [
    { icon: Award, label: isAr ? "شارة التوثيق المهني" : "Verified Professional Badge" },
    { icon: Headphones, label: isAr ? "دعم فني ذو أولوية" : "Priority Technical Support" },
    { icon: Zap, label: isAr ? "تسجيل أولوية في المسابقات" : "Priority Competition Registration" },
    { icon: Percent, label: isAr ? "خصومات على المسابقات والدورات" : "Discounts on Competitions & Courses" },
    { icon: Users, label: isAr ? "شبكة تواصل مع طهاة دوليين" : "Networking with International Chefs" },
    { icon: ShoppingBag, label: isAr ? "نقاط مضاعفة عند الشراء" : "Double Points on Store Purchases" },
    { icon: BarChart3, label: isAr ? "إحصائيات شاملة للملف" : "Comprehensive Profile Statistics" },
    { icon: MessageSquare, label: isAr ? "تواصل مباشر مع المحترفين" : "Direct Messaging with Pros" },
    { icon: BookOpen, label: isAr ? "موارد تعليمية حصرية" : "Exclusive Learning Resources" },
  ];

  const faqs = [
    { q: isAr ? "كيف أستفيد من التسجيل ذو الأولوية؟" : "How does priority registration work?", a: isAr ? "يتم فتح التسجيل لك قبل الأعضاء الأساسيين بـ 48 ساعة في جميع المسابقات والفعاليات." : "Registration opens 48 hours early for you across all competitions and events." },
    { q: isAr ? "كيف أحصل على نقاط مضاعفة؟" : "How do I earn double points?", a: isAr ? "كل عملية شراء من المتجر تمنحك نقاطاً مضاعفة تلقائياً طوال فترة عضويتك الاحترافية." : "Every store purchase automatically earns you double loyalty points during your Professional membership." },
    { q: isAr ? "هل يمكنني إلغاء العضوية؟" : "Can I cancel my membership?", a: isAr ? "نعم، يمكنك الإلغاء في أي وقت مع إمكانية الاسترداد خلال 14 يوم." : "Yes, cancel anytime with a 14-day refund window." },
  ];

  if (cardLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  return (
    <div className="space-y-6">
      {/* ═══════════ DIGITAL MEMBERSHIP CARD ═══════════ */}
      {card && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={toggleOrientation} className="gap-1.5">
              <RotateCw className="h-3.5 w-3.5" />
              {isAr ? (isVertical ? "أفقي" : "عمودي") : (isVertical ? "Horizontal" : "Vertical")}
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
              <Printer className="h-3.5 w-3.5" />
              {isAr ? "طباعة" : "Print"}
            </Button>
            {isTrial && <Badge className="bg-chart-4/15 text-chart-4 border-chart-4/20">{isAr ? "فترة تجريبية - 90 يوم" : "90-Day Free Trial"}</Badge>}
            {isExpired && <Badge variant="destructive">{isAr ? "منتهية" : "Expired"}</Badge>}
          </div>

          <div
            ref={cardRef}
            className={`relative overflow-hidden rounded-2xl shadow-2xl ${isVertical ? "max-w-[320px] mx-auto" : "w-full max-w-[560px]"}`}
            style={{ background: "linear-gradient(135deg, hsl(36, 20%, 12%) 0%, hsl(36, 25%, 16%) 40%, hsl(36, 30%, 20%) 100%)", aspectRatio: isVertical ? "9/16" : undefined, minHeight: isVertical ? undefined : "220px" }}
          >
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-0 right-0 w-1/2 h-full opacity-10" style={{ background: "linear-gradient(180deg, #d4af37 0%, transparent 100%)" }} />
              <div className="absolute bottom-0 left-0 w-full h-px" style={{ background: "linear-gradient(90deg, transparent, #d4af37, transparent)" }} />
              <div className="absolute top-0 left-0 w-full h-px" style={{ background: "linear-gradient(90deg, transparent, #d4af37, transparent)" }} />
            </div>
            <div className={`relative h-full p-5 flex flex-col justify-between`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <img src="/altohaa-logo.png" alt="Altohaa" className="h-8 w-8 rounded-lg object-contain" style={{ filter: "brightness(1.5)" }} />
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-medium" style={{ color: "#d4af37" }}>{isAr ? "بطاقة العضوية" : "MEMBERSHIP CARD"}</p>
                    <p className="text-[8px] text-gray-400">{isAr ? "منصة ألطهاء" : "Altohaa Platform"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: "rgba(212, 175, 55, 0.15)", border: "1px solid rgba(212, 175, 55, 0.3)" }}>
                  <TierIcon className="h-3.5 w-3.5" style={{ color: "#d4af37" }} />
                  <span className="text-[10px] font-semibold" style={{ color: "#d4af37" }}>{tierName}</span>
                </div>
              </div>
              <div className={isVertical ? "flex-1 flex flex-col justify-center space-y-4" : "space-y-3"}>
                <div>
                  <p className="text-white font-bold text-lg leading-tight">{isAr ? (profile?.full_name_ar || profile?.full_name || "—") : (profile?.full_name || "—")}</p>
                  {isAr && profile?.full_name && <p className="text-gray-400 text-xs mt-0.5">{profile.full_name}</p>}
                  {!isAr && profile?.full_name_ar && <p className="text-gray-400 text-xs mt-0.5" dir="rtl">{profile.full_name_ar}</p>}
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-gray-500 mb-0.5">{isAr ? "رقم العضوية" : "MEMBERSHIP NO."}</p>
                  <p className="text-sm font-mono font-bold tracking-wider" style={{ color: "#d4af37" }}>{card.membership_number}</p>
                </div>
                <div className={`grid ${isVertical ? "grid-cols-2" : "grid-cols-4"} gap-2`}>
                  <div>
                    <p className="text-[8px] uppercase tracking-wider text-gray-500">{isAr ? "الانضمام" : "JOINED"}</p>
                    <p className="text-[11px] text-gray-300 font-medium">{format(new Date(card.issued_at), "dd/MM/yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-[8px] uppercase tracking-wider text-gray-500">{isAr ? "الانتهاء" : "EXPIRES"}</p>
                    <p className="text-[11px] text-gray-300 font-medium">{format(new Date(card.expires_at), "dd/MM/yyyy")}</p>
                  </div>
                  {genderLabel && (
                    <div>
                      <p className="text-[8px] uppercase tracking-wider text-gray-500">{isAr ? "الجنس" : "GENDER"}</p>
                      <p className="text-[11px] text-gray-300 font-medium">{genderLabel}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[8px] uppercase tracking-wider text-gray-500">{isAr ? "رقم الحساب" : "ACCOUNT"}</p>
                    <p className="text-[11px] text-gray-300 font-medium">{profile?.account_number || "—"}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-end justify-between flex-wrap gap-2">
                <div>
                  <p className="text-[8px] uppercase tracking-wider text-gray-500 mb-1">{isAr ? "كود التحقق" : "VERIFICATION CODE"}</p>
                  <div className="flex items-center gap-1.5">
                    {shortCode.split("").map((d, i) => (
                      <span key={i} className="inline-flex h-8 w-7 sm:h-9 sm:w-8 items-center justify-center rounded-md border font-mono text-sm sm:text-base font-bold" style={{ borderColor: "rgba(212,175,55,0.3)", background: "rgba(212,175,55,0.1)", color: "#d4af37" }}>
                        {showCode ? d : "•"}
                      </span>
                    ))}
                    <button onClick={() => setShowCode(!showCode)} className="ms-1 text-gray-500 hover:text-gray-300 transition-colors p-1">
                      {showCode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-block rounded-md px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${card.card_status === "active" ? "bg-emerald-500/20 text-emerald-400" : card.card_status === "suspended" ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"}`}>
                    {card.card_status === "active" ? (isAr ? "نشطة" : "ACTIVE") : card.card_status === "suspended" ? (isAr ? "معلقة" : "SUSPENDED") : (isAr ? "منتهية" : "EXPIRED")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ MEMBERSHIP STATUS ═══════════ */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-background to-accent/5 p-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <TierIcon className="h-5 w-5 text-primary" />
                {isAr ? "حالة العضوية" : "Membership Status"}
              </CardTitle>
              <Badge className={currentTier === "professional" ? "bg-primary/20 text-primary" : currentTier === "enterprise" ? "bg-chart-2/20 text-chart-2" : "bg-muted text-muted-foreground"}>
                {tierName}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border bg-card p-3 text-center">
                <Calendar className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{isAr ? "الحالة" : "Status"}</p>
                <Badge variant={isExpired ? "destructive" : "default"} className="mt-1">
                  {isExpired ? (isAr ? "منتهية" : "Expired") : (isAr ? "نشطة" : "Active")}
                </Badge>
              </div>
              <div className="rounded-lg border bg-card p-3 text-center">
                <Clock className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{isAr ? "تنتهي في" : "Expires"}</p>
                <p className="mt-1 text-sm font-semibold">{expiresAt ? format(new Date(expiresAt), "d MMM yyyy", { locale: isAr ? ar : undefined }) : (isAr ? "غير محدد" : "N/A")}</p>
              </div>
              <div className="rounded-lg border bg-card p-3 text-center">
                <AlertTriangle className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{isAr ? "أيام متبقية" : "Days Left"}</p>
                <p className={`mt-1 text-sm font-bold ${daysLeft !== null && daysLeft < 30 ? "text-destructive" : ""}`}>{daysLeft !== null ? daysLeft : "∞"}</p>
              </div>
            </div>

            {/* Profile Completion */}
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium">{isAr ? "اكتمال الملف الشخصي" : "Profile Completion"}</p>
                <span className="text-xs font-bold text-primary">{completionPercent}%</span>
              </div>
              <Progress value={completionPercent} className="h-2" />
            </div>

            {/* Verification */}
            <div className="rounded-lg border p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{isAr ? "حالة التوثيق" : "Verification Status"}</p>
                <p className="text-xs text-muted-foreground">
                  {verificationStatus?.is_verified ? (isAr ? "حسابك موثق ✓" : "Your account is verified ✓") : (isAr ? "حسابك غير موثق" : "Not verified")}
                </p>
              </div>
              {!verificationStatus?.is_verified && (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/verify">{isAr ? "توثيق" : "Verify"}</Link>
                </Button>
              )}
            </div>

            {isExpired && (
              <Button className="w-full gap-2" onClick={() => upgradeMutation.mutate((currentTier || "basic") as "basic" | "professional" | "enterprise")} disabled={upgradeMutation.isPending}>
                {upgradeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {isAr ? "تجديد العضوية" : "Renew Membership"}
              </Button>
            )}
          </CardContent>
        </div>
      </Card>

      {/* ═══════════ PRO BENEFITS (if pro) ═══════════ */}
      {isPro && (
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
                <div key={b.label} className="flex items-center gap-2.5 rounded-lg border p-2.5 bg-card">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${tierBg}`}>
                    <b.icon className={`h-3.5 w-3.5 ${tierColor}`} />
                  </div>
                  <span className="text-xs font-medium">{b.label}</span>
                  <Badge variant="secondary" className="ms-auto text-[9px] px-1.5 py-0">{isAr ? "مفعّل" : "Active"}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════ AVAILABLE PLANS ═══════════ */}
      <div>
        <h3 className="mb-4 font-semibold">{isAr ? "الخطط المتاحة" : "Available Plans"}</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {tiers.map((tier) => {
            const isCurrentTier = tier.id === currentTier;
            return (
              <Card key={tier.id} className={`relative transition-all ${tier.featured ? "ring-2 ring-primary shadow-lg" : ""} ${isCurrentTier ? "bg-primary/5" : ""}`}>
                {tier.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary"><Star className="me-1 h-3 w-3" />{isAr ? "الأكثر شعبية" : "Popular"}</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <tier.icon className={`mx-auto h-8 w-8 mb-2 ${tier.id === "enterprise" ? "text-chart-2" : "text-primary"}`} />
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                  <p className="text-2xl font-bold">{tier.price}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{f}</li>
                    ))}
                  </ul>
                  {isCurrentTier ? (
                    <Button variant="outline" disabled className="w-full">{isAr ? "خطتك الحالية" : "Current Plan"}</Button>
                  ) : (
                    <Button
                      variant={tier.featured ? "default" : "outline"}
                      className="w-full gap-1.5"
                      disabled={upgradeMutation.isPending}
                      onClick={() => upgradeMutation.mutate(tier.id as "basic" | "professional" | "enterprise")}
                    >
                      {upgradeMutation.isPending && upgradeMutation.variables === tier.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpCircle className="h-4 w-4" />}
                      {isAr ? (tier.id === "basic" ? "تخفيض" : "ترقية") : (tier.id === "basic" ? "Downgrade" : "Upgrade")}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ═══════════ HISTORY ═══════════ */}
      {history && history.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{isAr ? "سجل العضوية" : "Membership History"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((h: any) => (
                <div key={h.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <div>
                    <span className="font-medium">{h.previous_tier || "—"}</span>
                    <span className="mx-2 text-muted-foreground">→</span>
                    <span className="font-medium text-primary">{h.new_tier}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{format(new Date(h.created_at), "d MMM yyyy", { locale: isAr ? ar : undefined })}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════ FAQ ═══════════ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <HelpCircle className="h-4 w-4 text-primary" />
            {isAr ? "الأسئلة الشائعة" : "FAQ"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {faqs.map((faq, i) => (
            <Collapsible key={i}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-3 text-start text-sm font-medium hover:bg-accent/30 transition-colors group">
                {faq.q}
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-3 pb-3 pt-1 text-sm text-muted-foreground">{faq.a}</CollapsibleContent>
            </Collapsible>
          ))}
        </CardContent>
      </Card>

      {/* ═══════════ TERMS ═══════════ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{isAr ? "شروط العضوية" : "Membership Terms"}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• {isAr ? "يتم تجديد العضوية تلقائياً ما لم يتم إلغاؤها" : "Memberships auto-renew unless cancelled"}</p>
          <p>• {isAr ? "يمكن الإلغاء في أي وقت مع إمكانية الاسترداد خلال 14 يوم" : "Cancel anytime with 14-day refund window"}</p>
          <p>• {isAr ? "الترقية تبدأ فوراً والتخفيض يبدأ في الدورة التالية" : "Upgrades take effect immediately; downgrades at next cycle"}</p>
          <p>• {isAr ? "العضوية المؤسسية تتطلب حساب شركة موثق" : "Enterprise requires verified company account"}</p>
          <p>• {isAr ? "فترة تجريبية مجانية 90 يوم عند التسجيل" : "90-day free trial upon registration"}</p>
        </CardContent>
      </Card>
    </div>
  );
}
