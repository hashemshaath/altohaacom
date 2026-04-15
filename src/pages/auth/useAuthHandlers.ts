import { useReducer, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { normalizePhoneForStorage } from "@/lib/arabicNumerals";
import { getDeviceFingerprint } from "@/lib/deviceFingerprint";
import { useToast } from "@/hooks/use-toast";
import { validateUsername } from "@/lib/usernameValidation";
import { getPasswordStrength } from "@/components/auth/PasswordStrengthMeter";
import { z } from "zod";
import { detectLoginInputType } from "@/lib/usernameValidation";
import {
  authReducer, initialAuthState,
  type AuthState,
  type SignUpStep, type SignUpMethod, type SignInMethod,
  DEFAULT_COUNTRY, DEFAULT_PHONE_CODE,
} from "./authReducer";

// Re-export types for consumers
export type { SignUpStep, SignUpMethod, SignInMethod };
export { DEFAULT_COUNTRY, DEFAULT_PHONE_CODE };

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(128),
});

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

interface UseAuthHandlersArgs {
  isAr: boolean;
  language: string;
  isSignUp: boolean;
  setIsSignUp: (v: boolean) => void;
}

export function useAuthHandlers({ isAr, language, isSignUp, setIsSignUp }: UseAuthHandlersArgs) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  const setField = useCallback(<K extends keyof AuthState>(field: K, value: AuthState[K]) => {
    dispatch({ type: "SET_FIELD", field, value });
  }, []);

  const isLockedOut = state.lockoutUntil !== null && Date.now() < state.lockoutUntil;

  // Username availability check
  useEffect(() => {
    const validation = validateUsername(state.username);
    if (!state.username || state.username.length < 3 || !validation.valid) {
      setField("usernameStatus", validation.valid === false && state.username.length >= 3 ? "taken" : "idle");
      return;
    }
    setField("usernameStatus", "checking");
    const timer = setTimeout(async () => {
      const { data: taken } = await supabase.rpc("check_username_taken", { p_username: state.username.toLowerCase() });
      setField("usernameStatus", taken ? "taken" : "available");
    }, 500);
    return () => clearTimeout(timer);
  }, [state.username, setField]);

  useEffect(() => {
    dispatch({ type: "RESET_SIGNUP" });
  }, [isSignUp]);

  // ── Google Sign In ──
  const handleGoogleSignIn = useCallback(async () => {
    dispatch({ type: "SET_LOADING", loading: true });
    setField("formError", "");
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) setField("formError", error.message);
    dispatch({ type: "SET_LOADING", loading: false });
  }, [setField]);

  // ── Sign In with Email/Username ──
  const handleSignInEmail = useCallback(async () => {
    dispatch({ type: "CLEAR_ERRORS" });
    if (isLockedOut) return;

    const errs: Record<string, string> = {};
    const inputVal = state.signInEmail.trim();
    if (!inputVal) errs.signInEmail = isAr ? "هذا الحقل مطلوب" : "This field is required";
    if (state.signInPassword.length < 6) errs.signInPassword = isAr ? "كلمة المرور قصيرة جداً" : "Password too short";
    if (state.signInPassword.length > 128) errs.signInPassword = isAr ? "كلمة المرور طويلة جداً" : "Password too long";
    if (Object.keys(errs).length > 0) { dispatch({ type: "SET_ERRORS", errors: errs }); return; }

    dispatch({ type: "SET_LOADING", loading: true });
    const inputType = detectLoginInputType(inputVal);
    let loginEmail = inputVal;

    if (inputType === "username") {
      const { data: resolvedEmail } = await supabase.rpc("get_user_email_by_username", { p_username: inputVal });
      if (!resolvedEmail) {
        dispatch({ type: "SET_LOADING", loading: false });
        setField("formError", isAr ? "بيانات الدخول غير صحيحة" : "Invalid credentials");
        const newAttempts = state.loginAttempts + 1;
        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
          const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
          dispatch({ type: "LOGIN_FAILED", lockoutUntil: lockUntil });
        } else {
          dispatch({ type: "LOGIN_FAILED" });
        }
        return;
      }
      loginEmail = resolvedEmail as string;
    } else if (inputType === "email") {
      const emailResult = loginSchema.shape.email.safeParse(inputVal);
      if (!emailResult.success) {
        dispatch({ type: "SET_LOADING", loading: false });
        dispatch({ type: "SET_ERRORS", errors: { signInEmail: isAr ? "البريد الإلكتروني غير صالح" : "Invalid email" } });
        return;
      }
    }

    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: state.signInPassword });
    dispatch({ type: "SET_LOADING", loading: false });

    if (error) {
      const newAttempts = state.loginAttempts + 1;
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
        dispatch({ type: "LOGIN_FAILED", lockoutUntil: lockUntil });
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
      dispatch({ type: "LOGIN_FAILED" });
      let msg = error.message;
      if (error.message.includes("Email not confirmed")) {
        msg = isAr ? "لم يتم تأكيد البريد الإلكتروني. يرجى التحقق من بريدك الوارد" : "Email not confirmed. Please check your inbox";
      } else if (error.message.includes("Invalid login credentials")) {
        msg = isAr
          ? `بيانات الدخول غير صحيحة. (${MAX_LOGIN_ATTEMPTS - newAttempts} محاولات متبقية)`
          : `Invalid credentials. (${MAX_LOGIN_ATTEMPTS - newAttempts} attempts remaining)`;
      }
      setField("formError", msg);
    } else {
      dispatch({ type: "LOGIN_SUCCESS" });
      toast({ title: isAr ? "تم تسجيل الدخول بنجاح" : "Signed in successfully", description: isAr ? "مرحباً بعودتك!" : "Welcome back!" });
    }
  }, [isLockedOut, state.signInEmail, state.signInPassword, state.loginAttempts, isAr, setField, toast]);

  // ── Sign In with Phone (after OTP verification) ──
  const handleSignInPhoneVerified = useCallback(async (phone: string) => {
    const normalizedPhone = normalizePhoneForStorage(phone);
    setField("signInVerifiedPhone", normalizedPhone);
    dispatch({ type: "SET_LOADING", loading: true });
    try {
      const { data, error: fnError } = await supabase.functions.invoke("pin-auth", {
        body: { action: "phone_otp_login", phone: normalizedPhone },
      });
      if (fnError || data?.error) {
        const code = data?.code;
        if (code === "NO_ACCOUNT") setField("formError", isAr ? "لا يوجد حساب مرتبط بهذا الرقم" : "No account linked to this phone number");
        else setField("formError", data?.error || fnError?.message || "Login failed");
        dispatch({ type: "RESET_SIGNIN_PHONE" });
        return;
      }
      if (data?.token_hash && data?.email) {
        const { error: verifyError } = await supabase.auth.verifyOtp({ email: data.email, token_hash: data.token_hash, type: "magiclink" });
        if (verifyError) { setField("formError", isAr ? "فشل تسجيل الدخول" : "Login failed"); dispatch({ type: "RESET_SIGNIN_PHONE" }); return; }
        toast({ title: isAr ? "تم تسجيل الدخول بنجاح" : "Signed in successfully", description: isAr ? "مرحباً بعودتك!" : "Welcome back!" });
      }
    } catch (err: unknown) {
      setField("formError", err instanceof Error ? err.message : "Login failed");
      dispatch({ type: "RESET_SIGNIN_PHONE" });
    } finally { dispatch({ type: "SET_LOADING", loading: false }); }
  }, [isAr, setField, toast]);

  const handleSignInPhonePassword = useCallback(async () => {
    dispatch({ type: "CLEAR_ERRORS" });
    if (isLockedOut) return;
    if (state.signInPassword.length < 6) { dispatch({ type: "SET_ERRORS", errors: { signInPassword: isAr ? "كلمة المرور قصيرة جداً" : "Password too short" } }); return; }
    if (state.signInPassword.length > 128) { dispatch({ type: "SET_ERRORS", errors: { signInPassword: isAr ? "كلمة المرور طويلة جداً" : "Password too long" } }); return; }

    dispatch({ type: "SET_LOADING", loading: true });
    const { data: phoneData } = await supabase.rpc("get_user_by_phone", { p_phone: state.signInVerifiedPhone });
    const profile = (phoneData as any)?.[0] || null;
    if (!profile) { dispatch({ type: "SET_LOADING", loading: false }); setField("formError", isAr ? "لا يوجد حساب مرتبط بهذا الرقم" : "No account linked to this phone number"); return; }
    const accountEmail = profile.email;
    if (!accountEmail) { dispatch({ type: "SET_LOADING", loading: false }); setField("formError", isAr ? "لا يوجد بريد إلكتروني مرتبط بهذا الحساب" : "No email linked to this account"); return; }

    const { error } = await supabase.auth.signInWithPassword({ email: accountEmail, password: state.signInPassword });
    dispatch({ type: "SET_LOADING", loading: false });
    if (error) {
      const newAttempts = state.loginAttempts + 1;
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
        dispatch({ type: "LOGIN_FAILED", lockoutUntil: lockUntil });
        try {
          supabase.rpc("log_security_event", {
            p_user_id: null as any, p_event_type: "account_locked", p_severity: "warning",
            p_description: `Account locked after ${MAX_LOGIN_ATTEMPTS} failed attempts (phone login)`,
            p_description_ar: `تم قفل الحساب بعد ${MAX_LOGIN_ATTEMPTS} محاولات فاشلة (تسجيل بالهاتف)`,
            p_metadata: { phone: state.signInVerifiedPhone, attempts: MAX_LOGIN_ATTEMPTS, locked_until: new Date(lockUntil).toISOString() } as any,
          });
        } catch {}
        return;
      }
      dispatch({ type: "LOGIN_FAILED" });
      let msg = error.message;
      if (error.message.includes("Invalid login credentials")) {
        msg = isAr ? `كلمة المرور غير صحيحة (${MAX_LOGIN_ATTEMPTS - newAttempts} محاولات متبقية)` : `Incorrect password (${MAX_LOGIN_ATTEMPTS - newAttempts} attempts remaining)`;
      } else if (error.message.includes("Email not confirmed")) {
        msg = isAr ? "لم يتم تأكيد البريد الإلكتروني. يرجى التحقق من بريدك الوارد" : "Email not confirmed. Please check your inbox";
      }
      setField("formError", msg);
    } else {
      dispatch({ type: "LOGIN_SUCCESS" });
      toast({ title: isAr ? "تم تسجيل الدخول بنجاح" : "Signed in successfully", description: isAr ? "مرحباً بعودتك!" : "Welcome back!" });
    }
  }, [isLockedOut, state.signInPassword, state.signInVerifiedPhone, state.loginAttempts, isAr, setField, toast]);

  // ── PIN Login ──
  const handlePinLogin = useCallback(async () => {
    setField("pinError", "");
    if (state.signInPin.length !== 6) { setField("pinError", isAr ? "أدخل الرمز المكون من 6 أرقام" : "Enter your 6-digit PIN"); return; }
    dispatch({ type: "SET_LOADING", loading: true });
    try {
      const fingerprint = await getDeviceFingerprint();
      const fullPhone = normalizePhoneForStorage(state.signInPhoneCode + state.signInPhone.replace(/\s/g, ""));
      const { data, error: fnError } = await supabase.functions.invoke("pin-auth", {
        body: { action: "pin_login", phone: fullPhone, pin: state.signInPin, device_fingerprint: fingerprint },
      });
      if (fnError || data?.error) {
        const code = data?.code;
        if (code === "UNTRUSTED_DEVICE") setField("pinError", isAr ? "جهاز غير معروف. سجّل الدخول بالتحقق أولاً" : "Unrecognized device. Please login with OTP first.");
        else if (code === "WRONG_PIN") setField("pinError", isAr ? `رمز غير صحيح (${data.remaining_attempts} محاولات متبقية)` : `Incorrect PIN (${data.remaining_attempts} attempts remaining)`);
        else if (code === "PIN_LOCKED") setField("pinError", isAr ? "تم قفل الرمز مؤقتاً. حاول لاحقاً" : "PIN temporarily locked. Try again later.");
        else if (code === "PIN_EXPIRED") setField("pinError", isAr ? "انتهت صلاحية الرمز. أعد إعداده" : "PIN expired. Please set a new one.");
        else setField("pinError", data?.error || fnError?.message || "Login failed");
        dispatch({ type: "SET_LOADING", loading: false });
        return;
      }
      if (data?.token_hash && data?.email) {
        const { error: verifyError } = await supabase.auth.verifyOtp({ email: data.email, token_hash: data.token_hash, type: "magiclink" });
        if (verifyError) { setField("pinError", isAr ? "فشل تسجيل الدخول" : "Login failed"); dispatch({ type: "SET_LOADING", loading: false }); return; }
        toast({ title: isAr ? "تم تسجيل الدخول بنجاح" : "Signed in successfully", description: isAr ? "مرحباً بعودتك!" : "Welcome back!" });
      }
    } catch (err: unknown) { setField("pinError", err instanceof Error ? err.message : "Login failed"); } finally { dispatch({ type: "SET_LOADING", loading: false }); }
  }, [state.signInPin, state.signInPhoneCode, state.signInPhone, isAr, setField, toast]);

  const checkPinForPhone = useCallback(async (fullPhone: string) => {
    try {
      const fingerprint = await getDeviceFingerprint();
      const { data } = await supabase.functions.invoke("pin-auth", {
        body: { action: "check_pin_by_phone", phone: fullPhone, device_fingerprint: fingerprint },
      });
      setField("pinAvailable", data?.has_pin && !data?.is_expired && data?.device_trusted);
    } catch { setField("pinAvailable", false); }
  }, [setField]);

  // ── Password Reset ──
  const handleResetPassword = useCallback(async () => {
    dispatch({ type: "CLEAR_ERRORS" });
    const errs: Record<string, string> = {};
    if (state.resetPassword.length < 8) errs.resetPassword = isAr ? "8 أحرف على الأقل" : "At least 8 characters";
    else if (!/[A-Z]/.test(state.resetPassword)) errs.resetPassword = isAr ? "يجب أن تحتوي على حرف كبير" : "Must contain an uppercase letter";
    else if (!/\d/.test(state.resetPassword)) errs.resetPassword = isAr ? "يجب أن تحتوي على رقم" : "Must contain a number";
    else if (getPasswordStrength(state.resetPassword) < 2) errs.resetPassword = isAr ? "كلمة المرور ضعيفة" : "Password too weak";
    if (state.resetPassword !== state.resetConfirm) errs.resetConfirm = isAr ? "غير متطابقة" : "Passwords don't match";
    if (Object.keys(errs).length > 0) { dispatch({ type: "SET_ERRORS", errors: errs }); return; }

    dispatch({ type: "SET_LOADING", loading: true });
    const { error } = await supabase.auth.updateUser({ password: state.resetPassword });
    dispatch({ type: "SET_LOADING", loading: false });
    if (error) { setField("formError", error.message); } else {
      setField("resetSuccess", true);
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
  }, [state.resetPassword, state.resetConfirm, isAr, setField, toast, navigate]);

  // ── Sign Up Step 1: Contact ──
  const handleContactSubmit = useCallback(async () => {
    dispatch({ type: "CLEAR_ERRORS" });
    const errs: Record<string, string> = {};
    if (state.signUpMethod === "phone") {
      const digitsOnly = state.phoneInput.replace(/\s/g, "");
      if (digitsOnly.length < 7 || digitsOnly.length > 15) errs.phone = isAr ? "طول رقم الهاتف غير صالح (7-15 رقم)" : "Invalid phone length (7-15 digits)";
      const fullPhone = normalizePhoneForStorage(state.phoneCode + digitsOnly);
      if (!errs.phone && !/^\+?[1-9]\d{7,14}$/.test(fullPhone)) errs.phone = isAr ? "رقم الهاتف غير صالح" : "Invalid phone number";
      if (!errs.phone) {
        dispatch({ type: "SET_LOADING", loading: true });
        const { data: phoneExists } = await supabase.rpc("check_phone_exists", { p_phone: fullPhone });
        dispatch({ type: "SET_LOADING", loading: false });
        if (phoneExists) errs.phone = isAr ? "هذا الرقم مسجل بالفعل. يرجى تسجيل الدخول" : "This number is already registered. Please sign in";
      }
    } else {
      if (!z.string().email().safeParse(state.emailInput).success) errs.email = isAr ? "البريد الإلكتروني غير صالح" : "Invalid email address";
      if (!errs.email) {
        dispatch({ type: "SET_LOADING", loading: true });
        const { data: emailExists } = await supabase.rpc("check_email_exists", { p_email: state.emailInput.trim().toLowerCase() });
        dispatch({ type: "SET_LOADING", loading: false });
        if (emailExists) errs.email = isAr ? "هذا البريد مسجل بالفعل. يرجى تسجيل الدخول" : "This email is already registered. Please sign in";
      }
    }
    if (Object.keys(errs).length > 0) { dispatch({ type: "SET_ERRORS", errors: errs }); return; }
    setField("signUpStep", "verify");
  }, [state.signUpMethod, state.phoneInput, state.phoneCode, state.emailInput, isAr, setField]);

  const handlePhoneVerified = useCallback((phone: string) => {
    setField("verifiedPhone", normalizePhoneForStorage(phone));
    setField("signUpStep", "details");
  }, [setField]);

  const handleSendEmailVerification = useCallback(async () => {
    setField("verifiedEmail", state.emailInput);
    setField("signUpStep", "details");
    toast({ title: isAr ? "سيتم التحقق من البريد" : "Email will be verified", description: isAr ? "سيتم إرسال رابط التحقق بعد إنشاء الحساب" : "A verification link will be sent after account creation" });
  }, [state.emailInput, isAr, setField, toast]);

  const handleDetailsSubmit = useCallback(async () => {
    dispatch({ type: "CLEAR_ERRORS" });
    const errs: Record<string, string> = {};
    if (!state.fullName.trim() || state.fullName.trim().length < 2) errs.fullName = isAr ? "الاسم مطلوب (حرفان على الأقل)" : "Name is required (min 2 chars)";
    if (state.signUpMethod === "phone") {
      if (!z.string().email().safeParse(state.email).success) errs.email = isAr ? "البريد الإلكتروني مطلوب لإنشاء الحساب" : "Email required for account creation";
      if (!errs.email && state.email) {
        dispatch({ type: "SET_LOADING", loading: true });
        const { data: emailExists2 } = await supabase.rpc("check_email_exists", { p_email: state.email.trim().toLowerCase() });
        dispatch({ type: "SET_LOADING", loading: false });
        if (emailExists2) errs.email = isAr ? "هذا البريد مسجل بالفعل" : "This email is already registered";
      }
    }
    if (Object.keys(errs).length > 0) { dispatch({ type: "SET_ERRORS", errors: errs }); return; }
    setField("signUpStep", "credentials");
  }, [state.fullName, state.signUpMethod, state.email, isAr, setField]);

  // ── Sign Up Step 4: Create Account ──
  const handleCreateAccount = useCallback(async () => {
    dispatch({ type: "CLEAR_ERRORS" });
    const errs: Record<string, string> = {};
    const usernameValidation = validateUsername(state.username);
    if (!usernameValidation.valid) errs.username = isAr ? (usernameValidation.errorAr || "اسم مستخدم غير صالح") : (usernameValidation.error || "Invalid username");
    if (state.usernameStatus === "taken") errs.username = isAr ? "اسم المستخدم مستخدم بالفعل" : "Username already taken";
    if (state.usernameStatus === "checking") errs.username = isAr ? "جاري التحقق..." : "Still checking...";
    if (state.password.length < 8) errs.password = isAr ? "8 أحرف على الأقل" : "At least 8 characters";
    else if (!/[A-Z]/.test(state.password)) errs.password = isAr ? "يجب أن تحتوي على حرف كبير واحد على الأقل" : "Must contain at least 1 uppercase letter";
    else if (!/\d/.test(state.password)) errs.password = isAr ? "يجب أن تحتوي على رقم واحد على الأقل" : "Must contain at least 1 number";
    else if (getPasswordStrength(state.password) < 2) errs.password = isAr ? "كلمة المرور ضعيفة جداً" : "Password is too weak";
    if (state.password !== state.confirmPassword) errs.confirmPassword = isAr ? "غير متطابقة" : "Passwords don't match";
    if (!state.termsAccepted) errs.terms = isAr ? "يجب الموافقة على الشروط والأحكام" : "You must accept the Terms & Conditions";
    if (Object.keys(errs).length > 0) { dispatch({ type: "SET_ERRORS", errors: errs }); return; }

    const accountEmail = state.signUpMethod === "phone" ? state.email : state.emailInput;
    dispatch({ type: "SET_LOADING", loading: true });
    const { data, error } = await supabase.auth.signUp({
      email: accountEmail,
      password: state.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: state.fullName, username: state.username.toLowerCase(), phone: state.verifiedPhone || null, country_code: state.countryCode || null, account_type: state.accountType, preferred_language: language },
      },
    });

    if (error) {
      dispatch({ type: "SET_LOADING", loading: false });
      let errMsg = error.message;
      if (error.message?.toLowerCase().includes("already registered") || error.message?.toLowerCase().includes("already been registered")) {
        errMsg = isAr ? "هذا البريد الإلكتروني مسجل بالفعل" : "This email is already registered. Please sign in instead.";
      }
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: errMsg });
      return;
    }

    if (data.user) {
      await supabase.from("user_roles").insert({ user_id: data.user.id, role: (state.accountType === "fan" ? "viewer" : "chef") as any });
      await new Promise((resolve) => setTimeout(resolve, 500));
      await supabase.from("profiles").update({ username: state.username.toLowerCase(), phone: state.verifiedPhone || null, country_code: state.countryCode || null, preferred_language: language, email: accountEmail, account_type: state.accountType }).eq("user_id", data.user.id);

      const storedRef = localStorage.getItem("altoha_ref_code") || state.manualRefCode.trim().toUpperCase() || null;
      if (storedRef) {
        try { await supabase.functions.invoke("process-referral", { body: { referralCode: storedRef, newUserId: data.user.id } }); localStorage.removeItem("altoha_ref_code"); } catch { localStorage.removeItem("altoha_ref_code"); }
      }

      try { supabase.functions.invoke("send-transactional-email", { body: { templateName: "welcome", recipientEmail: accountEmail, idempotencyKey: `welcome-${data.user.id}`, templateData: { name: state.fullName } } }).then(null, () => {}); } catch {}

      try {
        const { sendGoogleConversion, pushToDataLayer } = await import("@/hooks/useGoogleTracking");
        sendGoogleConversion("sign_up", { method: state.signUpMethod, currency: "SAR" });
        pushToDataLayer("sign_up", { method: state.signUpMethod, userId: data.user.id });
        supabase.from("conversion_events").insert([{ user_id: data.user.id, event_name: "sign_up", event_category: "engagement", source: new URLSearchParams(window.location.search).get("utm_source") || null, medium: new URLSearchParams(window.location.search).get("utm_medium") || null, campaign: new URLSearchParams(window.location.search).get("utm_campaign") || null, session_id: sessionStorage.getItem("ad_session_id") || null, metadata: { method: state.signUpMethod, country: state.countryCode } as any }]).then(null, () => {});
      } catch {}
    }

    dispatch({ type: "SET_LOADING", loading: false });
    toast({ title: isAr ? "تم إنشاء الحساب بنجاح! 🎉" : "Account Created! 🎉", description: isAr ? "يرجى التحقق من بريدك الإلكتروني لتأكيد حسابك قبل تسجيل الدخول." : "Please check your email to verify your account before signing in." });
    setIsSignUp(false);
    dispatch({ type: "RESET_SIGNUP" });
    navigate("/login", { replace: true });
  }, [state, isAr, language, setIsSignUp, navigate, toast, setField]);

  return {
    // Sign-in state
    signInMethod: state.signInMethod, setSignInMethod: (v: SignInMethod) => setField("signInMethod", v),
    signInPhone: state.signInPhone, setSignInPhone: (v: string) => setField("signInPhone", v),
    signInPhoneCode: state.signInPhoneCode, setSignInPhoneCode: (v: string) => setField("signInPhoneCode", v),
    signInCountry: state.signInCountry, setSignInCountry: (v: string) => setField("signInCountry", v),
    signInEmail: state.signInEmail, setSignInEmail: (v: string) => setField("signInEmail", v),
    signInPassword: state.signInPassword, setSignInPassword: (v: string) => setField("signInPassword", v),
    signInPhoneStep: state.signInPhoneStep, setSignInPhoneStep: (v: "phone" | "otp" | "password" | "pin") => setField("signInPhoneStep", v),
    signInVerifiedPhone: state.signInVerifiedPhone,
    signInPin: state.signInPin, setSignInPin: (v: string) => setField("signInPin", v),
    pinAvailable: state.pinAvailable, setPinAvailable: (v: boolean) => setField("pinAvailable", v),
    pinError: state.pinError, setPinError: (v: string) => setField("pinError", v),

    // Sign-up state
    signUpStep: state.signUpStep, setSignUpStep: (v: SignUpStep) => setField("signUpStep", v),
    signUpMethod: state.signUpMethod, setSignUpMethod: (v: SignUpMethod) => setField("signUpMethod", v),
    phoneInput: state.phoneInput, setPhoneInput: (v: string) => setField("phoneInput", v),
    emailInput: state.emailInput, setEmailInput: (v: string) => setField("emailInput", v),
    countryCode: state.countryCode, setCountryCode: (v: string) => setField("countryCode", v),
    phoneCode: state.phoneCode, setPhoneCode: (v: string) => setField("phoneCode", v),
    verifiedPhone: state.verifiedPhone, verifiedEmail: state.verifiedEmail,
    fullName: state.fullName, setFullName: (v: string) => setField("fullName", v),
    email: state.email, setEmail: (v: string) => setField("email", v),
    password: state.password, setPassword: (v: string) => setField("password", v),
    confirmPassword: state.confirmPassword, setConfirmPassword: (v: string) => setField("confirmPassword", v),
    username: state.username, setUsername: (v: string) => setField("username", v),
    usernameStatus: state.usernameStatus,
    termsAccepted: state.termsAccepted, setTermsAccepted: (v: boolean) => setField("termsAccepted", v),
    manualRefCode: state.manualRefCode, setManualRefCode: (v: string) => setField("manualRefCode", v),
    accountType: state.accountType, setAccountType: (v: "professional" | "fan") => setField("accountType", v),

    // Reset
    resetPassword: state.resetPassword, setResetPassword: (v: string) => setField("resetPassword", v),
    resetConfirm: state.resetConfirm, setResetConfirm: (v: string) => setField("resetConfirm", v),
    resetSuccess: state.resetSuccess,

    // Dialogs
    forgotOpen: state.forgotOpen, setForgotOpen: (v: boolean) => setField("forgotOpen", v),

    // General
    loading: state.loading, errors: state.errors, setErrors: (v: Record<string, string>) => dispatch({ type: "SET_ERRORS", errors: v }),
    formError: state.formError, setFormError: (v: string) => setField("formError", v),
    loginAttempts: state.loginAttempts, isLockedOut,

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
