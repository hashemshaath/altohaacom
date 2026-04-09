import { useState, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, AlertCircle, CheckCircle, Lock, Eye, EyeOff } from "lucide-react";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChangePasswordDialog = memo(function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "done">("form");

  const handleReset = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setStep("form");
  };

  const handleSubmit = async () => {
    setError("");

    if (!currentPassword) {
      setError(isAr ? "أدخل كلمة المرور الحالية" : "Enter your current password");
      return;
    }
    if (newPassword.length < 8) {
      setError(isAr ? "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل" : "New password must be at least 8 characters");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError(isAr ? "يجب أن تحتوي على حرف كبير" : "Must contain an uppercase letter");
      return;
    }
    if (!/\d/.test(newPassword)) {
      setError(isAr ? "يجب أن تحتوي على رقم" : "Must contain a number");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(isAr ? "كلمتا المرور غير متطابقتين" : "Passwords do not match");
      return;
    }
    if (currentPassword === newPassword) {
      setError(isAr ? "كلمة المرور الجديدة يجب أن تختلف عن الحالية" : "New password must be different from current");
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error: fnError } = await supabase.functions.invoke("pin-auth", {
        body: {
          action: "change_password",
          current_password: currentPassword,
          new_password: newPassword,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (fnError || data?.error) {
        const errMsg = data?.error || fnError?.message;
        if (data?.code === "WRONG_PASSWORD") {
          setError(isAr ? "كلمة المرور الحالية غير صحيحة" : "Current password is incorrect");
        } else {
          setError(errMsg);
        }
        return;
      }

      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleReset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            {step === "done"
              ? (isAr ? "تم التغيير!" : "Password Changed!")
              : (isAr ? "تغيير كلمة المرور" : "Change Password")}
          </DialogTitle>
          <DialogDescription className="text-center">
            {step === "done"
              ? (isAr ? "تم تحديث كلمة المرور بنجاح" : "Your password has been updated successfully")
              : (isAr ? "أدخل كلمة المرور الحالية ثم الجديدة" : "Enter your current password and choose a new one")}
          </DialogDescription>
        </DialogHeader>

        {step === "form" && (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "كلمة المرور الحالية" : "Current Password"}</Label>
              <div className="relative">
                <Input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => { setCurrentPassword(e.target.value); setError(""); }}
                  placeholder="••••••••"
                />
                <button type="button" className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowCurrent(!showCurrent)}>
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "كلمة المرور الجديدة" : "New Password"}</Label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                  placeholder="••••••••"
                />
                <button type="button" className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowNew(!showNew)}>
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {newPassword && <PasswordStrengthMeter password={newPassword} />}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "تأكيد كلمة المرور الجديدة" : "Confirm New Password"}</Label>
              <Input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />{error}
                </p>
              </div>
            )}

            <Button className="w-full" onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {isAr ? "تغيير كلمة المرور" : "Change Password"}
            </Button>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {isAr ? "تم تحديث كلمة المرور. ستبقى جلستك الحالية نشطة." : "Password updated. Your current session remains active."}
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {isAr ? "إغلاق" : "Close"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});
