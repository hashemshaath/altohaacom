import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Crown, Star, Zap, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    id: "free",
    nameEn: "Free",
    nameAr: "مجاني",
    price: 0,
    icon: Zap,
    color: "text-muted-foreground",
    featuresEn: ["Basic profile", "Browse competitions", "Community access", "5 recipe uploads"],
    featuresAr: ["ملف شخصي أساسي", "تصفح المسابقات", "الوصول للمجتمع", "5 وصفات"],
  },
  {
    id: "professional",
    nameEn: "Professional",
    nameAr: "احترافي",
    price: 49,
    icon: Star,
    color: "text-primary",
    popular: true,
    featuresEn: ["Everything in Free", "Unlimited recipes", "Priority registration", "Digital certificate", "Analytics dashboard", "Verified badge"],
    featuresAr: ["كل مميزات المجاني", "وصفات غير محدودة", "تسجيل أولوية", "شهادة رقمية", "لوحة تحليلات", "شارة التوثيق"],
  },
  {
    id: "enterprise",
    nameEn: "Enterprise",
    nameAr: "مؤسسي",
    price: 199,
    icon: Crown,
    color: "text-amber-500",
    featuresEn: ["Everything in Professional", "Team management", "Custom branding", "API access", "Dedicated support", "White-label certificates", "Priority judging"],
    featuresAr: ["كل مميزات الاحترافي", "إدارة الفريق", "علامة تجارية مخصصة", "وصول API", "دعم مخصص", "شهادات مخصصة", "أولوية التحكيم"],
  },
];

export default function SubscriptionPlans() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const { data: currentMembership } = useQuery({
    queryKey: ["my-membership", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("membership_cards")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const currentTier = (currentMembership as any)?.tier || "free";

  return (
    <div className="space-y-6">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold">{isAr ? "اختر خطتك" : "Choose Your Plan"}</h2>
        <p className="text-muted-foreground mt-2">
          {isAr ? "ارتقِ بمسيرتك المهنية مع خطط تناسب احتياجاتك" : "Elevate your culinary career with plans that fit your needs"}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map(plan => {
          const isCurrent = currentTier === plan.id || (currentTier === "bronze" && plan.id === "free");
          const features = isAr ? plan.featuresAr : plan.featuresEn;

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col transition-all duration-200",
                plan.popular && "border-primary shadow-lg scale-[1.02]",
                selectedPlan === plan.id && "ring-2 ring-primary"
              )}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-4">
                  {isAr ? "الأكثر شعبية" : "Most Popular"}
                </Badge>
              )}
              <CardHeader className="text-center pb-2">
                <plan.icon className={cn("h-8 w-8 mx-auto mb-2", plan.color)} />
                <CardTitle>{isAr ? plan.nameAr : plan.nameEn}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">
                    {plan.price === 0 ? (isAr ? "مجاني" : "Free") : `${plan.price} SAR`}
                  </span>
                  {plan.price > 0 && <span className="text-muted-foreground">/{isAr ? "شهر" : "mo"}</span>}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2.5">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  disabled={isCurrent}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {isCurrent
                    ? (isAr ? "خطتك الحالية" : "Current Plan")
                    : (isAr ? "اختيار الخطة" : "Select Plan")}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Security note */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
          <Shield className="h-3.5 w-3.5" />
          {isAr ? "الدفع الآمن عبر بوابة الدفع المعتمدة" : "Secure payments via certified payment gateway"}
        </p>
      </div>
    </div>
  );
}
