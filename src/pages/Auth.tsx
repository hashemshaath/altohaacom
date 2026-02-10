import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { SEOHead } from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";
import { PhoneVerification } from "@/components/auth/PhoneVerification";
import { CountrySelector } from "@/components/auth/CountrySelector";
import { useAllCountries, type Country } from "@/hooks/useCountries";
import { z } from "zod";
import { CheckCircle, XCircle, Loader2, ArrowLeft, ShieldCheck, UserPlus, LogIn } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const roles: AppRole[] = ["chef", "judge", "student", "organizer", "volunteer", "sponsor", "assistant", "supervisor"];

const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{2,29}$/;

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = signInSchema.extend({
  fullName: z.string().min(2, "Name is required"),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(usernameRegex, "Username must start with a letter and contain only letters, numbers, or underscores"),
  confirmPassword: z.string(),
  role: z.enum(["chef", "judge", "student", "organizer", "volunteer", "sponsor", "assistant", "supervisor"]),
  phone: z.string().min(10, "Phone number is required"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AuthStep = "credentials" | "phone-verify" | "complete";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("tab") === "signup");
  const [authStep, setAuthStep] = useState<AuthStep>("credentials");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [role, setRole] = useState<AppRole>("chef");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAr = language === "ar";

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

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
    setAuthStep("credentials");
  }, [isSignUp]);

  const handleSignIn = async () => {
    setErrors({});
    const result = signInSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        fieldErrors[e.path[0] as string] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleCredentialsSubmit = async () => {
    setErrors({});
    if (usernameStatus === "taken") {
      setErrors({ username: t("usernameTaken") });
      return;
    }
    if (usernameStatus !== "available") {
      setErrors({ username: t("usernameInvalid") });
      return;
    }

    if (!countryCode) {
      setErrors({ countryCode: isAr ? "يرجى اختيار الدولة" : "Country is required" });
      return;
    }

    const baseResult = z.object({
      email: z.string().email("Invalid email address"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      fullName: z.string().min(2, "Name is required"),
      username: z.string()
        .min(3, "Username must be at least 3 characters")
        .max(30, "Username must be at most 30 characters")
        .regex(usernameRegex, "Username must start with a letter"),
      confirmPassword: z.string(),
      role: z.enum(["chef", "judge", "student", "organizer", "volunteer", "sponsor", "assistant", "supervisor"]),
    }).refine((d) => d.password === d.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    }).safeParse({ email, password, confirmPassword, fullName, username, role });

    if (!baseResult.success) {
      const fieldErrors: Record<string, string> = {};
      baseResult.error.errors.forEach((e) => {
        fieldErrors[e.path[0] as string] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setAuthStep("phone-verify");
  };

  const handlePhoneVerified = async (verifiedPhone: string) => {
    setPhone(verifiedPhone);
    setLoading(true);
    const redirectUrl = `${window.location.origin}/`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName, username: username.toLowerCase() },
      },
    });

    if (error) {
      setLoading(false);
      toast({ variant: "destructive", title: "Error", description: error.message });
      setAuthStep("credentials");
      return;
    }

    if (data.user) {
      await supabase.from("user_roles").insert({ user_id: data.user.id, role });
      await new Promise((resolve) => setTimeout(resolve, 500));
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          username: username.toLowerCase(),
          phone: verifiedPhone,
          country_code: countryCode || null,
          preferred_language: language,
        })
        .eq("user_id", data.user.id);
      if (updateError) {
        console.error("Profile update error:", updateError);
      }
    }

    setLoading(false);
    toast({
      title: isAr ? "تم إنشاء الحساب!" : "Account created!",
      description: isAr
        ? "يرجى التحقق من بريدك الإلكتروني لتأكيد حسابك قبل تسجيل الدخول."
        : "Please check your email to verify your account before signing in.",
    });
    setIsSignUp(false);
    setAuthStep("credentials");
  };

  // Phone verification step
  if (authStep === "phone-verify" && isSignUp) {
    return (
      <div className="flex min-h-screen flex-col">
        <SEOHead title="Phone Verification" description="Verify your phone number" />
        <Header />
        <main className="flex flex-1 items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <div className="p-5 md:p-6">
              <div className="mb-5 flex flex-col items-center text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <ShieldCheck className="h-7 w-7 text-primary" />
                </div>
                <h2 className="font-serif text-xl font-bold">
                  {isAr ? "التحقق من الهاتف" : "Phone Verification"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isAr
                    ? "يرجى التحقق من رقم هاتفك لإكمال التسجيل"
                    : "Verify your phone number to complete registration"}
                </p>
              </div>
              <PhoneVerification
                onVerified={handlePhoneVerified}
                onBack={() => setAuthStep("credentials")}
                phoneCode={phoneCode}
                mode="signup"
              />
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title={isSignUp ? "Sign Up" : "Sign In"}
        description="Sign in or create an account on Altohaa"
      />
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-5">
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <img src="/altohaa-logo.png" alt="Altohaa" className="mb-3 h-14 w-auto" />
            <h1 className="font-serif text-2xl font-bold">
              {isSignUp ? t("signUpTitle") : t("signInTitle")}
            </h1>
            {isSignUp && (
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">{t("heroSubtitle")}</p>
            )}
          </div>

          {/* Form Card */}
          <Card className="border-border/50 shadow-lg shadow-primary/5">
            <CardContent className="space-y-4 p-5 md:p-6">
              {isSignUp && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="fullName" className="text-xs">{t("fullName")}</Label>
                      <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                      {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="username" className="text-xs">{t("username")}</Label>
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
                  </div>

                  {/* Country Selection */}
                  <CountrySelector
                    value={countryCode}
                    onChange={(code, country) => {
                      setCountryCode(code);
                      setPhoneCode(country?.phone_code || "");
                    }}
                    label={isAr ? "دولة الإقامة" : "Country of Residence"}
                    required
                  />
                  {errors.countryCode && <p className="text-xs text-destructive">{errors.countryCode}</p>}
                </>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">{t("email")}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className={isSignUp ? "grid gap-4 sm:grid-cols-2" : "space-y-1.5"}>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs">{t("password")}</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>
                {isSignUp && (
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-xs">{t("confirmPassword")}</Label>
                    <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                  </div>
                )}
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <Label className="text-xs">{t("selectRole")}</Label>
                  <RadioGroup
                    value={role}
                    onValueChange={(v) => setRole(v as AppRole)}
                    className="grid grid-cols-2 gap-1.5 sm:grid-cols-4"
                  >
                    {roles.map((r) => (
                      <div
                        key={r}
                        className="flex items-center gap-1.5 rounded-lg border p-2 transition-all duration-200 has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:shadow-sm hover:border-primary/30"
                      >
                        <RadioGroupItem value={r} id={r} className="h-3.5 w-3.5" />
                        <Label htmlFor={r} className="cursor-pointer text-[11px] font-medium leading-tight">
                          {t(r as any)}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              <Button
                className="w-full gap-2"
                disabled={loading}
                onClick={isSignUp ? handleCredentialsSubmit : handleSignIn}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isSignUp ? (
                  <UserPlus className="h-4 w-4" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                {loading
                  ? (isSignUp ? t("signingUp") : t("signingIn"))
                  : (isSignUp ? t("continue") : t("signIn"))}
              </Button>
            </CardContent>
          </Card>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-1.5 text-sm">
            <span className="text-muted-foreground">
              {isSignUp ? t("hasAccount") : t("noAccount")}
            </span>
            <button
              type="button"
              className="font-medium text-primary underline-offset-2 hover:underline"
              onClick={() => { setIsSignUp(!isSignUp); setErrors({}); }}
            >
              {isSignUp ? t("signIn") : t("signUp")}
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
