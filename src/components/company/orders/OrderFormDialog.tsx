import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { OrderFormData, OrderItem, ORDER_CATEGORIES } from "./orderTypes";

interface OrderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: OrderFormData;
  setForm: (form: OrderFormData) => void;
  onSave: () => void;
  isPending: boolean;
  language: string;
}

export function OrderFormDialog({ open, onOpenChange, form, setForm, onSave, isPending, language }: OrderFormDialogProps) {
  const isAr = language === "ar";

  const updateItem = (index: number, field: keyof OrderItem, value: string | number) => {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: value };
    items[index].total = items[index].quantity * items[index].unit_price;
    setForm({ ...form, items });
  };

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { name: "", quantity: 1, unit: "", unit_price: 0, total: 0 }] });
  };

  const removeItem = (index: number) => {
    if (form.items.length <= 1) return;
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const subtotal = form.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isAr ? "طلب جديد" : "New Order"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{isAr ? "العنوان (إنجليزي)" : "Title (English)"} *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "العنوان (عربي)" : "Title (Arabic)"}</Label>
              <Input value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} dir="rtl" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{isAr ? "الاتجاه" : "Direction"} *</Label>
              <Select value={form.direction} onValueChange={(v) => setForm({ ...form, direction: v as "outgoing" | "incoming" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="outgoing">{isAr ? "صادر" : "Outgoing"}</SelectItem>
                  <SelectItem value="incoming">{isAr ? "وارد" : "Incoming"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "الفئة" : "Category"} *</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORDER_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{isAr ? c.ar : c.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "العملة" : "Currency"}</Label>
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["SAR", "USD", "EUR", "AED", "KWD"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{isAr ? "الوصف (إنجليزي)" : "Description"}</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "الوصف (عربي)" : "Description (Arabic)"}</Label>
              <Textarea value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} dir="rtl" rows={2} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{isAr ? "تاريخ التسليم" : "Delivery Date"}</Label>
              <Input type="date" value={form.delivery_date} onChange={(e) => setForm({ ...form, delivery_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "تاريخ الاستحقاق" : "Due Date"}</Label>
              <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
          </div>

          <Separator />

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">{isAr ? "البنود" : "Line Items"}</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="me-1 h-3 w-3" />{isAr ? "إضافة" : "Add"}
              </Button>
            </div>

            {form.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4 space-y-1">
                  {idx === 0 && <Label className="text-xs">{isAr ? "الصنف" : "Item"}</Label>}
                  <Input placeholder={isAr ? "اسم الصنف" : "Item name"} value={item.name} onChange={(e) => updateItem(idx, "name", e.target.value)} />
                </div>
                <div className="col-span-2 space-y-1">
                  {idx === 0 && <Label className="text-xs">{isAr ? "الكمية" : "Qty"}</Label>}
                  <Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))} />
                </div>
                <div className="col-span-2 space-y-1">
                  {idx === 0 && <Label className="text-xs">{isAr ? "الوحدة" : "Unit"}</Label>}
                  <Input placeholder="kg, pc..." value={item.unit || ""} onChange={(e) => updateItem(idx, "unit", e.target.value)} />
                </div>
                <div className="col-span-2 space-y-1">
                  {idx === 0 && <Label className="text-xs">{isAr ? "السعر" : "Price"}</Label>}
                  <Input type="number" min={0} step={0.01} value={item.unit_price} onChange={(e) => updateItem(idx, "unit_price", Number(e.target.value))} />
                </div>
                <div className="col-span-1 text-sm font-medium text-end pt-1">
                  {(item.quantity * item.unit_price).toLocaleString()}
                </div>
                <div className="col-span-1">
                  <Button variant="ghost" size="icon" onClick={() => removeItem(idx)} disabled={form.items.length <= 1}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-2">
              <p className="text-sm font-semibold">
                {isAr ? "الإجمالي:" : "Subtotal:"} {subtotal.toLocaleString()} {form.currency}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>{isAr ? "ملاحظات" : "Notes"}</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={onSave} disabled={!form.title || !form.category || isPending}>
              {isPending ? (isAr ? "جارٍ الحفظ..." : "Saving...") : (isAr ? "حفظ كمسودة" : "Save as Draft")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
