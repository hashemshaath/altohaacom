import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
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
  onAddToCart: (product: any) => void;
}

export function ShopProductCard({ product, onAddToCart }: ShopProductCardProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const title = isAr && product.title_ar ? product.title_ar : product.title;
  const TypeIcon = typeIcons[product.product_type] || Package;
  const isOutOfStock = product.product_type === "physical" && product.stock_quantity <= 0;
  const label = typeLabels[product.product_type] || typeLabels.physical;

  return (
    <Card className="group flex h-full flex-col overflow-hidden border-border/40 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-primary/30">
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

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/5 opacity-0 transition-opacity group-hover:opacity-100" />

          {/* Top-start badges */}
          <div className="absolute start-3 top-3 flex flex-wrap gap-2 z-10">
            {product.is_featured && (
              <Badge className="bg-chart-4 text-white shadow-lg shadow-chart-4/20 text-[10px] gap-1 px-2.5 py-1 font-bold">
                <Star className="h-2.5 w-2.5 fill-current" />
                {isAr ? "مميز" : "Featured"}
              </Badge>
            )}
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-md text-[10px] gap-1 px-2.5 py-1 font-bold ring-1 ring-border/50">
              <TypeIcon className="h-2.5 w-2.5" />
              {isAr ? label.ar : label.en}
            </Badge>
          </div>

          {/* Discount badge */}
          {product.discount_percent > 0 && !isOutOfStock && (
            <Badge className="absolute end-3 top-3 bg-destructive text-white shadow-lg shadow-destructive/20 text-[10px] px-2.5 py-1 font-bold">
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
          <Badge variant="outline" className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest border-primary/20 bg-primary/5 text-primary/80">
            {product.category}
          </Badge>
          <Link to={`/shop/${product.id}`} className="block">
            <h3 className="text-sm sm:text-base font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {title}
            </h3>
          </Link>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-3 gap-1">
          <div className="flex flex-col min-w-0">
            <span className="text-base sm:text-lg font-black tracking-tight text-primary">
              SAR {product.price.toFixed(0)}
            </span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-[10px] text-muted-foreground line-through opacity-60">
                {product.compare_at_price.toFixed(0)}
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
}
