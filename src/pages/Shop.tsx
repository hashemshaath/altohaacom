import { useState, useMemo, useCallback } from "react";
import { SEOHead } from "@/components/SEOHead";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/useCart";
import { CartSheet } from "@/components/shop/CartSheet";
import { ShopHero } from "@/components/shop/ShopHero";
import { ShopFilters, type SortOption } from "@/components/shop/ShopFilters";
import { ShopProductCard } from "@/components/shop/ShopProductCard";
import { ShopEmptyState } from "@/components/shop/ShopEmptyState";
import { toast } from "@/hooks/use-toast";

export default function Shop() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const cart = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["shop-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_products")
        .select("id, title, title_ar, description, description_ar, price, sale_price, currency, category, product_type, image_url, gallery_urls, is_featured, is_active, stock_quantity, seller_id, created_at")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const categories = [...new Set(products.map((p: any) => p.category))].sort();

  const filtered = (() => {
    let result = products.filter((p: any) => {
      const title = isAr && p.title_ar ? p.title_ar : p.title;
      const matchesSearch = !search || title.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
      const matchesType = typeFilter === "all" || p.product_type === typeFilter;
      return matchesSearch && matchesCategory && matchesType;
    });

    // Apply sorting
    if (sortBy === "price_asc") {
      result = [...result].sort((a: any, b: any) => a.price - b.price);
    } else if (sortBy === "price_desc") {
      result = [...result].sort((a: any, b: any) => b.price - a.price);
    } else if (sortBy === "name") {
      result = [...result].sort((a: any, b: any) => {
        const aName = isAr && a.title_ar ? a.title_ar : a.title;
        const bName = isAr && b.title_ar ? b.title_ar : b.title;
        return aName.localeCompare(bName);
      });
    } else if (sortBy === "popular") {
      result = [...result].sort((a: any, b: any) => (b.view_count || 0) - (a.view_count || 0));
    }
    // "newest" is default from query order

    return result;
  })();

  const handleAddToCart = (product: any) => {
    if (!user) {
      toast({ title: isAr ? "يرجى تسجيل الدخول أولاً" : "Please sign in first", variant: "destructive" });
      return;
    }
    const title = isAr && product.title_ar ? product.title_ar : product.title;
    cart.addItem({
      product_id: product.id,
      title: product.title,
      title_ar: product.title_ar,
      image_url: product.image_url,
      price: product.price,
      compare_at_price: product.compare_at_price,
      discount_percent: product.discount_percent || 0,
      currency: product.currency,
      stock_quantity: product.stock_quantity || 999,
      tax_rate: product.tax_rate || 0,
      tax_inclusive: product.tax_inclusive || false,
    });
    toast({ title: isAr ? `تمت إضافة "${title}" إلى السلة` : `"${title}" added to cart` });
  };

  return (
    <PageShell
      title="Culinary Shop"
      description="Browse culinary tools, books, ingredients, and professional services on Altoha."
      container={false}
      padding="none"
    >

      <ShopHero productCount={filtered.length} cart={cart} onCartOpen={() => setCartOpen(true)} />

      <main className="container flex-1 py-3 md:py-6">
        <ShopFilters
          search={search}
          onSearchChange={setSearch}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          categories={categories}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {isLoading ? (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden rounded-2xl">
                <Skeleton className="aspect-square w-full" />
                <CardContent className="space-y-2 p-2.5 sm:p-3">
                  <Skeleton className="h-4 w-3/4 rounded-lg" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                  <Skeleton className="h-9 w-full rounded-xl" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <ShopEmptyState search={search} onClearSearch={() => setSearch("")} />
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product: any) => (
              <ShopProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
            ))}
          </div>
        )}
      </main>

      <CartSheet open={cartOpen} onOpenChange={setCartOpen} cart={cart} />
    </PageShell>
  );
}
