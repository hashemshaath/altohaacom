import { useState, useRef, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";

interface ParsedRow {
  code: string;
  name: string;
  name_ar?: string;
  continent?: string;
  region?: string;
  currency_code?: string;
  currency_symbol?: string;
  phone_code?: string;
  timezone?: string;
  tax_rate?: number;
  tax_name?: string;
  is_active?: boolean;
  errors: string[];
}

const REQUIRED = ["code", "name"];
const OPTIONAL = ["name_ar", "continent", "region", "currency_code", "currency_symbol", "phone_code", "timezone", "tax_rate", "tax_name", "is_active", "flag_emoji", "code_alpha3", "default_language"];

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/['"]/g, "").replace(/\s+/g, "_"));

  return lines.slice(1).map(line => {
    const values = line.match(/("([^"]*)"|[^,]*)/g)?.map(v => v.replace(/^"|"$/g, "").trim()) || [];
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] || ""; });

    const errors: string[] = [];
    if (!row.code || row.code.length !== 2) errors.push("Invalid code (must be 2 letters)");
    if (!row.name) errors.push("Name is required");
    if (row.tax_rate && isNaN(Number(row.tax_rate))) errors.push("Invalid tax rate");

    return {
      code: (row.code || "").toUpperCase().slice(0, 2),
      name: row.name || "",
      name_ar: row.name_ar || undefined,
      continent: row.continent || undefined,
      region: row.region || undefined,
      currency_code: (row.currency_code || "USD").toUpperCase(),
      currency_symbol: row.currency_symbol || row.currency_code || "USD",
      phone_code: row.phone_code || undefined,
      timezone: row.timezone || "UTC",
      tax_rate: row.tax_rate ? Number(row.tax_rate) : undefined,
      tax_name: row.tax_name || undefined,
      is_active: row.is_active?.toLowerCase() === "true" || row.is_active === "1",
      errors,
    };
  });
}

export const CountryCSVImport = memo(function CountryCSVImport() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [parsed, setParsed] = useState<ParsedRow[] | null>(null);
  const [fileName, setFileName] = useState("");

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setParsed(parseCSV(text));
    };
    reader.readAsText(file);
  };

  const validRows = parsed?.filter(r => r.errors.length === 0) || [];
  const invalidRows = parsed?.filter(r => r.errors.length > 0) || [];

  const importMutation = useMutation({
    mutationFn: async () => {
      const payload = validRows.map(r => ({
        code: r.code,
        name: r.name,
        name_ar: r.name_ar || null,
        continent: r.continent || null,
        region: r.region || null,
        currency_code: r.currency_code || "USD",
        currency_symbol: r.currency_symbol || "USD",
        phone_code: r.phone_code || null,
        timezone: r.timezone || "UTC",
        tax_rate: r.tax_rate || null,
        tax_name: r.tax_name || null,
        is_active: r.is_active ?? false,
        default_language: "en",
        supported_languages: ["en"],
        features: {
          competitions: true, exhibitions: true, shop: true, masterclasses: true,
          community: true, company_portal: true, judging: true, certificates: true, knowledge_portal: true,
        },
      }));

      const { error } = await supabase.from("countries").upsert(payload, { onConflict: "code" });
      if (error) throw error;

      // Log audit
      await supabase.from("country_audit_log").insert(
        payload.map(p => ({
          country_code: p.code,
          action: "imported",
          summary: `Imported via CSV: ${fileName}`,
          summary_ar: `استيراد من CSV: ${fileName}`,
        }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-countries"] });
      toast({ title: isAr ? `تم استيراد ${validRows.length} دولة` : `Imported ${validRows.length} countries` });
      setParsed(null);
      setFileName("");
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Import Error", description: err.message }),
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          {isAr ? "استيراد من CSV" : "CSV Import"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!parsed ? (
          <div className="space-y-3">
            <div
              className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium">{isAr ? "اسحب ملف CSV هنا أو اضغط للتحميل" : "Drop a CSV file here or click to upload"}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {isAr ? "الأعمدة المطلوبة: code, name" : "Required columns: code, name"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {isAr ? "اختياري:" : "Optional:"} {OPTIONAL.join(", ")}
              </p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{fileName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-chart-3">
                  <CheckCircle className="h-3 w-3 me-1" />
                  {validRows.length} {isAr ? "صالح" : "valid"}
                </Badge>
                {invalidRows.length > 0 && (
                  <Badge variant="secondary" className="text-destructive">
                    <XCircle className="h-3 w-3 me-1" />
                    {invalidRows.length} {isAr ? "خطأ" : "errors"}
                  </Badge>
                )}
              </div>
            </div>

            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30px]">#</TableHead>
                    <TableHead>{isAr ? "الرمز" : "Code"}</TableHead>
                    <TableHead>{isAr ? "الاسم" : "Name"}</TableHead>
                    <TableHead>{isAr ? "المنطقة" : "Region"}</TableHead>
                    <TableHead>{isAr ? "العملة" : "Currency"}</TableHead>
                    <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsed.map((row, i) => (
                    <TableRow key={i} className={row.errors.length > 0 ? "bg-destructive/5" : ""}>
                      <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{row.code}</TableCell>
                      <TableCell className="text-sm">{row.name}</TableCell>
                      <TableCell className="text-xs">{row.region || "—"}</TableCell>
                      <TableCell className="text-xs">{row.currency_code || "—"}</TableCell>
                      <TableCell>
                        {row.errors.length > 0 ? (
                          <div className="flex items-center gap-1 text-destructive">
                            <AlertTriangle className="h-3 w-3" />
                            <span className="text-[10px]">{row.errors[0]}</span>
                          </div>
                        ) : (
                          <CheckCircle className="h-4 w-4 text-chart-3" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => { setParsed(null); setFileName(""); }}>
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                size="sm"
                disabled={validRows.length === 0 || importMutation.isPending}
                onClick={() => importMutation.mutate()}
              >
                {importMutation.isPending ? (
                  <Loader2 className="h-4 w-4 me-1.5 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 me-1.5" />
                )}
                {isAr ? `استيراد ${validRows.length} دولة` : `Import ${validRows.length} Countries`}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
