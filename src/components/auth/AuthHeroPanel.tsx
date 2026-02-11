import { useMemo } from "react";
import { Trophy, Globe, GraduationCap, Award, CheckCircle } from "lucide-react";
import authHeroImg from "@/assets/auth-hero.jpg";

/* ── Motivational quotes ── */
const quotes = {
  login: {
    en: [
      "Welcome back, Chef. Your community is waiting.",
      "Continue your culinary excellence journey.",
      "Great things are cooking — sign in to see what's new.",
    ],
    ar: [
      "مرحباً بعودتك، شيف. مجتمعك في انتظارك.",
      "واصل رحلتك نحو التميز في الطهي.",
      "أشياء رائعة تُطهى — سجل دخولك لمعرفة الجديد.",
    ],
  },
  register: {
    en: [
      "Every great chef started somewhere. Start your journey today.",
      "Join thousands of culinary professionals shaping the future of gastronomy.",
      "Your culinary masterpiece awaits — create, compete, and connect globally.",
    ],
    ar: [
      "كل شيف عظيم بدأ من مكان ما. ابدأ رحلتك اليوم.",
      "انضم لآلاف المحترفين الذين يشكلون مستقبل فن الطهي.",
      "تحفتك الفنية في انتظارك — أبدع، تنافس، وتواصل عالمياً.",
    ],
  },
  verify: {
    en: ["Almost there — we just need to verify it's really you."],
    ar: ["اقتربت — نحتاج فقط التأكد من هويتك."],
  },
  details: {
    en: ["Tell us a bit about yourself. Every great chef has a story."],
    ar: ["أخبرنا عن نفسك. كل شيف عظيم له قصة."],
  },
  credentials: {
    en: ["One last step and you're in. Make it secure, make it yours."],
    ar: ["خطوة أخيرة وتنضم إلينا. اجعلها آمنة، اجعلها خاصة بك."],
  },
  reset: {
    en: ["Secure your account with a strong new password."],
    ar: ["أمّن حسابك بكلمة مرور جديدة قوية."],
  },
};

const headings: Record<string, { en: string; ar: string }> = {
  login: { en: "Welcome Back,\nChef!", ar: "مرحباً بعودتك\nشيف!" },
  register: { en: "Join the Global\nCulinary Community", ar: "انضم لمجتمع\nالطهي العالمي" },
  verify: { en: "Verifying\nYour Identity", ar: "التحقق من\nهويتك" },
  details: { en: "Tell Us\nAbout Yourself", ar: "أخبرنا\nعن نفسك" },
  credentials: { en: "Almost\nThere!", ar: "اقتربت\nمن الهدف!" },
  reset: { en: "Reset Your\nPassword", ar: "إعادة تعيين\nكلمة المرور" },
};

const features = [
  { icon: Trophy, labelEn: "Compete Globally", labelAr: "تنافس عالمياً" },
  { icon: GraduationCap, labelEn: "Learn from the Best", labelAr: "تعلم من الأفضل" },
  { icon: Globe, labelEn: "Connect Worldwide", labelAr: "تواصل حول العالم" },
  { icon: Award, labelEn: "Earn Certificates", labelAr: "احصل على شهادات" },
];

export type AuthStage = "login" | "register" | "verify" | "details" | "credentials" | "reset";

interface Props {
  stage: AuthStage;
  isAr: boolean;
  currentStep?: number;
  totalSteps?: number;
}

/* ── Floating Orb ── */
function FloatingOrb({ className, duration }: { className?: string; duration?: number }) {
  return (
    <div
      className={`absolute rounded-full blur-3xl opacity-20 animate-pulse ${className}`}
      style={{ animationDuration: `${duration ?? 6}s` }}
    />
  );
}

/* ── Step Dots ── */
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2" dir="ltr">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-500 ${
            i < current
              ? "w-6 bg-primary"
              : i === current
              ? "w-8 bg-primary shadow-sm shadow-primary/50"
              : "w-4 bg-muted-foreground/20"
          }`}
        />
      ))}
    </div>
  );
}

export function AuthHeroPanel({ stage, isAr, currentStep, totalSteps = 4 }: Props) {
  const quoteSet = quotes[stage] || quotes.register;
  const quoteList = isAr ? quoteSet.ar : quoteSet.en;
  const randomQuote = useMemo(
    () => quoteList[Math.floor(Math.random() * quoteList.length)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stage, isAr]
  );

  const heading = headings[stage] || headings.register;
  const isSignUpFlow = ["register", "verify", "details", "credentials"].includes(stage);

  return (
    <div
      className="hidden lg:flex lg:w-[480px] xl:w-[540px] relative flex-col overflow-hidden"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Background image */}
      <img
        src={authHeroImg}
        alt="Culinary excellence"
        className="absolute inset-0 h-full w-full object-cover scale-105"
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-transparent" />

      {/* Orbs */}
      <FloatingOrb className="h-64 w-64 bg-primary/30 -top-20 -start-20" duration={7} />
      <FloatingOrb className="h-48 w-48 bg-accent/20 top-1/3 end-[-40px]" duration={9} />
      <FloatingOrb className="h-32 w-32 bg-primary/20 bottom-40 start-10" duration={8} />

      {/* Logo */}
      <div className="relative z-10 p-8 xl:p-10">
        <img src="/altohaa-logo.png" alt="Altohaa" className="h-10 w-auto drop-shadow-lg" />
      </div>

      {/* Main heading */}
      <div className="relative z-10 flex flex-1 flex-col justify-center px-8 xl:px-10">
        <div className="space-y-5">
          <h2
            className={`${isAr ? "font-sans" : "font-serif"} text-3xl font-bold xl:text-4xl leading-tight whitespace-pre-line`}
            style={{ color: "white" }}
          >
            {isAr ? heading.ar : heading.en}
          </h2>
          <p
            className="text-base leading-relaxed max-w-sm"
            style={{ color: "rgba(255,255,255,0.75)" }}
          >
            {randomQuote}
          </p>
        </div>
      </div>

      {/* Bottom */}
      <div className="relative z-10 p-8 xl:p-10 space-y-5">
        {isSignUpFlow && currentStep !== undefined && (
          <div className="space-y-2">
            <StepDots current={currentStep} total={totalSteps} />
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              {isAr ? `الخطوة ${currentStep + 1} من ${totalSteps}` : `Step ${currentStep + 1} of ${totalSteps}`}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {features.map((f) => (
            <div
              key={f.labelEn}
              className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-md"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.85)",
              }}
            >
              <f.icon className="h-3.5 w-3.5 text-primary" />
              {isAr ? f.labelAr : f.labelEn}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
          <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
          {isAr
            ? "مجاني بالكامل · بدون بطاقة ائتمان · إعداد في دقائق"
            : "Completely Free · No Credit Card · Setup in Minutes"}
        </div>
      </div>
    </div>
  );
}
