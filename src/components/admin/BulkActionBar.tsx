import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { X, Trash2, CheckCircle, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface BulkActionBarProps {
  count: number;
  onClear: () => void;
  onDelete?: () => void;
  onStatusChange?: (status: string) => void;
  onExport?: () => void;
  /** Additional custom actions */
  children?: React.ReactNode;
  className?: string;
}

export const BulkActionBar = memo(function BulkActionBar({
  count,
  onClear,
  onDelete,
  onStatusChange,
  onExport,
  children,
  className,
}: BulkActionBarProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  if (count === 0) return null;

  return (
    <div
      className={cn(
        "sticky top-14 z-20 flex items-center gap-2.5 rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-xl px-4 py-2.5",
        "animate-in slide-in-from-top-2 fade-in-50 duration-300 shadow-lg shadow-primary/5",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary text-primary-foreground text-[12px] font-bold tabular-nums shadow-sm">
          <AnimatedCounter value={count} className="inline" />
        </div>
        <span className="text-sm font-semibold text-primary">
          {isAr ? "محدد" : "selected"}
        </span>
      </div>

      <div className="mx-1.5 h-5 w-px bg-primary/20" />

      <div className="flex items-center gap-1.5 flex-1 overflow-x-auto scrollbar-hide">
        {children}

        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport} className="gap-1.5 shrink-0 rounded-xl active:scale-95 transition-all">
            <Download className="h-3.5 w-3.5" />
            {isAr ? "تصدير" : "Export"}
          </Button>
        )}

        {onStatusChange && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatusChange("active")}
            className="gap-1.5 shrink-0 rounded-xl active:scale-95 transition-all"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            {isAr ? "تفعيل" : "Activate"}
          </Button>
        )}

        {onDelete && (
          <Button variant="destructive" size="sm" onClick={onDelete} className="gap-1.5 shrink-0 rounded-xl active:scale-95 transition-all">
            <Trash2 className="h-3.5 w-3.5" />
            {isAr ? "حذف" : "Delete"}
          </Button>
        )}
      </div>

      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 rounded-xl hover:bg-primary/10 active:scale-90 transition-all" onClick={onClear}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
});
