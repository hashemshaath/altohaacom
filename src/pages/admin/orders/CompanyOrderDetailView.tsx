import { useState } from "react";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import {
  Package, Eye, CheckCircle, XCircle, ChevronLeft, Send, MessageSquare,
  Truck, Building2, Edit, Trash2, FileText, Save,
} from "lucide-react";
import { getStatusLabel, getCategoryLabel } from "./ordersAdminTypes";
import type { OrderStatus } from "./ordersAdminTypes";

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

function InternalNotesCard({ notes, onSave, isAr }: { notes: string; onSave: (n: string) => void; isAr: boolean }) {
  const [value, setValue] = useState(notes);
  const [editing, setEditing] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {isAr ? "ملاحظات داخلية" : "Internal Notes"}
          </CardTitle>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Edit className="h-4 w-4 me-1" />
              {isAr ? "تعديل" : "Edit"}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setEditing(false); setValue(notes); }}>
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button size="sm" onClick={() => { onSave(value); setEditing(false); }}>
                <Save className="h-4 w-4 me-1" />
                {isAr ? "حفظ" : "Save"}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <Textarea value={value} onChange={(e) => setValue(e.target.value)} rows={4} placeholder={isAr ? "ملاحظات مرئية للمسؤولين فقط..." : "Notes visible to admins only..."} />
        ) : (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes || (isAr ? "لا توجد ملاحظات" : "No internal notes")}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface CompanyOrderDetailViewProps {
  orderDetails: any;
  communications: any[];
  isAr: boolean;
  onBack: () => void;
  onEdit: (order: any) => void;
  onUpdateStatus: (params: { id: string; status: OrderStatus; reason?: string }) => void;
  onDelete: (id: string) => void;
  onSaveInternalNotes: (params: { id: string; notes: string }) => void;
  onSendMessage: () => void;
  newMessage: string;
  onNewMessageChange: (val: string) => void;
  showRejectDialog: boolean;
  onShowRejectDialog: (show: boolean) => void;
  rejectionReason: string;
  onRejectionReasonChange: (val: string) => void;
}

