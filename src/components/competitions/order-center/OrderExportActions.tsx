import { memo } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, FileText, Table } from "lucide-react";
import { downloadCSV } from "@/lib/exportUtils";
import { useLanguage } from "@/i18n/LanguageContext";

interface ExportColumn {
  key: string;
  label: string;
}

interface Props {
  data: Record<string, any>[];
  filename: string;
  columns: ExportColumn[];
  label?: string;
}

export const OrderExportActions = memo(function OrderExportActions({ data, filename, columns, label }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  if (!data.length) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
          <Download className="h-3 w-3" />
          {label || (isAr ? "تصدير" : "Export")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => downloadCSV(data, filename, columns)}
          className="text-xs gap-2"
        >
          <Table className="h-3.5 w-3.5" />
          {isAr ? "تصدير CSV" : "Export CSV"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${filename}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="text-xs gap-2"
        >
          <FileText className="h-3.5 w-3.5" />
          {isAr ? "تصدير JSON" : "Export JSON"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
