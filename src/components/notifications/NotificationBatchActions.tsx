/**
 * Batch action toolbar for notifications page.
 * Appears when notifications are selected.
 */
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCheck, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface NotificationBatchActionsProps {
  selectedCount: number;
  onMarkRead: () => void;
  onDelete: () => void;
  onClearSelection: () => void;
  className?: string;
}

export function NotificationBatchActions({
  selectedCount,
  onMarkRead,
  onDelete,
  onClearSelection,
  className,
}: NotificationBatchActionsProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  if (selectedCount === 0) return null;

  return (
    <div className={cn(
      "sticky top-14 z-30 flex items-center justify-between gap-3 rounded-xl border bg-card/95 backdrop-blur-md px-4 py-2.5 shadow-lg",
      className
    )}>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs font-bold">
          <AnimatedCounter value={selectedCount} className="inline" />
        </Badge>
        <span className="text-sm font-medium">
          {isAr ? "محدد" : "selected"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onMarkRead} className="gap-1.5 text-xs">
          <CheckCheck className="h-3.5 w-3.5" />
          {isAr ? "قراءة" : "Read"}
        </Button>
        <Button variant="outline" size="sm" onClick={onDelete} className="gap-1.5 text-xs text-destructive hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
          {isAr ? "حذف" : "Delete"}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClearSelection}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
