import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Building, MapPin, Globe, Search, LayoutGrid, Star, Hash, ArrowUpRight } from "lucide-react";

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
    return (
      <div className="space-y-4">
        <div className="h-10 animate-pulse rounded-xl bg-muted" />
        <div className="grid gap-3 sm:grid-cols-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />)}</div>
      </div>
    );
  }

  if (booths.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60">
            <LayoutGrid className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">{isAr ? "لم يتم إضافة أجنحة بعد" : "No booths added yet"}</p>
          <p className="mt-1 text-xs text-muted-foreground/60">{isAr ? "سيتم تحديث القائمة قريباً" : "The list will be updated soon"}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Search with icon */}
      <div className="relative">
        <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isAr ? "ابحث عن جناح أو شركة..." : "Search booths or companies..."}
          className="ps-10 h-11 rounded-xl border-border/60 bg-muted/20 placeholder:text-muted-foreground/40"
        />
      </div>

      {/* Category filter pills */}
      <ScrollArea className="w-full">
        <div className="flex gap-1.5 pb-2">
          <Button
            variant={!selectedCategory ? "default" : "ghost"}
            size="sm"
            className="rounded-full text-xs shrink-0 h-8 px-4"
            onClick={() => setSelectedCategory(null)}
          >
            {isAr ? "الكل" : "All"}
            <Badge variant="secondary" className="ms-1.5 h-4 min-w-4 rounded-full px-1 text-[9px]">{booths.length}</Badge>
          </Button>
          {categories.map((cat) => {
            const label = CATEGORY_LABELS[cat] || { en: cat, ar: cat };
            const count = booths.filter((b) => (b.category || "general") === cat).length;
            return (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "ghost"}
                size="sm"
                className="rounded-full text-xs shrink-0 h-8 px-3"
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              >
                {isAr ? label.ar : label.en}
                <span className="ms-1 text-[9px] opacity-60">({count})</span>
              </Button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Hall filter */}
      {halls.length > 1 && (
        <ScrollArea className="w-full">
          <div className="flex gap-1.5 pb-2">
            <Button
              variant={!selectedHall ? "secondary" : "ghost"}
              size="sm"
              className="rounded-full text-xs shrink-0 h-7 px-3"
              onClick={() => setSelectedHall(null)}
            >
              <MapPin className="me-1 h-3 w-3" />
              {isAr ? "كل القاعات" : "All Halls"}
            </Button>
            {halls.map((hall) => (
              <Button
                key={hall}
                variant={selectedHall === hall ? "secondary" : "ghost"}
                size="sm"
                className="rounded-full text-xs shrink-0 h-7 px-3"
                onClick={() => setSelectedHall(selectedHall === hall ? null : hall)}
              >
                {hall}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {filtered.length} {isAr ? "جناح" : filtered.length === 1 ? "booth" : "booths"}
          {(search || selectedCategory || selectedHall) && ` ${isAr ? "من" : "of"} ${booths.length}`}
        </p>
      </div>

      {/* Booth grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((booth) => (
          <Card
            key={booth.id}
            className={`group overflow-hidden transition-all hover:shadow-md ${
              booth.is_featured
                ? "border-chart-4/30 bg-gradient-to-br from-chart-4/[0.03] to-transparent ring-1 ring-chart-4/10"
                : "border-border/60"
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3.5">
                {/* Logo / Placeholder */}
                {booth.logo_url ? (
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-card p-1.5">
                    <img src={booth.logo_url} alt={booth.name} className="h-full w-full object-contain" />
                  </div>
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-muted to-muted/50 shrink-0">
                    <Building className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  {/* Header with booth number + featured */}
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="font-mono text-[9px] shrink-0 rounded-md h-5 px-1.5 border-border/60">
                      <Hash className="me-0.5 h-2.5 w-2.5 text-muted-foreground/50" />
                      {booth.booth_number}
                    </Badge>
                    {booth.is_featured && (
                      <Badge variant="outline" className="text-[8px] h-4 px-1.5 border-chart-4/30 text-chart-4 gap-0.5">
                        <Star className="h-2 w-2 fill-chart-4" />
                        {isAr ? "مميز" : "Featured"}
                      </Badge>
                    )}
                  </div>

                  {/* Name */}
                  <p className="text-sm font-semibold truncate text-foreground">
                    {isAr && booth.name_ar ? booth.name_ar : booth.name}
                  </p>

                  {/* Description */}
                  {(booth.description || booth.description_ar) && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {isAr && booth.description_ar ? booth.description_ar : booth.description}
                    </p>
                  )}

                  {/* Meta */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {booth.hall && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <MapPin className="h-3 w-3 text-chart-2/60" />
                        {isAr && booth.hall_ar ? booth.hall_ar : booth.hall}
                      </span>
                    )}
                    {booth.website_url && (
                      <a
                        href={booth.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] text-primary font-medium hover:underline"
                      >
                        <Globe className="h-3 w-3" />
                        {isAr ? "الموقع" : "Website"}
                        <ArrowUpRight className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No results */}
      {filtered.length === 0 && booths.length > 0 && (
        <div className="py-12 text-center">
          <Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{isAr ? "لا نتائج مطابقة" : "No matching booths found"}</p>
          <Button variant="link" size="sm" className="mt-1 text-xs" onClick={() => { setSearch(""); setSelectedCategory(null); setSelectedHall(null); }}>
            {isAr ? "مسح الفلاتر" : "Clear filters"}
          </Button>
        </div>
      )}
    </div>
  );
}
