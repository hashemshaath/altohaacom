import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, ArrowLeftRight } from "lucide-react";
import { getCompletenessScore } from "./CountryCompletenessScore";

interface Country {
  id: string;
  code: string;
  name: string;
  name_ar: string | null;
  flag_emoji: string | null;
  continent: string | null;
  region: string | null;
  currency_code: string;
  currency_symbol: string;
  timezone: string;
  phone_code: string | null;
  tax_rate: number | null;
  tax_name: string | null;
  is_active: boolean;
  is_featured: boolean | null;
  support_email: string | null;
  support_phone: string | null;
  default_language: string;
  supported_languages: string[];
  features: Record<string, boolean>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

const featureKeys = ["competitions", "exhibitions", "shop", "masterclasses", "community", "company_portal", "judging", "certificates", "knowledge_portal"];

interface ComparisonRow {
  label: string;
  labelAr: string;
  getValue: (c: Country) => string | boolean;
  type?: "boolean";
}

const rows: ComparisonRow[] = [
  { label: "Status", labelAr: "الحالة", getValue: c => c.is_active, type: "boolean" },
  { label: "Region", labelAr: "المنطقة", getValue: c => `${c.continent || "—"} / ${c.region || "—"}` },
  { label: "Currency", labelAr: "العملة", getValue: c => `${c.currency_symbol} ${c.currency_code}` },
  { label: "Timezone", labelAr: "المنطقة الزمنية", getValue: c => c.timezone },
  { label: "Phone Code", labelAr: "مفتاح الهاتف", getValue: c => c.phone_code || "—" },
  { label: "Tax Rate", labelAr: "الضريبة", getValue: c => c.tax_rate ? `${c.tax_name || "Tax"} ${c.tax_rate}%` : "No Tax" },
  { label: "Default Language", labelAr: "اللغة الافتراضية", getValue: c => c.default_language.toUpperCase() },
  { label: "Languages", labelAr: "اللغات", getValue: c => (c.supported_languages || []).join(", ").toUpperCase() },
  { label: "Support Email", labelAr: "بريد الدعم", getValue: c => c.support_email || "—" },
  { label: "Support Phone", labelAr: "هاتف الدعم", getValue: c => c.support_phone || "—" },
  { label: "Completeness", labelAr: "الاكتمال", getValue: c => `${getCompletenessScore(c as any).score}%` },
  ...featureKeys.map(key => ({
    label: key.replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase()),
    labelAr: key,
    getValue: (c: Country) => (c.features || {})[key] ?? false,
    type: "boolean" as const,
  })),
];

export function CountryComparisonTool({ countries }: { countries: Country[] }) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const [selected, setSelected] = useState<string[]>(["", "", ""]);

  const updateSelection = (index: number, value: string) => {
    const next = [...selected];
    next[index] = value;
    setSelected(next);
  };

  const selectedCountries = selected.map(id => countries.find(c => c.id === id)).filter(Boolean) as Country[];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5 text-primary" />
          {isAr ? "مقارنة الدول" : "Country Comparison"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          {[0, 1, 2].map(i => (
            <Select key={i} value={selected[i]} onValueChange={v => updateSelection(i, v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={isAr ? `الدولة ${i + 1}` : `Country ${i + 1}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{isAr ? "— اختر —" : "— Select —"}</SelectItem>
                {countries.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.flag_emoji || "🏳️"} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>

        {selectedCountries.length >= 2 ? (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[140px]">{isAr ? "الحقل" : "Field"}</TableHead>
                  {selectedCountries.map(c => (
                    <TableHead key={c.id} className="min-w-[160px]">
                      <div className="flex items-center gap-1.5">
                        <span>{c.flag_emoji || "🏳️"}</span>
                        <span className="font-medium">{c.name}</span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(row => {
                  const values = selectedCountries.map(c => row.getValue(c));
                  const allSame = values.every(v => String(v) === String(values[0]));

                  return (
                    <TableRow key={row.label} className={allSame ? "" : "bg-chart-2/5"}>
                      <TableCell className="text-xs font-medium text-muted-foreground">
                        {isAr ? row.labelAr : row.label}
                      </TableCell>
                      {selectedCountries.map((c, i) => (
                        <TableCell key={c.id}>
                          {row.type === "boolean" ? (
                            values[i] ? <CheckCircle className="h-4 w-4 text-chart-3" /> : <XCircle className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <span className="text-sm">{String(values[i])}</span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            {isAr ? "اختر دولتين على الأقل للمقارنة" : "Select at least 2 countries to compare"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
