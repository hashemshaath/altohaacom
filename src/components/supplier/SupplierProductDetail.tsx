import { memo, useState, useMemo, forwardRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Package, ShoppingCart, ArrowLeft, CheckCircle, XCircle,
  Minus, Plus, Truck, Shield, RotateCcw, Tag, Box, Ruler,
  Share2, Heart, ExternalLink, Flame, CreditCard, Info,
  ListChecks, FileText, ChevronRight, Star, Award, Copy,
  MessageSquare, ChevronDown, ChevronUp, ThumbsUp, Clock,
  Zap, BadgeCheck, ShieldCheck, Sparkles, Users, HelpCircle,
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
type InfoTab = "description" | "specs" | "shipping" | "reviews" | "qa";

function parseDescription(text: string) {
  if (!text) return [];
  const lines = text.split("\n").filter(Boolean);
  const sections: { type: "heading" | "bullet" | "text"; content: string }[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^[✅📦📐🍽️💡🏷️⚡🔧]/.test(trimmed)) {
      sections.push({ type: "heading", content: trimmed });
    } else if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
      sections.push({ type: "bullet", content: trimmed.replace(/^[•\-]\s*/, "") });
    } else {
      sections.push({ type: "text", content: trimmed });
    }
  }
  return sections;
}

// Simulated chef reviews
const CHEF_REVIEWS = [
  { name: "شيف أحمد المطيري", name_en: "Chef Ahmed Al-Mutairi", role_ar: "شيف محترف - فنادق 5 نجوم", role_en: "Professional Chef - 5 Star Hotels", rating: 5, comment_ar: "جودة ممتازة وأداء احترافي، أستخدمه يومياً في مطبخي", comment_en: "Excellent quality and professional performance, I use it daily", avatar: "👨‍🍳", verified: true, date: "2025-03-15" },
  { name: "شيف نورة العتيبي", name_en: "Chef Noura Al-Otaibi", role_ar: "خبيرة حلويات", role_en: "Pastry Expert", rating: 4, comment_ar: "منتج رائع بسعر مناسب، أنصح به لكل الطهاة", comment_en: "Great product at a fair price, recommend for all chefs", avatar: "👩‍🍳", verified: true, date: "2025-02-28" },
  { name: "شيف محمد الدوسري", name_en: "Chef Mohammed Al-Dosari", role_ar: "مدرب طبخ معتمد", role_en: "Certified Cooking Trainer", rating: 5, comment_ar: "من أفضل المنتجات التي استخدمتها، جودة تصنيع عالية", comment_en: "One of the best products I've used, high manufacturing quality", avatar: "👨‍🍳", verified: true, date: "2025-01-10" },
];

const QA_DATA = [
  { q_ar: "هل المنتج يأتي مع ضمان؟", q_en: "Does the product come with warranty?", a_ar: "نعم، ضمان سنتين من الشركة المصنعة يشمل عيوب التصنيع", a_en: "Yes, 2-year manufacturer warranty covering manufacturing defects", by_ar: "فريق قصر الأواني", by_en: "Qasr Al-Awani Team", votes: 24 },
  { q_ar: "هل متاح توصيل لجميع المناطق؟", q_en: "Is delivery available to all regions?", a_ar: "نعم، نوصل لجميع مناطق المملكة خلال 1-3 أيام عمل", a_en: "Yes, we deliver to all regions within 1-3 business days", by_ar: "خدمة العملاء", by_en: "Customer Service", votes: 18 },
  { q_ar: "هل يمكن الدفع عند الاستلام؟", q_en: "Is cash on delivery available?", a_ar: "نعم، متاح الدفع عند الاستلام بدون رسوم إضافية", a_en: "Yes, COD is available with no extra charges", by_ar: "فريق المبيعات", by_en: "Sales Team", votes: 31 },
];

const TRUST_MARKS = [
  { icon: ShieldCheck, en: "Authorized Dealer", ar: "موزع معتمد", color: "text-chart-5" },
  { icon: BadgeCheck, en: "100% Original", ar: "أصلي 100%", color: "text-primary" },
  { icon: Award, en: "Top Seller 2025", ar: "الأكثر مبيعاً 2025", color: "text-amber-500" },
  { icon: Users, en: "500+ Buyers", ar: "+500 مشتري", color: "text-blue-500" },
];

