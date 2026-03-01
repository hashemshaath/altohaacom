import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Calendar, Truck, FileText, AlertTriangle } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { format } from "date-fns";
import { CompanyOrder, OrderItem, ORDER_CATEGORIES } from "./orderTypes";
import { OrderStatusBadge } from "./OrderStatusBadge";

interface OrderDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: CompanyOrder | null;
  language: string;
  onSubmit?: (orderId: string) => void;
  isSubmitting?: boolean;
}

export function OrderDetailDialog({ open, onOpenChange, order, language, onSubmit, isSubmitting }: OrderDetailDialogProps) {
  if (!order) return null;
  const isAr = language === "ar";
  const items = (order.items as OrderItem[] | null) || [];
  const catInfo = ORDER_CATEGORIES.find(c => c.value === order.category);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="font-mono text-sm text-muted-foreground">{order.order_number}</span>
            <OrderStatusBadge status={order.status} language={language} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Header Info */}
          <div>
            <h3 className="text-lg font-semibold">{order.title}</h3>
            {order.title_ar && <p className="text-sm text-muted-foreground" dir="rtl">{order.title_ar}</p>}
            {order.description && <p className="mt-2 text-sm text-muted-foreground">{order.description}</p>}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="capitalize">{order.direction === "outgoing" ? (isAr ? "صادر" : "Outgoing") : (isAr ? "وارد" : "Incoming")}</Badge>
            {catInfo && <Badge variant="secondary">{isAr ? catInfo.ar : catInfo.en}</Badge>}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{isAr ? "تاريخ الطلب" : "Order Date"}</p>
                <p className="font-medium">{order.order_date ? format(new Date(order.order_date), "MMM dd, yyyy") : "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{isAr ? "تاريخ التسليم" : "Delivery"}</p>
                <p className="font-medium">{order.delivery_date ? format(new Date(order.delivery_date), "MMM dd, yyyy") : "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{isAr ? "الاستحقاق" : "Due Date"}</p>
                <p className="font-medium">{order.due_date ? format(new Date(order.due_date), "MMM dd, yyyy") : "-"}</p>
              </div>
            </div>
          </div>

          {/* Rejection reason */}
          {order.status === "rejected" && order.rejection_reason && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">{isAr ? "سبب الرفض" : "Rejection Reason"}</p>
                <p className="text-muted-foreground">{order.rejection_reason}</p>
              </div>
            </div>
          )}

          <Separator />

          {/* Line Items */}
          {items.length > 0 && (
            <div>
              <h4 className="mb-2 font-semibold text-sm">{isAr ? "البنود" : "Line Items"}</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? "الصنف" : "Item"}</TableHead>
                    <TableHead className="text-center">{isAr ? "الكمية" : "Qty"}</TableHead>
                    <TableHead className="text-center">{isAr ? "الوحدة" : "Unit"}</TableHead>
                    <TableHead className="text-end">{isAr ? "السعر" : "Price"}</TableHead>
                    <TableHead className="text-end">{isAr ? "الإجمالي" : "Total"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-center">{item.unit || "-"}</TableCell>
                      <TableCell className="text-end"><AnimatedCounter value={Math.round(item.unit_price || 0)} /></TableCell>
                      <TableCell className="text-end font-medium"><AnimatedCounter value={Math.round(item.quantity * item.unit_price)} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Totals */}
          <div className="flex flex-col items-end gap-1 text-sm">
            {(order.subtotal ?? 0) > 0 && (
              <p><span className="text-muted-foreground">{isAr ? "المجموع الفرعي:" : "Subtotal:"}</span> <AnimatedCounter value={Math.round(order.subtotal || 0)} className="inline" /> {order.currency}</p>
            )}
            {(order.tax_amount ?? 0) > 0 && (
              <p><span className="text-muted-foreground">{isAr ? "الضريبة:" : "Tax:"}</span> <AnimatedCounter value={Math.round(order.tax_amount || 0)} className="inline" /> {order.currency}</p>
            )}
            {(order.discount_amount ?? 0) > 0 && (
              <p><span className="text-muted-foreground">{isAr ? "الخصم:" : "Discount:"}</span> -<AnimatedCounter value={Math.round(order.discount_amount || 0)} className="inline" /> {order.currency}</p>
            )}
            <p className="text-base font-bold">
              {isAr ? "الإجمالي:" : "Total:"} <AnimatedCounter value={Math.round(order.total_amount || 0)} className="inline" /> {order.currency || "SAR"}
            </p>
          </div>

          {/* Notes */}
          {order.notes && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">{isAr ? "ملاحظات" : "Notes"}</p>
                <p className="text-sm">{order.notes}</p>
              </div>
            </>
          )}

          {/* Submit action for draft orders */}
          {order.status === "draft" && onSubmit && (
            <div className="flex justify-end pt-2">
              <Button onClick={() => onSubmit(order.id)} disabled={isSubmitting}>
                {isSubmitting ? (isAr ? "جارٍ الإرسال..." : "Submitting...") : (isAr ? "إرسال للمراجعة" : "Submit for Review")}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
