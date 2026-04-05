import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, ShoppingCart, X } from "lucide-react";

interface ProductQuickViewProps {
  product: any;
  open: boolean;
  onClose: () => void;
}

export const ProductQuickView = memo(function ProductQuickView({ product, open, onClose }: ProductQuickViewProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {isAr && product.name_ar ? product.name_ar : product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image */}
          {product.image_url ? (
            <div className="h-56 rounded-xl bg-muted overflow-hidden">
              <img src={product.image_url} className="h-full w-full object-cover" alt={product.name} />
            </div>
          ) : (
            <div className="h-56 rounded-xl bg-muted/50 flex items-center justify-center">
              <Package className="h-12 w-12 text-muted-foreground/20" />
            </div>
          )}

          {/* Price & Status */}
          <div className="flex items-center justify-between">
            {product.unit_price > 0 ? (
              <span className="text-2xl font-bold text-primary">
                {product.unit_price} <span className="text-sm font-normal text-muted-foreground">{product.currency || "SAR"}</span>
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">{isAr ? "السعر غير محدد" : "Price not set"}</span>
            )}
            <div className="flex gap-1.5">
              {product.in_stock ? (
                <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20">{isAr ? "متوفر" : "In Stock"}</Badge>
              ) : (
                <Badge variant="destructive">{isAr ? "نفد المخزون" : "Out of Stock"}</Badge>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2">
            {product.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isAr && product.description_ar ? product.description_ar : product.description}
              </p>
            )}
            <div className="flex flex-wrap gap-1.5">
              {product.category && (
                <Badge variant="outline" className="text-[10px]">{product.category}</Badge>
              )}
              {product.sku && (
                <Badge variant="outline" className="text-[10px] font-mono">SKU: {product.sku}</Badge>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
