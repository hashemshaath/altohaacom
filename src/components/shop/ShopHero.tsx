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

      <div className="container relative py-5 sm:py-10 md:py-14">
        <div className="flex items-center justify-between gap-3 md:items-end">
          <div className="min-w-0 space-y-1 sm:space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 ring-1 ring-primary/20">
              <ShoppingBag className="h-3 w-3 text-primary" />
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
                {isAr ? "المتجر" : "Culinary Shop"}
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight md:text-5xl">
              {isAr ? "المتجر" : "Shop"}
            </h1>
            <p className="hidden sm:block text-muted-foreground text-sm leading-relaxed md:text-base max-w-2xl">
              {isAr
                ? "مجموعة مختارة من أدوات الطهي الفاخرة والكتب والخدمات المهنية."
                : "A curated selection of premium culinary tools, books, and professional services."}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="gap-1 border-primary/20 bg-primary/5 text-primary px-2 py-1 hidden sm:flex">
              <Package className="h-3 w-3" />
              <span className="font-bold text-xs">{productCount}</span>
            </Badge>
            {user && (
              <Button variant="outline" size="sm" asChild className="hidden sm:flex">
                <Link to="/shop/my-products">
                  <Package className="me-1.5 h-4 w-4" />
                  {isAr ? "منتجاتي" : "My Products"}
                </Link>
              </Button>
            )}
            <Button
              size="sm"
              className="relative shadow-sm shadow-primary/15"
              onClick={onCartOpen}
            >
              <ShoppingCart className="h-4 w-4 sm:me-1.5" />
              <span className="hidden sm:inline">{isAr ? "السلة" : "Cart"}</span>
              {cart.totalItems > 0 && (
                <Badge className="absolute -end-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-chart-4 text-chart-4-foreground p-0 text-[9px] ring-2 ring-background">
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
