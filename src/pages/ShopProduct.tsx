import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, ShoppingCart, ShoppingBag, Package, User, Minus, Plus } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { CartSheet } from "@/components/shop/CartSheet";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { toEnglishDigits } from "@/lib/formatNumber";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export default function ShopProduct() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const cart = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ["shop-product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_products")
        .select("id, title, title_ar, description, description_ar, price, compare_at_price, currency, image_url, gallery_urls, category, stock_quantity, sku, seller_id, product_type, is_active, is_featured, discount_percent, brand, brand_ar, tags, created_at")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: seller } = useQuery({
    queryKey: ["shop-seller", product?.seller_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, username")
        .eq("user_id", product!.seller_id)
        .single();
      return data;
    },
    enabled: !!product?.seller_id,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-6 md:py-8">
          <Skeleton className="mb-4 h-7 w-36" />
          <div className="grid gap-8 lg:grid-cols-2">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/60">
            <ShoppingBag className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="font-semibold">{isAr ? "المنتج غير موجود" : "Product not found"}</p>
          <Button asChild variant="outline" size="sm" className="mt-5">
            <Link to="/shop">
              <ArrowLeft className="me-1.5 h-4 w-4" />
              {isAr ? "العودة للمتجر" : "Back to Shop"}
            </Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const title = isAr && product.title_ar ? product.title_ar : product.title;
  const description = isAr && product.description_ar ? product.description_ar : product.description;
  const isOutOfStock = product.product_type === "physical" && (product.stock_quantity ?? 0) <= 0;
  const maxQty = product.product_type === "physical" ? (product.stock_quantity ?? 999) : 999;

  const handleAddToCart = () => {
    if (!user) {
      toast({ title: isAr ? "يرجى تسجيل الدخول أولاً" : "Please sign in first", variant: "destructive" });
      return;
    }
    cart.addItem({
      product_id: product.id,
      title: product.title,
      title_ar: product.title_ar,
      image_url: product.image_url,
      price: Number(product.price),
      currency: product.currency || "SAR",
      stock_quantity: product.stock_quantity ?? 999,
    }, qty);
    toast({ title: isAr ? `تمت إضافة "${title}" إلى السلة` : `"${title}" added to cart` });
    setCartOpen(true);
  };

  const allImages = product ? [product.image_url, ...(product.gallery_urls || [])].filter(Boolean) as string[] : [];

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead title={title} description={description || `${title} on Altoha Shop`} ogImage={product.image_url || undefined} />
      <Header />

      <main className="container flex-1 py-4 md:py-8 pb-24 sm:pb-8">
        <Button variant="ghost" size="sm" asChild className="mb-3 sm:mb-4 -ms-2 touch-manipulation">
          <Link to="/shop">
            <ArrowLeft className="me-1.5 h-4 w-4" />
            {isAr ? "المتجر" : "Shop"}
          </Link>
        </Button>

        <div className="grid gap-5 sm:gap-8 lg:grid-cols-2">
          {/* Images */}
          <div className="space-y-2.5 sm:space-y-3">
            <div className="aspect-square overflow-hidden rounded-xl sm:rounded-2xl bg-muted ring-1 ring-border/50">
              {allImages.length > 0 ? (
                <img
                  src={allImages[selectedImage]}
                  alt={title}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  fetchPriority="high"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ShoppingBag className="h-20 w-20 text-muted-foreground/20" />
                </div>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-lg sm:rounded-xl border-2 transition-all duration-200 touch-manipulation active:scale-95 ${
                      i === selectedImage ? "border-primary ring-2 ring-primary/20 scale-105" : "border-transparent hover:border-muted-foreground/30"
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-5">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">{product.category}</Badge>
                <Badge variant="secondary" className="text-xs">
                  {product.product_type === "physical" ? (isAr ? "منتج مادي" : "Physical") :
                   product.product_type === "digital" ? (isAr ? "رقمي" : "Digital") :
                   (isAr ? "خدمة" : "Service")}
                </Badge>
              </div>
              <h1 className="font-serif text-xl font-bold sm:text-2xl md:text-3xl">{title}</h1>
            </div>

            <p className="text-2xl sm:text-3xl font-bold text-primary">
              SAR <AnimatedCounter value={Math.round(Number(product.price))} className="inline" format />
            </p>

            {description && (
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{description}</p>
            )}

            {product.product_type === "physical" && (
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className={isOutOfStock ? "text-destructive" : "text-muted-foreground"}>
                  {isOutOfStock
                    ? (isAr ? "نفذت الكمية" : "Out of stock")
                    : `${product.stock_quantity} ${isAr ? "متاح" : "in stock"}`}
                </span>
              </div>
            )}

            {/* Quantity + Add to Cart */}
            <div className="flex items-center gap-2.5 sm:gap-3 pt-2">
              <div className="flex items-center rounded-xl border">
                <Button variant="ghost" size="icon" className="h-11 w-11 sm:h-10 sm:w-10 touch-manipulation" onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-10 text-center font-medium">{qty}</span>
                <Button variant="ghost" size="icon" className="h-11 w-11 sm:h-10 sm:w-10 touch-manipulation" onClick={() => setQty(Math.min(maxQty, qty + 1))} disabled={qty >= maxQty}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button className="flex-1 h-11 sm:h-10 transition-transform duration-200 active:scale-95 touch-manipulation rounded-xl" size="lg" disabled={isOutOfStock} onClick={handleAddToCart}>
                <ShoppingCart className="me-2 h-5 w-5" />
                {isAr ? "أضف إلى السلة" : "Add to Cart"}
              </Button>
            </div>

            {/* Seller Info */}
            {seller && (
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={seller.avatar_url || undefined} />
                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs text-muted-foreground">{isAr ? "البائع" : "Seller"}</p>
                    <p className="text-sm font-medium">{seller.full_name || seller.username}</p>
                  </div>
                  {seller.username && (
                    <Button variant="outline" size="sm" className="ms-auto" asChild>
                      <Link to={`/${seller.username}`}>{isAr ? "الملف الشخصي" : "Profile"}</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} cart={cart} />
    </div>
  );
}
