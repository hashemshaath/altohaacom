import { useCallback, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";

type ExportFormat = "csv" | "json";

interface ExportOptions {
  filename: string;
  format?: ExportFormat;
}

/**
 * Generic admin export hook for CSV/JSON data downloads.
 */
export function useAdminExport() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [isExporting, setIsExporting] = useState(false);

  const exportData = useCallback(
    <T extends Record<string, unknown>>(
      data: T[],
      columns: { key: keyof T; label: string }[],
      options: ExportOptions
    ) => {
      if (!data.length) {
        toast.error(isAr ? "لا توجد بيانات للتصدير" : "No data to export");
        return;
      }

      setIsExporting(true);
      const format = options.format || "csv";

      try {
        let blob: Blob;
        let ext: string;

        if (format === "csv") {
          const header = columns.map((c) => `"${c.label}"`).join(",");
          const rows = data.map((row) =>
            columns
              .map((c) => {
                const val = row[c.key];
                const str = val == null ? "" : String(val).replace(/"/g, '""');
                return `"${str}"`;
              })
              .join(",")
          );
          // BOM for Excel UTF-8 support
          const bom = "\uFEFF";
          blob = new Blob([bom + header + "\n" + rows.join("\n")], {
            type: "text/csv;charset=utf-8;",
          });
          ext = "csv";
        } else {
          const mapped = data.map((row) => {
            const obj: Record<string, unknown> = {};
            columns.forEach((c) => {
              obj[c.label] = row[c.key];
            });
            return obj;
          });
          blob = new Blob([JSON.stringify(mapped, null, 2)], {
            type: "application/json;charset=utf-8;",
          });
          ext = "json";
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${options.filename}-${new Date().toISOString().slice(0, 10)}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success(
          isAr
            ? `تم تصدير ${data.length} سجل بنجاح`
            : `Exported ${data.length} records successfully`
        );
      } catch (err) {
        console.error("Export error:", err);
        toast.error(isAr ? "فشل التصدير" : "Export failed");
      } finally {
        setIsExporting(false);
      }
    },
    [isAr]
  );

  return { exportData, isExporting };
}
