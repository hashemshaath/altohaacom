import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type DatePrecision = "year" | "month" | "day";

interface FlexibleDateInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  isAr?: boolean;
  disabled?: boolean;
  className?: string;
  /** If true, only shows precision selector (for events) */
  eventMode?: boolean;
}

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

function parseDateParts(value: string): { year: string; month: string; day: string; precision: DatePrecision } {
  if (!value) return { year: "", month: "", day: "", precision: "day" };
  const parts = value.split("-");
  if (parts.length === 1 && parts[0].length === 4) return { year: parts[0], month: "", day: "", precision: "year" };
  if (parts.length === 2) return { year: parts[0], month: parts[1], day: "", precision: "month" };
  return { year: parts[0], month: parts[1], day: parts[2], precision: "day" };
}

function buildDateString(year: string, month: string, day: string, precision: DatePrecision): string {
  if (!year) return "";
  if (precision === "year") return year;
  if (precision === "month") return month ? `${year}-${month}` : year;
  return day ? `${year}-${month || "01"}-${day}` : month ? `${year}-${month}` : year;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 60 }, (_, i) => String(currentYear - i));

export function FlexibleDateInput({ value, onChange, label, isAr, disabled, className, eventMode }: FlexibleDateInputProps) {
  const { year, month, day, precision } = parseDateParts(value);
  const [currentPrecision, setCurrentPrecision] = React.useState<DatePrecision>(precision);

  const handlePrecisionChange = (p: DatePrecision) => {
    setCurrentPrecision(p);
    onChange(buildDateString(year, month, day, p));
  };

  const handleYearChange = (y: string) => onChange(buildDateString(y, month, day, currentPrecision));
  const handleMonthChange = (m: string) => onChange(buildDateString(year, m, day, currentPrecision));
  const handleDayChange = (d: string) => onChange(buildDateString(year, month, d, currentPrecision));

  const months = isAr ? MONTHS_AR : MONTHS_EN;
  const daysInMonth = year && month ? new Date(Number(year), Number(month), 0).getDate() : 31;

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label className="text-xs font-medium">{label}</Label>}
      
      {/* Precision selector */}
      <div className="flex gap-1">
        {(["year", "month", "day"] as DatePrecision[]).map(p => (
          <button
            key={p}
            type="button"
            disabled={disabled}
            onClick={() => handlePrecisionChange(p)}
            className={cn(
              "px-2.5 py-1 text-[10px] font-medium rounded-md border transition-all",
              currentPrecision === p
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/60"
            )}
          >
            {p === "year" ? (isAr ? "سنة" : "Year") : p === "month" ? (isAr ? "شهر" : "Month") : (isAr ? "يوم" : "Day")}
          </button>
        ))}
      </div>

      {/* Date inputs based on precision */}
      <div className="flex gap-1.5">
        <Select value={year} onValueChange={handleYearChange} disabled={disabled}>
          <SelectTrigger className="h-8 text-xs flex-1">
            <SelectValue placeholder={isAr ? "السنة" : "Year"} />
          </SelectTrigger>
          <SelectContent className="max-h-48">
            {years.map(y => (
              <SelectItem key={y} value={y} className="text-xs">{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(currentPrecision === "month" || currentPrecision === "day") && (
          <Select value={month} onValueChange={handleMonthChange} disabled={disabled}>
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue placeholder={isAr ? "الشهر" : "Month"} />
            </SelectTrigger>
            <SelectContent>
              {months.map((m, i) => (
                <SelectItem key={i} value={String(i + 1).padStart(2, "0")} className="text-xs">{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {currentPrecision === "day" && (
          <Select value={day} onValueChange={handleDayChange} disabled={disabled}>
            <SelectTrigger className="h-8 text-xs w-20">
              <SelectValue placeholder={isAr ? "اليوم" : "Day"} />
            </SelectTrigger>
            <SelectContent className="max-h-48">
              {Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, "0")).map(d => (
                <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
