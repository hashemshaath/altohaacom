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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Crown, Star, Shield, Check, ArrowUpCircle, Calendar, AlertTriangle,
  RefreshCw, Clock, Loader2, Printer, RotateCw, Eye, EyeOff,
  Award, Gift, ChevronDown, HelpCircle, Headphones, Zap, Users,
  Globe, Newspaper, ShoppingBag, BarChart3, MessageSquare, BookOpen, Percent, Bell,
  Download, XCircle, Sparkles, TrendingUp,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useVerificationStatus } from "@/hooks/useVerification";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";
import { BenefitsUsageTracker } from "./BenefitsUsageTracker";
import { MembershipHistory } from "./MembershipHistory";
import { SubscriptionDetailsCard } from "./SubscriptionDetailsCard";
import { MembershipInvoicesSection } from "./MembershipInvoicesSection";

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
  const [cardTheme, setCardTheme] = useState<"glassy" | "classic">("classic");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonType, setCancelReasonType] = useState("too_expensive");
  const [cancelFeedback, setCancelFeedback] = useState("");

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

  // Upgrade/Downgrade/Renew mutation
  const upgradeMutation = useMutation({
    mutationFn: async (newTier: "basic" | "professional" | "enterprise") => {
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      const prevTier = (profile?.membership_tier || "basic") as "basic" | "professional" | "enterprise";

      const tierOrder: Record<string, number> = { basic: 0, professional: 1, enterprise: 2 };
      const tierPrices: Record<string, number> = { basic: 0, professional: 19, enterprise: 99 };
      const isDowngrade = tierOrder[newTier] < tierOrder[prevTier];

      // Calculate prorated credit for downgrades
      let proratedCredit = 0;
      if (isDowngrade && profile?.membership_expires_at) {
        const expiry = new Date(profile.membership_expires_at);
        const totalDays = 365;
        const remainingDays = Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        const dailyRate = (tierPrices[prevTier] * 12) / totalDays;
        const newDailyRate = (tierPrices[newTier] * 12) / totalDays;
        proratedCredit = Math.round((dailyRate - newDailyRate) * remainingDays * 100) / 100;
      }

      await supabase.from("membership_history").insert([{
        user_id: userId,
        previous_tier: prevTier,
        new_tier: newTier,
        reason: isDowngrade
          ? `Downgrade with prorated credit: ${proratedCredit} SAR`
          : (newTier === prevTier ? "Renewal" : "Upgrade"),
      }]);

      const { error } = await supabase
        .from("profiles")
        .update({
          membership_tier: newTier,
          membership_status: newTier === "basic" ? "active" : "active",
          membership_started_at: isDowngrade ? profile?.membership_started_at : now.toISOString(),
          membership_expires_at: expiresAt.toISOString(),
        })
        .eq("user_id", userId);
      if (error) throw error;

      if (card) {
        await supabase.from("membership_cards").update({
          expires_at: expiresAt.toISOString(),
          is_trial: false,
          card_status: "active",
        }).eq("id", card.id);
      }

      // If downgrade with credit, add to wallet
      if (isDowngrade && proratedCredit > 0) {
        const { data: wallet } = await supabase
          .from("user_wallets")
          .select("id, balance")
          .eq("user_id", userId)
          .maybeSingle();
        if (wallet) {
          await supabase.from("user_wallets").update({
            balance: (wallet.balance || 0) + proratedCredit,
          }).eq("id", wallet.id);
          await supabase.from("wallet_transactions").insert([{
            wallet_id: wallet.id,
            transaction_number: "",
            type: "credit",
            amount: proratedCredit,
            currency: "SAR",
            description: `Prorated credit from ${prevTier} → ${newTier} downgrade`,
            description_ar: `رصيد تناسبي من تخفيض ${prevTier} → ${newTier}`,
            status: "completed",
          }]);
        }
      }

      return { newTier, isDowngrade, proratedCredit };
    },
    onSuccess: ({ newTier, isDowngrade, proratedCredit }) => {
      queryClient.invalidateQueries({ queryKey: ["membership-history", userId] });
      queryClient.invalidateQueries({ queryKey: ["membership-card", userId] });
      queryClient.invalidateQueries({ queryKey: ["membership-card-sub", userId] });
      onMembershipChange?.();
      toast({
        title: isAr
          ? (isDowngrade ? "تم تخفيض العضوية" : "تم تحديث العضوية!")
          : (isDowngrade ? "Membership downgraded" : "Membership updated!"),
        description: isDowngrade && proratedCredit > 0
          ? (isAr ? `تم إضافة ${proratedCredit} ر.س كرصيد تناسبي لمحفظتك` : `${proratedCredit} SAR prorated credit added to your wallet`)
          : (isAr
            ? `تم تغيير عضويتك إلى ${newTier === "professional" ? "احترافية" : newTier === "enterprise" ? "مؤسسية" : "أساسية"}`
            : `Your membership has been changed to ${newTier}`),
      });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  // Cancel membership mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const reasonLabels: Record<string, { en: string; ar: string }> = {
        too_expensive: { en: "Too expensive", ar: "مكلفة جداً" },
        not_using: { en: "Not using enough", ar: "لا أستخدمها بشكل كافٍ" },
        missing_features: { en: "Missing features", ar: "ميزات ناقصة" },
        switching: { en: "Switching to competitor", ar: "الانتقال لمنافس" },
        other: { en: "Other", ar: "أخرى" },
      };
      const reasonLabel = reasonLabels[cancelReasonType] || reasonLabels.other;

      const { error } = await supabase.from("membership_cancellation_requests").insert({
        user_id: userId,
        current_tier: profile?.membership_tier || "basic",
        reason: cancelReasonType === "other" ? cancelReason : reasonLabel.en,
        reason_ar: cancelReasonType === "other" ? cancelReason : reasonLabel.ar,
        feedback: cancelFeedback || null,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: isAr ? "تم إرسال طلب الإلغاء" : "Cancellation request submitted",
        description: isAr ? "سيتم مراجعة طلبك من قبل فريق الدعم" : "Our team will review your request shortly",
      });
      setShowCancelDialog(false);
      setCancelReason("");
      setCancelFeedback("");
      setCancelReasonType("too_expensive");
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

  const renderCardCanvas = async (scale: number) => {
    if (!cardRef.current) return null;

    const html2canvas = (await import("html2canvas")).default;

    // Ensure web fonts (especially Arabic) are fully ready before rasterizing
    if ("fonts" in document) {
      await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
    }

    const bounds = cardRef.current.getBoundingClientRect();

    return html2canvas(cardRef.current, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
      width: Math.round(bounds.width),
      height: Math.round(bounds.height),
      windowWidth: Math.ceil(bounds.width),
      windowHeight: Math.ceil(bounds.height),
    });
  };

  const handlePrint = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await renderCardCanvas(4);
      if (!canvas) return;

      const isVert = orientation === "vertical";
      // ISO/IEC 7810 ID-1: 85.6mm × 53.98mm
      const cardW = isVert ? "53.98mm" : "85.6mm";
      const cardH = isVert ? "85.6mm" : "53.98mm";

      const imgDataUrl = canvas.toDataURL("image/png");
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      printWindow.document.write(`<!DOCTYPE html><html dir="${isAr ? "rtl" : "ltr"}"><head>
        <meta charset="utf-8" />
        <title>${isAr ? "بطاقة العضوية" : "Membership Card"}</title>
        <style>
          *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
          html, body {
            width: ${cardW};
            height: ${cardH};
            overflow: hidden;
            background: transparent;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body { display: block; }
          .card-img {
            display: block;
            width: ${cardW};
            height: ${cardH};
            object-fit: cover;
          }
          @page {
            size: ${cardW} ${cardH};
            margin: 0;
          }
        </style>
      </head><body>
        <img class="card-img" src="${imgDataUrl}" alt="Membership Card" />
      </body></html>`);
      printWindow.document.close();

      const triggerPrint = () => {
        printWindow.focus();
        printWindow.print();
      };

      printWindow.onload = triggerPrint;
      setTimeout(triggerPrint, 500);
    } catch {
      toast({ variant: "destructive", title: isAr ? "خطأ في الطباعة" : "Print failed" });
    }
  };

  const handleSaveAsImage = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await renderCardCanvas(4);
      if (!canvas) return;

      const link = document.createElement("a");
      link.download = `altoha-membership-${profile?.account_number || "card"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast({ title: isAr ? "تم تحميل البطاقة" : "Card downloaded" });
    } catch {
      toast({ variant: "destructive", title: isAr ? "خطأ في التحميل" : "Download failed" });
    }
  };

  const currentTier = profile?.membership_tier || "basic";
  const expiresAt = profile?.membership_expires_at;
  const isExpired = expiresAt && new Date(expiresAt) < new Date();
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;
  const isPro = currentTier === "professional" || currentTier === "enterprise";
  const isEnterprise = currentTier === "enterprise";
  const TierIcon = isEnterprise ? Shield : currentTier === "professional" ? Crown : Star;
  const tierName = isEnterprise ? (isAr ? "مؤسسية" : "Enterprise") : currentTier === "professional" ? (isAr ? "احترافية" : "Professional") : (isAr ? "أساسية" : "Basic");
  const tierColor = isEnterprise ? "text-chart-2" : "text-primary";
  const tierBg = isEnterprise ? "bg-chart-2/10" : "bg-primary/10";
  const isTrial = card?.is_trial && card?.trial_ends_at && new Date(card.trial_ends_at) > new Date();
  const verificationCode = card?.verification_code ? card.verification_code.slice(0, 4).toUpperCase() : "0000";
  const isVertical = orientation === "vertical";

  const cardExpiresAt = isTrial ? card?.trial_ends_at : (expiresAt || card?.expires_at);
  const cardExpiresDate = cardExpiresAt ? new Date(cardExpiresAt) : null;
  const cardDaysLeft = cardExpiresDate ? Math.max(0, Math.ceil((cardExpiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;
  const isCardExpired = cardExpiresDate ? cardExpiresDate < new Date() : false;
  const showExpiryWarning = cardDaysLeft !== null && cardDaysLeft <= 14 && !isCardExpired;

  const profileCompletion = [
    profile?.full_name, profile?.bio, profile?.specialization || profile?.job_title,
    profile?.avatar_url, profile?.location || profile?.country_code, profile?.phone,
    profile?.instagram || profile?.twitter || profile?.linkedin,
  ].filter(Boolean).length;
  const completionPercent = Math.round((profileCompletion / 7) * 100);

  const tiers = [
    {
      id: "basic", icon: Star, name: isAr ? "أساسية" : "Basic", price: isAr ? "مجاني" : "Free", color: "border-border",
      yearlyPrice: null, savings: null,
      features: isAr ? ["إنشاء ملف شخصي", "الانضمام للمجتمع", "متابعة الطهاة", "عرض المسابقات"] : ["Create profile", "Join community", "Follow chefs", "View competitions"],
    },
    {
      id: "professional", icon: Crown, name: isAr ? "احترافية" : "Professional",
      price: "SAR 19/" + (isAr ? "شهر" : "month"),
      yearlyPrice: "SAR 190/" + (isAr ? "سنة" : "year"),
      savings: isAr ? "وفر 38 ر.س" : "Save SAR 38",
      color: "border-primary", featured: true,
      features: isAr
        ? ["جميع مميزات الأساسية", "شارة التوثيق", "دعم ذو أولوية", "إنشاء مجموعات خاصة", "تحليلات متقدمة", "وصول مبكر للمسابقات", "إضافة فعاليات"]
        : ["All Basic features", "Verified badge", "Priority support", "Create private groups", "Advanced analytics", "Early competition access", "Add events"],
    },
    {
      id: "enterprise", icon: Shield, name: isAr ? "مؤسسي" : "Enterprise",
      price: "SAR 99/" + (isAr ? "شهر" : "month"),
      yearlyPrice: "SAR 990/" + (isAr ? "سنة" : "year"),
      savings: isAr ? "وفر 198 ر.س" : "Save SAR 198",
      color: "border-chart-2",
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
    { q: isAr ? "ماذا يحدث عند انتهاء الفترة التجريبية؟" : "What happens when my trial ends?", a: isAr ? "سيتم تخفيض حسابك تلقائياً إلى المستوى الأساسي. يمكنك الترقية في أي وقت للاستمتاع بالمزايا الكاملة." : "Your account downgrades to Basic automatically. You can upgrade anytime to enjoy full benefits." },
  ];

  const cancelReasons = [
    { value: "too_expensive", label: isAr ? "مكلفة جداً" : "Too expensive" },
    { value: "not_using", label: isAr ? "لا أستخدمها بشكل كافٍ" : "Not using enough" },
    { value: "missing_features", label: isAr ? "ميزات ناقصة" : "Missing features I need" },
    { value: "switching", label: isAr ? "الانتقال لبديل آخر" : "Switching to another platform" },
    { value: "other", label: isAr ? "سبب آخر" : "Other reason" },
  ];

  if (cardLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  return (
    <div className="space-y-6">
      {/* ═══════════ TRIAL CONVERSION BANNER ═══════════ */}
      {isTrial && !isPro && (
        <Card className="border-2 border-primary/40 bg-gradient-to-r from-primary/5 via-background to-primary/5 overflow-hidden">
          <CardContent className="p-4 flex items-center gap-4 flex-wrap">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <p className="text-sm font-bold">
                {isAr ? "🎉 استمتع بفترتك التجريبية المجانية!" : "🎉 Enjoying your free trial!"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAr
                  ? `متبقي ${cardDaysLeft || 0} يوم — قم بالترقية الآن واحصل على خصم 20% على السنة الأولى`
                  : `${cardDaysLeft || 0} days remaining — Upgrade now & get 20% off your first year`}
              </p>
            </div>
            <Button size="sm" className="shrink-0 gap-1.5" onClick={() => upgradeMutation.mutate("professional")} disabled={upgradeMutation.isPending}>
              {upgradeMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TrendingUp className="h-3.5 w-3.5" />}
              {isAr ? "ترقية الآن" : "Upgrade Now"}
            </Button>
          </CardContent>
        </Card>
      )}

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
            <Button variant="outline" size="sm" onClick={handleSaveAsImage} className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              {isAr ? "حفظ" : "Save"}
            </Button>
            <div className="flex gap-1 ms-auto">
              <Button
                variant={cardTheme === "classic" ? "default" : "outline"}
                size="sm"
                onClick={() => setCardTheme("classic")}
                className="gap-1.5"
              >
                <Shield className="h-3.5 w-3.5" />
                {isAr ? "كلاسيكي" : "Classic"}
              </Button>
              <Button
                variant={cardTheme === "glassy" ? "default" : "outline"}
                size="sm"
                onClick={() => setCardTheme("glassy")}
                className="gap-1.5"
              >
                <Globe className="h-3.5 w-3.5" />
                {isAr ? "زجاجي" : "Glassy"}
              </Button>
            </div>
          </div>
          {isTrial && <Badge className="bg-chart-4/15 text-chart-4 border-chart-4/20">{isAr ? "فترة تجريبية - 90 يوم" : "90-Day Free Trial"}</Badge>}

          {/* ──── CARD ──── */}
          <div
            ref={cardRef}
            className={`relative overflow-hidden rounded-2xl shadow-2xl mx-auto select-none ${isVertical ? "max-w-[340px]" : "w-full max-w-[580px]"}`}
            style={{
              ...(cardTheme === "classic"
                ? { background: "linear-gradient(155deg, #1a1a2e 0%, #16213e 40%, #0f3460 80%, #1a1a2e 100%)" }
                : { background: "linear-gradient(155deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.7) 50%, rgba(245,240,228,0.8) 100%)", backdropFilter: "blur(20px)" }
              ),
              aspectRatio: isVertical ? "0.6306" : "1.586",
            }}
          >
            {/* Background patterns */}
            {cardTheme === "classic" ? (
              <>
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 1px, transparent 12px)" }} />
                <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, transparent 2%, #c9a84c 20%, #f5e6a3 50%, #c9a84c 80%, transparent 98%)" }} />
                <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, transparent 2%, #c9a84c 20%, #f5e6a3 50%, #c9a84c 80%, transparent 98%)" }} />
                <div className="absolute top-0 left-0 w-24 h-24 opacity-15" style={{ background: "radial-gradient(circle at 0 0, #c9a84c, transparent 70%)" }} />
                <div className="absolute bottom-0 right-0 w-32 h-32 opacity-10" style={{ background: "radial-gradient(circle at 100% 100%, #c9a84c, transparent 70%)" }} />
              </>
            ) : (
              <>
                <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, hsl(var(--primary)) 0.5px, transparent 0)", backgroundSize: "16px 16px" }} />
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5), transparent)" }} />
                <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5), transparent)" }} />
                <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full opacity-20" style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.3), transparent 70%)" }} />
                <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full opacity-15" style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.2), transparent 70%)" }} />
              </>
            )}

            <div className="relative h-full flex flex-col justify-between p-5 sm:p-6">
              {/* ── Top Row: Logo + Tier ── */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-11 w-11 sm:h-13 sm:w-13 rounded-xl overflow-hidden flex items-center justify-center"
                    style={cardTheme === "classic"
                      ? { background: "rgba(201,168,76,0.12)", border: "1.5px solid rgba(201,168,76,0.35)" }
                      : { background: "hsl(var(--primary) / 0.08)", border: "1.5px solid hsl(var(--primary) / 0.2)" }
                    }
                  >
                    <img src="/altoha-logo.png" alt="Altoha" className="h-9 w-9 sm:h-11 sm:w-11 object-contain" style={cardTheme === "classic" ? { filter: "brightness(1.8)" } : {}} />
                  </div>
                  <div>
                    <p
                      className={`text-xs sm:text-sm font-extrabold ${isAr ? "tracking-normal" : "uppercase tracking-[0.2em]"}`}
                      style={{ color: cardTheme === "classic" ? "#d4af5a" : "hsl(var(--primary))" }}
                    >
                      ALTOHA
                    </p>
                    <p
                      className={`text-[9px] sm:text-[10px] font-medium ${isAr ? "tracking-normal" : "uppercase tracking-[0.12em]"}`}
                      style={{ color: cardTheme === "classic" ? "rgba(201,168,76,0.6)" : "hsl(var(--muted-foreground) / 0.7)" }}
                    >
                      {isAr ? "بطاقة العضوية" : "MEMBERSHIP CARD"}
                    </p>
                  </div>
                </div>
                <div
                  className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5"
                  style={cardTheme === "classic"
                    ? { background: "linear-gradient(135deg, rgba(201,168,76,0.25), rgba(201,168,76,0.08))", border: "1px solid rgba(201,168,76,0.35)" }
                    : { background: "hsl(var(--primary) / 0.12)", border: "1px solid hsl(var(--primary) / 0.3)" }
                  }
                >
                  <TierIcon className="h-4 w-4" style={{ color: cardTheme === "classic" ? "#d4af5a" : "hsl(var(--primary))" }} />
                  <span className={`text-[11px] sm:text-xs font-bold ${isAr ? "tracking-normal leading-none" : "tracking-wide uppercase"}`} style={{ color: cardTheme === "classic" ? "#d4af5a" : "hsl(var(--primary))" }}>
                    {tierName}
                  </span>
                </div>
              </div>

              {/* ── Center: Avatar + Name + Details ── */}
              <div className={`flex-1 flex ${isVertical ? "flex-col items-center justify-center gap-3" : "items-center gap-5"} my-3`}>
                <div className="shrink-0 relative">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || ""}
                      className={`${isVertical ? "h-[90px] w-[90px]" : "h-[82px] w-[82px] sm:h-[92px] sm:w-[92px]"} rounded-xl object-cover`}
                      style={cardTheme === "classic"
                        ? { border: "3px solid rgba(201,168,76,0.55)", boxShadow: "0 6px 20px rgba(0,0,0,0.45)" }
                        : { border: "3px solid hsl(var(--primary) / 0.35)", boxShadow: "0 6px 20px hsl(var(--primary) / 0.15)" }
                      }
                    />
                  ) : (
                    <div
                      className={`${isVertical ? "h-[90px] w-[90px]" : "h-[82px] w-[82px] sm:h-[92px] sm:w-[92px]"} rounded-xl flex items-center justify-center`}
                      style={cardTheme === "classic"
                        ? { background: "linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.05))", border: "3px solid rgba(201,168,76,0.4)" }
                        : { background: "hsl(var(--primary) / 0.08)", border: "3px solid hsl(var(--primary) / 0.2)" }
                      }
                    >
                      <span className="text-4xl font-bold" style={{ color: cardTheme === "classic" ? "#d4af5a" : "hsl(var(--primary))" }}>{(profile?.full_name || "?")[0]}</span>
                    </div>
                  )}
                </div>

                <div className={`flex-1 min-w-0 ${isVertical ? "text-center" : isAr ? "text-right" : "text-left"}`}>
                  <p
                    className={`font-bold leading-tight break-words ${isVertical ? "text-center" : ""} ${isAr ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"}`}
                    style={{ color: cardTheme === "classic" ? "#f0f0f0" : "hsl(var(--foreground))" }}
                    dir={isAr ? "rtl" : "ltr"}
                  >
                    {isAr ? (profile?.full_name_ar || profile?.full_name || "—") : (profile?.full_name || "—")}
                  </p>
                  {((isAr && profile?.full_name) || (!isAr && profile?.full_name_ar)) && (
                    <p
                      className="text-xs mt-1 break-words leading-snug"
                      style={{ color: cardTheme === "classic" ? "rgba(255,255,255,0.55)" : "hsl(var(--muted-foreground) / 0.8)" }}
                      dir={!isAr ? "rtl" : "ltr"}
                    >
                      {isAr ? profile.full_name : profile.full_name_ar}
                    </p>
                  )}
                  <div className="mt-3">
                    <p
                      className={`text-[9px] font-medium ${isAr ? "tracking-normal" : "uppercase tracking-[0.18em]"}`}
                      style={{ color: cardTheme === "classic" ? "rgba(201,168,76,0.6)" : "hsl(var(--muted-foreground) / 0.65)" }}
                    >
                      {isAr ? "رقم العضوية" : "MEMBERSHIP NO."}
                    </p>
                    <p className="text-base sm:text-lg font-mono font-bold tracking-[0.15em]" style={{ color: cardTheme === "classic" ? "#d4af5a" : "hsl(var(--primary))" }}>{card.membership_number}</p>
                  </div>
                  <div className={`flex ${isVertical ? "justify-center" : ""} gap-5 sm:gap-7 mt-2`}>
                    <div>
                      <p
                        className={`text-[9px] font-medium ${isAr ? "tracking-normal" : "uppercase tracking-[0.12em]"}`}
                        style={{ color: cardTheme === "classic" ? "rgba(255,255,255,0.4)" : "hsl(var(--muted-foreground) / 0.55)" }}
                      >
                        {isAr ? "الانضمام" : "ISSUED"}
                      </p>
                      <p className="text-[11px] sm:text-xs font-semibold" style={{ color: cardTheme === "classic" ? "rgba(255,255,255,0.85)" : "hsl(var(--foreground) / 0.75)" }}>{format(new Date(card.issued_at), "MM/yy")}</p>
                    </div>
                    <div>
                      <p
                        className={`text-[9px] font-medium ${isAr ? "tracking-normal" : "uppercase tracking-[0.12em]"}`}
                        style={{ color: cardTheme === "classic" ? "rgba(255,255,255,0.4)" : "hsl(var(--muted-foreground) / 0.55)" }}
                      >
                        {isAr ? "الانتهاء" : "EXPIRES"}
                      </p>
                      <p className="text-[11px] sm:text-xs font-semibold" style={{ color: isCardExpired ? "#f87171" : showExpiryWarning ? "#fbbf24" : cardTheme === "classic" ? "rgba(255,255,255,0.85)" : "hsl(var(--foreground) / 0.75)" }}>
                        {cardExpiresDate ? format(cardExpiresDate, "dd/MM/yyyy") : "—"}
                      </p>
                      {cardDaysLeft !== null && cardDaysLeft <= 30 && !isCardExpired && (
                        <p className="text-[8px] font-bold mt-0.5" style={{ color: cardDaysLeft <= 14 ? "#f87171" : "#fbbf24" }}>
                          {cardDaysLeft} {isAr ? "يوم متبقي" : "days left"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Bottom: Verification Code + QR ── */}
              <div className="space-y-2.5">
                <div className="h-px" style={{ background: cardTheme === "classic" ? "linear-gradient(90deg, transparent, rgba(201,168,76,0.35), transparent)" : "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.3), transparent)" }} />
                <div className="flex items-end justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-medium me-1 ${isAr ? "tracking-normal" : "uppercase tracking-[0.15em]"}`}
                        style={{ color: cardTheme === "classic" ? "rgba(201,168,76,0.55)" : "hsl(var(--primary) / 0.55)" }}
                      >
                        {isAr ? "رمز التحقق" : "VERIFY CODE"}
                      </span>
                      {verificationCode.split("").map((d, i) => (
                        <span
                          key={i}
                          className="inline-flex h-7 w-6 sm:h-8 sm:w-7 items-center justify-center rounded font-mono text-sm sm:text-base font-bold"
                          style={cardTheme === "classic"
                            ? { background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: "#d4af5a" }
                            : { background: "hsl(var(--primary) / 0.1)", border: "1px solid hsl(var(--primary) / 0.25)", color: "hsl(var(--primary))" }
                          }
                        >
                          {showCode ? d : "•"}
                        </span>
                      ))}
                      <button onClick={() => setShowCode(!showCode)} className="ms-1 p-0.5 transition-colors" style={{ color: cardTheme === "classic" ? "rgba(255,255,255,0.45)" : "hsl(var(--muted-foreground) / 0.55)" }}>
                        {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] tracking-[0.15em]" style={{ color: cardTheme === "classic" ? "rgba(255,255,255,0.45)" : "hsl(var(--muted-foreground) / 0.55)" }}>{profile?.account_number || card.membership_number}</span>
                      <span
                        className={`ms-auto text-[9px] font-bold rounded-full px-3 py-1 whitespace-nowrap ${isAr ? "tracking-normal" : "uppercase tracking-wider"}`}
                        style={isCardExpired
                          ? { color: "#f87171", background: "rgba(248,113,113,0.15)" }
                          : card.card_status === "suspended"
                          ? { color: "#fbbf24", background: "rgba(251,191,36,0.15)" }
                          : { color: cardTheme === "classic" ? "#6ee7b7" : "hsl(142 71% 45%)", background: cardTheme === "classic" ? "rgba(52,211,153,0.15)" : "hsl(142 71% 45% / 0.12)" }
                        }
                      >
                        {isCardExpired ? (isAr ? "منتهية" : "EXPIRED") : card.card_status === "suspended" ? (isAr ? "معلقة" : "SUSPENDED") : (isAr ? "نشطة" : "ACTIVE")}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-center">
                    <div
                      className="rounded-xl p-2 sm:p-2.5"
                      style={cardTheme === "classic"
                        ? { background: "rgba(255,255,255,0.95)", boxShadow: "0 3px 14px rgba(0,0,0,0.35)" }
                        : { background: "hsl(var(--background))", border: "1.5px solid hsl(var(--border))", boxShadow: "0 3px 14px hsl(var(--primary) / 0.12)" }
                      }
                    >
                      <QRCodeSVG
                        value={`https://altoha.com/verify?code=${profile?.account_number || card.membership_number}`}
                        size={isVertical ? 60 : 58}
                        level="M"
                        includeMargin={false}
                        fgColor={cardTheme === "classic" ? "#1a1a2e" : "hsl(25, 30%, 12%)"}
                        bgColor="transparent"
                      />
                    </div>
                    <span
                      className={`text-[9px] font-medium mt-1.5 ${isAr ? "tracking-normal" : "tracking-widest uppercase"}`}
                      style={{ color: cardTheme === "classic" ? "rgba(201,168,76,0.55)" : "hsl(var(--primary) / 0.55)" }}
                    >
                      {isAr ? "امسح للتحقق" : "SCAN TO VERIFY"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ EXPIRY WARNING / RENEWAL INCENTIVE ═══════════ */}
      {(isCardExpired || showExpiryWarning) && (
        <Card className={`border-2 ${isCardExpired ? "border-destructive/50 bg-destructive/5" : "border-chart-4/50 bg-chart-4/5"}`}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isCardExpired ? "bg-destructive/15" : "bg-chart-4/15"}`}>
              {isCardExpired ? <AlertTriangle className="h-5 w-5 text-destructive" /> : <Bell className="h-5 w-5 text-chart-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">
                {isCardExpired
                  ? (isAr ? "انتهت صلاحية عضويتك" : "Your membership has expired")
                  : (isAr ? `تنتهي عضويتك خلال ${cardDaysLeft} يوم` : `Your membership expires in ${cardDaysLeft} days`)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isCardExpired
                  ? (isAr ? "سيتم تخفيض مستوى عضويتك إلى أساسي. جدد الآن للحفاظ على مزاياك!" : "Your tier will drop to Basic. Renew now to keep your benefits!")
                  : (isAr ? "جدد الآن واحصل على خصم 10% على السنة القادمة!" : "Renew now and get 10% off your next year!")}
              </p>
            </div>
            <Button size="sm" className="shrink-0 gap-1.5" onClick={() => upgradeMutation.mutate((currentTier || "professional") as any)} disabled={upgradeMutation.isPending}>
              {upgradeMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {isAr ? "تجديد" : "Renew"}
            </Button>
          </CardContent>
        </Card>
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
              <div className="rounded-xl border bg-card p-3 text-center">
                <Calendar className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{isAr ? "الحالة" : "Status"}</p>
                <Badge variant={isExpired ? "destructive" : "default"} className="mt-1">
                  {isExpired ? (isAr ? "منتهية" : "Expired") : (isAr ? "نشطة" : "Active")}
                </Badge>
              </div>
              <div className="rounded-xl border bg-card p-3 text-center">
                <Clock className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{isAr ? "تنتهي في" : "Expires"}</p>
                <p className="mt-1 text-sm font-semibold">{expiresAt ? format(new Date(expiresAt), "d MMM yyyy", { locale: isAr ? ar : undefined }) : (isAr ? "غير محدد" : "N/A")}</p>
              </div>
              <div className="rounded-xl border bg-card p-3 text-center">
                <AlertTriangle className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{isAr ? "أيام متبقية" : "Days Left"}</p>
                <p className={`mt-1 text-sm font-bold ${daysLeft !== null && daysLeft < 30 ? "text-destructive" : ""}`}>{daysLeft !== null ? daysLeft : "∞"}</p>
              </div>
            </div>

            {/* Profile Completion */}
            <div className="rounded-xl border p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium">{isAr ? "اكتمال الملف الشخصي" : "Profile Completion"}</p>
                <span className="text-xs font-bold text-primary">{completionPercent}%</span>
              </div>
              <Progress value={completionPercent} className="h-2" />
            </div>

            {/* Verification */}
            <div className="rounded-xl border p-3 flex items-center justify-between">
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

            {/* Actions row */}
            <div className="flex items-center gap-2 flex-wrap">
              {isExpired && (
                <Button className="gap-2" onClick={() => upgradeMutation.mutate((currentTier || "basic") as "basic" | "professional" | "enterprise")} disabled={upgradeMutation.isPending}>
                  {upgradeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {isAr ? "تجديد العضوية" : "Renew Membership"}
                </Button>
              )}
              {isPro && !isExpired && (
                <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive ms-auto" onClick={() => setShowCancelDialog(true)}>
                  <XCircle className="h-3.5 w-3.5" />
                  {isAr ? "إلغاء العضوية" : "Cancel Membership"}
                </Button>
              )}
            </div>
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
                <div key={b.label} className="flex items-center gap-2.5 rounded-xl border p-2.5 bg-card">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${tierBg}`}>
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

      {/* ═══════════ SUBSCRIPTION DETAILS ═══════════ */}
      <SubscriptionDetailsCard userId={userId} profile={profile} />

      {/* ═══════════ INVOICES & PAYMENTS ═══════════ */}
      <MembershipInvoicesSection userId={userId} />
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
                  {tier.yearlyPrice && (
                    <div className="mt-1">
                      <p className="text-xs text-muted-foreground">{tier.yearlyPrice}</p>
                      <Badge variant="secondary" className="mt-1 text-[10px] bg-chart-3/15 text-chart-3 border-chart-3/20">
                        {tier.savings}
                      </Badge>
                    </div>
                  )}
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
                <div key={h.id} className="flex items-center justify-between rounded-xl border p-3 text-sm">
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
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl border p-3 text-start text-sm font-medium hover:bg-accent/30 transition-colors group">
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

      {/* ═══════════ CANCEL DIALOG ═══════════ */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isAr ? "إلغاء العضوية" : "Cancel Membership"}</DialogTitle>
            <DialogDescription>
              {isAr ? "نأسف لرحيلك! أخبرنا بسبب الإلغاء حتى نتمكن من التحسين." : "We're sorry to see you go! Let us know why so we can improve."}
            </DialogDescription>
          </DialogHeader>

          {/* Retention offer */}
          <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              <p className="text-sm font-bold">{isAr ? "قبل أن تذهب..." : "Before you go..."}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {isAr
                ? "ماذا لو قدمنا لك خصم 50% على الأشهر الثلاثة القادمة؟ ستحافظ على جميع مزاياك الحالية."
                : "How about 50% off for the next 3 months? You'll keep all your current benefits."}
            </p>
          </div>

          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium">{isAr ? "سبب الإلغاء" : "Reason for cancelling"}</label>
              <Select value={cancelReasonType} onValueChange={setCancelReasonType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cancelReasons.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {cancelReasonType === "other" && (
              <div>
                <label className="text-sm font-medium">{isAr ? "وضح السبب" : "Please specify"}</label>
                <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder={isAr ? "أخبرنا المزيد..." : "Tell us more..."} className="mt-1" />
              </div>
            )}
            <div>
              <label className="text-sm font-medium">{isAr ? "ملاحظات إضافية (اختياري)" : "Additional feedback (optional)"}</label>
              <Textarea value={cancelFeedback} onChange={(e) => setCancelFeedback(e.target.value)} placeholder={isAr ? "كيف يمكننا التحسين؟" : "How can we improve?"} className="mt-1" />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowCancelDialog(false)} className="sm:flex-1">
              {isAr ? "إبقاء العضوية" : "Keep Membership"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending || (cancelReasonType === "other" && !cancelReason.trim())}
              className="sm:flex-1 gap-1.5"
            >
              {cancelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              {isAr ? "تأكيد الإلغاء" : "Confirm Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Benefits Usage Tracker */}
      <BenefitsUsageTracker />

      {/* Membership History */}
      <MembershipHistory />
    </div>
  );
}