export function CompanyOrderDetailView({
  orderDetails, communications, isAr, onBack, onEdit, onUpdateStatus,
  onDelete, onSaveInternalNotes, onSendMessage, newMessage, onNewMessageChange,
  showRejectDialog, onShowRejectDialog, rejectionReason, onRejectionReasonChange,
}: CompanyOrderDetailViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">{orderDetails.order_number}</h1>
              <p className="text-muted-foreground">{orderDetails.title}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(orderDetails)}>
            <Edit className="h-4 w-4 me-1" />
            {isAr ? "تعديل" : "Edit"}
          </Button>
          {orderDetails.status === "pending" && (
            <>
              <Button size="sm" onClick={() => onUpdateStatus({ id: orderDetails.id, status: "approved" })}>
                <CheckCircle className="h-4 w-4 me-1" />
                {isAr ? "اعتماد" : "Approve"}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onShowRejectDialog(true)}>
                <XCircle className="h-4 w-4 me-1" />
                {isAr ? "رفض" : "Reject"}
              </Button>
            </>
          )}
          {orderDetails.status === "approved" && (
            <Button size="sm" onClick={() => onUpdateStatus({ id: orderDetails.id, status: "in_progress" })}>
              <Truck className="h-4 w-4 me-1" />
              {isAr ? "بدء التنفيذ" : "Start Processing"}
            </Button>
          )}
          {orderDetails.status === "in_progress" && (
            <Button size="sm" onClick={() => onUpdateStatus({ id: orderDetails.id, status: "completed" })}>
              <CheckCircle className="h-4 w-4 me-1" />
              {isAr ? "إكمال" : "Complete"}
            </Button>
          )}
          {["draft", "pending"].includes(orderDetails.status) && (
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => {
              if (confirm(isAr ? "هل أنت متأكد من الحذف؟" : "Delete this order?")) {
                onDelete(orderDetails.id);
              }
            }}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Rejection dialog */}
      {showRejectDialog && (
        <Card className="border-destructive">
          <CardContent className="pt-4 space-y-3">
            <Label>{isAr ? "سبب الرفض" : "Rejection Reason"}</Label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => onRejectionReasonChange(e.target.value)}
              placeholder={isAr ? "أدخل سبب الرفض..." : "Enter rejection reason..."}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => onShowRejectDialog(false)}>
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button variant="destructive" size="sm" onClick={() =>
                onUpdateStatus({ id: orderDetails.id, status: "rejected", reason: rejectionReason })
              }>
                {isAr ? "تأكيد الرفض" : "Confirm Reject"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>{isAr ? "تفاصيل الطلب" : "Order Details"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{isAr ? "الحالة" : "Status"}</p>
                  <AdminStatusBadge status={orderDetails.status} label={getStatusLabel(orderDetails.status, isAr)} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{isAr ? "الاتجاه" : "Direction"}</p>
                  <Badge variant={orderDetails.direction === "incoming" ? "default" : "secondary"}>
                    {orderDetails.direction === "incoming" ? (isAr ? "وارد" : "Incoming") : (isAr ? "صادر" : "Outgoing")}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{isAr ? "الفئة" : "Category"}</p>
                  <p className="font-medium">{getCategoryLabel(orderDetails.category, isAr)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{isAr ? "المبلغ" : "Amount"}</p>
                  <p className="font-bold text-lg"><AnimatedCounter value={Math.round(Number(orderDetails.total_amount))} className="inline" format /> {orderDetails.currency}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{isAr ? "المجموع الفرعي" : "Subtotal"}</p>
                  <p className="font-medium"><AnimatedCounter value={Math.round(Number(orderDetails.subtotal || 0))} className="inline" format /> {orderDetails.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{isAr ? "الضريبة" : "Tax"}</p>
                  <p className="font-medium"><AnimatedCounter value={Math.round(Number(orderDetails.tax_amount || 0))} className="inline" format /> {orderDetails.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{isAr ? "الخصم" : "Discount"}</p>
                  <p className="font-medium"><AnimatedCounter value={Math.round(Number(orderDetails.discount_amount || 0))} className="inline" format /> {orderDetails.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{isAr ? "تاريخ الطلب" : "Order Date"}</p>
                  <p className="font-medium">{orderDetails.order_date}</p>
                </div>
              </div>

              {(orderDetails.delivery_date || orderDetails.due_date) && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    {orderDetails.delivery_date && (
                      <div>
                        <p className="text-sm text-muted-foreground">{isAr ? "تاريخ التسليم" : "Delivery Date"}</p>
                        <p className="font-medium">{orderDetails.delivery_date}</p>
                      </div>
                    )}
                    {orderDetails.due_date && (
                      <div>
                        <p className="text-sm text-muted-foreground">{isAr ? "تاريخ الاستحقاق" : "Due Date"}</p>
                        <p className="font-medium">{orderDetails.due_date}</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {orderDetails.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{isAr ? "الوصف" : "Description"}</p>
                    <p>{orderDetails.description}</p>
                  </div>
                </>
              )}

              {orderDetails.rejection_reason && (
                <>
                  <Separator />
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                    <p className="text-sm font-medium text-destructive mb-1">{isAr ? "سبب الرفض" : "Rejection Reason"}</p>
                    <p className="text-sm">{orderDetails.rejection_reason}</p>
                  </div>
                </>
              )}

              {orderDetails.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{isAr ? "ملاحظات" : "Notes"}</p>
                    <p className="text-sm">{orderDetails.notes}</p>
                  </div>
                </>
              )}

              {/* Items table */}
              {orderDetails.items && Array.isArray(orderDetails.items) && orderDetails.items.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{isAr ? "العناصر" : "Items"}</p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{isAr ? "الصنف" : "Item"}</TableHead>
                          <TableHead>{isAr ? "الكمية" : "Qty"}</TableHead>
                          <TableHead>{isAr ? "السعر" : "Price"}</TableHead>
                          <TableHead>{isAr ? "المجموع" : "Total"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(orderDetails.items as any[]).map((item: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.price}</TableCell>
                            <TableCell><AnimatedCounter value={Math.round(item.quantity * item.price)} className="inline" format /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Internal Notes */}
          <InternalNotesCard
            notes={orderDetails.internal_notes || ""}
            onSave={(notes) => onSaveInternalNotes({ id: orderDetails.id, notes })}
            isAr={isAr}
          />

          {/* Communications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {isAr ? "المراسلات" : "Communications"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] mb-4">
                <div className="space-y-4">
                  {communications.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender_type === "admin" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-xl p-3 ${
                        msg.sender_type === "admin" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}>
                        <p>{msg.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {format(new Date(msg.created_at), "yyyy-MM-dd HH:mm")}
                        </p>
                      </div>
                    </div>
                  ))}
                  {communications.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      {isAr ? "لا توجد رسائل" : "No messages yet"}
                    </p>
                  )}
                </div>
              </ScrollArea>
              <div className="flex gap-2">
                <Input
                  placeholder={isAr ? "اكتب رسالة..." : "Type a message..."}
                  value={newMessage}
                  onChange={(e) => onNewMessageChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onSendMessage()}
                />
                <Button onClick={onSendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{isAr ? "معلومات الشركة" : "Company Info"}</CardTitle>
            </CardHeader>
            <CardContent>
              {orderDetails.companies && (
                <div className="flex items-center gap-3">
                  {orderDetails.companies.logo_url ? (
                    <img src={orderDetails.companies.logo_url} alt="Company logo" className="h-12 w-12 rounded-xl object-cover" loading="lazy" />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{orderDetails.companies.name}</p>
                    {orderDetails.companies.email && <p className="text-sm text-muted-foreground">{orderDetails.companies.email}</p>}
                    {orderDetails.companies.phone && <p className="text-sm text-muted-foreground">{orderDetails.companies.phone}</p>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{isAr ? "الجدول الزمني" : "Timeline"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <TimelineItem label={isAr ? "تم الإنشاء" : "Created"} date={orderDetails.created_at} color="bg-chart-5" />
                {orderDetails.approved_at && <TimelineItem label={isAr ? "تم الاعتماد" : "Approved"} date={orderDetails.approved_at} color="bg-chart-1" />}
                {orderDetails.rejected_at && <TimelineItem label={isAr ? "تم الرفض" : "Rejected"} date={orderDetails.rejected_at} color="bg-destructive" />}
                {orderDetails.completed_at && <TimelineItem label={isAr ? "مكتمل" : "Completed"} date={orderDetails.completed_at} color="bg-chart-5" />}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
