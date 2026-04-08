import { memo, forwardRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { ShoppingCart, Package, Eye, CheckCircle, XCircle, Star, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface SupplierProductCardProps {
  product: any;
  onViewDetails: (product: any) => void;
  onAddToCart?: (product: any) => void;
  compact?: boolean;
}

const VAT_RATE = 0.15;

export const SupplierProductCard = memo(forwardRef<HTMLDivElement, SupplierProductCardProps>(function SupplierProductCard({
  product,
  onViewDetails,
  onAddToCart,
  compact = false,
}, ref) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const title = isAr && product.name_ar ? product.name_ar : product.name;
  const desc = isAr && product.description_ar ? product.description_ar : product.description;
  const price = product.unit_price || 0;
  const priceWithVat = Math.round(price * (1 + VAT_RATE));
  const isInStock = product.in_stock !== false;
  const qty = product.quantity_available;
  const currencyLabel = isAr ? "ر.س" : "SAR";

  const originalPriceVat = Math.round(price * 1.2 * (1 + VAT_RATE));
  const hasDiscount = originalPriceVat > priceWithVat && price > 0;
  const discountPercent = hasDiscount ? Math.round(((originalPriceVat - priceWithVat) / originalPriceVat) * 100) : 0;

  return (
    <Card
      ref={ref}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border-border/20 bg-card transition-all duration-300",
        "hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/20",
        !isInStock && "opacity-70"
      )}
    >
      {/* Image */}
      <div
        className="relative aspect-[4/3] overflow-hidden bg-muted/10 cursor-pointer"
        onClick={() => onViewDetails(product)}
      >
        {product.image_url ? (
          <img
            loading="lazy"
            src={product.image_url}
            alt={title}
            className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/5 to-muted/20">
            <Package className="h-10 w-10 text-muted-foreground/15" />
          </div>
        )}

        {/* Discount badge */}
        {hasDiscount && (
          <div className="absolute top-2 start-2 z-[5]">
            <Badge className="bg-destructive text-white text-[11px] font-bold px-2 py-0.5 rounded-lg shadow-sm gap-0.5">
              <Flame className="h-3 w-3" />
              {discountPercent}%−
            </Badge>
          </div>
        )}

        {/* Quick view overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-background/5 backdrop-blur-[1px]">
          <Button size="sm" variant="secondary" className="rounded-xl shadow-lg backdrop-blur-md bg-background/80 gap-1.5 active:scale-95 transition-transform">
            <Eye className="h-3.5 w-3.5" />
            {isAr ? "التفاصيل" : "Details"}
          </Button>
        </div>

        {/* Out of stock overlay */}
        {!isInStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm z-10">
            <Badge variant="destructive" className="px-3 py-1 font-bold text-xs">
              {isAr ? "نفد المخزون" : "Out of Stock"}
            </Badge>
          </div>
        )}

        {/* Category pill */}
        {product.category && !compact && (
          <div className="absolute bottom-2 start-2 z-[5]">
            <Badge variant="secondary" className="bg-background/70 backdrop-blur-md text-[10px] font-medium px-2 py-0.5 rounded-lg border border-border/30">
              {product.category}
            </Badge>
          </div>
        )}

        {/* Low stock warning */}
        {isInStock && qty && qty > 0 && qty <= 5 && (
          <div className="absolute top-2 end-2 z-[5]">
            <Badge className="bg-destructive/90 text-white text-[10px] px-1.5 py-0.5 rounded-lg">
              {isAr ? `باقي ${qty}` : `${qty} left`}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <CardContent className="flex flex-1 flex-col p-3 sm:p-3.5">
        <div className="flex-1 space-y-1.5 min-w-0">
          {/* Title */}
          <h4
            className="font-semibold text-[13px] leading-snug line-clamp-2 cursor-pointer hover:text-primary transition-colors"
            onClick={() => onViewDetails(product)}
          >
            {title}
          </h4>

          {/* SKU + Stock row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {product.sku && (
              <span className="text-[10px] font-mono text-muted-foreground/60">{product.sku}</span>
            )}
            <span className="text-[10px] text-muted-foreground/30">|</span>
            {isInStock ? (
              <span className="flex items-center gap-0.5 text-[10px] text-chart-5 font-medium">
                <CheckCircle className="h-2.5 w-2.5" />
                {isAr ? "متوفر" : "In Stock"}
              </span>
            ) : (
              <span className="flex items-center gap-0.5 text-[10px] text-destructive">
                <XCircle className="h-2.5 w-2.5" />
                {isAr ? "غير متوفر" : "Sold Out"}
              </span>
            )}
          </div>
        </div>

        {/* Price + CTA section */}
        <div className="mt-2.5 pt-2.5 border-t border-border/15">
          {price > 0 ? (
            <div className="flex items-end justify-between gap-1.5">
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-black tracking-tight text-primary leading-none">
                    {priceWithVat}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {currencyLabel}
                  </span>
                  {hasDiscount && (
                    <span className="text-[10px] text-muted-foreground/50 line-through ms-0.5">
                      {originalPriceVat}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                  {isAr ? "شامل الضريبة" : "VAT included"}
                </p>
              </div>
              {onAddToCart && (
                <Button
                  size="icon"
                  disabled={!isInStock}
                  onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                  className="h-8 w-8 rounded-xl shrink-0 shadow-sm active:scale-95 transition-all"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              {isAr ? "تواصل للسعر" : "Contact for price"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}));
