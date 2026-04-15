import React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface SubmitButtonProps extends Omit<ButtonProps, "type"> {
  /** Show loading spinner and disable button */
  loading?: boolean;
  /** Text to show while loading */
  loadingText?: string;
  /** Icon before the label */
  icon?: React.ReactNode;
}

/**
 * Submit button with built-in loading state, spinner, and double-submit prevention.
 *
 * ```tsx
 * <SubmitButton loading={sending} loadingText="Sending..." icon={<Send />}>
 *   Send Message
 * </SubmitButton>
 * ```
 */
export function SubmitButton({
  loading = false,
  loadingText,
  icon,
  children,
  disabled,
  ...props
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText ?? children}
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </Button>
  );
}
