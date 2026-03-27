import { memo, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Globe, MapPin, ChevronDown, ChevronUp, Star, Landmark } from "lucide-react";

interface Props {
  organizers: any[];
  isAr: boolean;
  onPreview: (org: any) => void;
}

// Map country codes to flag emojis
function countryFlag(code: string): string {
  if (!code || code.length !== 2) return "🌍";
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map(c => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

export const OrganizerMapView = memo(function OrganizerMapView({ organizers, isAr, onPreview }: Props) {
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, { country: string; code: string; orgs: any[] }>();
    organizers.forEach(org => {
      const key = org.country || (isAr ? "أخرى" : "Other");
      if (!map.has(key)) {
        map.set(key, { country: key, code: org.country_code || "", orgs: [] });
      }
      map.get(key)!.orgs.push(org);
    });
    return [...map.values()].sort((a, b) => b.orgs.length - a.orgs.length);
  }, [organizers, isAr]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Globe className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">{isAr ? "حسب الدولة" : "By Country"}</h2>
        <Badge variant="secondary" className="text-[9px]">{grouped.length} {isAr ? "دولة" : "countries"}</Badge>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {grouped.map(group => {
          const isExpanded = expandedCountry === group.country;
          const flag = countryFlag(group.code);
          const totalEvents = group.orgs.reduce((s, o) => s + (o.total_exhibitions || 0), 0);

          return (
            <div key={group.country} className="rounded-2xl border border-border/40 bg-card overflow-hidden">
              <button
                className="flex items-center gap-3 w-full p-3.5 text-start hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedCountry(isExpanded ? null : group.country)}
              >
                <span className="text-2xl">{flag}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{group.country}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {group.orgs.length} {isAr ? "منظم" : "organizers"} · {totalEvents} {isAr ? "فعالية" : "events"}
                  </p>
                </div>

                {/* Stacked avatars */}
                <div className="flex -space-x-2 rtl:space-x-reverse shrink-0">
                  {group.orgs.slice(0, 3).map(org => (
                    <Avatar key={org.id} className="h-7 w-7 rounded-lg border-2 border-background">
                      {org.logo_url && <AvatarImage src={org.logo_url} />}
                      <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-[8px] font-bold">{org.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  ))}
                  {group.orgs.length > 3 && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-background bg-muted text-[9px] font-bold text-muted-foreground">
                      +{group.orgs.length - 3}
                    </div>
                  )}
                </div>

                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </button>

              {isExpanded && (
                <div className="border-t border-border/30 p-2 space-y-1">
                  {group.orgs.map(org => {
                    const name = isAr && org.name_ar ? org.name_ar : org.name;
                    return (
                      <button
                        key={org.id}
                        onClick={() => onPreview(org)}
                        className="flex items-center gap-2.5 w-full rounded-xl p-2 text-start hover:bg-muted/50 transition-colors group"
                      >
                        <Avatar className="h-9 w-9 rounded-xl border border-border/30">
                          {org.logo_url && <AvatarImage src={org.logo_url} />}
                          <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-[10px] font-bold">{org.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-medium truncate group-hover:text-primary transition-colors">{name}</span>
                            {org.is_verified && <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />}
                          </div>
                          {org.city && <p className="text-[10px] text-muted-foreground">{org.city}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-[10px] text-muted-foreground">
                          {org.total_exhibitions > 0 && (
                            <span className="flex items-center gap-0.5"><Landmark className="h-3 w-3" />{org.total_exhibitions}</span>
                          )}
                          {org.average_rating > 0 && (
                            <span className="flex items-center gap-0.5"><Star className="h-3 w-3 text-amber-500" />{org.average_rating.toFixed(1)}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
