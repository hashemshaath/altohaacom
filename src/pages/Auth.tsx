import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SEOHead } from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";
import { PhoneVerification } from "@/components/auth/PhoneVerification";
import { CountrySelector } from "@/components/auth/CountrySelector";
import { PasswordStrengthMeter, getPasswordStrength } from "@/components/auth/PasswordStrengthMeter";
import { normalizePhoneInput } from "@/lib/arabicNumerals";
import { z } from "zod";
import {
  CheckCircle, XCircle, Loader2, ShieldCheck, UserPlus, LogIn,
  Trophy, Globe, GraduationCap, Award, Star, Phone, Mail,
} from "lucide-react";

const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{2,29}$/;

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignUpStep = "contact" | "verify" | "details" | "credentials";
type SignUpMethod = "phone" | "email";

const features = [
  { icon: Trophy, labelEn: "Compete Globally", labelAr: "تنافس عالمياً" },
  { icon: GraduationCap, labelEn: "Learn from the Best", labelAr: "تعلم من الأفضل" },
  { icon: Globe, labelEn: "Connect Worldwide", labelAr: "تواصل حول العالم" },
  { icon: Award, labelEn: "Earn Certificates", labelAr: "احصل على شهادات" },
];

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("tab") === "signup");
  const [signUpStep, setSignUpStep] = useState<SignUpStep>("contact");
  const [signUpMethod, setSignUpMethod] = useState<SignUpMethod>("phone");

  // Contact step
  const [phoneInput, setPhoneInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");

  // Verified contact
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);

  // Details step
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(""); // secondary email if phone-primary

  // Credentials step
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  // Sign in
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAr = language === "ar";

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  // Username availability check
  useEffect(() => {
    if (!username || username.length < 3 || !usernameRegex.test(username)) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username.toLowerCase())
        .maybeSingle();
      setUsernameStatus(data ? "taken" : "available");
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  useEffect(() => {
    setSignUpStep("contact");
    setErrors({});
  }, [isSignUp]);

  // ── Google Sign In ──
  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
    setLoading(false);
  };

  // ── Sign In ──
  const handleSignIn = async () => {
    setErrors({});
    const result = signInSchema.safeParse({ email: signInEmail, password: signInPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        fieldErrors[e.path[0] as string] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: signInEmail, password: signInPassword });
    setLoading(false);
    if (error) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
    }
  };

  // ── Step 1: Contact — validate and go to verify ──
  const handleContactSubmit = () => {
    setErrors({});
    const errs: Record<string, string> = {};

    if (signUpMethod === "phone") {
      const cleanPhone = phoneInput.replace(/\s/g, "");
      const phoneRegex = /^\+?[1-9]\d{7,14}$/;
      if (!phoneRegex.test(cleanPhone)) {
        errs.phone = isAr ? "رقم الهاتف غير صالح" : "Invalid phone number";
      }
      if (!countryCode) {
        errs.countryCode = isAr ? "يرجى اختيار الدولة" : "Country is required";
      }
    } else {
      const emailResult = z.string().email().safeParse(emailInput);
      if (!emailResult.success) {
        errs.email = isAr ? "البريد الإلكتروني غير صالح" : "Invalid email address";
      }
      if (!countryCode) {
        errs.countryCode = isAr ? "يرجى اختيار الدولة" : "Country is required";
      }
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSignUpStep("verify");
  };

  // ── Step 2a: Phone verified ──
  const handlePhoneVerified = (phone: string) => {
    setVerifiedPhone(phone);
    setSignUpStep("details");
  };

  // ── Step 2b: Email verification sent ──
  const handleSendEmailVerification = async () => {
    setLoading(true);
    // For email method, we'll use OTP sign-in to verify email
    const { error } = await supabase.auth.signInWithOtp({
      email: emailInput,
      options: { shouldCreateUser: false },
    });
    setLoading(false);

    if (error && !error.message.includes("User not found")) {
      // OTP won't work for non-existing users with shouldCreateUser: false
      // This is expected - we mark email as "pending verification" and proceed
    }

    // In this flow, email verification happens after account creation via confirmation email
    setVerifiedEmail(emailInput);
    setEmailVerificationSent(true);
    setSignUpStep("details");
    toast({
      title: isAr ? "سيتم التحقق من البريد" : "Email will be verified",
      description: isAr
        ? "سيتم إرسال رابط التحقق بعد إنشاء الحساب"
        : "A verification link will be sent after account creation",
    });
  };

  // ── Step 3: Details — name + optional email/phone ──
  const handleDetailsSubmit = () => {
    setErrors({});
    const errs: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      errs.fullName = isAr ? "الاسم مطلوب" : "Name is required";
    }

    // If phone-primary, email is needed for account creation
    if (signUpMethod === "phone") {
      const emailResult = z.string().email().safeParse(email);
      if (!emailResult.success) {
        errs.email = isAr ? "البريد الإلكتروني مطلوب لإنشاء الحساب" : "Email is required for account creation";
      }
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSignUpStep("credentials");
  };

  // ── Step 4: Create account ──
  const handleCreateAccount = async () => {
    setErrors({});
    const errs: Record<string, string> = {};

    if (!username || !usernameRegex.test(username)) {
      errs.username = isAr ? "اسم المستخدم غير صالح" : "Invalid username";
    }
    if (usernameStatus === "taken") {
      errs.username = isAr ? "اسم المستخدم مستخدم بالفعل" : "Username already taken";
    }
    if (usernameStatus === "checking") {
      errs.username = isAr ? "جاري التحقق..." : "Still checking...";
    }
    if (password.length < 8) {
      errs.password = isAr ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل" : "Password must be at least 8 characters";
    }
    if (getPasswordStrength(password) < 2) {
      errs.password = isAr ? "كلمة المرور ضعيفة جداً" : "Password is too weak";
    }
    if (password !== confirmPassword) {
      errs.confirmPassword = isAr ? "كلمات المرور غير متطابقة" : "Passwords don't match";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const accountEmail = signUpMethod === "phone" ? email : emailInput;

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: accountEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName, username: username.toLowerCase() },
      },
    });

    if (error) {
      setLoading(false);
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
      return;
    }

    if (data.user) {
      await supabase.from("user_roles").insert({ user_id: data.user.id, role: "chef" as any });
      await new Promise((resolve) => setTimeout(resolve, 500));
      await supabase
        .from("profiles")
        .update({
          username: username.toLowerCase(),
          phone: verifiedPhone || null,
          country_code: countryCode || null,
          preferred_language: language,
        })
        .eq("user_id", data.user.id);
    }

    setLoading(false);

    if (signUpMethod === "email") {
      toast({
        title: isAr ? "تم إنشاء الحساب!" : "Account created!",
        description: isAr
          ? "يرجى التحقق من بريدك الإلكتروني لتأكيد حسابك قبل تسجيل الدخول."
          : "Please check your email to verify your account before signing in.",
      });
    } else {
      toast({
        title: isAr ? "تم إنشاء الحساب!" : "Account created!",
        description: isAr
          ? "تم التحقق من رقم هاتفك. يرجى التحقق من بريدك الإلكتروني لتأكيد حسابك."
          : "Your phone is verified. Please check your email to confirm your account.",
      });
    }

    setIsSignUp(false);
    setSignUpStep("contact");
  };

  const totalSteps = 4;
  const currentStepNum = signUpStep === "contact" ? 1 : signUpStep === "verify" ? 2 : signUpStep === "details" ? 3 : 4;

  /* ── Step 2: Verification ── */
  if (signUpStep === "verify" && isSignUp) {
    return (
      <div className="flex min-h-screen flex-col">
        <SEOHead title="Verification" description="Verify your contact" />
        <Header />
        <main className="flex flex-1 items-center justify-center p-4">
          <Card className="w-full max-w-md border-border/50 shadow-xl shadow-primary/5">
            <div className="p-5 md:p-6">
              <div className="mb-5 flex flex-col items-center text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
                  <ShieldCheck className="h-7 w-7 text-primary" />
                </div>
                <h2 className="font-serif text-xl font-bold">
                  {signUpMethod === "phone"
                    ? (isAr ? "التحقق من رقم الهاتف" : "Phone Verification")
                    : (isAr ? "التحقق من البريد الإلكتروني" : "Email Verification")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isAr ? `الخطوة 2 من ${totalSteps}` : `Step 2 of ${totalSteps}`}
                </p>
              </div>

              {signUpMethod === "phone" ? (
                <PhoneVerification
                  onVerified={handlePhoneVerified}
                  onBack={() => setSignUpStep("contact")}
                  initialPhone={phoneInput}
                  phoneCode={phoneCode}
                  mode="signup"
                />
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
                    <Mail className="mx-auto mb-2 h-8 w-8 text-primary" />
                    <p className="text-sm font-medium">
                      {isAr ? "سيتم التحقق من:" : "Will verify:"}
                    </p>
                    <p className="mt-1 font-mono text-sm text-primary">{emailInput}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {isAr
                        ? "سيتم إرسال رابط التحقق إلى بريدك الإلكتروني بعد إنشاء الحساب"
                        : "A verification link will be sent to your email after account creation"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setSignUpStep("contact")}>
                      {isAr ? "رجوع" : "Back"}
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleSendEmailVerification}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {isAr ? "متابعة" : "Continue"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </main>
      </div>
    );
  }

  /* ── Step 3: Details (name, secondary contact) ── */
  if (signUpStep === "details" && isSignUp) {
    return (
      <div className="flex min-h-screen flex-col">
        <SEOHead title="Your Details" description="Complete your details" />
        <Header />
        <main className="flex flex-1 items-center justify-center p-4">
          <Card className="w-full max-w-md border-border/50 shadow-xl shadow-primary/5">
            <div className="p-5 md:p-6 space-y-5">
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
                  <UserPlus className="h-7 w-7 text-primary" />
                </div>
                <h2 className="font-serif text-xl font-bold">
                  {isAr ? "المعلومات الشخصية" : "Personal Details"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isAr ? `الخطوة 3 من ${totalSteps}` : `Step 3 of ${totalSteps}`}
                </p>
              </div>

              {/* Verified badge */}
              <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                <div className="text-sm">
                  {signUpMethod === "phone" ? (
                    <>
                      <span className="font-medium">{isAr ? "تم التحقق من الهاتف:" : "Phone verified:"}</span>{" "}
                      <span className="font-mono text-primary" dir="ltr">{verifiedPhone}</span>
                    </>
                  ) : (
                    <>
                      <span className="font-medium">{isAr ? "البريد الإلكتروني:" : "Email:"}</span>{" "}
                      <span className="text-primary">{verifiedEmail}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs">{isAr ? "الاسم الكامل" : "Full Name"} *</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={isAr ? "الاسم الكامل" : "Full name"}
                />
                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
              </div>

              {/* If phone-primary, ask for email */}
              {signUpMethod === "phone" && (
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs">{isAr ? "البريد الإلكتروني" : "Email"} *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={isAr ? "البريد الإلكتروني" : "Email address"}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    {isAr ? "مطلوب لإنشاء الحساب وإرسال الإشعارات" : "Required for account creation and notifications"}
                  </p>
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSignUpStep("verify")}>
                  {isAr ? "رجوع" : "Back"}
                </Button>
                <Button className="flex-1" onClick={handleDetailsSubmit}>
                  {isAr ? "التالي" : "Next"}
                </Button>
              </div>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  /* ── Step 4: Credentials (username & password) ── */
  if (signUpStep === "credentials" && isSignUp) {
    return (
      <div className="flex min-h-screen flex-col">
        <SEOHead title="Complete Registration" description="Set your password and username" />
        <Header />
        <main className="flex flex-1 items-center justify-center p-4">
          <Card className="w-full max-w-md border-border/50 shadow-xl shadow-primary/5">
            <div className="p-5 md:p-6 space-y-5">
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
                  <UserPlus className="h-7 w-7 text-primary" />
                </div>
                <h2 className="font-serif text-xl font-bold">
                  {isAr ? "إنشاء حسابك" : "Create Your Account"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isAr ? `الخطوة 4 من ${totalSteps}` : `Step 4 of ${totalSteps}`}
                </p>
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs">{isAr ? "اسم المستخدم" : "Username"} *</Label>
                <div className="relative">
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    className="pe-10"
                    placeholder="your_username"
                  />
                  <div className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === "checking" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    {usernameStatus === "available" && <CheckCircle className="h-4 w-4 text-primary" />}
                    {usernameStatus === "taken" && <XCircle className="h-4 w-4 text-destructive" />}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  altohaa.com/<span className="font-medium">{username || "username"}</span>
                </p>
                {errors.username && <p className="text-xs text-destructive">{errors.username}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs">{isAr ? "كلمة المرور" : "Password"} *</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <PasswordStrengthMeter password={password} />
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs">{isAr ? "تأكيد كلمة المرور" : "Confirm Password"} *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-destructive">{isAr ? "كلمات المرور غير متطابقة" : "Passwords don't match"}</p>
                )}
                {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSignUpStep("details")}>
                  {isAr ? "رجوع" : "Back"}
                </Button>
                <Button
                  className="flex-1 gap-2"
                  size="lg"
                  disabled={loading || usernameStatus !== "available"}
                  onClick={handleCreateAccount}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  {loading ? (isAr ? "جاري الإنشاء..." : "Creating...") : (isAr ? "إنشاء الحساب" : "Create Account")}
                </Button>
              </div>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  /* ── Main auth view (Sign In or Sign Up Step 1: Contact) ── */
  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title={isSignUp ? "Sign Up - Altohaa" : "Sign In - Altohaa"}
        description="Join the global culinary community. Sign in or create your free account on Altohaa."
      />
      <Header />
      <main className="flex flex-1">
        {/* ── Left: Feature panel (desktop only) ── */}
        <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 border-e p-10 xl:p-14">
          <div className="mb-8">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
              <Star className="h-7 w-7 text-primary" />
            </div>
            <h2 className="font-serif text-2xl font-bold xl:text-3xl">
              {isSignUp
                ? (isAr ? "انضم لمجتمع الطهي العالمي" : "Join the Global Culinary Community")
                : (isAr ? "مرحباً بعودتك!" : "Welcome Back!")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {isSignUp
                ? (isAr
                    ? "أنشئ حسابك المجاني وابدأ رحلتك مع آلاف الطهاة والمحترفين من حول العالم."
                    : "Create your free account and start your journey with thousands of chefs and culinary professionals worldwide.")
                : (isAr
                    ? "سجل دخولك للوصول إلى مسابقاتك ودوراتك ومجتمعك المهني."
                    : "Sign in to access your competitions, courses, and professional network.")}
            </p>
          </div>
          <div className="space-y-4">
            {features.map((f) => (
              <div key={f.labelEn} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <f.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{isAr ? f.labelAr : f.labelEn}</span>
              </div>
            ))}
          </div>
          <div className="mt-10 flex items-center gap-3 text-xs text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-primary shrink-0" />
            {isAr ? "مجاني بالكامل · بدون بطاقة ائتمان · إعداد في دقائق" : "Completely Free · No Credit Card · Setup in Minutes"}
          </div>
        </div>

        {/* ── Right: Form ── */}
        <div className="flex flex-1 items-center justify-center px-4 py-8">
          <div className="w-full max-w-md space-y-5">
            {/* Header */}
            <div className="flex flex-col items-center text-center">
              <img src="/altohaa-logo.png" alt="Altohaa" className="mb-3 h-12 w-auto lg:hidden" />
              <h1 className="font-serif text-2xl font-bold">
                {isSignUp ? (isAr ? "إنشاء حساب جديد" : "Create Account") : t("signInTitle")}
              </h1>
              {isSignUp && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {isAr ? `الخطوة 1 من ${totalSteps} — طريقة التسجيل` : `Step 1 of ${totalSteps} — Registration method`}
                </p>
              )}
            </div>

            {/* Google Sign In */}
            <Button
              variant="outline"
              className="w-full gap-2"
              size="lg"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {isAr ? "المتابعة بحساب جوجل" : "Continue with Google"}
            </Button>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">{isAr ? "أو" : "or"}</span>
              <Separator className="flex-1" />
            </div>

            {/* Form Card */}
            <Card className="border-border/50 shadow-lg shadow-primary/5">
              <CardContent className="space-y-4 p-5 md:p-6">
                {isSignUp ? (
                  <>
                    {/* Method Toggle */}
                    <div className="flex rounded-lg border border-border/50 p-1 gap-1">
                      <button
                        type="button"
                        onClick={() => setSignUpMethod("phone")}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                          signUpMethod === "phone"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Phone className="h-4 w-4" />
                        {isAr ? "رقم الهاتف" : "Phone"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignUpMethod("email")}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                          signUpMethod === "email"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Mail className="h-4 w-4" />
                        {isAr ? "البريد الإلكتروني" : "Email"}
                      </button>
                    </div>

                    {signUpMethod === "phone" ? (
                      <>
                        {/* Country */}
                        <CountrySelector
                          value={countryCode}
                          onChange={(code, country) => {
                            setCountryCode(code);
                            const pc = country?.phone_code || "";
                            setPhoneCode(pc);
                            if (!phoneInput || phoneInput === phoneCode) {
                              setPhoneInput(pc);
                            }
                          }}
                          label={isAr ? "الدولة" : "Country"}
                          required
                        />
                        {errors.countryCode && <p className="text-xs text-destructive">{errors.countryCode}</p>}

                        {/* Phone Number */}
                        <div className="space-y-1.5">
                          <Label htmlFor="phone" className="text-xs">{isAr ? "رقم الهاتف" : "Phone Number"} *</Label>
                          <Input
                            id="phone"
                            type="tel"
                            dir="ltr"
                            placeholder="+966 5XX XXX XXXX"
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(normalizePhoneInput(e.target.value))}
                          />
                          {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                          <p className="text-[10px] text-muted-foreground">
                            {isAr ? "سيتم إرسال رمز التحقق إلى هذا الرقم" : "A verification code will be sent to this number"}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Country */}
                        <CountrySelector
                          value={countryCode}
                          onChange={(code, country) => {
                            setCountryCode(code);
                            setPhoneCode(country?.phone_code || "");
                          }}
                          label={isAr ? "الدولة" : "Country"}
                          required
                        />
                        {errors.countryCode && <p className="text-xs text-destructive">{errors.countryCode}</p>}

                        {/* Email */}
                        <div className="space-y-1.5">
                          <Label htmlFor="emailInput" className="text-xs">{isAr ? "البريد الإلكتروني" : "Email"} *</Label>
                          <Input
                            id="emailInput"
                            type="email"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            placeholder={isAr ? "البريد الإلكتروني" : "Email address"}
                          />
                          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                          <p className="text-[10px] text-muted-foreground">
                            {isAr ? "سيتم إرسال رابط التحقق إلى هذا البريد" : "A verification link will be sent to this email"}
                          </p>
                        </div>
                      </>
                    )}

                    <Button
                      className="w-full gap-2"
                      size="lg"
                      onClick={handleContactSubmit}
                    >
                      {signUpMethod === "phone"
                        ? (isAr ? "التالي — التحقق من الهاتف" : "Next — Verify Phone")
                        : (isAr ? "التالي — التحقق من البريد" : "Next — Verify Email")}
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Sign In */}
                    <div className="space-y-1.5">
                      <Label htmlFor="signInEmail" className="text-xs">{isAr ? "البريد الإلكتروني" : "Email"}</Label>
                      <Input
                        id="signInEmail"
                        type="email"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        placeholder={isAr ? "البريد الإلكتروني" : "Email address"}
                      />
                      {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="signInPassword" className="text-xs">{isAr ? "كلمة المرور" : "Password"}</Label>
                      <Input
                        id="signInPassword"
                        type="password"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                      {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                    </div>

                    <Button
                      className="w-full gap-2"
                      size="lg"
                      disabled={loading}
                      onClick={handleSignIn}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                      {loading ? (isAr ? "جاري الدخول..." : "Signing in...") : (isAr ? "تسجيل الدخول" : "Sign In")}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Toggle */}
            <div className="flex items-center justify-center gap-1.5 text-sm">
              <span className="text-muted-foreground">
                {isSignUp ? (isAr ? "لديك حساب بالفعل؟" : "Already have an account?") : (isAr ? "ليس لديك حساب؟" : "Don't have an account?")}
              </span>
              <button
                type="button"
                className="font-medium text-primary underline-offset-2 hover:underline"
                onClick={() => { setIsSignUp(!isSignUp); setErrors({}); }}
              >
                {isSignUp ? (isAr ? "تسجيل الدخول" : "Sign In") : (isAr ? "إنشاء حساب" : "Sign Up")}
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
