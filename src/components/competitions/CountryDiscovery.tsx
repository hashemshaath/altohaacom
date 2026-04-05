import { memo, useMemo, forwardRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Trophy, Users } from "lucide-react";
import { countryFlag } from "@/lib/countryFlag";
import type { CompetitionWithRegs } from "./CompetitionCard";

interface Props {
  competitions: CompetitionWithRegs[];
  isAr: boolean;
  onCountrySelect: (code: string) => void;
  allCountries: { code: string; name: string; name_ar?: string | null }[];
}

export const CountryDiscovery = memo(forwardRef<HTMLElement, Props>(function CountryDiscovery({ competitions, isAr, onCountrySelect, allCountries }, ref) {
  const countries = useMemo(() => {
    const map = new Map<string, { count: number; regs: number }>();
    for (const c of competitions) {
      if (!c.country_code) continue;
      const existing = map.get(c.country_code) || { count: 0, regs: 0 };
      existing.count++;
      existing.regs += c.competition_registrations?.length || 0;
      map.set(c.country_code, existing);
    }
    return Array.from(map.entries())
      .map(([code, data]) => {
        const country = allCountries.find(c => c.code === code);
        return {
          code,
          name: country ? (isAr ? country.name_ar || country.name : country.name) : code,
          ...data,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  }, [competitions, isAr, allCountries]);

  if (countries.length < 2) return null;

  return (
    <section ref={ref} className="space-y-3" aria-label={isAr ? "اكتشف حسب الدولة" : "Discover by Country"}>
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-chart-1/10 ring-1 ring-chart-1/20">
          <Globe className="h-3.5 w-3.5 text-chart-1" />
        </div>
        <h2 className="text-sm font-bold tracking-tight">
          {isAr ? "اكتشف حسب الدولة" : "Discover by Country"}
        </h2>
        <Badge variant="secondary" className="ms-auto text-[9px] font-bold rounded-lg">
          {countries.length} {isAr ? "دول" : "countries"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {countries.map((country) => (
          <button
            key={country.code}
            onClick={() => onCountrySelect(country.code)}
            className="text-start group"
          >
            <Card className="overflow-hidden rounded-xl border-border/20 transition-all duration-200 hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5 active:scale-[0.98]">
              <CardContent className="p-3 flex flex-col items-center text-center gap-1.5">
                <span className="text-2xl transition-transform group-hover:scale-110">
                  {countryFlag(country.code)}
                </span>
                <span className="text-[11px] font-bold truncate w-full">{country.name}</span>
                <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <Trophy className="h-2.5 w-2.5" />
                    {country.count}
                  </span>
                  {country.regs > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Users className="h-2.5 w-2.5" />
                      {country.regs}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </section>
  );
}));
