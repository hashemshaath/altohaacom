import { SafeImage } from "@/components/ui/SafeImage";
import { useIsAr } from "@/hooks/useIsAr";
import { memo, forwardRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, Eye, CheckCircle, XCircle, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { categories as catalogCategories } from "@/components/company/catalog/catalogTypes";

interface SupplierProductCardProps {
  product: any;
  onViewDetails: (product: any) => void;
  onAddToCart?: (product: any) => void;
  compact?: boolean;
}

const VAT_RATE = 0.15;

/** Map category value to localized label */
function getCategoryLabel(cat: string | null, isAr: boolean): string {
  if (!cat) return "";
  const found = catalogCategories.find(c => c.value === cat);
  return found ? (isAr ? found.ar : found.en) : cat;
}

export const SupplierProductCard = memo(forwardRef<HTMLDivElement, SupplierProductCardProps>(function SupplierProductCard({
  product,
  onViewDetails,
  onAddToCart,
  compact = false,
}, ref) {
  const isAr = useIsAr();

  const title = isAr && product.name_ar ? product.name_ar : product.name;
  const price = product.unit_price || 0;
  const priceWithVat = Math.round(price * (1 + VAT_RATE));
  const isInStock = product.in_stock !== false;
  const qty = product.quantity_available;
  const currencyLabel = isAr ? "ر.س" : "SAR";

  const origPrice = product.original_price || Math.round(price * 1.2);
  const originalPriceVat = Math.round(origPrice * (1 + VAT_RATE));
  const hasDiscount = originalPriceVat > priceWithVat && price > 0;
  const discountPercent = hasDiscount ? Math.round(((originalPriceVat - priceWithVat) / originalPriceVat) * 100) : 0;

  const categoryLabel = getCategoryLabel(product.category, isAr);

  const handleView = useCallback(() => onViewDetails(product), [onViewDetails, product]);
  const handleCart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart?.(product);
  }, [onAddToCart, product]);

  return (
    <Card
      ref={ref}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border-border/20 bg-card transition-all duration-300 cursor-pointer",
        "hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5 hover:border-primary/20",
        !isInStock && "opacity-70"
      )}
      onClick={handleView}
    >
      {/* Image */}
      <div
        className="relative aspect-square overflow-hidden cursor-pointer bg-gradient-to-b from-muted/5 to-muted/15"
        onClick={handleView}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={`${title} - ${categoryLabel}`}
            className="h-full w-full object-contain p-6 transition-transform duration-500 will-change-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground/10" />
          </div>
        )}

        {/* Discount badge */}
        {hasDiscount && (
          <div className="absolute top-2.5 start-2.5 z-[5]">
            <Badge className="bg-destructive text-destructive-foreground text-[0.6875rem] font-bold px-2 py-0.5 rounded-full shadow-md gap-0.5">
              <Flame className="h-3 w-3" />
              −{discountPercent}%
            </Badge>
          </div>
        )}

        {/* Quick view overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-background/5 backdrop-blur-[1px]">
          <Button size="sm" variant="secondary" className="rounded-xl shadow-lg backdrop-blur-md bg-background/80 gap-1.5 active:scale-[0.98] transition-transform min-h-[44px]">
            <Eye className="h-3.5 w-3.5" />
            {isAr ? "عرض التفاصيل" : "View Details"}
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

        {/* Category pill - localized */}
        {categoryLabel && !compact && (
          <div className="absolute bottom-2.5 end-2.5 z-[5]">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-md text-[0.625rem] font-semibold px-2.5 py-0.5 rounded-lg border border-border/20 shadow-sm">
              {categoryLabel}
            </Badge>
          </div>
        )}

        {/* Low stock warning */}
        {isInStock && qty && qty > 0 && qty <= 5 && (
          <div className="absolute top-2.5 end-2.5 z-[5]">
            <Badge className="bg-destructive/90 text-destructive-foreground text-[0.625rem] px-1.5 py-0.5 rounded-lg font-bold">
              {isAr ? `باقي ${qty} فقط` : `Only ${qty} left`}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <CardContent className="flex flex-1 flex-col p-3.5 sm:p-4">
        <div className="flex-1 space-y-1.5 min-w-0">
          {/* Title */}
          <h3
            className="font-bold text-sm leading-snug line-clamp-2 cursor-pointer hover:text-primary transition-colors text-foreground"
            onClick={handleView}
          >
            {title}
          </h3>

          {/* SKU + Stock row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {product.sku && (
              <>
                <span className="text-[0.625rem] font-mono text-muted-foreground/50 tracking-wide">{product.sku}</span>
                <span className="text-muted-foreground/20">·</span>
              </>
            )}
            {isInStock ? (
              <span className="flex items-center gap-0.5 text-[0.625rem] text-chart-5 font-semibold">
                <CheckCircle className="h-2.5 w-2.5" />
                {isAr ? "متوفر" : "In Stock"}
              </span>
            ) : (
              <span className="flex items-center gap-0.5 text-[0.625rem] text-destructive font-semibold">
                <XCircle className="h-2.5 w-2.5" />
                {isAr ? "غير متوفر" : "Sold Out"}
              </span>
            )}
          </div>
        </div>

        {/* Price + CTA */}
        <div className="mt-3 pt-3 border-t border-border/10">
          {price > 0 ? (
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-lg font-black tracking-tight text-primary leading-none tabular-nums">
                    {priceWithVat.toLocaleString()}
                  </span>
                  <span className="text-[0.6875rem] text-muted-foreground font-medium">
                    {currencyLabel}
                  </span>
                  {hasDiscount && (
                    <span className="text-[0.6875rem] text-muted-foreground/40 line-through tabular-nums">
                      {originalPriceVat.toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="text-[0.625rem] text-muted-foreground/50 mt-0.5 font-medium">
                  {isAr ? "شامل الضريبة" : "VAT included"}
                </p>
              </div>
              {onAddToCart && (
                <Button
                  size="icon"
                  disabled={!isInStock}
                  onClick={handleCart}
                  className="h-10 w-10 rounded-xl shrink-0 shadow-sm active:scale-[0.98] transition-all"
                  aria-label={isAr ? "أضف للسلة" : "Add to cart"}
                >
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {isAr ? "تواصل للحصول على السعر" : "Contact for pricing"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}));
