import { useState, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, FileText, AlertTriangle, CheckCircle2, Download, X, Loader2 } from "lucide-react";
import { categories, CatalogFormData } from "./catalogTypes";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface CatalogBulkImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  language: string;
}

interface ParsedRow {
  rowNumber: number;
  data: CatalogFormData;
  errors: string[];
  isValid: boolean;
}

const VALID_CATEGORIES: string[] = categories.map(c => c.value);
const VALID_CURRENCIES = ["SAR", "USD", "EUR", "AED", "KWD"];

const CSV_HEADERS = [
  "name", "name_ar", "description", "description_ar", "category", "subcategory",
  "sku", "unit", "unit_price", "currency", "quantity_available", "in_stock", "is_active",
];

function generateTemplateCSV(): string {
  const header = CSV_HEADERS.join(",");
  const example = [
    "Premium Olive Oil", "زيت زيتون ممتاز", "Extra virgin olive oil", "زيت زيتون بكر ممتاز",
    "ingredients", "oils", "OLV-001", "bottle", "45.00", "SAR", "100", "true", "true",
  ].join(",");
  return `${header}\n${example}`;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function validateRow(values: string[], rowNumber: number): ParsedRow {
  const errors: string[] = [];
  const name = values[0] || "";
  const category = (values[4] || "").toLowerCase();

  if (!name) errors.push("Name is required");
  if (!category) {
    errors.push("Category is required");
  } else if (!VALID_CATEGORIES.includes(category)) {
    errors.push(`Invalid category "${category}". Use: ${VALID_CATEGORIES.join(", ")}`);
  }

  const unitPrice = values[8] ? parseFloat(values[8]) : 0;
  if (values[8] && isNaN(unitPrice)) errors.push("Unit price must be a number");

  const qty = values[10] ? parseInt(values[10]) : 0;
  if (values[10] && isNaN(qty)) errors.push("Quantity must be a number");

  const currency = (values[9] || "SAR").toUpperCase();
  if (!VALID_CURRENCIES.includes(currency)) {
    errors.push(`Invalid currency "${currency}". Use: ${VALID_CURRENCIES.join(", ")}`);
  }

  return {
    rowNumber,
    errors,
    isValid: errors.length === 0,
    data: {
      name,
      name_ar: values[1] || "",
      description: values[2] || "",
      description_ar: values[3] || "",
      category,
      subcategory: values[5] || "",
      sku: values[6] || "",
      unit: values[7] || "",
      unit_price: isNaN(unitPrice) ? 0 : unitPrice,
      currency,
      quantity_available: isNaN(qty) ? 0 : qty,
      in_stock: (values[11] || "true").toLowerCase() !== "false",
      is_active: (values[12] || "true").toLowerCase() !== "false",
      image_url: "",
    },
  };
}

export const CatalogBulkImport = memo(function CatalogBulkImport({ open, onOpenChange, companyId, language }: CatalogBulkImportProps) {
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const reset = useCallback(() => {
    setStep("upload");
    setParsedRows([]);
    setImporting(false);
    setImportResult({ success: 0, failed: 0 });
  }, []);

  const handleClose = (val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  };

  const downloadTemplate = () => {
    const csv = generateTemplateCSV();
    const bom = "\uFEFF";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "catalog_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) {
        toast({ title: language === "ar" ? "الملف فارغ" : "File is empty or has no data rows", variant: "destructive" });
        return;
      }
      // Skip header row
      const rows = lines.slice(1).map((line, i) => validateRow(parseCSVLine(line), i + 2));
      setParsedRows(rows);
      setStep("preview");
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  const validRows = parsedRows.filter(r => r.isValid);
  const invalidRows = parsedRows.filter(r => !r.isValid);

  const handleImport = async () => {
    if (!companyId || validRows.length === 0) return;
    setImporting(true);
    let success = 0;
    let failed = 0;

    // Batch insert valid rows
    const payload = validRows.map(r => ({
      company_id: companyId,
      name: r.data.name,
      name_ar: r.data.name_ar || null,
      description: r.data.description || null,
      description_ar: r.data.description_ar || null,
      category: r.data.category,
      subcategory: r.data.subcategory || null,
      sku: r.data.sku || null,
      unit: r.data.unit || null,
      unit_price: r.data.unit_price || null,
      currency: r.data.currency || "SAR",
      quantity_available: r.data.quantity_available || null,
      in_stock: r.data.in_stock,
      is_active: r.data.is_active,
      image_url: null,
    }));

    const { error } = await supabase.from("company_catalog").insert(payload);
    if (error) {
      failed = payload.length;
      toast({ title: language === "ar" ? "فشل الاستيراد" : "Import failed", description: error.message, variant: "destructive" });
    } else {
      success = payload.length;
      queryClient.invalidateQueries({ queryKey: ["companyCatalog"] });
    }

    setImportResult({ success, failed: failed + invalidRows.length });
    setImporting(false);
    setStep("result");
  };

  const isAr = language === "ar";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isAr ? "استيراد المنتجات" : "Bulk Import Products"}</DialogTitle>
          <DialogDescription>
            {isAr ? "استيراد منتجات من ملف CSV" : "Import products from a CSV file"}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-10">
              <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
              <p className="mb-2 font-medium">{isAr ? "ارفع ملف CSV" : "Upload a CSV file"}</p>
              <p className="mb-4 text-sm text-muted-foreground">
                {isAr ? "يجب أن يحتوي على الأعمدة المطلوبة" : "Must contain the required columns (name, category)"}
              </p>
              <label>
                <input type="file" accept=".csv" onChange={handleFile} className="hidden" />
                <Button asChild variant="default"><span><FileText className="me-2 h-4 w-4" />{isAr ? "اختر ملف" : "Choose File"}</span></Button>
              </label>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
              <div>
                <p className="font-medium text-sm">{isAr ? "تحميل القالب" : "Download Template"}</p>
                <p className="text-xs text-muted-foreground">{isAr ? "استخدم هذا القالب لتنسيق بياناتك" : "Use this template to format your data"}</p>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="me-2 h-4 w-4" />{isAr ? "تحميل" : "Download"}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">{isAr ? "الأعمدة:" : "Columns:"}</p>
              <p>{CSV_HEADERS.join(", ")}</p>
              <p className="mt-1">{isAr ? "الفئات المتاحة:" : "Valid categories:"} {VALID_CATEGORIES.join(", ")}</p>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="default" className="text-sm">
                <CheckCircle2 className="me-1 h-3 w-3" /> {validRows.length} {isAr ? "صالح" : "valid"}
              </Badge>
              {invalidRows.length > 0 && (
                <Badge variant="destructive" className="text-sm">
                  <AlertTriangle className="me-1 h-3 w-3" /> {invalidRows.length} {isAr ? "خطأ" : "errors"}
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">
                {isAr ? `من أصل ${parsedRows.length} صف` : `of ${parsedRows.length} rows`}
              </span>
            </div>

            {invalidRows.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="mt-1 space-y-1 text-xs">
                    {invalidRows.slice(0, 5).map(r => (
                      <li key={r.rowNumber}>
                        {isAr ? `صف ${r.rowNumber}:` : `Row ${r.rowNumber}:`} {r.errors.join("; ")}
                      </li>
                    ))}
                    {invalidRows.length > 5 && (
                      <li>...{isAr ? `و ${invalidRows.length - 5} أخطاء أخرى` : `and ${invalidRows.length - 5} more errors`}</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <ScrollArea className="h-[300px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>{isAr ? "الاسم" : "Name"}</TableHead>
                    <TableHead>{isAr ? "الفئة" : "Category"}</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>{isAr ? "السعر" : "Price"}</TableHead>
                    <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map((row) => (
                    <TableRow key={row.rowNumber} className={!row.isValid ? "bg-destructive/5" : ""}>
                      <TableCell className="text-xs font-mono">{row.rowNumber}</TableCell>
                      <TableCell className="font-medium text-sm">{row.data.name || "-"}</TableCell>
                      <TableCell className="text-sm">{row.data.category || "-"}</TableCell>
                      <TableCell className="text-xs font-mono">{row.data.sku || "-"}</TableCell>
                      <TableCell className="text-sm">{row.data.unit_price > 0 ? `${row.data.unit_price} ${row.data.currency}` : "-"}</TableCell>
                      <TableCell>
                        {row.isValid ? (
                          <CheckCircle2 className="h-4 w-4 text-chart-5" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={reset}>
                <X className="me-2 h-4 w-4" />{isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button onClick={handleImport} disabled={validRows.length === 0 || importing}>
                {importing ? (
                  <><Loader2 className="me-2 h-4 w-4 animate-spin" />{isAr ? "جارٍ الاستيراد..." : "Importing..."}</>
                ) : (
                  <><Upload className="me-2 h-4 w-4" />{isAr ? `استيراد ${validRows.length} منتج` : `Import ${validRows.length} products`}</>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "result" && (
          <div className="flex flex-col items-center py-8 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-chart-5" />
            <h3 className="text-lg font-semibold">{isAr ? "اكتمل الاستيراد" : "Import Complete"}</h3>
            <div className="flex gap-4">
              <Badge variant="default" className="text-sm px-3 py-1">
                {importResult.success} {isAr ? "تم استيراده" : "imported"}
              </Badge>
              {importResult.failed > 0 && (
                <Badge variant="destructive" className="text-sm px-3 py-1">
                  {importResult.failed} {isAr ? "فشل" : "failed"}
                </Badge>
              )}
            </div>
            <Button onClick={() => handleClose(false)} className="mt-4">
              {isAr ? "إغلاق" : "Close"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});
