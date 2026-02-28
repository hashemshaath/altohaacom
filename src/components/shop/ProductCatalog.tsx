import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ShoppingCart, Star, Filter, Package, Grid3X3, List, Heart, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onAddToCart?: (product: any) => void;
}

export function ProductCatalog({ onAddToCart }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["shop-products", search, category, sortBy],
    queryFn: async () => {
      let query = supabase
        .from("shop_products")
        .select("*")
        .eq("is_active", true);

      if (search.length >= 2) {
        query = query.or(`name.ilike.%${search}%,name_ar.ilike.%${search}%`);
      }
      if (category !== "all") {
        query = query.eq("category", category);
      }

      switch (sortBy) {
        case "price_low": query = query.order("price", { ascending: true }); break;
        case "price_high": query = query.order("price", { ascending: false }); break;
        case "popular": query = query.order("sold_count", { ascending: false }); break;
        default: query = query.order("created_at", { ascending: false });
      }

      const { data } = await query.limit(50);
      return data || [];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["shop-categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("shop_products")
        .select("category")
        .eq("is_active", true)
        .not("category", "is", null);
      const unique = [...new Set((data || []).map(d => d.category).filter(Boolean))];
      return unique as string[];
    },
  });

  const toggleWishlist = (id: string) => {
    setWishlist(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isAr ? "ابحث عن منتج..." : "Search products..."}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="ps-9"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <Filter className="h-3.5 w-3.5 me-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "كل الفئات" : "All Categories"}</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{isAr ? "الأحدث" : "Newest"}</SelectItem>
                <SelectItem value="price_low">{isAr ? "السعر: الأقل" : "Price: Low"}</SelectItem>
                <SelectItem value="price_high">{isAr ? "السعر: الأعلى" : "Price: High"}</SelectItem>
                <SelectItem value="popular">{isAr ? "الأكثر مبيعاً" : "Best Selling"}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              <Button variant={view === "grid" ? "default" : "outline"} size="icon" onClick={() => setView("grid")}>
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button variant={view === "list" ? "default" : "outline"} size="icon" onClick={() => setView("list")}>
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {products.length} {isAr ? "منتج" : "products"}
        </p>
      </div>

      {/* Products */}
      {isLoading ? (
        <div className={cn("grid gap-4", view === "grid" ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1")}>
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">{isAr ? "لا توجد منتجات" : "No products found"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className={cn("grid gap-4", view === "grid" ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1")}>
          {products.map((p: any) => (
            <Card key={p.id} className={cn("group overflow-hidden transition-all hover:shadow-md", view === "list" && "flex flex-row")}>
              <div className={cn("relative overflow-hidden bg-muted", view === "grid" ? "aspect-square" : "w-32 shrink-0")}>
                {p.image_url ? (
                  <img src={p.image_url} alt={isAr ? p.name_ar || p.name : p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                )}
                {p.compare_at_price && p.compare_at_price > p.price && (
                  <Badge variant="destructive" className="absolute top-2 start-2 text-[10px]">
                    -{Math.round((1 - p.price / p.compare_at_price) * 100)}%
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 end-2 h-7 w-7 bg-background/80 backdrop-blur-sm"
                  onClick={() => toggleWishlist(p.id)}
                >
                  <Heart className={cn("h-3.5 w-3.5", wishlist.has(p.id) ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
                </Button>
              </div>
              <CardContent className={cn("p-3", view === "list" && "flex-1")}>
                <p className="text-sm font-medium line-clamp-2 mb-1">{isAr ? p.name_ar || p.name : p.name}</p>
                {p.category && <Badge variant="secondary" className="text-[10px] mb-2">{p.category}</Badge>}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold text-primary">{p.price?.toFixed(2)} {p.currency || "SAR"}</span>
                  {p.compare_at_price && p.compare_at_price > p.price && (
                    <span className="text-xs text-muted-foreground line-through">{p.compare_at_price.toFixed(2)}</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {p.average_rating > 0 && (
                      <>
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span>{p.average_rating?.toFixed(1)}</span>
                      </>
                    )}
                    {p.sold_count > 0 && (
                      <span className="ms-1">({p.sold_count} {isAr ? "مبيع" : "sold"})</span>
                    )}
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => onAddToCart?.(p)}>
                    <ShoppingCart className="h-3 w-3" />
                    {isAr ? "أضف" : "Add"}
                  </Button>
                </div>
                {p.stock_quantity !== null && p.stock_quantity <= 5 && p.stock_quantity > 0 && (
                  <p className="text-[10px] text-destructive mt-1">
                    {isAr ? `باقي ${p.stock_quantity} فقط` : `Only ${p.stock_quantity} left`}
                  </p>
                )}
                {p.stock_quantity === 0 && (
                  <Badge variant="outline" className="text-[10px] mt-1 text-destructive border-destructive/30">
                    {isAr ? "نفد المخزون" : "Out of stock"}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
