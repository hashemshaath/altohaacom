import { useIsAr } from "@/hooks/useIsAr";
import { memo, useState, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  ShoppingCart, Trash2, Minus, Plus, ShoppingBag, Tag, Percent,
  Truck, Shield, CreditCard, FileText, Bell, CheckCircle,
  Package, Clock, Gift, ArrowRight, Sparkles,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { useCart } from "@/hooks/useCart";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/lib/currencyFormatter";
import { useEcommerceTracking } from "@/hooks/useEcommerceTracking";
import { cn } from "@/lib/utils";

interface CartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: ReturnType<typeof useCart>;
}

const VAT_RATE = 0.15;
const FREE_SHIPPING_THRESHOLD = 500;

export const CartSheet = memo(function CartSheet({ open, onOpenChange, cart }: CartSheetProps) {
  const { language } = useLanguage();
  const isAr = useIsAr();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isPlacing, setIsPlacing] = useState(false);
  const [isApplyingCode, setIsApplyingCode] = useState(false);
  const { trackPurchase, trackRemoveFromCart } = useEcommerceTracking();
  const lang = language as "en" | "ar";

  const subtotalBeforeVat = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const vatAmount = Math.round(subtotalBeforeVat * VAT_RATE * 100) / 100;
  const freeShippingProgress = Math.min((subtotalBeforeVat / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remainingForFreeShipping = Math.max(FREE_SHIPPING_THRESHOLD - subtotalBeforeVat, 0);

  const handleApplyDiscount = useCallback(async () => {
    if (!cart.discountCode.trim()) return;
    setIsApplyingCode(true);
    try {
      const { data, error } = await supabase
        .from("shop_discount_codes")
        .select("id, code, discount_type, discount_value, min_order_amount, max_uses, used_count, valid_until, is_active")
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
      toast({ title: isAr ? "تم تطبيق رمز الخصم! 🎉" : "Discount applied! 🎉" });
    } catch {
      toast({ title: isAr ? "خطأ" : "Error", variant: "destructive" });
    } finally {
      setIsApplyingCode(false);
    }
  }, [cart, isAr]);

  const handlePlaceOrder = useCallback(async () => {
    if (!user || cart.items.length === 0) return;
    setIsPlacing(true);
    try {
      // 1. Create the order
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

      // 2. Insert order items
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

      // 3. Create invoice automatically
      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
      await supabase.from("invoices").insert({
        user_id: user.id,
        invoice_number: invoiceNumber,
        title: `Order ${order.order_number}`,
        title_ar: `طلب ${order.order_number}`,
        amount: cart.totalPrice,
        subtotal: cart.subtotal,
        tax_amount: vatAmount,
        currency: "SAR",
        status: "pending",
        payment_method: "pending",
        line_items: cart.items.map(i => ({
          name: i.title,
          name_ar: i.title_ar,
          qty: i.quantity,
          unit_price: i.price,
          total: i.price * i.quantity,
        })),
      }).select("id").maybeSingle();

      // 4. Send notification
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: isAr ? "تم تقديم طلبك بنجاح" : "Order placed successfully",
        title_ar: "تم تقديم طلبك بنجاح",
        body: isAr
          ? `رقم الطلب: ${order.order_number} | المبلغ: ${cart.totalPrice} ر.س`
          : `Order #${order.order_number} | Amount: ${cart.totalPrice} SAR`,
        body_ar: `رقم الطلب: ${order.order_number} | المبلغ: ${cart.totalPrice} ر.س`,
        type: "order",
        priority: "normal",
        action_url: "/shop/orders",
      }).maybeSingle();

      // 5. Log activity for accounting
      await supabase.from("audit_logs").insert({
        action_type: "order_created",
        entity_type: "shop_order",
        entity_id: order.id,
        actor_id: user.id,
        new_value: {
          order_number: order.order_number,
          total: cart.totalPrice,
          items_count: cart.totalItems,
          discount: cart.discountAmount,
          tax: vatAmount,
        },
      }).maybeSingle();

      // 6. Increment discount code usage
      if (cart.appliedDiscount) {
        await supabase
          .from("shop_discount_codes")
          .update({ used_count: (cart.items.length || 0) + 1 })
          .eq("code", cart.appliedDiscount.code);
      }

      // 7. Track purchase
      trackPurchase(order.id, order.order_number, cart.totalPrice, items.length, "SAR", "quick_checkout");

      cart.clearCart();
      onOpenChange(false);

      toast({
        title: isAr ? "تم تقديم الطلب بنجاح! ✅" : "Order placed successfully! ✅",
        description: isAr ? `رقم الطلب: ${order.order_number}` : `Order #${order.order_number}`,
      });
      navigate("/shop/orders");
    } catch (error: unknown) {
      toast({
        title: isAr ? "خطأ في تقديم الطلب" : "Error placing order",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsPlacing(false);
    }
  }, [user, cart, isAr, navigate, onOpenChange, trackPurchase, vatAmount]);

  const currency = cart.items[0]?.currency || "SAR";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isAr ? "left" : "right"} className="flex w-full flex-col sm:max-w-md p-0">
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/30">
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <ShoppingCart className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <span className="text-base font-bold">{isAr ? "سلة التسوق" : "Shopping Cart"}</span>
                {cart.totalItems > 0 && (
                  <Badge variant="secondary" className="ms-2 text-[0.6875rem] px-1.5 py-0 h-5">
                    {cart.totalItems} {isAr ? "منتج" : "items"}
                  </Badge>
                )}
              </div>
            </div>
          </SheetTitle>
        </SheetHeader>

        {cart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center px-6">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-muted/40">
              <ShoppingBag className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <p className="font-bold text-lg">{isAr ? "السلة فارغة" : "Your cart is empty"}</p>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-[240px]">
              {isAr ? "تصفح المنتجات وأضف ما يعجبك إلى السلة" : "Browse products and add items you like"}
            </p>
            <Button variant="outline" className="mt-5 rounded-xl" onClick={() => onOpenChange(false)}>
              {isAr ? "تصفح المنتجات" : "Browse Products"}
            </Button>
          </div>
        ) : (
          <>
            {/* Free Shipping Progress */}
            {subtotalBeforeVat < FREE_SHIPPING_THRESHOLD && (
              <div className="px-5 pt-3 pb-1">
                <div className="rounded-xl bg-accent/5 border border-accent/10 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="h-4 w-4 text-accent-foreground" />
                    <span className="text-xs font-medium">
                      {isAr
                        ? `أضف ${remainingForFreeShipping.toLocaleString()} ر.س للشحن المجاني`
                        : `Add ${remainingForFreeShipping.toLocaleString()} SAR for free shipping`}
                    </span>
                  </div>
                  <Progress value={freeShippingProgress} className="h-1.5" />
                </div>
              </div>
            )}
            {subtotalBeforeVat >= FREE_SHIPPING_THRESHOLD && (
              <div className="px-5 pt-3 pb-1">
                <div className="flex items-center gap-2 rounded-xl bg-chart-2/8 border border-chart-2/15 p-2.5 text-xs font-medium text-chart-2">
                  <CheckCircle className="h-4 w-4" />
                  {isAr ? "🎉 مؤهل للشحن المجاني!" : "🎉 You qualify for free shipping!"}
                </div>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2.5">
              {cart.items.map((item) => {
                const title = isAr && item.title_ar ? item.title_ar : item.title;
                const hasDiscount = item.compare_at_price && item.compare_at_price > item.price;
                const lineTotal = item.price * item.quantity;
                const lineTotalWithVat = Math.round(lineTotal * (1 + VAT_RATE));
                return (
                  <div
                    key={item.product_id}
                    className="flex gap-3 rounded-2xl border border-border/40 bg-card p-3 transition-all duration-200 hover:border-primary/20 hover:shadow-sm"
                  >
                    {/* Image */}
                    <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-muted/30 ring-1 ring-border/20">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={title}
                          className="h-full w-full object-contain p-1"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground/25" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold line-clamp-2 leading-tight">{title}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-sm font-bold text-primary">
                          {formatCurrency(item.price, lang)}
                        </span>
                        {hasDiscount && (
                          <span className="text-[0.6875rem] text-muted-foreground line-through">
                            {formatCurrency(item.compare_at_price!, lang)}
                          </span>
                        )}
                      </div>

                      {/* Quantity controls */}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center rounded-xl border border-border/50 bg-muted/20">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-s-xl"
                            onClick={() => cart.updateQuantity(item.product_id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-xs font-bold tabular-nums">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-e-xl"
                            onClick={() => cart.updateQuantity(item.product_id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock_quantity}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold tabular-nums">
                            {lineTotalWithVat.toLocaleString()} {isAr ? "ر.س" : "SAR"}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              trackRemoveFromCart({ product_id: item.product_id, title: item.title, price: item.price, quantity: item.quantity });
                              cart.removeItem(item.product_id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer - Summary & Actions */}
            <div className="border-t border-border/30 bg-muted/5 px-5 py-4 space-y-3">
              {/* Discount Code */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={isAr ? "رمز الخصم أو الكوبون" : "Discount code"}
                    value={cart.discountCode}
                    onChange={(e) => cart.setDiscountCode(e.target.value.toUpperCase())}
                    className="ps-8 h-9 text-sm rounded-xl border-border/40"
                    disabled={!!cart.appliedDiscount}
                  />
                </div>
                {cart.appliedDiscount ? (
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => { cart.setAppliedDiscount(null); cart.setDiscountCode(""); }}>
                    {isAr ? "إزالة" : "Remove"}
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={handleApplyDiscount} disabled={isApplyingCode || !cart.discountCode.trim()}>
                    {isAr ? "تطبيق" : "Apply"}
                  </Button>
                )}
              </div>

              {cart.appliedDiscount && (
                <div className="flex items-center gap-1.5 rounded-xl bg-chart-2/8 border border-chart-2/15 px-3 py-2 text-xs font-medium text-chart-2">
                  <Percent className="h-3.5 w-3.5" />
                  <span>
                    {cart.appliedDiscount.code} – {cart.appliedDiscount.type === "percentage" ? `${cart.appliedDiscount.value}%` : formatCurrency(cart.appliedDiscount.value, lang)} {isAr ? "خصم" : "off"}
                  </span>
                </div>
              )}

              <Separator className="bg-border/30" />

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isAr ? "المجموع الفرعي" : "Subtotal"}</span>
                  <span className="tabular-nums">{subtotalBeforeVat.toLocaleString()} {isAr ? "ر.س" : "SAR"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isAr ? "ضريبة القيمة المضافة (15%)" : "VAT (15%)"}</span>
                  <span className="tabular-nums">{vatAmount.toLocaleString()} {isAr ? "ر.س" : "SAR"}</span>
                </div>
                {cart.discountAmount > 0 && (
                  <div className="flex justify-between text-chart-2">
                    <span>{isAr ? "الخصم" : "Discount"}</span>
                    <span className="tabular-nums">-{cart.discountAmount.toLocaleString()} {isAr ? "ر.س" : "SAR"}</span>
                  </div>
                )}
              </div>

              <Separator className="bg-border/30" />

              {/* Grand Total */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-base font-bold">{isAr ? "الإجمالي" : "Total"}</span>
                  <p className="text-[0.6875rem] text-muted-foreground">{isAr ? "شامل الضريبة" : "VAT included"}</p>
                </div>
                <span className="text-xl font-black text-primary tabular-nums">
                  {(subtotalBeforeVat + vatAmount - cart.discountAmount).toLocaleString()} {isAr ? "ر.س" : "SAR"}
                </span>
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-4 py-1">
                {[
                  { icon: Shield, label: isAr ? "دفع آمن" : "Secure" },
                  { icon: Truck, label: isAr ? "شحن سريع" : "Fast Shipping" },
                  { icon: FileText, label: isAr ? "فاتورة" : "Invoice" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1 text-[0.625rem] text-muted-foreground">
                    <Icon className="h-3 w-3" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <Button
                className="w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-primary/20"
                size="lg"
                onClick={() => { onOpenChange(false); navigate("/checkout"); }}
              >
                <CreditCard className="me-2 h-4.5 w-4.5" />
                {isAr ? "المتابعة للدفع" : "Proceed to Checkout"}
                <ArrowRight className="ms-2 h-4 w-4" />
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-xs rounded-xl text-muted-foreground"
                  onClick={() => onOpenChange(false)}
                >
                  {isAr ? "متابعة التسوق" : "Continue Shopping"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs rounded-xl text-destructive/60 hover:text-destructive"
                  onClick={() => cart.clearCart()}
                >
                  <Trash2 className="me-1 h-3 w-3" />
                  {isAr ? "إفراغ" : "Clear"}
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
});
