import { useIsAr } from "@/hooks/useIsAr";
import { useState, useCallback, useRef, useEffect, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getDeviceFingerprint, getDeviceName } from "@/lib/deviceFingerprint";
import { validatePin } from "@/lib/pinValidation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, ShieldCheck, CheckCircle, AlertCircle, KeyRound } from "lucide-react";

interface PinSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const PinSetupDialog = memo(function PinSetupDialog({ open, onOpenChange, onSuccess }: PinSetupDialogProps) {
  const { user } = useAuth();
  const isAr = useIsAr();

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"create" | "confirm" | "done">("create");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleReset = () => {
    setPin("");
    setConfirmPin("");
    setStep("create");
    setError("");
  };

  const handlePinChange = (value: string, isConfirm = false) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    if (isConfirm) {
      setConfirmPin(digits);
    } else {
      setPin(digits);
    }
    setError("");
  };

  const handleNext = () => {
    const validation = validatePin(pin);
    if (!validation.valid) {
      setError(isAr ? validation.errorAr! : validation.error!);
      return;
    }
    setStep("confirm");
  };

  const handleSubmit = async () => {
    if (pin !== confirmPin) {
      setError(isAr ? "الرمز غير متطابق" : "PINs do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const fingerprint = await getDeviceFingerprint();
      const deviceName = getDeviceName();

      const { data: { session } } = await supabase.auth.getSession();
      const { data, error: fnError } = await supabase.functions.invoke("pin-auth", {
        body: {
          action: "set_pin",
          pin,
          device_fingerprint: fingerprint,
          device_name: deviceName,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (fnError || data?.error) {
        throw new Error(data?.error || fnError?.message || "Failed to set PIN");
      }

      setStep("done");
      onSuccess?.();
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
            <KeyRound className="h-5 w-5 text-primary" />
            {step === "done"
              ? (isAr ? "تم التفعيل!" : "PIN Activated!")
              : (isAr ? "إنشاء رمز الدخول السريع" : "Create Quick Login PIN")}
          </DialogTitle>
          <DialogDescription className="text-center">
            {step === "done"
              ? (isAr ? "يمكنك الآن تسجيل الدخول باستخدام الرمز" : "You can now login using your PIN")
              : step === "confirm"
                ? (isAr ? "أعد إدخال الرمز للتأكيد" : "Re-enter your PIN to confirm")
                : (isAr ? "أدخل رمزاً مكوناً من 6 أرقام لتسريع تسجيل الدخول" : "Enter a 6-digit PIN for quick future logins")}
          </DialogDescription>
        </DialogHeader>

        {step === "create" && (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="pin-create" className="text-xs">{isAr ? "رمز PIN (6 أرقام)" : "PIN Code (6 digits)"}</Label>
              <Input
                id="pin-create"
                type="password"
                autoComplete="off"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                placeholder="••••••"
                className="text-center text-2xl tracking-[0.5em] font-mono"
                autoFocus
              />
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>• {isAr ? "6 أرقام بالضبط" : "Exactly 6 digits"}</p>
              <p>• {isAr ? "لا أرقام متسلسلة (مثل 123456)" : "No sequential numbers (e.g. 123456)"}</p>
              <p>• {isAr ? "لا أرقام متكررة (مثل 111111)" : "No repeated digits (e.g. 111111)"}</p>
            </div>
            {error && (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" />{error}
              </p>
            )}
            <Button className="w-full" onClick={handleNext} disabled={pin.length !== 6}>
              {isAr ? "التالي" : "Next"}
            </Button>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="pin-confirm" className="text-xs">{isAr ? "تأكيد الرمز" : "Confirm PIN"}</Label>
              <Input
                id="pin-confirm"
                type="password"
                autoComplete="off"
                inputMode="numeric"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => handlePinChange(e.target.value, true)}
                placeholder="••••••"
                className="text-center text-2xl tracking-[0.5em] font-mono"
                autoFocus
              />
            </div>
            {error && (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" />{error}
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setStep("create"); setConfirmPin(""); setError(""); }}>
                {isAr ? "رجوع" : "Back"}
              </Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={loading || confirmPin.length !== 6}>
                {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {isAr ? "تفعيل" : "Activate"}
              </Button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {isAr
                ? "رمز الدخول السريع مفعّل. سينتهي صلاحيته بعد 90 يوماً."
                : "Quick login PIN is active. It expires after 90 days."}
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
