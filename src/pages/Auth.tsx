import { useIsAr } from "@/hooks/useIsAr";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { normalizePhoneForStorage } from "@/lib/arabicNumerals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SEOHead } from "@/components/SEOHead";
import { PhoneVerification } from "@/components/auth/PhoneVerification";
import { CountrySelector } from "@/components/auth/CountrySelector";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { UsernameSuggestions } from "@/components/auth/UsernameSuggestions";
import { ForgotPasswordDialog } from "@/components/auth/ForgotPasswordDialog";
import { TermsAgreement } from "@/components/auth/TermsAgreement";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PhoneInputWithFlag } from "@/components/auth/PhoneInputWithFlag";
import {
  CheckCircle, XCircle, Loader2, ShieldCheck, UserPlus, LogIn,
  Phone, Mail, KeyRound, Gift, ChefHat, Heart, AlertCircle,
} from "lucide-react";

import { useAuthHandlers } from "./auth/useAuthHandlers";

const MAX_LOGIN_ATTEMPTS = 5;

export default function Auth() {
  const location = useLocation();
  const isResetMode = location.pathname === "/reset-password";
  const [isSignUp, setIsSignUp] = useState(location.pathname === "/register");

  const { user } = useAuth();
  const isAr = useIsAr();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const auth = useAuthHandlers({ isAr, language, isSignUp, setIsSignUp });

  // Capture referral code from URL
  const searchParams = new URLSearchParams(location.search);
  const refCode = searchParams.get("ref");

  useEffect(() => {
    if (refCode) {
      try { localStorage.setItem("altoha_ref_code", refCode); } catch {}
      supabase.functions.invoke("track-referral-click", {
        body: { code: refCode, source: searchParams.get("utm_source") || "direct" },
      }).then(null, () => {});
    }
  }, [refCode]);

  useEffect(() => {
    if (user && !isResetMode) {
      const from = (location.state as { from?: string })?.from || "/";
      navigate(from, { replace: true });
    }
  }, [user, navigate, isResetMode, location.state]);

  useEffect(() => {
    if (location.pathname === "/register") setIsSignUp(true);
    else if (location.pathname === "/login") setIsSignUp(false);
  }, [location.pathname]);

  const totalSteps = 4;

  const getStage = () => {
    if (isResetMode) return "reset" as const;
    if (!isSignUp) return "login" as const;
    if (auth.signUpStep === "verify") return "verify" as const;
    if (auth.signUpStep === "details") return "details" as const;
    if (auth.signUpStep === "credentials") return "credentials" as const;
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

            {auth.resetSuccess ? (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center space-y-2 animate-in fade-in duration-300">
                <CheckCircle className="mx-auto h-8 w-8 text-primary" />
                <p className="text-sm font-medium text-primary">{isAr ? "تم تحديث كلمة المرور بنجاح!" : "Password updated successfully!"}</p>
                <p className="text-xs text-muted-foreground">{isAr ? "جاري إعادة التوجيه..." : "Redirecting..."}</p>
              </div>
            ) : (
              <>
                {auth.formError && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 animate-in slide-in-from-top-1 duration-200">
                    <p className="flex items-center gap-1.5 text-xs text-destructive"><AlertCircle className="h-3.5 w-3.5 shrink-0" />{auth.formError}</p>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? "كلمة المرور الجديدة" : "New Password"} *</Label>
                  <Input type="password" autoComplete="new-password" value={auth.resetPassword} onChange={(e) => auth.setResetPassword(e.target.value)} placeholder="••••••••" />
                  <PasswordStrengthMeter password={auth.resetPassword} />
                  {auth.errors.resetPassword && <p className="text-xs text-destructive">{auth.errors.resetPassword}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? "تأكيد كلمة المرور" : "Confirm Password"} *</Label>
                  <Input type="password" autoComplete="new-password" value={auth.resetConfirm} onChange={(e) => auth.setResetConfirm(e.target.value)} placeholder="••••••••" />
                  {auth.errors.resetConfirm && <p className="text-xs text-destructive">{auth.errors.resetConfirm}</p>}
                </div>
                <Button className="w-full" size="lg" onClick={auth.handleResetPassword} disabled={auth.loading}>
                  {auth.loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                  {isAr ? "تعيين كلمة المرور الجديدة" : "Set New Password"}
                </Button>
              </>
            )}
          </div>
        </Card>
      </AuthLayout>
    );
  }

  // ── Sign Up Step 2: Verification ──
  if (auth.signUpStep === "verify" && isSignUp) {
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
                {auth.signUpMethod === "phone" ? (isAr ? "التحقق من رقم الهاتف" : "Phone Verification") : (isAr ? "التحقق من البريد الإلكتروني" : "Email Verification")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{isAr ? `الخطوة 2 من ${totalSteps}` : `Step 2 of ${totalSteps}`}</p>
            </div>

            {auth.signUpMethod === "phone" ? (
              <PhoneVerification onVerified={auth.handlePhoneVerified} onBack={() => auth.setSignUpStep("contact")} initialPhone={auth.phoneCode + auth.phoneInput} phoneCode={auth.phoneCode} mode="signup" />
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
                  <Mail className="mx-auto mb-2 h-8 w-8 text-primary" />
                  <p className="text-sm font-medium">{isAr ? "سيتم التحقق من:" : "Will verify:"}</p>
                  <p className="mt-1 font-mono text-sm text-primary">{auth.emailInput}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{isAr ? "سيتم إرسال رابط التحقق إلى بريدك الإلكتروني بعد إنشاء الحساب" : "A verification link will be sent after account creation"}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => auth.setSignUpStep("contact")}>{isAr ? "رجوع" : "Back"}</Button>
                  <Button className="flex-1" onClick={auth.handleSendEmailVerification}>{isAr ? "متابعة" : "Continue"}</Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </AuthLayout>
    );
  }

  // ── Sign Up Step 3: Details ──
  if (auth.signUpStep === "details" && isSignUp) {
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
              <p className="mt-1 text-sm text-muted-foreground">{isAr ? `الخطوة 3 من ${totalSteps}` : `Step 3 of ${totalSteps}`}</p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
              <CheckCircle className="h-5 w-5 text-primary shrink-0" />
              <div className="text-sm">
                {auth.signUpMethod === "phone" ? (
                  <><span className="font-medium">{isAr ? "تم التحقق:" : "Verified:"}</span> <span className="font-mono text-primary" dir="ltr">{auth.verifiedPhone}</span></>
                ) : (
                  <><span className="font-medium">{isAr ? "البريد:" : "Email:"}</span> <span className="text-primary">{auth.verifiedEmail}</span></>
                )}
              </div>
            </div>

            {/* Account Type Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">{isAr ? "نوع الحساب" : "Account Type"} *</Label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => auth.setAccountType("professional")} className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all duration-200 ${auth.accountType === "professional" ? "border-primary bg-primary/5 shadow-md shadow-primary/10" : "border-border/50 hover:border-primary/30 hover:bg-muted/50"}`}>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${auth.accountType === "professional" ? "bg-primary/15" : "bg-muted"}`}>
                    <ChefHat className={`h-5 w-5 ${auth.accountType === "professional" ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${auth.accountType === "professional" ? "text-primary" : "text-foreground"}`}>{isAr ? "محترف" : "Professional"}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-tight">{isAr ? "طاهٍ أو محترف في مجال الطهي" : "Chef or culinary professional"}</p>
                  </div>
                </button>
                <button type="button" onClick={() => auth.setAccountType("fan")} className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all duration-200 ${auth.accountType === "fan" ? "border-primary bg-primary/5 shadow-md shadow-primary/10" : "border-border/50 hover:border-primary/30 hover:bg-muted/50"}`}>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${auth.accountType === "fan" ? "bg-primary/15" : "bg-muted"}`}>
                    <Heart className={`h-5 w-5 ${auth.accountType === "fan" ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${auth.accountType === "fan" ? "text-primary" : "text-foreground"}`}>{isAr ? "مستخدم عادي" : "Regular User"}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-tight">{isAr ? "تابع الطهاة والمسابقات والمعارض" : "Follow chefs, competitions & events"}</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs">{isAr ? "الاسم الكامل" : "Full Name"} *</Label>
              <Input id="fullName" value={auth.fullName} onChange={(e) => auth.setFullName(e.target.value)} placeholder={isAr ? "الاسم الكامل" : "Full name"} />
              {auth.errors.fullName && <p className="text-xs text-destructive">{auth.errors.fullName}</p>}
            </div>

            {auth.signUpMethod === "phone" && (
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">{isAr ? "البريد الإلكتروني" : "Email"} *</Label>
                <Input id="email" type="email" value={auth.email} onChange={(e) => auth.setEmail(e.target.value)} placeholder={isAr ? "البريد الإلكتروني" : "Email address"} />
                <p className="text-xs text-muted-foreground">{isAr ? "مطلوب لإنشاء الحساب وإرسال الإشعارات" : "Required for account creation and notifications"}</p>
                {auth.errors.email && <p className="text-xs text-destructive">{auth.errors.email}</p>}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => auth.setSignUpStep("verify")}>{isAr ? "رجوع" : "Back"}</Button>
              <Button className="flex-1" onClick={auth.handleDetailsSubmit}>{isAr ? "التالي" : "Next"}</Button>
            </div>
          </div>
        </Card>
      </AuthLayout>
    );
  }

  // ── Sign Up Step 4: Credentials ──
  if (auth.signUpStep === "credentials" && isSignUp) {
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
              <p className="mt-1 text-sm text-muted-foreground">{isAr ? `الخطوة 4 من ${totalSteps}` : `Step 4 of ${totalSteps}`}</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs">{isAr ? "اسم المستخدم" : "Username"} *</Label>
              <div className="relative">
                <Input id="username" value={auth.username} onChange={(e) => auth.setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))} className="pe-10" placeholder="your_username" />
                <div className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2">
                  {auth.usernameStatus === "checking" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  {auth.usernameStatus === "available" && <CheckCircle className="h-4 w-4 text-primary" />}
                  {auth.usernameStatus === "taken" && <XCircle className="h-4 w-4 text-destructive" />}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">altoha.com/<span className="font-medium">{auth.username || "username"}</span></p>
              {auth.errors.username && <p className="text-xs text-destructive">{auth.errors.username}</p>}
              {auth.usernameStatus === "taken" && <UsernameSuggestions baseUsername={auth.username} onSelect={(s) => auth.setUsername(s)} />}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs">{isAr ? "كلمة المرور" : "Password"} *</Label>
              <Input id="password" type="password" autoComplete="new-password" value={auth.password} onChange={(e) => auth.setPassword(e.target.value)} placeholder="••••••••" />
              <PasswordStrengthMeter password={auth.password} />
              {auth.errors.password && <p className="text-xs text-destructive">{auth.errors.password}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs">{isAr ? "تأكيد كلمة المرور" : "Confirm Password"} *</Label>
              <Input id="confirmPassword" type="password" autoComplete="new-password" value={auth.confirmPassword} onChange={(e) => auth.setConfirmPassword(e.target.value)} placeholder="••••••••" />
              {auth.confirmPassword && auth.password !== auth.confirmPassword && <p className="text-xs text-destructive">{isAr ? "غير متطابقة" : "Passwords don't match"}</p>}
              {auth.errors.confirmPassword && <p className="text-xs text-destructive">{auth.errors.confirmPassword}</p>}
            </div>

            {!localStorage.getItem("altoha_ref_code") && (
              <div className="space-y-1.5">
                <Label htmlFor="refCode" className="text-xs">{isAr ? "كود الإحالة (اختياري)" : "Referral Code (optional)"}</Label>
                <Input id="refCode" value={auth.manualRefCode} onChange={(e) => auth.setManualRefCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} placeholder={isAr ? "أدخل كود الإحالة" : "Enter referral code"} className="font-mono tracking-wider" dir="ltr" maxLength={8} />
                <p className="text-xs text-muted-foreground">{isAr ? "إذا أحالك أحد الأصدقاء، أدخل الكود هنا" : "If a friend referred you, enter their code here"}</p>
              </div>
            )}

            {localStorage.getItem("altoha_ref_code") && (
              <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
                <Gift className="h-4 w-4 text-primary shrink-0" />
                <p className="text-sm">{isAr ? "كود الإحالة مُطبق:" : "Referral code applied:"} <span className="font-mono font-bold text-primary">{localStorage.getItem("altoha_ref_code")}</span></p>
              </div>
            )}

            <TermsAgreement checked={auth.termsAccepted} onCheckedChange={auth.setTermsAccepted} error={auth.errors.terms} />

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => auth.setSignUpStep("details")}>{isAr ? "رجوع" : "Back"}</Button>
              <Button className="flex-1 gap-2" size="lg" disabled={auth.loading || auth.usernameStatus !== "available" || !auth.termsAccepted} onClick={auth.handleCreateAccount}>
                {auth.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                {auth.loading ? (isAr ? "جاري الإنشاء..." : "Creating...") : (isAr ? "إنشاء الحساب" : "Create Account")}
              </Button>
            </div>
          </div>
        </Card>
      </AuthLayout>
    );
  }

  // ── Sign In: Phone OTP step ──
  if (!isSignUp && auth.signInMethod === "phone" && auth.signInPhoneStep === "otp") {
    return (
      <AuthLayout stage="verify" isAr={isAr}>
        <SEOHead title={isAr ? "التحقق من الهاتف" : "Verify Phone"} description="Verify your phone to sign in" />
        <Card className="border-border/50 shadow-xl shadow-primary/5">
          <div className="p-5 md:p-6">
            <PhoneVerification onVerified={auth.handleSignInPhoneVerified} onBack={() => auth.setSignInPhoneStep("phone")} initialPhone={auth.signInPhoneCode + auth.signInPhone} phoneCode={auth.signInPhoneCode} mode="login" />
          </div>
        </Card>
      </AuthLayout>
    );
  }

  // ── Sign In: PIN step ──
  if (!isSignUp && auth.signInMethod === "phone" && auth.signInPhoneStep === "pin") {
    return (
      <AuthLayout stage="login" isAr={isAr}>
        <SEOHead title={isAr ? "الدخول بالرمز السري" : "PIN Login"} description="Sign in with your PIN" />
        <Card className="border-border/50 shadow-xl shadow-primary/5">
          <div className="p-5 md:p-6 space-y-5">
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15"><KeyRound className="h-7 w-7 text-primary" /></div>
              <h2 className={`${isAr ? "font-sans" : "font-serif"} text-xl font-bold`}>{isAr ? "الدخول بالرمز السري" : "PIN Login"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{isAr ? "أدخل رمز الدخول السريع المكون من 6 أرقام" : "Enter your 6-digit quick login PIN"}</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
              <Phone className="h-5 w-5 text-primary shrink-0" />
              <span className="font-mono text-sm text-primary" dir="ltr">{auth.signInPhoneCode + auth.signInPhone}</span>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "رمز الدخول السريع (PIN)" : "Quick Login PIN"}</Label>
              <Input type="password" autoComplete="off" inputMode="numeric" maxLength={6} value={auth.signInPin} onChange={(e) => { auth.setSignInPin(e.target.value.replace(/\D/g, "").slice(0, 6)); auth.setPinError(""); }} placeholder="••••••" className="text-center text-2xl tracking-[0.5em] font-mono" autoFocus onKeyDown={(e) => e.key === "Enter" && auth.signInPin.length === 6 && auth.handlePinLogin()} />
            </div>
            {auth.pinError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
                <p className="flex items-center gap-1.5 text-xs text-destructive"><AlertCircle className="h-3.5 w-3.5 shrink-0" />{auth.pinError}</p>
              </div>
            )}
            <Button className="w-full gap-2" size="lg" onClick={auth.handlePinLogin} disabled={auth.loading || auth.signInPin.length !== 6}>
              {auth.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              {isAr ? "تسجيل الدخول" : "Sign In"}
            </Button>
            <button type="button" className="w-full text-center text-xs text-primary hover:underline" onClick={() => { auth.setSignInPhoneStep("otp"); auth.setSignInPin(""); auth.setPinError(""); }}>
              {isAr ? "الدخول بالتحقق من الهاتف بدلاً من ذلك" : "Use phone verification instead"}
            </button>
          </div>
        </Card>
      </AuthLayout>
    );
  }

  // ── Sign In: Phone password step ──
  if (!isSignUp && auth.signInMethod === "phone" && auth.signInPhoneStep === "password") {
    return (
      <AuthLayout stage="login" isAr={isAr}>
        <SEOHead title={isAr ? "تسجيل الدخول" : "Sign In"} description="Enter your password" />
        <Card className="border-border/50 shadow-xl shadow-primary/5">
          <div className="p-5 md:p-6 space-y-5">
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15"><LogIn className="h-7 w-7 text-primary" /></div>
              <h2 className={`${isAr ? "font-sans" : "font-serif"} text-xl font-bold`}>{isAr ? "تسجيل الدخول" : "Sign In"}</h2>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
              <CheckCircle className="h-5 w-5 text-primary shrink-0" />
              <div className="text-sm"><span className="font-medium">{isAr ? "تم التحقق:" : "Verified:"}</span> <span className="font-mono text-primary" dir="ltr">{auth.signInVerifiedPhone}</span></div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "كلمة المرور" : "Password"}</Label>
              <Input type="password" autoComplete="current-password" value={auth.signInPassword} onChange={(e) => auth.setSignInPassword(e.target.value)} placeholder="••••••••" onKeyDown={(e) => e.key === "Enter" && auth.handleSignInPhonePassword()} />
              {auth.errors.signInPassword && <p className="text-xs text-destructive">{auth.errors.signInPassword}</p>}
            </div>
            <Button className="w-full gap-2" size="lg" onClick={auth.handleSignInPhonePassword} disabled={auth.loading}>
              {auth.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {isAr ? "تسجيل الدخول" : "Sign In"}
            </Button>
            <button type="button" className="w-full text-center text-xs text-primary hover:underline" onClick={() => auth.setSignInPhoneStep("phone")}>{isAr ? "رجوع" : "Back"}</button>
          </div>
        </Card>
      </AuthLayout>
    );
  }

  /* ── Main auth view (Sign In or Sign Up Step 1) ── */
  return (
    <AuthLayout stage={getStage()} isAr={isAr} showFooter currentStep={isSignUp ? 0 : undefined}>
      <SEOHead
        title={isSignUp ? (isAr ? "إنشاء حساب - Altoha" : "Sign Up - Altoha") : (isAr ? "تسجيل الدخول - Altoha" : "Sign In - Altoha")}
        description="Join the global culinary community. Sign in or create your free account on Altoha."
      />

      <div className="flex flex-col items-center text-center">
        <img loading="lazy" src="/altoha-logo.png" alt="Altoha" className="mb-3 h-12 w-auto lg:hidden" />
        <h1 className={`${isAr ? "font-sans" : "font-serif"} text-2xl font-bold`}>
          {isSignUp ? (isAr ? "إنشاء حساب جديد" : "Create Account") : (isAr ? "تسجيل الدخول" : "Sign In")}
        </h1>
        {isSignUp && <p className="mt-1 text-sm text-muted-foreground">{isAr ? `الخطوة 1 من ${totalSteps} — طريقة التسجيل` : `Step 1 of ${totalSteps} — Registration method`}</p>}
      </div>

      <Button variant="outline" className="w-full gap-2" size="lg" onClick={auth.handleGoogleSignIn} disabled={auth.loading}>
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

      <Card className="border-border/50 shadow-lg shadow-primary/5">
        <CardContent className="space-y-4 p-5 md:p-6">
          {isSignUp ? (
            <>
              <div className="flex rounded-xl border border-border/40 bg-muted/40 p-1 gap-1">
                <button type="button" onClick={() => auth.setSignUpMethod("phone")} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200 ${auth.signUpMethod === "phone" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-background/60"}`}>
                  <Phone className="h-4 w-4" />{isAr ? "رقم الهاتف" : "Phone"}
                </button>
                <button type="button" onClick={() => auth.setSignUpMethod("email")} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200 ${auth.signUpMethod === "email" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-background/60"}`}>
                  <Mail className="h-4 w-4" />{isAr ? "البريد الإلكتروني" : "Email"}
                </button>
              </div>

              {auth.signUpMethod === "phone" ? (
                <>
                  <PhoneInputWithFlag phone={auth.phoneInput} onPhoneChange={auth.setPhoneInput} countryCode={auth.countryCode} phoneCode={auth.phoneCode} onCountryChange={(code, pc) => { auth.setCountryCode(code); auth.setPhoneCode(pc); }} error={auth.errors.phone} label={isAr ? "رقم الهاتف" : "Phone Number"} isAr={isAr} />
                  <p className="text-xs text-muted-foreground">{isAr ? "سيتم إرسال رمز التحقق إلى هذا الرقم" : "A verification code will be sent to this number"}</p>
                </>
              ) : (
                <>
                  <CountrySelector value={auth.countryCode} onChange={(code, country) => { auth.setCountryCode(code); auth.setPhoneCode(country?.phone_code || ""); }} label={isAr ? "الدولة" : "Country"} required />
                  {auth.errors.countryCode && <p className="text-xs text-destructive">{auth.errors.countryCode}</p>}
                  <div className="space-y-1.5">
                    <Label htmlFor="emailInput" className="text-xs">{isAr ? "البريد الإلكتروني" : "Email"} *</Label>
                    <Input id="emailInput" type="email" value={auth.emailInput} onChange={(e) => auth.setEmailInput(e.target.value)} placeholder={isAr ? "البريد الإلكتروني" : "Email address"} />
                    {auth.errors.email && <p className="text-xs text-destructive">{auth.errors.email}</p>}
                    <p className="text-xs text-muted-foreground">{isAr ? "سيتم إرسال رابط التحقق إلى هذا البريد" : "A verification link will be sent to this email"}</p>
                  </div>
                </>
              )}

              <Button className="w-full gap-2" size="lg" onClick={auth.handleContactSubmit}>
                {auth.signUpMethod === "phone" ? (isAr ? "التالي — التحقق من الهاتف" : "Next — Verify Phone") : (isAr ? "التالي — التحقق من البريد" : "Next — Verify Email")}
              </Button>
            </>
          ) : (
            <>
              <div className="flex rounded-xl border border-border/40 bg-muted/40 p-1 gap-1">
                <button type="button" onClick={() => { auth.setSignInMethod("phone"); auth.setErrors({}); }} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200 ${auth.signInMethod === "phone" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-background/60"}`}>
                  <Phone className="h-4 w-4" />{isAr ? "الهاتف" : "Phone"}
                </button>
                <button type="button" onClick={() => { auth.setSignInMethod("email"); auth.setErrors({}); }} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200 ${auth.signInMethod === "email" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-background/60"}`}>
                  <Mail className="h-4 w-4" />{isAr ? "البريد / المستخدم" : "Email / Username"}
                </button>
              </div>

              {auth.signInMethod === "phone" ? (
                <>
                  <PhoneInputWithFlag phone={auth.signInPhone} onPhoneChange={(val) => { auth.setSignInPhone(val); auth.setPinAvailable(false); }} countryCode={auth.signInCountry} phoneCode={auth.signInPhoneCode} onCountryChange={(code, pc) => { auth.setSignInCountry(code); auth.setSignInPhoneCode(pc); auth.setPinAvailable(false); }} error={auth.errors.signInPhone} label={isAr ? "رقم الهاتف" : "Phone Number"} isAr={isAr} />
                  <Button className="w-full gap-2" size="lg" onClick={async () => {
                    const fullPhone = auth.signInPhoneCode + auth.signInPhone.replace(/\s/g, "");
                    if (!/^\+?[1-9]\d{7,14}$/.test(fullPhone)) { auth.setErrors({ signInPhone: isAr ? "رقم غير صالح" : "Invalid number" }); return; }
                    auth.setErrors({});
                    await auth.checkPinForPhone(normalizePhoneForStorage(fullPhone));
                    auth.setSignInPhoneStep("otp");
                  }}>
                    {isAr ? "التالي — التحقق" : "Next — Verify"}
                  </Button>
                  {auth.pinAvailable && (
                    <button type="button" className="w-full text-center text-xs text-primary hover:underline flex items-center justify-center gap-1.5" onClick={() => {
                      const fullPhone = auth.signInPhoneCode + auth.signInPhone.replace(/\s/g, "");
                      if (!/^\+?[1-9]\d{7,14}$/.test(fullPhone)) { auth.setErrors({ signInPhone: isAr ? "رقم غير صالح" : "Invalid number" }); return; }
                      auth.setErrors({});
                      auth.setSignInPhoneStep("pin");
                    }}>
                      <KeyRound className="h-3 w-3" />{isAr ? "الدخول بالرمز السري (PIN)" : "Login with PIN"}
                    </button>
                  )}
                </>
              ) : (
                <>
                  {auth.isLockedOut && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-center animate-in fade-in slide-in-from-top-2 duration-300">
                      <ShieldCheck className="h-5 w-5 text-destructive mx-auto mb-1.5" />
                      <p className="text-sm font-medium text-destructive">{isAr ? "تم قفل تسجيل الدخول مؤقتاً بسبب محاولات كثيرة" : "Login temporarily locked due to too many attempts"}</p>
                      <p className="text-xs text-muted-foreground mt-1">{isAr ? "يرجى الانتظار 5 دقائق ثم أعد المحاولة" : "Please wait 5 minutes, then try again"}</p>
                    </div>
                  )}
                  {auth.loginAttempts > 0 && auth.loginAttempts < MAX_LOGIN_ATTEMPTS && !auth.isLockedOut && (
                    <div className="rounded-xl border border-chart-4/30 bg-chart-4/5 px-3 py-2 text-center animate-in fade-in">
                      <p className="text-xs text-chart-4 font-medium">
                        {isAr ? `${MAX_LOGIN_ATTEMPTS - auth.loginAttempts} محاولات متبقية قبل القفل المؤقت` : `${MAX_LOGIN_ATTEMPTS - auth.loginAttempts} attempts remaining before temporary lock`}
                      </p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="signInEmail" className="text-xs">{isAr ? "البريد أو اسم المستخدم" : "Email or Username"}</Label>
                    <Input id="signInEmail" type="text" value={auth.signInEmail} onChange={(e) => { auth.setSignInEmail(e.target.value); if (auth.errors.signInEmail) auth.setErrors({ ...auth.errors, signInEmail: "" }); if (auth.formError) auth.setFormError(""); }} placeholder={isAr ? "البريد الإلكتروني أو اسم المستخدم" : "Email or username"} onKeyDown={(e) => e.key === "Enter" && document.getElementById("signInPassword")?.focus()} maxLength={255} autoComplete="username" disabled={auth.isLockedOut} />
                    {auth.errors.signInEmail && <p className="text-xs text-destructive">{auth.errors.signInEmail}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signInPassword" className="text-xs">{isAr ? "كلمة المرور" : "Password"}</Label>
                      <button type="button" className="text-xs text-primary hover:underline" onClick={() => auth.setForgotOpen(true)}>{isAr ? "نسيت كلمة المرور؟" : "Forgot password?"}</button>
                    </div>
                    <Input id="signInPassword" type="password" value={auth.signInPassword} onChange={(e) => { auth.setSignInPassword(e.target.value); if (auth.errors.signInPassword) auth.setErrors({ ...auth.errors, signInPassword: "" }); if (auth.formError) auth.setFormError(""); }} placeholder="••••••••" onKeyDown={(e) => e.key === "Enter" && auth.handleSignInEmail()} maxLength={128} autoComplete="current-password" disabled={auth.isLockedOut} />
                    {auth.errors.signInPassword && <p className="text-xs text-destructive">{auth.errors.signInPassword}</p>}
                  </div>

                  {auth.formError && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 animate-in slide-in-from-top-1 duration-200">
                      <p className="flex items-center gap-1.5 text-xs text-destructive"><AlertCircle className="h-3.5 w-3.5 shrink-0" />{auth.formError}</p>
                    </div>
                  )}

                  <Button className="w-full gap-2" size="lg" disabled={auth.loading || auth.isLockedOut} onClick={auth.handleSignInEmail}>
                    {auth.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                    {auth.loading ? (isAr ? "جاري الدخول..." : "Signing in...") : (isAr ? "تسجيل الدخول" : "Sign In")}
                  </Button>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-2 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">{isSignUp ? (isAr ? "لديك حساب بالفعل؟" : "Already have an account?") : (isAr ? "ليس لديك حساب؟" : "Don't have an account?")}</span>
          <button type="button" className="font-medium text-primary underline-offset-2 hover:underline" onClick={() => {
            if (isSignUp) navigate("/login", { replace: true });
            else navigate("/register", { replace: true });
            setIsSignUp(!isSignUp);
            auth.setErrors({});
            auth.setSignInPhoneStep("phone");
          }}>
            {isSignUp ? (isAr ? "تسجيل الدخول" : "Sign In") : (isAr ? "إنشاء حساب" : "Sign Up")}
          </button>
        </div>
        {!isSignUp && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">{isAr ? "حساب شركة؟" : "Company account?"}</span>
            <button type="button" className="font-medium text-primary underline-offset-2 hover:underline" onClick={() => navigate("/company-login")}>{isAr ? "تسجيل دخول الشركة" : "Company Login"}</button>
          </div>
        )}
      </div>

      <ForgotPasswordDialog open={auth.forgotOpen} onOpenChange={auth.setForgotOpen} />
    </AuthLayout>
  );
}
