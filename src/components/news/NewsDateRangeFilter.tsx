import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarDays, X } from "lucide-react";

interface Props {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onClear: () => void;
  isAr: boolean;
}

export const NewsDateRangeFilter = memo(function NewsDateRangeFilter({
  dateFrom, dateTo, onDateFromChange, onDateToChange, onClear, isAr,
}: Props) {
  const hasValue = dateFrom || dateTo;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
      <Input
        type="date"
        value={dateFrom}
        onChange={(e) => onDateFromChange(e.target.value)}
        className="h-8 w-36 rounded-lg border-border/40 bg-muted/20 text-xs"
        aria-label={isAr ? "من تاريخ" : "From date"}
      />
      <span className="text-xs text-muted-foreground">—</span>
      <Input
        type="date"
        value={dateTo}
        onChange={(e) => onDateToChange(e.target.value)}
        className="h-8 w-36 rounded-lg border-border/40 bg-muted/20 text-xs"
        aria-label={isAr ? "إلى تاريخ" : "To date"}
      />
      {hasValue && (
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={onClear}>
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
});
