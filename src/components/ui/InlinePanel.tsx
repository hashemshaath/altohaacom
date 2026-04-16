import { memo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

interface InlinePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** "full" takes 100% width, "lg" is max-w-2xl, "md" is max-w-lg */
  size?: "md" | "lg" | "full";
}

/**
 * Inline panel that replaces Dialog/popup patterns.
 * Renders content within the page flow instead of an overlay.
 */
export const InlinePanel = memo(function InlinePanel({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  className,
  size = "full",
}: InlinePanelProps) {
  if (!open) return null;

  const sizeClass = {
    md: "max-w-lg mx-auto",
    lg: "max-w-2xl mx-auto",
    full: "w-full",
  }[size];

  return (
    <div className={cn("animate-in fade-in-0 slide-in-from-top-2 duration-300", sizeClass, className)}>
      <Card className="border-primary/20 shadow-[var(--shadow-md)]">
        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
          <div className="space-y-1 min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              {icon}
              {title}
            </CardTitle>
            {description && (
              <CardDescription>{description}</CardDescription>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-xl shrink-0 text-muted-foreground hover:text-foreground active:scale-95"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {children}
          {footer && (
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/60">
              {footer}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});
