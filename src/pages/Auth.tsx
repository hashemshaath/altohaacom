import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
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
import { UsernameSuggestions } from "@/components/auth/UsernameSuggestions";
import { ForgotPasswordDialog } from "@/components/auth/ForgotPasswordDialog";
import { TermsAgreement } from "@/components/auth/TermsAgreement";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PhoneInputWithFlag } from "@/components/auth/PhoneInputWithFlag";
import { z } from "zod";
import {
  CheckCircle, XCircle, Loader2, ShieldCheck, UserPlus, LogIn,
  Phone, Mail, KeyRound,
} from "lucide-react";

const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{2,29}$/;

type SignUpStep = "contact" | "verify" | "details" | "credentials";
type SignUpMethod = "phone" | "email";
type SignInMethod = "phone" | "email";

const DEFAULT_COUNTRY = "SA";
const DEFAULT_PHONE_CODE = "+966";

export default function Auth() {
  const location = useLocation();
  const isResetMode = location.pathname === "/reset-password";
  const [isSignUp, setIsSignUp] = useState(
    location.pathname === "/register"
  );
  const [signUpStep, setSignUpStep] = useState<SignUpStep>("contact");
  const [signUpMethod, setSignUpMethod] = useState<SignUpMethod>("phone");

  // Sign-in state
  const [signInMethod, setSignInMethod] = useState<SignInMethod>("phone");
  const [signInPhone, setSignInPhone] = useState("");
  const [signInPhoneCode, setSignInPhoneCode] = useState(DEFAULT_PHONE_CODE);
  const [signInCountry, setSignInCountry] = useState(DEFAULT_COUNTRY);
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInPhoneStep, setSignInPhoneStep] = useState<"phone" | "otp" | "password">("phone");
  const [signInVerifiedPhone, setSignInVerifiedPhone] = useState("");

  // Sign-up contact step
  const [phoneInput, setPhoneInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY);
  const [phoneCode, setPhoneCode] = useState(DEFAULT_PHONE_CODE);

  // Sign-up verified contact
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");

  // Sign-up details step
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  // Sign-up credentials step
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Password reset
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");

  // Dialogs
  const [forgotOpen, setForgotOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAr = language === "ar";

  useEffect(() => {
    if (user && !isResetMode) navigate("/", { replace: true });
  }, [user, navigate, isResetMode]);

  // Sync isSignUp with route
  useEffect(() => {
    if (location.pathname === "/register") setIsSignUp(true);
    else if (location.pathname === "/login") setIsSignUp(false);
  }, [location.pathname]);

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

  // ── Sign In with Email ──
  const handleSignInEmail = async () => {
    setErrors({});
    const errs: Record<string, string> = {};
    const emailResult = z.string().email().safeParse(signInEmail);
    if (!emailResult.success) errs.signInEmail = isAr ? "البريد الإلكتروني غير صالح" : "Invalid email";
    if (signInPassword.length < 6) errs.signInPassword = isAr ? "كلمة المرور قصيرة جداً" : "Password too short";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: signInEmail, password: signInPassword });
    setLoading(false);
    if (error) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
    }
  };

  // ── Sign In with Phone (after OTP verification) ──
  const handleSignInPhoneVerified = (phone: string) => {
    setSignInVerifiedPhone(phone);
    setSignInPhoneStep("password");
  };

  const handleSignInPhonePassword = async () => {
    setErrors({});
    if (signInPassword.length < 6) {
      setErrors({ signInPassword: isAr ? "كلمة المرور قصيرة جداً" : "Password too short" });
      return;
    }

    setLoading(true);
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("phone", signInVerifiedPhone)
      .maybeSingle();

    if (!profile) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "لا يوجد حساب مرتبط بهذا الرقم" : "No account linked to this phone number",
      });
      return;
    }

    setLoading(false);
    toast({
      title: isAr ? "أدخل بريدك الإلكتروني" : "Enter your email",
      description: isAr
        ? "تم التحقق من رقمك. أدخل بريدك الإلكتروني وكلمة المرور لتسجيل الدخول"
        : "Phone verified. Enter your email and password to sign in",
    });
    setSignInMethod("email");
    setSignInPhoneStep("phone");
  };

  // ── Password Reset ──
  const handleResetPassword = async () => {
    setErrors({});
    const errs: Record<string, string> = {};
    if (resetPassword.length < 8) errs.resetPassword = isAr ? "8 أحرف على الأقل" : "At least 8 characters";
    if (getPasswordStrength(resetPassword) < 2) errs.resetPassword = isAr ? "كلمة المرور ضعيفة" : "Password too weak";
    if (resetPassword !== resetConfirm) errs.resetConfirm = isAr ? "غير متطابقة" : "Passwords don't match";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: resetPassword });
    setLoading(false);

    if (error) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
    } else {
      toast({
        title: isAr ? "تم تحديث كلمة المرور" : "Password Updated",
        description: isAr ? "يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة" : "You can now sign in with your new password",
      });
      navigate("/login", { replace: true });
    }
  };

  // ── Sign Up Step 1: Contact ──
  const handleContactSubmit = () => {
    setErrors({});
    const errs: Record<string, string> = {};

    if (signUpMethod === "phone") {
      const fullPhone = phoneCode + phoneInput.replace(/\s/g, "");
      if (!/^\+?[1-9]\d{7,14}$/.test(fullPhone)) {
        errs.phone = isAr ? "رقم الهاتف غير صالح" : "Invalid phone number";
      }
    } else {
      if (!z.string().email().safeParse(emailInput).success) {
        errs.email = isAr ? "البريد الإلكتروني غير صالح" : "Invalid email address";
      }
    }

    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSignUpStep("verify");
  };

  // ── Sign Up Step 2: Verified ──
  const handlePhoneVerified = (phone: string) => {
    setVerifiedPhone(phone);
    setSignUpStep("details");
  };

  const handleSendEmailVerification = async () => {
    setVerifiedEmail(emailInput);
    setSignUpStep("details");
    toast({
      title: isAr ? "سيتم التحقق من البريد" : "Email will be verified",
      description: isAr
        ? "سيتم إرسال رابط التحقق بعد إنشاء الحساب"
        : "A verification link will be sent after account creation",
    });
  };

  // ── Sign Up Step 3: Details ──
  const handleDetailsSubmit = () => {
    setErrors({});
    const errs: Record<string, string> = {};
    if (!fullName.trim() || fullName.trim().length < 2) {
      errs.fullName = isAr ? "الاسم مطلوب (حرفان على الأقل)" : "Name is required (min 2 chars)";
    }
    if (signUpMethod === "phone") {
      if (!z.string().email().safeParse(email).success) {
        errs.email = isAr ? "البريد الإلكتروني مطلوب لإنشاء الحساب" : "Email required for account creation";
      }
    }
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSignUpStep("credentials");
  };

  // ── Sign Up Step 4: Create Account ──
  const handleCreateAccount = async () => {
    setErrors({});
    const errs: Record<string, string> = {};

    if (!username || !usernameRegex.test(username)) errs.username = isAr ? "اسم مستخدم غير صالح (حروف وأرقام و _ فقط)" : "Invalid username (letters, numbers, _ only)";
    if (usernameStatus === "taken") errs.username = isAr ? "اسم المستخدم مستخدم بالفعل" : "Username already taken";
    if (usernameStatus === "checking") errs.username = isAr ? "جاري التحقق..." : "Still checking...";
    if (password.length < 8) errs.password = isAr ? "8 أحرف على الأقل" : "At least 8 characters";
    if (getPasswordStrength(password) < 2) errs.password = isAr ? "كلمة المرور ضعيفة جداً" : "Password is too weak";
    if (password !== confirmPassword) errs.confirmPassword = isAr ? "غير متطابقة" : "Passwords don't match";
    if (!termsAccepted) errs.terms = isAr ? "يجب الموافقة على الشروط والأحكام" : "You must accept the Terms & Conditions";

    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

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
    toast({
      title: isAr ? "تم إنشاء الحساب بنجاح! 🎉" : "Account Created! 🎉",
      description: isAr
        ? "يرجى التحقق من بريدك الإلكتروني لتأكيد حسابك قبل تسجيل الدخول."
        : "Please check your email to verify your account before signing in.",
    });
    setIsSignUp(false);
    setSignUpStep("contact");
    navigate("/login", { replace: true });
  };

  const totalSteps = 4;

  const stepIndex: Record<SignUpStep, number> = { contact: 0, verify: 1, details: 2, credentials: 3 };

  // ── Helper: get hero stage ──
  const getStage = () => {
    if (isResetMode) return "reset" as const;
    if (!isSignUp) return "login" as const;
    if (signUpStep === "verify") return "verify" as const;
    if (signUpStep === "details") return "details" as const;
    if (signUpStep === "credentials") return "credentials" as const;
    return "register" as const;
  };

  // ── Password Reset Page ──
  if (isResetMode) {
    return (
      <AuthLayout stage="reset" isAr={isAr}>
        <SEOHead title={isAr ? "إعادة تعيين كلمة المرور" : "Reset Password"} description="Reset your password" />
        <Card className="border-border/50 shadow-xl shadow-primary/5">
          <div className="p-5 md:p-6 space-y-5">
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
                <KeyRound className="h-7 w-7 text-primary" />
              </div>
              <h2 className={`${isAr ? "font-sans" : "font-serif"} text-xl font-bold`}>
                {isAr ? "إعادة تعيين كلمة المرور" : "Reset Password"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {isAr ? "أدخل كلمة المرور الجديدة" : "Enter your new password"}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "كلمة المرور الجديدة" : "New Password"} *</Label>
              <Input type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} placeholder="••••••••" />
              <PasswordStrengthMeter password={resetPassword} />
              {errors.resetPassword && <p className="text-xs text-destructive">{errors.resetPassword}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "تأكيد كلمة المرور" : "Confirm Password"} *</Label>
              <Input type="password" value={resetConfirm} onChange={(e) => setResetConfirm(e.target.value)} placeholder="••••••••" />
              {errors.resetConfirm && <p className="text-xs text-destructive">{errors.resetConfirm}</p>}
            </div>

            <Button className="w-full" size="lg" onClick={handleResetPassword} disabled={loading}>
              {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {isAr ? "تعيين كلمة المرور الجديدة" : "Set New Password"}
            </Button>
          </div>
        </Card>
      </AuthLayout>
    );
  }

  // ── Sign Up Step 2: Verification ──
  if (signUpStep === "verify" && isSignUp) {
    return (
      <AuthLayout stage="verify" isAr={isAr} currentStep={1}>
        <SEOHead title={isAr ? "التحقق" : "Verification"} description="Verify your contact" />
        <Card className="border-border/50 shadow-xl shadow-primary/5">
          <div className="p-5 md:p-6">
            <div className="mb-5 flex flex-col items-center text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
                <ShieldCheck className="h-7 w-7 text-primary" />
              </div>
              <h2 className={`${isAr ? "font-sans" : "font-serif"} text-xl font-bold`}>
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
                initialPhone={phoneCode + phoneInput}
                phoneCode={phoneCode}
                mode="signup"
              />
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
                  <Mail className="mx-auto mb-2 h-8 w-8 text-primary" />
                  <p className="text-sm font-medium">{isAr ? "سيتم التحقق من:" : "Will verify:"}</p>
                  <p className="mt-1 font-mono text-sm text-primary">{emailInput}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {isAr
                      ? "سيتم إرسال رابط التحقق إلى بريدك الإلكتروني بعد إنشاء الحساب"
                      : "A verification link will be sent after account creation"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSignUpStep("contact")}>
                    {isAr ? "رجوع" : "Back"}
                  </Button>
                  <Button className="flex-1" onClick={handleSendEmailVerification}>
                    {isAr ? "متابعة" : "Continue"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </AuthLayout>
    );
  }

  // ── Sign Up Step 3: Details ──
  if (signUpStep === "details" && isSignUp) {
    return (
      <AuthLayout stage="details" isAr={isAr} currentStep={2}>
        <SEOHead title={isAr ? "المعلومات الشخصية" : "Your Details"} description="Complete your details" />
        <Card className="border-border/50 shadow-xl shadow-primary/5">
          <div className="p-5 md:p-6 space-y-5">
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
                <UserPlus className="h-7 w-7 text-primary" />
              </div>
              <h2 className={`${isAr ? "font-sans" : "font-serif"} text-xl font-bold`}>{isAr ? "المعلومات الشخصية" : "Personal Details"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {isAr ? `الخطوة 3 من ${totalSteps}` : `Step 3 of ${totalSteps}`}
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <CheckCircle className="h-5 w-5 text-primary shrink-0" />
              <div className="text-sm">
                {signUpMethod === "phone" ? (
                  <>
                    <span className="font-medium">{isAr ? "تم التحقق:" : "Verified:"}</span>{" "}
                    <span className="font-mono text-primary" dir="ltr">{verifiedPhone}</span>
                  </>
                ) : (
                  <>
                    <span className="font-medium">{isAr ? "البريد:" : "Email:"}</span>{" "}
                    <span className="text-primary">{verifiedEmail}</span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs">{isAr ? "الاسم الكامل" : "Full Name"} *</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={isAr ? "الاسم الكامل" : "Full name"} />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
            </div>

            {signUpMethod === "phone" && (
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">{isAr ? "البريد الإلكتروني" : "Email"} *</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={isAr ? "البريد الإلكتروني" : "Email address"} />
                <p className="text-[10px] text-muted-foreground">{isAr ? "مطلوب لإنشاء الحساب وإرسال الإشعارات" : "Required for account creation and notifications"}</p>
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSignUpStep("verify")}>{isAr ? "رجوع" : "Back"}</Button>
              <Button className="flex-1" onClick={handleDetailsSubmit}>{isAr ? "التالي" : "Next"}</Button>
            </div>
          </div>
        </Card>
      </AuthLayout>
    );
  }

  // ── Sign Up Step 4: Credentials ──
  if (signUpStep === "credentials" && isSignUp) {
    return (
      <AuthLayout stage="credentials" isAr={isAr} currentStep={3}>
        <SEOHead title={isAr ? "إنشاء حسابك" : "Complete Registration"} description="Set your password and username" />
        <Card className="border-border/50 shadow-xl shadow-primary/5">
          <div className="p-5 md:p-6 space-y-5">
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
                <UserPlus className="h-7 w-7 text-primary" />
              </div>
              <h2 className={`${isAr ? "font-sans" : "font-serif"} text-xl font-bold`}>{isAr ? "إنشاء حسابك" : "Create Your Account"}</h2>
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
              {usernameStatus === "taken" && (
                <UsernameSuggestions baseUsername={username} onSelect={(s) => setUsername(s)} />
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs">{isAr ? "كلمة المرور" : "Password"} *</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              <PasswordStrengthMeter password={password} />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs">{isAr ? "تأكيد كلمة المرور" : "Confirm Password"} *</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive">{isAr ? "غير متطابقة" : "Passwords don't match"}</p>
              )}
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
            </div>

            {/* Terms */}
            <TermsAgreement checked={termsAccepted} onCheckedChange={setTermsAccepted} error={errors.terms} />

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSignUpStep("details")}>{isAr ? "رجوع" : "Back"}</Button>
              <Button
                className="flex-1 gap-2"
                size="lg"
                disabled={loading || usernameStatus !== "available" || !termsAccepted}
                onClick={handleCreateAccount}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                {loading ? (isAr ? "جاري الإنشاء..." : "Creating...") : (isAr ? "إنشاء الحساب" : "Create Account")}
              </Button>
            </div>
          </div>
        </Card>
      </AuthLayout>
    );
  }

  // ── Sign In: Phone OTP step ──
  if (!isSignUp && signInMethod === "phone" && signInPhoneStep === "otp") {
    return (
      <AuthLayout stage="verify" isAr={isAr}>
        <SEOHead title={isAr ? "التحقق من الهاتف" : "Verify Phone"} description="Verify your phone to sign in" />
        <Card className="border-border/50 shadow-xl shadow-primary/5">
          <div className="p-5 md:p-6">
            <PhoneVerification
              onVerified={handleSignInPhoneVerified}
              onBack={() => setSignInPhoneStep("phone")}
              initialPhone={signInPhoneCode + signInPhone}
              phoneCode={signInPhoneCode}
              mode="login"
            />
          </div>
        </Card>
      </AuthLayout>
    );
  }

  // ── Sign In: Phone password step ──
  if (!isSignUp && signInMethod === "phone" && signInPhoneStep === "password") {
    return (
      <AuthLayout stage="login" isAr={isAr}>
        <SEOHead title={isAr ? "تسجيل الدخول" : "Sign In"} description="Enter your password" />
        <Card className="border-border/50 shadow-xl shadow-primary/5">
          <div className="p-5 md:p-6 space-y-5">
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
                <LogIn className="h-7 w-7 text-primary" />
              </div>
              <h2 className={`${isAr ? "font-sans" : "font-serif"} text-xl font-bold`}>{isAr ? "تسجيل الدخول" : "Sign In"}</h2>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <CheckCircle className="h-5 w-5 text-primary shrink-0" />
              <div className="text-sm">
                <span className="font-medium">{isAr ? "تم التحقق:" : "Verified:"}</span>{" "}
                <span className="font-mono text-primary" dir="ltr">{signInVerifiedPhone}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "البريد الإلكتروني" : "Email"}</Label>
              <Input type="email" value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)} placeholder={isAr ? "البريد المرتبط بحسابك" : "Email linked to your account"} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "كلمة المرور" : "Password"}</Label>
              <Input type="password" value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)} placeholder="••••••••" onKeyDown={(e) => e.key === "Enter" && handleSignInEmail()} />
              {errors.signInPassword && <p className="text-xs text-destructive">{errors.signInPassword}</p>}
            </div>

            <Button className="w-full gap-2" size="lg" onClick={handleSignInEmail} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {isAr ? "تسجيل الدخول" : "Sign In"}
            </Button>

            <button type="button" className="w-full text-center text-xs text-primary hover:underline" onClick={() => { setSignInPhoneStep("phone"); setSignInMethod("phone"); }}>
              {isAr ? "رجوع" : "Back"}
            </button>
          </div>
        </Card>
      </AuthLayout>
    );
  }

  /* ── Main auth view (Sign In or Sign Up Step 1) ── */
  return (
    <AuthLayout stage={getStage()} isAr={isAr} showFooter currentStep={isSignUp ? 0 : undefined}>
      <SEOHead
        title={isSignUp ? (isAr ? "إنشاء حساب - Altohaa" : "Sign Up - Altohaa") : (isAr ? "تسجيل الدخول - Altohaa" : "Sign In - Altohaa")}
        description="Join the global culinary community. Sign in or create your free account on Altohaa."
      />

      {/* Header */}
      <div className="flex flex-col items-center text-center">
        <img src="/altohaa-logo.png" alt="Altohaa" className="mb-3 h-12 w-auto lg:hidden" />
        <h1 className={`${isAr ? "font-sans" : "font-serif"} text-2xl font-bold`}>
          {isSignUp ? (isAr ? "إنشاء حساب جديد" : "Create Account") : (isAr ? "تسجيل الدخول" : "Sign In")}
        </h1>
        {isSignUp && (
          <p className="mt-1 text-sm text-muted-foreground">
            {isAr ? `الخطوة 1 من ${totalSteps} — طريقة التسجيل` : `Step 1 of ${totalSteps} — Registration method`}
          </p>
        )}
      </div>

      {/* Google Sign In */}
      <Button variant="outline" className="w-full gap-2" size="lg" onClick={handleGoogleSignIn} disabled={loading}>
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
            /* ── SIGN UP: Step 1 Contact ── */
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
                  <PhoneInputWithFlag
                    phone={phoneInput}
                    onPhoneChange={setPhoneInput}
                    countryCode={countryCode}
                    phoneCode={phoneCode}
                    onCountryChange={(code, pc) => {
                      setCountryCode(code);
                      setPhoneCode(pc);
                    }}
                    error={errors.phone}
                    label={isAr ? "رقم الهاتف" : "Phone Number"}
                    isAr={isAr}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    {isAr ? "سيتم إرسال رمز التحقق إلى هذا الرقم" : "A verification code will be sent to this number"}
                  </p>
                </>
              ) : (
                <>
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

              <Button className="w-full gap-2" size="lg" onClick={handleContactSubmit}>
                {signUpMethod === "phone"
                  ? (isAr ? "التالي — التحقق من الهاتف" : "Next — Verify Phone")
                  : (isAr ? "التالي — التحقق من البريد" : "Next — Verify Email")}
              </Button>
            </>
          ) : (
            /* ── SIGN IN ── */
            <>
              {/* Sign-in method toggle */}
              <div className="flex rounded-lg border border-border/50 p-1 gap-1">
                <button
                  type="button"
                  onClick={() => { setSignInMethod("phone"); setErrors({}); }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    signInMethod === "phone"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Phone className="h-4 w-4" />
                  {isAr ? "الهاتف" : "Phone"}
                </button>
                <button
                  type="button"
                  onClick={() => { setSignInMethod("email"); setErrors({}); }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    signInMethod === "email"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  {isAr ? "البريد" : "Email"}
                </button>
              </div>

              {signInMethod === "phone" ? (
                <>
                  <PhoneInputWithFlag
                    phone={signInPhone}
                    onPhoneChange={setSignInPhone}
                    countryCode={signInCountry}
                    phoneCode={signInPhoneCode}
                    onCountryChange={(code, pc) => {
                      setSignInCountry(code);
                      setSignInPhoneCode(pc);
                    }}
                    error={errors.signInPhone}
                    label={isAr ? "رقم الهاتف" : "Phone Number"}
                    isAr={isAr}
                  />

                  <Button
                    className="w-full gap-2"
                    size="lg"
                    onClick={() => {
                      const fullPhone = signInPhoneCode + signInPhone.replace(/\s/g, "");
                      if (!/^\+?[1-9]\d{7,14}$/.test(fullPhone)) {
                        setErrors({ signInPhone: isAr ? "رقم غير صالح" : "Invalid number" });
                        return;
                      }
                      setErrors({});
                      setSignInPhoneStep("otp");
                    }}
                  >
                    {isAr ? "التالي — التحقق" : "Next — Verify"}
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="signInEmail" className="text-xs">{isAr ? "البريد الإلكتروني" : "Email"}</Label>
                    <Input
                      id="signInEmail"
                      type="email"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      placeholder={isAr ? "البريد الإلكتروني" : "Email address"}
                      onKeyDown={(e) => e.key === "Enter" && document.getElementById("signInPassword")?.focus()}
                    />
                    {errors.signInEmail && <p className="text-xs text-destructive">{errors.signInEmail}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signInPassword" className="text-xs">{isAr ? "كلمة المرور" : "Password"}</Label>
                      <button type="button" className="text-[10px] text-primary hover:underline" onClick={() => setForgotOpen(true)}>
                        {isAr ? "نسيت كلمة المرور؟" : "Forgot password?"}
                      </button>
                    </div>
                    <Input
                      id="signInPassword"
                      type="password"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="••••••••"
                      onKeyDown={(e) => e.key === "Enter" && handleSignInEmail()}
                    />
                    {errors.signInPassword && <p className="text-xs text-destructive">{errors.signInPassword}</p>}
                  </div>

                  <Button className="w-full gap-2" size="lg" disabled={loading} onClick={handleSignInEmail}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                    {loading ? (isAr ? "جاري الدخول..." : "Signing in...") : (isAr ? "تسجيل الدخول" : "Sign In")}
                  </Button>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Toggle sign in / sign up */}
      <div className="flex items-center justify-center gap-1.5 text-sm">
        <span className="text-muted-foreground">
          {isSignUp ? (isAr ? "لديك حساب بالفعل؟" : "Already have an account?") : (isAr ? "ليس لديك حساب؟" : "Don't have an account?")}
        </span>
        <button
          type="button"
          className="font-medium text-primary underline-offset-2 hover:underline"
          onClick={() => {
            if (isSignUp) {
              navigate("/login", { replace: true });
            } else {
              navigate("/register", { replace: true });
            }
            setIsSignUp(!isSignUp);
            setErrors({});
            setSignInPhoneStep("phone");
          }}
        >
          {isSignUp ? (isAr ? "تسجيل الدخول" : "Sign In") : (isAr ? "إنشاء حساب" : "Sign Up")}
        </button>
      </div>

      {/* Forgot Password Dialog */}
      <ForgotPasswordDialog open={forgotOpen} onOpenChange={setForgotOpen} />
    </AuthLayout>
  );
}
