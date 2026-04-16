import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import {
  Package, CheckCircle, ChevronLeft, Truck, ShoppingBag, Ban, User,
} from "lucide-react";
import { getStatusLabel } from "./ordersAdminTypes";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

function TimelineItem({ label, date, color }: { label: string; date: string; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`h-2 w-2 rounded-full ${color}`} />
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{format(new Date(date), "yyyy-MM-dd HH:mm")}</p>
      </div>
    </div>
  );
}

interface ShopOrderDetailViewProps {
  shopOrderDetails: any;
  isAr: boolean;
  onBack: () => void;
  onUpdateStatus: (params: { id: string; status: string }) => void;
}

export function ShopOrderDetailView({ shopOrderDetails, isAr, onBack, onUpdateStatus }: ShopOrderDetailViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">{shopOrderDetails.order_number}</h1>
              <p className="text-muted-foreground">{shopOrderDetails.buyer_name || shopOrderDetails.buyer_email}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {shopOrderDetails.status === "pending" && (
            <Button size="sm" onClick={() => onUpdateStatus({ id: shopOrderDetails.id, status: "confirmed" })}>
              <CheckCircle className="h-4 w-4 me-1" />
              {isAr ? "تأكيد" : "Confirm"}
            </Button>
          )}
          {shopOrderDetails.status === "confirmed" && (
            <Button size="sm" onClick={() => onUpdateStatus({ id: shopOrderDetails.id, status: "processing" })}>
              <Package className="h-4 w-4 me-1" />
              {isAr ? "معالجة" : "Process"}
            </Button>
          )}
          {shopOrderDetails.status === "processing" && (
            <Button size="sm" onClick={() => onUpdateStatus({ id: shopOrderDetails.id, status: "shipped" })}>
              <Truck className="h-4 w-4 me-1" />
              {isAr ? "شحن" : "Ship"}
            </Button>
          )}
          {shopOrderDetails.status === "shipped" && (
            <Button size="sm" onClick={() => onUpdateStatus({ id: shopOrderDetails.id, status: "delivered" })}>
              <CheckCircle className="h-4 w-4 me-1" />
              {isAr ? "تم التوصيل" : "Delivered"}
            </Button>
          )}
          {!["cancelled", "refunded", "delivered"].includes(shopOrderDetails.status) && (
            <Button size="sm" variant="destructive" onClick={() => onUpdateStatus({ id: shopOrderDetails.id, status: "cancelled" })}>
              <Ban className="h-4 w-4 me-1" />
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{isAr ? "تفاصيل الطلب" : "Order Details"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{isAr ? "الحالة" : "Status"}</p>
                  <AdminStatusBadge status={shopOrderDetails.status} label={getStatusLabel(shopOrderDetails.status, isAr)} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{isAr ? "الدفع" : "Payment"}</p>
                  <Badge variant="outline">{getStatusLabel(shopOrderDetails.payment_status || "pending", isAr)}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{isAr ? "طريقة الدفع" : "Payment Method"}</p>
                  <p className="font-medium">{shopOrderDetails.payment_method || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{isAr ? "المبلغ" : "Total"}</p>
                  <p className="font-bold text-lg">{shopOrderDetails.currency} <AnimatedCounter value={Math.round(Number(shopOrderDetails.total_amount))} className="inline" format /></p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{isAr ? "المجموع الفرعي" : "Subtotal"}</p>
                  <p className="font-medium">{shopOrderDetails.currency} <AnimatedCounter value={Math.round(Number(shopOrderDetails.subtotal || 0))} className="inline" format /></p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{isAr ? "الضريبة" : "Tax"}</p>
                  <p className="font-medium">{shopOrderDetails.currency} <AnimatedCounter value={Math.round(Number(shopOrderDetails.tax_amount || 0))} className="inline" format /></p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{isAr ? "الخصم" : "Discount"}</p>
                  <p className="font-medium">{shopOrderDetails.currency} <AnimatedCounter value={Math.round(Number(shopOrderDetails.discount_amount || 0))} className="inline" format /></p>
                </div>
              </div>

              {shopOrderDetails.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{isAr ? "ملاحظات" : "Notes"}</p>
                    <p className="text-sm">{shopOrderDetails.notes}</p>
                  </div>
                </>
              )}

              {/* Products */}
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2">{isAr ? "المنتجات" : "Products"}</p>
                <div className="space-y-3">
                  {shopOrderDetails.shop_order_items?.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                        {item.shop_products?.image_url ? (
                          <img src={item.shop_products.image_url} alt={item.shop_products.title || "Product"} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <ShoppingBag className="h-5 w-5 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">
                          {isAr ? item.shop_products?.title_ar || item.shop_products?.title : item.shop_products?.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × {shopOrderDetails.currency} {Number(item.unit_price).toFixed(2)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold">
                        {shopOrderDetails.currency} {Number(item.total_price).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Buyer info sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{isAr ? "معلومات المشتري" : "Buyer Info"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{shopOrderDetails.buyer_name || (isAr ? "غير محدد" : "N/A")}</p>
                  <p className="text-sm text-muted-foreground">{shopOrderDetails.buyer_email || "-"}</p>
                </div>
              </div>
              {shopOrderDetails.shipping_address && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{isAr ? "عنوان الشحن" : "Shipping Address"}</p>
                  <p className="text-sm">{typeof shopOrderDetails.shipping_address === "string" ? shopOrderDetails.shipping_address : JSON.stringify(shopOrderDetails.shipping_address)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{isAr ? "الجدول الزمني" : "Timeline"}</CardTitle>
            </CardHeader>
            <CardContent>
              <TimelineItem label={isAr ? "تم الإنشاء" : "Created"} date={shopOrderDetails.created_at} color="bg-chart-5" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
