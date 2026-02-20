import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, Trash2, Minus, Plus, ShoppingBag, Tag, Percent } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import type { useCart } from "@/hooks/useCart";
import { useNavigate } from "react-router-dom";
import { formatCurrency, SAR_SYMBOL } from "@/lib/currencyFormatter";

interface CartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: ReturnType<typeof useCart>;
}

export function CartSheet({ open, onOpenChange, cart }: CartSheetProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const [isPlacing, setIsPlacing] = useState(false);
  const [isApplyingCode, setIsApplyingCode] = useState(false);

  const handleApplyDiscount = async () => {
    if (!cart.discountCode.trim()) return;
    setIsApplyingCode(true);
    try {
      const { data, error } = await supabase
        .from("shop_discount_codes")
        .select("*")
        .eq("code", cart.discountCode.trim().toUpperCase())
        .eq("is_active", true)
        .single();

      if (error || !data) {
        toast({ title: isAr ? "رمز خصم غير صالح" : "Invalid discount code", variant: "destructive" });
        return;
      }

      if (data.valid_until && new Date(data.valid_until) < new Date()) {
        toast({ title: isAr ? "رمز الخصم منتهي الصلاحية" : "Discount code expired", variant: "destructive" });
        return;
      }

      if (data.max_uses && data.used_count >= data.max_uses) {
        toast({ title: isAr ? "تم استنفاد رمز الخصم" : "Discount code fully redeemed", variant: "destructive" });
        return;
      }

      if (data.min_order_amount && cart.subtotal < data.min_order_amount) {
        toast({
          title: isAr ? "الحد الأدنى للطلب غير مستوفى" : "Minimum order not met",
          description: isAr ? `الحد الأدنى: ${data.min_order_amount}` : `Minimum: ${data.min_order_amount}`,
          variant: "destructive",
        });
        return;
      }

      cart.setAppliedDiscount({
        code: data.code,
        type: data.discount_type as "percentage" | "fixed",
        value: data.discount_value,
      });
      toast({ title: isAr ? "تم تطبيق رمز الخصم!" : "Discount applied!" });
    } catch {
      toast({ title: isAr ? "خطأ" : "Error", variant: "destructive" });
    } finally {
      setIsApplyingCode(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!user || cart.items.length === 0) return;
    setIsPlacing(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from("shop_orders")
        .insert({
          buyer_id: user.id,
          total_amount: cart.totalPrice,
          subtotal: cart.subtotal,
          tax_amount: cart.taxAmount,
          discount_amount: cart.discountAmount,
          currency: cart.items[0]?.currency || "SAR",
          order_number: "",
          payment_method: "pending",
          payment_status: "pending",
        })
        .select("id, order_number")
        .single();

      if (orderError) throw orderError;

      const items = cart.items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        product_snapshot: {
          title: item.title,
          title_ar: item.title_ar,
          image_url: item.image_url,
        },
      }));

      const { error: itemsError } = await supabase.from("shop_order_items").insert(items);
      if (itemsError) throw itemsError;

      // Increment discount code usage
      if (cart.appliedDiscount) {
        await supabase
          .from("shop_discount_codes")
          .update({ used_count: supabase.rpc ? undefined : undefined })
          .eq("code", cart.appliedDiscount.code);
      }

      cart.clearCart();
      onOpenChange(false);

      // Track purchase conversion
      try {
        const { sendGoogleConversion, pushToDataLayer } = await import("@/hooks/useGoogleTracking");
        sendGoogleConversion("purchase", { value: cart.totalPrice, currency: "SAR", transaction_id: order.id });
        pushToDataLayer("purchase", { value: cart.totalPrice, currency: "SAR", order_id: order.id });
        await supabase.from("conversion_events").insert([{
          user_id: user.id,
          event_name: "purchase",
          event_category: "ecommerce",
          event_value: cart.totalPrice,
          currency: "SAR",
          session_id: sessionStorage.getItem("ad_session_id") || null,
          metadata: { order_id: order.id, order_number: order.order_number, items_count: items.length } as any,
        }]);
      } catch {}

      toast({
        title: isAr ? "تم تقديم الطلب بنجاح!" : "Order placed successfully!",
        description: isAr ? `رقم الطلب: ${order.order_number}` : `Order number: ${order.order_number}`,
      });
      navigate("/shop/orders");
    } catch (error: any) {
      toast({
        title: isAr ? "خطأ في تقديم الطلب" : "Error placing order",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsPlacing(false);
    }
  };

  const currency = cart.items[0]?.currency || "SAR";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isAr ? "left" : "right"} className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {isAr ? "سلة التسوق" : "Shopping Cart"}
            {cart.totalItems > 0 && <Badge variant="secondary">{cart.totalItems}</Badge>}
          </SheetTitle>
        </SheetHeader>

        {cart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/60">
              <ShoppingBag className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="font-medium">{isAr ? "السلة فارغة" : "Your cart is empty"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAr ? "أضف منتجات لتبدأ التسوق" : "Add products to start shopping"}
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto py-4">
              {cart.items.map((item) => {
                const title = isAr && item.title_ar ? item.title_ar : item.title;
                const hasDiscount = item.compare_at_price && item.compare_at_price > item.price;
                return (
                  <div key={item.product_id} className="flex gap-3 rounded-xl border border-border/50 p-3 transition-all duration-200 hover:border-primary/20 hover:shadow-sm">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border/30">
                      {item.image_url ? (
                        <img src={item.image_url} alt={title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{title}</p>
                       <div className="flex items-center gap-1.5">
                         <p className="text-sm font-bold text-primary">
                           {formatCurrency(item.price, language as "en" | "ar")}
                         </p>
                         {hasDiscount && (
                           <p className="text-xs text-muted-foreground line-through">
                             {formatCurrency(item.compare_at_price!, language as "en" | "ar")}
                           </p>
                         )}
                       </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex items-center rounded border">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => cart.updateQuantity(item.product_id, item.quantity - 1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-7 text-center text-xs">{item.quantity}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => cart.updateQuantity(item.product_id, item.quantity + 1)} disabled={item.quantity >= item.stock_quantity}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => cart.removeItem(item.product_id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm font-semibold shrink-0">
                      {formatCurrency(item.price * item.quantity, language as "en" | "ar")}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="border-t pt-4 space-y-3">
              {/* Discount Code */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={isAr ? "رمز الخصم" : "Discount code"}
                    value={cart.discountCode}
                    onChange={(e) => cart.setDiscountCode(e.target.value.toUpperCase())}
                    className="ps-8 h-9 text-sm"
                    disabled={!!cart.appliedDiscount}
                  />
                </div>
                {cart.appliedDiscount ? (
                  <Button variant="outline" size="sm" onClick={() => { cart.setAppliedDiscount(null); cart.setDiscountCode(""); }}>
                    {isAr ? "إزالة" : "Remove"}
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleApplyDiscount} disabled={isApplyingCode || !cart.discountCode.trim()}>
                    {isAr ? "تطبيق" : "Apply"}
                  </Button>
                )}
              </div>

              {cart.appliedDiscount && (
                <div className="flex items-center gap-1.5 rounded-lg bg-chart-2/10 px-3 py-1.5 text-xs text-chart-2">
                  <Percent className="h-3 w-3" />
                  <span>
                    {cart.appliedDiscount.code} – {cart.appliedDiscount.type === "percentage" ? `${cart.appliedDiscount.value}%` : formatCurrency(cart.appliedDiscount.value, language as "en" | "ar")} {isAr ? "خصم" : "off"}
                  </span>
                </div>
              )}

              <Separator />

               {/* Summary */}
               <div className="space-y-1.5 text-sm">
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">{isAr ? "المجموع الفرعي" : "Subtotal"}</span>
                   <span>{formatCurrency(cart.subtotal, language as "en" | "ar")}</span>
                 </div>
                 {cart.taxAmount > 0 && (
                   <div className="flex justify-between">
                     <span className="text-muted-foreground">{isAr ? "الضريبة" : "Tax"}</span>
                     <span>{formatCurrency(cart.taxAmount, language as "en" | "ar")}</span>
                   </div>
                 )}
                 {cart.discountAmount > 0 && (
                   <div className="flex justify-between text-chart-2">
                     <span>{isAr ? "الخصم" : "Discount"}</span>
                     <span>-{formatCurrency(cart.discountAmount, language as "en" | "ar")}</span>
                   </div>
                 )}
               </div>

               <Separator />

               <div className="flex items-center justify-between text-lg font-bold">
                 <span>{isAr ? "الإجمالي" : "Total"}</span>
                 <span className="text-primary">{formatCurrency(cart.totalPrice, language as "en" | "ar")}</span>
               </div>

              <Button className="w-full" size="lg" onClick={() => { onOpenChange(false); navigate("/checkout"); }}>
                {isAr ? "المتابعة للدفع" : "Proceed to Checkout"} →
              </Button>
              <Button variant="outline" size="sm" className="w-full" onClick={() => cart.clearCart()}>
                <Trash2 className="me-1.5 h-3.5 w-3.5" />
                {isAr ? "إفراغ السلة" : "Clear Cart"}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
