import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTrialInfo, useStartTrial } from "@/hooks/useMembershipTrial";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Crown, Star, Zap, Check, X, ArrowRight, Shield,
  Users, BarChart3, Globe, MessageSquare, Award,
  Headphones, BookOpen, ShoppingBag, Sparkles, Clock, Gift,
  Share2, History, CreditCard,
} from "lucide-react";
import { useMembershipFeatures, useFeatureTierMappings } from "@/hooks/useMembershipFeatures";
import { cn } from "@/lib/utils";

const TIER_CONFIG = [
  {
    id: "basic",
    icon: Zap,
    color: "text-muted-foreground",
    bg: "bg-muted/30",
    ring: "",
    monthly: 0,
    yearly: 0,
  },
  {
    id: "professional",
    icon: Star,
    color: "text-primary",
    bg: "bg-primary/5",
    ring: "ring-2 ring-primary shadow-lg",
    featured: true,
    monthly: 19,
    yearly: 190,
  },
  {
    id: "enterprise",
    icon: Crown,
    color: "text-chart-2",
    bg: "bg-chart-2/5",
    ring: "",
    monthly: 99,
    yearly: 990,
  },
];

const TIER_NAMES: Record<string, { en: string; ar: string }> = {
  basic: { en: "Basic", ar: "الأساسي" },
  professional: { en: "Professional", ar: "الاحترافي" },
  enterprise: { en: "Enterprise", ar: "المؤسسي" },
};

const CATEGORY_ICONS: Record<string, any> = {
  profile: Users,
  community: MessageSquare,
  content: BookOpen,
  commerce: ShoppingBag,
  analytics: BarChart3,
  support: Headphones,
  branding: Globe,
  competition: Award,
};

function getSavingsPercent(monthly: number, yearly: number): number {
  if (monthly === 0) return 0;
  return Math.round((1 - yearly / (monthly * 12)) * 100);
}

