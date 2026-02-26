import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

interface CSVExportOptions<T> {
  /** Column definitions: header label and accessor */
  columns: { header: string; accessor: (row: T) => string | number | boolean | null | undefined }[];
  /** File name without extension */
  filename?: string;
  /** Include UTF-8 BOM for Excel Arabic support */
  bom?: boolean;
}

/**
 * Reusable CSV export hook. Handles BOM, escaping, download, and toast feedback.
 *
 * Usage:
 * ```ts
 * const { exportCSV } = useCSVExport({
 *   columns: [
 *     { header: "Name", accessor: (r) => r.name },
 *     { header: "Email", accessor: (r) => r.email },
 *   ],
 *   filename: "users",
 * });
 * // later: exportCSV(filteredData);
 * ```
 */
export function useCSVExport<T>({ columns, filename = "export", bom = true }: CSVExportOptions<T>) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const exportCSV = useCallback(
    (data: T[]) => {
      if (!data.length) {
        toast({
          title: isAr ? "لا توجد بيانات للتصدير" : "No data to export",
          variant: "destructive",
        });
        return;
      }

      const escape = (val: any): string => {
        const str = val == null ? "" : String(val);
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      };

      const header = columns.map((c) => escape(c.header)).join(",");
      const rows = data.map((row) =>
        columns.map((c) => escape(c.accessor(row))).join(",")
      );

      const csv = (bom ? "\uFEFF" : "") + [header, ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: isAr ? `✅ تم تصدير ${data.length} صف` : `✅ Exported ${data.length} rows`,
      });
    },
    [columns, filename, bom, toast, isAr]
  );

  return { exportCSV };
}
