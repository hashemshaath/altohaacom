import { memo, useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X, CheckCircle2, MapPin, Landmark, Star } from "lucide-react";

interface Props {
  organizers: any[];
  search: string;
  onSearchChange: (val: string) => void;
  isAr: boolean;
}

export const OrganizerSearchAutocomplete = memo(function OrganizerSearchAutocomplete({ organizers, search, onSearchChange, isAr }: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = search.length >= 2
    ? organizers.filter((o: any) => {
        const q = search.toLowerCase();
        return (
          o.name?.toLowerCase().includes(q) ||
          o.name_ar?.toLowerCase().includes(q) ||
          o.city?.toLowerCase().includes(q) ||
          o.country?.toLowerCase().includes(q)
        );
      }).slice(0, 6)
    : [];

  const showDropdown = isFocused && suggestions.length > 0;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md">
      <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={isAr ? "ابحث عن منظم..." : "Search organizers..."}
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        className="ps-10 h-10 rounded-xl"
        role="combobox"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
      />
      {search && (
        <button onClick={() => onSearchChange("")} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {showDropdown && (
        <div className="absolute inset-x-0 top-full mt-1.5 z-50 rounded-xl border border-border/50 bg-popover shadow-xl overflow-hidden" role="listbox">
          {suggestions.map((org: any) => {
            const name = isAr && org.name_ar ? org.name_ar : org.name;
            return (
              <Link
                key={org.id}
                to={`/organizers/${org.slug}`}
                role="option"
                className="flex items-center gap-3 w-full px-3 py-2.5 text-start hover:bg-accent/50 transition-colors"
                onClick={() => setIsFocused(false)}
              >
                <Avatar className="h-9 w-9 rounded-xl border border-border/30 shrink-0">
                  {org.logo_url && <AvatarImage src={org.logo_url} />}
                  <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-[10px] font-bold">{org.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium truncate">{name}</span>
                    {org.is_verified && <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    {org.city && (
                      <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{org.city}</span>
                    )}
                    {org.total_exhibitions > 0 && (
                      <span className="flex items-center gap-0.5"><Landmark className="h-2.5 w-2.5" />{org.total_exhibitions}</span>
                    )}
                    {org.average_rating > 0 && (
                      <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 text-amber-500" />{org.average_rating.toFixed(1)}</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
          <div className="px-3 py-2 border-t border-border/30 text-[10px] text-muted-foreground text-center">
            {isAr ? `${suggestions.length} نتيجة — اضغط Enter لعرض الكل` : `${suggestions.length} results — press Enter for all`}
          </div>
        </div>
      )}
    </div>
  );
});