export const SupplierProductDetail = memo(forwardRef<HTMLDivElement, SupplierProductDetailProps>(function SupplierProductDetail({
  product, relatedProducts = [], onBack, onAddToCart, onViewProduct, companyName,
}, ref) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [qty, setQty] = useState(1);
  const [isFav, setIsFav] = useState(false);
  const [infoTab, setInfoTab] = useState<InfoTab>("description");
  const [couponCopied, setCouponCopied] = useState(false);
  const [expandedQA, setExpandedQA] = useState<number | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const title = product ? (isAr && product.name_ar ? product.name_ar : product.name) : "";
  const desc = product ? (isAr && product.description_ar ? product.description_ar : product.description) : "";
  const price = product?.unit_price || 0;
  const priceWithVat = Math.round(price * (1 + VAT_RATE));
  const totalPrice = price * qty;
  const totalWithVat = Math.round(totalPrice * (1 + VAT_RATE));
  const isInStock = product?.in_stock !== false;
  const stockQty = product?.quantity_available;

  const descSections = useMemo(() => parseDescription(desc || ""), [desc]);

  if (!product) return null;

  const originalPrice = Math.round(price * 1.2);
  const hasDiscount = originalPrice > price && price > 0;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const installment = price > 0 ? Math.ceil(priceWithVat / 4) : 0;
  const platformPrice = Math.round(price * 0.92); // exclusive platform price
  const platformPriceVat = Math.round(platformPrice * 1.15);

  const subtitle = descSections.find(s => s.type === "text" && !s.content.startsWith("🏷️"))?.content || "";

  // Rating stats
  const avgRating = 4.7;
  const totalReviews = CHEF_REVIEWS.length;
  const ratingBreakdown = [
    { stars: 5, pct: 70 },
    { stars: 4, pct: 20 },
    { stars: 3, pct: 7 },
    { stars: 2, pct: 2 },
    { stars: 1, pct: 1 },
  ];

  const COUPON_CODE = "QASR2025";
  const WARRANTY_YEARS = 2;

  const specs = [
    product.category && { label: isAr ? "الفئة" : "Category", value: product.category, icon: Tag },
    product.subcategory && { label: isAr ? "الفئة الفرعية" : "Subcategory", value: product.subcategory, icon: Tag },
    product.sku && { label: "SKU", value: product.sku, icon: Box },
    product.unit && { label: isAr ? "الوحدة" : "Unit", value: product.unit, icon: Ruler },
    stockQty && { label: isAr ? "الكمية المتوفرة" : "Available", value: stockQty.toString(), icon: Package },
    { label: isAr ? "الضمان" : "Warranty", value: isAr ? `${WARRANTY_YEARS} سنوات` : `${WARRANTY_YEARS} Years`, icon: Shield },
  ].filter(Boolean) as { label: string; value: string; icon: any }[];

  const handleShare = async () => {
    try {
      await navigator.share({ title, url: window.location.href });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const copyCoupon = () => {
    navigator.clipboard.writeText(COUPON_CODE);
    setCouponCopied(true);
    setTimeout(() => setCouponCopied(false), 2000);
  };

  const INFO_TABS: { key: InfoTab; icon: React.ElementType; en: string; ar: string; count?: number }[] = [
    { key: "description", icon: FileText, en: "Description", ar: "الوصف" },
    { key: "specs", icon: ListChecks, en: "Specs", ar: "المواصفات" },
    { key: "reviews", icon: Star, en: "Reviews", ar: "التقييمات", count: totalReviews },
    { key: "qa", icon: HelpCircle, en: "Q&A", ar: "أسئلة وأجوبة", count: QA_DATA.length },
    { key: "shipping", icon: Truck, en: "Shipping", ar: "الشحن" },
  ];

  const renderStars = (rating: number, size = "h-3.5 w-3.5") =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className={cn(size, i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20")} />
    ));

  return (
    <div ref={ref} className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="rounded-xl gap-2 text-muted-foreground hover:text-foreground active:scale-[0.98]" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          {isAr ? "العودة للمنتجات" : "Back to Products"}
        </Button>
        <div className="flex gap-1.5">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-destructive/10" onClick={() => setIsFav(!isFav)}>
            <Heart className={cn("h-4 w-4 transition-colors", isFav ? "fill-destructive text-destructive" : "text-muted-foreground")} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Image */}
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted/10 border border-border/15">
            {product.image_url ? (
              <img src={product.image_url} alt={title} className="h-full w-full object-contain p-6" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Package className="h-20 w-20 text-muted-foreground/10" />
              </div>
            )}
            {hasDiscount && (
              <div className="absolute top-3 start-3">
                <Badge className="bg-destructive text-white font-bold text-xs px-2.5 py-1 rounded-xl shadow-md gap-1">
                  <Flame className="h-3.5 w-3.5" />
                  {isAr ? `خصم ${discountPercent}%` : `${discountPercent}% OFF`}
                </Badge>
              </div>
            )}
            {!isInStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                <Badge variant="destructive" className="px-4 py-2 text-sm font-bold">{isAr ? "نفد المخزون" : "Out of Stock"}</Badge>
              </div>
            )}
            {/* Rating overlay */}
            <div className="absolute bottom-3 start-3 flex items-center gap-1.5 bg-background/80 backdrop-blur-md rounded-xl px-2.5 py-1.5 border border-border/20">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold">{avgRating}</span>
              <span className="text-[10px] text-muted-foreground">({totalReviews})</span>
            </div>
          </div>

          {/* Trust Marks Row */}
          <div className="grid grid-cols-4 gap-1.5">
            {TRUST_MARKS.map(({ icon: Icon, en, ar, color }) => (
              <div key={en} className="flex flex-col items-center gap-0.5 rounded-xl bg-muted/20 border border-border/10 p-2 text-center">
                <Icon className={cn("h-4 w-4", color)} />
                <span className="text-[9px] font-medium leading-tight">{isAr ? ar : en}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-4">
          {/* Category + Title */}
          <div>
            {product.category && (
              <Badge variant="outline" className="text-[11px] font-bold uppercase tracking-widest mb-2 rounded-lg border-primary/20 bg-primary/5 text-primary/80">
                {product.category}
              </Badge>
            )}
            <h1 className="text-xl sm:text-2xl font-bold leading-tight">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{subtitle}</p>}
            {companyName && (
              <p className="text-xs text-muted-foreground/70 mt-1 flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                {isAr ? "بواسطة" : "by"} <span className="font-medium text-foreground/80">{companyName}</span>
              </p>
            )}
            {/* Inline rating */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex">{renderStars(Math.round(avgRating), "h-3.5 w-3.5")}</div>
              <span className="text-sm font-bold">{avgRating}</span>
              <span className="text-xs text-muted-foreground">({totalReviews} {isAr ? "تقييم" : "reviews"})</span>
            </div>
          </div>

          {/* Price card */}
          <Card className="rounded-2xl border-primary/10 overflow-hidden">
            <CardContent className="p-4 space-y-2.5">
              {price > 0 ? (
                <>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-3xl font-black text-primary tracking-tight">{price.toFixed(0)}</span>
                    <span className="text-base text-muted-foreground font-medium">{product.currency || "SAR"}</span>
                    {hasDiscount && <span className="text-base text-muted-foreground/50 line-through">{originalPrice}</span>}
                    {hasDiscount && <Badge className="bg-destructive/10 text-destructive border-0 text-xs font-bold">−{discountPercent}%</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {priceWithVat.toFixed(0)} {product.currency || "SAR"} <span className="text-xs">{isAr ? "شامل ضريبة القيمة المضافة 15%" : "incl. 15% VAT"}</span>
                  </p>

                  {/* Platform Exclusive Price */}
                  <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/15 p-2.5">
                    <Sparkles className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-primary">{isAr ? "سعر المنصة الحصري" : "Exclusive Platform Price"}</p>
                      <p className="text-sm font-black text-primary">{platformPrice} <span className="text-xs font-normal text-muted-foreground">({platformPriceVat} {isAr ? "شامل الضريبة" : "incl. VAT"})</span></p>
                    </div>
                    <Badge className="bg-primary text-primary-foreground text-[10px] font-bold shrink-0">
                      {isAr ? "وفر" : "Save"} {price - platformPrice} {product.currency || "SAR"}
                    </Badge>
                  </div>

                  {/* Installments */}
                  {installment > 0 && (
                    <div className="flex items-center gap-2 rounded-xl bg-muted/30 p-2.5 text-xs">
                      <CreditCard className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-muted-foreground">
                        {isAr ? `قسّمها على 4 دفعات بقيمة ${installment} ر.س بدون فوائد` : `Split into 4 payments of ${installment} SAR interest-free`}
                      </span>
                    </div>
                  )}

                  {qty > 1 && (
                    <div className="pt-1.5 border-t border-primary/10">
                      <p className="text-sm font-semibold">
                        {isAr ? "الإجمالي:" : "Total:"} {totalPrice.toFixed(0)} {product.currency || "SAR"}
                        <span className="text-xs text-muted-foreground ms-1">({totalWithVat.toFixed(0)} {isAr ? "شامل الضريبة" : "incl. VAT"})</span>
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-base text-muted-foreground">{isAr ? "تواصل معنا للحصول على السعر" : "Contact us for pricing"}</p>
              )}
            </CardContent>
          </Card>

          {/* Exclusive Coupon */}
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3">
            <Tag className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold">{isAr ? "كود خصم حصري" : "Exclusive Discount Code"}</p>
              <p className="text-[10px] text-muted-foreground">{isAr ? "خصم إضافي 8% عند استخدام الكود" : "Extra 8% off with this code"}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg gap-1.5 text-xs font-bold border-primary/30 hover:bg-primary/10 shrink-0"
              onClick={copyCoupon}
            >
              {couponCopied ? <CheckCircle className="h-3.5 w-3.5 text-chart-5" /> : <Copy className="h-3.5 w-3.5" />}
              {couponCopied ? (isAr ? "تم النسخ!" : "Copied!") : COUPON_CODE}
            </Button>
          </div>

          {/* Warranty Badge */}
          <div className="flex items-center gap-3 rounded-xl bg-muted/20 border border-border/10 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-5/10">
              <Shield className="h-5 w-5 text-chart-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">{isAr ? `ضمان ${WARRANTY_YEARS} سنوات` : `${WARRANTY_YEARS}-Year Warranty`}</p>
              <p className="text-[10px] text-muted-foreground">{isAr ? "ضمان شامل ضد عيوب التصنيع مع خدمة صيانة مجانية" : "Comprehensive warranty against defects with free maintenance"}</p>
            </div>
            <Badge variant="outline" className="border-chart-5/30 text-chart-5 text-[10px] font-bold shrink-0">
              <Clock className="h-3 w-3 me-1" />{isAr ? "ساري" : "Active"}
            </Badge>
          </div>

          {/* Stock */}
          <div className="flex items-center gap-3">
            {isInStock ? (
              <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20 gap-1.5 py-1 px-3 rounded-xl">
                <CheckCircle className="h-3.5 w-3.5" />
                {isAr ? "متوفر" : "In Stock"}
                {stockQty && stockQty > 0 && <span className="font-normal opacity-70">({stockQty})</span>}
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1.5 py-1 px-3 rounded-xl">
                <XCircle className="h-3.5 w-3.5" />{isAr ? "غير متوفر" : "Unavailable"}
              </Badge>
            )}
            {isInStock && stockQty && stockQty <= 5 && (
              <span className="text-xs text-destructive font-bold animate-pulse">{isAr ? `باقي ${stockQty} فقط!` : `Only ${stockQty} left!`}</span>
            )}
          </div>

          {/* Quantity + Cart */}
          {onAddToCart && price > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-border/30 rounded-xl overflow-hidden bg-muted/20">
                <Button variant="ghost" size="icon" className="h-11 w-11 rounded-none active:scale-95" disabled={qty <= 1} onClick={() => setQty(Math.max(1, qty - 1))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center text-sm font-bold tabular-nums select-none">{qty}</span>
                <Button variant="ghost" size="icon" className="h-11 w-11 rounded-none active:scale-95" disabled={stockQty ? qty >= stockQty : false} onClick={() => setQty(qty + 1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button size="lg" disabled={!isInStock} onClick={() => onAddToCart(product, qty)} className="flex-1 h-11 rounded-xl font-bold gap-2 shadow-md shadow-primary/15 active:scale-[0.98] transition-all">
                <ShoppingCart className="h-4 w-4" />
                {isAr ? "أضف إلى السلة" : "Add to Cart"}
              </Button>
            </div>
          )}

          {/* Quick Trust */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Truck, en: "Fast Delivery", ar: "توصيل سريع", sub_en: "Within 24h", sub_ar: "خلال 24 ساعة" },
              { icon: Shield, en: "Guaranteed", ar: "منتج مضمون", sub_en: "Original product", sub_ar: "منتج أصلي" },
              { icon: RotateCcw, en: "Free Returns", ar: "إرجاع مجاني", sub_en: "Within 7 days", sub_ar: "خلال 7 أيام" },
            ].map(({ icon: Icon, en, ar, sub_en, sub_ar }) => (
              <div key={en} className="flex flex-col items-center gap-0.5 rounded-xl bg-muted/20 border border-border/10 p-2.5 text-center">
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-[11px] font-medium">{isAr ? ar : en}</span>
                <span className="text-[9px] text-muted-foreground/60">{isAr ? sub_ar : sub_en}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info Tabs */}
      <div>
        <div className="flex gap-0.5 border-b border-border/20 mb-4 overflow-x-auto scrollbar-none">
          {INFO_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = infoTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setInfoTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors touch-manipulation whitespace-nowrap",
                  isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {isAr ? tab.ar : tab.en}
                {tab.count !== undefined && (
                  <span className={cn("text-[10px] rounded-full px-1.5 py-0.5 font-bold", isActive ? "bg-primary/10" : "bg-muted/40")}>{tab.count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Description tab */}
        {infoTab === "description" && descSections.length > 0 && (
          <Card className="rounded-2xl border-border/15">
            <CardContent className="p-4 sm:p-5 space-y-2.5">
              {descSections.map((section, idx) => {
                if (section.type === "heading") {
                  return <h3 key={idx} className="text-sm font-bold text-foreground pt-3 first:pt-0 flex items-center gap-1.5 border-t border-border/10 first:border-0">{section.content}</h3>;
                }
                if (section.type === "bullet") {
                  return (
                    <div key={idx} className="flex items-start gap-2.5 text-sm text-muted-foreground ps-1">
                      <ChevronRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      <span className="leading-relaxed">{section.content}</span>
                    </div>
                  );
                }
                return <p key={idx} className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>;
              })}
            </CardContent>
          </Card>
        )}

        {/* Specs tab */}
        {infoTab === "specs" && (
          <Card className="rounded-2xl border-border/15">
            <CardContent className="p-0 divide-y divide-border/10">
              {specs.map((spec, idx) => (
                <div key={spec.label} className={cn("flex items-center gap-3 px-4 py-3.5", idx % 2 === 0 && "bg-muted/15")}>
                  <spec.icon className="h-4 w-4 text-primary/60 shrink-0" />
                  <span className="text-sm text-muted-foreground">{spec.label}</span>
                  <span className="ms-auto text-sm font-medium">{spec.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Reviews tab */}
        {infoTab === "reviews" && (
          <div className="space-y-4">
            {/* Rating Summary */}
            <Card className="rounded-2xl border-border/15">
              <CardContent className="p-4 sm:p-5">
                <div className="flex gap-6 items-start flex-wrap">
                  <div className="text-center">
                    <p className="text-4xl font-black text-primary">{avgRating}</p>
                    <div className="flex justify-center my-1">{renderStars(Math.round(avgRating))}</div>
                    <p className="text-xs text-muted-foreground">{totalReviews} {isAr ? "تقييم" : "reviews"}</p>
                  </div>
                  <div className="flex-1 min-w-[180px] space-y-1.5">
                    {ratingBreakdown.map(({ stars, pct }) => (
                      <div key={stars} className="flex items-center gap-2">
                        <span className="text-xs w-3 text-end font-medium">{stars}</span>
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <Progress value={pct} className="h-2 flex-1" />
                        <span className="text-[10px] text-muted-foreground w-8">{pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chef Pro Badge */}
            <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
              <Award className="h-5 w-5 text-amber-500 shrink-0" />
              <div>
                <p className="text-sm font-bold">{isAr ? "تقييمات الطهاة المحترفين" : "Professional Chef Reviews"}</p>
                <p className="text-[10px] text-muted-foreground">{isAr ? "تقييمات موثقة من طهاة محترفين معتمدين" : "Verified reviews from certified professional chefs"}</p>
              </div>
            </div>

            {/* Reviews list */}
            {(showAllReviews ? CHEF_REVIEWS : CHEF_REVIEWS.slice(0, 2)).map((review, idx) => (
              <Card key={idx} className="rounded-2xl border-border/15">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{review.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold">{isAr ? review.name : review.name_en}</span>
                        {review.verified && (
                          <Badge className="bg-chart-5/10 text-chart-5 border-0 text-[9px] gap-0.5 py-0 px-1.5">
                            <BadgeCheck className="h-3 w-3" />{isAr ? "موثق" : "Verified"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{isAr ? review.role_ar : review.role_en}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex">{renderStars(review.rating, "h-3 w-3")}</div>
                        <span className="text-[10px] text-muted-foreground">{review.date}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{isAr ? review.comment_ar : review.comment_en}</p>
                      <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs gap-1 text-muted-foreground hover:text-primary rounded-lg">
                        <ThumbsUp className="h-3 w-3" />{isAr ? "مفيد" : "Helpful"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {CHEF_REVIEWS.length > 2 && (
              <Button variant="outline" className="w-full rounded-xl" onClick={() => setShowAllReviews(!showAllReviews)}>
                {showAllReviews
                  ? (isAr ? "عرض أقل" : "Show Less")
                  : (isAr ? `عرض الكل (${CHEF_REVIEWS.length})` : `View All (${CHEF_REVIEWS.length})`)}
                {showAllReviews ? <ChevronUp className="h-4 w-4 ms-1" /> : <ChevronDown className="h-4 w-4 ms-1" />}
              </Button>
            )}
          </div>
        )}

        {/* Q&A tab */}
        {infoTab === "qa" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold">{isAr ? "أسئلة وأجوبة العملاء" : "Customer Questions & Answers"}</span>
            </div>
            {QA_DATA.map((item, idx) => (
              <Card key={idx} className="rounded-2xl border-border/15 overflow-hidden">
                <CardContent className="p-0">
                  <button
                    onClick={() => setExpandedQA(expandedQA === idx ? null : idx)}
                    className="w-full flex items-center gap-3 p-4 text-start hover:bg-muted/10 transition-colors"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">س</span>
                    <span className="flex-1 text-sm font-medium">{isAr ? item.q_ar : item.q_en}</span>
                    {expandedQA === idx ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </button>
                  {expandedQA === idx && (
                    <div className="px-4 pb-4 border-t border-border/10">
                      <div className="flex items-start gap-3 mt-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-chart-5/10 text-chart-5 text-xs font-bold">ج</span>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground leading-relaxed">{isAr ? item.a_ar : item.a_en}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px] text-muted-foreground/60">— {isAr ? item.by_ar : item.by_en}</span>
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-muted-foreground rounded-lg px-2">
                              <ThumbsUp className="h-2.5 w-2.5" />{item.votes}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Shipping tab */}
        {infoTab === "shipping" && (
          <Card className="rounded-2xl border-border/15">
            <CardContent className="p-4 sm:p-5 space-y-4">
              {[
                { icon: Truck, title: isAr ? "سياسة الشحن" : "Shipping Policy", desc: isAr ? "شحن سريع خلال 24 ساعة لجميع المناطق. شحن مجاني للطلبات فوق 200 ر.س" : "Fast shipping within 24 hours. Free shipping on orders over 200 SAR" },
                { icon: RotateCcw, title: isAr ? "سياسة الإرجاع" : "Return Policy", desc: isAr ? "إمكانية الإرجاع خلال 7 أيام من الاستلام. المنتج يجب أن يكون بحالته الأصلية" : "Returns within 7 days. Product must be in original condition" },
                { icon: Shield, title: isAr ? "ضمان المنتج" : "Product Warranty", desc: isAr ? `ضمان ${WARRANTY_YEARS} سنوات شامل ضد عيوب التصنيع مع صيانة مجانية` : `${WARRANTY_YEARS}-year warranty against defects with free maintenance` },
              ].map(({ icon: Icon, title: t, desc: d }) => (
                <div key={t} className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{d}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
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
                <Card key={rp.id} className="rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all group" onClick={() => onViewProduct?.(rp)}>
                  <div className="aspect-square bg-muted/10 overflow-hidden">
                    {rp.image_url ? (
                      <img loading="lazy" src={rp.image_url} className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105" alt={rpTitle} />
                    ) : (
                      <div className="h-full flex items-center justify-center"><Package className="h-8 w-8 text-muted-foreground/15" /></div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <p className="font-medium text-sm truncate">{rpTitle}</p>
                    {rpPrice > 0 && (
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-sm font-bold text-primary">{rpPrice.toFixed(0)}</span>
                        <span className="text-[10px] text-muted-foreground">{rp.currency || "SAR"}</span>
                        <span className="text-[10px] text-muted-foreground/50 ms-1">({Math.round(rpPrice * 1.15)} {isAr ? "شامل الضريبة" : "incl. VAT"})</span>
                      </div>
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
}));
