import { useState, useMemo, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Navigation, Search, Accessibility, ChevronRight, LayoutGrid, Coffee, DoorOpen, Info } from "lucide-react";

interface Props {
  exhibitionId: string;
  isAr: boolean;
}

const WAYPOINT_ICONS: Record<string, any> = {
  booth: LayoutGrid,
  entrance: DoorOpen,
  restroom: Info,
  food: Coffee,
  info: Info,
  exit: DoorOpen,
};

export const ExhibitionIndoorMap = memo(function ExhibitionIndoorMap({ exhibitionId, isAr }: Props) {
  const [search, setSearch] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("1");
  const [selectedWaypoint, setSelectedWaypoint] = useState<string | null>(null);
  const [routeFrom, setRouteFrom] = useState<string | null>(null);

  const { data: waypoints = [] } = useQuery({
    queryKey: ["map-waypoints", exhibitionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("exhibition_map_waypoints")
        .select("id, exhibition_id, name, name_ar, description, description_ar, waypoint_type, floor_number, x_position, y_position, sort_order, is_accessible")
        .eq("exhibition_id", exhibitionId)
        .order("sort_order");
      return data || [];
    },
  });

  const floors = useMemo(() => {
    const set = new Set(waypoints.map(w => w.floor_number || 1));
    return [...set].sort();
  }, [waypoints]);

  const floorWaypoints = useMemo(() => {
    return waypoints.filter(w =>
      (w.floor_number || 1) === Number(selectedFloor) &&
      (!search || (w.name?.toLowerCase().includes(search.toLowerCase()) || w.name_ar?.includes(search)))
    );
  }, [waypoints, selectedFloor, search]);

  const selectedWP = waypoints.find(w => w.id === selectedWaypoint);
  const routeFromWP = waypoints.find(w => w.id === routeFrom);

  const calculateRoute = (from: typeof routeFromWP, to: typeof selectedWP) => {
    if (!from || !to) return null;
    const dx = Number(to.x_position) - Number(from.x_position);
    const dy = Number(to.y_position) - Number(from.y_position);
    const distance = Math.sqrt(dx * dx + dy * dy);
    const walkingTime = Math.ceil(distance / 50); // ~50 units per minute
    return { distance: Math.round(distance), time: Math.max(1, walkingTime) };
  };

  const route = routeFrom && selectedWaypoint ? calculateRoute(routeFromWP, selectedWP) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Navigation className="h-5 w-5 text-primary" />
          {isAr ? "الخريطة والملاحة" : "Indoor Navigation"}
        </h3>
        {floors.length > 1 && (
          <Select value={selectedFloor} onValueChange={setSelectedFloor}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {floors.map(f => (
                <SelectItem key={f} value={String(f)}>
                  {isAr ? `الطابق ${f}` : `Floor ${f}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={isAr ? "ابحث عن جناح أو موقع..." : "Search booth or location..."}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="ps-9"
        />
      </div>

      {/* Visual Map */}
      <Card>
        <CardContent className="p-4">
          <div className="relative bg-muted/30 rounded-xl border border-border/50 overflow-hidden" style={{ height: 400 }}>
            {/* Grid background */}
            <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-foreground" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Route line */}
            {routeFromWP && selectedWP && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                <line
                  x1={`${Number(routeFromWP.x_position)}%`} y1={`${Number(routeFromWP.y_position)}%`}
                  x2={`${Number(selectedWP.x_position)}%`} y2={`${Number(selectedWP.y_position)}%`}
                  stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray="8 4"
                  className="animate-pulse"
                />
              </svg>
            )}

            {/* Waypoints */}
            {floorWaypoints.map(wp => {
              const Icon = WAYPOINT_ICONS[wp.waypoint_type] || MapPin;
              const isSelected = wp.id === selectedWaypoint;
              const isRoute = wp.id === routeFrom;

              return (
                <button
                  key={wp.id}
                  className={`absolute z-20 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ${
                    isSelected ? "scale-125" : isRoute ? "scale-110" : "hover:scale-110"
                  }`}
                  style={{ left: `${Number(wp.x_position)}%`, top: `${Number(wp.y_position)}%` }}
                  onClick={() => {
                    if (routeFrom && routeFrom !== wp.id) {
                      setSelectedWaypoint(wp.id);
                    } else {
                      setSelectedWaypoint(isSelected ? null : wp.id);
                    }
                  }}
                >
                  <div className={`flex flex-col items-center gap-0.5`}>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shadow-md border-2 ${
                      isSelected ? "bg-primary text-primary-foreground border-primary" :
                      isRoute ? "bg-chart-2 text-primary-foreground border-chart-2" :
                      "bg-card text-foreground border-border"
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className={`text-[9px] font-medium px-1 rounded whitespace-nowrap max-w-[60px] truncate ${
                      isSelected ? "text-primary" : "text-muted-foreground"
                    }`}>
                      {isAr ? wp.name_ar || wp.name : wp.name}
                    </span>
                  </div>
                </button>
              );
            })}

            {floorWaypoints.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                {isAr ? "لا توجد نقاط على هذا الطابق" : "No waypoints on this floor"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected waypoint info + route */}
      {selectedWP && (
        <Card className="border-primary/30">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">{isAr ? selectedWP.name_ar || selectedWP.name : selectedWP.name}</h4>
                <p className="text-xs text-muted-foreground capitalize">{selectedWP.waypoint_type}</p>
              </div>
              <div className="flex gap-1">
                {selectedWP.is_accessible && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Accessibility className="h-3 w-3" />{isAr ? "متاح" : "Accessible"}
                  </Badge>
                )}
              </div>
            </div>
            {(selectedWP.description || selectedWP.description_ar) && (
              <p className="text-sm text-muted-foreground">{isAr ? selectedWP.description_ar || selectedWP.description : selectedWP.description}</p>
            )}
            <div className="flex gap-2">
              <Button size="sm" variant={routeFrom ? "default" : "outline"} onClick={() => setRouteFrom(routeFrom ? null : selectedWP.id)}>
                <Navigation className="h-3.5 w-3.5 me-1" />
                {routeFrom ? (isAr ? "إلغاء المسار" : "Cancel Route") : (isAr ? "ابدأ من هنا" : "Start from here")}
              </Button>
            </div>
            {route && (
              <div className="flex items-center gap-3 p-2 rounded-xl bg-primary/5 border border-primary/20">
                <ChevronRight className="h-4 w-4 text-primary" />
                <span className="text-sm">
                  {isAr ? `المسافة: ~${route.distance} وحدة • الوقت: ~${route.time} دقيقة` : `Distance: ~${route.distance}u • Walk: ~${route.time} min`}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Waypoints List */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {floorWaypoints.map(wp => {
          const Icon = WAYPOINT_ICONS[wp.waypoint_type] || MapPin;
          return (
            <button
              key={wp.id}
              className={`p-2 rounded-xl border text-start transition-all text-xs ${
                selectedWaypoint === wp.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
              }`}
              onClick={() => setSelectedWaypoint(wp.id === selectedWaypoint ? null : wp.id)}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate font-medium">{isAr ? wp.name_ar || wp.name : wp.name}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});
