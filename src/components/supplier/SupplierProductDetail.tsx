import { memo, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Package, ShoppingCart, ArrowLeft, CheckCircle, XCircle,
  Minus, Plus, Truck, Shield, RotateCcw, Tag, Box, Ruler,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SupplierProductDetailProps {
  product: any;
  relatedProducts?: any[];
  onBack: () => void;
  onAddToCart?: (product: any, qty: number) => void;
  onViewProduct?: (product: any) => void;
  companyName?: string;
}

const VAT_RATE = 0.15;

export const SupplierProductDetail = memo(function SupplierProductDetail({
  product,
  relatedProducts = [],
  onBack,
  onAddToCart,
  onViewProduct,
  companyName,
}: SupplierProductDetailProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  if (!product) return null;

  const title = isAr && product.name_ar ? product.name_ar : product.name;
  const desc = isAr && product.description_ar ? product.description_ar : product.description;
  const price = product.unit_price || 0;
  const priceWithVat = Math.round(price * (1 + VAT_RATE));
  const totalPrice = price * qty;
  const totalWithVat = Math.round(totalPrice * (1 + VAT_RATE));
  const isInStock = product.in_stock !== false;
  const stockQty = product.quantity_available;

  const specs = [
    product.category && { label: isAr ? "الفئة" : "Category", value: product.category, icon: Tag },
    product.subcategory && { label: isAr ? "الفئة الفرعية" : "Subcategory", value: product.subcategory, icon: Tag },
    product.sku && { label: "SKU", value: product.sku, icon: Box },
    product.unit && { label: isAr ? "الوحدة" : "Unit", value: product.unit, icon: Ruler },
    stockQty && { label: isAr ? "الكمية المتوفرة" : "Available Qty", value: stockQty.toString(), icon: Package },
  ].filter(Boolean) as { label: string; value: string; icon: any }[];

  return (
    <div className="space-y-6">
      {/* Breadcrumb/Back */}
      <Button variant="ghost" size="sm" className="rounded-xl gap-2 text-muted-foreground hover:text-foreground" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        {isAr ? "العودة للمنتجات" : "Back to Products"}
      </Button>

      {/* Main product layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Image section */}
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted/20 border border-border/20">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Package className="h-20 w-20 text-muted-foreground/10" />
              </div>
            )}

            {/* Stock overlay */}
            {!isInStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                <Badge variant="destructive" className="px-4 py-2 text-sm font-bold">
                  {isAr ? "نفد المخزون" : "Out of Stock"}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Info section */}
        <div className="space-y-5">
          {/* Category + Title */}
          <div>
            {product.category && (
              <Badge variant="outline" className="text-[11px] font-bold uppercase tracking-widest mb-2 rounded-lg border-primary/20 bg-primary/5 text-primary/80">
                {product.category}
              </Badge>
            )}
            <h1 className="text-xl sm:text-2xl font-bold leading-tight">{title}</h1>
            {companyName && (
              <p className="text-sm text-muted-foreground mt-1">{isAr ? "بواسطة" : "by"} {companyName}</p>
            )}
          </div>

          {/* Price block */}
          <Card className="rounded-2xl border-primary/10 bg-primary/3 overflow-hidden">
            <CardContent className="p-4 space-y-2">
              {price > 0 ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-primary tracking-tight">
                      {price.toFixed(0)}
                    </span>
                    <span className="text-base text-muted-foreground font-medium">
                      {product.currency || "SAR"}
                    </span>
                    {product.unit && (
                      <span className="text-sm text-muted-foreground">/ {product.unit}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {priceWithVat.toFixed(0)} {product.currency || "SAR"} {isAr ? "شامل ضريبة القيمة المضافة 15%" : "incl. 15% VAT"}
                  </p>
                  {qty > 1 && (
                    <div className="pt-1 border-t border-primary/10">
                      <p className="text-sm font-semibold text-foreground">
                        {isAr ? "الإجمالي:" : "Total:"} {totalPrice.toFixed(0)} {product.currency || "SAR"}
                        <span className="text-xs text-muted-foreground ms-1">
                          ({totalWithVat.toFixed(0)} {isAr ? "شامل الضريبة" : "incl. VAT"})
                        </span>
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-base text-muted-foreground">
                  {isAr ? "تواصل معنا للحصول على السعر" : "Contact us for pricing"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Stock status */}
          <div className="flex items-center gap-3">
            {isInStock ? (
              <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20 gap-1.5 py-1 px-3 rounded-xl">
                <CheckCircle className="h-3.5 w-3.5" />
                {isAr ? "متوفر في المخزون" : "In Stock"}
                {stockQty && stockQty > 0 && <span className="font-normal opacity-70">({stockQty})</span>}
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1.5 py-1 px-3 rounded-xl">
                <XCircle className="h-3.5 w-3.5" />
                {isAr ? "غير متوفر حالياً" : "Currently Unavailable"}
              </Badge>
            )}
            {isInStock && stockQty && stockQty <= 5 && (
              <span className="text-xs text-destructive font-bold">
                {isAr ? `باقي ${stockQty} فقط!` : `Only ${stockQty} left!`}
              </span>
            )}
          </div>

          {/* Quantity + Add to Cart */}
          {onAddToCart && price > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-border/40 rounded-xl overflow-hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-none"
                  disabled={qty <= 1}
                  onClick={() => setQty(Math.max(1, qty - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center text-sm font-bold tabular-nums">{qty}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-none"
                  disabled={stockQty ? qty >= stockQty : false}
                  onClick={() => setQty(qty + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                size="lg"
                disabled={!isInStock}
                onClick={() => onAddToCart(product, qty)}
                className="flex-1 h-11 rounded-xl font-bold gap-2 shadow-md shadow-primary/15 active:scale-[0.98] transition-all"
              >
                <ShoppingCart className="h-4 w-4" />
                {isAr ? "أضف إلى السلة" : "Add to Cart"}
              </Button>
            </div>
          )}

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Truck, en: "Fast Delivery", ar: "توصيل سريع" },
              { icon: Shield, en: "Secure Order", ar: "طلب آمن" },
              { icon: RotateCcw, en: "Easy Returns", ar: "إرجاع سهل" },
            ].map(({ icon: Icon, en, ar }) => (
              <div key={en} className="flex flex-col items-center gap-1 rounded-xl bg-muted/30 p-2.5 text-center">
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-[10px] text-muted-foreground font-medium">{isAr ? ar : en}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Description & Specs */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Description */}
        {desc && (
          <div className="lg:col-span-2">
            <h2 className="text-base font-bold mb-3 flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              {isAr ? "وصف المنتج" : "Product Description"}
            </h2>
            <Card className="rounded-2xl border-border/20">
              <CardContent className="p-4 sm:p-5">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{desc}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Specifications */}
        {specs.length > 0 && (
          <div className={cn(!desc && "lg:col-span-3")}>
            <h2 className="text-base font-bold mb-3 flex items-center gap-2">
              <Box className="h-4 w-4 text-primary" />
              {isAr ? "المواصفات" : "Specifications"}
            </h2>
            <Card className="rounded-2xl border-border/20">
              <CardContent className="p-0 divide-y divide-border/15">
                {specs.map((spec) => (
                  <div key={spec.label} className="flex items-center gap-3 px-4 py-3">
                    <spec.icon className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                    <span className="text-sm text-muted-foreground">{spec.label}</span>
                    <span className="ms-auto text-sm font-medium">{spec.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <Separator className="mb-6" />
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            {isAr ? "منتجات ذات صلة" : "Related Products"}
          </h2>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.slice(0, 4).map((rp: any) => {
              const rpTitle = isAr && rp.name_ar ? rp.name_ar : rp.name;
              const rpPrice = rp.unit_price || 0;
              return (
                <Card
                  key={rp.id}
                  interactive
                  className="rounded-2xl overflow-hidden cursor-pointer"
                  onClick={() => onViewProduct?.(rp)}
                >
                  <div className="aspect-square bg-muted/20 overflow-hidden">
                    {rp.image_url ? (
                      <img loading="lazy" src={rp.image_url} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" alt={rpTitle} />
                    ) : (
                      <div className="h-full flex items-center justify-center"><Package className="h-8 w-8 text-muted-foreground/15" /></div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <p className="font-medium text-sm truncate">{rpTitle}</p>
                    {rpPrice > 0 && (
                      <p className="text-sm font-bold text-primary mt-1">{rpPrice.toFixed(0)} {rp.currency || "SAR"}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});
