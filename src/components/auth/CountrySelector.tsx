import { useLanguage } from "@/i18n/LanguageContext";
import { useAllCountries, type Country } from "@/hooks/useCountries";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { countryFlag } from "@/lib/countryFlag";

interface CountrySelectorProps {
  value: string;
  onChange: (code: string, country?: Country) => void;
  label?: string;
  required?: boolean;
  showFlag?: boolean;
}

export function CountrySelector({ value, onChange, label, required, showFlag = true }: CountrySelectorProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: countries, isLoading } = useAllCountries();

  if (isLoading) return <Skeleton className="h-10 w-full" />;

  const displayLabel = label || (isAr ? "الدولة" : "Country");

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {displayLabel} {required && "*"}
      </Label>
      <Select
        value={value}
        onValueChange={(code) => {
          const country = countries?.find((c) => c.code === code);
          onChange(code, country);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder={isAr ? "اختر الدولة" : "Select country"} />
        </SelectTrigger>
        <SelectContent>
          {(countries || []).map((c) => (
            <SelectItem key={c.code} value={c.code}>
              <span className="flex items-center gap-2">
                {showFlag && <span>{countryFlag(c.code)}</span>}
                <span>{isAr ? c.name_ar || c.name : c.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
