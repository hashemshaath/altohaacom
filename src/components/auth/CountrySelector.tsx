import { useState, useMemo, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAllCountries, type Country } from "@/hooks/useCountries";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { countryFlag } from "@/lib/countryFlag";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountrySelectorProps {
  value: string;
  onChange: (code: string, country?: Country) => void;
  label?: string;
  required?: boolean;
  showFlag?: boolean;
}

export const CountrySelector = memo(function CountrySelector({ value, onChange, label, required, showFlag = true }: CountrySelectorProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: countries, isLoading } = useAllCountries();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!countries) return [];
    if (!search.trim()) return countries;
    const q = search.toLowerCase().trim();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.name_ar && c.name_ar.includes(q)) ||
        c.code.toLowerCase().includes(q)
    );
  }, [countries, search]);

  if (isLoading) return <Skeleton className="h-10 w-full" />;

  const displayLabel = label || (isAr ? "الدولة" : "Country");
  const selected = countries?.find((c) => c.code === value);
  const selectedLabel = selected
    ? `${showFlag ? countryFlag(selected.code) + " " : ""}${isAr ? selected.name_ar || selected.name : selected.name}`
    : "";

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {displayLabel} {required && <span className="text-destructive">*</span>}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className="truncate">
              {selectedLabel || (isAr ? "اختر الدولة" : "Select country")}
            </span>
            <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              placeholder={isAr ? "ابحث عن دولة..." : "Search countries..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 border-0 p-0 shadow-none focus-visible:ring-0"
              autoFocus
            />
          </div>
          <ScrollArea className="h-[240px]">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {isAr ? "لا توجد نتائج" : "No results found"}
              </p>
            ) : (
              <div className="p-1">
                {filtered.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      onChange(c.code, c);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer transition-colors",
                      value === c.code && "bg-accent"
                    )}
                  >
                    {showFlag && <span className="text-base leading-none">{countryFlag(c.code)}</span>}
                    <span className="flex-1 text-start truncate">
                      {isAr ? c.name_ar || c.name : c.name}
                    </span>
                    {value === c.code && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
