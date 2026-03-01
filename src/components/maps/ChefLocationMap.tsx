import { useState, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Search, Navigation, ChefHat, Building2, Star, Filter, Globe, Users, ExternalLink } from "lucide-react";

interface LocationItem {
  id: string;
  name: string;
  nameAr: string | null;
  type: "chef" | "establishment";
  city: string | null;
  country: string | null;
  countryCode: string | null;
  avatarUrl: string | null;
  rating: number | null;
  specialties: string[];
  lat?: number;
  lng?: number;
}

const REGIONS = [
  { value: "all", labelEn: "All Regions", labelAr: "جميع المناطق" },
  { value: "SA", labelEn: "Saudi Arabia", labelAr: "السعودية" },
  { value: "AE", labelEn: "UAE", labelAr: "الإمارات" },
  { value: "KW", labelEn: "Kuwait", labelAr: "الكويت" },
  { value: "BH", labelEn: "Bahrain", labelAr: "البحرين" },
  { value: "QA", labelEn: "Qatar", labelAr: "قطر" },
  { value: "OM", labelEn: "Oman", labelAr: "عمان" },
  { value: "EG", labelEn: "Egypt", labelAr: "مصر" },
  { value: "JO", labelEn: "Jordan", labelAr: "الأردن" },
  { value: "LB", labelEn: "Lebanon", labelAr: "لبنان" },
];

