import { memo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

interface InlineConfirmProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  loading?: boolean;
  className?: string;
  icon?: ReactNode;
}

/**
 * Inline confirmation panel replacing AlertDialog.
 * Displays within page flow instead of an overlay.
 */
export const InlineConfirm = memo(function InlineConfirm({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading = false,
  className,
  icon,
}: InlineConfirmProps) {
  if (!open) return null;

  return (
    <div className={cn("animate-in fade-in-0 slide-in-from-top-2 duration-300", className)}>
      <Card className={cn(
        "border shadow-[var(--shadow-md)]",
        variant === "destructive" ? "border-destructive/30 bg-destructive/5" : "border-warning/30 bg-warning/5"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn(
              "rounded-xl p-2 shrink-0",
              variant === "destructive" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
            )}>
              {icon || <AlertTriangle className="h-5 w-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{title}</p>
              {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
              <div className="flex items-center gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  disabled={loading}
                  className="rounded-xl"
                >
                  {cancelLabel}
                </Button>
                <Button
                  variant={variant === "destructive" ? "destructive" : "default"}
                  size="sm"
                  onClick={onConfirm}
                  disabled={loading}
                  className="rounded-xl"
                >
                  {loading ? "..." : confirmLabel}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
