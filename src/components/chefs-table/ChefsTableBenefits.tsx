import { memo } from "react";
import { TrendingUp, Shield, Users, FileText, Camera, Award, Target, Lightbulb } from "lucide-react";

interface ChefsTableBenefitsProps {
  isAr: boolean;
}

const benefits = [
  {
    icon: TrendingUp,
    color: "bg-chart-1/10 text-chart-1",
    en: "Market Your Products",
    ar: "سوّق منتجاتك",
    descEn: "Leverage professional chef endorsements and published reports to market your products to hotels, restaurants, and catering businesses.",
    descAr: "استفد من توصيات الطهاة المحترفين والتقارير المنشورة لتسويق منتجاتك للفنادق والمطاعم وشركات التموين.",
  },
  {
    icon: Shield,
    color: "bg-chart-2/10 text-chart-2",
    en: "Build Trust & Credibility",
    ar: "ابنِ الثقة والمصداقية",
    descEn: "Get your product validated by trusted, experienced chefs. Their stamp of approval builds confidence in your brand.",
    descAr: "احصل على تصديق منتجك من طهاة موثوقين وذوي خبرة. موافقتهم تبني الثقة في علامتك التجارية.",
  },
  {
    icon: Target,
    color: "bg-chart-3/10 text-chart-3",
    en: "Improve Your Products",
    ar: "طوّر منتجاتك",
    descEn: "Receive detailed scorecards on taste, texture, aroma, versatility, and value — actionable insights to refine your products.",
    descAr: "احصل على بطاقات تقييم مفصلة للطعم والقوام والرائحة والتنوع والقيمة — رؤى عملية لتحسين منتجاتك.",
  },
  {
    icon: Users,
    color: "bg-chart-4/10 text-chart-4",
    en: "Expert Chef Selection",
    ar: "اختيار طهاة متخصصين",
    descEn: "Our platform selects the right chefs matching your product category — meat experts for proteins, pastry chefs for bakery ingredients.",
    descAr: "منصتنا تختار الطهاة المناسبين لفئة منتجك — خبراء اللحوم للبروتينات، طهاة المعجنات لمكونات المخابز.",
  },
  {
    icon: FileText,
    color: "bg-chart-5/10 text-chart-5",
    en: "Comprehensive Reports",
    ar: "تقارير شاملة",
    descEn: "Get detailed ingredient analysis, multi-criteria scorecards, cooking documentation, and a publishable report.",
    descAr: "احصل على تحليل مفصل للمكونات، بطاقة تقييم متعددة المعايير، توثيق الطهي، وتقرير قابل للنشر.",
  },
  {
    icon: Camera,
    color: "bg-primary/10 text-primary",
    en: "Documented Experience",
    ar: "تجربة موثّقة",
    descEn: "Every session is professionally documented with photos and videos — powerful marketing content ready to use.",
    descAr: "كل جلسة موثقة بشكل احترافي بالصور والفيديو — محتوى تسويقي قوي جاهز للاستخدام.",
  },
  {
    icon: Award,
    color: "bg-chart-1/10 text-chart-1",
    en: "Incentives for Companies",
    ar: "حوافز للشركات",
    descEn: "Approved products receive a Chef's Table seal, featured placement, and inclusion in our chef recommendation directory.",
    descAr: "المنتجات المعتمدة تحصل على ختم طاولة الشيف، ومكانة مميزة، وفرصة الإدراج في دليل توصيات الطهاة.",
  },
  {
    icon: Lightbulb,
    color: "bg-chart-2/10 text-chart-2",
    en: "Tailored to Your Needs",
    ar: "مصممة حسب احتياجاتك",
    descEn: "Choose from on-site evaluation, chef's kitchen testing, or sample delivery — whichever suits your product best.",
    descAr: "اختر بين التقييم في الموقع، أو الاختبار في مطبخ الشيف، أو توصيل العينات — أيهما يناسب منتجك.",
  },
];

export const ChefsTableBenefits = memo(function ChefsTableBenefits({ isAr }: ChefsTableBenefitsProps) {
  return (
    <section className="bg-muted/30">
      <div className="container py-16 md:py-24">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-14">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary mb-4">
            {isAr ? "المزايا" : "Benefits"}
          </span>
          <h2 className="text-2xl font-black md:text-3xl lg:text-4xl text-foreground">
            {isAr ? "لماذا طاولة الشيف؟" : "Why Chef's Table?"}
          </h2>
          <p className="mt-3 text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            {isAr
              ? "كيف تساعدك هذه الخدمة في تسويق منتجاتك وتطويرها لتلبية احتياجات الطهاة المحترفين"
              : "How this service helps you market and improve your products to meet the demands of professional chefs"}
          </p>
        </div>

        {/* Grid — first row 4 cols, second row 4 cols */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {benefits.map((b, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-border/40 bg-card p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/20 active:scale-[0.98]"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${b.color} mb-4 transition-transform duration-300 group-hover:scale-110`}>
                <b.icon className="h-5.5 w-5.5" />
              </div>
              <h3 className="font-bold text-foreground mb-2">{isAr ? b.ar : b.en}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{isAr ? b.descAr : b.descEn}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
