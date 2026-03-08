import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/i18n/LanguageContext";
import { Search, MapPin } from "lucide-react";
import { countryFlag } from "@/lib/countryFlag";

interface MasterclassFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  levelFilter: string;
  onLevelChange: (v: string) => void;
  categoryFilter: string;
  onCategoryChange: (v: string) => void;
  countryFilter: string;
  onCountryChange: (v: string) => void;
  categories: string[];
  countryCodes: string[];
  getCountryName: (code: string) => string;
}

export function MasterclassFilters({
  search, onSearchChange,
  levelFilter, onLevelChange,
  categoryFilter, onCategoryChange,
  countryFilter, onCountryChange,
  categories, countryCodes, getCountryName,
}: MasterclassFiltersProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="sticky top-12 z-30 -mx-4 mb-10 bg-background/80 px-4 py-4 backdrop-blur-md border-y border-border/40 md:rounded-2xl md:border md:mx-0 md:px-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder={isAr ? "ابحث عن دورة..." : "Search masterclasses..."}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-11 border-border/40 bg-muted/20 ps-11 transition-all focus:bg-background focus:ring-primary/20 rounded-xl"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={levelFilter} onValueChange={onLevelChange}>
            <SelectTrigger className="h-11 w-full sm:w-40 border-border/40 bg-muted/20 rounded-xl focus:ring-primary/20">
              <SelectValue placeholder={isAr ? "المستوى" : "Level"} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/40">
              <SelectItem value="all" className="rounded-xl">{isAr ? "جميع المستويات" : "All Levels"}</SelectItem>
              <SelectItem value="beginner" className="rounded-xl">{isAr ? "مبتدئ" : "Beginner"}</SelectItem>
              <SelectItem value="intermediate" className="rounded-xl">{isAr ? "متوسط" : "Intermediate"}</SelectItem>
              <SelectItem value="advanced" className="rounded-xl">{isAr ? "متقدم" : "Advanced"}</SelectItem>
            </SelectContent>
          </Select>
          {categories.length > 1 && (
            <Select value={categoryFilter} onValueChange={onCategoryChange}>
              <SelectTrigger className="h-11 w-full sm:w-40 border-border/40 bg-muted/20 rounded-xl focus:ring-primary/20">
                <SelectValue placeholder={isAr ? "التصنيف" : "Category"} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/40">
                <SelectItem value="all" className="rounded-xl">{isAr ? "الكل" : "All"}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="rounded-xl">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {countryCodes.length > 1 && (
            <Select value={countryFilter} onValueChange={onCountryChange}>
              <SelectTrigger className="h-11 w-full sm:w-44 border-border/40 bg-muted/20 rounded-xl focus:ring-primary/20">
                <MapPin className="me-1.5 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder={isAr ? "الدولة" : "Country"} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/40">
                <SelectItem value="all" className="rounded-xl">{isAr ? "جميع الدول" : "All Countries"}</SelectItem>
                {countryCodes.map((code) => (
                  <SelectItem key={code} value={code} className="rounded-xl">
                    {countryFlag(code)} {getCountryName(code)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </div>
  );
}
