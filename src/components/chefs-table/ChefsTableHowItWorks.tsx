import { memo } from "react";
import { Building2, ChefHat, Package, Star, FileCheck, Megaphone } from "lucide-react";

interface ChefsTableHowItWorksProps {
  isAr: boolean;
}

const steps = [
  {
    icon: Building2,
    en: "Submit Your Request",
    ar: "قدّم طلبك",
    descEn: "Fill out a simple form with your product details, brand info, and preferred evaluation method. Registered companies are auto-detected.",
    descAr: "املأ نموذجًا بسيطًا بتفاصيل منتجك ومعلومات العلامة التجارية وطريقة التقييم المفضلة. الشركات المسجلة يتم اكتشافها تلقائيًا.",
  },
  {
    icon: ChefHat,
    en: "We Select the Right Chefs",
    ar: "نختار الطهاة المناسبين",
    descEn: "Our platform matches your product with specialist chefs — whether you need meat experts, pastry masters, or spice connoisseurs.",
    descAr: "منصتنا توفق بين منتجك والطهاة المتخصصين — سواء كنت بحاجة لخبراء اللحوم أو أساتذة المعجنات أو خبراء البهارات.",
  },
  {
    icon: Package,
    en: "Cook & Document",
    ar: "الطهي والتوثيق",
    descEn: "Chefs prepare real dishes using your products. The entire experience is documented with professional photos and videos.",
    descAr: "يحضّر الطهاة أطباقًا حقيقية باستخدام منتجاتك. يتم توثيق التجربة الكاملة بصور وفيديوهات احترافية.",
  },
  {
    icon: Star,
    en: "Detailed Evaluation",
    ar: "تقييم مفصل",
    descEn: "Each chef scores your product on taste, texture, aroma, versatility, value, and presentation using our professional scorecard.",
    descAr: "يقيّم كل شيف منتجك على الطعم والقوام والرائحة والتنوع والقيمة والعرض باستخدام بطاقة التقييم المهنية.",
  },
  {
    icon: FileCheck,
    en: "Full Report & Analysis",
    ar: "تقرير كامل وتحليل",
    descEn: "Receive a comprehensive report with ingredient analysis, cooking insights, improvement suggestions, and chef recommendations.",
    descAr: "احصل على تقرير شامل مع تحليل المكونات، ملاحظات الطهي، اقتراحات التحسين، وتوصيات الطهاة.",
  },
  {
    icon: Megaphone,
    en: "Publishable Endorsements",
    ar: "توصيات قابلة للنشر",
    descEn: "Use chef endorsements, photos, and the Chef's Table seal in your marketing materials to reach hotels, restaurants, and distributors.",
    descAr: "استخدم توصيات الطهاة والصور وختم طاولة الشيف في موادك التسويقية للوصول للفنادق والمطاعم والموزعين.",
  },
];

export const ChefsTableHowItWorks = memo(function ChefsTableHowItWorks({ isAr }: ChefsTableHowItWorksProps) {
  return (
    <section className="container py-16 md:py-20">
      <div className="mx-auto max-w-2xl text-center mb-12">
        <h2 className="font-serif text-2xl font-black md:text-3xl lg:text-4xl">
          {isAr ? "كيف تعمل الخدمة؟" : "How Does It Work?"}
        </h2>
        <p className="mt-3 text-muted-foreground font-medium text-sm md:text-base max-w-xl mx-auto">
          {isAr
            ? "من تقديم الطلب إلى الحصول على تقرير مهني شامل — في ستة خطوات بسيطة"
            : "From submitting your request to receiving a comprehensive professional report — in six simple steps"}
        </p>
      </div>

      <div className="relative mx-auto max-w-4xl">
        {/* Vertical Line */}
        <div className="absolute start-6 md:start-1/2 top-0 bottom-0 w-px bg-border/60 -translate-x-1/2 hidden sm:block" />

        <div className="space-y-8">
          {steps.map((step, i) => (
            <div key={i} className={`relative flex items-start gap-5 sm:gap-8 ${i % 2 === 1 ? "md:flex-row-reverse md:text-end" : ""}`}>
              {/* Step Number */}
              <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-black text-sm shadow-lg shadow-primary/30">
                {i + 1}
              </div>
              {/* Content */}
              <div className="flex-1 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <step.icon className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-sm">{isAr ? step.ar : step.en}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{isAr ? step.descAr : step.descEn}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
