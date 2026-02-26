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

export function BulkActionBar({
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
        "flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 animate-in slide-in-from-top-2 duration-200",
        className
      )}
    >
      <span className="text-sm font-medium text-primary">
        {isAr ? `${count} محدد` : `${count} selected`}
      </span>

      <div className="flex-1" />

      {children}

      {onExport && (
        <Button variant="outline" size="sm" onClick={onExport} className="gap-1.5">
          <Download className="h-3.5 w-3.5" />
          {isAr ? "تصدير" : "Export"}
        </Button>
      )}

      {onStatusChange && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onStatusChange("active")}
          className="gap-1.5"
        >
          <CheckCircle className="h-3.5 w-3.5" />
          {isAr ? "تفعيل" : "Activate"}
        </Button>
      )}

      {onDelete && (
        <Button variant="destructive" size="sm" onClick={onDelete} className="gap-1.5">
          <Trash2 className="h-3.5 w-3.5" />
          {isAr ? "حذف" : "Delete"}
        </Button>
      )}

      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClear}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
