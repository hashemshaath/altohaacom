import { useIsAr } from "@/hooks/useIsAr";
import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ShoppingBag, ShoppingCart, Star, Package, Laptop, Wrench, Percent } from "lucide-react";

const typeIcons: Record<string, typeof Package> = {
  physical: Package,
  digital: Laptop,
  service: Wrench,
};

const typeLabels: Record<string, { en: string; ar: string }> = {
  physical: { en: "Physical", ar: "مادي" },
  digital: { en: "Digital", ar: "رقمي" },
  service: { en: "Service", ar: "خدمة" },
};

interface ShopProductCardProps {
  product: any;
  onAddToCart: (product) => void;
}

export const ShopProductCard = memo(function ShopProductCard({ product, onAddToCart }: ShopProductCardProps) {
  const isAr = useIsAr();
  const title = isAr && product.title_ar ? product.title_ar : product.title;
  const TypeIcon = typeIcons[product.product_type] || Package;
  const isOutOfStock = product.product_type === "physical" && product.stock_quantity <= 0;
  const label = typeLabels[product.product_type] || typeLabels.physical;

  return (
    <Card className="group flex h-full flex-col overflow-hidden rounded-2xl border-border/40 bg-card/50 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:shadow-primary/8 hover:-translate-y-0.5 hover:border-primary/30 active:scale-[0.98] touch-manipulation relative">
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
              <ShoppingBag className="h-12 w-12 text-muted-foreground/20 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3" />
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Top-start badges */}
          <div className="absolute start-3 top-3 flex flex-wrap gap-2 z-10">
            {product.is_featured && (
              <Badge className="bg-chart-4 text-primary-foreground shadow-lg shadow-chart-4/20 text-xs gap-1 px-2.5 py-1 font-bold">
                <Star className="h-2.5 w-2.5 fill-current" />
                {isAr ? "مميز" : "Featured"}
              </Badge>
            )}
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-md text-xs gap-1 px-2.5 py-1 font-bold ring-1 ring-border/50">
              <TypeIcon className="h-2.5 w-2.5" />
              {isAr ? label.ar : label.en}
            </Badge>
          </div>

          {/* Discount badge */}
          {product.discount_percent > 0 && !isOutOfStock && (
            <Badge className="absolute end-3 top-3 bg-destructive text-primary-foreground shadow-lg shadow-destructive/20 text-xs px-2.5 py-1 font-bold">
              <Percent className="me-1 h-2.5 w-2.5" />
              {product.discount_percent}% {isAr ? "خصم" : "OFF"}
            </Badge>
          )}

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-md z-20">
              <Badge variant="destructive" className="px-4 py-1.5 font-bold uppercase tracking-widest">
                {isAr ? "نفذت الكمية" : "Out of Stock"}
              </Badge>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="flex-1 space-y-1.5">
          <Badge variant="outline" className="text-xs sm:text-xs font-bold uppercase tracking-widest border-primary/20 bg-primary/5 text-primary/80">
            {product.category}
          </Badge>
          <Link to={`/shop/${product.id}`} className="block">
            <h3 className="text-sm sm:text-base font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {title}
            </h3>
          </Link>
          {product.rating_avg > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-chart-4 text-chart-4" />
              <span className="font-bold">{product.rating_avg.toFixed(1)}</span>
              {product.review_count > 0 && <span>({product.review_count})</span>}
              {product.rating_avg >= 4.5 && (
                <Badge variant="secondary" className="text-[7px] px-1 py-0 h-3 bg-chart-4/10 text-chart-4 border-0">
                  {isAr ? "مفضّل" : "Top Rated"}
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between 3order-t boborder-t border-border/31">
          <div className="flex flex-col min-w-0">
            <span className="text-base sm:text-lg font-black tracking-tight text-primary">
              SAR {product.price.toFixed(0)}
            </span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-xs text-muted-foreground line-through opacity-60">
                {product.compare_at_price.toFixed(0)}
              </span>
            )}
            {product.product_type === "physical" && !isOutOfStock && product.stock_quantity > 0 && product.stock_quantity <= 5 && (
              <span className="text-xs text-destructive font-bold mt-0.5">
                {isAr ? `باقي ${product.stock_quantity} فقط` : `Only ${product.stock_quantity} left`}
              </span>
            )}
          </div>
          <Button
            size="sm"
            disabled={isOutOfStock}
            onClick={(e) => { e.preventDefault(); onAddToCart(product); }}
            className={`h-8 sm:h-9 rounded-xl px-2.5 sm:px-4 text-xs font-bold transition-all active:scale-95 shrink-0 ${isOutOfStock ? "opacity-50" : "shadow-md shadow-primary/20"}`}
          >
            <ShoppingCart className="h-3.5 w-3.5 sm:me-1.5" />
            <span className="hidden sm:inline">{isAr ? "أضف" : "Add"}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
