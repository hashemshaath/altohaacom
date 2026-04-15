import { memo } from "react";
import { Building2, ChefHat, Package, Star, FileCheck, Megaphone } from "lucide-react";

interface ChefsTableHowItWorksProps {
  isAr: boolean;
}

const steps = [
  {
    icon: Building2,
    color: "bg-chart-1 text-primary-foreground",
    en: "Submit Your Request",
    ar: "قدّم طلبك",
    descEn: "Fill out a simple form with your product details, brand info, and preferred evaluation method.",
    descAr: "املأ نموذجًا بسيطًا بتفاصيل منتجك ومعلومات العلامة التجارية وطريقة التقييم المفضلة.",
  },
  {
    icon: ChefHat,
    color: "bg-chart-2 text-primary-foreground",
    en: "We Select the Right Chefs",
    ar: "نختار الطهاة المناسبين",
    descEn: "Our platform matches your product with specialist chefs — meat experts, pastry masters, or spice connoisseurs.",
    descAr: "منصتنا توفق بين منتجك والطهاة المتخصصين — خبراء اللحوم أو أساتذة المعجنات أو خبراء البهارات.",
  },
  {
    icon: Package,
    color: "bg-chart-3 text-primary-foreground",
    en: "Cook & Document",
    ar: "الطهي والتوثيق",
    descEn: "Chefs prepare real dishes using your products. The entire experience is documented with professional photos and videos.",
    descAr: "يحضّر الطهاة أطباقًا حقيقية باستخدام منتجاتك. يتم توثيق التجربة بصور وفيديوهات احترافية.",
  },
  {
    icon: Star,
    color: "bg-chart-4 text-primary-foreground",
    en: "Detailed Evaluation",
    ar: "تقييم مفصل",
    descEn: "Each chef scores your product on taste, texture, aroma, versatility, value, and presentation.",
    descAr: "يقيّم كل شيف منتجك على الطعم والقوام والرائحة والتنوع والقيمة والعرض.",
  },
  {
    icon: FileCheck,
    color: "bg-chart-5 text-primary-foreground",
    en: "Full Report & Analysis",
    ar: "تقرير كامل وتحليل",
    descEn: "Receive a comprehensive report with ingredient analysis, cooking insights, and improvement suggestions.",
    descAr: "احصل على تقرير شامل مع تحليل المكونات وملاحظات الطهي واقتراحات التحسين.",
  },
  {
    icon: Megaphone,
    color: "bg-primary text-primary-foreground",
    en: "Publishable Endorsements",
    ar: "توصيات قابلة للنشر",
    descEn: "Use chef endorsements, photos, and the Chef's Table seal in your marketing materials.",
    descAr: "استخدم توصيات الطهاة والصور وختم طاولة الشيف في موادك التسويقية.",
  },
];

export const ChefsTableHowItWorks = memo(function ChefsTableHowItWorks({ isAr }: ChefsTableHowItWorksProps) {
  return (
    <section className="bg-background">
      <div className="container py-16 md:py-24">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-14">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary mb-4">
            {isAr ? "آلية العمل" : "Process"}
          </span>
          <h2 className="text-2xl font-black md:text-3xl lg:text-4xl text-foreground">
            {isAr ? "كيف تعمل الخدمة؟" : "How Does It Work?"}
          </h2>
          <p className="mt-3 text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            {isAr
              ? "من تقديم الطلب إلى الحصول على تقرير مهني شامل — في ستة خطوات بسيطة"
              : "From submitting your request to receiving a comprehensive professional report — in six simple steps"}
          </p>
        </div>

        {/* Steps Grid */}
        <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {steps.map((step, i) => (
            <div
              key={i}
              className="group relative rounded-2xl border border-border/40 bg-card p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/20 active:scale-[0.98]"
            >
              {/* Step number */}
              <div className="absolute top-5 end-5 text-4xl font-black text-muted-foreground/10 select-none">
                {String(i + 1).padStart(2, "0")}
              </div>

              {/* Icon */}
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${step.color} mb-4 shadow-sm transition-transform duration-300 group-hover:scale-110`}>
                <step.icon className="h-5.5 w-5.5" />
              </div>

              <h3 className="font-bold text-foreground mb-2">{isAr ? step.ar : step.en}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{isAr ? step.descAr : step.descEn}</p>

              {/* Connector arrow for desktop — between cards */}
              {i < steps.length - 1 && i % 3 !== 2 && (
                <div className="absolute -end-3 top-1/2 -translate-y-1/2 hidden lg:block">
                  <div className="h-px w-6 bg-border/60" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
