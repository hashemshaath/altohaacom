import { useMemo } from "react";
import { Trophy, Globe, GraduationCap, Award, CheckCircle } from "lucide-react";
import authHeroImg from "@/assets/auth-hero.jpg";

/* ── Stage quotes ── */
const quotes: Record<string, { en: string[]; ar: string[] }> = {
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
    [stage, isAr],
  );

  const heading = headings[stage] || headings.register;
  const isSignUpFlow = ["register", "verify", "details", "credentials"].includes(stage);

  return (
    <div
      className="hidden md:flex md:w-[420px] lg:w-[540px] xl:w-[620px] relative flex-col overflow-hidden border-e border-white/5"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Background image — Premium treatment */}
      <img
        src={authHeroImg}
        alt="Culinary excellence"
        className="absolute inset-0 h-full w-full object-cover scale-105 blur-[1px] opacity-90 transition-transform duration-[10s] hover:scale-110"
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-transparent opacity-60" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05] pointer-events-none" />

      {/* Animated Floating Orbs */}
      <div className="absolute -top-20 -start-20 h-64 w-64 rounded-full bg-primary/20 blur-[100px] animate-pulse" />
      <div className="absolute top-1/2 -end-20 h-48 w-48 rounded-full bg-chart-3/15 blur-[80px] animate-pulse" style={{ animationDelay: "2s" }} />

      {/* Logo Area */}
      <div className="relative z-10 p-10 xl:p-14">
        <div className="flex items-center gap-3 group cursor-pointer">
          <img src="/altoha-logo.png" alt="Altoha" className="h-12 w-auto drop-shadow-2xl transition-transform group-hover:scale-110" />
          <span className="font-serif text-2xl font-black text-white tracking-tighter drop-shadow-lg">Altoha</span>
        </div>
      </div>

      {/* Main heading */}
      <div className="relative z-10 flex flex-1 flex-col justify-center px-10 xl:px-14">
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          <h2
            className={`${isAr ? "font-sans" : "font-serif"} text-4xl font-black xl:text-6xl leading-[1.1] whitespace-pre-line text-white drop-shadow-2xl tracking-tight`}
          >
            {isAr ? heading.ar : heading.en}
          </h2>
          <div className="h-1.5 w-20 bg-primary/60 rounded-full" />
          <p className="text-lg leading-relaxed max-w-sm text-white/80 font-medium italic drop-shadow-md">
            "{randomQuote}"
          </p>
        </div>
      </div>

      {/* Bottom section */}
      <div className="relative z-10 p-8 xl:p-10 space-y-5">
        {isSignUpFlow && currentStep !== undefined && (
          <div className="space-y-2">
            <StepDots current={currentStep} total={totalSteps} />
            <p className="text-xs text-white/50">
              {isAr ? `الخطوة ${currentStep + 1} من ${totalSteps}` : `Step ${currentStep + 1} of ${totalSteps}`}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {features.map((f) => (
            <div
              key={f.labelEn}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/85 backdrop-blur-md"
            >
              <f.icon className="h-3.5 w-3.5 text-primary" />
              {isAr ? f.labelAr : f.labelEn}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-white/45">
          <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
          {isAr
            ? "مجاني بالكامل · بدون بطاقة ائتمان · إعداد في دقائق"
            : "Completely Free · No Credit Card · Setup in Minutes"}
        </div>
      </div>
    </div>
  );
}
