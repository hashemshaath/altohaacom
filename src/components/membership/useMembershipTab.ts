/**
 * Extracted state & mutation logic for UnifiedMembershipTab.
 */
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useVerificationStatus } from "@/hooks/useVerification";
import { useToast } from "@/hooks/use-toast";
import { Crown, Star, Shield } from "lucide-react";

const TIER_ORDER: Record<string, number> = { basic: 0, professional: 1, enterprise: 2 };
const TIER_PRICES: Record<string, number> = { basic: 0, professional: 19, enterprise: 99 };
const TIER_NAMES: Record<string, { en: string; ar: string }> = {
  basic: { en: "Basic", ar: "أساسية" },
  professional: { en: "Professional", ar: "احترافية" },
  enterprise: { en: "Enterprise", ar: "مؤسسية" },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useMembershipTab(profile: any, userId: string, onMembershipChange?: () => void) {
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

  // ── Queries ──
  const { data: card, isLoading: cardLoading } = useQuery({
    queryKey: ["membership-card", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_cards")
        .select("id, user_id, membership_number, verification_code, card_status, card_orientation, is_trial, trial_ends_at, expires_at, issued_at, created_at")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: history } = useQuery({
    queryKey: ["membership-history", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("membership_history")
        .select("id, previous_tier, new_tier, reason, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  // ── Upgrade/Downgrade/Renew ──
  const upgradeMutation = useMutation({
    mutationFn: async (newTier: "basic" | "professional" | "enterprise") => {
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      const prevTier = (profile?.membership_tier || "basic") as "basic" | "professional" | "enterprise";
      const isDowngrade = TIER_ORDER[newTier] < TIER_ORDER[prevTier];
      const isRenewal = newTier === prevTier;

      let proratedCredit = 0;
      if (isDowngrade && profile?.membership_expires_at) {
        const expiry = new Date(profile.membership_expires_at);
        const remainingDays = Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        const dailyRate = (TIER_PRICES[prevTier] * 12) / 365;
        const newDailyRate = (TIER_PRICES[newTier] * 12) / 365;
        proratedCredit = Math.round((dailyRate - newDailyRate) * remainingDays * 100) / 100;
      }

      await supabase.from("membership_history").insert([{
        user_id: userId,
        previous_tier: prevTier,
        new_tier: newTier,
        reason: isDowngrade ? `Downgrade with prorated credit: ${proratedCredit} SAR` : (isRenewal ? "Renewal" : "Upgrade"),
      }]);

      const { error } = await supabase.from("profiles").update({
        membership_tier: newTier,
        membership_status: "active",
        membership_started_at: isDowngrade ? profile?.membership_started_at : now.toISOString(),
        membership_expires_at: expiresAt.toISOString(),
      }).eq("user_id", userId);
      if (error) throw error;

      if (card) {
        await supabase.from("membership_cards").update({
          expires_at: expiresAt.toISOString(),
          is_trial: false,
          card_status: "active",
          renewed_at: isRenewal ? now.toISOString() : undefined,
        }).eq("id", card.id);
      }

      if (isDowngrade && proratedCredit > 0) {
        await supabase.rpc("wallet_credit", {
          p_user_id: userId, p_amount: proratedCredit, p_currency: "SAR",
          p_description: `Prorated credit from ${prevTier} → ${newTier} downgrade`,
          p_description_ar: `رصيد تناسبي من تخفيض ${prevTier} → ${newTier}`,
        });
      }

      const amount = TIER_PRICES[newTier] * 12;
      if (amount > 0) {
        const taxRate = 15;
        const subtotal = amount;
        const taxAmount = Math.round(subtotal * taxRate) / 100;
        const total = subtotal + taxAmount;
        const invoiceNumber = `INV-MBR-${Date.now().toString(36).toUpperCase()}`;
        const tn = TIER_NAMES[newTier] || TIER_NAMES.basic;

        await supabase.from("invoices").insert({
          invoice_number: invoiceNumber, user_id: userId, amount: total, currency: "SAR",
          subtotal, tax_rate: taxRate, tax_amount: taxAmount,
          title: isRenewal ? `${tn.en} Membership Renewal` : `${tn.en} Membership ${isDowngrade ? "Change" : "Upgrade"}`,
          title_ar: isRenewal ? `تجديد عضوية ${tn.ar}` : `${isDowngrade ? "تغيير" : "ترقية"} عضوية ${tn.ar}`,
          description: `${tn.en} membership - Annual plan`,
          description_ar: `عضوية ${tn.ar} - خطة سنوية`,
          status: "paid", paid_at: now.toISOString(), payment_method: "wallet",
          items: [{ name: `${tn.en} Membership`, name_ar: `عضوية ${tn.ar}`, quantity: 1, unit_price: subtotal, amount: subtotal }],
        });
      }

      return { newTier, prevTier, isDowngrade, isRenewal, proratedCredit, amount };
    },
    onSuccess: ({ newTier, prevTier, isDowngrade, isRenewal, proratedCredit, amount }) => {
      queryClient.invalidateQueries({ queryKey: ["membership-history", userId] });
      queryClient.invalidateQueries({ queryKey: ["membership-card", userId] });
      queryClient.invalidateQueries({ queryKey: ["membership-card-sub", userId] });
      queryClient.invalidateQueries({ queryKey: ["membership-invoices", userId] });
      onMembershipChange?.();

      const tn = TIER_NAMES[newTier] || TIER_NAMES.basic;
      toast({
        title: isAr
          ? (isRenewal ? "تم تجديد العضوية!" : isDowngrade ? "تم تخفيض العضوية" : "تم ترقية العضوية!")
          : (isRenewal ? "Membership renewed!" : isDowngrade ? "Membership downgraded" : "Membership upgraded!"),
        description: isDowngrade && proratedCredit > 0
          ? (isAr ? `تم إضافة ${proratedCredit} ر.س كرصيد تناسبي لمحفظتك` : `${proratedCredit} SAR prorated credit added to your wallet`)
          : (isAr ? `تم تغيير عضويتك إلى ${tn.ar}` : `Your membership is now ${tn.en}`),
      });

      import("@/lib/notificationTriggers").then((triggers) => {
        if (isRenewal) {
          const expiresAt = new Date(); expiresAt.setFullYear(expiresAt.getFullYear() + 1);
          triggers.notifyMembershipRenewed({ userId, tier: newTier, expiresAt: expiresAt.toISOString(), amount });
        } else if (isDowngrade) {
          triggers.notifyMembershipDowngraded({ userId, previousTier: prevTier, newTier, proratedCredit });
        } else {
          triggers.notifyMembershipUpgraded({ userId, previousTier: prevTier, newTier, amount });
        }
      });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  // ── Cancel ──
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

      import("@/lib/notificationTriggers").then((triggers) => {
        triggers.notifyMembershipCancellationSubmitted({ userId, tier: profile?.membership_tier || "basic" });
        triggers.notifyAdminMembershipCancellation({
          userName: profile?.full_name || "User",
          tier: profile?.membership_tier || "basic",
          reason: cancelReasonType === "other" ? cancelReason : cancelReasonType,
        });
      });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  // ── Card actions ──
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
    if ("fonts" in document) {
      await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
    }
    const bounds = cardRef.current.getBoundingClientRect();
    return html2canvas(cardRef.current, {
      scale, useCORS: true, allowTaint: true, backgroundColor: null, logging: false,
      width: Math.round(bounds.width), height: Math.round(bounds.height),
      windowWidth: Math.ceil(bounds.width), windowHeight: Math.ceil(bounds.height),
    });
  };

  const handlePrint = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await renderCardCanvas(4);
      if (!canvas) return;
      const isVert = orientation === "vertical";
      const cardW = isVert ? "53.98mm" : "85.6mm";
      const cardH = isVert ? "85.6mm" : "53.98mm";
      const imgDataUrl = canvas.toDataURL("image/png");
      const printWindow = window.open("", "_blank", "noopener,noreferrer");
      if (!printWindow) return;
      printWindow.document.write(`<!DOCTYPE html><html dir="${isAr ? "rtl" : "ltr"}"><head><meta charset="utf-8"/><title>${isAr ? "بطاقة العضوية" : "Membership Card"}</title><style>*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}html,body{width:${cardW};height:${cardH};overflow:hidden;background:transparent;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}body{display:block}.card-img{display:block;width:${cardW};height:${cardH};object-fit:cover}@page{size:${cardW} ${cardH};margin:0}</style></head><body><img class="card-img" src="${imgDataUrl}" alt="Membership Card"/></body></html>`);
      printWindow.document.close();
      const triggerPrint = () => { printWindow.focus(); printWindow.print(); };
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

  // ── Derived ──
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

  return {
    isAr, verificationStatus, cardRef,
    // state
    showCode, setShowCode, orientation, cardTheme, setCardTheme,
    showCancelDialog, setShowCancelDialog,
    cancelReason, setCancelReason, cancelReasonType, setCancelReasonType, cancelFeedback, setCancelFeedback,
    // queries
    card, cardLoading, history,
    // mutations
    upgradeMutation, cancelMutation,
    // actions
    toggleOrientation, handlePrint, handleSaveAsImage,
    // derived
    currentTier, expiresAt, isExpired, daysLeft, isPro, isEnterprise,
    TierIcon, tierName, tierColor, tierBg,
    isTrial, verificationCode, isVertical,
    cardExpiresDate, cardDaysLeft, isCardExpired, showExpiryWarning,
    completionPercent,
  };
}
