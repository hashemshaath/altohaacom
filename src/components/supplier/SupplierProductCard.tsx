import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { ShoppingCart, Package, Eye, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SupplierProductCardProps {
  product: any;
  onViewDetails: (product: any) => void;
  onAddToCart?: (product: any) => void;
  compact?: boolean;
}

const VAT_RATE = 0.15;

export const SupplierProductCard = memo(function SupplierProductCard({
  product,
  onViewDetails,
  onAddToCart,
  compact = false,
}: SupplierProductCardProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const title = isAr && product.name_ar ? product.name_ar : product.name;
  const desc = isAr && product.description_ar ? product.description_ar : product.description;
  const price = product.unit_price || 0;
  const priceWithVat = Math.round(price * (1 + VAT_RATE));
  const isInStock = product.in_stock !== false;
  const qty = product.quantity_available;

  return (
    <Card
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border-border/30 bg-card/80 backdrop-blur-sm transition-all duration-300",
        "hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/20",
        !isInStock && "opacity-75"
      )}
    >
      {/* Image */}
      <div
        className="relative aspect-square overflow-hidden bg-muted/20 cursor-pointer"
        onClick={() => onViewDetails(product)}
      >
        {product.image_url ? (
          <img
            loading="lazy"
            src={product.image_url}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/5 to-muted/20">
            <Package className="h-12 w-12 text-muted-foreground/15" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Quick view button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button size="sm" variant="secondary" className="rounded-xl shadow-lg backdrop-blur-md bg-background/80 gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            {isAr ? "عرض التفاصيل" : "View Details"}
          </Button>
        </div>

        {/* Stock badge */}
        {!isInStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm z-10">
            <Badge variant="destructive" className="px-3 py-1 font-bold text-xs">
              {isAr ? "نفد المخزون" : "Out of Stock"}
            </Badge>
          </div>
        )}

        {/* Category badge */}
        {product.category && (
          <div className="absolute top-2 start-2 z-[5]">
            <Badge variant="secondary" className="bg-background/70 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border border-border/30">
              {product.category}
            </Badge>
          </div>
        )}

        {/* Low stock warning */}
        {isInStock && qty && qty > 0 && qty <= 5 && (
          <div className="absolute top-2 end-2 z-[5]">
            <Badge className="bg-destructive/90 text-white text-[10px] px-2 py-0.5 rounded-lg backdrop-blur-md">
              {isAr ? `باقي ${qty} فقط` : `Only ${qty} left`}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <CardContent className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="flex-1 space-y-1.5 min-w-0">
          {/* Title */}
          <h4
            className="font-bold text-sm leading-tight line-clamp-2 cursor-pointer hover:text-primary transition-colors"
            onClick={() => onViewDetails(product)}
          >
            {title}
          </h4>

          {/* Description */}
          {!compact && desc && (
            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{desc}</p>
          )}

          {/* SKU + Stock */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {product.sku && (
              <Badge variant="outline" className="text-[10px] font-mono rounded-md px-1.5 py-0 h-5 border-border/40">
                {product.sku}
              </Badge>
            )}
            {isInStock ? (
              <span className="flex items-center gap-0.5 text-[10px] text-chart-5">
                <CheckCircle className="h-2.5 w-2.5" />
                {isAr ? "متوفر" : "In Stock"}
              </span>
            ) : (
              <span className="flex items-center gap-0.5 text-[10px] text-destructive">
                <XCircle className="h-2.5 w-2.5" />
                {isAr ? "غير متوفر" : "Out of Stock"}
              </span>
            )}
          </div>
        </div>

        {/* Price section */}
        <div className="mt-3 pt-3 border-t border-border/20">
          {price > 0 ? (
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-black tracking-tight text-primary">
                    {price.toFixed(0)}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {product.currency || "SAR"}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                  {priceWithVat.toFixed(0)} {product.currency || "SAR"} {isAr ? "شامل الضريبة" : "incl. VAT"}
                </p>
                {product.unit && (
                  <p className="text-[10px] text-muted-foreground/50">
                    / {product.unit}
                  </p>
                )}
              </div>
              {onAddToCart && (
                <Button
                  size="sm"
                  disabled={!isInStock}
                  onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                  className="h-8 rounded-xl px-3 text-xs font-bold shrink-0 shadow-sm shadow-primary/10 active:scale-95 transition-all"
                >
                  <ShoppingCart className="h-3.5 w-3.5 me-1" />
                  {isAr ? "أضف" : "Add"}
                </Button>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              {isAr ? "تواصل للسعر" : "Contact for pricing"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
