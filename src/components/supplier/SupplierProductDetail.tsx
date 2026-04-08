import { memo, useState, useMemo, forwardRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useProductQA, useProductTrustBadges } from "@/hooks/useProductDetailData";
import { useContentReviews, useContentReviewStats } from "@/hooks/useContentReviews";
import {
  Package, ShoppingCart, ArrowLeft, CheckCircle, XCircle,
  Minus, Plus, Truck, Shield, RotateCcw, Tag, Box, Ruler,
  Share2, Heart, ExternalLink, Flame, CreditCard, Info,
  ListChecks, FileText, ChevronRight, Star, Award, Copy,
  MessageSquare, ChevronDown, ChevronUp, ThumbsUp, Clock,
  BadgeCheck, ShieldCheck, Sparkles, Users, HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SupplierProductDetailProps {
  product: any;
  relatedProducts?: any[];
  onBack: () => void;
  onAddToCart?: (product: any, qty: number) => void;
  onViewProduct?: (product: any) => void;
  companyName?: string;
  companyId?: string;
}

const VAT_RATE = 0.15;
type InfoTab = "description" | "specs" | "shipping" | "reviews" | "qa";

function parseDescription(text: string) {
  if (!text) return [];
  return text.split("\n").filter(Boolean).map(line => {
    const trimmed = line.trim();
    if (!trimmed) return null;
    if (/^[✅📦📐🍽️💡🏷️⚡🔧]/.test(trimmed)) return { type: "heading" as const, content: trimmed };
    if (trimmed.startsWith("•") || trimmed.startsWith("-")) return { type: "bullet" as const, content: trimmed.replace(/^[•\-]\s*/, "") };
    return { type: "text" as const, content: trimmed };
  }).filter(Boolean) as { type: "heading" | "bullet" | "text"; content: string }[];
}

const ICON_MAP: Record<string, React.ElementType> = {
  ShieldCheck, BadgeCheck, Award, Users, Shield, Star, CheckCircle, Truck,
};

export const SupplierProductDetail = memo(forwardRef<HTMLDivElement, SupplierProductDetailProps>(function SupplierProductDetail({
  product, relatedProducts = [], onBack, onAddToCart, onViewProduct, companyName, companyId,
}, ref) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [qty, setQty] = useState(1);
  const [isFav, setIsFav] = useState(false);
  const [infoTab, setInfoTab] = useState<InfoTab>("description");
  const [couponCopied, setCouponCopied] = useState(false);
  const [expandedQA, setExpandedQA] = useState<number | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Real data hooks
  const { data: qaItems = [] } = useProductQA(product?.id);
  const { data: trustBadges = [] } = useProductTrustBadges(companyId, product?.id);
  const { data: reviews = [] } = useContentReviews("catalog_item", product?.id || "");
  const reviewStats = useContentReviewStats("catalog_item", product?.id || "");

  const title = product ? (isAr && product.name_ar ? product.name_ar : product.name) : "";
  const desc = product ? (isAr && product.description_ar ? product.description_ar : product.description) : "";
  const price = product?.unit_price || 0;
  const priceWithVat = Math.round(price * (1 + VAT_RATE));
  const totalWithVat = Math.round(price * qty * (1 + VAT_RATE));
  const isInStock = product?.in_stock !== false;
  const stockQty = product?.quantity_available;
  const currencyLabel = isAr ? "ر.س" : "SAR";

  const descSections = useMemo(() => parseDescription(desc || ""), [desc]);

  // Build rating breakdown from real data
  const ratingBreakdown = useMemo(() => {
    if (reviews.length === 0) return [
      { stars: 5, pct: 0 }, { stars: 4, pct: 0 }, { stars: 3, pct: 0 }, { stars: 2, pct: 0 }, { stars: 1, pct: 0 },
    ];
    return [5, 4, 3, 2, 1].map(stars => ({
      stars,
      pct: Math.round((reviews.filter(r => r.rating === stars).length / reviews.length) * 100),
    }));
  }, [reviews]);

  if (!product) return null;

  // Use real DB fields for pricing
  const origPrice = product.original_price || Math.round(price * 1.2);
  const originalPriceVat = Math.round(origPrice * (1 + VAT_RATE));
  const hasDiscount = originalPriceVat > priceWithVat && price > 0;
  const discountPercent = hasDiscount ? Math.round(((originalPriceVat - priceWithVat) / originalPriceVat) * 100) : 0;
  const installment = priceWithVat > 0 ? Math.ceil(priceWithVat / 4) : 0;

  const platformDiscountPct = product.platform_discount_pct || 0;
  const platformPriceVat = platformDiscountPct > 0
    ? Math.round(price * (1 - platformDiscountPct / 100) * (1 + VAT_RATE))
    : 0;

  const couponCode = product.coupon_code || "";
  const couponDiscountPct = product.coupon_discount_pct || 0;
  const warrantyYears = product.warranty_years || 0;

  const subtitle = descSections.find(s => s.type === "text" && !s.content.startsWith("🏷️"))?.content || "";

  const avgRating = reviewStats.avg || 0;
  const totalReviews = reviewStats.count || 0;

  const specs = [
    product.category && { label: isAr ? "الفئة" : "Category", value: product.category, icon: Tag },
    product.subcategory && { label: isAr ? "الفئة الفرعية" : "Subcategory", value: product.subcategory, icon: Tag },
    product.sku && { label: "SKU", value: product.sku, icon: Box },
    product.unit && { label: isAr ? "الوحدة" : "Unit", value: product.unit, icon: Ruler },
    stockQty && { label: isAr ? "الكمية المتوفرة" : "Available", value: stockQty.toString(), icon: Package },
    warrantyYears > 0 && { label: isAr ? "الضمان" : "Warranty", value: isAr ? `${warrantyYears} سنوات` : `${warrantyYears} Years`, icon: Shield },
  ].filter(Boolean) as { label: string; value: string; icon: any }[];

  const handleShare = async () => {
    try { await navigator.share({ title, url: window.location.href }); } catch { await navigator.clipboard.writeText(window.location.href); }
  };

  const copyCoupon = () => {
    if (!couponCode) return;
    navigator.clipboard.writeText(couponCode);
    setCouponCopied(true);
    setTimeout(() => setCouponCopied(false), 2000);
  };

  const INFO_TABS: { key: InfoTab; icon: React.ElementType; en: string; ar: string; count?: number }[] = [
    { key: "description", icon: FileText, en: "Description", ar: "الوصف" },
    { key: "specs", icon: ListChecks, en: "Specs", ar: "المواصفات" },
    { key: "reviews", icon: Star, en: "Reviews", ar: "التقييمات", count: totalReviews },
    { key: "qa", icon: HelpCircle, en: "Q&A", ar: "أسئلة وأجوبة", count: qaItems.length },
    { key: "shipping", icon: Truck, en: "Shipping", ar: "الشحن" },
  ];

  const renderStars = (rating: number, size = "h-3.5 w-3.5") =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className={cn(size, i < rating ? "fill-chart-4 text-chart-4" : "text-muted-foreground/20")} />
    ));

  return (
    <div ref={ref} className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="rounded-xl gap-2 text-muted-foreground hover:text-foreground active:scale-[0.98]" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          {isAr ? "العودة للمنتجات" : "Back to Products"}
        </Button>
        <div className="flex gap-1.5">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-destructive/10" onClick={() => setIsFav(!isFav)}>
            <Heart className={cn("h-4 w-4 transition-colors", isFav ? "fill-destructive text-destructive" : "text-muted-foreground")} />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image Section */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/20">
            {product.image_url ? (
              <img src={product.image_url} alt={title} className="h-full w-full object-contain p-8" />
            ) : (
              <div className="flex h-full items-center justify-center"><Package className="h-20 w-20 text-muted-foreground/10" /></div>
            )}
            {hasDiscount && (
              <div className="absolute top-3 start-3">
                <Badge className="bg-destructive text-destructive-foreground font-bold text-xs px-2.5 py-1 rounded-xl shadow-md gap-1">
                  <Flame className="h-3.5 w-3.5" />{isAr ? `خصم ${discountPercent}%` : `${discountPercent}% OFF`}
                </Badge>
              </div>
            )}
            {!isInStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                <Badge variant="destructive" className="px-4 py-2 text-sm font-bold">{isAr ? "نفد المخزون" : "Out of Stock"}</Badge>
              </div>
            )}
            {totalReviews > 0 && (
              <div className="absolute bottom-3 start-3 flex items-center gap-1.5 bg-card/90 backdrop-blur-md rounded-xl px-3 py-1.5 border border-border/20 shadow-sm">
                <Star className="h-4 w-4 fill-chart-4 text-chart-4" />
                <span className="text-sm font-bold">{avgRating}</span>
                <span className="text-[11px] text-muted-foreground">({totalReviews})</span>
              </div>
            )}
          </div>

          {/* Trust Marks from DB */}
          {trustBadges.length > 0 && (
            <div className={cn("grid gap-2", trustBadges.length >= 4 ? "grid-cols-4" : `grid-cols-${trustBadges.length}`)}>
              {trustBadges.map(badge => {
                const IconComp = ICON_MAP[badge.icon_name || "ShieldCheck"] || ShieldCheck;
                return (
                  <div key={badge.id} className="flex flex-col items-center gap-1 rounded-xl bg-card border border-border/20 p-2.5 text-center shadow-sm">
                    <IconComp className={cn("h-4 w-4", badge.color_class || "text-primary")} />
                    <span className="text-[10px] font-semibold leading-tight">{isAr ? (badge.label_ar || badge.label) : badge.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="space-y-5">
          {/* Title Block */}
          <div className="space-y-2">
            {product.category && (
              <Badge variant="outline" className="text-[11px] font-bold uppercase tracking-widest rounded-lg border-primary/20 bg-primary/5 text-primary/80">
                {product.category}
              </Badge>
            )}
            <h1 className="text-xl sm:text-2xl font-bold leading-tight text-foreground">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground leading-relaxed">{subtitle}</p>}
            {companyName && (
              <p className="text-xs text-muted-foreground/70 flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                {isAr ? "بواسطة" : "by"} <span className="font-semibold text-foreground/80">{companyName}</span>
              </p>
            )}
            {totalReviews > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">{renderStars(Math.round(avgRating))}</div>
                <span className="text-sm font-bold text-foreground">{avgRating}</span>
                <span className="text-xs text-muted-foreground">({totalReviews} {isAr ? "تقييم" : "reviews"})</span>
              </div>
            )}
          </div>

          {/* Price Card - VAT inclusive */}
          <Card className="rounded-2xl border-primary/15 bg-gradient-to-br from-card to-primary/[0.02] overflow-hidden shadow-sm">
            <CardContent className="p-5 space-y-3">
              {price > 0 ? (
                <>
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-3xl font-black text-primary tracking-tight tabular-nums">{priceWithVat}</span>
                      <span className="text-sm font-medium text-muted-foreground">{currencyLabel}</span>
                      <Badge variant="outline" className="text-[10px] border-chart-5/30 text-chart-5 font-medium py-0">
                        {isAr ? "شامل الضريبة" : "VAT Included"}
                      </Badge>
                    </div>
                    {hasDiscount && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground/50 line-through tabular-nums">{originalPriceVat} {currencyLabel}</span>
                        <Badge className="bg-destructive/10 text-destructive border-0 text-[10px] font-bold">−{discountPercent}%</Badge>
                      </div>
                    )}
                    <p className="text-[11px] text-muted-foreground/60">
                      {isAr ? `السعر بدون الضريبة: ${price.toFixed(0)} ${currencyLabel}` : `Price excl. VAT: ${price.toFixed(0)} ${currencyLabel}`}
                    </p>
                  </div>

                  {/* Platform Exclusive Price */}
                  {platformPriceVat > 0 && platformPriceVat < priceWithVat && (
                    <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-primary/8 to-primary/3 border border-primary/15 p-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-primary">{isAr ? "سعر المنصة الحصري" : "Exclusive Platform Price"}</p>
                        <p className="text-base font-black text-primary tabular-nums">{platformPriceVat} <span className="text-xs font-normal text-muted-foreground">{currencyLabel} {isAr ? "شامل الضريبة" : "incl. VAT"}</span></p>
                      </div>
                      <Badge className="bg-primary text-primary-foreground text-[10px] font-bold shrink-0 rounded-lg">
                        {isAr ? "وفر" : "Save"} {priceWithVat - platformPriceVat} {currencyLabel}
                      </Badge>
                    </div>
                  )}

                  {installment > 0 && (
                    <div className="flex items-center gap-2.5 rounded-xl bg-muted/30 border border-border/10 p-3">
                      <CreditCard className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-xs text-muted-foreground leading-relaxed">
                        {isAr ? `قسّمها على 4 دفعات بقيمة ${installment} ${currencyLabel} بدون فوائد` : `Split into 4 payments of ${installment} ${currencyLabel} interest-free`}
                      </span>
                    </div>
                  )}

                  {qty > 1 && (
                    <div className="pt-2 border-t border-border/15">
                      <p className="text-sm font-bold text-foreground">
                        {isAr ? "الإجمالي:" : "Total:"} {totalWithVat} {currencyLabel}
                        <span className="text-xs text-muted-foreground font-normal ms-1">{isAr ? "شامل الضريبة" : "incl. VAT"}</span>
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-base text-muted-foreground">{isAr ? "تواصل معنا للحصول على السعر" : "Contact us for pricing"}</p>
              )}
            </CardContent>
          </Card>

          {/* Exclusive Coupon from DB */}
          {couponCode && (
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-primary/25 bg-primary/[0.03] p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Tag className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground">{isAr ? "كود خصم حصري" : "Exclusive Discount Code"}</p>
                <p className="text-[10px] text-muted-foreground">
                  {isAr ? `خصم إضافي ${couponDiscountPct}% عند استخدام الكود` : `Extra ${couponDiscountPct}% off with this code`}
                </p>
              </div>
              <Button variant="outline" size="sm" className="rounded-lg gap-1.5 text-xs font-bold border-primary/25 hover:bg-primary/10 shrink-0" onClick={copyCoupon}>
                {couponCopied ? <CheckCircle className="h-3.5 w-3.5 text-chart-5" /> : <Copy className="h-3.5 w-3.5" />}
                {couponCopied ? (isAr ? "تم النسخ!" : "Copied!") : couponCode}
              </Button>
            </div>
          )}

          {/* Warranty from DB */}
          {warrantyYears > 0 && (
            <div className="flex items-center gap-3 rounded-xl bg-card border border-border/20 p-3 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-5/10">
                <Shield className="h-5 w-5 text-chart-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{isAr ? `ضمان ${warrantyYears} سنوات` : `${warrantyYears}-Year Warranty`}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{isAr ? "ضمان شامل ضد عيوب التصنيع مع صيانة مجانية" : "Full warranty against defects with free maintenance"}</p>
              </div>
              <Badge variant="outline" className="border-chart-5/30 text-chart-5 text-[10px] font-bold shrink-0 rounded-lg">
                <Clock className="h-3 w-3 me-1" />{isAr ? "ساري" : "Active"}
              </Badge>
            </div>
          )}

          {/* Stock */}
          <div className="flex items-center gap-3">
            {isInStock ? (
              <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20 gap-1.5 py-1.5 px-3 rounded-xl text-xs">
                <CheckCircle className="h-3.5 w-3.5" />{isAr ? "متوفر" : "In Stock"}
                {stockQty && stockQty > 0 && <span className="font-normal opacity-70">({stockQty})</span>}
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1.5 py-1.5 px-3 rounded-xl text-xs">
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
              <div className="flex items-center border border-border/30 rounded-xl overflow-hidden bg-card shadow-sm">
                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-none active:scale-95" disabled={qty <= 1} onClick={() => setQty(Math.max(1, qty - 1))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center text-sm font-bold tabular-nums select-none border-x border-border/20">{qty}</span>
                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-none active:scale-95" disabled={stockQty ? qty >= stockQty : false} onClick={() => setQty(qty + 1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button size="lg" disabled={!isInStock} onClick={() => onAddToCart(product, qty)} className="flex-1 h-12 rounded-xl font-bold gap-2 shadow-md shadow-primary/15 active:scale-[0.98] transition-all text-sm">
                <ShoppingCart className="h-4 w-4" />{isAr ? "أضف إلى السلة" : "Add to Cart"}
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
              <div key={en} className="flex flex-col items-center gap-1 rounded-xl bg-card border border-border/20 p-3 text-center shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/8"><Icon className="h-4 w-4 text-primary" /></div>
                <span className="text-[11px] font-semibold text-foreground">{isAr ? ar : en}</span>
                <span className="text-[10px] text-muted-foreground">{isAr ? sub_ar : sub_en}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Tabs Section ─── */}
      <div className="space-y-5">
        <div className="flex gap-1 p-1 bg-muted/30 rounded-2xl border border-border/15 overflow-x-auto scrollbar-none">
          {INFO_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = infoTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setInfoTab(tab.key)} className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all touch-manipulation whitespace-nowrap flex-1 justify-center",
                isActive ? "bg-card text-primary shadow-sm border border-border/20" : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              )}>
                <Icon className="h-3.5 w-3.5" />{isAr ? tab.ar : tab.en}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={cn("text-[9px] rounded-full px-1.5 py-0.5 font-bold", isActive ? "bg-primary/10 text-primary" : "bg-muted/60")}>{tab.count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Description */}
        {infoTab === "description" && (
          <Card className="rounded-2xl border-border/15 shadow-sm">
            <CardContent className="p-5 sm:p-6 space-y-3">
              {descSections.length > 0 ? descSections.map((section, idx) => {
                if (section.type === "heading") return <h3 key={idx} className="text-sm font-bold text-foreground pt-3 first:pt-0 flex items-center gap-1.5 border-t border-border/10 first:border-0">{section.content}</h3>;
                if (section.type === "bullet") return (
                  <div key={idx} className="flex items-start gap-2.5 text-sm text-muted-foreground ps-1">
                    <ChevronRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /><span className="leading-relaxed">{section.content}</span>
                  </div>
                );
                return <p key={idx} className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>;
              }) : (
                <div className="py-8 text-center"><Info className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" /><p className="text-sm text-muted-foreground">{isAr ? "لا يوجد وصف" : "No description"}</p></div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Specs */}
        {infoTab === "specs" && (
          <Card className="rounded-2xl border-border/15 shadow-sm overflow-hidden">
            <CardContent className="p-0 divide-y divide-border/10">
              {specs.map((spec, idx) => (
                <div key={spec.label} className={cn("flex items-center gap-3 px-5 py-4", idx % 2 === 0 && "bg-muted/10")}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/8"><spec.icon className="h-4 w-4 text-primary/70" /></div>
                  <span className="text-sm text-muted-foreground">{spec.label}</span>
                  <span className="ms-auto text-sm font-semibold text-foreground">{spec.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Reviews from real content_reviews */}
        {infoTab === "reviews" && (
          <div className="space-y-4">
            <Card className="rounded-2xl border-border/15 shadow-sm">
              <CardContent className="p-5">
                <div className="flex gap-6 items-start flex-wrap">
                  <div className="text-center min-w-[80px]">
                    <p className="text-4xl font-black text-primary tabular-nums">{avgRating || "–"}</p>
                    <div className="flex justify-center my-1.5 gap-0.5">{renderStars(Math.round(avgRating))}</div>
                    <p className="text-xs text-muted-foreground">{totalReviews} {isAr ? "تقييم" : "reviews"}</p>
                  </div>
                  <div className="flex-1 min-w-[180px] space-y-2">
                    {ratingBreakdown.map(({ stars, pct }) => (
                      <div key={stars} className="flex items-center gap-2">
                        <span className="text-xs w-3 text-end font-medium text-muted-foreground">{stars}</span>
                        <Star className="h-3 w-3 fill-chart-4 text-chart-4" />
                        <Progress value={pct} className="h-2 flex-1" />
                        <span className="text-[10px] text-muted-foreground w-8 tabular-nums">{pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-2.5 rounded-xl bg-chart-4/10 border border-chart-4/20 p-3">
              <Award className="h-5 w-5 text-chart-4 shrink-0" />
              <div>
                <p className="text-sm font-bold text-foreground">{isAr ? "تقييمات الطهاة المحترفين" : "Professional Chef Reviews"}</p>
                <p className="text-[10px] text-muted-foreground">{isAr ? "تقييمات موثقة من طهاة محترفين معتمدين" : "Verified reviews from certified professional chefs"}</p>
              </div>
            </div>

            {reviews.length > 0 ? (
              <>
                {(showAllReviews ? reviews : reviews.slice(0, 3)).map((review) => (
                  <Card key={review.id} className="rounded-2xl border-border/15 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl shrink-0">👨‍🍳</div>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">{renderStars(review.rating, "h-3 w-3")}</div>
                            <span className="text-[10px] text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</span>
                          </div>
                          {review.content && <p className="text-sm text-muted-foreground leading-relaxed">{review.content}</p>}
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground hover:text-primary rounded-lg px-2">
                            <ThumbsUp className="h-3 w-3" />{isAr ? "مفيد" : "Helpful"} {review.helpful_count > 0 && `(${review.helpful_count})`}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {reviews.length > 3 && (
                  <Button variant="outline" className="w-full rounded-xl h-10" onClick={() => setShowAllReviews(!showAllReviews)}>
                    {showAllReviews ? (isAr ? "عرض أقل" : "Show Less") : (isAr ? `عرض الكل (${reviews.length})` : `View All (${reviews.length})`)}
                    {showAllReviews ? <ChevronUp className="h-4 w-4 ms-1" /> : <ChevronDown className="h-4 w-4 ms-1" />}
                  </Button>
                )}
              </>
            ) : (
              <div className="py-8 text-center">
                <Star className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{isAr ? "لا توجد تقييمات بعد" : "No reviews yet"}</p>
              </div>
            )}
          </div>
        )}

        {/* Q&A from real product_qa table */}
        {infoTab === "qa" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 mb-1">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-foreground">{isAr ? "أسئلة وأجوبة العملاء" : "Customer Questions & Answers"}</span>
            </div>
            {qaItems.length > 0 ? qaItems.map((item, idx) => (
              <Card key={item.id} className="rounded-2xl border-border/15 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  <button onClick={() => setExpandedQA(expandedQA === idx ? null : idx)} className="w-full flex items-center gap-3 p-4 text-start hover:bg-muted/10 transition-colors">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold">{isAr ? "س" : "Q"}</span>
                    <span className="flex-1 text-sm font-medium text-foreground leading-relaxed">{isAr ? (item.question_ar || item.question) : item.question}</span>
                    {expandedQA === idx ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </button>
                  {expandedQA === idx && item.answer && (
                    <div className="px-4 pb-4 border-t border-border/10">
                      <div className="flex items-start gap-3 mt-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-chart-5/10 text-chart-5 text-xs font-bold">{isAr ? "ج" : "A"}</span>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground leading-relaxed">{isAr ? (item.answer_ar || item.answer) : item.answer}</p>
                          <div className="flex items-center gap-3 mt-2">
                            {(item.answered_by || item.answered_by_ar) && (
                              <span className="text-[10px] text-muted-foreground/60">— {isAr ? (item.answered_by_ar || item.answered_by) : item.answered_by}</span>
                            )}
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-muted-foreground rounded-lg px-2">
                              <ThumbsUp className="h-2.5 w-2.5" />{item.helpful_count}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )) : (
              <div className="py-8 text-center">
                <HelpCircle className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{isAr ? "لا توجد أسئلة بعد" : "No questions yet"}</p>
              </div>
            )}
          </div>
        )}

        {/* Shipping */}
        {infoTab === "shipping" && (
          <Card className="rounded-2xl border-border/15 shadow-sm">
            <CardContent className="p-5 space-y-4">
              {[
                { icon: Truck, title: isAr ? "سياسة الشحن" : "Shipping Policy", desc: isAr ? "شحن سريع خلال 24 ساعة لجميع المناطق. شحن مجاني للطلبات فوق 200 ر.س" : "Fast shipping within 24 hours. Free shipping on orders over 200 SAR" },
                { icon: RotateCcw, title: isAr ? "سياسة الإرجاع" : "Return Policy", desc: isAr ? "إمكانية الإرجاع خلال 7 أيام. المنتج يجب أن يكون بحالته الأصلية" : "Returns within 7 days. Product must be in original condition" },
                ...(warrantyYears > 0 ? [{ icon: Shield, title: isAr ? "ضمان المنتج" : "Warranty", desc: isAr ? `ضمان ${warrantyYears} سنوات شامل ضد عيوب التصنيع` : `${warrantyYears}-year warranty against manufacturing defects` }] : []),
              ].map(({ icon: Icon, title: t, desc: d }) => (
                <div key={t} className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8"><Icon className="h-5 w-5 text-primary" /></div>
                  <div><p className="text-sm font-bold text-foreground">{t}</p><p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{d}</p></div>
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
          <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-foreground">
            <Package className="h-4 w-4 text-primary" />{isAr ? "منتجات ذات صلة" : "Related Products"}
          </h2>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.slice(0, 4).map((rp: any) => {
              const rpTitle = isAr && rp.name_ar ? rp.name_ar : rp.name;
              const rpPrice = rp.unit_price || 0;
              const rpPriceVat = Math.round(rpPrice * (1 + VAT_RATE));
              return (
                <Card key={rp.id} className="rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all group shadow-sm" onClick={() => onViewProduct?.(rp)}>
                  <div className="aspect-square bg-gradient-to-br from-muted/20 to-muted/5 overflow-hidden">
                    {rp.image_url ? <img loading="lazy" src={rp.image_url} className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105" alt={rpTitle} /> : <div className="h-full flex items-center justify-center"><Package className="h-8 w-8 text-muted-foreground/15" /></div>}
                  </div>
                  <CardContent className="p-3">
                    <p className="font-semibold text-sm truncate text-foreground">{rpTitle}</p>
                    {rpPrice > 0 && (
                      <div className="flex items-baseline gap-1 mt-1.5">
                        <span className="text-sm font-bold text-primary tabular-nums">{rpPriceVat}</span>
                        <span className="text-[10px] text-muted-foreground">{currencyLabel}</span>
                        <span className="text-[9px] text-muted-foreground/60 ms-0.5">{isAr ? "شامل الضريبة" : "incl. VAT"}</span>
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
