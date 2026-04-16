import { ROUTES } from "@/config/routes";
import { useIsAr } from "@/hooks/useIsAr";
import { memo } from "react";
import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface TermsAgreementProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  error?: string;
}

export const TermsAgreement = memo(function TermsAgreement({ checked, onCheckedChange, error }: TermsAgreementProps) {
  const isAr = useIsAr();

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
              <Link to={ROUTES.terms} className="font-medium text-primary underline-offset-2 hover:underline">
                الشروط والأحكام
              </Link>{" "}
              و{" "}
              <Link to={ROUTES.privacy} className="font-medium text-primary underline-offset-2 hover:underline">
                سياسة الخصوصية
              </Link>
            </>
          ) : (
            <>
              By creating an account, you agree to our{" "}
              <Link to={ROUTES.terms} className="font-medium text-primary underline-offset-2 hover:underline">
                Terms & Conditions
              </Link>{" "}
              and{" "}
              <Link to={ROUTES.privacy} className="font-medium text-primary underline-offset-2 hover:underline">
                Privacy Policy
              </Link>
            </>
          )}
        </Label>
      </div>
      {error && <p className="text-xs text-destructive ps-6">{error}</p>}
    </div>
  );
});