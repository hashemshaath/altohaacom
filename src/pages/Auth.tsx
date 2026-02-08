import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const roles: AppRole[] = ["chef", "judge", "student", "organizer", "volunteer", "sponsor", "assistant", "supervisor"];

// Username validation: 3-30 chars, starts with letter, alphanumeric + underscore
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
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("tab") === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [role, setRole] = useState<AppRole>("chef");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  // Check username availability with debounce
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

  const handleSignUp = async () => {
    setErrors({});

    // Check username availability first
    if (usernameStatus === "taken") {
      setErrors({ username: t("usernameTaken") });
      return;
    }
    if (usernameStatus !== "available") {
      setErrors({ username: t("usernameInvalid") });
      return;
    }

    const result = signUpSchema.safeParse({ email, password, confirmPassword, fullName, username, role });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        fieldErrors[e.path[0] as string] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const redirectUrl = `${window.location.origin}/`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName },
      },
    });
    if (error) {
      setLoading(false);
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }

    // Insert user role and update profile with username
    if (data.user) {
      await supabase.from("user_roles").insert({ user_id: data.user.id, role });
      await supabase
        .from("profiles")
        .update({ username: username.toLowerCase() })
        .eq("user_id", data.user.id);
    }
    setLoading(false);
    toast({
      title: "Account created!",
      description: "Please check your email to verify your account before signing in.",
    });
    setIsSignUp(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <img src="/altohaa-logo.png" alt="Altohaa" className="mx-auto mb-2 h-14 w-auto" />
            <CardTitle className="font-serif text-2xl">
              {isSignUp ? t("signUpTitle") : t("signInTitle")}
            </CardTitle>
            <CardDescription>
              {isSignUp ? t("heroSubtitle") : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t("fullName")}</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">{t("username")}</Label>
                  <div className="relative">
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      className="pr-10"
                      placeholder="your_username"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {usernameStatus === "checking" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                      {usernameStatus === "available" && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {usernameStatus === "taken" && <XCircle className="h-4 w-4 text-destructive" />}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("usernameHint")}<span className="font-medium">{username || "username"}</span>
                  </p>
                  {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
                  <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                </div>
                <div className="space-y-2">
                  <Label>{t("selectRole")}</Label>
                  <RadioGroup value={role} onValueChange={(v) => setRole(v as AppRole)} className="grid grid-cols-2 gap-2">
                    {roles.map((r) => (
                      <div key={r} className="flex items-center gap-2 rounded-md border p-2">
                        <RadioGroupItem value={r} id={r} />
                        <Label htmlFor={r} className="cursor-pointer text-sm">
                          {t(r as any)}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </>
            )}
            <Button
              className="w-full"
              disabled={loading}
              onClick={isSignUp ? handleSignUp : handleSignIn}
            >
              {loading
                ? (isSignUp ? t("signingUp") : t("signingIn"))
                : (isSignUp ? t("signUp") : t("signIn"))}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {isSignUp ? t("hasAccount") : t("noAccount")}{" "}
              <button
                type="button"
                className="font-medium text-primary underline-offset-2 hover:underline"
                onClick={() => { setIsSignUp(!isSignUp); setErrors({}); }}
              >
                {isSignUp ? t("signIn") : t("signUp")}
              </button>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
