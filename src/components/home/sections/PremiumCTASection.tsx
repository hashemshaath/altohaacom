import { memo } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Crown, ArrowRight, Sparkles, Star } from "lucide-react";
import { useSectionConfig } from "@/components/home/SectionKeyContext";

const PremiumCTASection = memo(function PremiumCTASection() {
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
    <section dir={isAr ? "rtl" : "ltr"} className="relative overflow-hidden">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute top-1/4 start-[10%] h-64 w-64 rounded-full bg-primary/10 blur-[100px]" />
          <div className="absolute bottom-1/4 end-[10%] h-48 w-48 rounded-full bg-accent/10 blur-[80px]" />
          <div className="absolute top-0 start-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>

        <div className="container relative py-16 sm:py-20 lg:py-28">
          <div className="max-w-2xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 border border-primary/20 text-primary px-4 py-2 text-sm font-semibold mb-6">
              <Crown className="h-4 w-4" />
              {isAr ? "عضوية بريميوم" : "Premium Membership"}
            </div>

            {/* Title */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15] mb-5">
              {title}
            </h2>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">
              {subtitle}
            </p>

            {/* Features row */}
            <div className="flex flex-wrap justify-center gap-4 mb-10">
              {(isAr
                ? ["شهادات احترافية", "تصنيف عالمي", "فرص حصرية"]
                : ["Pro Certifications", "Global Rankings", "Exclusive Access"]
              ).map((feature) => (
                <div key={feature} className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-gray-300">
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
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/20 text-white font-semibold px-7 py-3.5 text-base hover:bg-white/10 transition-all active:scale-[0.98]"
              >
                {isAr ? "انضم مجاناً" : "Join Free"}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default PremiumCTASection;