export function ChefLocationMap() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [viewType, setViewType] = useState<"all" | "chefs" | "establishments">("all");
  const [selectedItem, setSelectedItem] = useState<LocationItem | null>(null);

  // Fetch chefs
  const { data: chefs = [] } = useQuery({
    queryKey: ["map-chefs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, full_name_ar, city, country, country_code, avatar_url, specialty, cuisine_types")
        .not("city", "is", null)
        .limit(200);
      return (data || []).map((p: any) => ({
        id: p.user_id,
        name: p.full_name || "Chef",
        nameAr: p.full_name_ar,
        type: "chef" as const,
        city: p.city,
        country: p.country,
        countryCode: p.country_code,
        avatarUrl: p.avatar_url,
        rating: null,
        specialties: p.cuisine_types || [],
      }));
    },
  });

  // Fetch establishments
  const { data: establishments = [] } = useQuery({
    queryKey: ["map-establishments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("establishments")
        .select("id, name, name_ar, city, country, country_code, logo_url, rating, establishment_type")
        .not("city", "is", null)
        .limit(200);
      return (data || []).map((e: any) => ({
        id: e.id,
        name: e.name,
        nameAr: e.name_ar,
        type: "establishment" as const,
        city: e.city,
        country: e.country,
        countryCode: e.country_code,
        avatarUrl: e.logo_url,
        rating: e.rating,
        specialties: e.establishment_type ? [e.establishment_type] : [],
      }));
    },
  });

  const allItems = useMemo(() => {
    let items = [...chefs, ...establishments];
    if (viewType === "chefs") items = items.filter(i => i.type === "chef");
    if (viewType === "establishments") items = items.filter(i => i.type === "establishment");
    if (selectedRegion !== "all") items = items.filter(i => i.countryCode === selectedRegion);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q) || i.nameAr?.includes(q) || i.city?.toLowerCase().includes(q));
    }
    return items;
  }, [chefs, establishments, viewType, selectedRegion, search]);

  // Group by country
  const groupedByCountry = useMemo(() => {
    const groups: Record<string, LocationItem[]> = {};
    allItems.forEach(item => {
      const key = item.country || (isAr ? "غير محدد" : "Unknown");
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [allItems, isAr]);

  // Stats
  const stats = useMemo(() => {
    const countries = new Set(allItems.map(i => i.countryCode).filter(Boolean));
    const cities = new Set(allItems.map(i => i.city).filter(Boolean));
    return { total: allItems.length, countries: countries.size, cities: cities.size, chefCount: allItems.filter(i => i.type === "chef").length, estCount: allItems.filter(i => i.type === "establishment").length };
  }, [allItems]);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: Users, value: stats.total, labelEn: "Total", labelAr: "الإجمالي" },
          { icon: ChefHat, value: stats.chefCount, labelEn: "Chefs", labelAr: "الطهاة" },
          { icon: Building2, value: stats.estCount, labelEn: "Establishments", labelAr: "المنشآت" },
          { icon: Globe, value: stats.countries, labelEn: "Countries", labelAr: "الدول" },
          { icon: MapPin, value: stats.cities, labelEn: "Cities", labelAr: "المدن" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-3 flex items-center gap-2">
              <stat.icon className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{isAr ? stat.labelAr : stat.labelEn}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={isAr ? "ابحث عن طاهٍ أو مطعم..." : "Search chefs or restaurants..."} value={search} onChange={e => setSearch(e.target.value)} className="ps-9" />
        </div>
        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {REGIONS.map(r => (
              <SelectItem key={r.value} value={r.value}>{isAr ? r.labelAr : r.labelEn}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          {(["all", "chefs", "establishments"] as const).map(v => (
            <Button key={v} variant={viewType === v ? "default" : "outline"} size="sm" onClick={() => setViewType(v)}>
              {v === "all" ? (isAr ? "الكل" : "All") : v === "chefs" ? (isAr ? "طهاة" : "Chefs") : (isAr ? "منشآت" : "Places")}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_350px]">
        {/* Map placeholder with styled visual */}
        <Card className="overflow-hidden">
          <div className="relative h-[500px] bg-gradient-to-br from-primary/5 via-muted to-primary/10 flex items-center justify-center">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
            
            {/* Location pins visualization */}
            <div className="relative w-full h-full p-8">
              {allItems.slice(0, 30).map((item, idx) => {
                const x = 10 + (idx * 37 % 80);
                const y = 10 + (idx * 53 % 80);
                return (
                  <button
                    key={item.id}
                    className={`absolute transition-all hover:scale-125 z-10 ${selectedItem?.id === item.id ? "scale-150 z-20" : ""}`}
                    style={{ left: `${x}%`, top: `${y}%` }}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className={`p-1 rounded-full ${item.type === "chef" ? "bg-primary" : "bg-orange-500"} shadow-lg`}>
                      {item.type === "chef" ? <ChefHat className="h-3 w-3 text-primary-foreground" /> : <Building2 className="h-3 w-3 text-primary-foreground" />}
                    </div>
                  </button>
                );
              })}
              
              {selectedItem && (
                <Card className="absolute bottom-4 start-4 end-4 z-30 shadow-xl">
                  <CardContent className="p-3 flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedItem.avatarUrl || ""} />
                      <AvatarFallback>{selectedItem.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{isAr ? (selectedItem.nameAr || selectedItem.name) : selectedItem.name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {selectedItem.city}, {selectedItem.country}
                      </div>
                    </div>
                    <Badge variant={selectedItem.type === "chef" ? "default" : "secondary"}>
                      {selectedItem.type === "chef" ? (isAr ? "طاهٍ" : "Chef") : (isAr ? "منشأة" : "Place")}
                    </Badge>
                  </CardContent>
                </Card>
              )}
            </div>

            {allItems.length === 0 && (
              <div className="text-center text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>{isAr ? "لا توجد نتائج" : "No results found"}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Directory list */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              {isAr ? "الدليل" : "Directory"} ({allItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[450px]">
              {Object.entries(groupedByCountry).map(([country, items]) => (
                <div key={country}>
                  <div className="sticky top-0 bg-muted/80 backdrop-blur px-3 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1 z-10">
                    <Globe className="h-3 w-3" />
                    {country} ({items.length})
                  </div>
                  {items.map(item => (
                    <button
                      key={item.id}
                      className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/50 transition-colors text-start ${selectedItem?.id === item.id ? "bg-primary/5" : ""}`}
                      onClick={() => setSelectedItem(item)}
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={item.avatarUrl || ""} />
                        <AvatarFallback className="text-xs">{item.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{isAr ? (item.nameAr || item.name) : item.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.city}</p>
                      </div>
                      {item.type === "chef" ? <ChefHat className="h-3.5 w-3.5 text-primary shrink-0" /> : <Building2 className="h-3.5 w-3.5 text-orange-500 shrink-0" />}
                      {item.rating && (
                        <div className="flex items-center gap-0.5 text-xs">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          {item.rating}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