export default function MembershipPlans() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const { data: trialInfo } = useTrialInfo();
  const startTrial = useStartTrial();
  const { data: features = [] } = useMembershipFeatures();
  const { data: mappings = [] } = useFeatureTierMappings();

  // Current user's tier
  const { data: currentTier } = useQuery({
    queryKey: ["user-tier", user?.id],
    queryFn: async () => {
      if (!user?.id) return "basic";
      const { data } = await supabase
        .from("profiles")
        .select("membership_tier")
        .eq("user_id", user.id)
        .single();
      return data?.membership_tier || "basic";
    },
    enabled: !!user?.id,
  });

  // Build a lookup: featureId -> { basic, professional, enterprise }
  const tierLookup = new Map<string, Record<string, boolean>>();
  for (const m of mappings) {
    if (!tierLookup.has(m.feature_id)) {
      tierLookup.set(m.feature_id, { basic: false, professional: false, enterprise: false });
    }
    tierLookup.get(m.feature_id)![m.tier] = m.is_enabled;
  }

  // Group features by category
  const categories = new Map<string, typeof features>();
  for (const f of features) {
    if (!categories.has(f.category)) categories.set(f.category, []);
    categories.get(f.category)!.push(f);
  }

  const handleUpgrade = (tier: string) => {
    if (!user) {
      navigate("/login");
    } else {
      navigate(`/membership/checkout?tier=${tier}`);
    }
  };

  const formatPrice = (tier: typeof TIER_CONFIG[number]) => {
    if (tier.monthly === 0) return isAr ? "مجاني" : "Free";
    const price = billingCycle === "yearly" ? tier.yearly : tier.monthly;
    const suffix = billingCycle === "yearly"
      ? (isAr ? "/سنة" : "/yr")
      : (isAr ? "/شهر" : "/mo");
    return `${price} ${isAr ? "ر.س" : "SAR"}${suffix}`;
  };

  const getMonthlyEquivalent = (tier: typeof TIER_CONFIG[number]) => {
    if (billingCycle !== "yearly" || tier.yearly === 0) return null;
    const monthlyEquiv = Math.round(tier.yearly / 12);
    return `${monthlyEquiv} ${isAr ? "ر.س/شهر" : "SAR/mo"}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Trial Banner */}
      {trialInfo?.isInTrial && (
        <div className="bg-primary/10 border-b border-primary/20">
          <div className="container py-3 flex items-center justify-center gap-3 text-sm">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-medium">
              {isAr
                ? `تجربتك المجانية لـ ${trialInfo.trialTier} — ${trialInfo.daysRemaining} يوم متبقي`
                : `Your ${trialInfo.trialTier} trial — ${trialInfo.daysRemaining} day${trialInfo.daysRemaining !== 1 ? "s" : ""} remaining`}
            </span>
            <Button size="sm" variant="default" className="h-7 text-xs gap-1" onClick={() => navigate("/profile?tab=membership")}>
              <Crown className="h-3 w-3" />
              {isAr ? "ترقية الآن" : "Upgrade Now"}
            </Button>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5" />
        <div className="absolute -top-32 -end-32 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute -bottom-20 -start-20 h-48 w-48 rounded-full bg-chart-2/8 blur-3xl" />

        <div className="relative container py-16 md:py-24 text-center space-y-4">
          <Badge variant="secondary" className="gap-1.5 text-xs">
            <Sparkles className="h-3 w-3" />
            {isAr ? "خطط العضوية" : "Membership Plans"}
          </Badge>
          <h1 className="text-3xl md:text-5xl font-serif font-bold tracking-tight">
            {isAr ? "اختر الخطة المناسبة لك" : "Choose Your Plan"}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            {isAr
              ? "اكتشف المزايا الحصرية لكل مستوى عضوية وابدأ رحلتك الاحترافية"
              : "Discover exclusive benefits for each tier and start your professional journey"}
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <div className="relative inline-flex items-center rounded-full border bg-muted/50 p-1">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={cn(
                  "relative z-10 rounded-full px-5 py-2 text-sm font-medium transition-all",
                  billingCycle === "monthly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isAr ? "شهري" : "Monthly"}
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={cn(
                  "relative z-10 rounded-full px-5 py-2 text-sm font-medium transition-all",
                  billingCycle === "yearly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isAr ? "سنوي" : "Yearly"}
              </button>
            </div>
            {billingCycle === "yearly" && (
              <Badge variant="secondary" className="bg-chart-2/10 text-chart-2 border-chart-2/20 text-xs animate-in fade-in slide-in-from-left-2">
                {isAr ? "وفّر حتى 17%" : "Save up to 17%"}
              </Badge>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="container py-12 md:py-16">
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {TIER_CONFIG.map((tier) => {
            const TierIcon = tier.icon;
            const isCurrentTier = currentTier === tier.id;
            const featureCount = features.filter((f) => {
              const lookup = tierLookup.get(f.id);
              return lookup?.[tier.id];
            }).length;
            const savings = getSavingsPercent(tier.monthly, tier.yearly);
            const monthlyEquiv = getMonthlyEquivalent(tier);

            return (
              <Card
                key={tier.id}
                className={`relative transition-all hover:shadow-md ${tier.ring} ${isCurrentTier ? "border-primary/30" : ""}`}
              >
                {tier.featured && (
                  <div className="absolute -top-3 start-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-primary shadow-md">
                      <Star className="me-1 h-3 w-3" />
                      {isAr ? "الأكثر شعبية" : "Most Popular"}
                    </Badge>
                  </div>
                )}

                {isCurrentTier && (
                  <div className="absolute top-3 end-3">
                    <Badge variant="outline" className="gap-1 text-[10px] border-primary/40 text-primary">
                      <Shield className="h-3 w-3" />
                      {isAr ? "الحالي" : "Current"}
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-2 pt-8">
                  <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${tier.bg}`}>
                    <TierIcon className={`h-7 w-7 ${tier.color}`} />
                  </div>
                  <CardTitle className="text-xl">
                    {TIER_NAMES[tier.id]?.[isAr ? "ar" : "en"]}
                  </CardTitle>
                  <div className="mt-2 space-y-1">
                    <p className="text-3xl font-bold">
                      {formatPrice(tier)}
                    </p>
                    {billingCycle === "yearly" && monthlyEquiv && (
                      <p className="text-xs text-muted-foreground">
                        ≈ {monthlyEquiv}
                      </p>
                    )}
                    {billingCycle === "yearly" && savings > 0 && (
                      <Badge variant="secondary" className="bg-chart-2/10 text-chart-2 border-chart-2/20 text-[10px]">
                        {isAr ? `وفّر ${savings}%` : `Save ${savings}%`}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <Separator />
                  <p className="text-sm text-center text-muted-foreground">
                    {featureCount} {isAr ? "ميزة متاحة" : "features included"}
                  </p>

                  {/* Top features preview */}
                  <ul className="space-y-2">
                    {features.slice(0, 5).map((f) => {
                      const enabled = tierLookup.get(f.id)?.[tier.id] ?? false;
                      return (
                        <li key={f.id} className="flex items-center gap-2 text-sm">
                          {enabled ? (
                            <Check className="h-4 w-4 text-primary shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                          )}
                          <span className={enabled ? "" : "text-muted-foreground/50"}>
                            {isAr ? (f.name_ar || f.name) : f.name}
                          </span>
                        </li>
                      );
                    })}
                    {features.length > 5 && (
                      <li className="text-xs text-muted-foreground text-center pt-1">
                        +{features.length - 5} {isAr ? "ميزة أخرى" : "more features"}
                      </li>
                    )}
                  </ul>

                  <div className="pt-2 space-y-2">
                    {isCurrentTier ? (
                      <Button variant="outline" disabled className="w-full">
                        {isAr ? "خطتك الحالية" : "Current Plan"}
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant={tier.featured ? "default" : "outline"}
                          className="w-full gap-2"
                          onClick={() => handleUpgrade(tier.id)}
                        >
                          {tier.id === "basic"
                            ? (isAr ? "البدء مجاناً" : "Get Started Free")
                            : (isAr ? "ترقية الآن" : "Upgrade Now")}
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                        {tier.id !== "basic" && !trialInfo?.isInTrial && !(trialInfo?.trialTier === tier.id && trialInfo?.trialExpired) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full gap-1.5 text-xs text-muted-foreground"
                            disabled={startTrial.isPending}
                            onClick={() => {
                              if (!user) { navigate("/login"); return; }
                              startTrial.mutate({ tier: tier.id });
                            }}
                          >
                            <Gift className="h-3.5 w-3.5" />
                            {isAr ? "تجربة مجانية 14 يوم" : "Start 14-Day Free Trial"}
                          </Button>
                        )}
                        {tier.id !== "basic" && trialInfo?.trialTier === tier.id && trialInfo?.trialExpired && (
                          <p className="text-[10px] text-center text-muted-foreground">
                            {isAr ? "تم استخدام التجربة المجانية" : "Free trial already used"}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Full Feature Comparison */}
      <section className="container pb-16 md:pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-serif font-bold">
              {isAr ? "مقارنة المميزات الكاملة" : "Full Feature Comparison"}
            </h2>
            <p className="text-muted-foreground mt-2">
              {isAr ? "تعرّف على كل ما تتضمنه كل خطة" : "See everything included in each plan"}
            </p>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-start py-4 px-4 md:px-6 text-sm font-medium text-muted-foreground min-w-[200px]">
                        {isAr ? "الميزة" : "Feature"}
                      </th>
                      {TIER_CONFIG.map((tier) => (
                        <th key={tier.id} className="text-center py-4 px-3 md:px-6">
                          <div className="flex flex-col items-center gap-1">
                            <tier.icon className={`h-5 w-5 ${tier.color}`} />
                            <span className={`text-sm font-semibold ${tier.color}`}>
                              {TIER_NAMES[tier.id]?.[isAr ? "ar" : "en"]}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(categories.entries()).map(([category, catFeatures]) => {
                      const CatIcon = CATEGORY_ICONS[category] || Shield;
                      return (
                        <>
                          <tr key={`cat-${category}`} className="bg-muted/15">
                            <td colSpan={4} className="py-2.5 px-4 md:px-6">
                              <div className="flex items-center gap-2">
                                <CatIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                  {category}
                                </span>
                              </div>
                            </td>
                          </tr>
                          {catFeatures.map((feature) => (
                            <tr key={feature.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                              <td className="py-3 px-4 md:px-6 text-sm">
                                <div>
                                  <p className="font-medium">{isAr ? (feature.name_ar || feature.name) : feature.name}</p>
                                  {feature.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {isAr ? (feature.description_ar || feature.description) : feature.description}
                                    </p>
                                  )}
                                </div>
                              </td>
                              {TIER_CONFIG.map((tier) => {
                                const enabled = tierLookup.get(feature.id)?.[tier.id] ?? false;
                                return (
                                  <td key={tier.id} className="text-center py-3 px-3 md:px-6">
                                    {enabled ? (
                                      <Check className="h-5 w-5 text-primary mx-auto" />
                                    ) : (
                                      <X className="h-4 w-4 text-muted-foreground/25 mx-auto" />
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Membership Hub */}
          {user && (
            <div className="mt-12 space-y-4">
              <div className="text-center">
                <h3 className="text-xl font-bold">
                  {isAr ? "مركز العضوية" : "Membership Hub"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {isAr ? "إدارة عضويتك والاستفادة من جميع المزايا" : "Manage your membership and access all benefits"}
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: CreditCard, label: isAr ? "الدفع والترقية" : "Checkout & Upgrade", desc: isAr ? "ترقية أو تجديد عضويتك" : "Upgrade or renew your plan", href: "/membership/checkout?tier=professional" },
                  { icon: Gift, label: isAr ? "إهداء عضوية" : "Gift a Membership", desc: isAr ? "أهدِ عضوية لصديق" : "Send a membership as a gift", href: "/membership/gift" },
                  { icon: Share2, label: isAr ? "برنامج الإحالة" : "Referral Program", desc: isAr ? "ادعُ أصدقاءك واكسب نقاط" : "Invite friends & earn points", href: "/membership/referral" },
                  { icon: History, label: isAr ? "سجل الهدايا" : "Gifts History", desc: isAr ? "تتبع الهدايا المرسلة والمستلمة" : "Track sent & received gifts", href: "/membership/gifts" },
                ].map((item) => (
                  <Card
                    key={item.href}
                    className="group cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
                    onClick={() => navigate(item.href)}
                  >
                    <CardContent className="pt-5 pb-4 text-center space-y-2">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-12 text-center space-y-4">
            <h3 className="text-xl font-bold">
              {isAr ? "جاهز للبدء؟" : "Ready to get started?"}
            </h3>
            <p className="text-muted-foreground">
              {isAr
                ? "انضم إلى آلاف المحترفين الذين يستخدمون منصتنا"
                : "Join thousands of professionals using our platform"}
            </p>
            <Button
              size="lg"
              className="gap-2 rounded-xl shadow-lg shadow-primary/20"
              onClick={() => handleUpgrade("professional")}
            >
              <Crown className="h-5 w-5" />
              {isAr ? "ابدأ الآن" : "Get Started Now"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
