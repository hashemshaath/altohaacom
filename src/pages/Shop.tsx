import { useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { Search, ShoppingBag, ShoppingCart, Star, Package, Laptop, Wrench, Percent } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { CartSheet } from "@/components/shop/CartSheet";
import { toast } from "@/hooks/use-toast";

const typeIcons: Record<string, typeof Package> = {
  physical: Package,
  digital: Laptop,
  service: Wrench,
};

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
        description="Browse culinary tools, books, ingredients, and professional services on Altohaa."
      />
      <Header />

      {/* Compact Hero */}
      <section className="border-b border-border/40 bg-gradient-to-b from-primary/5 to-background">
        <div className="container py-8 md:py-12 max-w-5xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 ring-1 ring-primary/20">
                <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  {isAr ? "المتجر" : "Culinary Shop"}
                </span>
              </div>
              <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">
                {isAr ? "المتجر" : "Shop"}
              </h1>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                {isAr
                  ? "مجموعة مختارة من أدوات الطهي الفاخرة والكتب والخدمات المهنية."
                  : "A curated selection of premium culinary tools, books, and professional services."}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {user && (
                <Button variant="outline" asChild>
                  <Link to="/shop/my-products">
                    <Package className="me-1.5 h-4 w-4" />
                    {isAr ? "منتجاتي" : "My Products"}
                  </Link>
                </Button>
              )}
              <Button
                className="relative shadow-sm shadow-primary/15"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingCart className="me-1.5 h-4 w-4" />
                {isAr ? "السلة" : "Cart"}
                {cart.totalItems > 0 && (
                  <Badge className="absolute -end-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-chart-4 text-chart-4-foreground p-0.5 text-[10px] ring-2 ring-background">
                    {cart.totalItems}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <main className="container flex-1 py-4 md:py-6 max-w-5xl">
        {/* Page Header - removed, now in hero */}
        {/* Header moved to hero banner above */}

        {/* Sticky Filters Bar */}
        <div className="sticky top-[64px] z-40 -mx-4 mb-10 border-y border-border/40 bg-background/80 px-4 py-4 backdrop-blur-md md:rounded-2xl md:border md:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row">
              <div className="relative flex-1 sm:max-w-md">
                <Search className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  placeholder={isAr ? "ابحث عن منتج، ماركة..." : "Search product, brand..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 border-border/40 bg-muted/20 ps-11 transition-all focus:bg-background focus:ring-primary/20 rounded-xl"
                />
              </div>
              
              <div className="flex gap-2">
                {categories.length > 0 && (
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-11 w-full border-border/40 bg-muted/20 rounded-xl sm:w-44 focus:ring-primary/20">
                      <SelectValue placeholder={isAr ? "التصنيف" : "Category"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/40">
                      <SelectItem value="all" className="rounded-lg">{isAr ? "جميع التصنيفات" : "All Categories"}</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="rounded-lg">{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-11 w-full border-border/40 bg-muted/20 rounded-xl sm:w-44 focus:ring-primary/20">
                    <SelectValue placeholder={isAr ? "النوع" : "Type"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/40">
                    <SelectItem value="all" className="rounded-lg">{isAr ? "جميع الأنواع" : "All Types"}</SelectItem>
                    <SelectItem value="physical" className="rounded-lg">{isAr ? "منتج مادي" : "Physical"}</SelectItem>
                    <SelectItem value="digital" className="rounded-lg">{isAr ? "رقمي" : "Digital"}</SelectItem>
                    <SelectItem value="service" className="rounded-lg">{isAr ? "خدمة" : "Service"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
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
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 rounded-2xl bg-muted/60 p-5">
              <ShoppingBag className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="mb-1 text-lg font-semibold">
              {isAr ? "لا توجد منتجات" : "No products found"}
            </h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              {search
                ? (isAr ? "جرّب كلمات بحث مختلفة" : "Try different search terms")
                : (isAr ? "لا توجد منتجات متاحة حالياً" : "No products available yet")}
            </p>
            {search && (
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setSearch("")}>
                {isAr ? "مسح البحث" : "Clear search"}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product: any) => {
              const title = isAr && product.title_ar ? product.title_ar : product.title;
              const TypeIcon = typeIcons[product.product_type] || Package;
              const isOutOfStock = product.product_type === "physical" && product.stock_quantity <= 0;

              return (
                <Card key={product.id} className="group flex h-full flex-col overflow-hidden border-border/40 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-primary/30">
                  <Link to={`/shop/${product.id}`} className="block overflow-hidden">
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/5 to-muted/20">
                          <ShoppingBag className="h-12 w-12 text-muted-foreground/20" />
                        </div>
                      )}
                      
                      {/* Overlays */}
                      <div className="absolute inset-0 bg-black/5 opacity-0 transition-opacity group-hover:opacity-100" />
                      
                      {/* Badges */}
                      <div className="absolute start-3 top-3 flex flex-wrap gap-2 z-10">
                        {product.is_featured && (
                          <Badge className="bg-chart-4 text-white shadow-lg shadow-chart-4/20 text-[10px] gap-1 px-2.5 py-1 font-bold">
                            <Star className="h-2.5 w-2.5 fill-current" />
                            {isAr ? "مميز" : "Featured"}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="bg-background/80 backdrop-blur-md text-[10px] gap-1 px-2.5 py-1 font-bold ring-1 ring-border/50">
                          <TypeIcon className="h-2.5 w-2.5" />
                          {product.product_type === "physical" ? (isAr ? "مادي" : "Physical") :
                           product.product_type === "digital" ? (isAr ? "رقمي" : "Digital") :
                           (isAr ? "خدمة" : "Service")}
                        </Badge>
                      </div>

                      {product.discount_percent > 0 && !isOutOfStock && (
                        <Badge className="absolute end-3 top-3 bg-destructive text-white shadow-lg shadow-destructive/20 text-[10px] px-2.5 py-1 font-bold">
                          <Percent className="me-1 h-2.5 w-2.5" />
                          {product.discount_percent}% {isAr ? "خصم" : "OFF"}
                        </Badge>
                      )}

                      {isOutOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-md z-20">
                          <Badge variant="destructive" className="px-4 py-1.5 font-bold uppercase tracking-widest">{isAr ? "نفذت الكمية" : "Out of Stock"}</Badge>
                        </div>
                      )}
                    </div>
                  </Link>

                  <CardContent className="flex flex-1 flex-col p-5">
                    <div className="flex-1 space-y-2">
                      <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-primary/20 bg-primary/5 text-primary/80">
                        {product.category}
                      </Badge>
                      <Link to={`/shop/${product.id}`} className="block">
                        <h3 className="text-base font-bold leading-tight group-hover:text-primary transition-colors duration-300 line-clamp-2">
                          {title}
                        </h3>
                      </Link>
                    </div>
                    
                    <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-4">
                      <div className="flex flex-col">
                        <span className="text-xl font-black tracking-tight text-primary">
                          SAR {product.price.toFixed(2)}
                        </span>
                        {product.compare_at_price && product.compare_at_price > product.price && (
                          <span className="text-xs text-muted-foreground line-through opacity-60">
                            SAR {product.compare_at_price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        disabled={isOutOfStock}
                        onClick={(e) => { e.preventDefault(); handleAddToCart(product); }}
                        className={`h-10 rounded-xl px-5 font-bold transition-all active:scale-95 ${isOutOfStock ? "opacity-50" : "shadow-lg shadow-primary/20 hover:shadow-primary/30"}`}
                      >
                        <ShoppingCart className="me-1.5 h-4 w-4" />
                        {isAr ? "أضف" : "Add"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} cart={cart} />
    </div>
  );
}
