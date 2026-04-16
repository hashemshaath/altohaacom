import { useIsAr } from "@/hooks/useIsAr";
import { useMemo, memo } from "react";
import { cn } from "@/lib/utils";

interface PasswordStrengthMeterProps {
  password: string;
}

export function getPasswordStrength(password: string) {
  const isAr = useIsAr();
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  // Require at least uppercase + number for score >= 2
  const hasUpper = /[A-Z]/.test(password);
  const hasNum = /\d/.test(password);
  if (!hasUpper || !hasNum) score = Math.min(score, 1);
  return Math.min(score, 4);
}

export const PasswordStrengthMeter = memo(function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const isAr = useIsAr();

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const labels = isAr
    ? ["ضعيف جداً", "ضعيف", "متوسط", "قوي", "قوي جداً"]
    : ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];

  const colors = [
    "bg-destructive",
    "bg-destructive/70",
    "bg-yellow-500",
    "bg-primary/70",
    "bg-primary",
  ];

  if (!password) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < strength ? colors[strength] : "bg-muted"
            )}
          />
        ))}
      </div>
      <p className={cn("text-sm font-medium", colors[strength].replace("bg-", "text-").replace("/70", "").replace("/50", ""))}>
        {labels[strength]}
      </p>
    </div>
  );
});
