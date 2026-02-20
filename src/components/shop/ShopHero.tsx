import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { ShoppingBag, ShoppingCart, Package } from "lucide-react";
import type { useCart } from "@/hooks/useCart";

interface ShopHeroProps {
  productCount: number;
  cart: ReturnType<typeof useCart>;
  onCartOpen: () => void;
}

export function ShopHero({ productCount, cart, onCartOpen }: ShopHeroProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";

  return (
    <section className="relative overflow-hidden border-b border-border/40">
      {/* Editorial gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-background to-primary/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.10),transparent_70%)]" />

      <div className="container relative py-10 md:py-14">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 ring-1 ring-primary/20">
              <ShoppingBag className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
                {isAr ? "المتجر" : "Culinary Shop"}
              </span>
            </div>
            <h1 className="font-serif text-4xl font-bold tracking-tight md:text-5xl">
              {isAr ? "المتجر" : "Shop"}
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed md:text-base">
              {isAr
                ? "مجموعة مختارة من أدوات الطهي الفاخرة والكتب والخدمات المهنية."
                : "A curated selection of premium culinary tools, books, and professional services."}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className="gap-1.5 border-primary/20 bg-primary/5 text-primary px-3 py-1.5">
              <Package className="h-3.5 w-3.5" />
              <span className="font-bold">{productCount}</span>
              <span className="text-[10px]">{isAr ? "منتج" : "products"}</span>
            </Badge>
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
              onClick={onCartOpen}
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
  );
}
