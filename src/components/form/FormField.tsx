import React from "react";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

interface FormFieldProps {
  /** Field label */
  label: string;
  /** HTML for/id attribute */
  htmlFor?: string;
  /** Is the field required? Shows asterisk */
  required?: boolean;
  /** Error message to display */
  error?: string;
  /** The input/textarea element */
  children: React.ReactNode;
  className?: string;
}

/**
 * Standardized form field wrapper with label, error message, and error icon.
 *
 * ```tsx
 * <FormField label="Email" htmlFor="email" required error={errors.email}>
 *   <Input id="email" state={errors.email ? "error" : "default"} ... />
 * </FormField>
 * ```
 */
export function FormField({
  label,
  htmlFor,
  required,
  error,
  children,
  className = "",
}: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label htmlFor={htmlFor} className={`typo-auth-label ${error ? "text-destructive" : ""}`}>
        {label}
        {required && <span className="text-destructive ms-0.5">*</span>}
      </Label>

      {children}

      {error && (
        <p className="flex items-center gap-1 typo-auth-error animate-in fade-in-0 slide-in-from-top-1 duration-200" role="alert">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
