import { useState, useMemo, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Map, ZoomIn, ZoomOut, RotateCcw, Building, Star, Hash, MapPin, X, Mail, Phone, ExternalLink, Search } from "lucide-react";

interface Booth {
  id: string;
  booth_number: string;
  name: string;
  name_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  category?: string | null;
  hall?: string | null;
  hall_ar?: string | null;
  floor_level?: string | null;
  size?: string | null;
  location_x?: number | null;
  location_y?: number | null;
  is_featured?: boolean | null;
  logo_url?: string | null;
  website_url?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  status?: string | null;
  color_hex?: string | null;
}

interface Props {
  exhibitionId: string;
  isAr: boolean;
}

const SIZE_DIMS: Record<string, { w: number; h: number }> = {
  small: { w: 40, h: 30 },
  medium: { w: 55, h: 40 },
  large: { w: 75, h: 55 },
  premium: { w: 90, h: 65 },
};

const CATEGORY_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  general: { fill: "hsl(var(--muted))", stroke: "hsl(var(--border))", text: "hsl(var(--muted-foreground))" },
  food: { fill: "hsl(var(--chart-1) / 0.15)", stroke: "hsl(var(--chart-1) / 0.5)", text: "hsl(var(--chart-1))" },
  equipment: { fill: "hsl(var(--chart-2) / 0.15)", stroke: "hsl(var(--chart-2) / 0.5)", text: "hsl(var(--chart-2))" },
  technology: { fill: "hsl(var(--chart-3) / 0.15)", stroke: "hsl(var(--chart-3) / 0.5)", text: "hsl(var(--chart-3))" },
  services: { fill: "hsl(var(--chart-4) / 0.15)", stroke: "hsl(var(--chart-4) / 0.5)", text: "hsl(var(--chart-4))" },
  ingredients: { fill: "hsl(var(--chart-5) / 0.15)", stroke: "hsl(var(--chart-5) / 0.5)", text: "hsl(var(--chart-5))" },
  packaging: { fill: "hsl(var(--primary) / 0.12)", stroke: "hsl(var(--primary) / 0.4)", text: "hsl(var(--primary))" },
};

function autoLayout(booths: Booth[]): Booth[] {
  // If booths have location data, use it; otherwise auto-grid
  const hasLocations = booths.some(b => b.location_x != null && b.location_y != null);
  if (hasLocations) return booths;

  const cols = Math.ceil(Math.sqrt(booths.length * 1.5));
  const spacing = 100;
  const margin = 60;

  return booths.map((b, i) => ({
    ...b,
    location_x: margin + (i % cols) * spacing,
    location_y: margin + Math.floor(i / cols) * spacing,
  }));
}

