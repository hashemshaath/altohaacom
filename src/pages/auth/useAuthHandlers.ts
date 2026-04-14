import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { normalizePhoneForStorage } from "@/lib/arabicNumerals";
import { getDeviceFingerprint } from "@/lib/deviceFingerprint";
import { useToast } from "@/hooks/use-toast";
import { validateUsername } from "@/lib/usernameValidation";
import { getPasswordStrength } from "@/components/auth/PasswordStrengthMeter";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(128),
});

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export type SignUpStep = "contact" | "verify" | "details" | "credentials";
export type SignUpMethod = "phone" | "email";
export type SignInMethod = "phone" | "email";

export const DEFAULT_COUNTRY = "SA";
export const DEFAULT_PHONE_CODE = "+966";

interface UseAuthHandlersArgs {
  isAr: boolean;
  language: string;
  isSignUp: boolean;
  setIsSignUp: (v: boolean) => void;
}

// Importing detectLoginInputType
import { detectLoginInputType } from "@/lib/usernameValidation";

export function useAuthHandlers({ isAr, language, isSignUp, setIsSignUp }: UseAuthHandlersArgs) {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Sign-in state
  const [signInMethod, setSignInMethod] = useState<SignInMethod>("phone");
  const [signInPhone, setSignInPhone] = useState("");
  const [signInPhoneCode, setSignInPhoneCode] = useState(DEFAULT_PHONE_CODE);
  const [signInCountry, setSignInCountry] = useState(DEFAULT_COUNTRY);
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInPhoneStep, setSignInPhoneStep] = useState<"phone" | "otp" | "password" | "pin">("phone");
  const [signInVerifiedPhone, setSignInVerifiedPhone] = useState("");
  const [signInPin, setSignInPin] = useState("");
  const [pinAvailable, setPinAvailable] = useState(false);
  const [pinError, setPinError] = useState("");

  // Sign-up state
  const [signUpStep, setSignUpStep] = useState<SignUpStep>("contact");
  const [signUpMethod, setSignUpMethod] = useState<SignUpMethod>("phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY);
  const [phoneCode, setPhoneCode] = useState(DEFAULT_PHONE_CODE);
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [manualRefCode, setManualRefCode] = useState("");
  const [accountType, setAccountType] = useState<"professional" | "fan">("fan");

  // Password reset
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  // Dialogs
  const [forgotOpen, setForgotOpen] = useState(false);

  // General
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  const isLockedOut = lockoutUntil !== null && Date.now() < lockoutUntil;

  // Username availability check
  useEffect(() => {
    const validation = validateUsername(username);
    if (!username || username.length < 3 || !validation.valid) {
      setUsernameStatus(validation.valid === false && username.length >= 3 ? "taken" : "idle");
      return;
    }
    setUsernameStatus("checking");
    const timer = setTimeout(async () => {
      const { data: taken } = await supabase.rpc("check_username_taken", { p_username: username.toLowerCase() });
      setUsernameStatus(taken ? "taken" : "available");
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
    setFormError("");
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) setFormError(error.message);
    setLoading(false);
  };

  // ── Sign In with Email/Username ──
  const handleSignInEmail = async () => {
    setErrors({});
    setFormError("");
    if (isLockedOut) return;

    const errs: Record<string, string> = {};
    const inputVal = signInEmail.trim();
    if (!inputVal) errs.signInEmail = isAr ? "هذا الحقل مطلوب" : "This field is required";
    if (signInPassword.length < 6) errs.signInPassword = isAr ? "كلمة المرور قصيرة جداً" : "Password too short";
    if (signInPassword.length > 128) errs.signInPassword = isAr ? "كلمة المرور طويلة جداً" : "Password too long";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    const inputType = detectLoginInputType(inputVal);
    let loginEmail = inputVal;

    if (inputType === "username") {
      const { data: resolvedEmail } = await supabase.rpc("get_user_email_by_username", { p_username: inputVal });
      if (!resolvedEmail) {
        setLoading(false);
        setFormError(isAr ? "بيانات الدخول غير صحيحة" : "Invalid credentials");
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
          const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
          setLockoutUntil(lockUntil);
          setLoginAttempts(0);
        }
        return;
      }
      loginEmail = resolvedEmail as string;
    } else if (inputType === "email") {
      const emailResult = loginSchema.shape.email.safeParse(inputVal);
      if (!emailResult.success) {
        setLoading(false);
        setErrors({ signInEmail: isAr ? "البريد الإلكتروني غير صالح" : "Invalid email" });
        return;
      }
    }

    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: signInPassword });
    setLoading(false);

    if (error) {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
        setLockoutUntil(lockUntil);
        setLoginAttempts(0);
        try {
          supabase.rpc("log_security_event", {
            p_user_id: null as any,
            p_event_type: "account_locked",
            p_severity: "warning",
            p_description: `Account locked after ${MAX_LOGIN_ATTEMPTS} failed attempts`,
            p_description_ar: `تم قفل الحساب بعد ${MAX_LOGIN_ATTEMPTS} محاولات فاشلة`,
            p_metadata: { identifier: inputVal, attempts: MAX_LOGIN_ATTEMPTS, locked_until: new Date(lockUntil).toISOString() } as any,
          });
        } catch {}
        return;
      }
      let msg = error.message;
      if (error.message.includes("Email not confirmed")) {
        msg = isAr ? "لم يتم تأكيد البريد الإلكتروني. يرجى التحقق من بريدك الوارد" : "Email not confirmed. Please check your inbox";
      } else if (error.message.includes("Invalid login credentials")) {
        msg = isAr
          ? `بيانات الدخول غير صحيحة. (${MAX_LOGIN_ATTEMPTS - newAttempts} محاولات متبقية)`
          : `Invalid credentials. (${MAX_LOGIN_ATTEMPTS - newAttempts} attempts remaining)`;
      }
      setFormError(msg);
    } else {
      setLoginAttempts(0);
      setLockoutUntil(null);
      toast({ title: isAr ? "تم تسجيل الدخول بنجاح" : "Signed in successfully", description: isAr ? "مرحباً بعودتك!" : "Welcome back!" });
    }
  };

  // ── Sign In with Phone (after OTP verification) ──
  const handleSignInPhoneVerified = async (phone: string) => {
    const normalizedPhone = normalizePhoneForStorage(phone);
    setSignInVerifiedPhone(normalizedPhone);
    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("pin-auth", {
        body: { action: "phone_otp_login", phone: normalizedPhone },
      });
      if (fnError || data?.error) {
        const code = data?.code;
        if (code === "NO_ACCOUNT") setFormError(isAr ? "لا يوجد حساب مرتبط بهذا الرقم" : "No account linked to this phone number");
        else setFormError(data?.error || fnError?.message || "Login failed");
        setSignInPhoneStep("phone");
        setLoading(false);
        return;
      }
      if (data?.token_hash && data?.email) {
        const { error: verifyError } = await supabase.auth.verifyOtp({ email: data.email, token_hash: data.token_hash, type: "magiclink" });
        if (verifyError) { setFormError(isAr ? "فشل تسجيل الدخول" : "Login failed"); setSignInPhoneStep("phone"); setLoading(false); return; }
        toast({ title: isAr ? "تم تسجيل الدخول بنجاح" : "Signed in successfully", description: isAr ? "مرحباً بعودتك!" : "Welcome back!" });
      }
    } catch (err: unknown) {
      setFormError((err instanceof Error ? err.message : "Login failed"));
      setSignInPhoneStep("phone");
    } finally { setLoading(false); }
  };

  const handleSignInPhonePassword = async () => {
    setErrors({});
    setFormError("");
    if (isLockedOut) return;
    if (signInPassword.length < 6) { setErrors({ signInPassword: isAr ? "كلمة المرور قصيرة جداً" : "Password too short" }); return; }
    if (signInPassword.length > 128) { setErrors({ signInPassword: isAr ? "كلمة المرور طويلة جداً" : "Password too long" }); return; }

    setLoading(true);
    const { data: phoneData } = await supabase.rpc("get_user_by_phone", { p_phone: signInVerifiedPhone });
    const profile = (phoneData as any)?.[0] || null;
    if (!profile) { setLoading(false); setFormError(isAr ? "لا يوجد حساب مرتبط بهذا الرقم" : "No account linked to this phone number"); return; }
    const accountEmail = profile.email;
    if (!accountEmail) { setLoading(false); setFormError(isAr ? "لا يوجد بريد إلكتروني مرتبط بهذا الحساب" : "No email linked to this account"); return; }

    const { error } = await supabase.auth.signInWithPassword({ email: accountEmail, password: signInPassword });
    setLoading(false);
    if (error) {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
        setLockoutUntil(lockUntil);
        setLoginAttempts(0);
        try {
          supabase.rpc("log_security_event", {
            p_user_id: null as any, p_event_type: "account_locked", p_severity: "warning",
            p_description: `Account locked after ${MAX_LOGIN_ATTEMPTS} failed attempts (phone login)`,
            p_description_ar: `تم قفل الحساب بعد ${MAX_LOGIN_ATTEMPTS} محاولات فاشلة (تسجيل بالهاتف)`,
            p_metadata: { phone: signInVerifiedPhone, attempts: MAX_LOGIN_ATTEMPTS, locked_until: new Date(lockUntil).toISOString() } as any,
          });
        } catch {}
        return;
      }
      let msg = error.message;
      if (error.message.includes("Invalid login credentials")) {
        msg = isAr ? `كلمة المرور غير صحيحة (${MAX_LOGIN_ATTEMPTS - newAttempts} محاولات متبقية)` : `Incorrect password (${MAX_LOGIN_ATTEMPTS - newAttempts} attempts remaining)`;
      } else if (error.message.includes("Email not confirmed")) {
        msg = isAr ? "لم يتم تأكيد البريد الإلكتروني. يرجى التحقق من بريدك الوارد" : "Email not confirmed. Please check your inbox";
      }
      setFormError(msg);
    } else {
      setLoginAttempts(0); setLockoutUntil(null);
      toast({ title: isAr ? "تم تسجيل الدخول بنجاح" : "Signed in successfully", description: isAr ? "مرحباً بعودتك!" : "Welcome back!" });
    }
  };

  // ── PIN Login ──
  const handlePinLogin = async () => {
    setPinError("");
    if (signInPin.length !== 6) { setPinError(isAr ? "أدخل الرمز المكون من 6 أرقام" : "Enter your 6-digit PIN"); return; }
    setLoading(true);
    try {
      const fingerprint = await getDeviceFingerprint();
      const fullPhone = normalizePhoneForStorage(signInPhoneCode + signInPhone.replace(/\s/g, ""));
      const { data, error: fnError } = await supabase.functions.invoke("pin-auth", {
        body: { action: "pin_login", phone: fullPhone, pin: signInPin, device_fingerprint: fingerprint },
      });
      if (fnError || data?.error) {
        const code = data?.code;
        if (code === "UNTRUSTED_DEVICE") setPinError(isAr ? "جهاز غير معروف. سجّل الدخول بالتحقق أولاً" : "Unrecognized device. Please login with OTP first.");
        else if (code === "WRONG_PIN") setPinError(isAr ? `رمز غير صحيح (${data.remaining_attempts} محاولات متبقية)` : `Incorrect PIN (${data.remaining_attempts} attempts remaining)`);
        else if (code === "PIN_LOCKED") setPinError(isAr ? "تم قفل الرمز مؤقتاً. حاول لاحقاً" : "PIN temporarily locked. Try again later.");
        else if (code === "PIN_EXPIRED") setPinError(isAr ? "انتهت صلاحية الرمز. أعد إعداده" : "PIN expired. Please set a new one.");
        else setPinError(data?.error || fnError?.message || "Login failed");
        setLoading(false);
        return;
      }
      if (data?.token_hash && data?.email) {
        const { error: verifyError } = await supabase.auth.verifyOtp({ email: data.email, token_hash: data.token_hash, type: "magiclink" });
        if (verifyError) { setPinError(isAr ? "فشل تسجيل الدخول" : "Login failed"); setLoading(false); return; }
        toast({ title: isAr ? "تم تسجيل الدخول بنجاح" : "Signed in successfully", description: isAr ? "مرحباً بعودتك!" : "Welcome back!" });
      }
    } catch (err: unknown) { setPinError((err instanceof Error ? err.message : "Login failed")); } finally { setLoading(false); }
  };

  const checkPinForPhone = async (fullPhone: string) => {
    try {
      const fingerprint = await getDeviceFingerprint();
      const { data } = await supabase.functions.invoke("pin-auth", {
        body: { action: "check_pin_by_phone", phone: fullPhone, device_fingerprint: fingerprint },
      });
      setPinAvailable(data?.has_pin && !data?.is_expired && data?.device_trusted);
    } catch { setPinAvailable(false); }
  };

  // ── Password Reset ──
  const handleResetPassword = async () => {
    setErrors({});
    setFormError("");
    const errs: Record<string, string> = {};
    if (resetPassword.length < 8) errs.resetPassword = isAr ? "8 أحرف على الأقل" : "At least 8 characters";
    else if (!/[A-Z]/.test(resetPassword)) errs.resetPassword = isAr ? "يجب أن تحتوي على حرف كبير" : "Must contain an uppercase letter";
    else if (!/\d/.test(resetPassword)) errs.resetPassword = isAr ? "يجب أن تحتوي على رقم" : "Must contain a number";
    else if (getPasswordStrength(resetPassword) < 2) errs.resetPassword = isAr ? "كلمة المرور ضعيفة" : "Password too weak";
    if (resetPassword !== resetConfirm) errs.resetConfirm = isAr ? "غير متطابقة" : "Passwords don't match";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: resetPassword });
    setLoading(false);
    if (error) { setFormError(error.message); } else {
      setResetSuccess(true);
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser?.email) {
          supabase.functions.invoke("send-transactional-email", {
            body: { templateName: "password-changed", recipientEmail: currentUser.email, idempotencyKey: `pwd-changed-${currentUser.id}-${Date.now()}`, templateData: { name: currentUser.user_metadata?.full_name } },
          }).then(null, () => {});
        }
      } catch {}
      toast({ title: isAr ? "تم تحديث كلمة المرور بنجاح" : "Password updated successfully", description: isAr ? "يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة" : "You can now sign in with your new password" });
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    }
  };

  // ── Sign Up Step 1: Contact ──
  const handleContactSubmit = async () => {
    setErrors({});
    const errs: Record<string, string> = {};
    if (signUpMethod === "phone") {
      const digitsOnly = phoneInput.replace(/\s/g, "");
      if (digitsOnly.length < 7 || digitsOnly.length > 15) errs.phone = isAr ? "طول رقم الهاتف غير صالح (7-15 رقم)" : "Invalid phone length (7-15 digits)";
      const fullPhone = normalizePhoneForStorage(phoneCode + digitsOnly);
      if (!errs.phone && !/^\+?[1-9]\d{7,14}$/.test(fullPhone)) errs.phone = isAr ? "رقم الهاتف غير صالح" : "Invalid phone number";
      if (!errs.phone) {
        setLoading(true);
        const { data: phoneExists } = await supabase.rpc("check_phone_exists", { p_phone: fullPhone });
        setLoading(false);
        if (phoneExists) errs.phone = isAr ? "هذا الرقم مسجل بالفعل. يرجى تسجيل الدخول" : "This number is already registered. Please sign in";
      }
    } else {
      if (!z.string().email().safeParse(emailInput).success) errs.email = isAr ? "البريد الإلكتروني غير صالح" : "Invalid email address";
      if (!errs.email) {
        setLoading(true);
        const { data: emailExists } = await supabase.rpc("check_email_exists", { p_email: emailInput.trim().toLowerCase() });
        setLoading(false);
        if (emailExists) errs.email = isAr ? "هذا البريد مسجل بالفعل. يرجى تسجيل الدخول" : "This email is already registered. Please sign in";
      }
    }
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSignUpStep("verify");
  };

  const handlePhoneVerified = (phone: string) => {
    setVerifiedPhone(normalizePhoneForStorage(phone));
    setSignUpStep("details");
  };

  const handleSendEmailVerification = async () => {
    setVerifiedEmail(emailInput);
    setSignUpStep("details");
    toast({ title: isAr ? "سيتم التحقق من البريد" : "Email will be verified", description: isAr ? "سيتم إرسال رابط التحقق بعد إنشاء الحساب" : "A verification link will be sent after account creation" });
  };

  const handleDetailsSubmit = async () => {
    setErrors({});
    const errs: Record<string, string> = {};
    if (!fullName.trim() || fullName.trim().length < 2) errs.fullName = isAr ? "الاسم مطلوب (حرفان على الأقل)" : "Name is required (min 2 chars)";
    if (signUpMethod === "phone") {
      if (!z.string().email().safeParse(email).success) errs.email = isAr ? "البريد الإلكتروني مطلوب لإنشاء الحساب" : "Email required for account creation";
      if (!errs.email && email) {
        setLoading(true);
        const { data: emailExists2 } = await supabase.rpc("check_email_exists", { p_email: email.trim().toLowerCase() });
        setLoading(false);
        if (emailExists2) errs.email = isAr ? "هذا البريد مسجل بالفعل" : "This email is already registered";
      }
    }
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSignUpStep("credentials");
  };

  // ── Sign Up Step 4: Create Account ──
  const handleCreateAccount = async () => {
    setErrors({});
    const errs: Record<string, string> = {};
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) errs.username = isAr ? (usernameValidation.errorAr || "اسم مستخدم غير صالح") : (usernameValidation.error || "Invalid username");
    if (usernameStatus === "taken") errs.username = isAr ? "اسم المستخدم مستخدم بالفعل" : "Username already taken";
    if (usernameStatus === "checking") errs.username = isAr ? "جاري التحقق..." : "Still checking...";
    if (password.length < 8) errs.password = isAr ? "8 أحرف على الأقل" : "At least 8 characters";
    else if (!/[A-Z]/.test(password)) errs.password = isAr ? "يجب أن تحتوي على حرف كبير واحد على الأقل" : "Must contain at least 1 uppercase letter";
    else if (!/\d/.test(password)) errs.password = isAr ? "يجب أن تحتوي على رقم واحد على الأقل" : "Must contain at least 1 number";
    else if (getPasswordStrength(password) < 2) errs.password = isAr ? "كلمة المرور ضعيفة جداً" : "Password is too weak";
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
        data: { full_name: fullName, username: username.toLowerCase(), phone: verifiedPhone || null, country_code: countryCode || null, account_type: accountType, preferred_language: language },
      },
    });

    if (error) {
      setLoading(false);
      let errMsg = error.message;
      if (error.message?.toLowerCase().includes("already registered") || error.message?.toLowerCase().includes("already been registered")) {
        errMsg = isAr ? "هذا البريد الإلكتروني مسجل بالفعل" : "This email is already registered. Please sign in instead.";
      }
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: errMsg });
      return;
    }

    if (data.user) {
      await supabase.from("user_roles").insert({ user_id: data.user.id, role: (accountType === "fan" ? "viewer" : "chef") as any });
      await new Promise((resolve) => setTimeout(resolve, 500));
      await supabase.from("profiles").update({ username: username.toLowerCase(), phone: verifiedPhone || null, country_code: countryCode || null, preferred_language: language, email: accountEmail, account_type: accountType }).eq("user_id", data.user.id);

      const storedRef = localStorage.getItem("altoha_ref_code") || manualRefCode.trim().toUpperCase() || null;
      if (storedRef) {
        try { await supabase.functions.invoke("process-referral", { body: { referralCode: storedRef, newUserId: data.user.id } }); localStorage.removeItem("altoha_ref_code"); } catch { localStorage.removeItem("altoha_ref_code"); }
      }

      try { supabase.functions.invoke("send-transactional-email", { body: { templateName: "welcome", recipientEmail: accountEmail, idempotencyKey: `welcome-${data.user.id}`, templateData: { name: fullName } } }).then(null, () => {}); } catch {}

      try {
        const { sendGoogleConversion, pushToDataLayer } = await import("@/hooks/useGoogleTracking");
        sendGoogleConversion("sign_up", { method: signUpMethod, currency: "SAR" });
        pushToDataLayer("sign_up", { method: signUpMethod, userId: data.user.id });
        supabase.from("conversion_events").insert([{ user_id: data.user.id, event_name: "sign_up", event_category: "engagement", source: new URLSearchParams(window.location.search).get("utm_source") || null, medium: new URLSearchParams(window.location.search).get("utm_medium") || null, campaign: new URLSearchParams(window.location.search).get("utm_campaign") || null, session_id: sessionStorage.getItem("ad_session_id") || null, metadata: { method: signUpMethod, country: countryCode } as any }]).then(null, () => {});
      } catch {}
    }

    setLoading(false);
    toast({ title: isAr ? "تم إنشاء الحساب بنجاح! 🎉" : "Account Created! 🎉", description: isAr ? "يرجى التحقق من بريدك الإلكتروني لتأكيد حسابك قبل تسجيل الدخول." : "Please check your email to verify your account before signing in." });
    setIsSignUp(false);
    setSignUpStep("contact");
    navigate("/login", { replace: true });
  };

  return {
    // Sign-in state
    signInMethod, setSignInMethod,
    signInPhone, setSignInPhone,
    signInPhoneCode, setSignInPhoneCode,
    signInCountry, setSignInCountry,
    signInEmail, setSignInEmail,
    signInPassword, setSignInPassword,
    signInPhoneStep, setSignInPhoneStep,
    signInVerifiedPhone,
    signInPin, setSignInPin,
    pinAvailable, setPinAvailable,
    pinError, setPinError,

    // Sign-up state
    signUpStep, setSignUpStep,
    signUpMethod, setSignUpMethod,
    phoneInput, setPhoneInput,
    emailInput, setEmailInput,
    countryCode, setCountryCode,
    phoneCode, setPhoneCode,
    verifiedPhone, verifiedEmail,
    fullName, setFullName,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    username, setUsername,
    usernameStatus,
    termsAccepted, setTermsAccepted,
    manualRefCode, setManualRefCode,
    accountType, setAccountType,

    // Reset
    resetPassword, setResetPassword,
    resetConfirm, setResetConfirm,
    resetSuccess,

    // Dialogs
    forgotOpen, setForgotOpen,

    // General
    loading, errors, setErrors, formError, setFormError,
    loginAttempts, isLockedOut,

    // Handlers
    handleGoogleSignIn,
    handleSignInEmail,
    handleSignInPhoneVerified,
    handleSignInPhonePassword,
    handlePinLogin,
    checkPinForPhone,
    handleResetPassword,
    handleContactSubmit,
    handlePhoneVerified,
    handleSendEmailVerification,
    handleDetailsSubmit,
    handleCreateAccount,
  };
}
