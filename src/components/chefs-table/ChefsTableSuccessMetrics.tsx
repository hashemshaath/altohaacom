import { memo, useEffect, useRef, useState } from "react";
import { TrendingUp, Award, Globe, ChefHat, Building2, Star } from "lucide-react";

interface Props {
  isAr: boolean;
}

const metrics = [
  { icon: Building2, target: 200, suffix: "+", en: "Companies Served", ar: "شركة تم خدمتها", color: "text-primary" },
  { icon: ChefHat, target: 50, suffix: "+", en: "Professional Chefs", ar: "شيف محترف", color: "text-chart-4" },
  { icon: Star, target: 500, suffix: "+", en: "Products Evaluated", ar: "منتج تم تقييمه", color: "text-chart-5" },
  { icon: Globe, target: 12, suffix: "", en: "Countries Reached", ar: "دولة", color: "text-chart-1" },
  { icon: Award, target: 98, suffix: "%", en: "Client Satisfaction", ar: "رضا العملاء", color: "text-chart-2" },
  { icon: TrendingUp, target: 85, suffix: "%", en: "Repeat Clients", ar: "عملاء متكررون", color: "text-chart-3" },
];

function useCountUp(target: number, inView: boolean, duration = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const id = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(id);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(id);
  }, [target, inView, duration]);
  return count;
}

function MetricCard({ metric, isAr, inView }: { metric: typeof metrics[0]; isAr: boolean; inView: boolean }) {
  const count = useCountUp(metric.target, inView);
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-border/40 bg-card p-5 text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-muted ${metric.color}`}>
        <metric.icon className="h-5 w-5" />
      </div>
      <span className="text-3xl font-black tabular-nums text-foreground">
        {count}{metric.suffix}
      </span>
      <span className="text-xs font-semibold text-muted-foreground">{isAr ? metric.ar : metric.en}</span>
    </div>
  );
}

export const ChefsTableSuccessMetrics = memo(function ChefsTableSuccessMetrics({ isAr }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="bg-gradient-to-b from-background to-muted/30 border-t border-border/30">
      <div ref={ref} className="container py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary mb-4">
            {isAr ? "إنجازاتنا" : "Our Impact"}
          </span>
          <h2 className="text-2xl font-black md:text-3xl lg:text-4xl text-foreground">
            {isAr ? "أرقام تتحدث عن نجاحنا" : "Numbers That Speak for Themselves"}
          </h2>
          <p className="mt-3 text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            {isAr ? "سجل حافل بالإنجازات في تقييم المنتجات الغذائية" : "A proven track record in food product evaluation"}
          </p>
        </div>

        <div className="mx-auto max-w-4xl grid grid-cols-2 md:grid-cols-3 gap-4">
          {metrics.map((m, i) => (
            <MetricCard key={i} metric={m} isAr={isAr} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
});