export function ExhibitionFloorMap({ exhibitionId, isAr }: Props) {
  const [zoom, setZoom] = useState(1);
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);
  const [selectedHall, setSelectedHall] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { data: booths = [] } = useQuery({
    queryKey: ["exhibition-booths-map", exhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibition_booths")
        .select("id, booth_number, name, name_ar, description, description_ar, category, hall, hall_ar, floor_level, size, location_x, location_y, is_featured, logo_url, website_url, contact_name, contact_email, contact_phone, status, color_hex")
        .eq("exhibition_id", exhibitionId)
        .order("booth_number");
      if (error) throw error;
      return (data || []) as Booth[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const halls = useMemo(() => [...new Set(booths.filter(b => b.hall).map(b => b.hall!))], [booths]);

  const filteredBooths = useMemo(() => {
    let list = selectedHall ? booths.filter(b => b.hall === selectedHall) : booths;
    if (statusFilter) list = list.filter(b => (b.status || "available") === statusFilter);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(b => b.name.toLowerCase().includes(q) || b.booth_number.toLowerCase().includes(q) || b.name_ar?.toLowerCase().includes(q));
    }
    return autoLayout(list);
  }, [booths, selectedHall, statusFilter, searchTerm]);

  const viewBox = useMemo(() => {
    if (filteredBooths.length === 0) return "0 0 800 500";
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    filteredBooths.forEach(b => {
      const x = b.location_x ?? 0;
      const y = b.location_y ?? 0;
      const dim = SIZE_DIMS[b.size || "medium"] || SIZE_DIMS.medium;
      minX = Math.min(minX, x - dim.w / 2);
      minY = Math.min(minY, y - dim.h / 2);
      maxX = Math.max(maxX, x + dim.w / 2);
      maxY = Math.max(maxY, y + dim.h / 2);
    });
    const pad = 40;
    return `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;
  }, [filteredBooths]);

  const handleZoom = useCallback((dir: "in" | "out" | "reset") => {
    setZoom(prev => dir === "in" ? Math.min(prev + 0.25, 3) : dir === "out" ? Math.max(prev - 0.25, 0.5) : 1);
  }, []);

  if (booths.length === 0) return null;

  return (
    <Card className="overflow-hidden border-border/60">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 bg-gradient-to-r from-chart-3/8 via-transparent to-transparent px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-chart-3/10">
            <Map className="h-3.5 w-3.5 text-chart-3" />
          </div>
          <h3 className="text-sm font-semibold">{isAr ? "خريطة الأجنحة" : "Floor Map"}</h3>
          <Badge variant="secondary" className="text-[9px] h-4 px-1.5">{filteredBooths.length}</Badge>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleZoom("out")}>
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="text-[10px] font-mono text-muted-foreground w-8 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleZoom("in")}>
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleZoom("reset")}>
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Search + Hall filter */}
      <div className="border-b border-border/30 px-4 py-2 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[140px] max-w-[220px]">
          <Search className="absolute start-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder={isAr ? "بحث..." : "Search..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-7 ps-7 text-[10px]"
          />
        </div>

        {halls.length > 1 && (
          <ScrollArea className="flex-1">
            <div className="flex gap-1.5">
              <Button variant={!selectedHall ? "default" : "ghost"} size="sm" className="rounded-full text-[10px] h-6 px-3 shrink-0" onClick={() => setSelectedHall(null)}>
                {isAr ? "كل القاعات" : "All Halls"}
              </Button>
              {halls.map(h => (
                <Button key={h} variant={selectedHall === h ? "default" : "ghost"} size="sm" className="rounded-full text-[10px] h-6 px-3 shrink-0" onClick={() => setSelectedHall(selectedHall === h ? null : h)}>
                  {h}
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}

        {/* Status filter */}
        <div className="flex gap-1">
          {["available", "reserved", "occupied"].map(s => (
            <Button key={s} variant={statusFilter === s ? "default" : "ghost"} size="sm" className="rounded-full text-[10px] h-6 px-2.5 shrink-0" onClick={() => setStatusFilter(statusFilter === s ? null : s)}>
              <div className={`h-2 w-2 rounded-full me-1 ${s === "available" ? "bg-chart-3" : s === "reserved" ? "bg-chart-4" : "bg-muted-foreground"}`} />
              {s === "available" ? (isAr ? "متاح" : "Available") : s === "reserved" ? (isAr ? "محجوز" : "Reserved") : (isAr ? "مشغول" : "Occupied")}
            </Button>
          ))}
        </div>
      </div>

      <CardContent className="p-0 relative">
        {/* SVG Map */}
        <div className="overflow-auto bg-gradient-to-br from-muted/20 to-background" style={{ maxHeight: 420 }}>
          <svg
            ref={svgRef}
            viewBox={viewBox}
            className="w-full"
            style={{ minHeight: 300, transform: `scale(${zoom})`, transformOrigin: "center center" }}
          >
            {/* Grid pattern */}
            <defs>
              <pattern id="floor-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="hsl(var(--border) / 0.15)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#floor-grid)" />

            {/* Aisles - simple center lines */}
            {filteredBooths.length > 4 && (
              <g opacity={0.1}>
                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="hsl(var(--foreground))" strokeWidth="2" strokeDasharray="8 4" />
                <line x1="50%" y1="0" x2="50%" y2="100%" stroke="hsl(var(--foreground))" strokeWidth="2" strokeDasharray="8 4" />
              </g>
            )}

            {/* Booths */}
            {filteredBooths.map(booth => {
              const x = booth.location_x ?? 0;
              const y = booth.location_y ?? 0;
              const dim = SIZE_DIMS[booth.size || "medium"] || SIZE_DIMS.medium;
              const colors = CATEGORY_COLORS[booth.category || "general"] || CATEGORY_COLORS.general;
              const isSelected = selectedBooth?.id === booth.id;
              const isHovered = hoveredId === booth.id;
              const status = booth.status || "available";
              const statusOpacity = status === "occupied" ? 0.6 : status === "reserved" ? 0.8 : 1;

              return (
                <g
                  key={booth.id}
                  className="cursor-pointer transition-transform"
                  onClick={() => setSelectedBooth(isSelected ? null : booth)}
                  onMouseEnter={() => setHoveredId(booth.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  opacity={statusOpacity}
                >
                  {/* Shadow */}
                  {(isSelected || isHovered) && (
                    <rect
                      x={x - dim.w / 2 - 2}
                      y={y - dim.h / 2 - 2}
                      width={dim.w + 4}
                      height={dim.h + 4}
                      rx={6}
                      fill="none"
                      stroke={isSelected ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.4)"}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      strokeDasharray={isSelected ? "none" : "4 2"}
                    />
                  )}

                  {/* Booth rect */}
                  <rect
                    x={x - dim.w / 2}
                    y={y - dim.h / 2}
                    width={dim.w}
                    height={dim.h}
                    rx={4}
                    fill={booth.color_hex ? `${booth.color_hex}20` : isSelected ? "hsl(var(--primary) / 0.15)" : colors.fill}
                    stroke={booth.color_hex || (isSelected ? "hsl(var(--primary))" : colors.stroke)}
                    strokeWidth={booth.is_featured ? 1.5 : 0.8}
                  />

                  {/* Featured star */}
                  {booth.is_featured && (
                    <circle cx={x + dim.w / 2 - 5} cy={y - dim.h / 2 + 5} r={4} fill="hsl(var(--chart-4))" />
                  )}

                  {/* Booth number */}
                  <text
                    x={x}
                    y={y - 3}
                    textAnchor="middle"
                    fontSize={8}
                    fontWeight={600}
                    fontFamily="system-ui"
                    fill={isSelected ? "hsl(var(--primary))" : colors.text}
                  >
                    {booth.booth_number}
                  </text>

                  {/* Booth name - truncated */}
                  <text
                    x={x}
                    y={y + 8}
                    textAnchor="middle"
                    fontSize={5.5}
                    fontFamily="system-ui"
                    fill="hsl(var(--muted-foreground))"
                  >
                    {(isAr && booth.name_ar ? booth.name_ar : booth.name).slice(0, 12)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected booth detail panel */}
        {selectedBooth && (
          <div className="absolute bottom-0 inset-x-0 bg-card/95 backdrop-blur-md border-t border-border/60 p-4 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-start gap-3">
              {selectedBooth.logo_url ? (
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-card p-1">
                  <img src={selectedBooth.logo_url} alt={selectedBooth.name} className="h-full w-full object-contain" />
                </div>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted shrink-0">
                  <Building className="h-5 w-5 text-muted-foreground/40" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge variant="outline" className="font-mono text-[9px] h-4 px-1.5">
                    <Hash className="me-0.5 h-2 w-2" />{selectedBooth.booth_number}
                  </Badge>
                  {selectedBooth.is_featured && (
                    <Badge variant="outline" className="text-[8px] h-4 px-1 border-chart-4/30 text-chart-4">
                      <Star className="h-2 w-2 fill-chart-4 me-0.5" />{isAr ? "مميز" : "Featured"}
                    </Badge>
                  )}
                  {selectedBooth.hall && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <MapPin className="h-2.5 w-2.5" />{selectedBooth.hall}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold truncate">
                  {isAr && selectedBooth.name_ar ? selectedBooth.name_ar : selectedBooth.name}
                </p>
                {(selectedBooth.description || selectedBooth.description_ar) && (
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                    {isAr && selectedBooth.description_ar ? selectedBooth.description_ar : selectedBooth.description}
                  </p>
                )}
                {(selectedBooth.contact_email || selectedBooth.contact_phone || selectedBooth.website_url) && (
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {selectedBooth.contact_email && (
                      <a href={`mailto:${selectedBooth.contact_email}`} className="text-[9px] text-primary flex items-center gap-0.5 hover:underline">
                        <Mail className="h-2.5 w-2.5" /> {isAr ? "بريد" : "Email"}
                      </a>
                    )}
                    {selectedBooth.contact_phone && (
                      <a href={`tel:${selectedBooth.contact_phone}`} className="text-[9px] text-primary flex items-center gap-0.5 hover:underline">
                        <Phone className="h-2.5 w-2.5" /> {isAr ? "اتصال" : "Call"}
                      </a>
                    )}
                    {selectedBooth.website_url && (
                      <a href={selectedBooth.website_url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-primary flex items-center gap-0.5 hover:underline">
                        <ExternalLink className="h-2.5 w-2.5" /> {isAr ? "موقع" : "Website"}
                      </a>
                    )}
                  </div>
                )}
              </div>

              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setSelectedBooth(null)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 border-t border-border/30">
          {Object.entries(CATEGORY_COLORS).slice(0, 5).map(([key, colors]) => (
            <div key={key} className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-sm" style={{ background: colors.stroke }} />
              <span className="text-[9px] text-muted-foreground capitalize">{key}</span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <div className="h-2.5 w-2.5 rounded-full bg-chart-4" />
            <span className="text-[9px] text-muted-foreground">{isAr ? "مميز" : "Featured"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
