import { memo } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

interface Props {
  isAr: boolean;
}

const faqs = [
  {
    qEn: "How long does the evaluation process take?",
    qAr: "كم يستغرق عملية التقييم؟",
    aEn: "The standard evaluation takes 5–7 business days from product receipt to final report delivery. Priority packages can be completed in 3–5 days.",
    aAr: "يستغرق التقييم القياسي من 5 إلى 7 أيام عمل من استلام المنتج إلى تسليم التقرير النهائي. الباقات ذات الأولوية يمكن إنجازها في 3 إلى 5 أيام.",
  },
  {
    qEn: "How are the chefs selected for my product?",
    qAr: "كيف يتم اختيار الطهاة لمنتجي؟",
    aEn: "We match your product category with specialist chefs. For example, meat products are evaluated by chefs with expertise in proteins, while bakery ingredients go to pastry specialists.",
    aAr: "نطابق فئة منتجك مع طهاة متخصصين. على سبيل المثال، منتجات اللحوم يتم تقييمها بواسطة طهاة خبراء في البروتينات، بينما مكونات المخابز تذهب لمتخصصي المعجنات.",
  },
  {
    qEn: "Can I use the report in my marketing materials?",
    qAr: "هل يمكنني استخدام التقرير في موادي التسويقية؟",
    aEn: "Yes! Professional and Enterprise packages include publishable reports and chef endorsements that you can use in your marketing campaigns, website, and product packaging.",
    aAr: "نعم! الباقات الاحترافية والمؤسسية تتضمن تقارير قابلة للنشر وتوصيات طهاة يمكنك استخدامها في حملاتك التسويقية وموقعك الإلكتروني وتغليف المنتجات.",
  },
  {
    qEn: "What evaluation criteria are used?",
    qAr: "ما هي معايير التقييم المستخدمة؟",
    aEn: "Our chefs evaluate products across multiple dimensions including taste, texture, aroma, visual appeal, versatility, value for money, and overall professional recommendation. Each criterion is scored on a weighted scale.",
    aAr: "يقيّم طهاتنا المنتجات عبر أبعاد متعددة تشمل الطعم والقوام والرائحة والمظهر والتنوع والقيمة مقابل المال والتوصية المهنية الشاملة. يتم تقييم كل معيار على مقياس موزون.",
  },
  {
    qEn: "Can I evaluate multiple products at once?",
    qAr: "هل يمكنني تقييم عدة منتجات في وقت واحد؟",
    aEn: "Yes, our Enterprise package supports multi-product evaluations. You can also bundle multiple products in custom sessions for comparative analysis.",
    aAr: "نعم، باقتنا المؤسسية تدعم تقييم منتجات متعددة. يمكنك أيضاً تجميع عدة منتجات في جلسات مخصصة للتحليل المقارن.",
  },
  {
    qEn: "Is there a satisfaction guarantee?",
    qAr: "هل يوجد ضمان رضا؟",
    aEn: "We stand behind our evaluations with a 100% satisfaction guarantee. If you're not satisfied with the quality of the report, we'll conduct a complimentary re-evaluation.",
    aAr: "نقف خلف تقييماتنا بضمان رضا 100%. إذا لم تكن راضياً عن جودة التقرير، سنجري إعادة تقييم مجانية.",
  },
];

export const ChefsTableFAQ = memo(function ChefsTableFAQ({ isAr }: Props) {
  return (
    <section className="bg-muted/30">
      <div className="container py-16 md:py-24">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-14">
          <span className="inline-flex items-center gap-2 rounded-full bg-chart-2/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-chart-2 mb-4">
            <HelpCircle className="h-3.5 w-3.5" />
            {isAr ? "الأسئلة الشائعة" : "FAQ"}
          </span>
          <h2 className="text-2xl font-black md:text-3xl lg:text-4xl text-foreground">
            {isAr ? "أسئلة متكررة" : "Frequently Asked Questions"}
          </h2>
          <p className="mt-3 text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            {isAr ? "إجابات على أكثر الأسئلة شيوعاً حول خدمة طاولة الشيف" : "Answers to the most common questions about Chef's Table"}
          </p>
        </div>

        {/* Accordion */}
        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-2xl border border-border/40 bg-card px-6 data-[state=open]:border-primary/20 data-[state=open]:shadow-md transition-all duration-300"
              >
                <AccordionTrigger className="text-sm md:text-base font-bold text-foreground hover:no-underline py-5 gap-3">
                  {isAr ? faq.qAr : faq.qEn}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                  {isAr ? faq.aAr : faq.aEn}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
});
