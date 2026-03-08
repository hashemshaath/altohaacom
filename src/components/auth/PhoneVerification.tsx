import { useState, useEffect, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { Phone, ArrowLeft, CheckCircle, Loader2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizePhoneInput } from "@/lib/arabicNumerals";

interface PhoneVerificationProps {
  onVerified: (phone: string) => void;
  onBack?: () => void;
  initialPhone?: string;
  phoneCode?: string;
  mode?: "signup" | "login";
}

// Virtual OTP service - simulates SMS sending until real integration
const VirtualOTPService = {
  generatedOTP: "",
  
  sendOTP: async (phone: string): Promise<{ success: boolean; otp?: string }> => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    VirtualOTPService.generatedOTP = otp;
    
    // OTP generated for virtual verification
    
    return { success: true, otp };
  },
  
  verifyOTP: async (phone: string, inputOTP: string): Promise<boolean> => {
    // Simulate verification delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return inputOTP === VirtualOTPService.generatedOTP;
  },
};

export const PhoneVerification = memo(function PhoneVerification({ onVerified, onBack, initialPhone = "", phoneCode = "", mode = "signup" }: PhoneVerificationProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState(initialPhone || phoneCode);
  const [otp, setOtp] = useState("");
  const [virtualOTP, setVirtualOTP] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Phone number validation (international format)
  const isValidPhone = (value: string) => {
    const phoneRegex = /^\+?[1-9]\d{7,14}$/;
    return phoneRegex.test(value.replace(/\s/g, ""));
  };

  const handleSendOTP = async () => {
    setError("");
    
    if (!isValidPhone(phone)) {
      setError(language === "ar" ? "رقم الهاتف غير صالح" : "Invalid phone number");
      return;
    }

    setLoading(true);
    try {
      const result = await VirtualOTPService.sendOTP(phone);
      
      if (result.success && result.otp) {
        setVirtualOTP(result.otp);
        setStep("otp");
        setCountdown(60);
        toast({
          title: language === "ar" ? "تم إرسال رمز التحقق" : "Verification code sent",
          description: language === "ar" 
            ? `رمز التحقق الافتراضي: ${result.otp}` 
            : `Virtual OTP: ${result.otp} (for testing)`,
        });
      }
    } catch {
      setError(language === "ar" ? "فشل في إرسال الرمز" : "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError("");
    
    if (otp.length !== 6) {
      setError(language === "ar" ? "يرجى إدخال الرمز المكون من 6 أرقام" : "Please enter the 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const isValid = await VirtualOTPService.verifyOTP(phone, otp);
      
      if (isValid) {
        toast({
          title: language === "ar" ? "تم التحقق بنجاح" : "Verification successful",
          description: language === "ar" ? "تم التحقق من رقم هاتفك" : "Your phone number has been verified",
        });
        onVerified(phone);
      } else {
        setError(language === "ar" ? "رمز التحقق غير صحيح" : "Invalid verification code");
      }
    } catch {
      setError(language === "ar" ? "فشل التحقق" : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    await handleSendOTP();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-lg shadow-primary/10">
          <Phone className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">
          {step === "phone" 
            ? (language === "ar" ? "التحقق من رقم الهاتف" : "Verify Your Phone")
            : (language === "ar" ? "أدخل رمز التحقق" : "Enter Verification Code")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {step === "phone"
            ? (language === "ar" 
                ? "أدخل رقم هاتفك لتلقي رمز التحقق" 
                : "Enter your phone number to receive a verification code")
            : (language === "ar"
                ? `تم إرسال رمز التحقق إلى ${phone}`
                : `We sent a verification code to ${phone}`)}
        </p>
      </div>

      {/* Virtual OTP Notice */}
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
        <MessageSquare className="mt-0.5 h-5 w-5 text-primary" />
        <div className="text-sm">
          <p className="font-medium text-primary">
            {language === "ar" ? "وضع الاختبار الافتراضي" : "Virtual Testing Mode"}
          </p>
          <p className="text-muted-foreground">
            {language === "ar" 
              ? "يتم عرض رمز التحقق على الشاشة للاختبار"
              : "OTP is displayed on screen for testing purposes"}
          </p>
          {virtualOTP && step === "otp" && (
            <p className="mt-1 font-mono font-bold text-primary">
              {language === "ar" ? "الرمز:" : "Code:"} {virtualOTP}
            </p>
          )}
        </div>
      </div>

      {/* Phone Input Step */}
      {step === "phone" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">
              {language === "ar" ? "رقم الهاتف" : "Phone Number"}
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+966 5XX XXX XXXX"
              value={phone}
              onChange={(e) => setPhone(normalizePhoneInput(e.target.value))}
              className={cn(error && "border-destructive")}
              dir="ltr"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <p className="text-xs text-muted-foreground">
              {language === "ar" 
                ? "أدخل رقمك بالصيغة الدولية (مثال: +966512345678)"
                : "Enter number with country code (e.g., +966512345678)"}
            </p>
          </div>

          <div className="flex gap-2">
            {onBack && (
              <Button variant="outline" onClick={onBack} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                {language === "ar" ? "رجوع" : "Back"}
              </Button>
            )}
            <Button 
              className="flex-1" 
              onClick={handleSendOTP} 
              disabled={loading || !phone}
            >
              {loading ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : null}
              {language === "ar" ? "إرسال الرمز" : "Send Code"}
            </Button>
          </div>
        </div>
      )}

      {/* OTP Input Step */}
      {step === "otp" && (
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => setOtp(value)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <Button 
            className="w-full" 
            onClick={handleVerifyOTP} 
            disabled={loading || otp.length !== 6}
          >
            {loading ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="me-2 h-4 w-4" />
            )}
            {language === "ar" ? "تحقق" : "Verify"}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => setStep("phone")}
              className="text-primary hover:underline"
            >
              {language === "ar" ? "تغيير الرقم" : "Change number"}
            </button>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={countdown > 0}
              className={cn(
                "text-primary hover:underline",
                countdown > 0 && "cursor-not-allowed text-muted-foreground"
              )}
            >
              {countdown > 0 
                ? (language === "ar" 
                    ? `إعادة الإرسال خلال ${countdown} ثانية` 
                    : `Resend in ${countdown}s`)
                : (language === "ar" ? "إعادة إرسال الرمز" : "Resend code")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
