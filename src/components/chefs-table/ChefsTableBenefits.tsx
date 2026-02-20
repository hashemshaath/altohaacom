import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Shield, Users, FileText, Camera, Award, Target, Lightbulb } from "lucide-react";

interface ChefsTableBenefitsProps {
  isAr: boolean;
}

const benefits = [
  {
    icon: TrendingUp,
    en: "Market Your Products",
    ar: "سوّق منتجاتك",
    descEn: "Leverage professional chef endorsements and published reports to market your products to hotels, restaurants, and catering businesses.",
    descAr: "استفد من توصيات الطهاة المحترفين والتقارير المنشورة لتسويق منتجاتك للفنادق والمطاعم وشركات التموين.",
  },
  {
    icon: Shield,
    en: "Build Trust & Credibility",
    ar: "ابنِ الثقة والمصداقية",
    descEn: "Get your product validated by trusted, experienced chefs. Their stamp of approval builds confidence in your brand among decision-makers.",
    descAr: "احصل على تصديق منتجك من طهاة موثوقين وذوي خبرة. موافقتهم تبني الثقة في علامتك التجارية لدى صناع القرار.",
  },
  {
    icon: Target,
    en: "Improve Your Products",
    ar: "طوّر منتجاتك",
    descEn: "Receive detailed scorecards on taste, texture, aroma, versatility, and value — actionable insights to refine your products and meet professional standards.",
    descAr: "احصل على بطاقات تقييم مفصلة للطعم والقوام والرائحة والتنوع والقيمة — رؤى عملية لتحسين منتجاتك ومواكبة المعايير المهنية.",
  },
  {
    icon: Users,
    en: "Expert Chef Selection",
    ar: "اختيار طهاة متخصصين",
    descEn: "Our platform selects the right chefs and specialists matching your product category — meat experts for proteins, pastry chefs for bakery ingredients, and more.",
    descAr: "منصتنا تختار الطهاة والمتخصصين المناسبين لفئة منتجك — خبراء اللحوم للبروتينات، طهاة المعجنات لمكونات المخابز، والمزيد.",
  },
  {
    icon: FileText,
    en: "Comprehensive Reports",
    ar: "تقارير شاملة",
    descEn: "Get a detailed ingredient analysis, multi-criteria scorecard, cooking documentation, and a publishable report you can share with potential buyers.",
    descAr: "احصل على تحليل مفصل للمكونات، بطاقة تقييم متعددة المعايير، توثيق الطهي، وتقرير قابل للنشر يمكنك مشاركته مع المشترين المحتملين.",
  },
  {
    icon: Camera,
    en: "Documented Experience",
    ar: "تجربة موثّقة",
    descEn: "Every session is professionally documented with photos and videos of chefs cooking with your products — powerful marketing content ready to use.",
    descAr: "كل جلسة موثقة بشكل احترافي بالصور والفيديو لطهاة يطبخون بمنتجاتك — محتوى تسويقي قوي جاهز للاستخدام.",
  },
  {
    icon: Award,
    en: "Incentives for Companies",
    ar: "حوافز للشركات",
    descEn: "Approved products receive a Chef's Table seal, featured placement on the platform, and the chance to be included in our chef recommendation directory.",
    descAr: "المنتجات المعتمدة تحصل على ختم طاولة الشيف، ومكانة مميزة على المنصة، وفرصة الإدراج في دليل توصيات الطهاة.",
  },
  {
    icon: Lightbulb,
    en: "Tailored to Your Needs",
    ar: "مصممة حسب احتياجاتك",
    descEn: "Choose from on-site evaluation at a hotel, chef's own kitchen testing, or sample delivery — whichever suits your product and budget best.",
    descAr: "اختر بين التقييم في الموقع في فندق، أو الاختبار في مطبخ الشيف، أو توصيل العينات — أيهما يناسب منتجك وميزانيتك.",
  },
];

export function ChefsTableBenefits({ isAr }: ChefsTableBenefitsProps) {
  return (
    <section className="border-y border-border/30 bg-muted/30">
      <div className="container py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h2 className={`text-2xl font-black md:text-3xl lg:text-4xl ${!isAr ? "font-serif" : ""}`}>
            {isAr ? "لماذا طاولة الشيف؟" : "Why Chef's Table?"}
          </h2>
          <p className="mt-3 text-muted-foreground font-medium text-sm md:text-base max-w-xl mx-auto">
            {isAr
              ? "كيف تساعدك هذه الخدمة في تسويق منتجاتك وتطويرها لتلبية احتياجات الطهاة المحترفين"
              : "How this service helps you market and improve your products to meet the demands of professional chefs"}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {benefits.map((b, i) => (
            <Card key={i} className="border-border/40 bg-card/70 backdrop-blur-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                  <b.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-bold text-sm mb-2">{isAr ? b.ar : b.en}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{isAr ? b.descAr : b.descEn}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
