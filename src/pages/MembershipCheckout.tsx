import { useState } from "react";
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
  Crown, Star, Zap, Check, ArrowRight, ArrowLeft, Shield,
  CreditCard, Clock, Sparkles, ChevronRight, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TIERS = [
  { id: "professional", icon: Star, color: "text-primary", bg: "bg-primary/10", monthly: 19, yearly: 190 },
  { id: "enterprise", icon: Crown, color: "text-chart-2", bg: "bg-chart-2/10", monthly: 99, yearly: 990 },
];

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

  const { data: profile } = useQuery({
    queryKey: ["checkout-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("membership_tier, membership_status, membership_expires_at, full_name, email")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const currentTier = profile?.membership_tier || "basic";
  const selectedConfig = TIERS.find((t) => t.id === selectedTier);
  const price = selectedConfig
    ? billingCycle === "yearly" ? selectedConfig.yearly : selectedConfig.monthly
    : 0;
  const period = billingCycle === "yearly" ? 12 : 1;
  const savings = selectedConfig && billingCycle === "yearly"
    ? (selectedConfig.monthly * 12) - selectedConfig.yearly
    : 0;

  const isUpgrade = selectedTier !== currentTier;
  const tierOrder: Record<string, number> = { basic: 0, professional: 1, enterprise: 2 };
  const isDowngrade = tierOrder[selectedTier] < tierOrder[currentTier];

  const REFERRAL_POINTS_REFERRER = 200;
  const REFERRAL_POINTS_REFEREE = 100;

  const processMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      // Calculate expiry
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + period);

      // Update profile
      await supabase
        .from("profiles")
        .update({
          membership_tier: selectedTier as "basic" | "professional" | "enterprise",
          membership_status: "active",
          membership_expires_at: expiresAt.toISOString(),
          membership_started_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      // Update membership card
      await supabase
        .from("membership_cards")
        .update({
          card_status: "active",
          is_trial: false,
          expires_at: expiresAt.toISOString(),
        })
        .eq("user_id", user.id);

      // Log history
      await supabase.from("membership_history").insert({
        user_id: user.id,
        previous_tier: currentTier as "basic" | "professional" | "enterprise",
        new_tier: selectedTier as "basic" | "professional" | "enterprise",
        reason: isRenewal ? "renewal" : (isDowngrade ? "downgrade" : "upgrade"),
        changed_by: user.id,
      });

      // Add notification
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: isRenewal
          ? `Membership renewed — ${TIER_NAMES[selectedTier]?.en}`
          : `Membership ${isDowngrade ? "changed" : "upgraded"} to ${TIER_NAMES[selectedTier]?.en}`,
        title_ar: isRenewal
          ? `تم تجديد العضوية — ${TIER_NAMES[selectedTier]?.ar}`
          : `تم ${isDowngrade ? "تغيير" : "ترقية"} العضوية إلى ${TIER_NAMES[selectedTier]?.ar}`,
        body: `Your membership is now active until ${expiresAt.toLocaleDateString()}`,
        body_ar: `عضويتك نشطة حتى ${expiresAt.toLocaleDateString("ar")}`,
        type: "membership_upgrade",
        link: "/profile?tab=membership",
      });

      // --- Referral rewards for membership upgrade ---
      if (!isRenewal && !isDowngrade && currentTier === "basic") {
        // Check if this user was referred
        const { data: referralConversion } = await supabase
          .from("referral_conversions")
          .select("referrer_id, referral_code_id")
          .eq("referred_user_id", user.id)
          .eq("conversion_type", "signup")
          .maybeSingle();

        if (referralConversion?.referrer_id) {
          // Check if membership reward already given
          const { data: existingReward } = await supabase
            .from("referral_conversions")
            .select("id")
            .eq("referred_user_id", user.id)
            .eq("conversion_type", "membership_upgrade")
            .maybeSingle();

          if (!existingReward) {
            // Record the membership conversion
            await supabase.from("referral_conversions").insert({
              referral_code_id: referralConversion.referral_code_id,
              referrer_id: referralConversion.referrer_id,
              referred_user_id: user.id,
              conversion_type: "membership_upgrade",
              points_awarded_referrer: REFERRAL_POINTS_REFERRER,
              points_awarded_referred: REFERRAL_POINTS_REFEREE,
              metadata: { tier: selectedTier, billing_cycle: billingCycle },
            });

            // Award points to referrer
            await supabase.rpc("award_points", {
              p_user_id: referralConversion.referrer_id,
              p_action_type: "referral_membership",
              p_points: REFERRAL_POINTS_REFERRER,
              p_description: `Referral bonus: your invite upgraded to ${TIER_NAMES[selectedTier]?.en}`,
              p_description_ar: `مكافأة إحالة: دعوتك ترقّت إلى ${TIER_NAMES[selectedTier]?.ar}`,
              p_reference_type: "referral",
              p_reference_id: user.id,
            });

            // Award points to referee (current user)
            await supabase.rpc("award_points", {
              p_user_id: user.id,
              p_action_type: "referral_membership_bonus",
              p_points: REFERRAL_POINTS_REFEREE,
              p_description: `Welcome bonus for upgrading via referral`,
              p_description_ar: `مكافأة ترحيبية للترقية عبر الإحالة`,
              p_reference_type: "referral",
              p_reference_id: referralConversion.referrer_id,
            });

            // Notify referrer
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
      setStep("success");
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setStep("confirm");
    },
  });

  const handleConfirm = () => {
    setStep("processing");
    processMutation.mutate();
  };

  if (!user) {
    navigate("/login");
    return null;
  }

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
              {isRenewal ? (isAr ? "تجديد العضوية" : "Renew Membership") : (isAr ? "ترقية العضوية" : "Upgrade Membership")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isAr ? `خطتك الحالية: ${TIER_NAMES[currentTier]?.ar}` : `Current plan: ${TIER_NAMES[currentTier]?.en}`}
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
            {/* Billing cycle */}
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

            {/* Plan cards */}
            <RadioGroup value={selectedTier} onValueChange={setSelectedTier}>
              <div className="grid gap-4 md:grid-cols-2">
                {TIERS.map((tier) => {
                  const TierIcon = tier.icon;
                  const tierPrice = billingCycle === "yearly" ? tier.yearly : tier.monthly;
                  const isSelected = selectedTier === tier.id;
                  const isCurrent = currentTier === tier.id;
                  const monthlySaving = billingCycle === "yearly" ? (tier.monthly * 12) - tier.yearly : 0;

                  return (
                    <Label key={tier.id} htmlFor={tier.id} className="cursor-pointer">
                      <Card className={cn(
                        "relative transition-all",
                        isSelected ? "ring-2 ring-primary shadow-md" : "hover:shadow-sm",
                        isCurrent ? "opacity-60" : ""
                      )}>
                        <CardContent className="p-5 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value={tier.id} id={tier.id} disabled={isCurrent} />
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
                          </div>
                        </CardContent>
                      </Card>
                    </Label>
                  );
                })}
              </div>
            </RadioGroup>

            <Button
              className="w-full gap-2"
              size="lg"
              disabled={selectedTier === currentTier}
              onClick={() => setStep("confirm")}
            >
              {isAr ? "متابعة" : "Continue"}
              <ArrowRight className="h-4 w-4" />
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selectedConfig && (
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${selectedConfig.bg}`}>
                        <selectedConfig.icon className={`h-5 w-5 ${selectedConfig.color}`} />
                      </div>
                    )}
                    <div>
                      <p className="font-bold">{TIER_NAMES[selectedTier]?.[isAr ? "ar" : "en"]}</p>
                      <p className="text-xs text-muted-foreground">
                        {billingCycle === "yearly" ? (isAr ? "اشتراك سنوي" : "Yearly subscription") : (isAr ? "اشتراك شهري" : "Monthly subscription")}
                      </p>
                    </div>
                  </div>
                  <p className="text-xl font-bold">{price} SAR</p>
                </div>

                <Separator />

                {savings > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-chart-2 font-medium">{isAr ? "التوفير" : "Savings"}</span>
                    <span className="text-chart-2 font-bold">-{savings} SAR</span>
                  </div>
                )}

                <div className="flex items-center justify-between font-bold text-lg">
                  <span>{isAr ? "المجموع" : "Total"}</span>
                  <span>{price} SAR</span>
                </div>

                <Separator />

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {isAr
                        ? `صالح لمدة ${period} ${period > 1 ? "أشهر" : "شهر"}`
                        : `Valid for ${period} month${period > 1 ? "s" : ""}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5" />
                    <span>{isAr ? "يمكنك الإلغاء في أي وقت" : "Cancel anytime"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep("plan")}>
                <ArrowLeft className="h-4 w-4 me-2" />
                {isAr ? "رجوع" : "Back"}
              </Button>
              <Button className="flex-1 gap-2" onClick={handleConfirm}>
                <CreditCard className="h-4 w-4" />
                {isRenewal ? (isAr ? "تجديد الآن" : "Renew Now") : (isAr ? "ترقية الآن" : "Upgrade Now")}
              </Button>
            </div>

            <p className="text-[10px] text-center text-muted-foreground">
              {isAr
                ? "بالضغط على الترقية، أنت توافق على شروط الخدمة وسياسة الخصوصية"
                : "By clicking upgrade, you agree to our Terms of Service and Privacy Policy"}
            </p>
          </div>
        )}

        {/* Processing */}
        {step === "processing" && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-16">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-lg font-medium">{isAr ? "جارٍ المعالجة..." : "Processing..."}</p>
              <p className="text-sm text-muted-foreground">
                {isAr ? "يرجى الانتظار" : "Please wait"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Success */}
        {step === "success" && (
          <Card className="border-primary/20">
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">
                {isRenewal ? (isAr ? "تم التجديد بنجاح! 🎉" : "Renewed Successfully! 🎉") : (isAr ? "تمت الترقية بنجاح! 🎉" : "Upgraded Successfully! 🎉")}
              </h2>
              <p className="text-muted-foreground max-w-sm">
                {isAr
                  ? `أنت الآن عضو في خطة ${TIER_NAMES[selectedTier]?.ar}. استمتع بجميع المميزات!`
                  : `You're now on the ${TIER_NAMES[selectedTier]?.en} plan. Enjoy all the benefits!`}
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
        )}
      </div>
    </div>
  );
}
