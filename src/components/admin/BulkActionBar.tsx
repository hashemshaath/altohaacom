import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { X, Trash2, CheckCircle, Download } from "lucide-react";
import { cn } from "@/lib/utils";

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
        "sticky top-0 z-20 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-sm px-4 py-2.5 animate-in slide-in-from-top-2 duration-200 shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary tabular-nums">
          {count}
        </div>
        <span className="text-sm font-medium text-primary">
          {isAr ? "محدد" : "selected"}
        </span>
      </div>

      <div className="mx-2 h-4 w-px bg-primary/20" />

      <div className="flex items-center gap-1.5 flex-1 overflow-x-auto">
        {children}

        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport} className="gap-1.5 shrink-0">
            <Download className="h-3.5 w-3.5" />
            {isAr ? "تصدير" : "Export"}
          </Button>
        )}

        {onStatusChange && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatusChange("active")}
            className="gap-1.5 shrink-0"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            {isAr ? "تفعيل" : "Activate"}
          </Button>
        )}

        {onDelete && (
          <Button variant="destructive" size="sm" onClick={onDelete} className="gap-1.5 shrink-0">
            <Trash2 className="h-3.5 w-3.5" />
            {isAr ? "حذف" : "Delete"}
          </Button>
        )}
      </div>

      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClear}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
});
