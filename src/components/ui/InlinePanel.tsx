import { memo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

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
