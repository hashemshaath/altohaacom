import { useIsAr } from "@/hooks/useIsAr";
import { useState, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { CheckCircle, Lock, Eye, EyeOff } from "lucide-react";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { FormField, FormErrorSummary, SubmitButton } from "@/components/form";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChangePasswordDialog = memo(function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const isAr = useIsAr();

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
            {error && <FormErrorSummary errors={[error]} />}

            <FormField label={isAr ? "كلمة المرور الحالية" : "Current Password"} htmlFor="current-pwd" required>
              <div className="relative">
                <Input
                  id="current-pwd"
                  type={showCurrent ? "text" : "password"}
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => { setCurrentPassword(e.target.value); setError(""); }}
                  placeholder="••••••••"
                />
                <button type="button" aria-label={isAr ? (showCurrent ? "إخفاء كلمة المرور" : "إظهار كلمة المرور") : (showCurrent ? "Hide password" : "Show password")} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowCurrent(!showCurrent)}>
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormField>

            <FormField label={isAr ? "كلمة المرور الجديدة" : "New Password"} htmlFor="new-pwd" required>
              <div className="relative">
                <Input
                  id="new-pwd"
                  type={showNew ? "text" : "password"}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                  placeholder="••••••••"
                />
                <button type="button" aria-label={isAr ? (showNew ? "إخفاء كلمة المرور" : "إظهار كلمة المرور") : (showNew ? "Hide password" : "Show password")} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowNew(!showNew)}>
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {newPassword && <PasswordStrengthMeter password={newPassword} />}
            </FormField>

            <FormField label={isAr ? "تأكيد كلمة المرور الجديدة" : "Confirm New Password"} htmlFor="confirm-pwd" required>
              <Input
                id="confirm-pwd"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                placeholder="••••••••"
              />
            </FormField>

            <SubmitButton
              loading={loading}
              loadingText={isAr ? "جاري التغيير..." : "Changing..."}
              className="w-full"
              onClick={handleSubmit}
            >
              {isAr ? "تغيير كلمة المرور" : "Change Password"}
            </SubmitButton>
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
