import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { useToast } from "@/hooks/use-toast";
import { PhoneVerification } from "@/components/auth/PhoneVerification";
import { PhoneInputWithFlag } from "@/components/auth/PhoneInputWithFlag";
import { ForgotPasswordDialog } from "@/components/auth/ForgotPasswordDialog";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { z } from "zod";
import {
  Building2, Loader2, LogIn, Phone, Mail, KeyRound,
  CheckCircle, ArrowLeft, ShieldCheck,
} from "lucide-react";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000;

type LoginStep = "identify" | "credentials" | "phone-otp" | "phone-password";
type CredentialMethod = "email" | "phone";

const DEFAULT_PHONE_CODE = "+966";
const DEFAULT_COUNTRY = "SA";

export default function CompanyLogin() {
  const [step, setStep] = useState<LoginStep>("identify");
  const [credentialMethod, setCredentialMethod] = useState<CredentialMethod>("email");

  // Step 1: Company identification
  const [companyIdentifier, setCompanyIdentifier] = useState("");
  const [companyInfo, setCompanyInfo] = useState<{ id: string; name: string; name_ar: string | null; company_number: string | null } | null>(null);

  // Step 2: Credentials
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState(DEFAULT_PHONE_CODE);
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY);
  const [verifiedPhone, setVerifiedPhone] = useState("");

  // State
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);

  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAr = language === "ar";
  const isLockedOut = lockoutUntil !== null && Date.now() < lockoutUntil;

  // If already logged in and has company access, redirect
  useEffect(() => {
    if (user) {
      // Check if user has company access
      supabase
        .from("company_contacts")
        .select("company_id")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) navigate("/company", { replace: true });
        });
    }
  }, [user, navigate]);

  // Step 1: Lookup company by number or username
  const handleIdentifyCompany = async () => {
    setErrors({});
    const identifier = companyIdentifier.trim();

    if (!identifier) {
      setErrors({ identifier: isAr ? "أدخل رقم حساب الشركة أو اسم المستخدم" : "Enter company account number or username" });
      return;
    }

    setLoading(true);

    // Try by company_number first, then by username/slug
    let query = supabase
      .from("companies")
      .select("id, name, name_ar, company_number")
      .or(`company_number.eq.${identifier.toUpperCase()},slug.eq.${identifier.toLowerCase()}`)
      .maybeSingle();

    const { data, error } = await query;

    if (error || !data) {
      setLoading(false);
      setErrors({
        identifier: isAr
          ? "لم يتم العثور على حساب شركة بهذا الرقم أو اسم المستخدم"
          : "No company account found with this number or username",
      });
      return;
    }

    setCompanyInfo(data);
    setStep("credentials");
    setLoading(false);
  };

  // Step 2a: Sign in with email + password
  const handleEmailLogin = async () => {
    setErrors({});

    if (isLockedOut) {
      const remainingSec = Math.ceil(((lockoutUntil || 0) - Date.now()) / 1000);
      toast({
        variant: "destructive",
        title: isAr ? "محاولات كثيرة" : "Too many attempts",
        description: isAr ? `يرجى الانتظار ${remainingSec} ثانية` : `Please wait ${remainingSec} seconds`,
      });
      return;
    }

    const errs: Record<string, string> = {};
    if (!z.string().email().safeParse(email.trim()).success) errs.email = isAr ? "البريد الإلكتروني غير صالح" : "Invalid email";
    if (password.length < 6) errs.password = isAr ? "كلمة المرور قصيرة جداً" : "Password too short";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);

    // First verify this email belongs to a contact of this company
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (!profile) {
      setLoading(false);
      setErrors({ email: isAr ? "هذا البريد غير مرتبط بحساب هذه الشركة" : "This email is not linked to this company account" });
      return;
    }

    const { data: contact } = await supabase
      .from("company_contacts")
      .select("company_id")
      .eq("company_id", companyInfo!.id)
      .eq("user_id", profile.user_id)
      .maybeSingle();

    if (!contact) {
      setLoading(false);
      setErrors({
        email: isAr
          ? "هذا البريد غير مرتبط بحساب هذه الشركة"
          : "This email is not linked to this company account",
      });
      return;
    }

    // Now sign in
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);

    if (error) {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        setLockoutUntil(Date.now() + LOCKOUT_DURATION_MS);
        setLoginAttempts(0);
        toast({
          variant: "destructive",
          title: isAr ? "تم قفل الحساب مؤقتاً" : "Account temporarily locked",
          description: isAr ? "يرجى الانتظار 5 دقائق" : "Please wait 5 minutes",
        });
        return;
      }
      let msg = error.message;
      if (error.message.includes("Invalid login credentials")) {
        msg = isAr
          ? `بيانات الدخول غير صحيحة (${MAX_LOGIN_ATTEMPTS - newAttempts} محاولات متبقية)`
          : `Invalid credentials (${MAX_LOGIN_ATTEMPTS - newAttempts} attempts remaining)`;
      }
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: msg });
    } else {
      setLoginAttempts(0);
      setLockoutUntil(null);
      navigate("/company", { replace: true });
    }
  };

  // Step 2b: Phone OTP verified → lookup and enter password
  const handlePhoneVerified = async (verifiedPhoneNum: string) => {
    const normalized = normalizePhoneForStorage(verifiedPhoneNum);
    setVerifiedPhone(normalized);

    setLoading(true);
    // Check phone belongs to a contact of this company
    const { data: phoneProfile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("phone", normalized)
      .maybeSingle();

    const { data: contact } = phoneProfile ? await supabase
      .from("company_contacts")
      .select("company_id")
      .eq("company_id", companyInfo!.id)
      .eq("user_id", phoneProfile.user_id)
      .maybeSingle() : { data: null };

    if (!contact) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "هذا الرقم غير مرتبط بحساب هذه الشركة" : "This phone is not linked to this company account",
      });
      setStep("credentials");
      return;
    }

    setLoading(false);
    setStep("phone-password");
  };

  // Step 2c: Phone password login
  const handlePhonePasswordLogin = async () => {
    setErrors({});

    if (isLockedOut) {
      toast({
        variant: "destructive",
        title: isAr ? "محاولات كثيرة" : "Too many attempts",
        description: isAr ? "يرجى الانتظار 5 دقائق" : "Please wait 5 minutes",
      });
      return;
    }

    if (password.length < 6) {
      setErrors({ password: isAr ? "كلمة المرور قصيرة جداً" : "Password too short" });
      return;
    }

    setLoading(true);

    // Get email for this phone + company
    const { data: phoneProf } = await supabase
      .from("profiles")
      .select("user_id, email")
      .eq("phone", verifiedPhone)
      .maybeSingle();

    if (phoneProf) {
      const { data: compContact } = await supabase
        .from("company_contacts")
        .select("company_id")
        .eq("company_id", companyInfo!.id)
        .eq("user_id", phoneProf.user_id)
        .maybeSingle();
      if (!compContact) {
        setLoading(false);
        toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: isAr ? "هذا الرقم غير مرتبط بهذه الشركة" : "This phone is not linked to this company" });
        return;
      }
    }

    const accountEmail = phoneProf?.email;
    if (!accountEmail) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "لا يوجد بريد إلكتروني مرتبط بهذا الحساب" : "No email linked to this account",
      });
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email: accountEmail, password });
    setLoading(false);

    if (error) {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        setLockoutUntil(Date.now() + LOCKOUT_DURATION_MS);
        setLoginAttempts(0);
        toast({
          variant: "destructive",
          title: isAr ? "تم قفل الحساب مؤقتاً" : "Account temporarily locked",
          description: isAr ? "يرجى الانتظار 5 دقائق" : "Please wait 5 minutes",
        });
        return;
      }
      let msg = error.message;
      if (error.message.includes("Invalid login credentials")) {
        msg = isAr
          ? `كلمة المرور غير صحيحة (${MAX_LOGIN_ATTEMPTS - newAttempts} محاولات متبقية)`
          : `Incorrect password (${MAX_LOGIN_ATTEMPTS - newAttempts} attempts remaining)`;
      }
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: msg });
    } else {
      setLoginAttempts(0);
      setLockoutUntil(null);
      navigate("/company", { replace: true });
    }
  };

  const getStage = () => {
    if (step === "phone-otp") return "verify" as const;
    return "login" as const;
  };

  // ── Phone OTP Step ──
  if (step === "phone-otp") {
    return (
      <AuthLayout stage="verify" isAr={isAr}>
        <SEOHead title={isAr ? "التحقق من الهاتف" : "Verify Phone"} description="Verify phone for company login" />
        <Card className="border-border/50 shadow-xl shadow-primary/5">
          <div className="p-5 md:p-6">
            <PhoneVerification
              onVerified={handlePhoneVerified}
              onBack={() => setStep("credentials")}
              initialPhone={phoneCode + phone}
              phoneCode={phoneCode}
              mode="login"
            />
          </div>
        </Card>
      </AuthLayout>
    );
  }

  // ── Phone Password Step ──
  if (step === "phone-password") {
    return (
      <AuthLayout stage="login" isAr={isAr}>
        <SEOHead title={isAr ? "تسجيل دخول الشركة" : "Company Sign In"} description="Enter your password" />
        <Card className="border-border/50 shadow-xl shadow-primary/5">
          <div className="p-5 md:p-6 space-y-5">
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <h2 className={`${isAr ? "font-sans" : "font-serif"} text-xl font-bold`}>
                {isAr ? "تسجيل دخول الشركة" : "Company Sign In"}
              </h2>
            </div>

            {/* Company badge */}
            <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <Building2 className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{isAr ? companyInfo?.name_ar || companyInfo?.name : companyInfo?.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{companyInfo?.company_number}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <CheckCircle className="h-5 w-5 text-primary shrink-0" />
              <div className="text-sm">
                <span className="font-medium">{isAr ? "تم التحقق:" : "Verified:"}</span>{" "}
                <span className="font-mono text-primary" dir="ltr">{verifiedPhone}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "كلمة المرور" : "Password"}</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={(e) => e.key === "Enter" && handlePhonePasswordLogin()}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            <Button className="w-full gap-2" size="lg" onClick={handlePhonePasswordLogin} disabled={loading || isLockedOut}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {isAr ? "تسجيل الدخول" : "Sign In"}
            </Button>

            <button type="button" className="w-full text-center text-xs text-primary hover:underline" onClick={() => setStep("credentials")}>
              {isAr ? "رجوع" : "Back"}
            </button>
          </div>
        </Card>
      </AuthLayout>
    );
  }

  // ── Main View ──
  return (
    <AuthLayout stage="login" isAr={isAr} showFooter>
      <SEOHead
        title={isAr ? "تسجيل دخول الشركة - Altohaa" : "Company Login - Altohaa"}
        description="Sign in to your company or organization account on Altohaa."
      />

      {/* Header */}
      <div className="flex flex-col items-center text-center">
        <img src="/altohaa-logo.png" alt="Altohaa" className="mb-3 h-12 w-auto lg:hidden" />
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
          <Building2 className="h-7 w-7 text-primary" />
        </div>
        <h1 className={`${isAr ? "font-sans" : "font-serif"} text-2xl font-bold`}>
          {isAr ? "تسجيل دخول الشركة" : "Company Login"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {step === "identify"
            ? (isAr ? "أدخل رقم حساب الشركة أو اسم المستخدم" : "Enter your company account number or username")
            : (isAr ? "أدخل بيانات الدخول" : "Enter your credentials")}
        </p>
      </div>

      <Card className="border-border/50 shadow-lg shadow-primary/5">
        <CardContent className="space-y-4 p-5 md:p-6">
          {step === "identify" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="companyId" className="text-xs">
                  {isAr ? "رقم حساب الشركة أو اسم المستخدم" : "Company Account Number or Username"}
                </Label>
                <Input
                  id="companyId"
                  value={companyIdentifier}
                  onChange={(e) => {
                    setCompanyIdentifier(e.target.value);
                    if (errors.identifier) setErrors({});
                  }}
                  placeholder={isAr ? "مثال: C00000001 أو company-name" : "e.g. C00000001 or company-name"}
                  onKeyDown={(e) => e.key === "Enter" && handleIdentifyCompany()}
                  autoComplete="organization"
                  dir="ltr"
                />
                {errors.identifier && <p className="text-xs text-destructive">{errors.identifier}</p>}
              </div>

              <Button className="w-full gap-2" size="lg" onClick={handleIdentifyCompany} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeft className={`h-4 w-4 ${isAr ? "" : "rotate-180"}`} />}
                {isAr ? "التالي" : "Next"}
              </Button>
            </>
          ) : step === "credentials" ? (
            <>
              {/* Company badge */}
              <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <Building2 className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{isAr ? companyInfo?.name_ar || companyInfo?.name : companyInfo?.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{companyInfo?.company_number}</p>
                </div>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline shrink-0"
                  onClick={() => { setStep("identify"); setCompanyInfo(null); setErrors({}); }}
                >
                  {isAr ? "تغيير" : "Change"}
                </button>
              </div>

              {/* Credential method toggle */}
              <div className="flex rounded-lg border border-border/50 p-1 gap-1">
                <button
                  type="button"
                  onClick={() => { setCredentialMethod("phone"); setErrors({}); }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    credentialMethod === "phone"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Phone className="h-4 w-4" />
                  {isAr ? "الهاتف" : "Phone"}
                </button>
                <button
                  type="button"
                  onClick={() => { setCredentialMethod("email"); setErrors({}); }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    credentialMethod === "email"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  {isAr ? "البريد" : "Email"}
                </button>
              </div>

              {credentialMethod === "phone" ? (
                <>
                  <PhoneInputWithFlag
                    phone={phone}
                    onPhoneChange={setPhone}
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
                  <Button
                    className="w-full gap-2"
                    size="lg"
                    onClick={() => {
                      const fullPhone = phoneCode + phone.replace(/\s/g, "");
                      if (!/^\+?[1-9]\d{7,14}$/.test(fullPhone)) {
                        setErrors({ phone: isAr ? "رقم غير صالح" : "Invalid number" });
                        return;
                      }
                      setErrors({});
                      setStep("phone-otp");
                    }}
                  >
                    {isAr ? "التالي — التحقق" : "Next — Verify"}
                  </Button>
                </>
              ) : (
                <>
                  {isLockedOut && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-center">
                      <p className="text-sm font-medium text-destructive">
                        {isAr ? "تم قفل تسجيل الدخول مؤقتاً" : "Login temporarily locked"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isAr ? "يرجى الانتظار 5 دقائق" : "Please wait 5 minutes"}
                      </p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="companyEmail" className="text-xs">{isAr ? "البريد الإلكتروني" : "Email"}</Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((prev) => ({ ...prev, email: "" })); }}
                      placeholder={isAr ? "البريد الإلكتروني" : "Email address"}
                      onKeyDown={(e) => e.key === "Enter" && document.getElementById("companyPassword")?.focus()}
                      maxLength={255}
                      autoComplete="email"
                      disabled={isLockedOut}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="companyPassword" className="text-xs">{isAr ? "كلمة المرور" : "Password"}</Label>
                      <button type="button" className="text-[10px] text-primary hover:underline" onClick={() => setForgotOpen(true)}>
                        {isAr ? "نسيت كلمة المرور؟" : "Forgot password?"}
                      </button>
                    </div>
                    <Input
                      id="companyPassword"
                      type="password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((prev) => ({ ...prev, password: "" })); }}
                      placeholder="••••••••"
                      onKeyDown={(e) => e.key === "Enter" && handleEmailLogin()}
                      maxLength={128}
                      autoComplete="current-password"
                      disabled={isLockedOut}
                    />
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>

                  <Button className="w-full gap-2" size="lg" disabled={loading || isLockedOut} onClick={handleEmailLogin}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                    {loading ? (isAr ? "جاري الدخول..." : "Signing in...") : (isAr ? "تسجيل الدخول" : "Sign In")}
                  </Button>
                </>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* Link to personal login */}
      <div className="flex flex-col items-center gap-2 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">
            {isAr ? "حساب شخصي؟" : "Personal account?"}
          </span>
          <button
            type="button"
            className="font-medium text-primary underline-offset-2 hover:underline"
            onClick={() => navigate("/login")}
          >
            {isAr ? "تسجيل الدخول هنا" : "Sign in here"}
          </button>
        </div>
      </div>

      <ForgotPasswordDialog open={forgotOpen} onOpenChange={setForgotOpen} />
    </AuthLayout>
  );
}
