import { memo } from "react";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, AlertCircle } from "lucide-react";

interface Country {
  code: string;
  name: string;
  name_ar: string | null;
  code_alpha3: string | null;
  flag_emoji: string | null;
  continent: string | null;
  region: string | null;
  phone_code: string | null;
  phone_format: string | null;
  currency_code: string;
  currency_name: string | null;
  timezone: string;
  tax_rate: number | null;
  tax_name: string | null;
  support_email: string | null;
  support_phone: string | null;
  local_office_address: string | null;
  features: Record<string, boolean>;
  supported_languages: string[];
  [key: string]: unknown;
}

interface CheckItem {
  key: string;
  label: string;
  labelAr: string;
  check: (c: Country) => boolean;
}

const checks: CheckItem[] = [
  { key: "name_ar", label: "Arabic Name", labelAr: "الاسم العربي", check: c => !!c.name_ar },
  { key: "code_alpha3", label: "Alpha-3 Code", labelAr: "رمز ثلاثي", check: c => !!c.code_alpha3 },
  { key: "flag_emoji", label: "Flag Emoji", labelAr: "العلم", check: c => !!c.flag_emoji },
  { key: "continent", label: "Continent", labelAr: "القارة", check: c => !!c.continent },
  { key: "region", label: "Region", labelAr: "المنطقة", check: c => !!c.region },
  { key: "phone_code", label: "Phone Code", labelAr: "مفتاح الهاتف", check: c => !!c.phone_code },
  { key: "phone_format", label: "Phone Format", labelAr: "تنسيق الهاتف", check: c => !!c.phone_format },
  { key: "currency_name", label: "Currency Name", labelAr: "اسم العملة", check: c => !!c.currency_name },
  { key: "tax_config", label: "Tax Config", labelAr: "إعدادات الضريبة", check: c => c.tax_rate != null && c.tax_rate > 0 && !!c.tax_name },
  { key: "support_email", label: "Support Email", labelAr: "بريد الدعم", check: c => !!c.support_email },
  { key: "support_phone", label: "Support Phone", labelAr: "هاتف الدعم", check: c => !!c.support_phone },
  { key: "office", label: "Office Address", labelAr: "عنوان المكتب", check: c => !!c.local_office_address },
  { key: "languages", label: "Multiple Languages", labelAr: "لغات متعددة", check: c => (c.supported_languages || []).length > 1 },
  { key: "features", label: "Features Configured", labelAr: "ميزات مفعلة", check: c => Object.values(c.features || {}).some(Boolean) },
];

export function getCompletenessScore(country: Country) {
  const passed = checks.filter(ch => ch.check(country));
  return { score: Math.round((passed.length / checks.length) * 100), passed: passed.length, total: checks.length };
}

export function getCompleteness(country: Country) {
  return checks.map(ch => ({ ...ch, passed: ch.check(country) }));
}

export function CountryCompletenessScore({ country, isAr, compact = false }: { country: Country; isAr: boolean; compact?: boolean }) {
  const { score, passed, total } = getCompletenessScore(country);
  const items = getCompleteness(country);
  const color = score >= 80 ? "text-chart-3" : score >= 50 ? "text-chart-2" : "text-destructive";

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-bold ${color}`}>{score}%</span>
              <Progress value={score} className="w-12 h-1.5" />
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-xs font-medium mb-1.5">{isAr ? "اكتمال التكوين" : "Config Completeness"}: {passed}/{total}</p>
            <div className="grid grid-cols-2 gap-1">
              {items.map(it => (
                <div key={it.key} className="flex items-center gap-1 text-[11px]">
                  {it.passed ? <CheckCircle className="h-3 w-3 text-chart-3" /> : <AlertCircle className="h-3 w-3 text-muted-foreground" />}
                  {isAr ? it.labelAr : it.label}
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{isAr ? "اكتمال التكوين" : "Config Completeness"}</span>
        <span className={`text-sm font-bold ${color}`}>{score}%</span>
      </div>
      <Progress value={score} className="h-2" />
      <div className="grid grid-cols-2 gap-1.5">
        {items.map(it => (
          <div key={it.key} className={`flex items-center gap-1.5 text-xs ${it.passed ? "" : "text-muted-foreground"}`}>
            {it.passed ? <CheckCircle className="h-3 w-3 text-chart-3" /> : <AlertCircle className="h-3 w-3 text-destructive/50" />}
            {isAr ? it.labelAr : it.label}
          </div>
        ))}
      </div>
    </div>
  );
}
