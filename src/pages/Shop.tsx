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

      {/* Hero Banner */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="absolute -top-32 start-1/4 h-64 w-64 rounded-full bg-primary/8 blur-[100px] animate-pulse pointer-events-none" />
        <div className="absolute -top-20 end-1/3 h-48 w-48 rounded-full bg-accent/10 blur-[80px] animate-pulse [animation-delay:1s] pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="container relative py-10 md:py-14">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15 shadow-sm">
                <ShoppingBag className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold md:text-3xl lg:text-4xl">
                  {isAr ? "المتجر الطهوي" : "Culinary Shop"}
                </h1>
                <p className="mt-1 max-w-xl text-sm text-muted-foreground sm:text-base">
                  {isAr
                    ? "أدوات طهي فاخرة وكتب ومنتجات وخدمات مهنية"
                    : "Premium culinary tools, books, products, and professional services"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {user && (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/shop/my-products">
                    {isAr ? "منتجاتي" : "My Products"}
                  </Link>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="relative"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingCart className="me-1.5 h-4 w-4" />
                {isAr ? "السلة" : "Cart"}
                {cart.totalItems > 0 && (
                  <Badge className="absolute -end-2 -top-2 h-5 min-w-5 px-1.5 text-[10px]">
                    {cart.totalItems}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <main className="container flex-1 py-8 md:py-12">
        {/* Page Header - removed, now in hero */}
        {/* Header moved to hero banner above */}

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={isAr ? "ابحث عن منتج..." : "Search products..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-10"
            />
          </div>
          {categories.length > 1 && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder={isAr ? "التصنيف" : "Category"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder={isAr ? "النوع" : "Type"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "الكل" : "All Types"}</SelectItem>
              <SelectItem value="physical">{isAr ? "منتج مادي" : "Physical"}</SelectItem>
              <SelectItem value="digital">{isAr ? "رقمي" : "Digital"}</SelectItem>
              <SelectItem value="service">{isAr ? "خدمة" : "Service"}</SelectItem>
            </SelectContent>
          </Select>
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
                <Card key={product.id} className="group h-full overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20">
                  <Link to={`/shop/${product.id}`} className="block">
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/5 to-muted">
                          <ShoppingBag className="h-10 w-10 text-muted-foreground/20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <div className="absolute start-2.5 top-2.5 flex flex-wrap gap-1.5">
                        {product.is_featured && (
                          <Badge className="bg-chart-4/90 text-chart-4-foreground text-[10px] gap-1">
                            <Star className="h-2.5 w-2.5" />
                            {isAr ? "مميز" : "Featured"}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          <TypeIcon className="h-2.5 w-2.5" />
                          {product.product_type === "physical" ? (isAr ? "مادي" : "Physical") :
                           product.product_type === "digital" ? (isAr ? "رقمي" : "Digital") :
                           (isAr ? "خدمة" : "Service")}
                        </Badge>
                      </div>
                      {isOutOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                          <Badge variant="destructive">{isAr ? "نفذت الكمية" : "Out of Stock"}</Badge>
                        </div>
                      )}
                    </div>
                  </Link>
                  <CardContent className="flex flex-1 flex-col p-4">
                    <Link to={`/shop/${product.id}`}>
                      <h3 className="mb-1 text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors duration-200">
                        {title}
                      </h3>
                    </Link>
                    <Badge variant="outline" className="mb-2 w-fit text-[10px]">{product.category}</Badge>
                    {product.discount_percent > 0 && (
                      <Badge variant="destructive" className="absolute end-2.5 top-2.5 text-[10px] gap-0.5">
                        <Percent className="h-2.5 w-2.5" />
                        {product.discount_percent}% {isAr ? "خصم" : "OFF"}
                      </Badge>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-border/50">
                      <div>
                        <span className="text-lg font-bold text-primary">
                          {product.currency} {product.price.toFixed(2)}
                        </span>
                        {product.compare_at_price && product.compare_at_price > product.price && (
                          <span className="ms-1.5 text-xs text-muted-foreground line-through">
                            {product.currency} {product.compare_at_price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        disabled={isOutOfStock}
                        onClick={(e) => { e.preventDefault(); handleAddToCart(product); }}
                        className="transition-transform duration-200 active:scale-95"
                      >
                        <ShoppingCart className="me-1 h-3.5 w-3.5" />
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
