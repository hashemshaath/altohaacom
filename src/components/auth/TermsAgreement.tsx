import { useLanguage } from "@/i18n/LanguageContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface TermsAgreementProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  error?: string;
}

export function TermsAgreement({ checked, onCheckedChange, error }: TermsAgreementProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="space-y-1">
      <div className="flex items-start gap-2.5">
        <Checkbox
          id="terms"
          checked={checked}
          onCheckedChange={(v) => onCheckedChange(v === true)}
          className="mt-0.5"
        />
        <Label htmlFor="terms" className="text-xs leading-relaxed text-muted-foreground cursor-pointer">
          {isAr ? (
            <>
              بإنشاء حسابك، فإنك توافق على{" "}
              <a href="/terms" className="font-medium text-primary underline-offset-2 hover:underline">
                الشروط والأحكام
              </a>{" "}
              و{" "}
              <a href="/privacy" className="font-medium text-primary underline-offset-2 hover:underline">
                سياسة الخصوصية
              </a>
            </>
          ) : (
            <>
              By creating an account, you agree to our{" "}
              <a href="/terms" className="font-medium text-primary underline-offset-2 hover:underline">
                Terms & Conditions
              </a>{" "}
              and{" "}
              <a href="/privacy" className="font-medium text-primary underline-offset-2 hover:underline">
                Privacy Policy
              </a>
            </>
          )}
        </Label>
      </div>
      {error && <p className="text-xs text-destructive ps-6">{error}</p>}
    </div>
  );
}
