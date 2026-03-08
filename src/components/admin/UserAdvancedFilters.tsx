import { useState, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Filter, X, RotateCcw } from "lucide-react";

interface FilterValues {
  country: string;
  membershipTier: string;
  verificationStatus: string;
  dateFrom: string;
  dateTo: string;
  experienceLevel: string;
}

interface UserAdvancedFiltersProps {
  filters: FilterValues;
  onChange: (filters: FilterValues) => void;
  onReset: () => void;
}

const INITIAL_FILTERS: FilterValues = {
  country: "all",
  membershipTier: "all",
  verificationStatus: "all",
  dateFrom: "",
  dateTo: "",
  experienceLevel: "all",
};

export const UserAdvancedFilters = memo(function UserAdvancedFilters({ filters, onChange, onReset }: UserAdvancedFiltersProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [open, setOpen] = useState(false);

  const activeCount = Object.entries(filters).filter(([key, val]) => val !== "all" && val !== "").length;

  const update = (key: keyof FilterValues, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 relative">
          <Filter className="h-3.5 w-3.5" />
          {isAr ? "فلاتر متقدمة" : "Advanced Filters"}
          {activeCount > 0 && (
            <Badge variant="default" className="ms-1 h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center">
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">{isAr ? "فلاتر متقدمة" : "Advanced Filters"}</h4>
            <Button variant="ghost" size="sm" onClick={() => { onReset(); }} className="h-7 gap-1 text-xs">
              <RotateCcw className="h-3 w-3" />{isAr ? "مسح" : "Reset"}
            </Button>
          </div>
          <Separator />

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "الدولة" : "Country"}</Label>
              <Select value={filters.country} onValueChange={(v) => update("country", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                  <SelectItem value="SA">🇸🇦 Saudi Arabia</SelectItem>
                  <SelectItem value="AE">🇦🇪 UAE</SelectItem>
                  <SelectItem value="KW">🇰🇼 Kuwait</SelectItem>
                  <SelectItem value="QA">🇶🇦 Qatar</SelectItem>
                  <SelectItem value="BH">🇧🇭 Bahrain</SelectItem>
                  <SelectItem value="OM">🇴🇲 Oman</SelectItem>
                  <SelectItem value="EG">🇪🇬 Egypt</SelectItem>
                  <SelectItem value="JO">🇯🇴 Jordan</SelectItem>
                  <SelectItem value="LB">🇱🇧 Lebanon</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "العضوية" : "Membership"}</Label>
              <Select value={filters.membershipTier} onValueChange={(v) => update("membershipTier", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                  <SelectItem value="diamond">Diamond</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "التوثيق" : "Verification"}</Label>
              <Select value={filters.verificationStatus} onValueChange={(v) => update("verificationStatus", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                  <SelectItem value="verified">{isAr ? "موثق" : "Verified"}</SelectItem>
                  <SelectItem value="unverified">{isAr ? "غير موثق" : "Not Verified"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "مستوى الخبرة" : "Experience"}</Label>
              <Select value={filters.experienceLevel} onValueChange={(v) => update("experienceLevel", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                  <SelectItem value="beginner">{isAr ? "مبتدئ" : "Beginner"}</SelectItem>
                  <SelectItem value="intermediate">{isAr ? "متوسط" : "Intermediate"}</SelectItem>
                  <SelectItem value="advanced">{isAr ? "متقدم" : "Advanced"}</SelectItem>
                  <SelectItem value="expert">{isAr ? "خبير" : "Expert"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "من تاريخ" : "From"}</Label>
                <Input type="date" className="h-8 text-xs" value={filters.dateFrom} onChange={(e) => update("dateFrom", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "إلى تاريخ" : "To"}</Label>
                <Input type="date" className="h-8 text-xs" value={filters.dateTo} onChange={(e) => update("dateTo", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button size="sm" className="h-7 text-xs" onClick={() => setOpen(false)}>
              {isAr ? "تطبيق" : "Apply"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});

export { INITIAL_FILTERS };
export type { FilterValues };
