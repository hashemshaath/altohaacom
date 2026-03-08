import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, Sparkles } from "lucide-react";
import { useCoverSettings } from "@/hooks/useCoverSettings";
import heroImage from "@/assets/chefs-table-hero.jpg";

interface ChefsTableHeroProps {
  isAr: boolean;
  user: any;
  onRequestClick: () => void;
}

export const ChefsTableHero = memo(function ChefsTableHero({ isAr, user, onRequestClick }: ChefsTableHeroProps) {
  const { gradientOverlay, isVisible } = useCoverSettings("chefs-table");

  if (!isVisible) return null;

  return (
    <section className="relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img src={heroImage} alt="Chef's Table" className="h-full w-full object-cover" />
        {gradientOverlay && (
          <div className="absolute inset-0" style={{ background: gradientOverlay }} />
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="container relative py-20 md:py-28 lg:py-36">
        <div className="mx-auto max-w-3xl text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            {isAr ? "خدمة حصرية للشركات" : "Exclusive B2B Service"}
          </div>

          <h1 className={`text-4xl font-black md:text-5xl lg:text-6xl tracking-tight leading-[1.1] ${!isAr ? "font-serif" : ""}`}>
            {isAr ? (
              <>طاولة الشيف<br /><span className="text-primary">تقييم المنتجات الغذائية</span></>
            ) : (
              <>Chef's Table<br /><span className="text-primary">Product Evaluation</span></>
            )}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base md:text-lg text-muted-foreground font-medium leading-relaxed">
            {isAr
              ? "منصة متخصصة لتقييم المنتجات الغذائية من خلال طهاة محترفين. نقوم بتوثيق التجربة كاملة — من الطهي إلى التذوق — ونقدم تقارير مهنية شاملة مع توصيات قابلة للنشر تساعد في تسويق منتجاتك للقطاع المهني."
              : "A specialized platform for professional food product evaluation by expert chefs. We document the complete experience — from cooking to tasting — and deliver comprehensive reports with publishable endorsements to help market your products to the professional sector."}
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            {user ? (
              <Button onClick={onRequestClick} size="lg" className="gap-2 shadow-2xl shadow-primary/30 rounded-2xl py-7 px-10 text-lg font-bold transition-all hover:scale-105 active:scale-95">
                <Plus className="h-5 w-5" />
                {isAr ? "اطلب تقييم منتجك" : "Request Product Evaluation"}
              </Button>
            ) : (
              <Button size="lg" className="gap-2 rounded-2xl py-7 px-10 text-lg font-bold" asChild>
                <a href="/auth">
                  {isAr ? "سجّل الآن لتبدأ" : "Sign Up to Get Started"}
                  <ArrowRight className="h-5 w-5" />
                </a>
              </Button>
            )}
          </div>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {[
              { en: "Professional Chefs", ar: "طهاة محترفون", num: "50+" },
              { en: "Products Evaluated", ar: "منتج تم تقييمه", num: "200+" },
              { en: "Published Reports", ar: "تقرير منشور", num: "150+" },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xl font-black text-primary tabular-nums">{stat.num}</span>
                <span>{isAr ? stat.ar : stat.en}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});
