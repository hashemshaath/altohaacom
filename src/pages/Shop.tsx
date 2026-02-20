import { useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/useCart";
import { CartSheet } from "@/components/shop/CartSheet";
import { ShopHero } from "@/components/shop/ShopHero";
import { ShopFilters } from "@/components/shop/ShopFilters";
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

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["shop-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_products")
        .select("*")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 2,
  });

  const categories = [...new Set(products.map((p: any) => p.category))].sort();

  const filtered = products.filter((p: any) => {
    const title = isAr && p.title_ar ? p.title_ar : p.title;
    const matchesSearch = !search || title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    const matchesType = typeFilter === "all" || p.product_type === typeFilter;
    return matchesSearch && matchesCategory && matchesType;
  });

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
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="Culinary Shop"
        description="Browse culinary tools, books, ingredients, and professional services on Altoha."
      />
      <Header />

      <ShopHero productCount={filtered.length} cart={cart} onCartOpen={() => setCartOpen(true)} />

      <main className="container flex-1 py-4 md:py-6">
        <ShopFilters
          search={search}
          onSearchChange={setSearch}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          categories={categories}
        />

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <CardContent className="space-y-2.5 p-4">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <ShopEmptyState search={search} onClearSearch={() => setSearch("")} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product: any) => (
              <ShopProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
            ))}
          </div>
        )}
      </main>

      <Footer />
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} cart={cart} />
    </div>
  );
}
