/**
 * Quick action overlay for shop products on mobile.
 * Shows quantity controls and instant add-to-cart.
 */
import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, Minus, Eye } from "lucide-react";
import { Link } from "react-router-dom";

interface ProductQuickActionsProps {
  product: any;
  onAddToCart: (product: any, quantity: number) => void;
}

export function ProductQuickActions({ product, onAddToCart }: ProductQuickActionsProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [quantity, setQuantity] = useState(1);
  const isOutOfStock = product.product_type === "physical" && product.stock_quantity <= 0;

  if (isOutOfStock) return null;

  return (
    <div className="flex items-center gap-2 mt-2 sm:hidden">
      <div className="flex items-center rounded-lg border border-border/60 bg-background">
        <button
          onClick={() => setQuantity(q => Math.max(1, q - 1))}
          className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Decrease"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="w-6 text-center text-xs font-bold">{quantity}</span>
        <button
          onClick={() => setQuantity(q => q + 1)}
          className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Increase"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      <Button
        size="sm"
        className="h-8 flex-1 text-xs font-bold gap-1.5 rounded-lg active:scale-95 transition-transform"
        onClick={() => { onAddToCart(product, quantity); setQuantity(1); }}
      >
        <ShoppingCart className="h-3.5 w-3.5" />
        {isAr ? "أضف" : "Add"} {quantity > 1 && `(${quantity})`}
      </Button>
    </div>
  );
}
