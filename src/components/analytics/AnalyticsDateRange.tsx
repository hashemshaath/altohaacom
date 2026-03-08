import { useState, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Download } from "lucide-react";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";

export type DateRange = { from: Date; to: Date };

const PRESETS = [
  { key: "7d", days: 7 },
  { key: "30d", days: 30 },
  { key: "90d", days: 90 },
  { key: "thisMonth", days: 0 },
  { key: "lastMonth", days: -1 },
] as const;

const presetLabels: Record<string, { en: string; ar: string }> = {
  "7d": { en: "7 Days", ar: "٧ أيام" },
  "30d": { en: "30 Days", ar: "٣٠ يوم" },
  "90d": { en: "90 Days", ar: "٩٠ يوم" },
  thisMonth: { en: "This Month", ar: "هذا الشهر" },
  lastMonth: { en: "Last Month", ar: "الشهر الماضي" },
};

function getPresetRange(key: string): DateRange {
  const now = new Date();
  switch (key) {
    case "7d": return { from: subDays(now, 7), to: now };
    case "30d": return { from: subDays(now, 30), to: now };
    case "90d": return { from: subDays(now, 90), to: now };
    case "thisMonth": return { from: startOfMonth(now), to: now };
    case "lastMonth": {
      const prev = subMonths(now, 1);
      return { from: startOfMonth(prev), to: endOfMonth(prev) };
    }
    default: return { from: subDays(now, 30), to: now };
  }
}

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
  onExport?: () => void;
}

export const AnalyticsDateRange = memo(function AnalyticsDateRange({ value, onChange, onExport }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [activePreset, setActivePreset] = useState("30d");

  const handlePreset = (key: string) => {
    setActivePreset(key);
    onChange(getPresetRange(key));
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1">
        {PRESETS.map(p => (
          <Button
            key={p.key}
            variant={activePreset === p.key ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs px-2.5"
            onClick={() => handlePreset(p.key)}
          >
            {isAr ? presetLabels[p.key].ar : presetLabels[p.key].en}
          </Button>
        ))}
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
            <CalendarIcon className="h-3 w-3" />
            {format(value.from, "MMM d")} – {format(value.to, "MMM d")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            selected={{ from: value.from, to: value.to }}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                setActivePreset("");
                onChange({ from: range.from, to: range.to });
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      {onExport && (
        <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={onExport}>
          <Download className="h-3 w-3" />
          {isAr ? "تصدير" : "Export"}
        </Button>
      )}
    </div>
  );
}

export { getPresetRange };
