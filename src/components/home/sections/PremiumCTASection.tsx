import { memo, forwardRef } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Crown, ArrowRight, Sparkles, Star } from "lucide-react";
import { useSectionConfig } from "@/components/home/SectionKeyContext";

const PremiumCTASection = memo(forwardRef<HTMLElement>(function PremiumCTASection(_props, _ref) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const config = useSectionConfig();

  const title = config
    ? (isAr ? config.title_ar || "ارتقِ بمسيرتك المهنية" : config.title_en || "Elevate Your Culinary Journey")
    : (isAr ? "ارتقِ بمسيرتك المهنية" : "Elevate Your Culinary Journey");
  const subtitle = config
    ? (isAr ? config.subtitle_ar || "" : config.subtitle_en || "")
    : (isAr ? "انضم إلى الآلاف من الطهاة المحترفين حول العالم" : "Join thousands of professional chefs worldwide");

  return (
    <section dir={isAr ? "rtl" : "ltr"} className="relative overflow-hidden bg-[#F8F8F8] dark:bg-muted/10">
      <div className="container relative py-16 sm:py-20 lg:py-28">
        <div className="max-w-2xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 text-primary px-4 py-2 text-sm font-semibold mb-6">
            <Crown className="h-4 w-4" />
            {isAr ? "عضوية بريميوم" : "Premium Membership"}
          </div>

          {/* Title */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15] mb-5">
            {title}
          </h2>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
            {subtitle}
          </p>

          {/* Features row */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {(isAr
              ? ["شهادات احترافية", "تصنيف عالمي", "فرص حصرية"]
              : ["Pro Certifications", "Global Rankings", "Exclusive Access"]
            ).map((feature) => (
              <div key={feature} className="flex items-center gap-2 rounded-xl bg-card border border-border/40 px-4 py-2.5 text-sm text-foreground shadow-sm">
                <Star className="h-3.5 w-3.5 text-primary" />
                {feature}
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/membership"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-bold px-7 py-3.5 text-base hover:opacity-90 transition-all active:scale-[0.98] shadow-lg shadow-primary/25"
            >
              <Sparkles className="h-4 w-4" />
              {isAr ? "استكشف العضوية" : "Explore Membership"}
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-border text-foreground font-semibold px-7 py-3.5 text-base hover:bg-muted/50 transition-all active:scale-[0.98]"
            >
              {isAr ? "انضم مجاناً" : "Join Free"}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
});

export default PremiumCTASection;
