import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, Sparkles, ChefHat, Star, FileCheck, Users } from "lucide-react";
import { useCoverSettings } from "@/hooks/useCoverSettings";
import heroImage from "@/assets/chefs-table-hero.jpg";

interface ChefsTableHeroProps {
  isAr: boolean;
  user: any;
  onRequestClick: () => void;
}

const stats = [
  { icon: Users, num: "50+", en: "Professional Chefs", ar: "شيف محترف" },
  { icon: Star, num: "200+", en: "Products Evaluated", ar: "منتج تم تقييمه" },
  { icon: FileCheck, num: "150+", en: "Published Reports", ar: "تقرير منشور" },
  { icon: ChefHat, num: "98%", en: "Client Satisfaction", ar: "رضا العملاء" },
];

export const ChefsTableHero = memo(function ChefsTableHero({ isAr, user, onRequestClick }: ChefsTableHeroProps) {
  const { gradientOverlay, isVisible } = useCoverSettings("chefs-table");

  if (!isVisible) return null;

  return (
    <section className="relative overflow-hidden bg-background">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroImage} alt="Chef's Table" className="h-full w-full object-cover" loading="eager" fetchPriority="high" decoding="async" />
        {gradientOverlay ? (
          <div className="absolute inset-0" style={{ background: gradientOverlay }} />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90" />
        )}
      </div>

      {/* Content */}
      <div className="container relative z-10 py-20 md:py-28 lg:py-36">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white/90 backdrop-blur-sm mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            {isAr ? "خدمة حصرية للشركات" : "Exclusive B2B Service"}
          </div>

          {/* Title */}
          <h1 className="text-4xl font-black md:text-5xl lg:text-6xl tracking-tight leading-[1.1] text-white">
            {isAr ? (
              <>طاولة <span className="text-primary">الشيف</span></>
            ) : (
              <>Chef's <span className="text-primary">Table</span></>
            )}
          </h1>

          <p className="mt-2 text-lg md:text-xl font-semibold text-white/80">
            {isAr ? "تقييم المنتجات الغذائية باحترافية" : "Professional Food Product Evaluation"}
          </p>

          <p className="mx-auto mt-5 max-w-2xl text-sm md:text-base text-white/60 leading-relaxed">
            {isAr
              ? "منصة متخصصة لتقييم المنتجات الغذائية من خلال طهاة محترفين. نقوم بتوثيق التجربة كاملة — من الطهي إلى التذوق — ونقدم تقارير مهنية شاملة مع توصيات قابلة للنشر."
              : "A specialized platform for professional food product evaluation by expert chefs. We document the complete experience — from cooking to tasting — and deliver comprehensive reports with publishable endorsements."}
          </p>

          {/* CTA */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            {user ? (
              <Button onClick={onRequestClick} size="lg" className="gap-2 rounded-2xl py-7 px-10 text-base font-bold shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95">
                <Plus className="h-5 w-5" />
                {isAr ? "اطلب تقييم منتجك" : "Request Product Evaluation"}
              </Button>
            ) : (
              <Button size="lg" className="gap-2 rounded-2xl py-7 px-10 text-base font-bold" asChild>
                <a href="/login">
                  {isAr ? "سجّل الآن لتبدأ" : "Sign Up to Get Started"}
                  <ArrowRight className="h-5 w-5" />
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Stats Strip */}
        <div className="mx-auto mt-14 max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:border-white/20"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-2xl font-black text-white tabular-nums">{stat.num}</span>
                <span className="text-xs font-semibold text-white/60 text-center">{isAr ? stat.ar : stat.en}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
});
