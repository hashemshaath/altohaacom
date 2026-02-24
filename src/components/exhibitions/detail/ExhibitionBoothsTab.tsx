import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Building, MapPin, Globe, Phone, Mail, Search, LayoutGrid, Star } from "lucide-react";

interface Props {
  exhibitionId: string;
  isAr: boolean;
}

const CATEGORY_LABELS: Record<string, { en: string; ar: string }> = {
  general: { en: "General", ar: "عام" },
  food: { en: "Food & Beverage", ar: "أغذية ومشروبات" },
  equipment: { en: "Equipment", ar: "معدات" },
  technology: { en: "Technology", ar: "تكنولوجيا" },
  services: { en: "Services", ar: "خدمات" },
  ingredients: { en: "Ingredients", ar: "مكونات" },
  packaging: { en: "Packaging", ar: "تغليف" },
};

export function ExhibitionBoothsTab({ exhibitionId, isAr }: Props) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedHall, setSelectedHall] = useState<string | null>(null);

  const { data: booths = [], isLoading } = useQuery({
    queryKey: ["exhibition-booths", exhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibition_booths")
        .select("*")
        .eq("exhibition_id", exhibitionId)
        .order("booth_number", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const categories = useMemo(() => [...new Set(booths.map((b) => b.category || "general"))], [booths]);
  const halls = useMemo(() => [...new Set(booths.filter((b) => b.hall).map((b) => b.hall!))], [booths]);

  const filtered = useMemo(() => {
    let result = booths;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((b) =>
        b.name.toLowerCase().includes(q) ||
        b.name_ar?.toLowerCase().includes(q) ||
        b.booth_number.toLowerCase().includes(q) ||
        b.description?.toLowerCase().includes(q)
      );
    }
    if (selectedCategory) result = result.filter((b) => (b.category || "general") === selectedCategory);
    if (selectedHall) result = result.filter((b) => b.hall === selectedHall);
    return result;
  }, [booths, search, selectedCategory, selectedHall]);

  if (isLoading) {
    return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />)}</div>;
  }

  if (booths.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <LayoutGrid className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{isAr ? "لم يتم إضافة أجنحة بعد" : "No booths added yet"}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isAr ? "ابحث عن جناح..." : "Search booths..."}
          className="ps-10"
        />
      </div>

      {/* Filters */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          <Button
            variant={!selectedCategory ? "default" : "outline"}
            size="sm"
            className="text-xs shrink-0"
            onClick={() => setSelectedCategory(null)}
          >
            {isAr ? "الكل" : "All"} ({booths.length})
          </Button>
          {categories.map((cat) => {
            const label = CATEGORY_LABELS[cat] || { en: cat, ar: cat };
            const count = booths.filter((b) => (b.category || "general") === cat).length;
            return (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                className="text-xs shrink-0"
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              >
                {isAr ? label.ar : label.en} ({count})
              </Button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {halls.length > 1 && (
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            <Button
              variant={!selectedHall ? "secondary" : "ghost"}
              size="sm"
              className="text-xs shrink-0"
              onClick={() => setSelectedHall(null)}
            >
              {isAr ? "كل القاعات" : "All Halls"}
            </Button>
            {halls.map((hall) => (
              <Button
                key={hall}
                variant={selectedHall === hall ? "secondary" : "ghost"}
                size="sm"
                className="text-xs shrink-0"
                onClick={() => setSelectedHall(selectedHall === hall ? null : hall)}
              >
                {hall}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {/* Results */}
      <p className="text-xs text-muted-foreground">
        {filtered.length} {isAr ? "جناح" : "booths"}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((booth) => (
          <Card key={booth.id} className={`overflow-hidden transition-all hover:shadow-md ${booth.is_featured ? "border-chart-4/30 ring-1 ring-chart-4/10" : ""}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {booth.logo_url ? (
                  <img src={booth.logo_url} alt={booth.name} className="h-12 w-12 rounded-lg object-contain shrink-0 ring-1 ring-border" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted shrink-0">
                    <Building className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[9px] shrink-0">{booth.booth_number}</Badge>
                    {booth.is_featured && <Star className="h-3 w-3 text-chart-4 fill-chart-4" />}
                  </div>
                  <p className="mt-1 text-sm font-semibold truncate">
                    {isAr && booth.name_ar ? booth.name_ar : booth.name}
                  </p>
                  {(booth.description || booth.description_ar) && (
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {isAr && booth.description_ar ? booth.description_ar : booth.description}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {booth.hall && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {isAr && booth.hall_ar ? booth.hall_ar : booth.hall}
                      </span>
                    )}
                    {booth.website_url && (
                      <a href={booth.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-primary hover:underline">
                        <Globe className="h-3 w-3" />
                        {isAr ? "الموقع" : "Website"}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
