import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown } from "lucide-react";
import { normalizePhoneInput } from "@/lib/arabicNumerals";
import { countryFlag } from "@/lib/countryFlag";
import { useAllCountries } from "@/hooks/useCountries";

interface PhoneInputWithFlagProps {
  phone: string;
  onPhoneChange: (v: string) => void;
  countryCode: string;
  phoneCode: string;
  onCountryChange: (code: string, phoneCode: string) => void;
  error?: string;
  label?: string;
  isAr: boolean;
}

export function PhoneInputWithFlag({
  phone,
  onPhoneChange,
  countryCode,
  phoneCode,
  onCountryChange,
  error,
  label,
  isAr,
}: PhoneInputWithFlagProps) {
  const { data: countries } = useAllCountries();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selectedCountry = useMemo(
    () => countries?.find((c) => c.code === countryCode),
    [countries, countryCode],
  );

  const flag = countryFlag(countryCode);
  const displayCode = phoneCode || selectedCountry?.phone_code || "";

  return (
    <div className="space-y-1.5">
      {label && (
        <Label className="text-xs">
          {label} *
        </Label>
      )}
      <div className="flex gap-2">
        {/* Country code button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex h-10 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent/50 transition-colors min-w-[100px]"
          >
            <span className="text-base">{flag}</span>
            <span className="font-mono text-muted-foreground" dir="ltr">
              {displayCode}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ms-auto" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute top-full mt-1 z-50 w-64 max-h-60 overflow-auto rounded-lg border bg-popover shadow-lg">
                {(countries || []).map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent/50 transition-colors"
                    onClick={() => {
                      onCountryChange(c.code, c.phone_code || "");
                      setDropdownOpen(false);
                    }}
                  >
                    <span className="text-base">{countryFlag(c.code)}</span>
                    <span className="flex-1 text-start truncate">
                      {isAr ? c.name_ar || c.name : c.name}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground" dir="ltr">
                      {c.phone_code}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Phone number input */}
        <Input
          type="tel"
          dir="ltr"
          placeholder="5XX XXX XXXX"
          value={phone}
          onChange={(e) => onPhoneChange(normalizePhoneInput(e.target.value))}
          className="flex-1"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
