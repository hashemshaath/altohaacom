import { memo } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileJson } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface AdminExportButtonProps {
  onExport: (format: "csv" | "json") => void;
  isExporting?: boolean;
  disabled?: boolean;
}

export const AdminExportButton = memo(function AdminExportButton({ onExport, isExporting, disabled }: AdminExportButtonProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting || disabled} className="gap-1.5">
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{isAr ? "تصدير" : "Export"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onExport("csv")} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          {isAr ? "تصدير CSV" : "Export CSV"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport("json")} className="gap-2">
          <FileJson className="h-4 w-4" />
          {isAr ? "تصدير JSON" : "Export JSON"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
