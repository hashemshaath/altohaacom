import { useState, useMemo, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Search, LayoutGrid } from "lucide-react";

interface Props {
  exhibitionId: string;
  isAr: boolean;
}

export function ExhibitionBoothNavigator({ exhibitionId, isAr }: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;
  const [search, setSearch] = useState("");
  const [filterHall, setFilterHall] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const { data: booths = [] } = useQuery({
    queryKey: ["booth-navigator", exhibitionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("exhibition_booths")
        .select("id, booth_number, name, name_ar, category, hall, status, size_sqm, contact_name, description, description_ar")
        .eq("exhibition_id", exhibitionId)
        .order("booth_number");
      return data || [];
    },
  });

  const halls = useMemo(() => [...new Set(booths.map((b: any) => b.hall).filter(Boolean))], [booths]);
  const categories = useMemo(() => [...new Set(booths.map((b: any) => b.category).filter(Boolean))], [booths]);

  const filtered = useMemo(() => {
    return booths.filter((b: any) => {
      const matchSearch = !search ||
        b.booth_number?.toLowerCase().includes(search.toLowerCase()) ||
        b.name?.toLowerCase().includes(search.toLowerCase()) ||
        b.name_ar?.includes(search) ||
        b.contact_name?.toLowerCase().includes(search.toLowerCase());
      const matchHall = filterHall === "all" || b.hall === filterHall;
      const matchCategory = filterCategory === "all" || b.category === filterCategory;
      return matchSearch && matchHall && matchCategory;
    });
  }, [booths, search, filterHall, filterCategory]);

  const statusColor = (status: string) => {
    switch (status) {
      case "occupied": return "bg-chart-3/15 text-chart-3 border-chart-3/30";
      case "reserved": return "bg-chart-4/15 text-chart-4 border-chart-4/30";
      default: return "bg-primary/10 text-primary border-primary/30";
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("Search booths...", "بحث في الأجنحة...")}
            className="ps-9 h-9 text-xs"
          />
        </div>
        {halls.length > 1 && (
          <Select value={filterHall} onValueChange={setFilterHall}>
            <SelectTrigger className="h-9 w-[120px] text-xs"><SelectValue placeholder={t("Hall", "القاعة")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">{t("All Halls", "كل القاعات")}</SelectItem>
              {halls.map(h => <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {categories.length > 1 && (
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-9 w-[130px] text-xs"><SelectValue placeholder={t("Category", "الفئة")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">{t("All Categories", "كل الفئات")}</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-2 flex-wrap">
        <Badge variant="outline" className="text-[10px] gap-1">
          <LayoutGrid className="h-2.5 w-2.5" /> {filtered.length} {t("booths", "جناح")}
        </Badge>
        {halls.length > 0 && (
          <Badge variant="outline" className="text-[10px] gap-1">
            {halls.length} {t("halls", "قاعات")}
          </Badge>
        )}
      </div>

      {/* Booth grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {filtered.map((booth: any) => (
          <Card key={booth.id} className="border-border/40 transition-all hover:shadow-md hover:border-primary/20 group cursor-pointer">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-1 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <Badge variant="outline" className={`text-[8px] h-4 px-1.5 ${statusColor(booth.status)}`}>
                  {booth.status === "occupied" ? t("Occupied", "مشغول") : booth.status === "reserved" ? t("Reserved", "محجوز") : t("Available", "متاح")}
                </Badge>
              </div>
              <p className="text-xs font-bold text-foreground truncate">{booth.booth_number}</p>
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                {isAr ? (booth.name_ar || booth.name || "—") : (booth.name || "—")}
              </p>
              {booth.hall && (
                <p className="text-[9px] text-muted-foreground/70 mt-1">{t("Hall", "قاعة")}: {booth.hall}</p>
              )}
              {booth.category && (
                <Badge variant="secondary" className="text-[8px] mt-1.5 h-4">{booth.category}</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center">
          <MapPin className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">{t("No booths found", "لا توجد أجنحة")}</p>
        </div>
      )}
    </div>
  );
}
