import { useState, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Crown, Star, Zap, Check, ArrowRight, ArrowLeft, Shield,
  CreditCard, Clock, Sparkles, ChevronRight, Loader2,
  ArrowDown, ArrowUp, AlertTriangle, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MembershipReceipt } from "@/components/membership/MembershipReceipt";

const ALL_TIERS = [
  { id: "basic", icon: Zap, color: "text-muted-foreground", bg: "bg-muted/30", monthly: 0, yearly: 0 },
  { id: "professional", icon: Star, color: "text-primary", bg: "bg-primary/10", monthly: 19, yearly: 190 },
  { id: "enterprise", icon: Crown, color: "text-chart-2", bg: "bg-chart-2/10", monthly: 99, yearly: 990 },
];

const TIER_ORDER: Record<string, number> = { basic: 0, professional: 1, enterprise: 2 };

const TIER_NAMES: Record<string, { en: string; ar: string }> = {
  basic: { en: "Basic", ar: "الأساسي" },
  professional: { en: "Professional", ar: "الاحترافي" },
  enterprise: { en: "Enterprise", ar: "المؤسسي" },
};

export default function MembershipCheckout() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const preselectedTier = searchParams.get("tier") || "professional";
  const isRenewal = searchParams.get("renew") === "true";

  const [selectedTier, setSelectedTier] = useState(preselectedTier);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [step, setStep] = useState<"plan" | "confirm" | "processing" | "success">("plan");
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["checkout-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("membership_tier, membership_status, membership_expires_at, membership_started_at, full_name, email")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const currentTier = profile?.membership_tier || "basic";
  const selectedConfig = ALL_TIERS.find((t) => t.id === selectedTier);
  const currentConfig = ALL_TIERS.find((t) => t.id === currentTier);
  const price = selectedConfig
    ? billingCycle === "yearly" ? selectedConfig.yearly : selectedConfig.monthly
    : 0;
  const period = billingCycle === "yearly" ? 12 : 1;
  const savings = selectedConfig && billingCycle === "yearly"
    ? (selectedConfig.monthly * 12) - selectedConfig.yearly
    : 0;

  const isUpgrade = TIER_ORDER[selectedTier] > TIER_ORDER[currentTier];
  const isDowngrade = TIER_ORDER[selectedTier] < TIER_ORDER[currentTier];
  const isSameTier = selectedTier === currentTier;

  // Calculate prorated credit for upgrades
  const proratedCredit = useMemo(() => {
    if (!isUpgrade || !profile?.membership_expires_at || !profile?.membership_started_at || currentTier === "basic") return 0;
    const now = new Date();
    const expiresAt = new Date(profile.membership_expires_at);
    const startedAt = new Date(profile.membership_started_at);
    if (expiresAt <= now) return 0;

    const totalDays = Math.max((expiresAt.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24), 1);
    const remainingDays = Math.max((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24), 0);
    const currentPrice = currentConfig ? (totalDays > 60 ? currentConfig.yearly : currentConfig.monthly) : 0;
    const credit = Math.round((remainingDays / totalDays) * currentPrice);
    return credit;
  }, [isUpgrade, profile, currentTier, currentConfig]);

  const finalAmount = Math.max(price - proratedCredit, 0);

  // Action label
  const actionLabel = useMemo(() => {
    if (isRenewal) return isAr ? "تجديد الآن" : "Renew Now";
    if (isDowngrade) return isAr ? "تخفيض الآن" : "Downgrade Now";
    return isAr ? "ترقية الآن" : "Upgrade Now";
  }, [isRenewal, isDowngrade, isAr]);

  const changeType = isRenewal ? "renewal" : isDowngrade ? "downgrade" : "upgrade";

  const REFERRAL_POINTS_REFERRER = 200;
  const REFERRAL_POINTS_REFEREE = 100;

  const processMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      const expiresAt = new Date();
      if (selectedTier === "basic") {
        // Downgrade to basic: clear membership
        await supabase
          .from("profiles")
          .update({
            membership_tier: "basic" as any,
            membership_status: "active",
            membership_expires_at: null,
            membership_started_at: null,
          })
          .eq("user_id", user.id);

        await supabase
          .from("membership_cards")
          .update({ card_status: "inactive", is_trial: false })
          .eq("user_id", user.id);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + period);

        await supabase
          .from("profiles")
          .update({
            membership_tier: selectedTier as "basic" | "professional" | "enterprise",
            membership_status: "active",
            membership_expires_at: expiresAt.toISOString(),
            membership_started_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        await supabase
          .from("membership_cards")
          .update({
            card_status: "active",
            is_trial: false,
            expires_at: expiresAt.toISOString(),
          })
          .eq("user_id", user.id);
      }

      // Log history
      await supabase.from("membership_history").insert({
        user_id: user.id,
        previous_tier: currentTier as "basic" | "professional" | "enterprise",
        new_tier: selectedTier as "basic" | "professional" | "enterprise",
        reason: changeType,
        changed_by: user.id,
      });

      // Notification
      const tierLabel = TIER_NAMES[selectedTier]?.[isAr ? "ar" : "en"] || selectedTier;
      const tierLabelOther = TIER_NAMES[selectedTier]?.[isAr ? "en" : "ar"] || selectedTier;
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: isAr
          ? `تم ${changeType === "renewal" ? "تجديد" : changeType === "downgrade" ? "تخفيض" : "ترقية"} العضوية — ${TIER_NAMES[selectedTier]?.ar}`
          : `Membership ${changeType === "renewal" ? "renewed" : changeType === "downgrade" ? "downgraded" : "upgraded"} — ${TIER_NAMES[selectedTier]?.en}`,
        title_ar: `تم ${changeType === "renewal" ? "تجديد" : changeType === "downgrade" ? "تخفيض" : "ترقية"} العضوية — ${TIER_NAMES[selectedTier]?.ar}`,
        body: selectedTier === "basic"
          ? (isAr ? "تم تحويل عضويتك إلى الخطة الأساسية المجانية" : "Your membership has been switched to the free Basic plan")
          : `Your membership is now active until ${expiresAt.toLocaleDateString()}`,
        body_ar: selectedTier === "basic"
          ? "تم تحويل عضويتك إلى الخطة الأساسية المجانية"
          : `عضويتك نشطة حتى ${expiresAt.toLocaleDateString("ar")}`,
        type: "membership_upgrade",
        link: "/profile?tab=membership",
      });

      // --- Referral rewards for membership upgrade ---
      if (!isRenewal && !isDowngrade && currentTier === "basic") {
        const { data: referralConversion } = await supabase
          .from("referral_conversions")
          .select("referrer_id, referral_code_id")
          .eq("referred_user_id", user.id)
          .eq("conversion_type", "signup")
          .maybeSingle();

        if (referralConversion?.referrer_id) {
          const { data: existingReward } = await supabase
            .from("referral_conversions")
            .select("id")
            .eq("referred_user_id", user.id)
            .eq("conversion_type", "membership_upgrade")
            .maybeSingle();

          if (!existingReward) {
            await supabase.from("referral_conversions").insert({
              referral_code_id: referralConversion.referral_code_id,
              referrer_id: referralConversion.referrer_id,
              referred_user_id: user.id,
              conversion_type: "membership_upgrade",
              points_awarded_referrer: REFERRAL_POINTS_REFERRER,
              points_awarded_referred: REFERRAL_POINTS_REFEREE,
              metadata: { tier: selectedTier, billing_cycle: billingCycle },
            });

            await supabase.rpc("award_points", {
              p_user_id: referralConversion.referrer_id,
              p_action_type: "referral_membership",
              p_points: REFERRAL_POINTS_REFERRER,
              p_description: `Referral bonus: your invite upgraded to ${TIER_NAMES[selectedTier]?.en}`,
              p_description_ar: `مكافأة إحالة: دعوتك ترقّت إلى ${TIER_NAMES[selectedTier]?.ar}`,
              p_reference_type: "referral",
              p_reference_id: user.id,
            });

            await supabase.rpc("award_points", {
              p_user_id: user.id,
              p_action_type: "referral_membership_bonus",
              p_points: REFERRAL_POINTS_REFEREE,
              p_description: `Welcome bonus for upgrading via referral`,
              p_description_ar: `مكافأة ترحيبية للترقية عبر الإحالة`,
              p_reference_type: "referral",
              p_reference_id: referralConversion.referrer_id,
            });

            await supabase.from("notifications").insert({
              user_id: referralConversion.referrer_id,
              title: `🎉 Referral reward: +${REFERRAL_POINTS_REFERRER} points!`,
              title_ar: `🎉 مكافأة إحالة: +${REFERRAL_POINTS_REFERRER} نقطة!`,
              body: `Someone you referred upgraded to ${TIER_NAMES[selectedTier]?.en}. You earned ${REFERRAL_POINTS_REFERRER} bonus points!`,
              body_ar: `شخص أحلته ترقّى إلى ${TIER_NAMES[selectedTier]?.ar}. حصلت على ${REFERRAL_POINTS_REFERRER} نقطة!`,
              type: "referral_reward",
              link: "/profile?tab=wallet",
            });
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkout-profile"] });
      queryClient.invalidateQueries({ queryKey: ["user-tier"] });
      queryClient.invalidateQueries({ queryKey: ["membership"] });
      queryClient.invalidateQueries({ queryKey: ["userAllFeatures"] });
      queryClient.invalidateQueries({ queryKey: ["accountType"] });
      setStep("success");
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setStep("confirm");
    },
  });

  const handleContinue = () => {
    if (isDowngrade) {
      setShowDowngradeDialog(true);
    } else {
      setStep("confirm");
    }
  };

  const handleConfirmDowngrade = () => {
    setShowDowngradeDialog(false);
    setStep("confirm");
  };

  const handleConfirm = () => {
    setStep("processing");
    processMutation.mutate();
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  // Available tiers to show (exclude current for non-renewal, show all for change)
  const availableTiers = ALL_TIERS.filter((t) => t.id !== currentTier || isRenewal);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-8 md:py-16 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => step === "plan" ? navigate(-1) : setStep("plan")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isRenewal
                ? (isAr ? "تجديد العضوية" : "Renew Membership")
                : (isAr ? "تغيير الخطة" : "Change Plan")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isAr ? `خطتك الحالية: ${TIER_NAMES[currentTier]?.ar}` : `Current plan: ${TIER_NAMES[currentTier]?.en}`}
              {profile?.membership_expires_at && currentTier !== "basic" && (
                <span className="ms-2">
                  · {isAr ? "تنتهي" : "Expires"} {new Date(profile.membership_expires_at).toLocaleDateString(isAr ? "ar" : "en", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {["plan", "confirm", "success"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold",
                step === s || (s === "success" && step === "processing")
                  ? "bg-primary text-primary-foreground"
                  : i < ["plan", "confirm", "success"].indexOf(step)
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              )}>
                {i + 1}
              </div>
              <span className={step === s ? "font-medium text-foreground" : ""}>
                {s === "plan" ? (isAr ? "الخطة" : "Plan") :
                 s === "confirm" ? (isAr ? "تأكيد" : "Confirm") :
                 (isAr ? "تم" : "Done")}
              </span>
              {i < 2 && <ChevronRight className="h-3 w-3" />}
            </div>
          ))}
        </div>

        {/* Step 1: Plan Selection */}
        {step === "plan" && (
          <div className="space-y-6">
            {/* Billing cycle (only for paid tiers) */}
            {selectedTier !== "basic" && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{isAr ? "دورة الفوترة" : "Billing Cycle"}</span>
                    <div className="flex items-center gap-1 rounded-full border bg-muted/50 p-0.5">
                      <button
                        onClick={() => setBillingCycle("monthly")}
                        className={cn(
                          "rounded-full px-4 py-1.5 text-xs font-medium transition-all",
                          billingCycle === "monthly" ? "bg-background shadow-sm" : "text-muted-foreground"
                        )}
                      >
                        {isAr ? "شهري" : "Monthly"}
                      </button>
                      <button
                        onClick={() => setBillingCycle("yearly")}
                        className={cn(
                          "rounded-full px-4 py-1.5 text-xs font-medium transition-all",
                          billingCycle === "yearly" ? "bg-background shadow-sm" : "text-muted-foreground"
                        )}
                      >
                        {isAr ? "سنوي" : "Yearly"}
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Plan cards */}
            <RadioGroup value={selectedTier} onValueChange={setSelectedTier}>
              <div className={cn("grid gap-4", availableTiers.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2")}>
                {availableTiers.map((tier) => {
                  const TierIcon = tier.icon;
                  const tierPrice = billingCycle === "yearly" ? tier.yearly : tier.monthly;
                  const isSelected = selectedTier === tier.id;
                  const isCurrent = currentTier === tier.id;
                  const isTierDowngrade = TIER_ORDER[tier.id] < TIER_ORDER[currentTier];
                  const isTierUpgrade = TIER_ORDER[tier.id] > TIER_ORDER[currentTier];
                  const monthlySaving = billingCycle === "yearly" && tier.monthly > 0 ? (tier.monthly * 12) - tier.yearly : 0;

                  return (
                    <Label key={tier.id} htmlFor={tier.id} className="cursor-pointer">
                      <Card className={cn(
                        "relative transition-all",
                        isSelected ? "ring-2 ring-primary shadow-md" : "hover:shadow-sm",
                        isCurrent && !isRenewal ? "opacity-60" : ""
                      )}>
                        {isTierUpgrade && (
                          <div className="absolute -top-2.5 start-3">
                            <Badge className="bg-primary text-[10px] gap-1">
                              <ArrowUp className="h-3 w-3" />
                              {isAr ? "ترقية" : "Upgrade"}
                            </Badge>
                          </div>
                        )}
                        {isTierDowngrade && (
                          <div className="absolute -top-2.5 start-3">
                            <Badge variant="secondary" className="text-[10px] gap-1">
                              <ArrowDown className="h-3 w-3" />
                              {isAr ? "تخفيض" : "Downgrade"}
                            </Badge>
                          </div>
                        )}
                        {isCurrent && isRenewal && (
                          <div className="absolute -top-2.5 start-3">
                            <Badge variant="outline" className="text-[10px] gap-1 bg-background">
                              <RefreshCw className="h-3 w-3" />
                              {isAr ? "تجديد" : "Renew"}
                            </Badge>
                          </div>
                        )}
                        <CardContent className="p-5 pt-6 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value={tier.id} id={tier.id} disabled={isCurrent && !isRenewal} />
                              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tier.bg}`}>
                                <TierIcon className={`h-5 w-5 ${tier.color}`} />
                              </div>
                              <div>
                                <p className="font-bold">{TIER_NAMES[tier.id]?.[isAr ? "ar" : "en"]}</p>
                                {isCurrent && (
                                  <Badge variant="outline" className="text-[9px] mt-0.5">
                                    {isAr ? "الحالي" : "Current"}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="ps-9">
                            {tier.monthly === 0 ? (
                              <p className="text-2xl font-bold">{isAr ? "مجاني" : "Free"}</p>
                            ) : (
                              <>
                                <p className="text-2xl font-bold">
                                  {tierPrice} <span className="text-sm font-normal text-muted-foreground">SAR</span>
                                  <span className="text-xs text-muted-foreground">
                                    /{billingCycle === "yearly" ? (isAr ? "سنة" : "yr") : (isAr ? "شهر" : "mo")}
                                  </span>
                                </p>
                                {billingCycle === "yearly" && monthlySaving > 0 && (
                                  <Badge variant="secondary" className="bg-chart-2/10 text-chart-2 border-chart-2/20 text-[10px] mt-1">
                                    {isAr ? `وفّر ${monthlySaving} ر.س/سنة` : `Save ${monthlySaving} SAR/yr`}
                                  </Badge>
                                )}
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Label>
                  );
                })}
              </div>
            </RadioGroup>

            {/* Prorated credit notice */}
            {isUpgrade && proratedCredit > 0 && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4 flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">
                      {isAr ? `رصيد متبقي: ${proratedCredit} ر.س` : `Prorated credit: ${proratedCredit} SAR`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isAr
                        ? "سيتم خصم الرصيد المتبقي من خطتك الحالية تلقائياً"
                        : "The unused balance from your current plan will be applied automatically"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Downgrade warning inline */}
            {isDowngrade && (
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-destructive">
                      {isAr ? "تحذير: ستفقد بعض المميزات" : "Warning: You'll lose some features"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedTier === "basic"
                        ? (isAr
                          ? "سيتم تحويلك إلى الخطة المجانية وستفقد جميع مميزات العضوية المدفوعة فوراً"
                          : "You'll be switched to the free plan and lose all paid features immediately")
                        : (isAr
                          ? "سيتم تخفيض خطتك وستفقد مميزات المستوى الأعلى فوراً"
                          : "Your plan will be downgraded and you'll lose higher-tier features immediately")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              className="w-full gap-2"
              size="lg"
              variant={isDowngrade ? "outline" : "default"}
              disabled={isSameTier && !isRenewal}
              onClick={handleContinue}
            >
              {isDowngrade ? <ArrowDown className="h-4 w-4" /> : null}
              {isAr ? "متابعة" : "Continue"}
              {!isDowngrade ? <ArrowRight className="h-4 w-4" /> : null}
            </Button>
          </div>
        )}

        {/* Step 2: Confirmation */}
        {step === "confirm" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  {isAr ? "ملخص الطلب" : "Order Summary"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Change direction indicator */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-2">
                    {currentConfig && (
                      <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${currentConfig.bg}`}>
                        <currentConfig.icon className={`h-4 w-4 ${currentConfig.color}`} />
                      </div>
                    )}
                    <span className="text-sm font-medium">{TIER_NAMES[currentTier]?.[isAr ? "ar" : "en"]}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    {selectedConfig && (
                      <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${selectedConfig.bg}`}>
                        <selectedConfig.icon className={`h-4 w-4 ${selectedConfig.color}`} />
                      </div>
                    )}
                    <span className="text-sm font-bold">{TIER_NAMES[selectedTier]?.[isAr ? "ar" : "en"]}</span>
                  </div>
                  <Badge variant={isDowngrade ? "secondary" : "default"} className="ms-auto text-[10px]">
                    {isRenewal ? (isAr ? "تجديد" : "Renewal") : isDowngrade ? (isAr ? "تخفيض" : "Downgrade") : (isAr ? "ترقية" : "Upgrade")}
                  </Badge>
                </div>

                <Separator />

                {selectedTier !== "basic" && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span>{TIER_NAMES[selectedTier]?.[isAr ? "ar" : "en"]} — {billingCycle === "yearly" ? (isAr ? "سنوي" : "Yearly") : (isAr ? "شهري" : "Monthly")}</span>
                      <span className="font-medium">{price} SAR</span>
                    </div>

                    {proratedCredit > 0 && (
                      <div className="flex items-center justify-between text-sm text-primary">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5" />
                          {isAr ? "رصيد متبقي" : "Prorated credit"}
                        </span>
                        <span className="font-medium">-{proratedCredit} SAR</span>
                      </div>
                    )}

                    {savings > 0 && (
                      <div className="flex items-center justify-between text-sm text-chart-2">
                        <span>{isAr ? "التوفير السنوي" : "Yearly savings"}</span>
                        <span className="font-bold">-{savings} SAR</span>
                      </div>
                    )}

                    <Separator />

                    <div className="flex items-center justify-between font-bold text-lg">
                      <span>{isAr ? "المجموع" : "Total"}</span>
                      <span>{finalAmount} SAR</span>
                    </div>
                  </>
                )}

                {selectedTier === "basic" && (
                  <div className="text-center py-4">
                    <p className="text-lg font-bold text-muted-foreground">{isAr ? "مجاني — بدون رسوم" : "Free — No charge"}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isAr ? "سيتم إلغاء اشتراكك المدفوع فوراً" : "Your paid subscription will be cancelled immediately"}
                    </p>
                  </div>
                )}

                <Separator />

                <div className="space-y-2 text-sm text-muted-foreground">
                  {selectedTier !== "basic" && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {isAr
                          ? `صالح لمدة ${period} ${period > 1 ? "أشهر" : "شهر"}`
                          : `Valid for ${period} month${period > 1 ? "s" : ""}`}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5" />
                    <span>{isAr ? "يمكنك تغيير الخطة في أي وقت" : "Change plans anytime"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep("plan")}>
                <ArrowLeft className="h-4 w-4 me-2" />
                {isAr ? "رجوع" : "Back"}
              </Button>
              <Button
                className="flex-1 gap-2"
                variant={isDowngrade ? "outline" : "default"}
                onClick={handleConfirm}
              >
                {isDowngrade ? <ArrowDown className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                {actionLabel}
              </Button>
            </div>

            <p className="text-[10px] text-center text-muted-foreground">
              {isAr
                ? "بالمتابعة، أنت توافق على شروط الخدمة وسياسة الخصوصية"
                : "By proceeding, you agree to our Terms of Service and Privacy Policy"}
            </p>
          </div>
        )}

        {/* Processing */}
        {step === "processing" && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-16">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-lg font-medium">{isAr ? "جارٍ المعالجة..." : "Processing..."}</p>
              <p className="text-sm text-muted-foreground">{isAr ? "يرجى الانتظار" : "Please wait"}</p>
            </CardContent>
          </Card>
        )}

        {/* Success */}
        {step === "success" && (
          <div className="space-y-6">
            <Card className={isDowngrade ? "border-muted" : "border-primary/20"}>
              <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                <div className={`flex h-16 w-16 items-center justify-center rounded-full ${isDowngrade ? "bg-muted" : "bg-primary/10"}`}>
                  {isDowngrade
                    ? <Check className="h-8 w-8 text-muted-foreground" />
                    : <Sparkles className="h-8 w-8 text-primary" />}
                </div>
                <h2 className="text-2xl font-bold">
                  {isDowngrade
                    ? (isAr ? "تم تغيير الخطة ✓" : "Plan Changed ✓")
                    : isRenewal
                      ? (isAr ? "تم التجديد بنجاح! 🎉" : "Renewed Successfully! 🎉")
                      : (isAr ? "تمت الترقية بنجاح! 🎉" : "Upgraded Successfully! 🎉")}
                </h2>
                <p className="text-muted-foreground max-w-sm">
                  {isAr
                    ? `أنت الآن على خطة ${TIER_NAMES[selectedTier]?.ar}.`
                    : `You're now on the ${TIER_NAMES[selectedTier]?.en} plan.`}
                  {!isDowngrade && (isAr ? " استمتع بجميع المميزات!" : " Enjoy all the benefits!")}
                </p>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => navigate("/membership")}>
                    {isAr ? "عرض الخطط" : "View Plans"}
                  </Button>
                  <Button onClick={() => navigate("/profile?tab=membership")} className="gap-2">
                    <Crown className="h-4 w-4" />
                    {isAr ? "عضويتي" : "My Membership"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Receipt (only for paid changes) */}
            {selectedTier !== "basic" && (
              <MembershipReceipt
                receiptData={{
                  userName: profile?.full_name || "Member",
                  userEmail: profile?.email || "",
                  tier: selectedTier,
                  previousTier: currentTier,
                  billingCycle,
                  amount: finalAmount,
                  currency: "SAR",
                  transactionDate: new Date(),
                  expiresAt: new Date(Date.now() + period * 30 * 24 * 60 * 60 * 1000),
                  receiptNumber: `MBR-${Date.now().toString(36).toUpperCase()}`,
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Downgrade confirmation dialog */}
      <AlertDialog open={showDowngradeDialog} onOpenChange={setShowDowngradeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {isAr ? "تأكيد تخفيض الخطة" : "Confirm Downgrade"}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {isAr
                  ? `أنت على وشك التخفيض من ${TIER_NAMES[currentTier]?.ar} إلى ${TIER_NAMES[selectedTier]?.ar}.`
                  : `You're about to downgrade from ${TIER_NAMES[currentTier]?.en} to ${TIER_NAMES[selectedTier]?.en}.`}
              </p>
              <p className="font-medium">
                {isAr ? "ستفقد هذه المميزات فوراً:" : "You'll immediately lose access to:"}
              </p>
              <ul className="list-disc ps-5 space-y-1 text-sm">
                <li>{isAr ? "أدوات التحليلات المتقدمة" : "Advanced analytics tools"}</li>
                <li>{isAr ? "أولوية الدعم الفني" : "Priority support"}</li>
                <li>{isAr ? "مميزات المحتوى الحصري" : "Exclusive content features"}</li>
                {currentTier === "enterprise" && selectedTier === "basic" && (
                  <li>{isAr ? "جميع أدوات المحترفين والمؤسسات" : "All professional & enterprise tools"}</li>
                )}
              </ul>
              {selectedTier !== "basic" && proratedCredit > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {isAr ? "لن يتم استرداد الرصيد المتبقي" : "No refund will be issued for the remaining balance"}
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDowngrade} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isAr ? "تأكيد التخفيض" : "Confirm Downgrade"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
