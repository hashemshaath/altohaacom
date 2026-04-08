import { memo } from "react";
import { Check, Star, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  isAr: boolean;
  onRequestClick: () => void;
}

const plans = [
  {
    id: "starter",
    icon: Zap,
    nameEn: "Starter",
    nameAr: "الأساسية",
    priceEn: "From SAR 2,500",
    priceAr: "من 2,500 ر.س",
    descEn: "Perfect for small brands wanting initial feedback",
    descAr: "مثالية للعلامات التجارية الصغيرة التي تريد ملاحظات أولية",
    color: "border-border/60",
    badge: null,
    features: [
      { en: "2 Professional Chefs", ar: "2 شيف محترف" },
      { en: "Basic Scorecard Report", ar: "تقرير بطاقة تقييم أساسي" },
      { en: "Photo Documentation", ar: "توثيق بالصور" },
      { en: "Digital Report (PDF)", ar: "تقرير رقمي (PDF)" },
      { en: "7-Day Delivery", ar: "تسليم خلال 7 أيام" },
    ],
  },
  {
    id: "professional",
    icon: Star,
    nameEn: "Professional",
    nameAr: "الاحترافية",
    priceEn: "From SAR 5,500",
    priceAr: "من 5,500 ر.س",
    descEn: "Comprehensive evaluation with marketing assets",
    descAr: "تقييم شامل مع أصول تسويقية",
    color: "border-primary shadow-lg shadow-primary/10",
    badge: { en: "Most Popular", ar: "الأكثر طلباً" },
    features: [
      { en: "4 Specialist Chefs", ar: "4 شيف متخصص" },
      { en: "Multi-Criteria Analysis", ar: "تحليل متعدد المعايير" },
      { en: "Photo & Video Coverage", ar: "تغطية صور وفيديو" },
      { en: "Publishable Report", ar: "تقرير قابل للنشر" },
      { en: "Chef Endorsement Seal", ar: "ختم توصية الشيف" },
      { en: "5-Day Priority Delivery", ar: "تسليم أولوية خلال 5 أيام" },
    ],
  },
  {
    id: "enterprise",
    icon: Crown,
    nameEn: "Enterprise",
    nameAr: "المؤسسية",
    priceEn: "Custom Pricing",
    priceAr: "أسعار مخصصة",
    descEn: "Full-scale evaluation for large companies",
    descAr: "تقييم شامل للشركات الكبرى",
    color: "border-border/60",
    badge: null,
    features: [
      { en: "6+ Expert Chefs", ar: "6+ شيف خبير" },
      { en: "Multi-Product Evaluation", ar: "تقييم منتجات متعددة" },
      { en: "Professional Video Production", ar: "إنتاج فيديو احترافي" },
      { en: "Market Positioning Report", ar: "تقرير تموضع سوقي" },
      { en: "Dedicated Account Manager", ar: "مدير حساب مخصص" },
      { en: "Ongoing Support & Re-evaluation", ar: "دعم مستمر وإعادة تقييم" },
    ],
  },
];

export const ChefsTablePricing = memo(function ChefsTablePricing({ isAr, onRequestClick }: Props) {
  return (
    <section className="bg-background border-t border-border/30">
      <div className="container py-16 md:py-24">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-14">
          <span className="inline-flex items-center gap-2 rounded-full bg-chart-5/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-chart-5 mb-4">
            {isAr ? "الباقات" : "Packages"}
          </span>
          <h2 className="text-2xl font-black md:text-3xl lg:text-4xl text-foreground">
            {isAr ? "اختر الباقة المناسبة لك" : "Choose the Right Package"}
          </h2>
          <p className="mt-3 text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            {isAr
              ? "باقات مرنة تناسب جميع أحجام الشركات واحتياجات التقييم"
              : "Flexible packages for all company sizes and evaluation needs"}
          </p>
        </div>

        {/* Plans Grid */}
        <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border-2 bg-card p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${plan.color}`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 start-1/2 -translate-x-1/2 rtl:translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground shadow-lg">
                    <Star className="h-3 w-3 fill-current" />
                    {isAr ? plan.badge.ar : plan.badge.en}
                  </span>
                </div>
              )}

              {/* Icon & Name */}
              <div className="flex items-center gap-3 mb-4 mt-1">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <plan.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground">{isAr ? plan.nameAr : plan.nameEn}</h3>
                </div>
              </div>

              {/* Price */}
              <div className="mb-2">
                <span className="text-2xl font-black text-foreground">{isAr ? plan.priceAr : plan.priceEn}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">{isAr ? plan.descAr : plan.descEn}</p>

              {/* Features */}
              <ul className="flex-1 space-y-3 mb-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{isAr ? f.ar : f.en}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                onClick={onRequestClick}
                variant={plan.id === "professional" ? "default" : "outline"}
                className="w-full rounded-xl font-bold"
              >
                {isAr ? "اطلب الآن" : "Get Started"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
