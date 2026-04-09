import { memo } from "react";
import { Star, Quote } from "lucide-react";

interface Props {
  isAr: boolean;
}

const testimonials = [
  {
    nameEn: "Ahmad Al-Rashidi",
    nameAr: "أحمد الراشدي",
    roleEn: "CEO, Gulf Foods Co.",
    roleAr: "الرئيس التنفيذي، شركة أغذية الخليج",
    quoteEn: "The Chef's Table evaluation helped us improve our olive oil blend and gain trust with 5-star hotels. The published report was a game-changer for our sales team.",
    quoteAr: "ساعدنا تقييم طاولة الشيف في تحسين مزيج زيت الزيتون وكسب ثقة الفنادق خمس نجوم. التقرير المنشور كان نقطة تحول لفريق المبيعات.",
    rating: 5,
  },
  {
    nameEn: "Sarah Mansour",
    nameAr: "سارة منصور",
    roleEn: "Product Manager, Spice Valley",
    roleAr: "مدير منتجات، وادي البهارات",
    quoteEn: "Professional, thorough, and incredibly valuable. The chef feedback on our spice range gave us actionable insights we couldn't have gotten anywhere else.",
    quoteAr: "احترافية وشاملة وقيمة بشكل لا يصدق. ملاحظات الطهاة على مجموعة بهاراتنا أعطتنا رؤى عملية لم نكن لنحصل عليها من أي مكان آخر.",
    rating: 5,
  },
  {
    nameEn: "Omar Khalil",
    nameAr: "عمر خليل",
    roleEn: "Founder, Premium Meats",
    roleAr: "مؤسس، اللحوم الممتازة",
    quoteEn: "We were skeptical at first, but the evaluation process was eye-opening. Three chefs tested our products and the detailed scoring helped us identify exactly where to improve.",
    quoteAr: "كنا متشككين في البداية، لكن عملية التقييم كانت مثيرة للاهتمام. ثلاثة طهاة اختبروا منتجاتنا والتقييم المفصل ساعدنا في تحديد نقاط التحسين بدقة.",
    rating: 5,
  },
];

export const ChefsTableTestimonials = memo(function ChefsTableTestimonials({ isAr }: Props) {
  return (
    <section className="bg-muted/20">
      <div className="container py-16 md:py-24">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-14">
          <span className="inline-flex items-center gap-2 rounded-full bg-chart-4/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-chart-4 mb-4">
            {isAr ? "آراء العملاء" : "Testimonials"}
          </span>
          <h2 className="text-2xl font-black md:text-3xl lg:text-4xl text-foreground">
            {isAr ? "ماذا يقول عملاؤنا؟" : "What Our Clients Say"}
          </h2>
          <p className="mt-3 text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            {isAr ? "تجارب حقيقية من شركات استفادت من خدمة طاولة الشيف" : "Real experiences from companies that benefited from Chef's Table"}
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="group relative rounded-2xl border border-border/40 bg-card p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/20"
            >
              {/* Quote icon */}
              <div className="mb-4">
                <Quote className="h-8 w-8 text-primary/20" />
              </div>

              {/* Rating */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-chart-4 text-chart-4" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                "{isAr ? t.quoteAr : t.quoteEn}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-border/40">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                  {(isAr ? t.nameAr : t.nameEn).charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{isAr ? t.nameAr : t.nameEn}</p>
                  <p className="text-xs text-muted-foreground">{isAr ? t.roleAr : t.roleEn}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
