import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Mail, CheckCircle, Phone } from "lucide-react";
import { z } from "zod";

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type RecoveryMethod = "email" | "phone";
type Step = "method" | "input" | "sent";

export function ForgotPasswordDialog({ open, onOpenChange }: ForgotPasswordDialogProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("input");
  const [method, setMethod] = useState<RecoveryMethod>("email");
  const [emailValue, setEmailValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReset = () => {
    setStep("input");
    setMethod("email");
    setEmailValue("");
    setError("");
  };

  const handleSubmit = async () => {
    setError("");

    if (method === "email") {
      const result = z.string().email().safeParse(emailValue);
      if (!result.success) {
        setError(isAr ? "البريد الإلكتروني غير صالح" : "Invalid email address");
        return;
      }

      setLoading(true);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(emailValue, {
        redirectTo: `${window.location.origin}/auth?tab=reset`,
      });
      setLoading(false);

      if (resetError) {
        toast({
          variant: "destructive",
          title: isAr ? "خطأ" : "Error",
          description: resetError.message,
        });
        return;
      }

      setStep("sent");
    } else {
      // Phone recovery - show instructions
      setStep("sent");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleReset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {step === "sent"
              ? (isAr ? "تم الإرسال" : "Sent!")
              : (isAr ? "استعادة الحساب" : "Account Recovery")}
          </DialogTitle>
          <DialogDescription className="text-center">
            {step === "sent"
              ? (isAr
                  ? "تحقق من بريدك الإلكتروني للحصول على رابط إعادة تعيين كلمة المرور"
                  : "Check your email for a password reset link")
              : (isAr
                  ? "أدخل بريدك الإلكتروني المسجل لاستعادة حسابك"
                  : "Enter your registered email to recover your account")}
          </DialogDescription>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-4 pt-2">
            {/* Recovery method toggle */}
            <div className="flex rounded-xl border border-border/50 p-1 gap-1">
              <button
                type="button"
                onClick={() => setMethod("email")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  method === "email"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Mail className="h-4 w-4" />
                {isAr ? "البريد" : "Email"}
              </button>
              <button
                type="button"
                onClick={() => setMethod("phone")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  method === "phone"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Phone className="h-4 w-4" />
                {isAr ? "الهاتف" : "Phone"}
              </button>
            </div>

            {method === "email" ? (
              <div className="space-y-1.5">
                <Label htmlFor="recoveryEmail" className="text-xs">
                  {isAr ? "البريد الإلكتروني" : "Email Address"}
                </Label>
                <Input
                  id="recoveryEmail"
                  type="email"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  placeholder={isAr ? "أدخل بريدك الإلكتروني" : "Enter your email"}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
            ) : (
              <div className="rounded-xl border border-muted bg-muted/30 p-4 text-center space-y-2">
                <Phone className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {isAr
                    ? "استعادة الحساب عبر الهاتف ستكون متاحة قريباً. يرجى استخدام البريد الإلكتروني حالياً."
                    : "Phone recovery will be available soon. Please use email recovery for now."}
                </p>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={loading || method === "phone"}
            >
              {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {isAr ? "إرسال رابط الاستعادة" : "Send Recovery Link"}
            </Button>
          </div>
        )}

        {step === "sent" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">
                {isAr ? "تم إرسال رابط إعادة التعيين إلى:" : "Reset link sent to:"}
              </p>
              <p className="font-mono text-sm text-primary">{emailValue}</p>
            </div>
            <p className="text-xs text-muted-foreground text-center max-w-sm">
              {isAr
                ? "إذا كان هذا البريد مسجلاً لدينا، ستتلقى رابطاً لإعادة تعيين كلمة المرور خلال دقائق. تحقق أيضاً من مجلد الرسائل غير المرغوب فيها."
                : "If this email is registered, you'll receive a password reset link within minutes. Also check your spam folder."}
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {isAr ? "إغلاق" : "Close"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
