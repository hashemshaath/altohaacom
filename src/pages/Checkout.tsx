import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currencyFormatter";
import { ArrowLeft, ShoppingBag, MapPin, CreditCard, CheckCircle, Package, Loader2, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["cart", "address", "payment", "confirm"] as const;
type Step = typeof STEPS[number];

const PAYMENT_METHODS = [
  { id: "card", labelEn: "Credit / Debit Card", labelAr: "بطاقة ائتمانية / مدينة", icon: "💳" },
  { id: "apple_pay", labelEn: "Apple Pay", labelAr: "آبل باي", icon: "🍎" },
  { id: "bank_transfer", labelEn: "Bank Transfer", labelAr: "تحويل بنكي", icon: "🏦" },
  { id: "cash_on_delivery", labelEn: "Cash on Delivery", labelAr: "الدفع عند الاستلام", icon: "💵" },
];

const COUNTRIES = [
  { code: "SA", en: "Saudi Arabia", ar: "المملكة العربية السعودية" },
  { code: "AE", en: "UAE", ar: "الإمارات" },
  { code: "KW", en: "Kuwait", ar: "الكويت" },
  { code: "QA", en: "Qatar", ar: "قطر" },
  { code: "BH", en: "Bahrain", ar: "البحرين" },
  { code: "OM", en: "Oman", ar: "عُمان" },
  { code: "EG", en: "Egypt", ar: "مصر" },
  { code: "JO", en: "Jordan", ar: "الأردن" },
  { code: "LB", en: "Lebanon", ar: "لبنان" },
];

export default function Checkout() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const cart = useCart();

  const [step, setStep] = useState<Step>("cart");
  const [isPlacing, setIsPlacing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<{ id: string; order_number: string } | null>(null);

  const [address, setAddress] = useState({
    full_name: "",
    phone: "",
    country: "SA",
    city: "",
    district: "",
    street: "",
    building: "",
    postal_code: "",
    notes: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("card");

  const stepIndex = STEPS.indexOf(step);

  const fieldLabel = (en: string, ar: string) => (isAr ? ar : en);

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
          payment_method: paymentMethod,
          payment_status: "pending",
          shipping_address: address as any,
          notes: address.notes || null,
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
        product_snapshot: { title: item.title, title_ar: item.title_ar, image_url: item.image_url },
      }));

      const { error: itemsError } = await supabase.from("shop_order_items").insert(items);
      if (itemsError) throw itemsError;

      cart.clearCart();
      setCompletedOrder(order);
      setStep("confirm");
    } catch (error: any) {
      toast({ title: isAr ? "خطأ في تقديم الطلب" : "Order failed", description: error.message, variant: "destructive" });
    } finally {
      setIsPlacing(false);
    }
  };

  // ── Step indicator ────────────────────────────────────────────────────────
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[
        { key: "cart", en: "Cart", ar: "السلة", icon: ShoppingBag },
        { key: "address", en: "Address", ar: "العنوان", icon: MapPin },
        { key: "payment", en: "Payment", ar: "الدفع", icon: CreditCard },
        { key: "confirm", en: "Confirmed", ar: "مؤكد", icon: CheckCircle },
      ].map((s, i) => {
        const isCurrent = s.key === step;
        const isDone = STEPS.indexOf(s.key as Step) < stepIndex;
        return (
          <div key={s.key} className="flex items-center gap-2">
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all",
              isDone ? "bg-primary text-primary-foreground" :
              isCurrent ? "bg-primary/15 text-primary ring-2 ring-primary/30" :
              "bg-muted text-muted-foreground"
            )}>
              {isDone ? <CheckCircle className="h-4 w-4" /> : <s.icon className="h-3.5 w-3.5" />}
            </div>
            <span className={cn("text-xs font-medium hidden sm:inline", isCurrent ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground")}>
              {isAr ? s.ar : s.en}
            </span>
            {i < 3 && <div className={cn("h-px w-6 sm:w-10", isDone ? "bg-primary" : "bg-border")} />}
          </div>
        );
      })}
    </div>
  );

  // ── Order Summary sidebar ─────────────────────────────────────────────────
  const OrderSummary = () => (
    <Card className="border-border/50 sticky top-20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          {isAr ? "ملخص الطلب" : "Order Summary"}
          <Badge variant="secondary">{cart.totalItems}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2.5 max-h-48 overflow-y-auto">
          {cart.items.map((item) => {
            const title = isAr && item.title_ar ? item.title_ar : item.title;
            return (
              <div key={item.product_id} className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl overflow-hidden bg-muted shrink-0">
                  {item.image_url
                    ? <img src={item.image_url} alt={title} className="h-full w-full object-cover" />
                    : <div className="h-full w-full flex items-center justify-center"><ShoppingBag className="h-4 w-4 text-muted-foreground/30" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{title}</p>
                  <p className="text-[10px] text-muted-foreground">x{item.quantity}</p>
                </div>
                <p className="text-xs font-semibold shrink-0">{formatCurrency(item.price * item.quantity, language as "en" | "ar")}</p>
              </div>
            );
          })}
        </div>
        <Separator />
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>{isAr ? "المجموع الفرعي" : "Subtotal"}</span>
            <span>{formatCurrency(cart.subtotal, language as "en" | "ar")}</span>
          </div>
          {cart.taxAmount > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>{isAr ? "الضريبة (15%)" : "Tax (15%)"}</span>
              <span>{formatCurrency(cart.taxAmount, language as "en" | "ar")}</span>
            </div>
          )}
          {cart.discountAmount > 0 && (
            <div className="flex justify-between text-chart-5">
              <span className="flex items-center gap-1"><Tag className="h-3 w-3" />{isAr ? "خصم" : "Discount"}</span>
              <span>-{formatCurrency(cart.discountAmount, language as "en" | "ar")}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-bold text-base">
            <span>{isAr ? "الإجمالي" : "Total"}</span>
            <span className="text-primary">{formatCurrency(cart.totalPrice, language as "en" | "ar")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // ── Step: Cart review ─────────────────────────────────────────────────────
  if (step === "cart") {
    return (
      <div className="flex min-h-screen flex-col">
        <SEOHead title={isAr ? "الدفع" : "Checkout"} description="Complete your order" />
        <Header />
        <main className="container flex-1 py-6 md:py-10">
          <Button variant="ghost" size="sm" asChild className="mb-6 -ms-2">
            <Link to="/shop"><ArrowLeft className="me-1.5 h-4 w-4" />{isAr ? "العودة للمتجر" : "Back to Shop"}</Link>
          </Button>
          <StepIndicator />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <h2 className="font-semibold text-lg">{isAr ? "مراجعة الطلب" : "Review Your Order"}</h2>
              {cart.items.length === 0 ? (
                <Card><CardContent className="flex flex-col items-center py-12 text-center">
                  <ShoppingBag className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="font-medium text-muted-foreground">{isAr ? "السلة فارغة" : "Your cart is empty"}</p>
                  <Button className="mt-4" asChild><Link to="/shop">{isAr ? "تسوق الآن" : "Shop Now"}</Link></Button>
                </CardContent></Card>
              ) : (
                <div className="space-y-3">
                  {cart.items.map((item) => {
                    const title = isAr && item.title_ar ? item.title_ar : item.title;
                    return (
                      <Card key={item.product_id} className="border-border/50">
                        <CardContent className="flex items-center gap-3 p-4">
                          <div className="h-16 w-16 rounded-xl overflow-hidden bg-muted shrink-0">
                            {item.image_url ? <img src={item.image_url} alt={title} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center"><ShoppingBag className="h-6 w-6 text-muted-foreground/30" /></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{title}</p>
                            <p className="text-sm text-muted-foreground">{isAr ? "الكمية:" : "Qty:"} {item.quantity}</p>
                          </div>
                          <p className="font-bold text-primary shrink-0">{formatCurrency(item.price * item.quantity, language as "en" | "ar")}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                  <Button className="w-full mt-2" size="lg" onClick={() => setStep("address")} disabled={cart.items.length === 0}>
                    {isAr ? "المتابعة لإدخال العنوان" : "Continue to Address"} →
                  </Button>
                </div>
              )}
            </div>
            <OrderSummary />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Step: Shipping address ────────────────────────────────────────────────
  if (step === "address") {
    const isValid = address.full_name && address.phone && address.city && address.street;
    return (
      <div className="flex min-h-screen flex-col">
        <SEOHead title={isAr ? "عنوان التوصيل" : "Shipping Address"} description="Enter your shipping address" />
        <Header />
        <main className="container flex-1 py-6 md:py-10">
          <Button variant="ghost" size="sm" className="mb-6 -ms-2" onClick={() => setStep("cart")}>
            <ArrowLeft className="me-1.5 h-4 w-4" />{isAr ? "رجوع" : "Back"}
          </Button>
          <StepIndicator />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-4 w-4 text-primary" />
                    {isAr ? "عنوان التوصيل" : "Shipping Address"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">{fieldLabel("Full Name", "الاسم الكامل")} *</Label>
                      <Input value={address.full_name} onChange={e => setAddress(a => ({ ...a, full_name: e.target.value }))} placeholder={fieldLabel("John Doe", "محمد أحمد")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{fieldLabel("Phone", "رقم الهاتف")} *</Label>
                      <Input value={address.phone} onChange={e => setAddress(a => ({ ...a, phone: e.target.value }))} placeholder="+966 5X XXX XXXX" type="tel" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{fieldLabel("Country", "الدولة")} *</Label>
                      <Select value={address.country} onValueChange={v => setAddress(a => ({ ...a, country: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{isAr ? c.ar : c.en}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{fieldLabel("City", "المدينة")} *</Label>
                      <Input value={address.city} onChange={e => setAddress(a => ({ ...a, city: e.target.value }))} placeholder={fieldLabel("Riyadh", "الرياض")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{fieldLabel("District / Area", "الحي")}</Label>
                      <Input value={address.district} onChange={e => setAddress(a => ({ ...a, district: e.target.value }))} placeholder={fieldLabel("Al Olaya", "العليا")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{fieldLabel("Street", "الشارع")} *</Label>
                      <Input value={address.street} onChange={e => setAddress(a => ({ ...a, street: e.target.value }))} placeholder={fieldLabel("King Fahd Road", "طريق الملك فهد")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{fieldLabel("Building / Apt No.", "رقم المبنى / الشقة")}</Label>
                      <Input value={address.building} onChange={e => setAddress(a => ({ ...a, building: e.target.value }))} placeholder="12B" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{fieldLabel("Postal Code", "الرمز البريدي")}</Label>
                      <Input value={address.postal_code} onChange={e => setAddress(a => ({ ...a, postal_code: e.target.value }))} placeholder="12345" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{fieldLabel("Delivery Notes (Optional)", "ملاحظات التوصيل (اختياري)")}</Label>
                    <Input value={address.notes} onChange={e => setAddress(a => ({ ...a, notes: e.target.value }))} placeholder={fieldLabel("Ring doorbell, leave at door...", "اترك عند الباب...")} />
                  </div>
                  <Button className="w-full" size="lg" onClick={() => setStep("payment")} disabled={!isValid}>
                    {isAr ? "المتابعة لطريقة الدفع" : "Continue to Payment"} →
                  </Button>
                </CardContent>
              </Card>
            </div>
            <OrderSummary />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Step: Payment method ──────────────────────────────────────────────────
  if (step === "payment") {
    return (
      <div className="flex min-h-screen flex-col">
        <SEOHead title={isAr ? "طريقة الدفع" : "Payment Method"} description="Choose your payment method" />
        <Header />
        <main className="container flex-1 py-6 md:py-10">
          <Button variant="ghost" size="sm" className="mb-6 -ms-2" onClick={() => setStep("address")}>
            <ArrowLeft className="me-1.5 h-4 w-4" />{isAr ? "رجوع" : "Back"}
          </Button>
          <StepIndicator />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="h-4 w-4 text-primary" />
                    {isAr ? "طريقة الدفع" : "Payment Method"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {PAYMENT_METHODS.map(pm => (
                    <button
                      key={pm.id}
                      onClick={() => setPaymentMethod(pm.id)}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-xl border-2 p-4 text-start transition-all",
                        paymentMethod === pm.id ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"
                      )}
                    >
                      <span className="text-2xl">{pm.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{isAr ? pm.labelAr : pm.labelEn}</p>
                      </div>
                      <div className={cn("h-4 w-4 rounded-full border-2 transition-all", paymentMethod === pm.id ? "border-primary bg-primary" : "border-muted-foreground/30")} />
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Delivery address recap */}
              <Card className="border-border/40 bg-muted/20">
                <CardContent className="flex items-start gap-3 p-4">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">{address.full_name}</p>
                    <p className="text-muted-foreground">{[address.street, address.district, address.city, address.country].filter(Boolean).join(", ")}</p>
                    <p className="text-muted-foreground">{address.phone}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="ms-auto shrink-0 text-xs" onClick={() => setStep("address")}>{isAr ? "تعديل" : "Edit"}</Button>
                </CardContent>
              </Card>

              <Button className="w-full shadow-lg shadow-primary/20" size="lg" onClick={handlePlaceOrder} disabled={isPlacing}>
                {isPlacing ? <><Loader2 className="me-2 h-4 w-4 animate-spin" />{isAr ? "جارٍ الطلب..." : "Placing order..."}</> : (isAr ? `تأكيد الطلب — ${formatCurrency(cart.totalPrice, language as "en" | "ar")}` : `Place Order — ${formatCurrency(cart.totalPrice, language as "en" | "ar")}`)}
              </Button>
            </div>
            <OrderSummary />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Step: Order confirmed ─────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead title={isAr ? "تم تأكيد الطلب" : "Order Confirmed"} description="Your order has been placed" />
      <Header />
      <main className="container flex-1 flex items-center justify-center py-16">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 ring-8 ring-primary/5">
            <CheckCircle className="h-12 w-12 text-primary" />
          </div>
          <h1 className="font-serif text-2xl font-bold mb-2">{isAr ? "تم تأكيد طلبك! 🎉" : "Order Confirmed! 🎉"}</h1>
          <p className="text-muted-foreground mb-2">
            {isAr ? "شكراً لتسوقك معنا. سنتواصل معك قريباً لتأكيد التوصيل." : "Thank you for your purchase. We'll contact you to confirm delivery."}
          </p>
          {completedOrder && (
            <Badge variant="outline" className="text-sm mb-6 px-4 py-1.5">
              {isAr ? `رقم الطلب: ${completedOrder.order_number}` : `Order #${completedOrder.order_number}`}
            </Badge>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link to="/shop/orders">{isAr ? "عرض طلباتي" : "View My Orders"}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/shop">{isAr ? "مواصلة التسوق" : "Continue Shopping"}</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
