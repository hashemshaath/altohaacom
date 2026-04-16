import { ROUTES } from "@/config/routes";
import React, { memo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Clock, Award } from "lucide-react";

interface Props {
  isAr: boolean;
  user: any;
  onRequestClick: () => void;
}

const guarantees = [
  { icon: Shield, en: "Quality Guaranteed", ar: "جودة مضمونة" },
  { icon: Clock, en: "Results in 7 Days", ar: "النتائج خلال 7 أيام" },
  { icon: Award, en: "Professional Reports", ar: "تقارير مهنية" },
];

export const ChefsTableCTA = memo(React.forwardRef<HTMLElement, Props>(function ChefsTableCTA({ isAr, user, onRequestClick }, ref) {
  return (
    <section ref={ref} className="bg-background">
      <div className="container py-16 md:py-24">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/80 p-10 md:p-16 text-center">
          {/* Decorative */}
          <div className="absolute top-0 end-0 h-64 w-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 start-0 h-48 w-48 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-primary-foreground mb-4">
              {isAr ? "ابدأ رحلة تقييم منتجاتك اليوم" : "Start Your Product Evaluation Journey Today"}
            </h2>
            <p className="text-sm md:text-base text-primary-foreground/70 max-w-2xl mx-auto mb-8 leading-relaxed">
              {isAr
                ? "انضم إلى أكثر من 200 شركة استفادت من تقييمات طهاتنا المحترفين واحصل على تقارير تسويقية قوية لمنتجاتك"
                : "Join 200+ companies that leveraged our professional chef evaluations and get powerful marketing reports for your products"}
            </p>

            <Button
              onClick={user ? onRequestClick : undefined}
              asChild={!user}
              size="lg"
              variant="secondary"
              className="gap-2 rounded-2xl py-7 px-10 text-base font-bold shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              {user ? (
                <>
                  {isAr ? "اطلب تقييم الآن" : "Request Evaluation Now"}
                  <ArrowRight className="h-5 w-5" />
                </>
              ) : (
                <Link to={ROUTES.login}>
                  {isAr ? "سجّل لتبدأ" : "Sign Up to Start"}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              )}
            </Button>

            {/* Trust badges */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
              {guarantees.map((g, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-semibold text-primary-foreground/60">
                  <g.icon className="h-4 w-4" />
                  {isAr ? g.ar : g.en}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}));
