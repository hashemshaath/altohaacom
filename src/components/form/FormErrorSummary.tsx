import { AlertCircle } from "lucide-react";
import { useIsAr } from "@/hooks/useIsAr";

interface FormErrorSummaryProps {
  errors: string[];
  className?: string;
}

/**
 * Shows a summary of form errors at the top of a form.
 * Only renders when there are errors.
 *
 * ```tsx
 * <FormErrorSummary errors={errorList} />
 * ```
 */
export function FormErrorSummary({ errors, className = "" }: FormErrorSummaryProps) {
  const isAr = useIsAr();

  if (errors.length === 0) return null;

  return (
    <div
      role="alert"
      className={`rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm ${className}`}
    >
      <div className="flex items-center gap-2 font-medium text-destructive mb-1.5">
        <AlertCircle className="h-4 w-4 shrink-0" />
        {isAr
          ? `يوجد ${errors.length} ${errors.length === 1 ? "خطأ" : "أخطاء"} في النموذج`
          : `Please fix ${errors.length} ${errors.length === 1 ? "error" : "errors"} below`}
      </div>
      <ul className="list-disc list-inside space-y-0.5 text-destructive/80 typo-auth-error">
        {errors.map((msg, i) => (
          <li key={i}>{msg}</li>
        ))}
      </ul>
    </div>
  );
}
