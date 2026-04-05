import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileJson, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { ImportedData } from "./SmartImportDialog";

interface ExportDataButtonProps {
  data: ImportedData;
  isAr: boolean;
}

export const ExportDataButton = React.memo(({ data, isAr }: ExportDataButtonProps) => {
  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(data.name_en || data.name_ar || "export").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: isAr ? "تم التصدير بنجاح" : "Exported successfully" });
  }, [data, isAr]);

  const exportCSV = useCallback(() => {
    const flatData: Record<string, string> = {};
    const flatten = (obj: any, prefix = "") => {
      for (const [key, value] of Object.entries(obj)) {
        const k = prefix ? `${prefix}_${key}` : key;
        if (value === null || value === undefined) continue;
        if (Array.isArray(value)) {
          flatData[k] = value.join("; ");
        } else if (typeof value === "object") {
          flatten(value, k);
        } else {
          flatData[k] = String(value);
        }
      }
    };
    flatten(data);

    const headers = Object.keys(flatData);
    const values = Object.values(flatData).map(v => `"${v.replace(/"/g, '""')}"`);
    const csv = `${headers.join(",")}\n${values.join(",")}`;

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(data.name_en || data.name_ar || "export").replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: isAr ? "تم التصدير بنجاح" : "Exported successfully" });
  }, [data, isAr]);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast({ title: isAr ? "تم النسخ" : "Copied to clipboard" });
  }, [data, isAr]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <Download className="h-3.5 w-3.5" />
          {isAr ? "تصدير" : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportJSON} className="gap-2">
          <FileJson className="h-4 w-4" /> JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportCSV} className="gap-2">
          <FileText className="h-4 w-4" /> CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyToClipboard} className="gap-2">
          <FileText className="h-4 w-4" /> {isAr ? "نسخ JSON" : "Copy JSON"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
ExportDataButton.displayName = "ExportDataButton";
